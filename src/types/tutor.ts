export interface Tutor {
  id: string;
  name: string;
  avatar: string;
  subject: string;
  expertise: string[];
  rating: number;
  reviews: number;
  hourlyRate: number;
  yearsOfExperience: number;
  bio: string;
  availableSlots: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface BookingRequest {
  tutorId: string;
  slotId: string;
  studentId: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed';
  createdAt: string;
}
