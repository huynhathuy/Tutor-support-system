/**
 * Tutor Support System - MVP Backend Server
 * 
 * A simple Express.js server using JSON files for data storage.
 * Designed for rapid prototyping and demonstration purposes.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// ===========================================
// DATA HELPERS
// ===========================================

const DATA_DIR = path.join(__dirname, 'data');

function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return [];
  }
}

function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error.message);
    return false;
  }
}

// Simple token storage (in-memory for MVP)
const activeSessions = new Map();

// ===========================================
// AUTH MIDDLEWARE
// ===========================================

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
    });
  }

  req.user = session.user;
  req.token = token;
  next();
}

// Role-based access control
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resource' }
      });
    }
    next();
  };
}

// ===========================================
// AUTH ROUTES
// ===========================================

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Username, password, and role are required' }
    });
  }

  const users = readJSON('users.json');
  const user = users.find(u => 
    u.username === username && 
    u.password === password && 
    u.role === role
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username, password, or role' }
    });
  }

  // Generate a fake token
  const token = `fake-token-${uuidv4()}`;
  
  // Store session
  const { password: _, ...userWithoutPassword } = user;
  activeSessions.set(token, { user: userWithoutPassword, createdAt: new Date() });

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      accessToken: token,
      expiresIn: 86400 // 24 hours (fake)
    }
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', authMiddleware, (req, res) => {
  activeSessions.delete(req.token);
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

// ===========================================
// USER ROUTES
// ===========================================

// GET /api/users/:id
app.get('/api/users/:id', authMiddleware, (req, res) => {
  const users = readJSON('users.json');
  const user = users.find(u => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' }
    });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    success: true,
    data: userWithoutPassword
  });
});

// GET /api/notifications
app.get('/api/notifications', authMiddleware, (req, res) => {
  const notifications = readJSON('notifications.json');
  const userNotifications = notifications.filter(n => n.userId === req.user.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  res.json({
    success: true,
    data: {
      notifications: userNotifications,
      unreadCount
    }
  });
});

// PUT /api/notifications/:id/read
app.put('/api/notifications/:id/read', authMiddleware, (req, res) => {
  const notifications = readJSON('notifications.json');
  const index = notifications.findIndex(n => n.id === req.params.id && n.userId === req.user.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Notification not found' }
    });
  }

  notifications[index].read = true;
  writeJSON('notifications.json', notifications);

  res.json({
    success: true,
    message: 'Notification marked as read'
  });
});

// ===========================================
// TUTOR ROUTES
// ===========================================

// GET /api/tutors
app.get('/api/tutors', (req, res) => {
  const tutors = readJSON('tutors.json');
  
  let filtered = [...tutors];

  // Filter by subject
  if (req.query.subject && req.query.subject !== 'All') {
    filtered = filtered.filter(t => t.subject === req.query.subject);
  }

  // Filter by minimum rating
  if (req.query.rating_min) {
    filtered = filtered.filter(t => t.rating >= parseFloat(req.query.rating_min));
  }

  // Search by name or subject
  if (req.query.search) {
    const searchLower = req.query.search.toLowerCase();
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(searchLower) ||
      t.subject.toLowerCase().includes(searchLower) ||
      t.expertise.some(e => e.toLowerCase().includes(searchLower))
    );
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedTutors = filtered.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      tutors: paginatedTutors,
      pagination: {
        page,
        limit,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / limit)
      }
    }
  });
});

// GET /api/tutors/:id
app.get('/api/tutors/:id', (req, res) => {
  const tutors = readJSON('tutors.json');
  const tutor = tutors.find(t => t.id === req.params.id);

  if (!tutor) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Tutor not found' }
    });
  }

  res.json({
    success: true,
    data: tutor
  });
});

// GET /api/tutors/:id/availability
app.get('/api/tutors/:id/availability', (req, res) => {
  const tutors = readJSON('tutors.json');
  const tutor = tutors.find(t => t.id === req.params.id);

  if (!tutor) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Tutor not found' }
    });
  }

  res.json({
    success: true,
    data: {
      tutorId: tutor.id,
      slots: tutor.availableSlots || []
    }
  });
});

// PUT /api/tutors/:id/availability
app.put('/api/tutors/:id/availability', authMiddleware, requireRole('Tutor'), (req, res) => {
  const tutors = readJSON('tutors.json');
  const index = tutors.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Tutor not found' }
    });
  }

  // Update availability slots
  if (req.body.slots) {
    tutors[index].availableSlots = req.body.slots;
  }

  writeJSON('tutors.json', tutors);

  res.json({
    success: true,
    message: 'Availability updated successfully'
  });
});

// ===========================================
// SUBJECTS ROUTES
// ===========================================

// GET /api/subjects
app.get('/api/subjects', (req, res) => {
  const tutors = readJSON('tutors.json');
  
  // Extract unique subjects with count
  const subjectMap = {};
  tutors.forEach(t => {
    if (!subjectMap[t.subject]) {
      subjectMap[t.subject] = { name: t.subject, tutorCount: 0 };
    }
    subjectMap[t.subject].tutorCount++;
  });

  const subjects = Object.values(subjectMap).map((s, i) => ({
    id: `sub_${String(i + 1).padStart(3, '0')}`,
    ...s
  }));

  res.json({
    success: true,
    data: { subjects }
  });
});

// ===========================================
// CLASS ROUTES
// ===========================================

// GET /api/classes
app.get('/api/classes', (req, res) => {
  const classes = readJSON('classes.json');
  const tutors = readJSON('tutors.json');
  
  let filtered = [...classes];

  // Filter by tutor - support both tutorId (tut_xxx) and userId (tutor1)
  if (req.query.tutorId) {
    // Check if it's a userId (from auth) and convert to tutorId
    const tutor = tutors.find(t => t.userId === req.query.tutorId);
    const actualTutorId = tutor ? tutor.id : req.query.tutorId;
    filtered = filtered.filter(c => c.tutorId === actualTutorId);
  }

  // Filter by subject
  if (req.query.subject) {
    filtered = filtered.filter(c => c.subject === req.query.subject);
  }

  // Filter by status
  if (req.query.status) {
    filtered = filtered.filter(c => c.status === req.query.status);
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedClasses = filtered.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      classes: paginatedClasses,
      pagination: {
        page,
        limit,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / limit)
      }
    }
  });
});

// GET /api/classes/:id
app.get('/api/classes/:id', (req, res) => {
  const classes = readJSON('classes.json');
  const classItem = classes.find(c => c.id === req.params.id);

  if (!classItem) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Class not found' }
    });
  }

  res.json({
    success: true,
    data: classItem
  });
});

// POST /api/classes
app.post('/api/classes', authMiddleware, requireRole('Tutor'), (req, res) => {
  const classes = readJSON('classes.json');
  const tutors = readJSON('tutors.json');
  
  // Find tutor info
  const tutor = tutors.find(t => t.userId === req.user.id) || tutors[0];

  const newClass = {
    id: `cls_${String(classes.length + 1).padStart(3, '0')}`,
    name: req.body.name,
    subject: req.body.subject,
    tutorId: tutor?.id || req.user.id,
    tutorName: req.user.name,
    tutorEmail: req.user.email,
    description: req.body.description || '',
    schedule: req.body.schedule || '',
    maxStudents: req.body.maxStudents || 40,
    enrolledStudents: 0,
    pendingBookings: 0,
    location: req.body.location || 'TBA',
    status: 'active',
    nextSession: req.body.nextSession || new Date().toISOString(),
    totalSessions: req.body.totalSessions || 12,
    completedSessions: 0,
    materials: [],
    createdAt: new Date().toISOString()
  };

  classes.push(newClass);
  writeJSON('classes.json', classes);

  res.status(201).json({
    success: true,
    data: newClass
  });
});

// POST /api/classes/:id/materials (fake upload)
app.post('/api/classes/:id/materials', authMiddleware, requireRole('Tutor'), (req, res) => {
  const classes = readJSON('classes.json');
  const index = classes.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Class not found' }
    });
  }

  // Fake material upload - just accept the request
  const newMaterial = {
    id: `mat_${uuidv4().substring(0, 8)}`,
    name: req.body.name || 'Uploaded File.pdf',
    type: req.body.type || 'PDF',
    size: req.body.size || '1.0 MB',
    uploadedAt: new Date().toISOString()
  };

  classes[index].materials = classes[index].materials || [];
  classes[index].materials.push(newMaterial);
  writeJSON('classes.json', classes);

  res.status(201).json({
    success: true,
    data: newMaterial,
    message: 'Material uploaded successfully'
  });
});

// ===========================================
// BOOKING ROUTES
// ===========================================

// GET /api/bookings
app.get('/api/bookings', authMiddleware, (req, res) => {
  const bookings = readJSON('bookings.json');
  
  let filtered = [...bookings];

  // Filter based on user role
  if (req.user.role === 'Student') {
    filtered = filtered.filter(b => b.studentId === req.user.id);
  } else if (req.user.role === 'Tutor') {
    // Get tutor's classes
    const tutors = readJSON('tutors.json');
    const tutor = tutors.find(t => t.userId === req.user.id);
    if (tutor) {
      filtered = filtered.filter(b => b.tutorId === tutor.id);
    }
  }

  // Filter by status
  if (req.query.status) {
    filtered = filtered.filter(b => b.status === req.query.status);
  }

  // Filter by class
  if (req.query.classId) {
    filtered = filtered.filter(b => b.classId === req.query.classId);
  }

  res.json({
    success: true,
    data: {
      bookings: filtered
    }
  });
});

// POST /api/bookings
app.post('/api/bookings', authMiddleware, requireRole('Student'), (req, res) => {
  const bookings = readJSON('bookings.json');
  const classes = readJSON('classes.json');
  const tutors = readJSON('tutors.json');

  const classItem = classes.find(c => c.id === req.body.classId);
  if (!classItem) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Class not found' }
    });
  }

  const tutor = tutors.find(t => t.id === classItem.tutorId);

  const newBooking = {
    id: `bkg_${String(bookings.length + 1).padStart(3, '0')}`,
    classId: req.body.classId,
    className: classItem.name,
    studentId: req.user.id,
    studentName: req.user.name,
    studentEmail: req.user.email,
    tutorId: classItem.tutorId,
    tutorName: classItem.tutorName,
    slot: req.body.slot || {
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:30'
    },
    status: 'pending',
    message: req.body.message || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  bookings.push(newBooking);
  writeJSON('bookings.json', bookings);

  // Update class pending count
  const classIndex = classes.findIndex(c => c.id === req.body.classId);
  if (classIndex !== -1) {
    classes[classIndex].pendingBookings = (classes[classIndex].pendingBookings || 0) + 1;
    writeJSON('classes.json', classes);
  }

  // Create notification for tutor
  const notifications = readJSON('notifications.json');
  const tutorUser = readJSON('users.json').find(u => u.role === 'Tutor');
  if (tutorUser) {
    notifications.push({
      id: `ntf_${uuidv4().substring(0, 8)}`,
      userId: tutorUser.id,
      type: 'booking_request',
      title: 'New Booking Request',
      message: `${req.user.name} requested to join ${classItem.name}`,
      read: false,
      actionUrl: `/bookings/${newBooking.id}`,
      createdAt: new Date().toISOString()
    });
    writeJSON('notifications.json', notifications);
  }

  res.status(201).json({
    success: true,
    data: newBooking
  });
});

// PATCH /api/bookings/:id
app.patch('/api/bookings/:id', authMiddleware, (req, res) => {
  const bookings = readJSON('bookings.json');
  const index = bookings.findIndex(b => b.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Booking not found' }
    });
  }

  const booking = bookings[index];
  const oldStatus = booking.status;

  // Update status
  if (req.body.status) {
    bookings[index].status = req.body.status;
    bookings[index].updatedAt = new Date().toISOString();

    // If confirmed, create enrollment and update class
    if (req.body.status === 'confirmed' && oldStatus === 'pending') {
      const enrollments = readJSON('enrollments.json');
      const classes = readJSON('classes.json');
      
      const classItem = classes.find(c => c.id === booking.classId);
      
      const newEnrollment = {
        id: `enr_${String(enrollments.length + 1).padStart(3, '0')}`,
        studentId: booking.studentId,
        classId: booking.classId,
        className: booking.className,
        subject: classItem?.subject || '',
        tutorId: booking.tutorId,
        tutorName: booking.tutorName,
        tutorEmail: classItem?.tutorEmail || '',
        schedule: classItem?.schedule || '',
        nextSession: classItem?.nextSession || '',
        totalSessions: classItem?.totalSessions || 12,
        completedSessions: 0,
        grade: null,
        feedback: null,
        enrolledAt: new Date().toISOString(),
        materials: classItem?.materials || []
      };

      enrollments.push(newEnrollment);
      writeJSON('enrollments.json', enrollments);

      // Update class enrollment count
      const classIndex = classes.findIndex(c => c.id === booking.classId);
      if (classIndex !== -1) {
        classes[classIndex].enrolledStudents = (classes[classIndex].enrolledStudents || 0) + 1;
        classes[classIndex].pendingBookings = Math.max(0, (classes[classIndex].pendingBookings || 1) - 1);
        writeJSON('classes.json', classes);
      }

      // Create notification for student
      const notifications = readJSON('notifications.json');
      notifications.push({
        id: `ntf_${uuidv4().substring(0, 8)}`,
        userId: booking.studentId,
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: `Your booking for ${booking.className} has been confirmed`,
        read: false,
        actionUrl: `/enrollments/${newEnrollment.id}`,
        createdAt: new Date().toISOString()
      });
      writeJSON('notifications.json', notifications);
    }

    // If rejected, create notification
    if (req.body.status === 'rejected') {
      const notifications = readJSON('notifications.json');
      notifications.push({
        id: `ntf_${uuidv4().substring(0, 8)}`,
        userId: booking.studentId,
        type: 'booking_rejected',
        title: 'Booking Rejected',
        message: `Your booking for ${booking.className} was rejected${req.body.reason ? `: ${req.body.reason}` : ''}`,
        read: false,
        actionUrl: `/bookings/${booking.id}`,
        createdAt: new Date().toISOString()
      });
      writeJSON('notifications.json', notifications);

      // Update class pending count
      const classes = readJSON('classes.json');
      const classIndex = classes.findIndex(c => c.id === booking.classId);
      if (classIndex !== -1) {
        classes[classIndex].pendingBookings = Math.max(0, (classes[classIndex].pendingBookings || 1) - 1);
        writeJSON('classes.json', classes);
      }
    }
  }

  // Add rejection reason if provided
  if (req.body.reason) {
    bookings[index].rejectionReason = req.body.reason;
  }

  writeJSON('bookings.json', bookings);

  res.json({
    success: true,
    data: bookings[index]
  });
});

// DELETE /api/bookings/:id (Cancel)
app.delete('/api/bookings/:id', authMiddleware, (req, res) => {
  const bookings = readJSON('bookings.json');
  const index = bookings.findIndex(b => b.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Booking not found' }
    });
  }

  const booking = bookings[index];

  // Only allow cancellation by the student who made the booking
  if (req.user.role === 'Student' && booking.studentId !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You can only cancel your own bookings' }
    });
  }

  // Store cancellation info
  bookings[index].status = 'cancelled';
  bookings[index].cancelReason = req.body.reason || '';
  bookings[index].cancelDetails = req.body.details || '';
  bookings[index].updatedAt = new Date().toISOString();

  writeJSON('bookings.json', bookings);

  // Update class pending count if was pending
  if (booking.status === 'pending') {
    const classes = readJSON('classes.json');
    const classIndex = classes.findIndex(c => c.id === booking.classId);
    if (classIndex !== -1) {
      classes[classIndex].pendingBookings = Math.max(0, (classes[classIndex].pendingBookings || 1) - 1);
      writeJSON('classes.json', classes);
    }
  }

  res.json({
    success: true,
    message: 'Booking cancelled successfully'
  });
});

// GET /api/bookings/:id/alternative-slots - Get alternative time slots for rescheduling
app.get('/api/bookings/:id/alternative-slots', authMiddleware, (req, res) => {
  const bookings = readJSON('bookings.json');
  const booking = bookings.find(b => b.id === req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Booking not found' }
    });
  }

  // Get class info for the tutor's schedule
  const classes = readJSON('classes.json');
  const classItem = classes.find(c => c.id === booking.classId);
  
  // Get all existing bookings for this tutor to check availability
  const tutorBookings = bookings.filter(b => 
    b.tutorId === booking.tutorId && 
    b.status !== 'cancelled' && 
    b.id !== booking.id
  );

  // Generate alternative slots for the next 7 days
  const alternativeSlots = [];
  const today = new Date();
  
  const timeSlots = [
    { startTime: '09:00', endTime: '10:00' },
    { startTime: '10:00', endTime: '11:00' },
    { startTime: '11:00', endTime: '12:00' },
    { startTime: '13:00', endTime: '14:00' },
    { startTime: '14:00', endTime: '15:00' },
    { startTime: '15:00', endTime: '16:00' },
    { startTime: '16:00', endTime: '17:00' },
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const dateStr = date.toISOString().split('T')[0];
    const dayName = dayNames[date.getDay()];

    // Check each time slot
    timeSlots.forEach((slot, idx) => {
      // Check if slot is already booked
      const isBooked = tutorBookings.some(b => 
        b.slot.date === dateStr && 
        b.slot.startTime === slot.startTime
      );

      // Randomly mark some slots as unavailable for demo purposes
      // In a real system, this would check tutor's actual availability
      const isAvailable = !isBooked && Math.random() > 0.3;

      alternativeSlots.push({
        id: `slot_${dateStr}_${idx}`,
        date: dateStr,
        day: dayName,
        startTime: slot.startTime,
        endTime: slot.endTime,
        available: isAvailable
      });
    });
  }

  res.json({
    success: true,
    data: {
      currentBooking: {
        id: booking.id,
        className: booking.className,
        tutorName: booking.tutorName,
        currentSlot: booking.slot
      },
      alternativeSlots: alternativeSlots.slice(0, 10) // Return max 10 slots
    }
  });
});

// PUT /api/bookings/:id/reschedule - Reschedule a booking to a new time slot
app.put('/api/bookings/:id/reschedule', authMiddleware, (req, res) => {
  const bookings = readJSON('bookings.json');
  const index = bookings.findIndex(b => b.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Booking not found' }
    });
  }

  const booking = bookings[index];

  // Verify ownership
  if (req.user.role === 'Student' && booking.studentId !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You can only reschedule your own bookings' }
    });
  }

  // Validate new slot data
  const { newSlot } = req.body;
  if (!newSlot || !newSlot.date || !newSlot.startTime || !newSlot.endTime) {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'New slot information is required' }
    });
  }

  // Store old slot for notification
  const oldSlot = { ...booking.slot };

  // Update the booking with new slot
  bookings[index].slot = {
    date: newSlot.date,
    startTime: newSlot.startTime,
    endTime: newSlot.endTime
  };
  bookings[index].updatedAt = new Date().toISOString();
  bookings[index].rescheduledFrom = oldSlot;
  bookings[index].rescheduledAt = new Date().toISOString();

  writeJSON('bookings.json', bookings);

  // Create notification for tutor about rescheduling
  const notifications = readJSON('notifications.json');
  const tutors = readJSON('tutors.json');
  const tutor = tutors.find(t => t.id === booking.tutorId);
  
  if (tutor) {
    notifications.push({
      id: `ntf_${uuidv4().substring(0, 8)}`,
      userId: tutor.userId,
      type: 'booking_rescheduled',
      title: 'Booking Rescheduled',
      message: `${req.user.name} rescheduled their session for ${booking.className} from ${oldSlot.date} to ${newSlot.date}`,
      read: false,
      actionUrl: `/bookings/${booking.id}`,
      createdAt: new Date().toISOString()
    });
    writeJSON('notifications.json', notifications);
  }

  res.json({
    success: true,
    data: {
      booking: bookings[index],
      message: 'Booking rescheduled successfully'
    }
  });
});

// ===========================================
// WAITLIST ROUTES
// ===========================================

// POST /api/waitlist - Add to waitlist for a slot
app.post('/api/waitlist', authMiddleware, (req, res) => {
  const waitlist = readJSON('waitlist.json') || [];
  
  const { classId, tutorId, preferredSlots, reason } = req.body;

  if (!classId && !tutorId) {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Either classId or tutorId is required' }
    });
  }

  // Check if already on waitlist
  const existing = waitlist.find(w => 
    w.studentId === req.user.id && 
    (w.classId === classId || w.tutorId === tutorId)
  );

  if (existing) {
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'You are already on the waitlist for this class/tutor' }
    });
  }

  const classes = readJSON('classes.json');
  const tutors = readJSON('tutors.json');
  
  const classItem = classes.find(c => c.id === classId);
  const tutor = tutors.find(t => t.id === tutorId);

  const newWaitlistEntry = {
    id: `wl_${uuidv4().substring(0, 8)}`,
    studentId: req.user.id,
    studentName: req.user.name,
    studentEmail: req.user.email,
    classId: classId || null,
    className: classItem?.name || null,
    tutorId: tutorId || classItem?.tutorId || null,
    tutorName: tutor?.name || classItem?.tutorName || null,
    preferredSlots: preferredSlots || [],
    reason: reason || 'Looking for available slot',
    status: 'waiting',
    createdAt: new Date().toISOString(),
    notifiedAt: null
  };

  waitlist.push(newWaitlistEntry);
  writeJSON('waitlist.json', waitlist);

  res.status(201).json({
    success: true,
    data: {
      waitlistEntry: newWaitlistEntry,
      message: 'You have been added to the waitlist. We will notify you when a slot becomes available.'
    }
  });
});

// GET /api/waitlist - Get user's waitlist entries
app.get('/api/waitlist', authMiddleware, (req, res) => {
  const waitlist = readJSON('waitlist.json') || [];
  
  let filtered = waitlist;
  if (req.user.role === 'Student') {
    filtered = waitlist.filter(w => w.studentId === req.user.id);
  } else if (req.user.role === 'Tutor') {
    const tutors = readJSON('tutors.json');
    const tutor = tutors.find(t => t.userId === req.user.id);
    if (tutor) {
      filtered = waitlist.filter(w => w.tutorId === tutor.id);
    }
  }

  res.json({
    success: true,
    data: {
      waitlist: filtered
    }
  });
});

// DELETE /api/waitlist/:id - Remove from waitlist
app.delete('/api/waitlist/:id', authMiddleware, (req, res) => {
  const waitlist = readJSON('waitlist.json') || [];
  const index = waitlist.findIndex(w => w.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Waitlist entry not found' }
    });
  }

  // Verify ownership
  if (req.user.role === 'Student' && waitlist[index].studentId !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You can only remove your own waitlist entries' }
    });
  }

  waitlist.splice(index, 1);
  writeJSON('waitlist.json', waitlist);

  res.json({
    success: true,
    message: 'Removed from waitlist successfully'
  });
});

// ===========================================
// ENROLLMENT ROUTES
// ===========================================

// GET /api/students/:id/enrollments
app.get('/api/students/:id/enrollments', authMiddleware, (req, res) => {
  const enrollments = readJSON('enrollments.json');
  
  // Filter by student ID
  let studentEnrollments = enrollments.filter(e => e.studentId === req.params.id);

  res.json({
    success: true,
    data: {
      enrollments: studentEnrollments
    }
  });
});

// GET /api/enrollments (for current user)
app.get('/api/enrollments', authMiddleware, (req, res) => {
  const enrollments = readJSON('enrollments.json');
  
  let filtered = [...enrollments];

  if (req.user.role === 'Student') {
    filtered = filtered.filter(e => e.studentId === req.user.id);
  }

  res.json({
    success: true,
    data: {
      enrollments: filtered
    }
  });
});

// DELETE /api/enrollments/:id - Student cancels/drops enrollment
app.delete('/api/enrollments/:id', authMiddleware, (req, res) => {
  const enrollments = readJSON('enrollments.json');
  const index = enrollments.findIndex(e => e.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Enrollment not found' }
    });
  }

  const enrollment = enrollments[index];

  // Students can only cancel their own enrollments
  if (req.user.role === 'Student' && enrollment.studentId !== req.user.id) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You can only cancel your own enrollments' }
    });
  }

  // Remove the enrollment
  const cancelledEnrollment = enrollments.splice(index, 1)[0];
  writeJSON('enrollments.json', enrollments);

  // Update class enrollment count
  const classes = readJSON('classes.json');
  const classIndex = classes.findIndex(c => c.id === cancelledEnrollment.classId);
  if (classIndex !== -1) {
    classes[classIndex].enrolledStudents = Math.max(0, (classes[classIndex].enrolledStudents || 1) - 1);
    writeJSON('classes.json', classes);
  }

  // Create notification for tutor
  const notifications = readJSON('notifications.json');
  const reason = req.body?.reason || 'No reason provided';
  const details = req.body?.details || '';
  
  notifications.push({
    id: `ntf_${uuidv4().substring(0, 8)}`,
    userId: cancelledEnrollment.tutorId,
    type: 'enrollment_cancelled',
    title: 'Student Dropped Class',
    message: `${req.user.name || 'A student'} has dropped ${cancelledEnrollment.className}. Reason: ${reason}${details ? ` - ${details}` : ''}`,
    read: false,
    actionUrl: `/classes/${cancelledEnrollment.classId}`,
    createdAt: new Date().toISOString()
  });
  writeJSON('notifications.json', notifications);

  res.json({
    success: true,
    data: {
      message: 'Enrollment cancelled successfully',
      enrollment: cancelledEnrollment
    }
  });
});

// ===========================================
// GRADE & FEEDBACK ROUTES
// ===========================================

// PUT /api/enrollments/:id/grade - Tutor updates student grade
app.put('/api/enrollments/:id/grade', authMiddleware, requireRole('Tutor'), (req, res) => {
  const enrollments = readJSON('enrollments.json');
  const index = enrollments.findIndex(e => e.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Enrollment not found' }
    });
  }

  // Update grade and feedback
  if (req.body.grade !== undefined) {
    enrollments[index].grade = req.body.grade;
  }
  if (req.body.feedback !== undefined) {
    enrollments[index].feedback = req.body.feedback;
  }
  enrollments[index].updatedAt = new Date().toISOString();

  writeJSON('enrollments.json', enrollments);

  // Create notification for student
  const notifications = readJSON('notifications.json');
  notifications.push({
    id: `ntf_${uuidv4().substring(0, 8)}`,
    userId: enrollments[index].studentId,
    type: 'grade_updated',
    title: 'Grade Updated',
    message: `Your grade for ${enrollments[index].className} has been updated${req.body.grade ? `: ${req.body.grade}` : ''}`,
    read: false,
    actionUrl: `/enrollments/${enrollments[index].id}`,
    createdAt: new Date().toISOString()
  });
  writeJSON('notifications.json', notifications);

  res.json({
    success: true,
    data: enrollments[index]
  });
});

// GET /api/classes/:id/students - Get enrolled students for a class (for grading)
app.get('/api/classes/:id/students', authMiddleware, requireRole('Tutor'), (req, res) => {
  const enrollments = readJSON('enrollments.json');
  const users = readJSON('users.json');
  
  const classEnrollments = enrollments.filter(e => e.classId === req.params.id);
  
  const students = classEnrollments.map(enrollment => {
    const user = users.find(u => u.id === enrollment.studentId);
    return {
      enrollmentId: enrollment.id,
      studentId: enrollment.studentId,
      name: user?.name || enrollment.studentId,
      email: user?.email || '',
      enrolledAt: enrollment.enrolledAt,
      grade: enrollment.grade,
      feedback: enrollment.feedback,
      completedSessions: enrollment.completedSessions,
      totalSessions: enrollment.totalSessions
    };
  });

  res.json({
    success: true,
    data: { students }
  });
});

// ===========================================
// INTERVENTION ROUTES - Extended
// ===========================================

// GET /api/interventions - Get all interventions (CTSV)
app.get('/api/interventions', authMiddleware, requireRole('CTSV'), (req, res) => {
  const riskStudents = readJSON('risk-students.json');
  
  // Collect all interventions from all students
  const allInterventions = [];
  riskStudents.forEach(student => {
    if (student.interventions && student.interventions.length > 0) {
      student.interventions.forEach(intervention => {
        allInterventions.push({
          ...intervention,
          studentId: student.studentId,
          studentName: student.name
        });
      });
    }
  });

  // Sort by date descending
  allInterventions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    data: { interventions: allInterventions }
  });
});

// GET /api/interventions/student/:studentId - Get interventions for a specific student
app.get('/api/interventions/student/:studentId', authMiddleware, requireRole('CTSV'), (req, res) => {
  const riskStudents = readJSON('risk-students.json');
  const student = riskStudents.find(s => s.studentId === req.params.studentId);

  if (!student) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Student not found' }
    });
  }

  res.json({
    success: true,
    data: { 
      studentId: student.studentId,
      studentName: student.name,
      interventions: student.interventions || []
    }
  });
});

// PATCH /api/interventions/:id - Update intervention status
app.patch('/api/interventions/:id', authMiddleware, requireRole('CTSV'), (req, res) => {
  const riskStudents = readJSON('risk-students.json');
  
  let found = false;
  let updatedIntervention = null;

  for (let i = 0; i < riskStudents.length; i++) {
    if (riskStudents[i].interventions) {
      const intIndex = riskStudents[i].interventions.findIndex(int => int.id === req.params.id);
      if (intIndex !== -1) {
        // Update intervention
        riskStudents[i].interventions[intIndex] = {
          ...riskStudents[i].interventions[intIndex],
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        updatedIntervention = riskStudents[i].interventions[intIndex];
        found = true;
        break;
      }
    }
  }

  if (!found) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Intervention not found' }
    });
  }

  writeJSON('risk-students.json', riskStudents);

  res.json({
    success: true,
    data: updatedIntervention
  });
});

// ===========================================
// REAL-TIME NOTIFICATIONS - Polling endpoint
// ===========================================

// GET /api/notifications/poll - Long polling for new notifications
app.get('/api/notifications/poll', authMiddleware, (req, res) => {
  const notifications = readJSON('notifications.json');
  const lastCheck = req.query.since ? new Date(req.query.since) : new Date(0);
  
  // Get notifications for current user since last check
  const userNotifications = notifications.filter(n => {
    const notifDate = new Date(n.createdAt);
    return n.userId === req.user.id && notifDate > lastCheck;
  });

  res.json({
    success: true,
    data: {
      notifications: userNotifications,
      unreadCount: notifications.filter(n => n.userId === req.user.id && !n.read).length,
      timestamp: new Date().toISOString()
    }
  });
});

// ===========================================
// RISK ASSESSMENT ROUTES (CTSV)
// ===========================================

// GET /api/risk-assessment
app.get('/api/risk-assessment', authMiddleware, requireRole('CTSV'), (req, res) => {
  const riskStudents = readJSON('risk-students.json');

  // Basic filtering
  let filtered = [...riskStudents];

  if (req.query.riskLevel === 'high') {
    filtered = filtered.filter(s => s.riskScore >= 80);
  } else if (req.query.riskLevel === 'medium') {
    filtered = filtered.filter(s => s.riskScore >= 60 && s.riskScore < 80);
  } else if (req.query.riskLevel === 'low') {
    filtered = filtered.filter(s => s.riskScore < 60);
  }

  // Sort by risk score descending
  filtered.sort((a, b) => b.riskScore - a.riskScore);

  const summary = {
    totalAtRisk: riskStudents.length,
    highRisk: riskStudents.filter(s => s.riskScore >= 80).length,
    mediumRisk: riskStudents.filter(s => s.riskScore >= 60 && s.riskScore < 80).length,
    lowRisk: riskStudents.filter(s => s.riskScore < 60).length,
    averageRiskScore: Math.round(riskStudents.reduce((sum, s) => sum + s.riskScore, 0) / riskStudents.length),
    commonRiskFactors: ['Low attendance', 'Declining grades', 'Missed sessions']
  };

  res.json({
    success: true,
    data: {
      students: filtered,
      summary,
      lastDetection: new Date().toISOString()
    }
  });
});

// POST /api/risk-detection/run
app.post('/api/risk-detection/run', authMiddleware, requireRole('CTSV'), (req, res) => {
  const riskStudents = readJSON('risk-students.json');
  
  // Get thresholds from request body (with defaults)
  const attendanceThreshold = req.body.attendanceThreshold || 80;
  const gradeThreshold = req.body.gradeThreshold || 6.0;
  
  // Filter students based on thresholds
  // Students are at-risk if attendance < threshold OR grade < threshold
  const filteredStudents = riskStudents.filter(student => {
    const meetsAttendance = student.attendance < attendanceThreshold;
    const meetsGrade = student.gradesAvg < gradeThreshold;
    return meetsAttendance || meetsGrade;
  });
  
  // Update the lastDetected timestamp for filtered students
  const now = new Date().toISOString();
  filteredStudents.forEach(student => {
    student.lastDetected = now;
  });
  
  // Save the filtered list back (optional - you might want to keep all and just mark detected)
  // For now, we'll just return the filtered results
  
  res.json({
    success: true,
    data: {
      detectionId: `det_${uuidv4().substring(0, 8)}`,
      timestamp: now,
      thresholdsUsed: {
        attendance: attendanceThreshold,
        grade: gradeThreshold
      },
      studentsDetected: filteredStudents.length,
      highRisk: filteredStudents.filter(s => s.riskScore >= 80).length,
      mediumRisk: filteredStudents.filter(s => s.riskScore >= 60 && s.riskScore < 80).length,
      lowRisk: filteredStudents.filter(s => s.riskScore < 60).length,
      // Include the filtered students in the response
      students: filteredStudents
    }
  });
});

// GET /api/risk-assessment/students/:id
app.get('/api/risk-assessment/students/:id', authMiddleware, requireRole('CTSV'), (req, res) => {
  const riskStudents = readJSON('risk-students.json');
  const student = riskStudents.find(s => s.id === req.params.id || s.studentId === req.params.id);

  if (!student) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Student not found' }
    });
  }

  res.json({
    success: true,
    data: student
  });
});

// ===========================================
// INTERVENTION ROUTES (CTSV)
// ===========================================

// POST /api/interventions
app.post('/api/interventions', authMiddleware, requireRole('CTSV'), (req, res) => {
  const riskStudents = readJSON('risk-students.json');
  const index = riskStudents.findIndex(s => s.studentId === req.body.studentId);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Student not found' }
    });
  }

  const intervention = {
    id: `int_${uuidv4().substring(0, 8)}`,
    type: req.body.interventionType,
    notes: req.body.notes,
    notifyStudent: req.body.notifyStudent,
    notifyParent: req.body.notifyParent,
    notificationMethods: req.body.notifyMethod || req.body.notificationMethods || [],
    followUpDate: req.body.followUpDate,
    assignedTo: req.body.assignedTo || req.user.id,
    status: 'created',
    createdAt: new Date().toISOString(),
    createdBy: req.user.name
  };

  riskStudents[index].interventions = riskStudents[index].interventions || [];
  riskStudents[index].interventions.push(intervention);
  writeJSON('risk-students.json', riskStudents);

  res.status(201).json({
    success: true,
    data: {
      id: intervention.id,
      studentId: req.body.studentId,
      status: 'created',
      createdAt: intervention.createdAt,
      notifications: {
        studentNotified: req.body.notifyStudent,
        parentNotified: req.body.notifyParent
      }
    }
  });
});

// ===========================================
// DASHBOARD ROUTES
// ===========================================

// GET /api/dashboard/tutor
app.get('/api/dashboard/tutor', authMiddleware, requireRole('Tutor'), (req, res) => {
  const classes = readJSON('classes.json');
  const bookings = readJSON('bookings.json');
  const tutors = readJSON('tutors.json');

  const tutor = tutors.find(t => t.userId === req.user.id);
  const tutorClasses = tutor 
    ? classes.filter(c => c.tutorId === tutor.id)
    : classes.slice(0, 4); // Fallback for demo

  const totalStudents = tutorClasses.reduce((sum, c) => sum + (c.enrolledStudents || 0), 0);
  const pendingBookings = tutorClasses.reduce((sum, c) => sum + (c.pendingBookings || 0), 0);

  res.json({
    success: true,
    data: {
      totalClasses: tutorClasses.length,
      totalStudents,
      pendingBookings,
      upcomingSessions: tutorClasses.filter(c => c.status === 'active').length,
      classes: tutorClasses
    }
  });
});

// GET /api/dashboard/student
app.get('/api/dashboard/student', authMiddleware, requireRole('Student'), (req, res) => {
  const enrollments = readJSON('enrollments.json');
  const bookings = readJSON('bookings.json');

  const studentEnrollments = enrollments.filter(e => e.studentId === req.user.id);
  const studentBookings = bookings.filter(b => b.studentId === req.user.id);
  const pendingBookings = studentBookings.filter(b => b.status === 'pending');

  const gradesWithValues = studentEnrollments.filter(e => e.grade !== null);
  const averageGrade = gradesWithValues.length > 0
    ? Math.round(gradesWithValues.reduce((sum, e) => sum + e.grade, 0) / gradesWithValues.length)
    : null;

  res.json({
    success: true,
    data: {
      totalEnrollments: studentEnrollments.length,
      pendingBookings: pendingBookings.length,
      averageGrade,
      enrollments: studentEnrollments
    }
  });
});

// GET /api/dashboard/ctsv
app.get('/api/dashboard/ctsv', authMiddleware, requireRole('CTSV'), (req, res) => {
  const riskStudents = readJSON('risk-students.json');

  const totalInterventions = riskStudents.reduce((sum, s) => 
    sum + (s.interventions?.length || 0), 0
  );

  res.json({
    success: true,
    data: {
      totalStudentsAtRisk: riskStudents.length,
      highRiskCount: riskStudents.filter(s => s.riskScore >= 80).length,
      mediumRiskCount: riskStudents.filter(s => s.riskScore >= 60 && s.riskScore < 80).length,
      lowRiskCount: riskStudents.filter(s => s.riskScore < 60).length,
      interventionsPending: totalInterventions,
      lastDetectionRun: new Date().toISOString()
    }
  });
});

// ===========================================
// HEALTH CHECK
// ===========================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0-mvp'
  });
});

// ===========================================
// ERROR HANDLING
// ===========================================

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.path} not found`
    }
  });
});

// ===========================================
// START SERVER
// ===========================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║     Tutor Support System - MVP Backend Server         ║
╠═══════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}             ║
║  API Base URL:      http://localhost:${PORT}/api         ║
║                                                       ║
║  Available Endpoints:                                 ║
║  - POST /api/auth/login                               ║
║  - GET  /api/auth/me                                  ║
║  - GET  /api/tutors                                   ║
║  - GET  /api/classes                                  ║
║  - POST /api/bookings                                 ║
║  - GET  /api/risk-assessment (CTSV only)              ║
║                                                       ║
║  Demo Accounts:                                       ║
║  - student1 / pass123 (Student)                       ║
║  - tutor1 / pass123 (Tutor)                           ║
║  - ctsv1 / pass123 (CTSV)                             ║
╚═══════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
