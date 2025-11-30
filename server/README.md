# Tutor Support System - MVP Backend

A simple Express.js backend using JSON files for data storage. Designed for rapid prototyping and demonstration.

## Quick Start

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start the server
npm start

# Or with auto-reload (Node.js 18+)
npm run dev
```

The server will run at `http://localhost:3001`

## Demo Accounts

| Username | Password | Role |
|----------|----------|------|
| student1 | pass123 | Student |
| student2 | pass123 | Student |
| tutor1 | pass123 | Tutor |
| tutor2 | pass123 | Tutor |
| ctsv1 | pass123 | CTSV |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |

### Tutors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tutors` | List all tutors |
| GET | `/api/tutors/:id` | Get tutor details |
| GET | `/api/tutors/:id/availability` | Get tutor availability |
| PUT | `/api/tutors/:id/availability` | Update availability (Tutor) |

### Classes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classes` | List all classes |
| GET | `/api/classes/:id` | Get class details |
| POST | `/api/classes` | Create new class (Tutor) |
| POST | `/api/classes/:id/materials` | Upload material (Tutor) |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | List bookings |
| POST | `/api/bookings` | Create booking (Student) |
| PATCH | `/api/bookings/:id` | Update booking status |
| DELETE | `/api/bookings/:id` | Cancel booking |

### Enrollments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/enrollments` | Get current user's enrollments |
| GET | `/api/students/:id/enrollments` | Get student's enrollments |

### Risk Assessment (CTSV only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/risk-assessment` | Get at-risk students |
| POST | `/api/risk-detection/run` | Run detection |
| GET | `/api/risk-assessment/students/:id` | Get student details |
| POST | `/api/interventions` | Create intervention |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/student` | Student dashboard data |
| GET | `/api/dashboard/tutor` | Tutor dashboard data |
| GET | `/api/dashboard/ctsv` | CTSV dashboard data |

## Example API Calls

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "student1", "password": "pass123", "role": "Student"}'
```

### Get Tutors (with token)
```bash
curl http://localhost:3001/api/tutors \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Booking
```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "classId": "cls_001",
    "slot": {"date": "2025-12-01", "startTime": "09:00", "endTime": "10:30"},
    "message": "I would like to join this class"
  }'
```

### Accept/Reject Booking (Tutor)
```bash
curl -X PATCH http://localhost:3001/api/bookings/bkg_001 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"status": "confirmed"}'
```

## Data Files

All data is stored in JSON files under `/server/data/`:
- `users.json` - User accounts
- `tutors.json` - Tutor profiles
- `classes.json` - Class information
- `bookings.json` - Booking requests
- `enrollments.json` - Student enrollments
- `risk-students.json` - At-risk student data
- `notifications.json` - User notifications

## Connecting Frontend

Update your frontend API calls to use `http://localhost:3001/api/...`

Example in React:
```typescript
const API_BASE = 'http://localhost:3001/api';

// Login
const login = async (username: string, password: string, role: string) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role })
  });
  return res.json();
};

// Get with auth
const getTutors = async (token: string) => {
  const res = await fetch(`${API_BASE}/tutors`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};
```

## Notes

- This is an MVP backend for demonstration purposes
- No real authentication/encryption - tokens are fake
- Data persists to JSON files (will reset if files are overwritten)
- CORS is configured for localhost development
