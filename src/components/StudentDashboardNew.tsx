import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  User,
  FileText,
  Download,
  Award,
  ChevronDown,
  Search,
  GraduationCap,
  Star,
  Loader2,
  Bell,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { CancelBookingDialog } from './CancelBookingDialog';
import { TutorDetailDialog } from './TutorDetailDialog';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationPolling } from '../hooks/useNotificationPolling';
import hcmutLogo from 'figma:asset/c0b1283c1762e2e406fe4ae60561b95a8304ce62.png';
import { enrollmentsApi, tutorsApi, bookingsApi, notificationsApi, Enrollment, Tutor, Booking, Notification } from '../services/api';
import { toast } from 'sonner';

interface Material {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
}

export function StudentDashboard({ 
  onClassClick,
  onLogout,
  onManageSessions
}: { 
  onClassClick: (classId: string) => void;
  onLogout: () => void;
  onManageSessions?: () => void;
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'my-classes' | 'book-session'>('my-classes');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedClassForCancel, setSelectedClassForCancel] = useState<Enrollment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [tutorDetailOpen, setTutorDetailOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  
  // Real-time notification polling
  const { 
    notifications: polledNotifications, 
    unreadCount, 
    markAsRead,
    markAllAsRead 
  } = useNotificationPolling({ enabled: true, pollingInterval: 15000 });
  
  // API data states
  const [enrolledClasses, setEnrolledClasses] = useState<Enrollment[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch enrollments, pending bookings on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch enrollments
        const enrollmentsResponse = await enrollmentsApi.getAll();
        if (enrollmentsResponse.success) {
          setEnrolledClasses(enrollmentsResponse.data.enrollments);
        }

        // Fetch pending bookings for current student
        const bookingsResponse = await bookingsApi.getAll({ status: 'pending' });
        if (bookingsResponse.success) {
          setPendingBookings(bookingsResponse.data.bookings);
        }
      } catch (err) {
        setError('Failed to load your classes');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch tutors when switching to book-session tab
  useEffect(() => {
    if (activeTab === 'book-session' && tutors.length === 0) {
      const fetchTutors = async () => {
        try {
          const response = await tutorsApi.getAll({ limit: 50 });
          if (response.success) {
            setTutors(response.data.tutors);
          }
        } catch (err) {
          console.error('Error fetching tutors:', err);
        }
      };

      fetchTutors();
    }
  }, [activeTab, tutors.length]);

  const subjects = ['All', ...new Set(tutors.map(t => t.subject))];

  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutor.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || tutor.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const totalClasses = enrolledClasses.length;
  const averageGrade = enrolledClasses
    .filter(c => c.grade !== undefined && c.grade !== null)
    .reduce((sum, c) => sum + (c.grade || 0), 0) / 
    (enrolledClasses.filter(c => c.grade !== undefined && c.grade !== null).length || 1);

  const formatNextSession = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleViewTutorProfile = (tutor: any) => {
    setSelectedTutor(tutor);
    setTutorDetailOpen(true);
  };

  const handleCancelBooking = async (reason: string, details: string) => {
    if (!selectedClassForCancel) return;
    
    setIsCancelling(true);
    try {
      // Find if this is a pending booking or an enrollment
      const pendingBooking = pendingBookings.find(b => b.classId === selectedClassForCancel.classId);
      
      if (pendingBooking) {
        // Cancel pending booking
        const response = await bookingsApi.cancel(pendingBooking.id, reason, details);
        if (response.success) {
          setPendingBookings(prev => prev.filter(b => b.id !== pendingBooking.id));
          toast.success('Booking cancelled successfully');
        }
      } else {
        // For enrolled classes, use the enrollments API to cancel
        const response = await enrollmentsApi.cancel(selectedClassForCancel.id, reason, details);
        if (response.success) {
          setEnrolledClasses(prev => prev.filter(c => c.id !== selectedClassForCancel.id));
          toast.success('Class dropped successfully. Your tutor has been notified.');
        }
      }
    } catch (err) {
      console.error('Failed to cancel:', err);
      toast.error('Failed to cancel. Please try again.');
    } finally {
      setIsCancelling(false);
      setSelectedClassForCancel(null);
      setCancelDialogOpen(false);
    }
  };

  // Handle cancelling a pending booking directly
  const handleCancelPendingBooking = async (booking: Booking) => {
    try {
      const response = await bookingsApi.cancel(booking.id, 'Student cancelled', '');
      if (response.success) {
        setPendingBookings(prev => prev.filter(b => b.id !== booking.id));
        toast.success('Booking request cancelled');
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      toast.error('Failed to cancel booking');
    }
  };

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
                <h1 className="text-slate-800">Student Portal</h1>
                <p className="text-sm text-slate-600">HO CHI MINH UNIVERSITY OF TECHNOLOGY</p>
              </div>
            </div>
            
            {/* Notification Bell & User Profile */}
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <div className="relative">
                <button 
                  className="p-2 hover:bg-blue-100/60 rounded-lg transition-colors relative"
                  onClick={() => { setShowNotificationDropdown(!showNotificationDropdown); setShowProfileMenu(false); }}
                >
                  <Bell className="w-5 h-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notification Dropdown */}
                {showNotificationDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-blue-200 z-50 max-h-96 overflow-hidden">
                    <div className="px-4 py-3 border-b border-blue-200 flex justify-between items-center">
                      <h3 className="font-semibold text-slate-800">Notifications</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => { markAllAsRead(); setShowNotificationDropdown(false); }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {polledNotifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-slate-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        polledNotifications.slice(0, 10).map((notification) => (
                          <div 
                            key={notification.id}
                            className={`px-4 py-3 border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer ${!notification.read ? 'bg-blue-50/30' : ''}`}
                            onClick={() => { markAsRead(notification.id); }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${!notification.read ? 'bg-blue-500' : 'bg-transparent'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{notification.title}</p>
                                <p className="text-xs text-slate-600 line-clamp-2">{notification.message}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleString('vi-VN')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="relative">
                <button 
                  onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotificationDropdown(false); }}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-blue-100/60 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center">
                    {user?.name?.charAt(0) || 'S'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm text-slate-800">{user?.name || 'Student'}</p>
                    <p className="text-xs text-slate-600">Student</p>
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
          <h2 className="text-slate-800 mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-slate-600">Continue your learning journey</p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-blue-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('my-classes')}
              className={`pb-4 border-b-2 transition-colors ${
                activeTab === 'my-classes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>My Classes</span>
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 border-blue-300">{totalClasses}</Badge>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('book-session')}
              className={`pb-4 border-b-2 transition-colors ${
                activeTab === 'book-session'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                <span>Book Session</span>
              </div>
            </button>
          </nav>
        </div>

        {/* My Classes Tab */}
        {activeTab === 'my-classes' && (
          <div>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-white/70 backdrop-blur-xl border-blue-200 hover:border-blue-400 transition-colors shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm text-slate-700">Enrolled Classes</CardTitle>
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl text-slate-800">{totalClasses}</div>
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
                    <CardTitle className="text-sm text-slate-700">Average Grade</CardTitle>
                    <Award className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl text-slate-800">
                      {averageGrade ? averageGrade.toFixed(1) : 'N/A'}
                    </div>
                    {averageGrade && (
                      <p className="text-xs text-slate-600 mt-1">
                        {averageGrade >= 90 ? 'Excellent!' : averageGrade >= 80 ? 'Great job!' : 'Keep it up!'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-white/70 backdrop-blur-xl border-blue-200 hover:border-blue-400 transition-colors shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm text-slate-700">Total Sessions</CardTitle>
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl text-slate-800">
                      {enrolledClasses.reduce((sum, c) => sum + c.completedSessions, 0)}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">Completed</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Manage Sessions Button */}
            {onManageSessions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <Button
                  onClick={onManageSessions}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Manage My Sessions
                </Button>
              </motion.div>
            )}

            {/* Pending Bookings Section */}
            {pendingBookings.length > 0 && (
              <div className="mb-8">
                <h3 className="text-slate-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  Pending Booking Requests ({pendingBookings.length})
                </h3>
                <div className="grid gap-4">
                  {pendingBookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Card className="bg-amber-50/70 backdrop-blur-xl border-amber-200 hover:border-amber-400 transition-colors shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                                  Pending Approval
                                </Badge>
                              </div>
                              <h4 className="font-medium text-slate-800">{booking.className}</h4>
                              <p className="text-sm text-slate-600">Tutor: {booking.tutorName}</p>
                              <p className="text-sm text-slate-600">
                                Requested: {new Date(booking.slot.date).toLocaleDateString()} at {booking.slot.startTime}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                                onClick={() => handleCancelPendingBooking(booking)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Enrolled Classes */}
            <h3 className="text-slate-800 mb-4">My Enrolled Classes</h3>
            
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">Loading your classes...</span>
              </div>
            )}

            {error && (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            )}

            {!isLoading && !error && enrolledClasses.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">You haven't enrolled in any classes yet.</p>
                <Button
                  className="mt-4"
                  onClick={() => setActiveTab('book-session')}
                >
                  Browse Tutors
                </Button>
              </div>
            )}

            {!isLoading && !error && (
            <div className="space-y-6">
              {enrolledClasses.map((classItem, index) => (
                <motion.div
                  key={classItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card 
                    className="hover:shadow-2xl hover:shadow-blue-400/30 transition-shadow bg-white/70 backdrop-blur-xl border-blue-200 hover:border-blue-400 shadow-lg"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-slate-800">{classItem.className}</CardTitle>
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">{classItem.subject}</Badge>
                            </span>
                            <span className="flex items-center text-sm text-slate-600 mt-2">
                              <User className="h-4 w-4 mr-2" />
                              {classItem.tutorName}
                            </span>
                            <span className="flex items-center text-sm text-slate-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              {classItem.schedule}
                            </span>
                            <span className="flex items-center text-sm text-blue-600">
                              <Clock className="h-4 w-4 mr-2" />
                              Next session: {formatNextSession(classItem.nextSession)}
                            </span>
                          </div>
                        </div>
                        {classItem.grade !== undefined && (
                          <div className="text-right">
                            <div className="text-2xl text-slate-800">{classItem.grade}</div>
                            <p className="text-xs text-slate-600">Current Grade</p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress */}
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-600">Progress</span>
                            <span className="text-blue-600">
                              {classItem.completedSessions}/{classItem.totalSessions} sessions
                            </span>
                          </div>
                          <div className="w-full bg-blue-100 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                              style={{ 
                                width: `${(classItem.completedSessions / classItem.totalSessions) * 100}%` 
                              }}
                            />
                          </div>
                        </div>

                        {/* Feedback */}
                        {classItem.feedback && (
                          <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                            <p className="text-sm text-slate-700">
                              <span className="font-medium text-blue-700">Tutor Feedback:</span> {classItem.feedback}
                            </p>
                          </div>
                        )}

                        {/* Materials */}
                        {classItem.materials.length > 0 && (
                          <div>
                            <p className="text-sm text-slate-700 mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Course Materials ({classItem.materials.length})
                            </p>
                            <div className="space-y-2">
                              {classItem.materials.map((material) => (
                                <div 
                                  key={material.id}
                                  className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    <span className="text-sm text-slate-700 truncate">
                                      {material.name}
                                    </span>
                                  </div>
                                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-indigo-600 text-white"
                            onClick={() => onClassClick(classItem.id)}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => {
                              setSelectedClassForCancel(classItem);
                              setCancelDialogOpen(true);
                            }}
                          >
                            Cancel Booking
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* Book Session Tab */}
        {activeTab === 'book-session' && (
          <div>
            {/* Search and Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tutors by name or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/60 backdrop-blur-xl border border-blue-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-2 bg-white/60 backdrop-blur-xl border border-blue-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {subjects.map((subject) => (
                  <option key={subject} value={subject} className="bg-white">{subject}</option>
                ))}
              </select>
            </div>

            {/* Tutor List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTutors.map((tutor, index) => (
                <motion.div
                  key={tutor.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="hover:shadow-2xl hover:shadow-blue-400/30 transition-shadow cursor-pointer bg-white/70 backdrop-blur-xl border-blue-200 hover:border-blue-400 shadow-lg">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white">
                          <GraduationCap className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg text-slate-800">{tutor.name}</CardTitle>
                          <div className="flex items-center mt-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm text-slate-600">
                              {tutor.rating} ({tutor.reviews} reviews)
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">{tutor.subject}</Badge>
                        <p className="text-sm text-slate-600">{tutor.bio.substring(0, 100)}...</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">
                            ${tutor.hourlyRate}/hour
                          </span>
                          <span className="text-sm text-green-600">
                            {tutor.availableSlots.filter(s => s.available).length} slots
                          </span>
                        </div>
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-indigo-600 text-white"
                          onClick={() => handleViewTutorProfile(tutor)}
                        >
                          View Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Cancel Booking Dialog */}
      {selectedClassForCancel && (
        <CancelBookingDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          className={selectedClassForCancel.className}
          onConfirm={handleCancelBooking}
        />
      )}

      {/* Tutor Detail Dialog */}
      {selectedTutor && (
        <TutorDetailDialog
          open={tutorDetailOpen}
          onOpenChange={setTutorDetailOpen}
          tutor={selectedTutor}
        />
      )}
    </div>
  );
}