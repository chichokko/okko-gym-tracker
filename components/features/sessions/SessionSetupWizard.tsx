import React, { useState } from 'react';
import { Card, Button, IconButton, PageHeader, EmptyState, LoadingSpinner } from '../../ui';
import { Plus, Check, ArrowLeft, Users } from 'lucide-react';
import { useGymData } from '../../../context/GymContext';

interface SessionSetupWizardProps {
    isLoading: boolean;
    onBack: () => void;
    onStart: (studentId: string, routineId: string) => void;
}

const SessionSetupWizard: React.FC<SessionSetupWizardProps> = ({
    isLoading,
    onBack,
    onStart,
}) => {
    const { students, routines } = useGymData();
    const [studentId, setStudentId] = useState('');
    const [routineId, setRoutineId] = useState('');

    const handleStart = () => {
        if (studentId) {
            onStart(studentId, routineId);
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-6 animate-in slide-in-from-bottom-5 pb-20">
            <div className="flex items-center gap-2 mb-6">
                <IconButton onClick={onBack}><ArrowLeft /></IconButton>
                <h2 className="text-2xl font-bold">Nuevo Entrenamiento</h2>
            </div>

            <Card className="space-y-4">
                {/* Step 1: Select Student */}
                <div>
                    <label className="text-sm font-bold text-slate-500 uppercase">1. Alumno</label>
                    {students.length === 0 ? (
                        <EmptyState icon={Users} message="No hay alumnos registrados." />
                    ) : (
                        <div className="grid grid-cols-1 gap-2 mt-2 max-h-60 overflow-y-auto">
                            {students.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => setStudentId(s.id)}
                                    className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-colors ${studentId === s.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                                        {s.name[0]}
                                    </div>
                                    <span className="font-medium">{s.name}</span>
                                    {studentId === s.id && <Check size={16} className="ml-auto text-blue-500" />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Step 2: Select Routine */}
                {studentId && (
                    <div className="animate-in fade-in">
                        <label className="text-sm font-bold text-slate-500 uppercase">2. Rutina</label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                            <div
                                onClick={() => setRoutineId('')}
                                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 ${routineId === ''
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-slate-700'
                                    }`}
                            >
                                <Plus size={18} /> Sin Rutina (Libre)
                            </div>
                            {routines.map(r => (
                                <div
                                    key={r.id}
                                    onClick={() => setRoutineId(r.id)}
                                    className={`p-3 rounded-lg border cursor-pointer ${routineId === r.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-slate-700'
                                        }`}
                                >
                                    <div className="font-medium">{r.name}</div>
                                    <div className="text-xs text-slate-500">{r.exercises.length} ejercicios</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <Button fullWidth disabled={!studentId || isLoading} onClick={handleStart}>
                    {isLoading ? <><LoadingSpinner size="sm" /> Creando...</> : 'Comenzar Sesión'}
                </Button>
            </Card>
        </div>
    );
};

export default SessionSetupWizard;
