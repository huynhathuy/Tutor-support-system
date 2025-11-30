# 🎓 HCMUT Tutor Support System

A comprehensive tutoring platform for Ho Chi Minh City University of Technology (HCMUT) that connects students with tutors and enables academic risk monitoring by the Center for Student Affairs (CTSV).

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat&logo=vite)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat&logo=node.js)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=flat&logo=tailwindcss)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Demo Accounts](#demo-accounts)
- [Screenshots](#screenshots)

## 🎯 Overview

The HCMUT Tutor Support System is a full-stack web application designed to:

1. **Help students** find and book tutoring sessions with qualified tutors
2. **Enable tutors** to manage their classes, schedules, and student enrollments
3. **Empower CTSV staff** to monitor at-risk students and suggest interventions

This project was developed as part of the Software Engineering course (Year 3) at HCMUT.

## ✨ Features

### 👨‍🎓 Student Portal
- Browse available tutors and classes by subject
- Book tutoring sessions with real-time availability checking
- View enrolled classes and upcoming sessions
- Track grades and feedback from tutors
- Cancel bookings with reason tracking
- Real-time notifications for booking updates

### 👨‍🏫 Tutor Dashboard
- View and manage created classes
- Accept/reject booking requests from students
- Grade students and provide feedback
- Create new tutoring sessions
- Manage availability schedule
- Real-time notifications for new bookings

### 🏛️ CTSV Dashboard (Student Affairs)
- Monitor at-risk students based on attendance and grades
- Run risk detection algorithms
- View student profiles and academic history
- Suggest interventions (counseling, academic support, etc.)
- Export student data to CSV
- Track intervention history

### 🔔 Real-time Features
- Notification polling (30-second intervals)
- Unread notification badges
- Toast notifications for actions

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **Radix UI** for accessible component primitives
- **Motion** (Framer Motion) for animations
- **Recharts** for data visualization
- **Sonner** for toast notifications

### Backend
- **Node.js** with Express.js
- **JSON file storage** (MVP approach)
- **UUID** for unique ID generation
- **CORS** enabled for frontend communication

## 📁 Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components (shadcn/ui)
│   │   ├── StudentDashboardNew.tsx
│   │   ├── TutorDashboard.tsx
│   │   ├── CTSVDashboard.tsx
│   │   ├── BookingDialog.tsx
│   │   └── ...
│   ├── contexts/            # React contexts (AuthContext)
│   ├── hooks/               # Custom hooks (useNotificationPolling)
│   ├── services/            # API service layer
│   │   └── api.ts           # All API calls
│   └── types/               # TypeScript type definitions
│
├── server/
│   ├── server.js            # Express.js backend
│   ├── data/                # JSON data files
│   │   ├── users.json
│   │   ├── tutors.json
│   │   ├── classes.json
│   │   ├── bookings.json
│   │   ├── enrollments.json
│   │   ├── notifications.json
│   │   └── risk-students.json
│   └── README.md            # API documentation
│
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/hcmut-tutor-support-system.git
   cd hcmut-tutor-support-system
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

### Running the Application

1. **Start the backend server** (Terminal 1)
   ```bash
   cd server
   node server.js
   ```
   Server runs at: `http://localhost:3001`

2. **Start the frontend** (Terminal 2)
   ```bash
   npm run dev
   ```
   App runs at: `http://localhost:3000`

## 📡 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication
All protected routes require the `Authorization` header:
```
Authorization: Bearer <token>
```

### Key Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/auth/login` | Login and get token | All |
| GET | `/auth/me` | Get current user | All |
| GET | `/tutors` | List all tutors | All |
| GET | `/classes` | List all classes | All |
| POST | `/bookings` | Create a booking | Student |
| PATCH | `/bookings/:id/status` | Accept/reject booking | Tutor |
| DELETE | `/enrollments/:id` | Cancel enrollment | Student |
| PUT | `/enrollments/:id/grade` | Update student grade | Tutor |
| GET | `/risk-assessment` | Get at-risk students | CTSV |
| POST | `/interventions` | Create intervention | CTSV |
| GET | `/notifications` | Get user notifications | All |

For full API documentation, see [server/README.md](server/README.md)

## 🔐 Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Student | `student1` | `pass123` |
| Tutor | `tutor1` | `pass123` |
| CTSV Staff | `ctsv1` | `pass123` |

## 🧪 Testing the API

### Login as Student
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"student1\",\"password\":\"pass123\"}"
```

### Get Student Enrollments
```bash
curl http://localhost:3001/api/enrollments \
  -H "Authorization: Bearer <your-token>"
```

### Create a Booking
```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d "{\"classId\":\"cls_001\",\"slot\":{\"date\":\"2025-12-01\",\"startTime\":\"10:00\",\"endTime\":\"11:30\"},\"message\":\"Booking request\"}"
```

## 📸 Screenshots

### Student Dashboard
- View enrolled classes
- Book new sessions
- Track grades

### Tutor Dashboard
- Manage classes
- Accept/reject bookings
- Grade students

### CTSV Dashboard
- Monitor at-risk students
- Suggest interventions
- Export data

## 🤝 Contributing

This is a university project. Contributions are welcome for educational purposes.

## 📄 License

This project is for educational purposes as part of HCMUT coursework.

## 👥 Team

- Software Engineering Course - Year 3
- Ho Chi Minh City University of Technology (HCMUT)

---

**Original Design:** [Figma Design](https://www.figma.com/design/rouOP8qtKGTwhT6j4nAOdg/Tutor-Booking-App-Homepage)
  
