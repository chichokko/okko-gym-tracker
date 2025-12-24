import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import CoachSessionLogger from './components/CoachSessionLogger';
import StudentDashboard from './components/StudentDashboard';
import StudentManager from './components/StudentManager';
import RoutineManager from './components/RoutineManager';
import ExerciseManager from './components/ExerciseManager';
import SessionHistory from './components/features/sessions/SessionHistory';
import { Toaster } from './components/ui';
import { User, UserRole } from './types';
import { getCurrentSession, signOut } from './services/authService';
import { Loader2 } from 'lucide-react';

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

  // Check Auth Session on Mount
  useEffect(() => {
    const initSession = async () => {
      const currentUser = await getCurrentSession();
      if (currentUser) {
        setUser(currentUser);
      }
      setLoadingSession(false);
    };
    initSession();
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

  if (!user) {
    return <Login onLoginSuccess={setUser} />;
  }

  return (
    <>
      <Router>
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
      </Router>
      <Toaster />
    </>
  );
};

export default App;