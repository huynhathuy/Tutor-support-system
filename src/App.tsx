import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HeroLandingPage } from './components/HeroLandingPage';
import { FuturisticLogin } from './components/FuturisticLogin';
import { TutorListPage } from './components/TutorListPage';
import { TutorDetailPage } from './components/TutorDetailPage';
import { TutorDashboard } from './components/TutorDashboard';
import { TutorClassDetail } from './components/TutorClassDetail';
import { StudentDashboard } from './components/StudentDashboard';
import { CTSVDashboard } from './components/CTSVDashboard';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const [selectedTutorId, setSelectedTutorId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [studentView, setStudentView] = useState<'dashboard' | 'browse' | 'detail'>('dashboard');
  const [showLanding, setShowLanding] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // Show landing page first
  if (!isAuthenticated && showLanding && !showLogin) {
    return <HeroLandingPage onGetStarted={() => setShowLogin(true)} />;
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <FuturisticLogin onBack={() => setShowLogin(false)} />;
  }

  // CTSV FLOW (Student Affairs)
  if (user?.role === 'CTSV') {
    return <CTSVDashboard onLogout={logout} />;
  }

  // TUTOR FLOW
  if (user?.role === 'Tutor') {
    // Show class detail if a class is selected
    if (selectedClassId) {
      return (
        <TutorClassDetail
          classId={selectedClassId}
          onBack={() => setSelectedClassId(null)}
        />
      );
    }

    // Show tutor dashboard
    return (
      <TutorDashboard
        onClassClick={(classId) => setSelectedClassId(classId)}
        onLogout={logout}
      />
    );
  }

  // STUDENT FLOW
  if (user?.role === 'Student') {
    // Student Dashboard view
    if (studentView === 'dashboard') {
      return (
        <StudentDashboard
          onClassClick={(classId) => {
            // Navigate to class details (can be expanded later)
            alert(`View details for class ${classId}`);
          }}
          onLogout={logout}
        />
      );
    }

    // Browse tutors view
    if (studentView === 'browse') {
      // Show tutor detail page if a tutor is selected
      if (selectedTutorId) {
        return (
          <TutorDetailPage
            tutorId={selectedTutorId}
            onBack={() => setSelectedTutorId(null)}
          />
        );
      }

      // Show tutor list page
      return (
        <TutorListPage
          onSelectTutor={(tutorId) => setSelectedTutorId(tutorId)}
        />
      );
    }
  }

  // Default fallback
  return <FuturisticLogin onBack={() => setShowLogin(false)} />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <AppContent />
        <Toaster />
      </div>
    </AuthProvider>
  );
}