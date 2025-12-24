import React, { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Card, Input, Button, LoadingSpinner } from '../../ui';
import { toast } from '../../ui';
import { useNavigate } from 'react-router-dom';
import { Lock, Save } from 'lucide-react';

const UpdatePassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            toast.success('Contraseña actualizada correctamente');
            navigate('/'); // Navigate to home/dashboard
        } catch (error: any) {
            console.error('Error updating password:', error);
            toast.error(error.message || 'Error al actualizar contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 space-y-6">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto">
                        <Lock size={24} />
                    </div>
                    <h1 className="text-2xl font-bold">Establecer Contraseña</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Ingresa tu nueva contraseña para completar el registro.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nueva Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />
                    <Input
                        label="Confirmar Contraseña"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    <Button type="submit" fullWidth disabled={isLoading}>
                        {isLoading ? <LoadingSpinner size="sm" /> : <><Save size={18} className="mr-2" /> Actualizar</>}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default UpdatePassword;
