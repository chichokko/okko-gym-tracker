import { Exercise, SessionExercise, SetLog, User, Routine, Session } from '../../../types';

// Interface para sesión activa en la UI
export interface ActiveSession {
    internalId: string;
    student: User;
    routineName: string;
    startTime: Date;
    exercises: SessionExercise[];
    activeExerciseId: string | null;
    isDbPersisted?: boolean;
}

// Helpers
export const generateId = () => Math.random().toString(36).substr(2, 9);

export const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};
