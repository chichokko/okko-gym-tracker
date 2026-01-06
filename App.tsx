import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { GymProvider } from './context/GymContext';
import Layout from './components/Layout';
import Login from './components/features/auth/Login';
import CoachSessionLogger from './components/CoachSessionLogger';
import StudentDashboard from './components/features/students/StudentDashboard';
import StudentManager from './components/features/students/StudentManager';
import RoutineManager from './components/features/routines/RoutineManager';
import ExerciseManager from './components/features/routines/ExerciseManager';
import SessionHistory from './components/features/sessions/SessionHistory';
import UpdatePassword from './components/features/auth/UpdatePassword';
import { Toaster } from './components/ui';
import { User, UserRole } from './types';
import { getCurrentSession, signOut } from './services/authService';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

// Inner component to handle routing logic and auth events
const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('okko-theme');
    return saved ? JSON.parse(saved) : false;
  });
  const [loadingSession, setLoadingSession] = useState(true);
  const navigate = useNavigate();

  // Init Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('okko-theme', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Main auth state listener - this is the core of auth handling
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const currentUser = await getCurrentSession();
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to restore session:", error);
        // Ensure we don't leave user in broken state
        setUser(null);
      } finally {
        setLoadingSession(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes - Supabase handles token refresh automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);

      if (event === 'SIGNED_IN' && session) {
        const currentUser = await getCurrentSession();
        setUser(currentUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        navigate('/');
      } else if (event === 'PASSWORD_RECOVERY') {
        navigate('/update-password');
      } else if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed successfully - no action needed
        console.log('Token refreshed successfully');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    navigate('/');
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-900 dark:text-white" size={32} />
      </div>
    );
  }

  // Allow access to Login if not authenticated
  if (!user) {
    return <Login onLoginSuccess={setUser} />;
  }

  // Authenticated Routes
  return (
    <GymProvider>
      <Routes>
        {/* Update Password - Accessible to any authenticated user */}
        <Route path="/update-password" element={<UpdatePassword />} />

        {/* Main App Routes - Wrapped in Layout */}
        <Route path="/*" element={
          <Layout user={user} onLogout={handleLogout} isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
            <Routes>
              {user.role === UserRole.COACH ? (
                <>
                  <Route path="/" element={<Navigate to="/logger" replace />} />
                  <Route path="/logger" element={<CoachSessionLogger />} />
                  <Route path="/alumnos" element={<StudentManager />} />
                  <Route path="/historial" element={<SessionHistory />} />
                  <Route path="/rutinas" element={<RoutineManager />} />
                  <Route path="/ejercicios" element={<ExerciseManager />} />
                  <Route path="*" element={<Navigate to="/logger" replace />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<StudentDashboard user={user} />} />
                  <Route path="/historial" element={<SessionHistory studentId={user.id} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}
            </Routes>
          </Layout>
        } />
      </Routes>
    </GymProvider>
  );
};

const App: React.FC = () => {
  return (
    <>
      <Router>
        <AppContent />
      </Router>
      <Toaster />
    </>
  );
};

export default App;