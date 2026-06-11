export enum UserRole {
  COACH = 'COACH',
  STUDENT = 'STUDENT'
}

export interface AppConfig {
  unit: 'kg' | 'lbs';
  smallBrickWeight: number;
  largeBrickWeight: number;
  logoUrl?: string;
}

export interface User {
  id: string;
  name: string;
  firstName?: string; // added to split name
  lastName?: string;  // added to split name
  role: UserRole;
  email?: string;
  avatarUrl?: string;
  activo?: boolean;
  config?: AppConfig;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  defaultRestSeconds: number;
  accessory?: string;
  videoUrl?: string;
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
  student?: { name: string; email?: string }; // Optional embedded student info
  coachId: string;
  date: Date;
  exercises: SessionExercise[];
  active: boolean; // true = ongoing, false = completed/history
}

export interface RoutineExercise {
  exerciseId: string;
  sets: number;
  reps: string; // "8-12" or "5"
  restSeconds: number; // kept for backwards compatibility or deprecated
  cadence?: string;
  rest?: string;
  observation?: string;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  creatorName?: string;
}

export interface RutinaPlanificacion {
  id: string;
  planificacionId: string;
  routineId: string;
  orden?: number;
  routine?: Routine;
}

export interface Planificacion {
  id: string;
  name: string;
  description?: string;
  creatorId: string;
  type: string;
  duration?: string;
  studentId?: string;
  createdAt?: Date;
  activo?: boolean;
  days: RutinaPlanificacion[];
}

export interface MockDataState {
  currentUser: User;
  students: User[];
  exercises: Exercise[];
  routines: Routine[];
}