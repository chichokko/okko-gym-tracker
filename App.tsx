import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  // Init Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Check Auth Session on Mount & Listen for Events
  useEffect(() => {
    const initSession = async () => {
      const currentUser = await getCurrentSession();
      if (currentUser) {
        setUser(currentUser);
      }
      setLoadingSession(false);
    };

    initSession();

    // Listen for Password Recovery / Invite events
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked password reset or invite link
        // They are now signed in with a temporary session (usually)
        // We should redirect them to Update Password page
        // Since we are outside Router at this point (in useEffect), we can rely on Conditional Rendering 
        // OR finding a way to navigate. 
        // But 'user' state might be set differently. 
        // Simpler: if we detect this event, we set a flag 'isRecovery' or just ensure /update-password is accessible.
        // window.location.hash = '/update-password'; // Hacky but works if Router picks it up? No, BrowserRouter.
        // Instead, we can just let Router handle it if we add a Route.
        // But we need to NAVIGATE there.
        window.location.href = '/update-password';
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-900 dark:text-white" size={32} />
      </div>
    );
  }

  // Handle case where user is accessing update-password but might not be fully logged in (or is via recovery link)
  // We need to allow access to /update-password even if user is null? 
  // Actually, PASSWORD_RECOVERY event signs them in. So user will be populated eventually.
  // But strictly, we should have a Route for it. 

  // Check if current path is update-password
  const isUpdatePassword = window.location.pathname === '/update-password';

  if (!user && !isUpdatePassword) {
    return <Login onLoginSuccess={setUser} />;
  }

  return (
    <>
      <GymProvider>
        <Router>
          <Routes>
            <Route path="/update-password" element={<UpdatePassword />} />
          </Routes>

          {user && (
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
                    <Route path="/historial" element={<SessionHistory />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                )}
              </Routes>
            </Layout>
          )}
        </Router>
      </GymProvider>
      <Toaster />
    </>
  );
};

export default App;