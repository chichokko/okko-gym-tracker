import React, { useState } from 'react';
import { Button, Input, Card } from './ui';
import { signInWithEmail } from '../services/authService';
import { User } from '../types';
import { AlertCircle, Loader2 } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { user, error: authError } = await signInWithEmail(email, password);

    if (authError) {
      setError(authError);
      setLoading(false);
    } else if (user) {
      onLoginSuccess(user);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-slate-900 dark:bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg shadow-blue-500/20">O</div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Bienvenido a OKKO</h1>
            <p className="text-slate-500 dark:text-slate-400">Ingresa tus credenciales para continuar</p>
        </div>

        <Card className="p-8 shadow-xl border-t-4 border-t-slate-900 dark:border-t-blue-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
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
            </div>

            <Button fullWidth disabled={loading} className="mt-6">
              {loading ? <Loader2 className="animate-spin" /> : 'Iniciar Sesión'}
            </Button>

            {/* Hint para desarrollo */}
            <div className="text-center">
              <p className="text-xs text-slate-400 mt-4">
                ¿No tienes cuenta? Pide acceso a tu entrenador.
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;