import React, { useState, useEffect } from 'react';
import { Exercise, SessionExercise, SetLog, User, Routine, Session } from '../types';
import { toast } from './ui';
import * as DataService from '../services/dataService';
import SessionDashboard from './features/sessions/SessionDashboard';
import SessionSetupWizard from './features/sessions/SessionSetupWizard';
import SessionFocusView from './features/sessions/SessionFocusView';
import { ActiveSession, generateId } from './features/sessions/types';

const CoachSessionLogger: React.FC = () => {
    // View state
    const [viewMode, setViewMode] = useState<'DASHBOARD' | 'SETUP' | 'FOCUS'>('DASHBOARD');
    const [focusedSessionId, setFocusedSessionId] = useState<string | null>(null);

    // Data
    const [availableStudents, setAvailableStudents] = useState<User[]>([]);
    const [availableRoutines, setAvailableRoutines] = useState<Routine[]>([]);
    const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

    // Loading state
    const [isLoading, setIsLoading] = useState(true);

    // Initial data load
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [students, routines, exercises, dbSessions] = await Promise.all([
                    DataService.getStudents(),
                    DataService.getRoutines(),
                    DataService.getExercises(),
                    DataService.getActiveSessions()
                ]);

                setAvailableStudents(students);
                setAvailableRoutines(routines);
                setAvailableExercises(exercises);

                // Map DB sessions to UI format
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
                toast.error('Error al cargar datos');
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // Start new session
    const handleStartSession = async (studentId: string, routineId: string) => {
        const student = availableStudents.find(s => s.id === studentId);
        const routine = availableRoutines.find(r => r.id === routineId);
        if (!student) return;

        setIsLoading(true);

        // Build initial exercises from routine
        const initialExercises: SessionExercise[] = routine
            ? routine.exercises.map(re => {
                const baseEx = availableExercises.find(e => e.id === re.exerciseId);
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
            }).filter(Boolean) as SessionExercise[]
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

        try {
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
        } catch (error) {
            toast.error('Error al crear sesión');
            console.error(error);
        } finally {
            setIsLoading(false);
            setViewMode('DASHBOARD');
        }
    };

    // Save progress
    const handleSaveProgress = async (sessionId: string) => {
        const session = activeSessions.find(s => s.internalId === sessionId);
        if (!session) return;

        setIsLoading(true);
        try {
            const saved = await DataService.saveSession({
                id: session.isDbPersisted ? session.internalId : '',
                studentId: session.student.id,
                coachId: '',
                date: session.startTime,
                active: true,
                exercises: session.exercises
            });

            if (saved?.id && !session.isDbPersisted) {
                updateSession(sessionId, s => ({ ...s, internalId: saved.id, isDbPersisted: true }));
                if (focusedSessionId === sessionId) setFocusedSessionId(saved.id);
            }

            toast.success('Progreso guardado');
        } catch (error) {
            toast.error('Error al guardar');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Finish session
    const handleFinishSession = async (sessionId: string) => {
        const session = activeSessions.find(s => s.internalId === sessionId);
        if (!session) return;

        if (!confirm(`¿Terminar entrenamiento de ${session.student.name}?`)) return;

        setIsLoading(true);
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
            setIsLoading(false);
        }
    };

    // Update session helper
    const updateSession = (sessionId: string, updater: (s: ActiveSession) => ActiveSession) => {
        setActiveSessions(prev => prev.map(s => s.internalId === sessionId ? updater(s) : s));
    };

    // Navigation
    const handleSelectSession = (sessionId: string) => {
        setFocusedSessionId(sessionId);
        setViewMode('FOCUS');
    };

    // Render views
    if (viewMode === 'SETUP') {
        return (
            <SessionSetupWizard
                availableStudents={availableStudents}
                availableRoutines={availableRoutines}
                isLoading={isLoading}
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
                availableExercises={availableExercises}
                isLoading={isLoading}
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
            isLoading={isLoading}
            onStartNew={() => setViewMode('SETUP')}
            onSelectSession={handleSelectSession}
        />
    );
};

export default CoachSessionLogger;