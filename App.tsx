import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { GymProvider } from './context/GymContext';
import { SessionProvider, useSession } from './context/SessionContext';
import Layout from './components/Layout';
import Login from './components/features/auth/Login';
import CoachSessionLogger from './components/CoachSessionLogger';
import StudentDashboard from './components/features/students/StudentDashboard';
import AlumnosWithHistory from './components/features/students/AlumnosWithHistory';
// Legacy: Routines removed from frontend access
import ExerciseManager from './components/features/routines/ExerciseManager';
import SessionHistory from './components/features/sessions/SessionHistory';
import SettingsView from './components/features/settings/SettingsView';
import PlanificacionManager from './components/features/planning/PlanificacionManager';
import UpdatePassword from './components/features/auth/UpdatePassword';
import { Toaster } from './components/ui';
import { ClipWipeOverlay } from './components/ui/animations';
import { User, UserRole } from './types';
import { signOut } from './services/authService';
import { supabase } from './lib/supabaseClient';
import { Loader2 } from 'lucide-react';

// Inner component to handle routing logic
const AppContent: React.FC = () => {
  const { session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showClipWipe, setShowClipWipe] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('okko-theme');
    return saved ? JSON.parse(saved) : false;
  });
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

  // Fetch user profile when session changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user) {
        setUser(null);
        setLoadingProfile(false);
        return;
      }

      try {
        const { data: profileData, error } = await supabase
          .from('persona')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error || !profileData) {
          console.error("Profile fetch error:", error);
          setUser(null);
        } else {
          const defaultConfig = { unit: 'kg' as const, smallBrickWeight: 5, largeBrickWeight: 7.5 };
          let appConfig = defaultConfig;
          if (profileData.configuracion) {
              try {
                  const parsed = typeof profileData.configuracion === 'string' ? JSON.parse(profileData.configuracion) : profileData.configuracion;
                  appConfig = { ...defaultConfig, ...parsed };
              } catch (e) {
                  console.warn("Could not parse user config", e);
              }
          }

          setUser({
            id: profileData.id,
            name: `${profileData.nombre} ${profileData.apellido}`,
            firstName: profileData.nombre,
            lastName: profileData.apellido,
            email: profileData.email,
            role: profileData.rol === 'coach' ? UserRole.COACH : UserRole.STUDENT,
            avatarUrl: profileData.avatar_url || undefined,
            config: appConfig,
            coachCode: profileData.cod_coach || undefined
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUser(null);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [session]);

  // Handle PASSWORD_RECOVERY event
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/update-password');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    navigate('/');
  };

  // Loading profile after session is established
  if (session && loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-900 dark:text-white" size={32} />
      </div>
    );
  }

  const handleLoginSuccess = (loggedInUser: User) => {
    setShowClipWipe(true);
    setUser(loggedInUser);
  };

  // Allow access to Login if not authenticated
  if (!session || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Authenticated Routes
  return (
    <>
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
                    <Route path="/alumnos" element={<AlumnosWithHistory user={user} />} />
                    <Route path="/ejercicios" element={<ExerciseManager />} />
                    <Route path="/mi-progreso" element={<StudentDashboard user={user} />} />
                    <Route path="/configuracion" element={<SettingsView user={user} />} />
                    <Route path="/planificacion" element={<PlanificacionManager user={user} />} />
                    <Route path="*" element={<Navigate to="/logger" replace />} />
                  </>
                ) : (
                  <>
                    <Route path="/" element={<StudentDashboard user={user} />} />
                    <Route path="/historial" element={<SessionHistory studentId={user.id} />} />
                    <Route path="/configuracion" element={<SettingsView user={user} />} />
                    <Route path="/planificacion" element={<PlanificacionManager user={user} />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                )}
              </Routes>
            </Layout>
          } />
        </Routes>
      </GymProvider>
      {showClipWipe && (
        <ClipWipeOverlay direction="right" onComplete={() => setShowClipWipe(false)} />
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <>
      <Router>
        <SessionProvider>
          <AppContent />
        </SessionProvider>
      </Router>
      <Toaster />
    </>
  );
};

export default App;