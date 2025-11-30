import { useState, useEffect } from 'react';
import { Bell, Search, ChevronDown, Download, Play, Filter, Menu, X, TrendingUp, AlertTriangle, CheckCircle, Loader2, History, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RiskListTable } from './RiskListTable';
import { RiskTrendsChart } from './RiskTrendsChart';
import { SuggestInterventionModal } from './SuggestInterventionModal';
import { StudentProfileModal } from './StudentProfileModal';
import { useAuth } from '../contexts/AuthContext';
import { riskAssessmentApi, AtRiskStudent as ApiAtRiskStudent, Intervention } from '../services/api';
import { toast } from 'sonner';
import { useNotificationPolling } from '../hooks/useNotificationPolling';
import hcmutLogo from 'figma:asset/c0b1283c1762e2e406fe4ae60561b95a8304ce62.png';

interface CTSVDashboardProps {
  onLogout: () => void;
}

export interface AtRiskStudent {
  id: string;
  studentId: string;
  name: string;
  photo: string;
  riskScore: number;
  attendance: number;
  gradesAvg: number;
  lastDetected: string;
  riskFactors: string[];
  courses: Array<{
    code: string;
    name: string;
    grade: number;
    attendance: number;
  }>;
}

// At-risk students are now fetched from the API

export function CTSVDashboard({ onLogout }: CTSVDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Fall 2025');
  const [isDetecting, setIsDetecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<AtRiskStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<AtRiskStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<AtRiskStudent | null>(null);
  const [interventionStudent, setInterventionStudent] = useState<AtRiskStudent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null); // null means no detection run yet
  const [hasRunDetection, setHasRunDetection] = useState(false); // Track if detection has been run
  const [notifications, setNotifications] = useState(3);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    attendanceThreshold: 80,
    gradeThreshold: 6.0,
    course: 'all',
    tutor: 'all'
  });

  // Preset policy definitions
  const presetPolicies = [
    { id: 'early-warning-hk1-2025', name: 'Early Warning Policy HK1-2025', attendanceThreshold: 80, gradeThreshold: 5.5 },
    { id: 'strict-monitoring-2025', name: 'Strict Monitoring Policy 2025', attendanceThreshold: 85, gradeThreshold: 6.0 },
    { id: 'at-risk-intervention', name: 'At-Risk Intervention Policy', attendanceThreshold: 75, gradeThreshold: 5.0 },
    { id: 'probation-alert', name: 'Academic Probation Alert', attendanceThreshold: 70, gradeThreshold: 4.0 }
  ];

  // Policy mode: 'custom' or 'preset'
  const [policyMode, setPolicyMode] = useState<'custom' | 'preset'>('custom');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(presetPolicies[0].id);
  const [detectionLogs, setDetectionLogs] = useState<Array<{
    id: string;
    timestamp: string;
    policyUsed: string;
    thresholds: { attendance: number; grade: number };
    studentsDetected: number;
  }>>([]);

  // Handle preset selection
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = presetPolicies.find(p => p.id === presetId);
    if (preset) {
      setFilters(prev => ({
        ...prev,
        attendanceThreshold: preset.attendanceThreshold,
        gradeThreshold: preset.gradeThreshold
      }));
    }
  };

  // Handle policy mode change
  const handlePolicyModeChange = (mode: 'custom' | 'preset') => {
    setPolicyMode(mode);
    if (mode === 'preset') {
      handlePresetChange(selectedPresetId);
    }
  };

  // Notification polling
  const { notifications: polledNotifications, unreadCount, markAsRead } = useNotificationPolling(30000);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Transform API data to component format
  const transformApiData = (apiStudents: ApiAtRiskStudent[]): AtRiskStudent[] => {
    return apiStudents.map(s => ({
      id: s.id,
      studentId: s.studentId,
      name: s.name,
      photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name.split(' ').pop()}`,
      riskScore: s.riskScore,
      attendance: s.attendance,
      gradesAvg: s.gradesAvg,
      lastDetected: s.lastDetected,
      riskFactors: s.riskFactors,
      courses: s.courses || []
    }));
  };

  // No auto-fetch on mount - students are only loaded after "Run Detection Now" is clicked
  useEffect(() => {
    // Just set loading to false on mount since we start with empty state
    setIsLoading(false);
  }, []);

  const runDetection = async () => {
    setIsDetecting(true);
    try {
      // Determine which policy/thresholds are being used
      const currentThresholds = {
        attendance: filters.attendanceThreshold,
        grade: filters.gradeThreshold
      };
      
      const policyName = policyMode === 'preset' 
        ? presetPolicies.find(p => p.id === selectedPresetId)?.name || 'Unknown Preset'
        : 'Custom Thresholds';
      
      // Trigger detection via API with thresholds
      const detectionResponse = await riskAssessmentApi.runDetection({ 
        threshold: 60,
        attendanceThreshold: currentThresholds.attendance,
        gradeThreshold: currentThresholds.grade,
        policyName: policyName
      });
      
      // Use students from detection response if available, otherwise fetch separately
      if (detectionResponse.data && detectionResponse.data.students) {
        const transformed = transformApiData(detectionResponse.data.students);
        setStudents(transformed);
        setFilteredStudents(transformed);
        setLastSync(new Date().toLocaleString('vi-VN'));
        setHasRunDetection(true);
        
        // Create detection log entry
        const logEntry = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleString('vi-VN'),
          policyUsed: policyName,
          thresholds: currentThresholds,
          studentsDetected: transformed.length
        };
        setDetectionLogs(prev => [logEntry, ...prev].slice(0, 10));
        
        const { highRisk, mediumRisk, lowRisk } = detectionResponse.data;
        toast.success(`Detection complete using "${policyName}": ${highRisk} high risk, ${mediumRisk} medium risk, ${lowRisk} low risk students`);
      } else {
        // Fallback: fetch students separately and apply filter client-side
        const studentsResponse = await riskAssessmentApi.getAtRiskStudents();
        if (studentsResponse.data && studentsResponse.data.students) {
          const allStudents = transformApiData(studentsResponse.data.students);
          // Apply the same filtering logic as applyFilters
          const filtered = allStudents.filter(student => {
            const meetsAttendance = student.attendance < currentThresholds.attendance;
            const meetsGrade = student.gradesAvg < currentThresholds.grade;
            return meetsAttendance || meetsGrade;
          });
          setStudents(filtered);
          setFilteredStudents(filtered);
          setLastSync(new Date().toLocaleString('vi-VN'));
          setHasRunDetection(true);
          
          const logEntry = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleString('vi-VN'),
            policyUsed: policyName,
            thresholds: currentThresholds,
            studentsDetected: filtered.length
          };
          setDetectionLogs(prev => [logEntry, ...prev].slice(0, 10));
          
          toast.success(`Detection complete using "${policyName}": ${filtered.length} at-risk students found`);
        }
      }
    } catch (err) {
      console.error('Failed to run detection:', err);
      toast.error('Failed to run detection');
    } finally {
      setIsDetecting(false);
    }
  };

  const applyFilters = () => {
    const filtered = students.filter(student => {
      const meetsAttendance = student.attendance < filters.attendanceThreshold;
      const meetsGrade = student.gradesAvg < filters.gradeThreshold;
      return meetsAttendance || meetsGrade;
    });
    setFilteredStudents(filtered);
  };

  const exportCSV = () => {
    // CSV export logic
    const csv = filteredStudents.map(s => 
      `${s.studentId},${s.name},${s.riskScore},${s.attendance},${s.gradesAvg}`
    ).join('\n');
    const blob = new Blob([`Student ID,Name,Risk Score,Attendance %,Grade Avg\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `at-risk-students-${selectedTerm}.csv`;
    a.click();
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-400 bg-red-500/20 border-red-500/50';
    if (score >= 60) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
    return 'text-green-400 bg-green-500/20 border-green-500/50';
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

      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-white/70 backdrop-blur-xl border-b border-blue-200 z-50 shadow-xl">
        <div className="h-full px-4 flex items-center justify-between max-w-[1920px] mx-auto">
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-blue-100/60 rounded-lg text-slate-700"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img 
                src={hcmutLogo} 
                alt="HCMUT Logo" 
                className="h-10"
              />
            </motion.div>
            <div className="hidden md:block">
              <h1 className="text-slate-800">CTSV Dashboard</h1>
              <p className="text-xs text-slate-600">Detect At-risk Students</p>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search student by ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/60 backdrop-blur-xl border border-blue-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right: Term Filter, Notifications, Profile */}
          <div className="flex items-center gap-3">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="hidden md:block px-3 py-2 bg-white/60 backdrop-blur-xl border border-blue-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option className="bg-white">Fall 2025</option>
              <option className="bg-white">Summer 2025</option>
              <option className="bg-white">Spring 2025</option>
            </select>

            <div className="relative">
              <button 
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="relative p-2 hover:bg-blue-100/60 rounded-lg"
              >
                <Bell className="w-5 h-5 text-slate-700" />
                {(notifications + unreadCount) > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {(notifications + unreadCount) > 9 ? '9+' : notifications + unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotificationDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl border border-blue-200 rounded-lg shadow-2xl py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-blue-200">
                      <h3 className="text-slate-800 font-medium">Notifications</h3>
                      <p className="text-xs text-slate-600">
                        {notifications} risk alerts • {unreadCount} unread
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

            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-blue-100/60 rounded-lg"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center">
                  CT
                </div>
                <ChevronDown className="w-4 h-4 text-slate-600 hidden md:block" />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-blue-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-blue-200">
                    <p className="text-sm text-slate-800">CTSV Account</p>
                    <p className="text-xs text-slate-600">Student Affairs</p>
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
      </header>

      {/* Main Content Area */}
      <div className="pt-[60px] flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 w-64 bg-white/60 backdrop-blur-xl border-r border-blue-200 transform transition-transform duration-300 z-40 pt-[60px] lg:pt-0 shadow-lg ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <nav className="p-4 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-blue-700 bg-blue-100 border border-blue-300 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
              <span>Detect At-risk</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-blue-100/60 rounded-lg">
              <TrendingUp className="w-5 h-5" />
              <span>Attendance Tracker</span>
            </button>
            <button 
              onClick={exportCSV}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-blue-100/60 rounded-lg"
            >
              <Download className="w-5 h-5" />
              <span>Export Reports</span>
            </button>
          </nav>

          {/* Recent Detections */}
          <div className="p-4 border-t border-blue-200 mt-4">
            <h3 className="text-sm text-slate-600 mb-3">Recent Detections</h3>
            <div className="space-y-2">
              {!hasRunDetection ? (
                <p className="text-xs text-slate-500 italic">No detection run yet. Click "Run Detection Now" to start.</p>
              ) : students.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No at-risk students detected.</p>
              ) : (
                students.slice(0, 5).map((student) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className="w-full text-left px-3 py-2 bg-white/60 hover:bg-blue-100/60 rounded-lg border border-blue-200"
                  >
                    <p className="text-sm text-slate-800">{student.name}</p>
                    <p className="text-xs text-slate-600">{student.studentId}</p>
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs mt-1 border ${getRiskColor(student.riskScore)}`}>
                      Risk: {student.riskScore}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Detection Logs */}
          {detectionLogs.length > 0 && (
            <div className="p-4 border-t border-blue-200">
              <h3 className="text-sm text-slate-600 mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                Detection Logs
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {detectionLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="px-3 py-2 bg-white/60 rounded-lg border border-blue-200 text-xs"
                  >
                    <p className="text-slate-700 font-medium">{log.policyUsed}</p>
                    <p className="text-slate-500">{log.timestamp}</p>
                    <p className="text-slate-600">
                      Att &lt;{log.thresholds.attendance}%, Grade &lt;{log.thresholds.grade} → {log.studentsDetected} students
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="p-4 border-t border-blue-200">
            <button 
              onClick={() => {
                // Open intervention modal for the first high-risk student
                const highRiskStudent = filteredStudents.find(s => s.riskScore >= 80);
                if (highRiskStudent) {
                  setInterventionStudent(highRiskStudent);
                } else if (filteredStudents.length > 0) {
                  setInterventionStudent(filteredStudents[0]);
                } else {
                  toast.info('No at-risk students to suggest interventions for');
                }
              }}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-indigo-600 text-white rounded-lg flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Suggest Interventions</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="relative flex-1 p-6 max-w-[1400px] mx-auto">
          {/* Data Sync Banner */}
          {lastSync && (
            <motion.div 
              className="mb-4 px-4 py-3 bg-blue-100 border border-blue-300 rounded-lg flex items-center justify-between"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-slate-700">
                  Last HCMUT_DATACORE sync: <strong className="text-slate-800">{lastSync}</strong>
                </span>
              </div>
              <button
                onClick={runDetection}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Re-run Detection
              </button>
            </motion.div>
          )}

          {/* Run Detection Button */}
          <motion.div 
            className="mb-6 flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h2 className="text-2xl text-slate-800 mb-1">At-Risk Student Detection</h2>
              <p className="text-sm text-slate-600">
                Generate risk list based on attendance and grade thresholds from HCMUT_DATACORE
              </p>
            </div>
            <button
              onClick={runDetection}
              disabled={isDetecting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isDetecting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Detecting...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Run Detection Now</span>
                </>
              )}
            </button>
          </motion.div>

          {/* Filters */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white/60 border border-blue-200 rounded-lg hover:bg-blue-100/60 text-slate-700"
            >
              <Filter className="w-4 h-4" />
              <span>Filters & Thresholds</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                Showing <strong className="text-slate-800">{filteredStudents.length}</strong> at-risk students
              </span>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                className="mb-6 p-4 bg-white/60 backdrop-blur-xl border border-blue-200 rounded-lg shadow-lg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {/* Policy Mode Selection */}
                <div className="mb-4 p-3 bg-blue-50/50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Detection Policy</span>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="policyMode"
                        checked={policyMode === 'custom'}
                        onChange={() => handlePolicyModeChange('custom')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Custom Thresholds</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="policyMode"
                        checked={policyMode === 'preset'}
                        onChange={() => handlePolicyModeChange('preset')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">Use Preset Policy</span>
                    </label>
                  </div>
                  
                  {/* Preset Policy Dropdown */}
                  {policyMode === 'preset' && (
                    <motion.div 
                      className="mt-3"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <label className="block text-sm text-slate-700 mb-2">Select Preset Policy</label>
                      <select
                        value={selectedPresetId}
                        onChange={(e) => handlePresetChange(e.target.value)}
                        className="w-full md:w-1/2 px-3 py-2 bg-white/80 border border-blue-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {presetPolicies.map(policy => (
                          <option key={policy.id} value={policy.id} className="bg-white">
                            {policy.name} (Attendance &lt;{policy.attendanceThreshold}%, Grade &lt;{policy.gradeThreshold})
                          </option>
                        ))}
                      </select>
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={policyMode === 'preset' ? 'opacity-60' : ''}>
                    <label className="block text-sm text-slate-700 mb-2">
                      Attendance Threshold: <strong className="text-slate-800">{filters.attendanceThreshold}%</strong>
                      {policyMode === 'preset' && <span className="ml-2 text-xs text-blue-600">(from preset)</span>}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={filters.attendanceThreshold}
                      onChange={(e) => setFilters({ ...filters, attendanceThreshold: parseInt(e.target.value) })}
                      disabled={policyMode === 'preset'}
                      className={`w-full accent-blue-600 ${policyMode === 'preset' ? 'cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div className={policyMode === 'preset' ? 'opacity-60' : ''}>
                    <label className="block text-sm text-slate-700 mb-2">
                      Grade Threshold: <strong className="text-slate-800">{filters.gradeThreshold.toFixed(1)}</strong>
                      {policyMode === 'preset' && <span className="ml-2 text-xs text-blue-600">(from preset)</span>}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={filters.gradeThreshold}
                      onChange={(e) => setFilters({ ...filters, gradeThreshold: parseFloat(e.target.value) })}
                      disabled={policyMode === 'preset'}
                      className={`w-full accent-blue-600 ${policyMode === 'preset' ? 'cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Course</label>
                    <select
                      value={filters.course}
                      onChange={(e) => setFilters({ ...filters, course: e.target.value })}
                      className="w-full px-3 py-2 bg-white/60 border border-blue-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all" className="bg-white">All Courses</option>
                      <option value="CS101" className="bg-white">CS101 - Data Structures</option>
                      <option value="CS102" className="bg-white">CS102 - Algorithms</option>
                      <option value="MATH201" className="bg-white">MATH201 - Calculus II</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Tutor</label>
                    <select
                      value={filters.tutor}
                      onChange={(e) => setFilters({ ...filters, tutor: e.target.value })}
                      className="w-full px-3 py-2 bg-white/60 border border-blue-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all" className="bg-white">All Tutors</option>
                      <option value="tutor1" className="bg-white">Dr. Nguyễn Văn A</option>
                      <option value="tutor2" className="bg-white">TS. Trần Thị B</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={applyFilters}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-indigo-600 text-white rounded-lg"
                  >
                    Apply Filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!isDetecting && filteredStudents.length === 0 && (
            <motion.div 
              className="text-center py-16 bg-white/60 backdrop-blur-xl rounded-lg border border-blue-200 shadow-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl text-slate-800 mb-2">No At-Risk Students Detected</h3>
              <p className="text-slate-600 mb-4">
                {hasRunDetection 
                  ? "Great news! No students meet the current risk criteria."
                  : "Click \"Run Detection Now\" to analyze student data and identify at-risk students."}
              </p>
              {hasRunDetection ? (
                <button
                  onClick={() => setShowFilters(true)}
                  className="px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-100/60"
                >
                  Adjust Thresholds
                </button>
              ) : (
                <button
                  onClick={runDetection}
                  disabled={isDetecting}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-indigo-600 text-white rounded-lg"
                >
                  Run Detection Now
                </button>
              )}
            </motion.div>
          )}

          {/* Risk List Table */}
          {filteredStudents.length > 0 && (
            <motion.div 
              className="bg-white/70 backdrop-blur-xl rounded-lg shadow-lg border border-blue-200 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-4 border-b border-blue-200 flex items-center justify-between">
                <h3 className="text-lg text-slate-800">Risk List - Generated from Detection</h3>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 border border-blue-200 rounded-lg hover:bg-blue-100/60"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
              <RiskListTable
                students={filteredStudents}
                onViewProfile={(student) => setSelectedStudent(student)}
                onSuggestIntervention={(student) => setInterventionStudent(student)}
              />
            </motion.div>
          )}

          {/* Risk Trends Chart */}
          {filteredStudents.length > 0 && (
            <motion.div 
              className="bg-white/70 backdrop-blur-xl rounded-lg shadow-lg border border-blue-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="p-4 border-b border-blue-200">
                <h3 className="text-lg text-slate-800">Risk Trends - Weekly Analysis</h3>
                <p className="text-sm text-slate-600">Track at-risk student percentage over time</p>
              </div>
              <RiskTrendsChart />
            </motion.div>
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {interventionStudent && (
        <SuggestInterventionModal
          student={interventionStudent}
          onClose={() => setInterventionStudent(null)}
          onSubmit={async (data) => {
            try {
              const response = await riskAssessmentApi.createIntervention(data);
              if (response.success) {
                toast.success('Intervention created successfully!');
                // Refresh risk students to show updated interventions
                const refreshResponse = await riskAssessmentApi.getAtRiskStudents();
                if (refreshResponse.success) {
                  setStudents(transformApiData(refreshResponse.data.students));
                }
              }
            } catch (err) {
              console.error('Failed to create intervention:', err);
              toast.error('Failed to create intervention. Please try again.');
            }
            setInterventionStudent(null);
          }}
        />
      )}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}