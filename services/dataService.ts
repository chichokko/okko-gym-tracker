import { supabase } from '../lib/supabaseClient';
import { User, Routine, Exercise, Session, SessionExercise, SetLog, UserRole } from '../types';

// --- USUARIOS (PERSONA) ---

export const getStudents = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('persona')
    .select('*')
    .eq('rol', 'alumno');

  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }

  // Mapping DB snake_case to app CamelCase
  return data.map((p: any) => ({
    id: p.id,
    name: `${p.nombre} ${p.apellido}`,
    role: UserRole.STUDENT,
    email: p.email
  }));
};

export const createStudent = async (student: Partial<User> & { firstName: string, lastName: string }): Promise<User | null> => {
  // En un caso real, esto debería estar vinculado a auth.signUp
  const { data, error } = await supabase
    .from('persona')
    .insert([{
      nombre: student.firstName,
      apellido: student.lastName,
      email: student.email,
      rol: 'alumno'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating student:', error);
    return null;
  }

  return {
    id: data.id,
    name: `${data.nombre} ${data.apellido}`,
    role: UserRole.STUDENT,
    email: data.email
  };
};

// --- EJERCICIOS ---

export const getExercises = async (): Promise<Exercise[]> => {
  const { data, error } = await supabase.from('ejercicio').select('*');
  if (error) return [];

  return data.map((e: any) => ({
    id: e.id,
    name: e.nombre,
    muscleGroup: e.grupo_muscular,
    defaultRestSeconds: 120 // Default ya que no está en la tabla ejercicio original
  }));
};

export const saveExercise = async (exercise: Partial<Exercise>): Promise<boolean> => {
  const payload: any = {
    nombre: exercise.name,
    grupo_muscular: exercise.muscleGroup
  };

  // Only include ID if it's an update (Supabase upsert handles this, but good practice)
  if (exercise.id) payload.id = exercise.id;

  const { error } = await supabase
    .from('ejercicio')
    .upsert(payload);

  if (error) {
    console.error('Error saving exercise:', error);
    return false;
  }
  return true;
};

export const deleteExercise = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('ejercicio')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting exercise:', error);
    return false;
  }
  return true;
};

// --- RUTINAS ---

export const getRoutines = async (): Promise<Routine[]> => {
  // Eliminamos descanso_segundos de la query ya que no existe en DB
  const { data, error } = await supabase
    .from('rutina')
    .select(`
      id, nombre, descripcion,
      rutina_ejercicio (
        ejercicio_id,
        series_objetivo,
        reps_objetivo,
        orden
      )
    `);

  if (error) {
    console.error(error);
    return [];
  }

  return data.map((r: any) => ({
    id: r.id,
    name: r.nombre,
    description: r.descripcion,
    exercises: r.rutina_ejercicio.sort((a: any, b: any) => a.orden - b.orden).map((re: any) => ({
      exerciseId: re.ejercicio_id,
      sets: re.series_objetivo,
      reps: re.reps_objetivo,
      restSeconds: 120 // Valor por defecto ya que no viene de la base de datos
    }))
  }));
};

export const saveRoutine = async (routine: Routine): Promise<boolean> => {
  try {
    // 1. Obtener usuario actual (Coach)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No user authenticated");

    // 2. Obtener la 'persona' asociada al usuario para obtener el creador_id correcto
    const { data: persona, error: personaError } = await supabase
      .from('persona')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (personaError || !persona) throw new Error("No se encontró el perfil del entrenador");

    // 3. Upsert Rutina
    const routinePayload = {
      id: routine.id || undefined, // undefined deja que Supabase genere UUID si es nuevo
      nombre: routine.name,
      descripcion: routine.description,
      creador_id: persona.id // Campo corregido según especificación
    };

    const { data: savedRoutine, error: routineError } = await supabase
      .from('rutina')
      .upsert(routinePayload)
      .select()
      .single();

    if (routineError) throw routineError;

    // 4. Manejar Ejercicios
    // Estrategia: Borrar todos los ejercicios de esta rutina e insertarlos de nuevo para asegurar orden y limpieza
    if (savedRoutine.id) {
      await supabase
        .from('rutina_ejercicio')
        .delete()
        .eq('rutina_id', savedRoutine.id);
    }

    if (routine.exercises.length > 0) {
      const exercisesPayload = routine.exercises.map((ex, index) => ({
        rutina_id: savedRoutine.id,
        ejercicio_id: ex.exerciseId,
        series_objetivo: ex.sets,
        reps_objetivo: ex.reps, // string "8-12"
        // descanso_segundos: ex.restSeconds, // Eliminado porque no existe columna
        orden: index
      }));

      const { error: exercisesError } = await supabase
        .from('rutina_ejercicio')
        .insert(exercisesPayload);

      if (exercisesError) throw exercisesError;
    }

    return true;
  } catch (error) {
    console.error("Error saving routine:", error);
    return false;
  }
};

// --- SESIONES ---

export const getActiveSessions = async (): Promise<Session[]> => {
  const { data, error } = await supabase
    .from('sesion')
    .select(`
      *,
      persona!alumno_id (*),
      detalle_sesion (
        *,
        ejercicio (*)
      )
    `)
    .eq('activo', true)
    .order('fecha', { ascending: false });

  if (error) {
    console.error("Error fetching active sessions:", error);
    return [];
  }

  // Reconstruct nested object structure
  return data.map((s: any) => {
    // Agrupar detalles por ejercicio para reconstruir la estructura visual
    const exercisesMap = new Map<string, SessionExercise>();

    // Ordenar los detalles por ID para intentar mantener un orden de inserción (o usar created_at si existe)
    const detalles = s.detalle_sesion || [];

    detalles.forEach((d: any) => {
      if (!d.ejercicio) return;

      if (!exercisesMap.has(d.ejercicio_id)) {
        exercisesMap.set(d.ejercicio_id, {
          id: d.ejercicio_id, // Usamos el ID del ejercicio como ID del bloque visual por simplicidad
          exercise: {
            id: d.ejercicio.id,
            name: d.ejercicio.nombre,
            muscleGroup: d.ejercicio.grupo_muscular,
            defaultRestSeconds: 120
          },
          sets: []
        });
      }

      const exEntry = exercisesMap.get(d.ejercicio_id)!;
      exEntry.sets.push({
        id: d.id,
        reps: d.reps_reales || 0,
        weight: d.peso_kg || 0,
        rpe: d.rpe || 0,
        completedAt: new Date() // Si hubiera created_at en detalle_sesion, usar eso
      });
      // Ordenar sets por numero de serie
      exEntry.sets.sort((a: any, b: any) => parseInt(a.id) - parseInt(b.id)); // Fallback sort
    });

    return {
      id: s.id,
      studentId: s.alumno_id,
      coachId: s.coach_id || s.creador_id,
      date: new Date(s.fecha),
      active: s.activo,
      // Convertir mapa a array
      exercises: Array.from(exercisesMap.values())
    };
  });
};

export const saveSession = async (session: Session) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Obtener Persona ID si no viene el coachId (asumimos current user)
    let coachPersonaId = session.coachId;
    if (!coachPersonaId && user) {
      const { data: persona } = await supabase.from('persona').select('id').eq('user_id', user.id).single();
      if (persona) coachPersonaId = persona.id;
    }

    // 2. Upsert Cabecera de Sesión
    const sessionPayload = {
      id: session.id && session.id.length > 10 ? session.id : undefined, // Si es ID temporal corto, dejar undefined para autogenerar
      alumno_id: session.studentId,
      coach_id: coachPersonaId,
      // creador_id: coachPersonaId, // Si la tabla usa creador_id en vez de coach_id, descomentar
      fecha: session.date,
      activo: session.active, // Importante: Guardar estado activo. TRUE = En curso, FALSE = Historial.
    };

    const { data: sesionData, error: sesionError } = await supabase
      .from('sesion')
      .upsert(sessionPayload)
      .select()
      .single();

    if (sesionError) throw sesionError;

    // 3. Insertar detalles (Logs)
    // Estrategia: Borrar detalles anteriores de esta sesión y reinsertar para mantener consistencia
    // Esto simplifica la lógica de actualizaciones de sets (borrar sets, añadir nuevos)
    if (sesionData.id) {
      await supabase.from('detalle_sesion').delete().eq('sesion_id', sesionData.id);
    }

    const logsToInsert: any[] = [];

    session.exercises.forEach(ex => {
      ex.sets.forEach((set, index) => {
        logsToInsert.push({
          sesion_id: sesionData.id,
          ejercicio_id: ex.exercise.id,
          nro_serie: index + 1,
          peso_kg: set.weight,
          reps_reales: set.reps,
          rpe: set.rpe
        });
      });
    });

    if (logsToInsert.length > 0) {
      const { error: detailError } = await supabase
        .from('detalle_sesion')
        .insert(logsToInsert);

      if (detailError) throw detailError;
    }

    return sesionData;
  } catch (error) {
    console.error("Error saving session:", error);
    throw error;
  }
};

// Interface for completed session with student info
export interface CompletedSession {
  id: string;
  studentName: string;
  studentId: string;
  date: Date;
  exerciseCount: number;
  totalSets: number;
  totalVolume: number; // kg
  exercises: {
    name: string;
    sets: Array<{ weight: number; reps: number; rpe: number }>;
  }[];
}

export const getCompletedSessions = async (studentId?: string): Promise<CompletedSession[]> => {
  let query = supabase
    .from('sesion')
    .select(`
      id,
      fecha,
      alumno_id,
      persona!alumno_id (nombre, apellido),
      detalle_sesion (
        peso_kg,
        reps_reales,
        rpe,
        ejercicio (nombre)
      )
    `)
    .eq('activo', false)
    .order('fecha', { ascending: false });

  if (studentId) {
    query = query.eq('alumno_id', studentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching completed sessions:", error);
    return [];
  }

  return data.map((s: any) => {
    const detalles = s.detalle_sesion || [];

    // Group details by exercise name
    const exerciseMap = new Map<string, Array<{ weight: number; reps: number; rpe: number }>>();
    let totalVolume = 0;

    detalles.forEach((d: any) => {
      const exName = d.ejercicio?.nombre || 'Desconocido';
      if (!exerciseMap.has(exName)) {
        exerciseMap.set(exName, []);
      }
      exerciseMap.get(exName)!.push({
        weight: d.peso_kg || 0,
        reps: d.reps_reales || 0,
        rpe: d.rpe || 0
      });
      totalVolume += (d.peso_kg || 0) * (d.reps_reales || 0);
    });

    const exercises = Array.from(exerciseMap.entries()).map(([name, sets]) => ({
      name,
      sets
    }));

    return {
      id: s.id,
      studentName: s.persona ? `${s.persona.nombre} ${s.persona.apellido}` : 'Alumno desconocido',
      studentId: s.alumno_id,
      date: new Date(s.fecha),
      exerciseCount: exercises.length,
      totalSets: detalles.length,
      totalVolume: Math.round(totalVolume),
      exercises
    };
  });
};

// Simulación de carga inicial si no hay backend real conectado aún
export const mockInitialize = async () => {
  // Aquí podrías poner lógica para verificar auth
  return true;
}