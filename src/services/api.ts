/**
 * API Service for Tutor Support System
 * 
 * This file provides a centralized way to interact with the backend API.
 * Replace the mock data imports in your components with these API calls.
 */

const API_BASE = 'http://localhost:3001/api';

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

export const getAuthToken = (): string | null => {
  if (!authToken) {
    authToken = localStorage.getItem('authToken');
  }
  return authToken;
};

// Helper for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'API request failed');
  }

  return data;
}

// ===========================================
// AUTH API
// ===========================================

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
    expiresIn: number;
  };
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'Student' | 'Tutor' | 'CTSV';
  avatar?: string;
}

export const authApi = {
  login: async (username: string, password: string, role: string): Promise<LoginResponse> => {
    const response = await apiCall<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    });
    
    if (response.success && response.data.accessToken) {
      setAuthToken(response.data.accessToken);
    }
    
    return response;
  },

  logout: async (): Promise<void> => {
    try {
      await apiCall('/auth/logout', { method: 'POST' });
    } finally {
      setAuthToken(null);
    }
  },

  getCurrentUser: async (): Promise<{ success: boolean; data: User }> => {
    return apiCall('/auth/me');
  },
};

// ===========================================
// TUTORS API
// ===========================================

export interface Tutor {
  id: string;
  name: string;
  avatar: string;
  subject: string;
  expertise: string[];
  rating: number;
  reviewCount: number;
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

export interface TutorsResponse {
  success: boolean;
  data: {
    tutors: Tutor[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

export const tutorsApi = {
  getAll: async (params?: {
    subject?: string;
    rating_min?: number;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<TutorsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.subject) queryParams.set('subject', params.subject);
    if (params?.rating_min) queryParams.set('rating_min', String(params.rating_min));
    if (params?.search) queryParams.set('search', params.search);
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));

    const query = queryParams.toString();
    return apiCall(`/tutors${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<{ success: boolean; data: Tutor }> => {
    return apiCall(`/tutors/${id}`);
  },

  getAvailability: async (id: string): Promise<{ success: boolean; data: { tutorId: string; slots: TimeSlot[] } }> => {
    return apiCall(`/tutors/${id}/availability`);
  },

  updateAvailability: async (id: string, slots: TimeSlot[]): Promise<{ success: boolean; message: string }> => {
    return apiCall(`/tutors/${id}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ slots }),
    });
  },
};

// ===========================================
// CLASSES API
// ===========================================

export interface Class {
  id: string;
  name: string;
  subject: string;
  tutorId: string;
  tutorName: string;
  tutorEmail: string;
  description: string;
  schedule: string;
  maxStudents: number;
  enrolledStudents: number;
  pendingBookings: number;
  location: string;
  status: string;
  nextSession: string;
  totalSessions: number;
  completedSessions: number;
  materials: Material[];
}

export interface Material {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

export const classesApi = {
  getAll: async (params?: {
    tutorId?: string;
    subject?: string;
    status?: string;
  }): Promise<{ success: boolean; data: { classes: Class[] } }> => {
    const queryParams = new URLSearchParams();
    if (params?.tutorId) queryParams.set('tutorId', params.tutorId);
    if (params?.subject) queryParams.set('subject', params.subject);
    if (params?.status) queryParams.set('status', params.status);

    const query = queryParams.toString();
    return apiCall(`/classes${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<{ success: boolean; data: Class }> => {
    return apiCall(`/classes/${id}`);
  },

  create: async (classData: Partial<Class>): Promise<{ success: boolean; data: Class }> => {
    return apiCall('/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  },

  uploadMaterial: async (classId: string, material: { name: string; type: string; size: string }): Promise<{ success: boolean; data: Material }> => {
    return apiCall(`/classes/${classId}/materials`, {
      method: 'POST',
      body: JSON.stringify(material),
    });
  },
};

// ===========================================
// BOOKINGS API
// ===========================================

export interface Booking {
  id: string;
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  tutorId: string;
  tutorName: string;
  slot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlternativeSlot {
  id: string;
  date: string;
  day: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface WaitlistEntry {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  classId: string | null;
  className: string | null;
  tutorId: string | null;
  tutorName: string | null;
  preferredSlots: Array<{ date: string; startTime: string; endTime: string }>;
  reason: string;
  status: 'waiting' | 'notified' | 'fulfilled';
  createdAt: string;
  notifiedAt: string | null;
}

export const bookingsApi = {
  getAll: async (params?: {
    status?: string;
    classId?: string;
  }): Promise<{ success: boolean; data: { bookings: Booking[] } }> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.classId) queryParams.set('classId', params.classId);

    const query = queryParams.toString();
    return apiCall(`/bookings${query ? `?${query}` : ''}`);
  },

  create: async (bookingData: {
    classId: string;
    slot?: { date: string; startTime: string; endTime: string };
    message?: string;
  }): Promise<{ success: boolean; data: Booking }> => {
    return apiCall('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  updateStatus: async (id: string, status: 'confirmed' | 'rejected', reason?: string): Promise<{ success: boolean; data: Booking }> => {
    return apiCall(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },

  cancel: async (id: string, reason: string, details?: string): Promise<{ success: boolean; message: string }> => {
    return apiCall(`/bookings/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason, details }),
    });
  },

  getAlternativeSlots: async (id: string): Promise<{ 
    success: boolean; 
    data: { 
      currentBooking: {
        id: string;
        className: string;
        tutorName: string;
        currentSlot: { date: string; startTime: string; endTime: string };
      };
      alternativeSlots: AlternativeSlot[];
    } 
  }> => {
    return apiCall(`/bookings/${id}/alternative-slots`);
  },

  reschedule: async (id: string, newSlot: { date: string; startTime: string; endTime: string }): Promise<{ 
    success: boolean; 
    data: { booking: Booking; message: string } 
  }> => {
    return apiCall(`/bookings/${id}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify({ newSlot }),
    });
  },
};

// ===========================================
// WAITLIST API
// ===========================================

export const waitlistApi = {
  add: async (data: {
    classId?: string;
    tutorId?: string;
    preferredSlots?: Array<{ date: string; startTime: string; endTime: string }>;
    reason?: string;
  }): Promise<{ success: boolean; data: { waitlistEntry: WaitlistEntry; message: string } }> => {
    return apiCall('/waitlist', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAll: async (): Promise<{ success: boolean; data: { waitlist: WaitlistEntry[] } }> => {
    return apiCall('/waitlist');
  },

  remove: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiCall(`/waitlist/${id}`, {
      method: 'DELETE',
    });
  },
};

// ===========================================
// ENROLLMENTS API
// ===========================================

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  className: string;
  subject: string;
  tutorId: string;
  tutorName: string;
  tutorEmail: string;
  schedule: string;
  nextSession: string;
  totalSessions: number;
  completedSessions: number;
  grade: number | null;
  feedback: string | null;
  enrolledAt: string;
  materials: Material[];
}

export interface EnrolledStudent {
  enrollmentId: string;
  studentId: string;
  name: string;
  email: string;
  enrolledAt: string;
  grade: number | null;
  feedback: string | null;
  completedSessions: number;
  totalSessions: number;
}

export const enrollmentsApi = {
  getAll: async (): Promise<{ success: boolean; data: { enrollments: Enrollment[] } }> => {
    return apiCall('/enrollments');
  },

  getByStudentId: async (studentId: string): Promise<{ success: boolean; data: { enrollments: Enrollment[] } }> => {
    return apiCall(`/students/${studentId}/enrollments`);
  },

  updateGrade: async (enrollmentId: string, data: { grade?: number; feedback?: string }): Promise<{ success: boolean; data: Enrollment }> => {
    return apiCall(`/enrollments/${enrollmentId}/grade`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  cancel: async (enrollmentId: string, reason: string, details: string): Promise<{ success: boolean; data: { message: string; enrollment: Enrollment } }> => {
    return apiCall(`/enrollments/${enrollmentId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason, details }),
    });
  },

  getClassStudents: async (classId: string): Promise<{ success: boolean; data: { students: EnrolledStudent[] } }> => {
    return apiCall(`/classes/${classId}/students`);
  },
};

// ===========================================
// RISK ASSESSMENT API (CTSV)
// ===========================================

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
  interventions: Intervention[];
}

export interface Intervention {
  id: string;
  type: string;
  notes: string;
  status: string;
  createdAt: string;
  createdBy: string;
}

export const riskAssessmentApi = {
  getAtRiskStudents: async (params?: {
    riskLevel?: 'high' | 'medium' | 'low';
  }): Promise<{ success: boolean; data: { students: AtRiskStudent[]; summary: any } }> => {
    const queryParams = new URLSearchParams();
    if (params?.riskLevel) queryParams.set('riskLevel', params.riskLevel);

    const query = queryParams.toString();
    return apiCall(`/risk-assessment${query ? `?${query}` : ''}`);
  },

  runDetection: async (params?: {
    threshold?: number;
    attendanceThreshold?: number;
    gradeThreshold?: number;
    policyName?: string;
  }): Promise<{ success: boolean; data: any }> => {
    return apiCall('/risk-detection/run', { 
      method: 'POST',
      body: JSON.stringify(params || {})
    });
  },

  getStudentDetails: async (id: string): Promise<{ success: boolean; data: AtRiskStudent }> => {
    return apiCall(`/risk-assessment/students/${id}`);
  },

  createIntervention: async (data: {
    studentId: string;
    interventionType: string;
    notes: string;
    notifyStudent: boolean;
    notifyParent: boolean;
    notifyMethod: string[];
    followUpDate?: string;
    assignedTo?: string;
  }): Promise<{ success: boolean; data: any }> => {
    return apiCall('/interventions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAllInterventions: async (): Promise<{ success: boolean; data: { interventions: (Intervention & { studentId: string; studentName: string })[] } }> => {
    return apiCall('/interventions');
  },

  getStudentInterventions: async (studentId: string): Promise<{ success: boolean; data: { studentId: string; studentName: string; interventions: Intervention[] } }> => {
    return apiCall(`/interventions/student/${studentId}`);
  },

  updateIntervention: async (id: string, data: Partial<Intervention>): Promise<{ success: boolean; data: Intervention }> => {
    return apiCall(`/interventions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// ===========================================
// NOTIFICATIONS API
// ===========================================

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl: string;
  createdAt: string;
}

export const notificationsApi = {
  getAll: async (): Promise<{ success: boolean; data: { notifications: Notification[]; unreadCount: number } }> => {
    return apiCall('/notifications');
  },

  markAsRead: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiCall(`/notifications/${id}/read`, { method: 'PUT' });
  },

  poll: async (since?: string): Promise<{ success: boolean; data: { notifications: Notification[]; unreadCount: number; timestamp: string } }> => {
    const params = since ? `?since=${encodeURIComponent(since)}` : '';
    return apiCall(`/notifications/poll${params}`);
  },
};

// ===========================================
// DASHBOARD API
// ===========================================

export const dashboardApi = {
  getStudentDashboard: async (): Promise<{ success: boolean; data: any }> => {
    return apiCall('/dashboard/student');
  },

  getTutorDashboard: async (): Promise<{ success: boolean; data: any }> => {
    return apiCall('/dashboard/tutor');
  },

  getCTSVDashboard: async (): Promise<{ success: boolean; data: any }> => {
    return apiCall('/dashboard/ctsv');
  },
};

// ===========================================
// SUBJECTS API
// ===========================================

export const subjectsApi = {
  getAll: async (): Promise<{ success: boolean; data: { subjects: Array<{ id: string; name: string; tutorCount: number }> } }> => {
    return apiCall('/subjects');
  },
};

// Export all APIs
export const api = {
  auth: authApi,
  tutors: tutorsApi,
  classes: classesApi,
  bookings: bookingsApi,
  enrollments: enrollmentsApi,
  waitlist: waitlistApi,
  riskAssessment: riskAssessmentApi,
  notifications: notificationsApi,
  dashboard: dashboardApi,
  subjects: subjectsApi,
};

export default api;
