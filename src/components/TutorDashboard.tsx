import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Bell, Users, Calendar, BookOpen, Plus, ChevronDown, CalendarClock, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { CreateSessionDialog, SessionData } from './CreateSessionDialog';
import { ManageSchedule } from './ManageSchedule';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationPolling } from '../hooks/useNotificationPolling';
import { classesApi, bookingsApi, notificationsApi, Class, Booking, Notification } from '../services/api';
import hcmutLogo from 'figma:asset/c0b1283c1762e2e406fe4ae60561b95a8304ce62.png';

interface ClassData {
  id: string;
  name: string;
  subject: string;
  schedule: string;
  bookedSlots: number;
  totalSlots: number;
  pendingBookings: number;
  students: Student[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  grade?: number;
  feedback?: string;
}

export function TutorDashboard({ onClassClick, onLogout }: { 
  onClassClick: (classId: string) => void;
  onLogout: () => void;
}) {
  const { user } = useAuth();
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [showScheduleView, setShowScheduleView] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Real-time notification polling
  const { 
    notifications: polledNotifications, 
    unreadCount, 
    markAsRead 
  } = useNotificationPolling({ enabled: true, pollingInterval: 10000 });
  
  // API state
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tutor's classes and bookings from API
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      setError(null);
      try {
        // Fetch classes for this tutor (pass userId, server will map to tutorId)
        const classesResponse = await classesApi.getAll({ tutorId: user.id });
        const apiClasses = classesResponse.data?.classes || [];

        // Fetch bookings (server filters by authenticated tutor)
        const bookingsResponse = await bookingsApi.getAll();
        const bookings = bookingsResponse.data?.bookings || [];

        // Transform API classes to ClassData format with pending booking counts
        const transformedClasses: ClassData[] = apiClasses.map((cls: Class) => {
          const pendingCount = bookings.filter(
            (b: Booking) => b.classId === cls.id && b.status === 'pending'
          ).length;
          const confirmedCount = bookings.filter(
            (b: Booking) => b.classId === cls.id && b.status === 'confirmed'
          ).length;

          return {
            id: cls.id,
            name: cls.name,
            subject: cls.subject,
            schedule: cls.schedule,
            bookedSlots: confirmedCount,
            totalSlots: cls.maxStudents,
            pendingBookings: pendingCount,
            students: []
          };
        });

        setClasses(transformedClasses);
      } catch (err) {
        console.error('Failed to fetch tutor data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  const totalPendingBookings = classes.reduce((sum, cls) => sum + cls.pendingBookings, 0);

  const handleCreateSession = async (sessionData: SessionData) => {
    if (!user?.id) return;
    
    try {
      const newClassData = {
        tutorId: user.id,
        name: sessionData.courseName,
        subject: sessionData.subject,
        schedule: `${sessionData.date} - ${sessionData.time}`,
        maxStudents: sessionData.maxStudents,
        description: sessionData.courseName
      };
      
      const response = await classesApi.create(newClassData);
      if (response.data) {
        const newClass: ClassData = {
          id: response.data.id,
          name: response.data.name,
          subject: response.data.subject,
          schedule: response.data.schedule,
          bookedSlots: 0,
          totalSlots: response.data.maxStudents,
          pendingBookings: 0,
          students: []
        };
        setClasses([...classes, newClass]);
      }
      setCreateSessionOpen(false);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  // Show schedule management view
  if (showScheduleView) {
    return <ManageSchedule 
      onBack={() => setShowScheduleView(false)} 
      onCreateSession={async (sessionData) => {
        if (!user?.id) return;
        
        try {
          const newClassData = {
            tutorId: user.id,
            name: `${sessionData.subject} - ${sessionData.major}`,
            subject: sessionData.major,
            schedule: sessionData.timeSlots.join(', '),
            maxStudents: parseInt(sessionData.numberOfStudents) || 30,
            description: `${sessionData.subject} - ${sessionData.major}`
          };
          
          const response = await classesApi.create(newClassData);
          if (response.data) {
            const newClass: ClassData = {
              id: response.data.id,
              name: response.data.name,
              subject: response.data.subject,
              schedule: response.data.schedule,
              bookedSlots: 0,
              totalSlots: response.data.maxStudents,
              pendingBookings: 0,
              students: []
            };
            setClasses([...classes, newClass]);
          }
          setShowScheduleView(false);
        } catch (err) {
          console.error('Failed to create class from schedule:', err);
        }
      }}
    />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" 
          style={{
            backgroundImage: 'linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <motion.div
        className="absolute top-20 left-10 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/30 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Header */}
      <header className="relative bg-white/70 backdrop-blur-xl border-b border-blue-200 sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img src={hcmutLogo} alt="HCMUT Logo" className="h-12 w-12" />
              </motion.div>
              <div>
                <h1 className="text-slate-800">Tutor Dashboard</h1>
                <p className="text-sm text-slate-600">HO CHI MINH UNIVERSITY OF TECHNOLOGY</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="relative bg-white/60 border-blue-200 hover:bg-blue-100/60 hover:border-blue-400"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-5 w-5 text-slate-700" />
                  {(totalPendingBookings + unreadCount) > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {totalPendingBookings + unreadCount > 9 ? '9+' : totalPendingBookings + unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 bg-white/80 backdrop-blur-xl border border-blue-200 rounded-lg shadow-2xl py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-blue-200">
                        <h3 className="text-slate-800">Notifications</h3>
                        <p className="text-xs text-slate-600">
                          {totalPendingBookings} pending requests • {unreadCount} unread
                        </p>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {polledNotifications.length > 0 ? polledNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-blue-50 transition-colors cursor-pointer border-b border-blue-200 ${!notification.read ? 'bg-blue-50/50' : ''}`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <p className="text-sm text-slate-800">{notification.message}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        )) : (
                          <div className="px-4 py-3 text-sm text-slate-500 text-center">
                            No notifications
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-2 border-t border-blue-200">
                        <button className="text-sm text-blue-600 hover:text-blue-700">
                          View all notifications
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* User Profile */}
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-blue-100/60 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center">
                    {user?.name?.charAt(0) || 'T'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm text-slate-800">{user?.name || 'Tutor'}</p>
                    <p className="text-xs text-slate-600">Tutor</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-600 hidden md:block" />
                </button>
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-blue-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-blue-200">
                      <p className="text-sm text-slate-800">{user?.name}</p>
                      <p className="text-xs text-slate-600">{user?.username}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-800 hover:bg-blue-100/60"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-slate-800 mb-2">Welcome back!</h2>
          <p className="text-slate-600">Manage your classes and student bookings</p>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/70 backdrop-blur-xl border-blue-200 hover:border-blue-400 transition-colors shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm text-slate-700">Total Classes</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-slate-800">{classes.length}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/70 backdrop-blur-xl border-blue-200 hover:border-blue-400 transition-colors shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm text-slate-700">Total Students</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-slate-800">
                  {classes.reduce((sum, cls) => sum + cls.bookedSlots, 0)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/70 backdrop-blur-xl border-blue-200 hover:border-red-400 transition-colors shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm text-slate-700">Pending Bookings</CardTitle>
                <Bell className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-red-600">{totalPendingBookings}</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Classes List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-800">My Classes</h3>
            <Button
              onClick={() => setShowScheduleView(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-indigo-600 text-white flex items-center gap-2"
            >
              <CalendarClock className="w-4 h-4" />
              Manage Schedule
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classes.map((classItem, index) => (
              <motion.div
                key={classItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card 
                  className="hover:shadow-2xl hover:shadow-blue-400/30 transition-shadow cursor-pointer bg-white/70 backdrop-blur-xl border-blue-200 hover:border-blue-400 shadow-lg"
                  onClick={() => onClassClick(classItem.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-slate-800">{classItem.name}</CardTitle>
                        <CardDescription className="mt-1">
                          <Badge variant="outline" className="mr-2 bg-blue-100 text-blue-700 border-blue-300">
                            {classItem.subject}
                          </Badge>
                        </CardDescription>
                      </div>
                      {classItem.pendingBookings > 0 && (
                        <Badge variant="destructive" className="ml-2 bg-red-100 text-red-700 border-red-300">
                          {classItem.pendingBookings} pending
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-slate-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {classItem.schedule}
                      </div>
                      
                      {/* Booking Progress */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-400">Enrollment</span>
                          <span className={`${
                            classItem.bookedSlots === classItem.totalSlots 
                              ? 'text-green-400' 
                              : 'text-blue-400'
                          }`}>
                            {classItem.bookedSlots}/{classItem.totalSlots}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              classItem.bookedSlots === classItem.totalSlots 
                                ? 'bg-gradient-to-r from-green-500 to-green-400' 
                                : 'bg-gradient-to-r from-blue-500 to-purple-500'
                            }`}
                            style={{ 
                              width: `${(classItem.bookedSlots / classItem.totalSlots) * 100}%` 
                            }}
                          />
                        </div>
                      </div>

                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-indigo-600 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClassClick(classItem.id);
                        }}
                      >
                        Manage Class
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Create Session Dialog */}
      <CreateSessionDialog
        open={createSessionOpen}
        onOpenChange={setCreateSessionOpen}
        onSubmit={handleCreateSession}
      />
    </div>
  );
}