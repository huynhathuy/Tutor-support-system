# HCMUT Tutor Support System - Backend API

A RESTful Express.js backend for the HCMUT Tutor Support System. Uses JSON file-based storage for rapid prototyping and demonstration.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Demo Accounts](#demo-accounts)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Users](#users)
  - [Tutors](#tutors)
  - [Classes](#classes)
  - [Subjects](#subjects)
  - [Bookings](#bookings)
  - [Waitlist](#waitlist)
  - [Enrollments](#enrollments)
  - [Notifications](#notifications)
  - [Risk Assessment (CTSV)](#risk-assessment-ctsv)
  - [Interventions (CTSV)](#interventions-ctsv)
  - [Dashboard](#dashboard)
  - [Health Check](#health-check)
- [Request/Response Examples](#requestresponse-examples)
- [Error Handling](#error-handling)
- [Data Storage](#data-storage)

---

## Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher

### Installation

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install
```

### Running the Server

```bash
# Production mode
npm start

# Development mode with auto-reload (Node.js 18+)
npm run dev
```

The server runs at: **http://localhost:3001**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                       │
│                    http://localhost:3000                    │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP Requests
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express.js Backend                        │
│                    http://localhost:3001                    │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Auth     │  │   Routes    │  │    Middleware       │ │
│  │  Middleware │  │  (41 APIs)  │  │  (CORS, JSON, Auth) │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │ Read/Write
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    JSON File Storage                        │
│                     /server/data/                           │
│                                                             │
│  users.json │ tutors.json │ classes.json │ bookings.json   │
│  enrollments.json │ notifications.json │ risk-students.json│
└─────────────────────────────────────────────────────────────┘
```

---

## Demo Accounts

| Username   | Password  | Role    | Description                    |
|------------|-----------|---------|--------------------------------|
| `student1` | `pass123` | Student | Sample student user            |
| `student2` | `pass123` | Student | Sample student user            |
| `tutor1`   | `pass123` | Tutor   | Sample tutor user              |
| `tutor2`   | `pass123` | Tutor   | Sample tutor user              |
| `ctsv1`    | `pass123` | CTSV    | Center for Student Affairs     |

---

## API Reference

### Base URL

```
http://localhost:3001/api
```

### Authentication Header

All protected endpoints require the `Authorization` header:

```
Authorization: Bearer <token>
```

### Role-Based Access

| Role    | Access Level |
|---------|--------------|
| Student | Create bookings, view enrollments, cancel own bookings |
| Tutor   | Manage classes, accept/reject bookings, grade students |
| CTSV    | Monitor at-risk students, create interventions |

---

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/login` | ❌ | Authenticate user and get token |
| `POST` | `/auth/logout` | ✅ | Invalidate user session |
| `GET` | `/auth/me` | ✅ | Get current authenticated user |

#### Login Request Body

```json
{
  "username": "student1",
  "password": "pass123",
  "role": "Student"
}
```

#### Login Response

```json
{
  "success": true,
  "user": {
    "id": "usr_001",
    "username": "student1",
    "fullName": "Nguyen Van A",
    "email": "student1@hcmut.edu.vn",
    "role": "Student"
  },
  "token": "fake-jwt-token-usr_001"
}
```

---

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/users/:id` | ✅ | Get user by ID |

---

### Tutors

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/tutors` | ❌ | All | List all tutors (with optional filters) |
| `GET` | `/tutors/:id` | ❌ | All | Get tutor details |
| `GET` | `/tutors/:id/availability` | ❌ | All | Get tutor's available time slots |
| `PUT` | `/tutors/:id/availability` | ✅ | Tutor | Update tutor's availability |

#### Query Parameters for GET /tutors

| Parameter | Type | Description |
|-----------|------|-------------|
| `subject` | string | Filter by subject name |
| `minRating` | number | Filter by minimum rating |
| `maxPrice` | number | Filter by maximum hourly rate |

---

### Classes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/classes` | ❌ | All | List all classes |
| `GET` | `/classes/:id` | ❌ | All | Get class details |
| `POST` | `/classes` | ✅ | Tutor | Create a new class |
| `POST` | `/classes/:id/materials` | ✅ | Tutor | Add materials to a class |
| `GET` | `/classes/:id/students` | ✅ | Tutor | Get enrolled students for grading |

#### Query Parameters for GET /classes

| Parameter | Type | Description |
|-----------|------|-------------|
| `tutorId` | string | Filter by tutor ID |
| `subject` | string | Filter by subject |
| `status` | string | Filter by status (active, completed) |

---

### Subjects

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/subjects` | ❌ | List all available subjects |

---

### Bookings

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/bookings` | ✅ | All | Get user's bookings |
| `POST` | `/bookings` | ✅ | Student | Create a booking request |
| `PATCH` | `/bookings/:id` | ✅ | Tutor | Update booking status (confirm/reject) |
| `DELETE` | `/bookings/:id` | ✅ | All | Cancel a booking |
| `GET` | `/bookings/:id/alternative-slots` | ✅ | All | Get alternative time slots |
| `PUT` | `/bookings/:id/reschedule` | ✅ | All | Reschedule a booking |

#### Booking Status Values

| Status | Description |
|--------|-------------|
| `pending` | Awaiting tutor approval |
| `confirmed` | Approved by tutor, creates enrollment |
| `rejected` | Rejected by tutor |
| `cancelled` | Cancelled by student or tutor |

#### Create Booking Request Body

```json
{
  "classId": "cls_001",
  "slot": {
    "date": "2025-01-15",
    "startTime": "09:00",
    "endTime": "10:30"
  },
  "message": "I would like to join this class"
}
```

---

### Waitlist

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/waitlist` | ✅ | Join waitlist for a full class |
| `GET` | `/waitlist` | ✅ | Get user's waitlist entries |
| `DELETE` | `/waitlist/:id` | ✅ | Remove from waitlist |

#### Waitlist Request Body

```json
{
  "classId": "cls_001",
  "preferredSlot": {
    "date": "2025-01-20",
    "startTime": "14:00",
    "endTime": "15:30"
  }
}
```

---

### Enrollments

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/enrollments` | ✅ | All | Get current user's enrollments |
| `GET` | `/students/:id/enrollments` | ✅ | All | Get specific student's enrollments |
| `DELETE` | `/enrollments/:id` | ✅ | Student | Cancel enrollment with reason |
| `PUT` | `/enrollments/:id/grade` | ✅ | Tutor | Update student grade and feedback |

#### Cancel Enrollment Request Body

```json
{
  "cancelReason": "Schedule conflict with another class"
}
```

#### Update Grade Request Body

```json
{
  "grade": 8.5,
  "feedback": "Excellent progress in understanding algorithms"
}
```

---

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/notifications` | ✅ | Get user's notifications |
| `PUT` | `/notifications/:id/read` | ✅ | Mark notification as read |
| `GET` | `/notifications/poll` | ✅ | Poll for new notifications |

#### Notification Types

| Type | Description |
|------|-------------|
| `booking_created` | New booking request (for tutors) |
| `booking_confirmed` | Booking approved (for students) |
| `booking_rejected` | Booking rejected (for students) |
| `booking_cancelled` | Booking cancelled |
| `grade_updated` | Grade posted by tutor |
| `intervention_suggested` | CTSV intervention created |

---

### Risk Assessment (CTSV)

> **Note:** All risk assessment endpoints require CTSV role.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/risk-assessment` | ✅ | Get all at-risk students |
| `POST` | `/risk-detection/run` | ✅ | Run risk detection with thresholds |
| `GET` | `/risk-assessment/students/:id` | ✅ | Get detailed student profile |

#### Run Detection Request Body

```json
{
  "attendanceThreshold": 80,
  "gradeThreshold": 6.0
}
```

**Detection Logic:**
Students are flagged as at-risk if:
- Attendance < `attendanceThreshold` (default: 80%)
- OR Average Grade < `gradeThreshold` (default: 6.0)

#### Preset Policies (Frontend)

| Policy Name | Attendance Threshold | Grade Threshold |
|-------------|---------------------|-----------------|
| Early Warning | 85% | 7.0 |
| Strict Monitoring | 90% | 7.5 |
| At-Risk Intervention | 75% | 5.5 |
| Academic Probation | 70% | 5.0 |

---

### Interventions (CTSV)

> **Note:** All intervention endpoints require CTSV role.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/interventions` | ✅ | Get all interventions |
| `GET` | `/interventions/student/:studentId` | ✅ | Get interventions for a student |
| `POST` | `/interventions` | ✅ | Create new intervention |
| `PATCH` | `/interventions/:id` | ✅ | Update intervention status |

#### Create Intervention Request Body

```json
{
  "studentId": "usr_001",
  "type": "academic_support",
  "description": "Schedule tutoring sessions for calculus",
  "priority": "high"
}
```

#### Intervention Types

| Type | Description |
|------|-------------|
| `academic_support` | Tutoring and study assistance |
| `counseling` | Psychological or academic counseling |
| `attendance_warning` | Formal attendance warning |
| `probation` | Academic probation |

---

### Dashboard

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/dashboard/student` | ✅ | Student | Student dashboard statistics |
| `GET` | `/dashboard/tutor` | ✅ | Tutor | Tutor dashboard statistics |
| `GET` | `/dashboard/ctsv` | ✅ | CTSV | CTSV dashboard statistics |

---

### Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | ❌ | Server health status |

---

## Request/Response Examples

### Login as Student

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"student1\",\"password\":\"pass123\",\"role\":\"Student\"}"
```

### Get Tutors with Filters

```bash
curl "http://localhost:3001/api/tutors?subject=Calculus&minRating=4.0"
```

### Create Booking (with auth)

```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d "{\"classId\":\"cls_001\",\"slot\":{\"date\":\"2025-01-15\",\"startTime\":\"09:00\",\"endTime\":\"10:30\"},\"message\":\"I would like to join\"}"
```

### Confirm Booking (Tutor)

```bash
curl -X PATCH http://localhost:3001/api/bookings/bkg_001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TUTOR_TOKEN" \
  -d "{\"status\":\"confirmed\"}"
```

### Run Risk Detection (CTSV)

```bash
curl -X POST http://localhost:3001/api/risk-detection/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CTSV_TOKEN" \
  -d "{\"attendanceThreshold\":80,\"gradeThreshold\":6.0}"
```

### Update Student Grade (Tutor)

```bash
curl -X PUT http://localhost:3001/api/enrollments/enr_001/grade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TUTOR_TOKEN" \
  -d "{\"grade\":8.5,\"feedback\":\"Excellent work!\"}"
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common HTTP Status Codes

| Status | Description |
|--------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Missing or invalid token |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `409` | Conflict - Resource already exists |
| `500` | Internal Server Error |

---

## Data Storage

All data is stored as JSON files in `/server/data/`:

| File | Description |
|------|-------------|
| `users.json` | User accounts and credentials |
| `tutors.json` | Tutor profiles and qualifications |
| `classes.json` | Class information and schedules |
| `bookings.json` | Booking requests and status |
| `enrollments.json` | Student enrollments and grades |
| `notifications.json` | User notifications |
| `risk-students.json` | At-risk student data for CTSV |

### Data Persistence Notes

- Data persists between server restarts
- JSON files are read/written synchronously
- No database required for MVP demonstration
- Reset data by restoring original JSON files

---

## CORS Configuration

The server is configured to accept requests from:

- `http://localhost:3000` (Vite dev server)
- `http://localhost:5173` (Alternative Vite port)

---

## Development Notes

### MVP Limitations

- **Authentication:** Tokens are fake JWT-style strings (no encryption)
- **Storage:** JSON files (not suitable for production)
- **Concurrency:** Synchronous file operations
- **Security:** No rate limiting or input sanitization

### For Production

Consider implementing:

- [ ] Real JWT authentication with bcrypt
- [ ] PostgreSQL/MongoDB database
- [ ] Input validation with Joi/Zod
- [ ] Rate limiting
- [ ] HTTPS
- [ ] Logging (Winston/Pino)

---

## License

This project is for educational purposes as part of HCMUT Software Engineering coursework.
