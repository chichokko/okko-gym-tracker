import React, { useState } from 'react';
import { ActiveSession, generateId } from './features/sessions/types';
import { toast } from './ui';
import * as DataService from '../services/dataService';
import SessionDashboard from './features/sessions/SessionDashboard';
import SessionSetupWizard from './features/sessions/SessionSetupWizard';
import SessionFocusView from './features/sessions/SessionFocusView';
import { useGymData } from '../context/GymContext';
import { useConfirm } from '../hooks/useConfirm';
import { ConfirmDialog, PixelsOverlay } from './ui/animations';
import { useSessionStore } from '../store/useSessionStore';

const CoachSessionLogger: React.FC = () => {
    const { students, routines, exercises, isLoading: isGlobalLoading, refreshExercises } = useGymData();
    const sessionStore = useSessionStore();
    
    // Convert store object to array for UI
    const activeSessionsList = Object.values(sessionStore.activeSessions);

    const [viewMode, setViewMode] = useState<'DASHBOARD' | 'SETUP' | 'FOCUS'>('DASHBOARD');
    const [focusedStudentId, setFocusedStudentId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showPixelsTransition, setShowPixelsTransition] = useState(false);

    const sessionConfirm = useConfirm();

    const handleStartSession = async (studentId: string, routineId: string) => {
        try {
            await refreshExercises();
            const student = students.find(s => s.id === studentId);
            const routine = routines.find(r => r.id === routineId);
            
            if (!student) throw new Error("Student not found");
            if (sessionStore.activeSessions[studentId]) {
                toast.error("El alumno ya tiene una sesión activa.");
                return;
            }

            const initialExercises: import('../types').SessionExercise[] = routine
                ? routine.exercises.map(re => {
                    const baseEx = exercises.find(e => e.id === re.exerciseId);
                    if (!baseEx) return null;
                    return {
                        id: generateId(),
                        exercise: baseEx,
                        sets: Array.from({ length: re.sets }).map(() => ({
                            id: generateId(),
                            weight: 0,
                            reps: 0,
                            rpe: 0,
                            completedAt: new Date()
                        })),
                        notes: `Objetivo: ${re.sets} series x ${re.reps}`
                    };
                }).filter(Boolean) as import('../types').SessionExercise[]
                : [];

            const newSession: ActiveSession = {
                internalId: generateId(),
                student,
                routineName: routine?.name || 'Entrenamiento Libre',
                startTime: new Date(),
                exercises: initialExercises,
                activeExerciseId: initialExercises[0]?.id || null,
                isDbPersisted: false
            };

            sessionStore.startSession(studentId, newSession);
            toast.success(`Sesión iniciada para ${student.name}`);
            setShowPixelsTransition(true);

        } catch (error) {
            toast.error('Error al crear sesión');
            console.error(error);
        }
    };

    const handleDiscardSession = async (sessionId: string) => {
        // We use sessionId as the internal identifier in Dashboard, but store is keyed by studentId
        const session = activeSessionsList.find(s => s.internalId === sessionId);
        if (!session) return;

        const ok = await sessionConfirm.confirm({ 
            message: `¿Cancelar el entrenamiento de ${session.student.name}? Se perderá todo el progreso local.`, 
            confirmLabel: 'Cancelar Entrenamiento', 
            variant: 'danger' 
        });
        
        if (!ok) return;

        sessionStore.cancelSession(session.student.id);
        toast.success(`Entrenamiento cancelado`);
    };

    const handleFinishSession = async (sessionId: string) => {
        const session = activeSessionsList.find(s => s.internalId === sessionId);
        if (!session) return;

        setIsSaving(true);
        try {
            await DataService.saveSession({
                id: '',
                studentId: session.student.id,
                coachId: '',
                date: session.startTime,
                active: false,
                exercises: session.exercises
            });

            sessionStore.finishSession(session.student.id);
            toast.success(`Sesión de ${session.student.name} guardada exitosamente`);

            if (focusedStudentId === session.student.id) {
                setFocusedStudentId(null);
                setViewMode('DASHBOARD');
            }
        } catch (error) {
            toast.error('Error al guardar sesión en la base de datos');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelectSession = (sessionId: string) => {
        const session = activeSessionsList.find(s => s.internalId === sessionId);
        if (session) {
            setFocusedStudentId(session.student.id);
            setViewMode('FOCUS');
        }
    };

    if (viewMode === 'SETUP') {
        return (
            <>
                <SessionSetupWizard
                    isLoading={isGlobalLoading}
                    onBack={() => setViewMode('DASHBOARD')}
                    onStart={handleStartSession}
                />
                {showPixelsTransition && (
                    <PixelsOverlay onComplete={() => { setShowPixelsTransition(false); setViewMode('DASHBOARD'); }} />
                )}
            </>
        );
    }

    if (viewMode === 'FOCUS' && focusedStudentId) {
        const session = sessionStore.activeSessions[focusedStudentId];
        if (!session) {
            setViewMode('DASHBOARD');
            return null;
        }

        return (
            <SessionFocusView
                session={session}
                availableExercises={exercises}
                isLoading={isSaving}
                onBack={() => setViewMode('DASHBOARD')}
                onFinishSession={() => handleFinishSession(session.internalId)}
                onUpdateSession={(updater) => sessionStore.updateSession(focusedStudentId, updater)}
            />
        );
    }

    return (
        <>
            <SessionDashboard
                activeSessions={activeSessionsList}
                isLoading={isGlobalLoading}
                onStartNew={() => setViewMode('SETUP')}
                onSelectSession={handleSelectSession}
                onDiscardSession={handleDiscardSession}
            />
            <ConfirmDialog {...sessionConfirm.getDialogProps()} />
        </>
    );
};

export default CoachSessionLogger;