import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  DollarSign, 
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { tutorsApi, bookingsApi, Tutor } from '../services/api';
import { TimeSlot } from '../types/tutor';

interface TutorDetailPageProps {
  tutorId: string;
  onBack: () => void;
}

export function TutorDetailPage({ tutorId, onBack }: TutorDetailPageProps) {
  const { user } = useAuth();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'pending' | 'confirmed' | 'rejected'>('idle');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Fetch tutor from API
  useEffect(() => {
    const fetchTutor = async () => {
      setIsLoading(true);
      try {
        const response = await tutorsApi.getById(tutorId);
        if (response.data) {
          setTutor(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch tutor:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTutor();
  }, [tutorId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading tutor details...</p>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Tutor not found</p>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Transform API availableSlots to TimeSlot format for slot selection
  const displaySlots: TimeSlot[] = tutor.availableSlots?.map(slot => ({
    date: slot.date,
    time: `${slot.startTime} - ${slot.endTime}`,
    available: slot.available
  })) || [];

  // Group slots by date
  const slotsByDate = displaySlots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  const handleSlotSelect = (slot: TimeSlot) => {
    if (slot.available && bookingStatus === 'idle') {
      setSelectedSlot(slot);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !user?.id || !tutor) return;
    
    setBookingStatus('pending');
    setShowConfirmation(true);

    try {
      // Create booking via API
      const bookingData = {
        studentId: user.id,
        tutorId: tutor.id,
        classId: '', // No specific class for direct tutor booking
        date: selectedSlot.date,
        timeSlot: selectedSlot.time,
        notes: `Direct booking with ${tutor.name}`
      };
      
      const response = await bookingsApi.create(bookingData);
      
      if (response.data) {
        // Booking created successfully, simulate tutor confirmation
        setTimeout(() => {
          const isAccepted = Math.random() > 0.2;
          setBookingStatus(isAccepted ? 'confirmed' : 'rejected');
        }, 2000);
      } else {
        setBookingStatus('rejected');
      }
    } catch (err) {
      console.error('Failed to create booking:', err);
      setBookingStatus('rejected');
    }
  };

  const handleReset = () => {
    setSelectedSlot(null);
    setBookingStatus('idle');
    setShowConfirmation(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tutors
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tutor Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <img
                    src={tutor.avatar}
                    alt={tutor.name}
                    className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                  />
                  <h2 className="text-2xl mb-2">{tutor.name}</h2>
                  <Badge variant="secondary" className="mb-4">
                    {tutor.subject}
                  </Badge>

                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span>{tutor.rating}</span>
                    <span className="text-gray-500">({tutor.reviewCount} reviews)</span>
                  </div>

                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Clock className="w-5 h-5" />
                      <span>{tutor.yearsOfExperience} years of experience</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <DollarSign className="w-5 h-5" />
                      <span>{(tutor.hourlyRate / 1000).toFixed(0)}K VND per hour</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tutor.expertise.map((exp, idx) => (
                    <Badge key={idx} variant="outline">
                      {exp}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{tutor.bio}</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Available Time Slots
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(slotsByDate).map(([date, slots]) => (
                  <div key={date}>
                    <h3 className="mb-3 text-gray-700">
                      {formatDate(date)}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {slots.map(slot => (
                        <button
                          key={slot.id}
                          onClick={() => handleSlotSelect(slot)}
                          disabled={!slot.available || bookingStatus !== 'idle'}
                          className={`
                            p-3 rounded-lg border-2 transition-all text-sm
                            ${slot.available && bookingStatus === 'idle'
                              ? selectedSlot?.id === slot.id
                                ? 'border-[#0A4D8C] bg-[#0A4D8C] text-white'
                                : 'border-gray-300 hover:border-[#0A4D8C] bg-white'
                              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            }
                          `}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span>{slot.startTime}</span>
                            <span className="text-xs opacity-75">-</span>
                            <span>{slot.endTime}</span>
                            {!slot.available && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Booked
                              </Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {tutor.availableSlots.filter(s => s.available).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <XCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No available slots at the moment</p>
                    <p className="text-sm">Please check back later</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Summary */}
            {selectedSlot && bookingStatus === 'idle' && (
              <Card className="border-[#0A4D8C]">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tutor:</span>
                      <span>{tutor.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subject:</span>
                      <span>{tutor.subject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span>{formatDate(selectedSlot.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span>{selectedSlot.startTime} - {selectedSlot.endTime}</span>
                    </div>
                    <div className="flex justify-between text-lg pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-[#0A4D8C]">
                        {(tutor.hourlyRate / 1000).toFixed(0)}K VND
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleReset}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-[#0A4D8C] hover:bg-[#083A6B]"
                      onClick={handleBooking}
                    >
                      Confirm Booking
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Status */}
            {showConfirmation && (
              <Card>
                <CardContent className="pt-6">
                  {bookingStatus === 'pending' && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p>Your booking request has been sent to {tutor.name}</p>
                          <p className="text-sm text-gray-600">
                            Waiting for tutor confirmation...
                          </p>
                          <div className="flex gap-2 mt-3">
                            <div className="w-2 h-2 bg-[#0A4D8C] rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-[#0A4D8C] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-[#0A4D8C] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {bookingStatus === 'confirmed' && (
                    <Alert className="border-green-500 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="text-green-800">Booking Confirmed!</p>
                          <p className="text-sm text-green-700">
                            {tutor.name} has accepted your booking request.
                          </p>
                          <p className="text-sm text-green-700">
                            Session: {formatDate(selectedSlot!.date)} at {selectedSlot!.startTime}
                          </p>
                          <Button
                            className="mt-3 bg-green-600 hover:bg-green-700"
                            onClick={() => onBack()}
                          >
                            Back to Tutors
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {bookingStatus === 'rejected' && (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p>Booking Request Declined</p>
                          <p className="text-sm">
                            Unfortunately, {tutor.name} is not available for this time slot.
                          </p>
                          <p className="text-sm">Please select another time slot.</p>
                          <Button
                            variant="outline"
                            className="mt-3"
                            onClick={handleReset}
                          >
                            Choose Another Slot
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
