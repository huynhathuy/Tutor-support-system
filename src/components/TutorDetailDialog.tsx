import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Star,
  GraduationCap,
  Mail,
  Award,
  BookOpen,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { classesApi, bookingsApi, Class } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

type BookingState = 
  | "BROWSING" 
  | "SELECTING_CLASS"
  | "CHECKING_AVAILABILITY" 
  | "AWAIT_CONFIRMATION" 
  | "CREATING_BOOKING_RECORD"
  | "NOTIFYING_TUTOR"
  | "CONFIRM"
  | "REJECT";

interface TutorDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutor: {
    id: string;
    name: string;
    subject: string;
    bio: string;
    rating: number;
    reviews: number;
    hourlyRate: number;
    email?: string;
    experience?: string;
    education?: string;
    availableSlots: Array<{
      day: string;
      time: string;
      available: boolean;
    }>;
  };
}

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
];

export function TutorDetailDialog({ open, onOpenChange, tutor }: TutorDetailDialogProps) {
  const { user } = useAuth();
  const [state, setState] = useState<BookingState>("BROWSING");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [tutorClasses, setTutorClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  // Reset state when dialog opens and fetch tutor's classes
  useEffect(() => {
    if (open) {
      setState("BROWSING");
      setSelectedDate(undefined);
      setSelectedTime("");
      setSelectedClass(null);
      
      // Fetch classes for this tutor
      const fetchClasses = async () => {
        setIsLoadingClasses(true);
        try {
          const response = await classesApi.getAll({ tutorId: tutor.id });
          if (response.success && response.data?.classes) {
            // Filter to only show active classes with available slots
            const availableClasses = response.data.classes.filter(
              c => c.status === 'active' && c.enrolledStudents < c.maxStudents
            );
            setTutorClasses(availableClasses);
          }
        } catch (err) {
          console.error('Failed to fetch tutor classes:', err);
        } finally {
          setIsLoadingClasses(false);
        }
      };
      
      fetchClasses();
    }
  }, [open, tutor.id]);

  const handleSelectClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setState("SELECTING_CLASS");
  };

  const handleTimeSlotSelect = (time: string) => {
    setSelectedTime(time);
    // Transition to CHECKING_AVAILABILITY
    setState("CHECKING_AVAILABILITY");
    
    // Simulate backend check
    setTimeout(() => {
      // Random chance of slot being unavailable (20%)
      const isAvailable = Math.random() > 0.2;
      
      if (isAvailable) {
        setState("AWAIT_CONFIRMATION");
      } else {
        toast.error("Time slot unavailable. Please select another time.");
        setState("SELECTING_CLASS");
        setSelectedTime("");
      }
    }, 1500);
  };

  const handleUserCancel = () => {
    if (state === "SELECTING_CLASS") {
      setState("BROWSING");
      setSelectedClass(null);
    } else {
      setState("SELECTING_CLASS");
    }
    setSelectedTime("");
    setSelectedDate(undefined);
  };

  const handleConfirmBooking = async () => {
    if (!selectedClass || !user?.id) {
      toast.error("Please select a class first");
      return;
    }

    setState("CREATING_BOOKING_RECORD");
    
    try {
      // Format time slot
      const formatTo24Hour = (time12: string): string => {
        const [time, modifier] = time12.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') hours = modifier === 'AM' ? '00' : '12';
        else if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12);
        return `${hours.padStart(2, '0')}:${minutes || '00'}`;
      };

      const startTime = formatTo24Hour(selectedTime);
      const [hours] = startTime.split(':');
      const endTime = `${String(parseInt(hours, 10) + 1).padStart(2, '0')}:30`;

      const bookingData = {
        classId: selectedClass.id,
        slot: {
          date: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          startTime,
          endTime
        },
        message: `Booking request for ${selectedClass.name}`
      };

      const response = await bookingsApi.create(bookingData);

      if (response.success && response.data) {
        setState("NOTIFYING_TUTOR");
        
        // Show pending state - tutor will need to confirm
        setTimeout(() => {
          setState("CONFIRM");
          toast.success("Booking request submitted! Waiting for tutor confirmation.");
        }, 1500);
      } else {
        toast.error("Booking failed. Please try again.");
        setState("SELECTING_CLASS");
      }
    } catch (err) {
      console.error('Failed to create booking:', err);
      toast.error("Booking failed. Please try again.");
      setState("SELECTING_CLASS");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const renderContent = () => {
    switch (state) {
      case "BROWSING":
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Tutor Info Section */}
            <div className="space-y-4 pb-6 border-b border-white/10">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl text-white mb-1">{tutor.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-300">
                      {tutor.rating} ({tutor.reviews} reviews)
                    </span>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                    {tutor.subject}
                  </Badge>
                </div>
              </div>

              <p className="text-gray-300 text-sm">{tutor.bio}</p>

              {tutor.email && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>{tutor.email}</span>
                </div>
              )}

              {tutor.experience && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Award className="w-4 h-4" />
                  <span>{tutor.experience}</span>
                </div>
              )}

              {tutor.education && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <BookOpen className="w-4 h-4" />
                  <span>{tutor.education}</span>
                </div>
              )}
            </div>

            {/* Available Classes Section */}
            <div className="space-y-4">
              <h4 className="text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Available Classes
              </h4>
              
              {isLoadingClasses ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : tutorClasses.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">
                  No classes available at the moment.
                </p>
              ) : (
                <div className="space-y-3">
                  {tutorClasses.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => handleSelectClass(classItem)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="text-white font-medium">{classItem.name}</h5>
                          <p className="text-sm text-gray-400">{classItem.subject}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{classItem.schedule}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <Users className="w-4 h-4" />
                            <span>{classItem.enrolledStudents}/{classItem.maxStudents}</span>
                          </div>
                          <Badge 
                            className={
                              classItem.enrolledStudents < classItem.maxStudents 
                                ? "bg-green-500/20 text-green-400 border-green-500/50 mt-1"
                                : "bg-red-500/20 text-red-400 border-red-500/50 mt-1"
                            }
                          >
                            {classItem.enrolledStudents < classItem.maxStudents ? 'Open' : 'Full'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );

      case "SELECTING_CLASS":
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Selected Class Info */}
            {selectedClass && (
              <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
                <h4 className="text-white font-medium mb-1">{selectedClass.name}</h4>
                <p className="text-sm text-gray-400">{selectedClass.subject}</p>
                <p className="text-xs text-gray-500 mt-1">{selectedClass.schedule}</p>
              </div>
            )}

            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Select Preferred Date</label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border border-white/10 bg-white/5 text-white"
              />
            </div>

            {selectedDate && (
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Select Time Slot</label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      className={
                        selectedTime === time 
                          ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-purple-600 text-white" 
                          : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                      }
                      onClick={() => handleTimeSlotSelect(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full border-white/10 text-gray-300 hover:bg-white/10"
              onClick={handleUserCancel}
            >
              Back to Classes
            </Button>
          </motion.div>
        );

      case "CHECKING_AVAILABILITY":
        return (
          <motion.div 
            className="flex flex-col items-center justify-center py-12 space-y-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
            <h3 className="text-xl text-white">Checking Availability</h3>
            <p className="text-gray-400 text-center">
              Verifying tutor's free slot for<br />
              {selectedDate?.toLocaleDateString()} at {selectedTime}
            </p>
          </motion.div>
        );

      case "AWAIT_CONFIRMATION":
        return (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-gray-400">Selected Time Slot</div>
                  <div className="text-white">
                    {selectedDate?.toLocaleDateString("en-US", { 
                      weekday: "long", 
                      year: "numeric", 
                      month: "long", 
                      day: "numeric" 
                    })}
                  </div>
                  <div className="text-blue-400">{selectedTime}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tutor</span>
                <span className="text-white">{tutor.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subject</span>
                <span className="text-white">{tutor.subject}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Duration</span>
                <span className="text-white">60 minutes</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleUserCancel} 
                className="flex-1 border-white/10 text-gray-300 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmBooking} 
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-purple-600 text-white"
              >
                Confirm Booking
              </Button>
            </div>
          </motion.div>
        );

      case "CREATING_BOOKING_RECORD":
        return (
          <motion.div 
            className="flex flex-col items-center justify-center py-12 space-y-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
            <h3 className="text-xl text-white">Creating Booking Record</h3>
            <p className="text-gray-400 text-center">
              Sending booking request to backend<br />
              to update the schedule in database
            </p>
          </motion.div>
        );

      case "NOTIFYING_TUTOR":
        return (
          <motion.div 
            className="flex flex-col items-center justify-center py-12 space-y-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
            <h3 className="text-xl text-white">Notifying Tutor</h3>
            <p className="text-gray-400 text-center">
              Sending notification to tutor<br />
              Waiting for confirmation...
            </p>
          </motion.div>
        );

      case "CONFIRM":
        return (
          <motion.div 
            className="flex flex-col items-center justify-center py-12 space-y-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="rounded-full bg-green-500/20 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-400" />
            </div>
            <h3 className="text-xl text-white">Session Confirmed!</h3>
            <p className="text-gray-400 text-center">
              Your booking has been confirmed.<br />
              You will receive a confirmation email shortly.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 w-full space-y-2">
              <div className="text-sm text-gray-400">Session Details</div>
              <div className="text-white">{tutor.name} - {tutor.subject}</div>
              <div className="text-sm text-gray-400">
                {selectedDate?.toLocaleDateString()} at {selectedTime}
              </div>
              <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/50">Confirmed</Badge>
            </div>
            <Button 
              onClick={handleClose} 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-purple-600 text-white"
            >
              Done
            </Button>
          </motion.div>
        );

      case "REJECT":
        return (
          <motion.div 
            className="flex flex-col items-center justify-center py-12 space-y-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="rounded-full bg-red-500/20 p-3">
              <XCircle className="h-12 w-12 text-red-400" />
            </div>
            <h3 className="text-xl text-white">Session Not Confirmed</h3>
            <p className="text-gray-400 text-center">
              The tutor rejected the session or did not respond.<br />
              Please try selecting a different time slot.
            </p>
            <div className="flex gap-3 w-full">
              <Button 
                variant="outline" 
                onClick={handleClose} 
                className="flex-1 border-white/10 text-gray-300 hover:bg-white/10"
              >
                Close
              </Button>
              <Button 
                onClick={() => setState("BROWSING")} 
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-purple-600 text-white"
              >
                Try Again
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white/5 backdrop-blur-xl border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {state === "BROWSING" || state === "CHECKING_AVAILABILITY" || state === "AWAIT_CONFIRMATION" 
              ? `${tutor.name} - ${tutor.subject}`
              : state === "CONFIRM"
              ? "Booking Confirmed"
              : state === "REJECT"
              ? "Booking Failed"
              : "Processing Booking"
            }
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
