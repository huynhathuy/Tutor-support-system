import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { NotificationPanel } from './NotificationPanel';
import { 
  ArrowLeft, 
  Users, 
  Upload, 
  Eye, 
  EyeOff, 
  Save,
  FileText,
  Download,
  Loader2
} from 'lucide-react';
import { classesApi, bookingsApi, enrollmentsApi, Class, Booking } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import hcmutLogo from 'figma:asset/c0b1283c1762e2e406fe4ae60561b95a8304ce62.png';

interface Student {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  grade?: number;
  feedback?: string;
  enrolledDate: string;
}

interface Material {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
}

export function TutorClassDetail({ 
  classId, 
  onBack 
}: { 
  classId: string; 
  onBack: () => void;
}) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  
  // Class data state
  const [classData, setClassData] = useState({
    id: classId,
    name: 'Loading...',
    subject: '',
    schedule: '',
    bookedSlots: 0,
    totalSlots: 0
  });

  // Fetch class and bookings from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch class details
        const classResponse = await classesApi.getById(classId);
        if (classResponse.data) {
          const cls = classResponse.data;
          setClassData({
            id: cls.id,
            name: cls.name,
            subject: cls.subject,
            schedule: cls.schedule,
            bookedSlots: cls.enrolledCount || 0,
            totalSlots: cls.maxStudents
          });
        }

        // Fetch pending bookings for this class
        const bookingsResponse = await bookingsApi.getAll({ classId, status: 'pending' });
        if (bookingsResponse.data?.bookings) {
          setPendingBookings(bookingsResponse.data.bookings);
        }

        // Fetch enrolled students for this class
        const studentsResponse = await enrollmentsApi.getClassStudents(classId);
        if (studentsResponse.data?.students && studentsResponse.data.students.length > 0) {
          const fetchedStudents = studentsResponse.data.students.map(s => ({
            id: s.enrollmentId,
            name: s.name,
            email: s.email,
            isOnline: Math.random() > 0.5, // Mock online status
            grade: s.grade ?? undefined,
            feedback: s.feedback ?? undefined,
            enrolledDate: s.enrolledAt.split('T')[0]
          }));
          setStudents(fetchedStudents);
        } else {
          // No enrolled students found, show empty state
          setStudents([]);
        }
      } catch (err) {
        console.error('Failed to fetch class data:', err);
        setStudents([]); // Clear on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  const [students, setStudents] = useState<Student[]>([]);

  const [materials, setMaterials] = useState<Material[]>([
    {
      id: '1',
      name: 'Lecture 1 - Introduction to Calculus.pdf',
      type: 'PDF',
      uploadedAt: '2025-11-20',
      size: '2.4 MB'
    },
    {
      id: '2',
      name: 'Practice Problems Set 1.pdf',
      type: 'PDF',
      uploadedAt: '2025-11-22',
      size: '1.8 MB'
    }
  ]);

  const [gradesPublished, setGradesPublished] = useState(false);
  const [isSavingGrades, setIsSavingGrades] = useState(false);

  const onlineStudents = students.filter(s => s.isOnline).length;

  const handleGradeChange = (studentId: string, grade: string) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, grade: parseFloat(grade) || undefined } : s
    ));
  };

  const handleFeedbackChange = (studentId: string, feedback: string) => {
    setStudents(prev => prev.map(s => 
      s.id === studentId ? { ...s, feedback } : s
    ));
  };

  const handleSaveGrades = async () => {
    setIsSavingGrades(true);
    try {
      // Save all student grades via API
      const savePromises = students
        .filter(s => s.grade !== undefined || s.feedback)
        .map(student => 
          enrollmentsApi.updateGrade(student.id, {
            grade: student.grade,
            feedback: student.feedback || ''
          })
        );

      await Promise.all(savePromises);
      toast.success('Grades saved successfully!');
    } catch (err) {
      console.error('Failed to save grades:', err);
      toast.error('Failed to save grades. Please try again.');
    } finally {
      setIsSavingGrades(false);
    }
  };

  const handlePublishToggle = (published: boolean) => {
    setGradesPublished(published);
    if (published) {
      toast.success('Grades have been published and are now visible to students!');
    } else {
      toast.info('Grades have been unpublished and are hidden from students.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newMaterial: Material = {
        id: Date.now().toString(),
        name: files[0].name,
        type: files[0].type.includes('pdf') ? 'PDF' : 'Document',
        uploadedAt: new Date().toISOString().split('T')[0],
        size: `${(files[0].size / 1024 / 1024).toFixed(2)} MB`
      };
      setMaterials(prev => [...prev, newMaterial]);
    }
  };

  const handleBookingAccept = async (bookingId: string) => {
    try {
      const response = await bookingsApi.updateStatus(bookingId, 'confirmed');
      if (response.success) {
        // Remove from pending bookings
        setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
        // Update booked slots count
        setClassData(prev => ({ ...prev, bookedSlots: prev.bookedSlots + 1 }));
        alert('Booking accepted! Student will be added to the class.');
      }
    } catch (err) {
      console.error('Failed to accept booking:', err);
      alert('Failed to accept booking. Please try again.');
    }
  };

  const handleBookingReject = async (bookingId: string, reason: string) => {
    try {
      const response = await bookingsApi.updateStatus(bookingId, 'rejected', reason);
      if (response.success) {
        // Remove from pending bookings
        setPendingBookings(prev => prev.filter(b => b.id !== bookingId));
        alert(`Booking rejected. Reason: ${reason}. Student will be notified.`);
      }
    } catch (err) {
      console.error('Failed to reject booking:', err);
      alert('Failed to reject booking. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={hcmutLogo} alt="HCMUT Logo" className="h-12 w-12" />
              <div>
                <h1 className="text-blue-900">{classData.name}</h1>
                <p className="text-sm text-gray-600">{classData.schedule}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {classData.bookedSlots}/{classData.totalSlots} enrolled
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-blue-900">{students.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Online Now</CardTitle>
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-green-600">{onlineStudents}</div>
              <p className="text-xs text-gray-500 mt-1">
                {students.length - onlineStudents} offline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Materials</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-blue-900">{materials.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notifications">Pending Requests</TabsTrigger>
            <TabsTrigger value="students">Students & Grades</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <NotificationPanel 
              classId={classId}
              pendingBookings={pendingBookings}
              onAccept={handleBookingAccept}
              onReject={handleBookingReject}
              isLoading={isLoading}
            />
          </TabsContent>

          {/* Students & Grades Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Student Management</CardTitle>
                    <CardDescription>
                      Manage student grades and feedback
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="publish-grades">Publish Grades</Label>
                      <Switch 
                        id="publish-grades"
                        checked={gradesPublished}
                        onCheckedChange={handlePublishToggle}
                      />
                      {gradesPublished ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <Button 
                      onClick={handleSaveGrades} 
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={isSavingGrades}
                    >
                      {isSavingGrades ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {isSavingGrades ? 'Saving...' : 'Save All'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No students enrolled in this class yet</p>
                    <p className="text-sm text-gray-400 mt-1">Students will appear here once they enroll</p>
                  </div>
                ) : (
                <div className="space-y-6">
                  {students.map((student) => (
                    <Card key={student.id} className="border-2">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-gray-900">{student.name}</p>
                                  {student.isOnline && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                      <div className="h-2 w-2 bg-green-500 rounded-full mr-1" />
                                      Online
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{student.email}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Enrolled: {student.enrolledDate}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`grade-${student.id}`}>Grade (0-100)</Label>
                                <Input
                                  id={`grade-${student.id}`}
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={student.grade || ''}
                                  onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                  placeholder="Enter grade"
                                  className="mt-1"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`feedback-${student.id}`}>Feedback</Label>
                                <Textarea
                                  id={`feedback-${student.id}`}
                                  value={student.feedback || ''}
                                  onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                                  placeholder="Enter feedback for student"
                                  className="mt-1"
                                  rows={3}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Course Materials</CardTitle>
                    <CardDescription>
                      Upload and manage course materials for students
                    </CardDescription>
                  </div>
                  <div>
                    <Input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button 
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Material
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {materials.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No materials uploaded yet</p>
                    <p className="text-sm">Upload your first material to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {materials.map((material) => (
                      <div 
                        key={material.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-gray-900">{material.name}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span>{material.type}</span>
                              <span>•</span>
                              <span>{material.size}</span>
                              <span>•</span>
                              <span>Uploaded {material.uploadedAt}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
