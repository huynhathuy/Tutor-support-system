import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Calendar, CheckCircle, XCircle, Clock, AlertCircle, X as CloseIcon, Home, BookOpen, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import hcmutLogo from 'figma:asset/c0b1283c1762e2e406fe4ae60561b95a8304ce62.png';

interface TimeSlot {
  day: string;
  time: string;
  status: 'available' | 'unavailable' | 'selected' | 'booked';
}

interface SessionFormData {
  major: string;
  subject: string;
  numberOfStudents: string;
  description: string;
}

interface ManageScheduleProps {
  onBack: () => void;
  onCreateSession?: (sessionData: any) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00'
];

export function ManageSchedule({ onBack, onCreateSession }: ManageScheduleProps) {
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<TimeSlot | null>(null);
  const [showFinalConfirmDialog, setShowFinalConfirmDialog] = useState(false);
  
  // Get current week dates
  const getCurrentWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(today);
    
    // Calculate the Monday of current week
    const diff = currentDay === 0 ? -6 : 1 - currentDay;
    monday.setDate(today.getDate() + diff);
    
    // Generate dates for the week (Mon-Sun)
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getCurrentWeekDates();

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${month}/${day}`;
  };

  const formatFullDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };
  
  // Mock data for unavailable and booked slots
  const [unavailableSlots] = useState<string[]>([
    'Tue-10:00',
    'Fri-11:00',
    'Wed-14:00'
  ]);

  const [bookedSlots] = useState<string[]>([
    'Mon-17:00',
  ]);

  const getSlotStatus = (day: string, time: string): 'available' | 'unavailable' | 'selected' | 'booked' => {
    const slotKey = `${day}-${time}`;
    
    if (bookedSlots.includes(slotKey)) return 'booked';
    if (unavailableSlots.includes(slotKey)) return 'unavailable';
    if (selectedSlots.some(slot => slot.day === day && slot.time === time)) return 'selected';
    return 'available';
  };

  const handleSlotClick = (day: string, time: string) => {
    const status = getSlotStatus(day, time);
    
    if (status === 'unavailable' || status === 'booked') return;

    if (status === 'selected') {
      // Deselect - remove from selection
      setSelectedSlots(selectedSlots.filter(slot => !(slot.day === day && slot.time === time)));
    } else {
      // Directly select the slot without confirmation dialog
      setSelectedSlots([...selectedSlots, { day, time, status: 'selected' }]);
    }
  };

  const handleConfirmSlot = () => {
    if (pendingSlot) {
      setSelectedSlots([...selectedSlots, { ...pendingSlot, status: 'selected' }]);
    }
    setShowConfirmDialog(false);
    setPendingSlot(null);
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setPendingSlot(null);
  };

  const handleClearSelection = () => {
    setSelectedSlots([]);
  };

  const totalSlots = DAYS.length * TIME_SLOTS.length;
  const availableCount = totalSlots - unavailableSlots.length - bookedSlots.length;
  const bookedCount = bookedSlots.length;

  const formatSlotTime = (day: string, time: string) => {
    const dayNames: { [key: string]: string } = {
      'Mon': 'Monday',
      'Tue': 'Tuesday',
      'Wed': 'Wednesday',
      'Thu': 'Thursday',
      'Fri': 'Friday',
      'Sat': 'Saturday',
      'Sun': 'Sunday'
    };
    
    const hour = parseInt(time.split(':')[0]);
    const endHour = hour + 1;
    return `${dayNames[day]}, ${time} - ${endHour.toString().padStart(2, '0')}:00`;
  };

  const [sessionFormData, setSessionFormData] = useState<SessionFormData>({
    major: '',
    subject: '',
    numberOfStudents: '',
    description: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSessionFormData({
      ...sessionFormData,
      [name]: value
    });
  };

  const handleSubmit = () => {
    // Validate required fields
    if (selectedSlots.length === 0) {
      alert('Please select at least one time slot.');
      return;
    }

    if (!sessionFormData.major.trim()) {
      alert('Please enter the Major.');
      return;
    }

    if (!sessionFormData.subject.trim()) {
      alert('Please enter the Subject.');
      return;
    }

    if (!sessionFormData.numberOfStudents.trim()) {
      alert('Please enter the Number of Students.');
      return;
    }

    // Validate number of students is a valid number
    const numStudents = parseInt(sessionFormData.numberOfStudents);
    if (isNaN(numStudents) || numStudents <= 0) {
      alert('Please enter a valid number of students.');
      return;
    }

    // Show final confirmation dialog with course preview
    setShowFinalConfirmDialog(true);
  };

  const handleFinalConfirm = () => {
    const sessionData = {
      ...sessionFormData,
      timeSlots: selectedSlots.map(slot => `${slot.day}-${slot.time}`)
    };

    if (onCreateSession) {
      onCreateSession(sessionData);
    }

    // Reset form and selection
    setSessionFormData({
      major: '',
      subject: '',
      numberOfStudents: '',
      description: ''
    });
    setSelectedSlots([]);
    setShowFinalConfirmDialog(false);

    // Navigate back to dashboard
    onBack();
  };

  const handleCancelFinalConfirm = () => {
    setShowFinalConfirmDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-100">
      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-4 sm:px-6 lg:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={hcmutLogo} alt="HCMUT Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-base">HCMUT Academic Tutoring Center</h1>
              <p className="text-xs opacity-90">Ho Chi Minh City University of Technology</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-sm hover:text-blue-100 transition-colors hidden md:block">Home</button>
            <button className="text-sm hover:text-blue-100 transition-colors hidden md:block">About</button>
            <button className="text-sm hover:text-blue-100 transition-colors hidden md:block">Resources</button>
            <button className="text-sm hover:text-blue-100 transition-colors hidden md:block">Contact</button>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Mail className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors relative">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="bg-gradient-to-r from-blue-100 via-white to-indigo-100 py-8 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100/60"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl shadow-lg">
                {useAuth().user?.name?.charAt(0) || 'T'}
              </div>
              <div>
                <h2 className="text-2xl text-slate-800">{useAuth().user?.name || 'Tutor'}</h2>
                <p className="text-sm text-slate-600">Schedule your session below</p>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-xl rounded-xl px-6 py-3 shadow-lg border border-blue-200">
            <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">Current Week</p>
            <p className="text-slate-800">
              {formatFullDate(weekDates[0])} - {formatFullDate(weekDates[6])}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-blue-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-7 h-7 text-blue-600" />
              </div>
              <div className="text-4xl text-slate-800 mb-2">{totalSlots}</div>
              <div className="text-sm text-slate-600 uppercase tracking-wide">Total Slots</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-blue-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <div className="text-4xl text-green-600 mb-2">{availableCount}</div>
              <div className="text-sm text-slate-600 uppercase tracking-wide">Available</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-blue-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-7 h-7 text-red-600" />
              </div>
              <div className="text-4xl text-red-600 mb-2">{bookedCount}</div>
              <div className="text-sm text-slate-600 uppercase tracking-wide">Booked</div>
            </div>
          </motion.div>
        </div>

        {/* Weekly Schedule Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-0.5 w-16 bg-blue-600" />
            <h2 className="text-3xl text-blue-900">Weekly Schedule</h2>
            <div className="h-0.5 w-16 bg-blue-600" />
          </div>
          <p className="text-gray-600">Select your preferred appointment time</p>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-8 mb-8 flex-wrap"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 border-2 border-gray-200 rounded-lg bg-white" />
            <span className="text-sm text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 border-2 border-red-300 rounded-lg flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-sm text-gray-700">Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 border-2 border-blue-600 rounded-lg bg-blue-50" />
            <span className="text-sm text-gray-700">Selected</span>
          </div>
        </motion.div>

        {/* Schedule Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-x-auto"
        >
          <div className="min-w-[800px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 gap-3 mb-4">
              <div className="text-center" />
              {DAYS.map((day, index) => (
                <div
                  key={day}
                  className="bg-blue-600 text-white py-3 px-4 rounded-xl text-center"
                >
                  <div className="font-semibold">{day}</div>
                  <div className="text-xs mt-1 opacity-90">{formatDate(weekDates[index])}</div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            {TIME_SLOTS.map((time) => (
              <div key={time} className="grid grid-cols-8 gap-3 mb-3">
                <div className="flex items-center justify-center text-blue-900 py-4">
                  {time}
                </div>
                {DAYS.map((day) => {
                  const status = getSlotStatus(day, time);
                  
                  return (
                    <motion.button
                      key={`${day}-${time}`}
                      onClick={() => handleSlotClick(day, time)}
                      disabled={status === 'unavailable' || status === 'booked'}
                      whileHover={status === 'available' || status === 'selected' ? { scale: 1.05 } : {}}
                      whileTap={status === 'available' || status === 'selected' ? { scale: 0.95 } : {}}
                      className={`
                        h-16 rounded-lg transition-all relative
                        ${status === 'available' ? 'border-2 border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50' : ''}
                        ${status === 'unavailable' ? 'bg-red-100 border-2 border-red-300 cursor-not-allowed' : ''}
                        ${status === 'selected' ? 'border-2 border-blue-600 bg-blue-50' : ''}
                        ${status === 'booked' ? 'bg-gray-100 border-2 border-gray-300 cursor-not-allowed' : ''}
                      `}
                    >
                      {status === 'unavailable' && (
                        <div className="flex flex-col items-center justify-center h-full">
                          <XCircle className="w-5 h-5 text-red-600 mb-1" />
                          <span className="text-xs text-red-600">N/A</span>
                        </div>
                      )}
                      {status === 'booked' && (
                        <div className="flex items-center justify-center h-full">
                          <Clock className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Booking Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-blue-50 rounded-2xl p-6 mt-8 border border-blue-100"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg text-blue-900 mb-4">Course Creation Instructions</h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">1</span>
                  <span className="text-gray-700">Click any available slot (white) to select your preferred time(s)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">2</span>
                  <span className="text-gray-700">Scroll down and fill in course details (Major, Subject, and Number of Students are required)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">3</span>
                  <span className="text-gray-700">Click "Submit" to review your course information</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">4</span>
                  <span className="text-gray-700">Confirm to create the course and return to your dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">•</span>
                  <span className="text-gray-700">Click a selected slot again to deselect it, or use "Clear" to remove all selections</span>
                </li>
              </ol>
            </div>
          </div>
        </motion.div>

        {/* Current Selection */}
        {selectedSlots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-100 border-2 border-blue-600 rounded-2xl p-6 mt-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="text-blue-900">Current Selection</h4>
                  <p className="text-sm text-blue-700">
                    {selectedSlots.map(slot => `${slot.day}, ${slot.time}`).join(' • ')}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleClearSelection}
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Clear
              </Button>
            </div>
          </motion.div>
        )}

        {/* Session Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-8">
          <h3 className="text-xl text-blue-900 mb-4">Course Information</h3>
          <p className="text-sm text-gray-600 mb-6">
            Fields marked with <span className="text-red-500">*</span> are required
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="major">
                Major <span className="text-red-500">*</span>
              </Label>
              <Input
                id="major"
                name="major"
                placeholder="e.g., Computer Science"
                value={sessionFormData.major}
                onChange={handleInputChange}
                className="w-full mt-1"
              />
            </div>
            <div>
              <Label htmlFor="subject">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                name="subject"
                placeholder="e.g., Data Structures"
                value={sessionFormData.subject}
                onChange={handleInputChange}
                className="w-full mt-1"
              />
            </div>
            <div>
              <Label htmlFor="numberOfStudents">
                Number of Students <span className="text-red-500">*</span>
              </Label>
              <Input
                id="numberOfStudents"
                name="numberOfStudents"
                type="number"
                placeholder="e.g., 30"
                value={sessionFormData.numberOfStudents}
                onChange={handleInputChange}
                className="w-full mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Additional course information..."
                value={sessionFormData.description}
                onChange={handleInputChange}
                className="w-full mt-1"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Button
            disabled={selectedSlots.length === 0}
            className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handleSubmit}
          >
            Submit Course Creation
          </Button>
        </motion.div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">© 2025 HCMUT Academic Tutoring Center. All rights reserved.</p>
              <p className="text-xs text-gray-500">Ho Chi Minh City University of Technology</p>
            </div>
            <div className="flex gap-4">
              <button className="text-sm text-blue-600 hover:text-blue-700">Privacy Policy</button>
              <button className="text-sm text-blue-600 hover:text-blue-700">Terms of Service</button>
              <button className="text-sm text-blue-600 hover:text-blue-700">Support</button>
            </div>
          </div>
        </div>
      </main>

      {/* Final Confirmation Dialog - Show Course Preview */}
      <AnimatePresence>
        {showFinalConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancelFinalConfirm}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border-4 border-blue-400 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={handleCancelFinalConfirm}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <CloseIcon className="w-6 h-6" />
              </button>

              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-blue-600" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl text-center text-blue-900 mb-2">
                Confirm Course Creation
              </h2>
              <p className="text-center text-gray-600 mb-6">
                Please review your course details before submitting
              </p>

              {/* Course Preview Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 mb-6 border-2 border-blue-200">
                <h3 className="text-xl text-blue-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  Course Preview
                </h3>
                
                {/* Course Details Grid */}
                <div className="space-y-4">
                  {/* Major */}
                  <div className="bg-white/70 rounded-xl p-4">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Major</p>
                    <p className="text-lg text-slate-800">{sessionFormData.major}</p>
                  </div>

                  {/* Subject */}
                  <div className="bg-white/70 rounded-xl p-4">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Subject</p>
                    <p className="text-lg text-slate-800">{sessionFormData.subject}</p>
                  </div>

                  {/* Number of Students */}
                  <div className="bg-white/70 rounded-xl p-4">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Number of Students</p>
                    <p className="text-lg text-slate-800">{sessionFormData.numberOfStudents} students</p>
                  </div>

                  {/* Schedule */}
                  <div className="bg-white/70 rounded-xl p-4">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">Schedule</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSlots.map((slot, index) => (
                        <div
                          key={index}
                          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-2"
                        >
                          <Clock className="w-4 h-4" />
                          {slot.day}, {slot.time}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Description (if provided) */}
                  {sessionFormData.description && (
                    <div className="bg-white/70 rounded-xl p-4">
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Description</p>
                      <p className="text-slate-800">{sessionFormData.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">
                    After confirming, this course will be added to your dashboard and will be visible to students for booking.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={handleCancelFinalConfirm}
                  variant="outline"
                  className="flex-1 h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                >
                  Go Back & Edit
                </Button>
                <Button
                  onClick={handleFinalConfirm}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                  Confirm & Create Course
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}