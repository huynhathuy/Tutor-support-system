import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, Clock, User, FileText, 
  Download, Star, ArrowLeft, Loader2, Mail, 
  CheckCircle, AlertCircle, GraduationCap
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { enrollmentsApi, classesApi, Enrollment, Class } from '../services/api';
import { toast } from 'sonner';

interface ClassDetailViewProps {
  enrollmentId: string;
  onBack: () => void;
}

interface Material {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

export function ClassDetailView({ enrollmentId, onBack }: ClassDetailViewProps) {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [classDetails, setClassDetails] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        // Get all enrollments and find the specific one
        const enrollmentsRes = await enrollmentsApi.getAll();
        if (enrollmentsRes.success) {
          const found = enrollmentsRes.data.enrollments.find(e => e.id === enrollmentId);
          if (found) {
            setEnrollment(found);
            
            // Also fetch class details for more info
            try {
              const classRes = await classesApi.getById(found.classId);
              if (classRes.success) {
                setClassDetails(classRes.data);
              }
            } catch (err) {
              console.log('Could not fetch class details');
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch enrollment details:', err);
        toast.error('Failed to load class details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [enrollmentId]);

  const handleDownloadMaterial = (material: Material) => {
    // Simulate download
    toast.success(`Downloading ${material.name}...`);
  };

  const getProgressPercentage = () => {
    if (!enrollment) return 0;
    return Math.round((enrollment.completedSessions / enrollment.totalSessions) * 100);
  };

  const getGradeColor = (grade: number | null | undefined) => {
    if (grade === null || grade === undefined) return 'text-slate-400';
    if (grade >= 80) return 'text-green-600';
    if (grade >= 60) return 'text-blue-600';
    if (grade >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeLabel = (grade: number | null | undefined) => {
    if (grade === null || grade === undefined) return 'Not graded';
    if (grade >= 90) return 'Excellent!';
    if (grade >= 80) return 'Great!';
    if (grade >= 70) return 'Good';
    if (grade >= 60) return 'Satisfactory';
    if (grade >= 50) return 'Needs Improvement';
    return 'At Risk';
  };

  const formatNextSession = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return 'Completed';
    return `In ${days} days`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">Class not found</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 px-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-100 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">{enrollment.className}</h1>
              <div className="flex items-center gap-4 text-blue-100">
                <Badge className="bg-blue-500/30 text-white border-blue-400">
                  {enrollment.subject}
                </Badge>
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {enrollment.tutorName}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getGradeColor(enrollment.grade)}`}>
                {enrollment.grade !== null && enrollment.grade !== undefined ? enrollment.grade : '--'}
              </div>
              <p className="text-blue-100 text-sm">{getGradeLabel(enrollment.grade)}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Schedule Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/80 backdrop-blur border-blue-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Schedule & Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-500 mb-1">Schedule</p>
                      <p className="font-medium text-slate-800 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        {enrollment.schedule}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-500 mb-1">Next Session</p>
                      <p className="font-medium text-slate-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-600" />
                        {enrollment.nextSession ? formatNextSession(enrollment.nextSession) : 'TBD'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Progress</span>
                      <span className="text-sm font-medium text-slate-800">
                        {enrollment.completedSessions}/{enrollment.totalSessions} sessions
                      </span>
                    </div>
                    <Progress value={getProgressPercentage()} className="h-3" />
                    <p className="text-xs text-slate-500 mt-1">
                      {getProgressPercentage()}% complete
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tutor Feedback Card */}
            {enrollment.feedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white/80 backdrop-blur border-blue-100 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <Star className="w-5 h-5 text-yellow-500" />
                      Tutor Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                      <p className="text-slate-700 italic">"{enrollment.feedback}"</p>
                      <p className="text-sm text-slate-500 mt-2">— {enrollment.tutorName}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Course Materials */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/80 backdrop-blur border-blue-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Course Materials ({enrollment.materials?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {enrollment.materials && enrollment.materials.length > 0 ? (
                    <div className="space-y-3">
                      {enrollment.materials.map((material: Material) => (
                        <div
                          key={material.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{material.name}</p>
                              <p className="text-sm text-slate-500">
                                {material.type} • {material.size}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadMaterial(material)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">No materials uploaded yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Tutor Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="bg-white/80 backdrop-blur border-blue-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-600">Tutor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {enrollment.tutorName.split(' ').pop()?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{enrollment.tutorName}</p>
                      <p className="text-sm text-slate-500">Instructor</p>
                    </div>
                  </div>
                  
                  {enrollment.tutorEmail && (
                    <a
                      href={`mailto:${enrollment.tutorEmail}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Mail className="w-4 h-4" />
                      {enrollment.tutorEmail}
                    </a>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="bg-white/80 backdrop-blur border-blue-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-600">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Current Grade
                    </span>
                    <span className={`font-bold ${getGradeColor(enrollment.grade)}`}>
                      {enrollment.grade !== null && enrollment.grade !== undefined ? `${enrollment.grade}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Sessions Attended
                    </span>
                    <span className="font-medium text-slate-800">
                      {enrollment.completedSessions}/{enrollment.totalSessions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Enrolled On
                    </span>
                    <span className="font-medium text-slate-800">
                      {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="bg-white/80 backdrop-blur border-blue-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-600">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => toast.info('Contact feature coming soon!')}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Tutor
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
