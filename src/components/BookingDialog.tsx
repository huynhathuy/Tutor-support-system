import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Badge } from "./ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { bookingsApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

type BookingState = 
  | "BROWSING" 
  | "CHECKING_AVAILABILITY" 
  | "AWAIT_CONFIRMATION" 
  | "CREATING_BOOKING_RECORD"
  | "NOTIFYING_TUTOR"
  | "CONFIRM"
  | "REJECT";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tutorName: string;
  tutorSubject: string;
  price: number;
  tutorId?: string;
  classId?: string;
  onBookingSuccess?: () => void;
}

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
];

export function BookingDialog({ 
  open, 
  onOpenChange, 
  tutorName, 
  tutorSubject, 
  price,
  tutorId,
  classId,
  onBookingSuccess
}: BookingDialogProps) {
  const { user } = useAuth();
  const [state, setState] = useState<BookingState>("BROWSING");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setState("BROWSING");
      setSelectedDate(undefined);
      setSelectedTime("");
    }
  }, [open]);

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
        setState("BROWSING");
        setSelectedTime("");
      }
    }, 1500);
  };

  const handleUserCancel = () => {
    setState("BROWSING");
    setSelectedTime("");
  };

  const handleConfirmBooking = async () => {
    setState("CREATING_BOOKING_RECORD");
    
    try {
      // Create booking via API if we have the necessary IDs
      if (classId && user?.id) {
        // Format time slot to backend expected format
        const formatTo24Hour = (time12: string): string => {
          const [time, modifier] = time12.split(' ');
          let [hours, minutes] = time.split(':');
          if (hours === '12') hours = '00';
          if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12);
          return `${hours.padStart(2, '0')}:${minutes || '00'}`;
        };

        const startTime = formatTo24Hour(selectedTime);
        const [hours] = startTime.split(':');
        const endTime = `${String(parseInt(hours, 10) + 1).padStart(2, '0')}:30`;

        const bookingData = {
          classId,
          slot: {
            date: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            startTime,
            endTime
          },
          message: `Session with ${tutorName} for ${tutorSubject}`
        };
        
        const response = await bookingsApi.create(bookingData);
        
        if (response.success && response.data) {
          setState("NOTIFYING_TUTOR");
          
          // Show success after a brief delay to simulate notification
          setTimeout(() => {
            setState("CONFIRM");
            toast.success("Booking request submitted! Waiting for tutor confirmation.");
            onBookingSuccess?.();
          }, 1500);
        } else {
          toast.error("Booking failed. Please try again.");
          setState("BROWSING");
        }
      } else {
        // Demo mode - simulate the flow without API
        console.log("Demo mode: No classId provided, simulating booking flow");
        setTimeout(() => {
          const success = Math.random() > 0.1;
          
          if (success) {
            setState("NOTIFYING_TUTOR");
            
            setTimeout(() => {
              const tutorAccepts = Math.random() > 0.2;
              
              if (tutorAccepts) {
                setState("CONFIRM");
                toast.success("Booking confirmed!");
                onBookingSuccess?.();
              } else {
                setState("REJECT");
                toast.error("Tutor is unavailable for this session.");
              }
            }, 2000);
          } else {
            toast.error("Booking failed. Please try again.");
            setState("BROWSING");
          }
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to create booking:', err);
      toast.error("Booking failed. Please try again.");
      setState("BROWSING");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const renderContent = () => {
    switch (state) {
      case "BROWSING":
        return (
          <div className="space-y-6 pt-4">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-800">Select Preferred Date</label>
              <div className="bg-white border-2 border-blue-200 rounded-xl p-3 shadow-sm">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md mx-auto"
                  classNames={{
                    months: "flex flex-col sm:flex-row gap-2",
                    month: "flex flex-col gap-4",
                    caption: "flex justify-center pt-1 relative items-center w-full",
                    caption_label: "text-sm font-semibold text-blue-900",
                    nav: "flex items-center gap-1",
                    nav_button: "h-7 w-7 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md p-0 flex items-center justify-center",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse",
                    head_row: "flex justify-around",
                    head_cell: "text-blue-600 font-semibold rounded-md w-9 text-[0.8rem]",
                    row: "flex w-full mt-2 justify-around",
                    cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-blue-100 [&:has([aria-selected])]:rounded-md",
                    day: "h-9 w-9 p-0 font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors",
                    day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white font-bold",
                    day_today: "bg-amber-100 text-amber-800 font-bold border-2 border-amber-400",
                    day_outside: "text-slate-300",
                    day_disabled: "text-slate-300 opacity-50 cursor-not-allowed",
                    day_hidden: "invisible",
                  }}
                />
              </div>
            </div>

            {selectedDate && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-800">Select Time Slot</label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      className={selectedTime === time 
                        ? "bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md" 
                        : "bg-white border-2 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 font-medium"}
                      onClick={() => handleTimeSlotSelect(time)}
                      disabled={!selectedDate}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t-2 border-slate-200">
              <Button variant="outline" onClick={handleClose} className="border-2 border-slate-300 text-slate-600 hover:bg-slate-100 font-medium">
                Back to Classes
              </Button>
            </div>
          </div>
        );

      case "CHECKING_AVAILABILITY":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#0052CC]" />
            <h3 className="text-xl text-blue-900">Checking Availability</h3>
            <p className="text-blue-600 text-center">
              Verifying tutor's free slot for<br />
              {selectedDate?.toLocaleDateString()} at {selectedTime}
            </p>
          </div>
        );

      case "AWAIT_CONFIRMATION":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-[#0052CC] mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-blue-700">Selected Time Slot</div>
                  <div className="text-blue-900">
                    {selectedDate?.toLocaleDateString("en-US", { 
                      weekday: "long", 
                      year: "numeric", 
                      month: "long", 
                      day: "numeric" 
                    })}
                  </div>
                  <div className="text-[#0052CC]">{selectedTime}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">Tutor</span>
                <span className="text-blue-900">{tutorName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">Subject</span>
                <span className="text-blue-900">{tutorSubject}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">Duration</span>
                <span className="text-blue-900">60 minutes</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="text-blue-900">Total</span>
                <span className="text-xl text-[#0052CC]">${price}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleUserCancel} className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50">
                Cancel
              </Button>
              <Button onClick={handleConfirmBooking} className="flex-1 bg-[#0052CC] hover:bg-blue-700">
                Confirm Booking
              </Button>
            </div>
          </div>
        );

      case "CREATING_BOOKING_RECORD":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#0052CC]" />
            <h3 className="text-xl text-blue-900">Creating Booking Record</h3>
            <p className="text-blue-600 text-center">
              Sending booking request to backend<br />
              to update the schedule in database
            </p>
          </div>
        );

      case "NOTIFYING_TUTOR":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#0052CC]" />
            <h3 className="text-xl text-blue-900">Notifying Tutor</h3>
            <p className="text-blue-600 text-center">
              Sending notification to tutor<br />
              Waiting for confirmation...
            </p>
          </div>
        );

      case "CONFIRM":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl text-blue-900">Session Confirmed!</h3>
            <p className="text-blue-600 text-center">
              Your booking has been confirmed.<br />
              You will receive a confirmation email shortly.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 w-full space-y-2">
              <div className="text-sm text-blue-700">Session Details</div>
              <div className="text-blue-900">{tutorName} - {tutorSubject}</div>
              <div className="text-sm text-blue-700">
                {selectedDate?.toLocaleDateString()} at {selectedTime}
              </div>
              <Badge className="mt-2 bg-green-600 text-white">Confirmed</Badge>
            </div>
            <Button onClick={handleClose} className="w-full bg-[#0052CC] hover:bg-blue-700">
              Done
            </Button>
          </div>
        );

      case "REJECT":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-xl text-blue-900">Session Not Confirmed</h3>
            <p className="text-blue-600 text-center">
              The tutor rejected the session or did not respond.<br />
              Please try selecting a different time slot.
            </p>
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={handleClose} className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50">
                Close
              </Button>
              <Button onClick={() => setState("BROWSING")} className="flex-1 bg-[#0052CC] hover:bg-blue-700">
                Try Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white border-2 border-blue-200 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-700 -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">
            {state === "BROWSING" || state === "CHECKING_AVAILABILITY" || state === "AWAIT_CONFIRMATION" 
              ? `Book Session with ${tutorName}`
              : state === "CONFIRM"
              ? "Booking Confirmed"
              : state === "REJECT"
              ? "Booking Failed"
              : "Processing Booking"
            }
          </DialogTitle>
          <p className="text-blue-100 text-sm mt-1">{tutorSubject}</p>
          <p className="text-blue-200 text-xs">Schedule: Tue, Thu - 10:00 AM</p>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
