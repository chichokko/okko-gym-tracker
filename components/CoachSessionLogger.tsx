import React, { useState, useEffect } from 'react';
import { ActiveSession, generateId } from './features/sessions/types';
import { toast } from './ui';
import * as DataService from '../services/dataService';
import SessionDashboard from './features/sessions/SessionDashboard';
import SessionSetupWizard from './features/sessions/SessionSetupWizard';
import SessionFocusView from './features/sessions/SessionFocusView';
import { useGymData } from '../context/GymContext';
import { User } from '../types';

const CoachSessionLogger: React.FC = () => {
    // Context Data
    const { students, routines, exercises, isLoading: isGlobalLoading, refreshExercises } = useGymData();

    // View state
    const [viewMode, setViewMode] = useState<'DASHBOARD' | 'SETUP' | 'FOCUS'>('DASHBOARD');
    const [focusedSessionId, setFocusedSessionId] = useState<string | null>(null);

    // Local Data (Transactional)
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(true);

    // Load Active Sessions
    useEffect(() => {
        const loadSessions = async () => {
            setIsLoadingSessions(true);
            try {
                const dbSessions = await DataService.getActiveSessions();

                // Map DB sessions to UI format using Global Context Students
                const mappedSessions: ActiveSession[] = dbSessions.map(dbs => ({
                    internalId: dbs.id,
                    student: students.find(s => s.id === dbs.studentId) || { id: dbs.studentId, name: 'Desconocido', role: 'STUDENT' } as User,
                    routineName: 'En curso',
                    startTime: dbs.date,
                    exercises: dbs.exercises,
                    activeExerciseId: dbs.exercises[0]?.id || null,
                    isDbPersisted: true
                }));

                setActiveSessions(mappedSessions);
            } catch (error) {
                console.error(error);
                toast.error('Error al cargar sesiones activas');
            } finally {
                setIsLoadingSessions(false);
            }
        };

        if (!isGlobalLoading) {
            loadSessions();
        }
    }, [isGlobalLoading, students]); // Reload if students change (initial load)

    // Start new session
    const handleStartSession = async (studentId: string, routineId: string) => {
        setIsLoadingSessions(true);
        try {
            // Force refresh exercises to avoid RLS stale data issues (Old exercises missing)
            await refreshExercises();

            const student = students.find(s => s.id === studentId);
            const routine = routines.find(r => r.id === routineId);
            if (!student) throw new Error("Student not found");

            // Build initial exercises from routine
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
                internalId: 'temp-' + generateId(),
                student,
                routineName: routine?.name || 'Entrenamiento Libre',
                startTime: new Date(),
                exercises: initialExercises,
                activeExerciseId: initialExercises[0]?.id || null,
                isDbPersisted: false
            };

            const saved = await DataService.saveSession({
                id: '',
                studentId: student.id,
                coachId: '',
                date: newSession.startTime,
                active: true,
                exercises: initialExercises
            });

            if (saved?.id) {
                newSession.internalId = saved.id;
                newSession.isDbPersisted = true;
            }

            setActiveSessions(prev => [...prev, newSession]);
            toast.success(`Sesión iniciada para ${student.name}`);
            setViewMode('DASHBOARD');

        } catch (error) {
            toast.error('Error al crear sesión');
            console.error(error);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    const handleSaveProgress = async (sessionId: string) => {
        const session = activeSessions.find(s => s.internalId === sessionId);
        if (!session) return;

        // No loading state needed for background save, just toast promise maybe?
        // Using existing pattern for now

        toast.promise(
            DataService.saveSession({
                id: session.isDbPersisted ? session.internalId : '',
                studentId: session.student.id,
                coachId: '',
                date: session.startTime,
                active: true,
                exercises: session.exercises
            }).then(saved => {
                if (saved?.id && !session.isDbPersisted) {
                    updateSession(sessionId, s => ({ ...s, internalId: saved.id, isDbPersisted: true }));
                    if (focusedSessionId === sessionId) setFocusedSessionId(saved.id);
                }
            }),
            {
                loading: 'Guardando...',
                success: 'Progreso guardado',
                error: 'Error al guardar'
            }
        );
    };

    const handleFinishSession = async (sessionId: string) => {
        const session = activeSessions.find(s => s.internalId === sessionId);
        if (!session) return;

        if (!confirm(`¿Terminar entrenamiento de ${session.student.name}?`)) return;

        setIsLoadingSessions(true);
        try {
            await DataService.saveSession({
                id: session.isDbPersisted ? session.internalId : '',
                studentId: session.student.id,
                coachId: '',
                date: session.startTime,
                active: false,
                exercises: session.exercises
            });

            setActiveSessions(prev => prev.filter(s => s.internalId !== sessionId));
            toast.success(`Sesión de ${session.student.name} finalizada`);

            if (focusedSessionId === sessionId) {
                setFocusedSessionId(null);
                setViewMode('DASHBOARD');
            }
        } catch (error) {
            toast.error('Error al finalizar sesión');
            console.error(error);
        } finally {
            setIsLoadingSessions(false);
        }
    };

    const updateSession = (sessionId: string, updater: (s: ActiveSession) => ActiveSession) => {
        setActiveSessions(prev => prev.map(s => s.internalId === sessionId ? updater(s) : s));
    };

    const handleSelectSession = (sessionId: string) => {
        setFocusedSessionId(sessionId);
        setViewMode('FOCUS');
    };

    if (viewMode === 'SETUP') {
        return (
            <SessionSetupWizard
                isLoading={isLoadingSessions}
                onBack={() => setViewMode('DASHBOARD')}
                onStart={handleStartSession}
            />
        );
    }

    if (viewMode === 'FOCUS' && focusedSessionId) {
        const session = activeSessions.find(s => s.internalId === focusedSessionId);
        if (!session) {
            setViewMode('DASHBOARD');
            return null;
        }

        return (
            <SessionFocusView
                session={session}
                availableExercises={exercises} // From Context
                isLoading={isLoadingSessions} // Or separate saving state
                onBack={() => setViewMode('DASHBOARD')}
                onSaveProgress={() => handleSaveProgress(session.internalId)}
                onFinishSession={() => handleFinishSession(session.internalId)}
                onUpdateSession={(updater) => updateSession(session.internalId, updater)}
            />
        );
    }

    return (
        <SessionDashboard
            activeSessions={activeSessions}
            isLoading={isGlobalLoading || isLoadingSessions}
            onStartNew={() => setViewMode('SETUP')}
            onSelectSession={handleSelectSession}
        />
    );
};

export default CoachSessionLogger;