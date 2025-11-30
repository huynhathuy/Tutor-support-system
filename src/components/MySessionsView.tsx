import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Clock, User, MapPin, BookOpen,
  CheckCircle, XCircle, AlertCircle, RefreshCw, X, Bell, Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { bookingsApi, enrollmentsApi, waitlistApi, Booking, Enrollment, AlternativeSlot } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface MySessionsViewProps {
  onBack: () => void;
}

interface SessionItem {
  id: string;
  type: 'booking' | 'enrollment';
  classId: string;
  tutorId: string;
  className: string;
  subject: string;
  tutorName: string;
  schedule: string;
  location: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'blocked';
  originalData: Booking | Enrollment;
}

type ViewState = 'list' | 'action-select' | 'reschedule' | 'cancel-confirm' | 'waitlist-confirm' | 'success';

export function MySessionsView({ onBack }: MySessionsViewProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AlternativeSlot | null>(null);
  const [alternativeSlots, setAlternativeSlots] = useState<AlternativeSlot[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      try {
        // Fetch both bookings and enrollments
        const [bookingsRes, enrollmentsRes] = await Promise.all([
          bookingsApi.getAll(),
          enrollmentsApi.getAll()
        ]);

        const sessionItems: SessionItem[] = [];

        // Add enrollments as confirmed sessions
        if (enrollmentsRes.success && enrollmentsRes.data.enrollments) {
          enrollmentsRes.data.enrollments.forEach((enr: Enrollment) => {
            sessionItems.push({
              id: enr.id,
              type: 'enrollment',
              classId: enr.classId,
              tutorId: enr.tutorId,
              className: enr.className,
              subject: enr.subject,
              tutorName: enr.tutorName,
              schedule: enr.schedule,
              location: 'Room A203', // Default location
              status: 'confirmed',
              originalData: enr
            });
          });
        }

        // Add pending bookings
        if (bookingsRes.success && bookingsRes.data.bookings) {
          bookingsRes.data.bookings
            .filter((b: Booking) => b.status === 'pending')
            .forEach((booking: Booking) => {
              sessionItems.push({
                id: booking.id,
                type: 'booking',
                classId: booking.classId,
                tutorId: booking.tutorId,
                className: booking.className,
                subject: 'Course',
                tutorName: booking.tutorName,
                schedule: `${booking.slot.date}, ${booking.slot.startTime} - ${booking.slot.endTime}`,
                location: 'TBD',
                status: 'pending',
                originalData: booking
              });
            });
        }

        setSessions(sessionItems);
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
        toast.error('Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleModifyClick = (session: SessionItem) => {
    setSelectedSession(session);
    setViewState('action-select');
  };

  const handleReschedule = async () => {
    if (!selectedSession) return;
    
    // Only bookings (not enrollments) can be rescheduled via this flow
    if (selectedSession.type === 'booking') {
      setIsLoadingSlots(true);
      try {
        const response = await bookingsApi.getAlternativeSlots(selectedSession.id);
        if (response.success) {
          setAlternativeSlots(response.data.alternativeSlots);
        } else {
          toast.error('Failed to load alternative slots');
        }
      } catch (err) {
        console.error('Failed to fetch alternative slots:', err);
        toast.error('Failed to load alternative slots');
      } finally {
        setIsLoadingSlots(false);
      }
    }
    setViewState('reschedule');
  };

  const handleCancelBooking = () => {
    setViewState('cancel-confirm');
  };

  const handleSelectSlot = (slot: AlternativeSlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedSession || !selectedSlot) return;

    setIsProcessing(true);
    try {
      // Call the reschedule API
      const response = await bookingsApi.reschedule(selectedSession.id, {
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime
      });

      if (response.success) {
        toast.success('Booking rescheduled successfully!');
        setSuccessMessage('Your booking has been rescheduled successfully. You will receive a confirmation email shortly.');
        setViewState('success');
        
        // Update local state
        setSessions(prev => prev.map((s: SessionItem) => 
          s.id === selectedSession.id 
            ? { ...s, schedule: `${selectedSlot.date}, ${selectedSlot.startTime} - ${selectedSlot.endTime}` }
            : s
        ));
      } else {
        toast.error('Failed to reschedule booking');
      }
    } catch (err) {
      console.error('Failed to reschedule:', err);
      toast.error('Failed to reschedule booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedSession) return;

    setIsProcessing(true);
    try {
      if (selectedSession.type === 'enrollment') {
        // Cancel enrollment
        await enrollmentsApi.cancel(selectedSession.id, 'User requested cancellation', '');
        setSessions(prev => prev.filter((s: SessionItem) => s.id !== selectedSession.id));
      } else {
        // Cancel booking
        await bookingsApi.cancel(selectedSession.id, 'User requested cancellation', '');
        setSessions(prev => prev.filter((s: SessionItem) => s.id !== selectedSession.id));
      }
      
      toast.success('Booking cancelled successfully');
      setSuccessMessage('Your booking has been cancelled. Your tutor has been notified.');
      setViewState('success');
    } catch (err) {
      console.error('Failed to cancel:', err);
      toast.error('Failed to cancel booking');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWaitlist = async () => {
    if (!selectedSession) return;

    setIsProcessing(true);
    try {
      const response = await waitlistApi.add({
        classId: selectedSession.classId,
        tutorId: selectedSession.tutorId,
        reason: 'Looking for available slot for rescheduling'
      });

      if (response.success) {
        setSuccessMessage('You have been added to the waitlist. We will notify you when a slot becomes available.');
        setViewState('success');
        toast.success('Added to waitlist!');
      } else {
        toast.error('Failed to add to waitlist');
      }
    } catch (err: any) {
      // Check if already on waitlist
      if (err?.message?.includes('already on the waitlist')) {
        toast.info('You are already on the waitlist for this class');
      } else {
        console.error('Failed to add to waitlist:', err);
        toast.error('Failed to add to waitlist');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setViewState('list');
    setSelectedSession(null);
    setSelectedSlot(null);
    setSuccessMessage('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-700 border-green-300"><CheckCircle className="w-3 h-3 mr-1" /> Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 border-red-300"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      case 'blocked':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-300"><AlertCircle className="w-3 h-3 mr-1" /> Blocked</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Sessions</h1>
              <p className="text-blue-100 text-sm mt-1">Manage your bookings</p>
            </div>
            <button
              onClick={onBack}
              className="text-blue-100 hover:text-white flex items-center gap-2 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No sessions found</p>
            <Button onClick={onBack} className="mt-4">Browse Tutors</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-slate-800">{session.className}</h3>
                      {getStatusBadge(session.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span>{session.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{session.tutorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{session.schedule}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{session.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleModifyClick(session)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Modify Booking
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Action Selection Dialog */}
      <AnimatePresence>
        {viewState === 'action-select' && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Choose Action</h2>
                <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <p className="font-medium text-slate-800">{selectedSession.className}</p>
                <p className="text-sm text-slate-600">{selectedSession.schedule}</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleReschedule}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reschedule Booking
                </Button>
                
                <Button
                  onClick={handleCancelBooking}
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50 py-3 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Booking
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reschedule Dialog */}
      <AnimatePresence>
        {viewState === 'reschedule' && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <p className="text-sm text-slate-600 mb-4">Select a new time slot for your session</p>

              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <p className="text-xs text-slate-500 mb-1">Current booking:</p>
                <p className="font-medium text-slate-800">{selectedSession.className}</p>
                <p className="text-sm text-slate-600">{selectedSession.schedule}</p>
              </div>

              {isLoadingSlots ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                  <p className="text-slate-600 text-sm">Loading available slots...</p>
                </div>
              ) : alternativeSlots.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600">No alternative slots available</p>
                  <p className="text-slate-500 text-sm mt-1">Try the waitlist option below</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {alternativeSlots.map((slot: AlternativeSlot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleSelectSlot(slot)}
                      disabled={!slot.available}
                      className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                        selectedSlot?.id === slot.id
                          ? 'border-blue-500 bg-blue-50'
                          : slot.available
                          ? 'border-slate-200 hover:border-blue-300 bg-white'
                          : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${slot.available ? 'bg-blue-100' : 'bg-slate-200'}`}>
                          <Calendar className={`w-5 h-5 ${slot.available ? 'text-blue-600' : 'text-slate-400'}`} />
                        </div>
                        <div className="text-left">
                          <p className={`font-medium ${slot.available ? 'text-slate-800' : 'text-slate-400'}`}>
                            {slot.day}, {formatDate(slot.date)}
                            {!slot.available && (
                              <Badge className="ml-2 bg-red-100 text-red-600 border-red-200 text-xs">Unavailable</Badge>
                            )}
                          </p>
                          <p className={`text-sm ${slot.available ? 'text-slate-600' : 'text-slate-400'}`}>
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </div>
                      </div>
                      {slot.available ? (
                        <CheckCircle className={`w-5 h-5 ${selectedSlot?.id === slot.id ? 'text-blue-600' : 'text-green-500'}`} />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t border-slate-200 pt-4 mb-4">
                <p className="text-sm text-slate-600 text-center mb-3">Don't see a suitable time slot?</p>
                <Button
                  onClick={handleWaitlist}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  Notify Me When Available
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmReschedule}
                  disabled={!selectedSlot || isProcessing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Confirm
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Dialog */}
      <AnimatePresence>
        {viewState === 'cancel-confirm' && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Cancel Booking?</h2>
                <p className="text-slate-600">
                  Are you sure you want to cancel your booking for <strong>{selectedSession.className}</strong>?
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                  disabled={isProcessing}
                >
                  Keep Booking
                </Button>
                <Button
                  onClick={handleConfirmCancel}
                  disabled={isProcessing}
                  variant="outline"
                  className="flex-1 border-red-500 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-600"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Yes, Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Dialog */}
      <AnimatePresence>
        {viewState === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Success!</h2>
              <p className="text-slate-600 mb-6">{successMessage}</p>
              <Button
                onClick={handleClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
