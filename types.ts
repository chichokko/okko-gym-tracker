export enum UserRole {
  COACH = 'COACH',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  avatarUrl?: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  defaultRestSeconds: number;
}

export interface SetLog {
  id: string;
  reps: number;
  weight: number;
  rpe: number; // Rate of Perceived Exertion (1-10)
  completedAt: Date;
}

export interface SessionExercise {
  id: string;
  exercise: Exercise;
  sets: SetLog[];
  notes?: string;
}

export interface Session {
  id: string;
  studentId: string;
  coachId: string;
  date: Date;
  exercises: SessionExercise[];
  active: boolean; // true = ongoing, false = completed/history
}

export interface RoutineExercise {
  exerciseId: string;
  sets: number;
  reps: string; // "8-12" or "5"
  restSeconds: number;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
}

export interface MockDataState {
  currentUser: User;
  students: User[];
  exercises: Exercise[];
  routines: Routine[];
}