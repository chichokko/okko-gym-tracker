import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '../../../services/authService';
import { User } from '../../../types';
import { Input, Button, Card } from '../../ui';
import { AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCoachCode, setRegCoachCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { user, error: authError } = await signInWithEmail(email, password);

    if (authError) {
      if (authError.toLowerCase().includes('email not confirmed') || authError.toLowerCase().includes('confirma')) {
        setShowConfirmation(true);
        setConfirmationEmail(email);
      } else {
        setError(authError);
      }
      setLoading(false);
    } else if (user) {
      onLoginSuccess(user);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    setError(null);

    const { user, error: authError } = await signUpWithEmail(
      regFirstName,
      regLastName,
      regEmail,
      regPassword,
      regCoachCode
    );

    if (authError) {
      setError(authError);
      setLoading(false);
    } else if (user) {
      setShowConfirmation(true);
      setConfirmationEmail(regEmail);
    }
  };

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-slate-200 dark:border-slate-700 p-2">
            <img src="/okko_logo1.svg" alt="OKKO Logo" className="w-full h-full object-contain" />
          </div>
          <Card className="p-8 shadow-xl border-t-4 border-t-blue-500">
            <h2 className="text-xl font-bold mb-4">Confirma tu correo</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Hemos enviado un enlace de confirmación a <strong>{confirmationEmail}</strong>.
              Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
            </p>
            <p className="text-sm text-slate-400 mb-6">
              ¿No lo recibiste? Revisa la carpeta de spam o intenta registrarte de nuevo.
            </p>
            <Button variant="ghost" onClick={() => setShowConfirmation(false)}>
              Volver al inicio de sesión
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-6 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg border border-slate-200 dark:border-slate-700 p-2">
            <img src="/okko_logo1.svg" alt="OKKO Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">OKKO Gym Tracker</h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isLoginView ? 'Ingresa tus credenciales para continuar' : 'Crea tu cuenta de alumno'}
          </p>
        </div>

        <Card className="p-8 shadow-xl border-t-4 border-t-slate-900 dark:border-t-blue-500 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {isLoginView ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle size={18} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Input
                    label="Email"
                    type="email"
                    placeholder="ejemplo@okko.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <Input
                    label="Contraseña"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />

                  <Button fullWidth disabled={loading} className="mt-6">
                    {loading ? <Loader2 className="animate-spin" /> : 'Iniciar Sesión'}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle size={18} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Nombre" value={regFirstName} onChange={e => setRegFirstName(e.target.value)} required />
                    <Input label="Apellido" value={regLastName} onChange={e => setRegLastName(e.target.value)} required />
                  </div>
                  
                  <Input label="Email" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Contraseña" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required minLength={6} />
                    <Input label="Confirmar" type="password" value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)} required minLength={6} />
                  </div>

                  <Input label="Código de Entrenador (Opcional)" value={regCoachCode} onChange={e => setRegCoachCode(e.target.value)} placeholder="Ej: COACH-XYZ" />

                  <Button fullWidth disabled={loading} className="mt-6">
                    {loading ? <Loader2 className="animate-spin" /> : 'Registrarse como Alumno'}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <div className="text-center mt-6">
          <button 
            type="button" 
            onClick={() => { setIsLoginView(!isLoginView); setError(null); }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {isLoginView ? '¿Eres alumno nuevo? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;