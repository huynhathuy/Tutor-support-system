# 🎓 HCMUT Tutor Support System

A comprehensive tutoring platform for Ho Chi Minh City University of Technology (HCMUT) that connects students with tutors and enables academic risk monitoring by the Center for Student Affairs (CTSV).

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat&logo=vite)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat&logo=node.js)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=flat&logo=tailwindcss)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Demo Accounts](#-demo-accounts)
- [API Documentation](#-api-documentation)
- [Testing Guide](#-testing-guide)
- [Contributing](#-contributing)

---

## 🎯 Overview

The HCMUT Tutor Support System is a full-stack web application designed to:

| User Role | Primary Functions |
|-----------|-------------------|
| **Students** | Find tutors, book sessions, track grades |
| **Tutors** | Manage classes, accept bookings, grade students |
| **CTSV Staff** | Monitor at-risk students, suggest interventions |

This project was developed as part of the **Software Engineering course (Year 3)** at HCMUT.

---

## ✨ Features

### 👨‍🎓 Student Portal

| Feature | Description |
|---------|-------------|
| **Tutor Discovery** | Browse tutors by subject, rating, and price |
| **Class Booking** | Request sessions with real-time availability checking |
| **Enrollment Management** | View enrolled classes, track progress |
| **Grade Tracking** | View grades and feedback from tutors |
| **Session Management** | Cancel bookings with reason tracking |
| **Notifications** | Real-time updates for booking status changes |

### 👨‍🏫 Tutor Dashboard

| Feature | Description |
|---------|-------------|
| **Class Management** | Create and manage tutoring classes |
| **Booking Requests** | Accept or reject student booking requests |
| **Student Grading** | Post grades and provide feedback |
| **Schedule Management** | Set availability and manage time slots |
| **Material Upload** | Add learning materials to classes |

### 🏛️ CTSV Dashboard (Student Affairs)

| Feature | Description |
|---------|-------------|
| **Risk Detection** | Run algorithms with customizable thresholds |
| **Preset Policies** | Quick detection with predefined criteria |
| **Student Monitoring** | View detailed academic profiles |
| **Intervention System** | Suggest and track interventions |
| **Data Export** | Export student data to CSV |

#### Risk Detection Preset Policies

| Policy Name | Attendance | Grade | Use Case |
|-------------|------------|-------|----------|
| Early Warning | < 85% | < 7.0 | Early intervention |
| Strict Monitoring | < 90% | < 7.5 | High-performing programs |
| At-Risk Intervention | < 75% | < 5.5 | Students needing support |
| Academic Probation | < 70% | < 5.0 | Severe cases |

### 🔔 Real-time Features

- Notification polling every 30 seconds
- Unread notification badges
- Toast notifications for user actions
- Live booking status updates

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with TypeScript |
| **Vite** | Build tool and dev server |
| **TailwindCSS** | Utility-first styling |
| **Radix UI** | Accessible component primitives |
| **Motion** | Animations (Framer Motion) |
| **Recharts** | Data visualization charts |
| **Sonner** | Toast notifications |

### Backend

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **JSON Storage** | File-based data persistence |
| **UUID** | Unique ID generation |
| **CORS** | Cross-origin resource sharing |

---

## 📁 Project Structure

```
hcmut-tutor-support-system/
│
├── 📂 src/                          # Frontend source code
│   ├── 📂 components/               # React components
│   │   ├── 📂 ui/                   # Reusable UI (shadcn/ui)
│   │   ├── StudentDashboardNew.tsx  # Student main view
│   │   ├── TutorDashboard.tsx       # Tutor main view
│   │   ├── CTSVDashboard.tsx        # CTSV main view
│   │   ├── BookingDialog.tsx        # Booking modal
│   │   ├── ClassDetailView.tsx      # Class details page
│   │   └── ...
│   │
│   ├── 📂 contexts/                 # React contexts
│   │   └── AuthContext.tsx          # Authentication state
│   │
│   ├── 📂 hooks/                    # Custom React hooks
│   │   └── useNotificationPolling.ts
│   │
│   ├── 📂 services/                 # API service layer
│   │   └── api.ts                   # All API calls
│   │
│   ├── 📂 types/                    # TypeScript definitions
│   │   └── tutor.ts
│   │
│   ├── App.tsx                      # Main application
│   └── main.tsx                     # Entry point
│
├── 📂 server/                       # Backend source code
│   ├── server.js                    # Express.js server
│   ├── 📂 data/                     # JSON data files
│   │   ├── users.json
│   │   ├── tutors.json
│   │   ├── classes.json
│   │   ├── bookings.json
│   │   ├── enrollments.json
│   │   ├── notifications.json
│   │   └── risk-students.json
│   └── README.md                    # API documentation
│
├── package.json                     # Frontend dependencies
├── vite.config.ts                   # Vite configuration
└── README.md                        # This file
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18.x or higher |
| npm | 9.x or higher |

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/hcmut-tutor-support-system.git
cd hcmut-tutor-support-system
```

#### 2. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

### Running the Application

Open **two terminal windows**:

#### Terminal 1 - Backend Server

```bash
cd server
npm start
```

Server runs at: **http://localhost:3001**

#### Terminal 2 - Frontend App

```bash
npm run dev
```

App runs at: **http://localhost:3000**

### Quick Verification

1. Open http://localhost:3000 in your browser
2. Login with demo credentials (see below)
3. Explore the dashboard for your role

---

## 🔐 Demo Accounts

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Student | `student1` | `pass123` | Book classes, view grades |
| Tutor | `tutor1` | `pass123` | Manage classes, grade students |
| CTSV | `ctsv1` | `pass123` | Monitor at-risk students |

---

## 📡 API Documentation

### Quick Reference

| Category | Endpoints | Description |
|----------|-----------|-------------|
| Auth | 3 | Login, logout, get current user |
| Tutors | 4 | List, details, availability |
| Classes | 5 | CRUD operations, materials |
| Bookings | 6 | Create, accept/reject, reschedule |
| Enrollments | 4 | View, cancel, grade students |
| Risk Assessment | 3 | Detection, student profiles |
| Interventions | 4 | CRUD for interventions |
| Notifications | 3 | Get, mark read, poll |
| Dashboard | 3 | Role-specific statistics |

### Key API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/auth/login` | ❌ | All | Login |
| `GET` | `/api/tutors` | ❌ | All | List tutors |
| `POST` | `/api/bookings` | ✅ | Student | Create booking |
| `PATCH` | `/api/bookings/:id` | ✅ | Tutor | Accept/reject |
| `PUT` | `/api/enrollments/:id/grade` | ✅ | Tutor | Update grade |
| `POST` | `/api/risk-detection/run` | ✅ | CTSV | Run detection |
| `POST` | `/api/interventions` | ✅ | CTSV | Create intervention |

> 📘 **Full API Documentation:** See [server/README.md](server/README.md)

---

## 🧪 Testing Guide

### Manual Testing Flow

#### Student Flow

1. Login as `student1` / `pass123`
2. Browse available tutors
3. Book a tutoring session
4. View enrollment in "My Sessions"
5. Check notifications for booking updates

#### Tutor Flow

1. Login as `tutor1` / `pass123`
2. View pending booking requests
3. Accept or reject a booking
4. Navigate to class details
5. Grade enrolled students

#### CTSV Flow

1. Login as `ctsv1` / `pass123`
2. Select a preset policy or set custom thresholds
3. Click "Run Detection Now"
4. Review at-risk students
5. Suggest interventions for students

### API Testing

```bash
# Login and get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"student1\",\"password\":\"pass123\",\"role\":\"Student\"}"

# Use token for authenticated requests
curl http://localhost:3001/api/enrollments \
  -H "Authorization: Bearer <your-token>"
```

---

## 🤝 Contributing

This is a university project. Contributions are welcome for educational purposes.

### Development Guidelines

1. Follow existing code style and patterns
2. Use TypeScript for type safety
3. Test changes manually before committing
4. Update documentation for new features

### Commit Message Format

```
<type>: <description>

Types: feat, fix, docs, style, refactor, test
```

---

## 📄 License

This project is for educational purposes as part of HCMUT coursework.

---

## 👥 Team

**Software Engineering Course - Year 3**  
Ho Chi Minh City University of Technology (HCMUT)

---

## 🔗 Resources

- **Original Design:** [Figma Design](https://www.figma.com/design/rouOP8qtKGTwhT6j4nAOdg/Tutor-Booking-App-Homepage)
- **API Documentation:** [server/README.md](server/README.md)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
  