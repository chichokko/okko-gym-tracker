import { supabase } from '../lib/supabaseClient';
import { User, Routine, Exercise, Session, SessionExercise, SetLog, UserRole } from '../types';

// --- USUARIOS (PERSONA) ---

// Helper to handle auth errors globally
const handleAuthError = async (error: any) => {
  if (!error) return;
  console.error('DataService Error:', error);

  // Check for JWT expiry or invalid token messages
  const msg = error.message?.toLowerCase() || '';
  if (
    msg.includes('jwt') ||
    msg.includes('token') ||
    msg.includes('auth') ||
    error.code === 'PGRST301' || // 401 Unauthorized
    error.status === 401 ||
    error.status === 403
  ) {
    console.warn('Auth error detected in DataService, forcing logout...');
    // Force local logout to trigger UI redirect via onAuthStateChange
    await supabase.auth.signOut({ scope: 'local' });
    // Do NOT reload page forces infinite loop if the error persists on load
    // window.location.href = '/'; 
  }
};

export const getStudents = async (): Promise<User[]> => {
  // 1. Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 2. Obtener la 'persona' asociada al usuario (Coach)
  const { data: persona } = await supabase.from('persona').select('id').eq('user_id', user.id).single();
  if (!persona) return [];

  // 3. Obtener alumnos activos relacionados con este coach
  // Usamos !inner para filtrar solo los que tienen relación en coach_alumno con este coach Y activo=true
  // Usamos un alias 'coach_alumno' para la relación explícita y evitar errores PGRST201
  const { data, error } = await supabase
    .from('persona')
    .select(`
      *,
      coach_alumno:coach_alumno!coach_alumno_id_alumno_fkey!inner (
        id_coach,
        activo
      )
    `)
    .eq('coach_alumno.id_coach', persona.id)
    .eq('coach_alumno.activo', true);

  if (error) {
    await handleAuthError(error);
    return [];
  }

  // Mapping DB snake_case to app CamelCase
  return data.map((p: any) => ({
    id: p.id,
    name: `${p.nombre} ${p.apellido}`,
    firstName: p.nombre,
    lastName: p.apellido,
    role: UserRole.STUDENT,
    email: p.email,
    activo: p.activo !== false
  }));
};

export const createStudent = async (student: Partial<User> & { firstName: string, lastName: string }): Promise<User | null> => {
  // 1. Obtener usuario actual (Coach)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: persona } = await supabase.from('persona').select('id').eq('user_id', user.id).single();
  if (!persona) return null;

  // 2. Crear Alumno
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
    await handleAuthError(error);
    return null;
  }

  // 3. Crear relación Coach-Alumno (Auto-link)
  const { error: relError } = await supabase
    .from('coach_alumno')
    .insert([{
      id_coach: persona.id,
      id_alumno: data.id,
      activo: true
    }]);

  if (relError) {
    console.error("Error creating coach-student relation:", relError);
    // Podríamos borrar el alumno creado si la relación falla, pero por ahora lo dejamos y solo logueamos
  }

  return {
    id: data.id,
    name: `${data.nombre} ${data.apellido}`,
    role: UserRole.STUDENT,
    email: data.email
  };
};

export const updateStudent = async (id: string, data: { firstName?: string; lastName?: string; email?: string }): Promise<boolean> => {
  const payload: any = {};
  if (data.firstName !== undefined) payload.nombre = data.firstName;
  if (data.lastName !== undefined) payload.apellido = data.lastName;
  if (data.email !== undefined) payload.email = data.email;

  const { error } = await supabase
    .from('persona')
    .update(payload)
    .eq('id', id);

  if (error) {
    await handleAuthError(error);
    return false;
  }
  return true;
};

export const updateUserProfile = async (id: string, data: Partial<User>): Promise<boolean> => {
  const payload: any = {};
  if (data.firstName) payload.nombre = data.firstName;
  if (data.lastName) payload.apellido = data.lastName;
  if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl; // allows clearing with empty string

  const { error } = await supabase
    .from('persona')
    .update(payload)
    .eq('id', id);

  if (error) {
    await handleAuthError(error);
    return false;
  }
  return true;
};

export const updateUserConfig = async (id: string, config: any): Promise<boolean> => {
  const { error } = await supabase
    .from('persona')
    .update({ configuracion: config }) // Save as JSONB
    .eq('id', id);

  if (error) {
    await handleAuthError(error);
    return false;
  }
  return true;
};

// --- EJERCICIOS ---

export const getExercises = async (): Promise<Exercise[]> => {
  const { data, error } = await supabase.from('ejercicio').select('*');
  if (error) {
    await handleAuthError(error);
    return [];
  }

  return data.map((e: any) => ({
    id: e.id,
    name: e.nombre,
    muscleGroup: e.grupo_muscular,
    defaultRestSeconds: 120, // Default ya que no está en la tabla ejercicio original
    accessory: e.accesorio,
    videoUrl: e.video_url
  }));
};

export const saveExercise = async (exercise: Partial<Exercise>): Promise<Exercise | null> => {
  try {
    const payload: any = {
      nombre: exercise.name,
      grupo_muscular: exercise.muscleGroup,
      accesorio: exercise.accessory,
      video_url: exercise.videoUrl
    };

    if (exercise.id) payload.id = exercise.id;

    const { data, error } = await supabase
      .from('ejercicio')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      await handleAuthError(error);
      return null;
    }

    return {
      id: data.id,
      name: data.nombre,
      muscleGroup: data.grupo_muscular,
      defaultRestSeconds: 120,
      accessory: data.accesorio,
      videoUrl: data.video_url
    };
  } catch (error) {
    console.error("Error saving exercise logic:", error);
    return null;
  }
};

export const deleteExercise = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('ejercicio')
    .delete()
    .eq('id', id);

  if (error) {
    await handleAuthError(error);
    return false;
  }
  return true;
};

// --- RUTINAS ---

export const getRoutines = async (): Promise<Routine[]> => {
  // Incluimos creador_id y hacemos join con persona para obtener nombre del creador
  const { data, error } = await supabase
    .from('rutina')
    .select(`
      id, nombre, descripcion, creador_id,
      persona!creador_id (nombre, apellido),
      rutina_ejercicio (
        ejercicio_id,
        series_objetivo,
        reps_objetivo,
        orden,
        cadencia,
        descanso,
        observacion
      )
    `);

  if (error) {
    await handleAuthError(error);
    return [];
  }

  return data.map((r: any) => ({
    id: r.id,
    name: r.nombre,
    description: r.descripcion,
    creatorName: r.persona ? `${r.persona.nombre} ${r.persona.apellido}` : undefined,
    exercises: r.rutina_ejercicio.sort((a: any, b: any) => a.orden - b.orden).map((re: any) => ({
      exerciseId: re.ejercicio_id,
      sets: re.series_objetivo,
      reps: re.reps_objetivo,
      restSeconds: 120, // Deprecated, kept for backward compatibility
      cadence: re.cadencia,
      rest: re.descanso,
      observation: re.observacion
    }))
  }));
};

export const saveRoutine = async (routine: Routine): Promise<Routine | null> => {
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
        cadencia: ex.cadence || null,
        descanso: ex.rest || null,
        observacion: ex.observation || null,
        orden: index
      }));

      const { error: exercisesError } = await supabase
        .from('rutina_ejercicio')
        .insert(exercisesPayload);

      if (exercisesError) throw exercisesError;
    }

    return { ...routine, id: savedRoutine.id };
  } catch (error) {
    await handleAuthError(error);
    return null;
  }
};

// --- PLANIFICACION ---

export const getPlanificaciones = async (asStudent?: boolean): Promise<any[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: persona } = await supabase.from('persona').select('id').eq('user_id', user.id).single();
  if (!persona) return [];

  let query = supabase
    .from('planificacion')
    .select(`
      *,
      rutina_planificacion (
        id,
        rutina_id,
        orden,
        rutina (
          id, nombre, descripcion,
          rutina_ejercicio (
            ejercicio_id, series_objetivo, reps_objetivo, orden, cadencia, descanso, observacion
          )
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (asStudent) {
    query = query.eq('alumno_id', persona.id);
  } else {
    query = query.eq('creador_id', persona.id);
  }

  const { data, error } = await query;
  
  if (error) {
    await handleAuthError(error);
    return [];
  }

  return data.map((p: any) => ({
    id: p.id,
    name: p.nombre,
    description: p.descripcion,
    creatorId: p.creador_id,
    type: p.tipo,
    duration: p.duracion,
    studentId: p.alumno_id,
    activo: p.activo ?? false,
    createdAt: p.created_at ? new Date(p.created_at) : undefined,
    days: (p.rutina_planificacion || []).filter((rp: any) => rp.rutina).sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0)).map((rp: any) => ({
      id: rp.id,
      planificacionId: p.id,
      routineId: rp.rutina_id,
      orden: rp.orden || 1,
      routine: {
        id: rp.rutina.id,
        name: rp.rutina.nombre,
        description: rp.rutina.descripcion,
        exercises: (rp.rutina.rutina_ejercicio || []).sort((a: any, b: any) => a.orden - b.orden).map((re: any) => ({
          exerciseId: re.ejercicio_id,
          sets: re.series_objetivo,
          reps: re.reps_objetivo,
          restSeconds: 120,
          cadence: re.cadencia,
          rest: re.descanso,
          observation: re.observacion
        }))
      }
    }))
  }));
};

export const savePlanificacion = async (plan: any): Promise<any | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No user authenticated");

    const { data: persona } = await supabase.from('persona').select('id').eq('user_id', user.id).single();
    if (!persona) throw new Error("No se encontró el perfil del entrenador");

    const payload: any = {
      id: plan.id || undefined,
      nombre: plan.name,
      descripcion: plan.description || null,
      tipo: plan.type || 'mesociclo',
      duracion: plan.duration || null,
      alumno_id: plan.studentId || null,
      creador_id: persona.id
    };

    if (plan.activo !== undefined) {
      payload.activo = plan.activo;
    }

    const { data, error } = await supabase
      .from('planificacion')
      .upsert(payload)
      .select()
      .single();

    if (error) throw error;

    // If activating this plan, deactivate all others for the same student
    if (plan.activo === true && data.alumno_id) {
      await supabase
        .from('planificacion')
        .update({ activo: false })
        .eq('alumno_id', data.alumno_id)
        .neq('id', data.id);
    }
    
    // Mapping back to app format
    return {
      id: data.id,
      name: data.nombre,
      description: data.descripcion,
      creatorId: data.creador_id,
      type: data.tipo,
      duration: data.duracion,
      studentId: data.alumno_id,
      activo: data.activo ?? false,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      days: plan.days || [] // Just carry over existing days for builder state
    };
  } catch (error) {
    await handleAuthError(error);
    return null;
  }
};

export const addRoutineToPlan = async (planId: string, routineId: string, orden?: number): Promise<boolean> => {
  // Auto-calculate next orden if not provided
  let nextOrden = orden;
  if (nextOrden === undefined) {
    const { data: existing } = await supabase
      .from('rutina_planificacion')
      .select('orden')
      .eq('planificacion_id', planId)
      .order('orden', { ascending: false })
      .limit(1);
    nextOrden = (existing && existing.length > 0 ? existing[0].orden || 0 : 0) + 1;
  }

  const { error } = await supabase
    .from('rutina_planificacion')
    .insert([{ planificacion_id: planId, rutina_id: routineId, orden: nextOrden }]);
    
  if (error) {
    await handleAuthError(error);
    return false;
  }
  return true;
};

export const updateRoutineOrden = async (rutinaPlanificacionId: string, newOrden: number): Promise<boolean> => {
  const { error } = await supabase
    .from('rutina_planificacion')
    .update({ orden: newOrden })
    .eq('id', rutinaPlanificacionId);

  if (error) {
    await handleAuthError(error);
    return false;
  }
  return true;
};

export const removeRoutineFromPlan = async (rutinaPlanificacionId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('rutina_planificacion')
    .delete()
    .eq('id', rutinaPlanificacionId);
    
  if (error) {
    await handleAuthError(error);
    return false;
  }
  return true;
};

export const getStudentActivePlan = async (studentId: string): Promise<{ id: string; name: string } | null> => {
  try {
    const { data, error } = await supabase
      .from('planificacion')
      .select('id, nombre')
      .eq('alumno_id', studentId)
      .eq('activo', true)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return { id: data[0].id, name: data[0].nombre };
  } catch (error) {
    await handleAuthError(error);
    return null;
  }
};

export const setActivePlanificacion = async (planId: string, studentId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No user authenticated");

    const { data: persona } = await supabase.from('persona').select('id').eq('user_id', user.id).single();
    if (!persona) throw new Error("Profile not found");

    // Deactivate all plans for this student
    const { error: deactivateError } = await supabase
      .from('planificacion')
      .update({ activo: false })
      .eq('alumno_id', studentId)
      .eq('creador_id', persona.id);

    if (deactivateError) throw deactivateError;

    // Activate the selected plan
    const { error: activateError } = await supabase
      .from('planificacion')
      .update({ activo: true })
      .eq('id', planId);

    if (activateError) throw activateError;

    return true;
  } catch (error) {
    await handleAuthError(error);
    return false;
  }
};

export const getActivePlanificacionRoutines = async (studentId: string): Promise<Routine[]> => {
  try {
    const { data, error } = await supabase
      .from('planificacion')
      .select(`
        id,
        activo,
        rutina_planificacion (
          id,
          rutina_id,
          rutina (
            id, nombre, descripcion,
            rutina_ejercicio (
              ejercicio_id, series_objetivo, reps_objetivo, orden, cadencia, descanso, observacion
            )
          )
        )
      `)
      .eq('alumno_id', studentId)
      .order('created_at', { ascending: false });

    if (error) return [];

    // Find the first plan with activo=true, or fall back to newest plan
    const plans = data || [];
    const activePlan = plans.find((p: any) => p.activo === true) || plans[0];
    if (!activePlan) return [];

    const routines: Routine[] = (activePlan.rutina_planificacion || [])
      .filter((rp: any) => rp.rutina)
      .map((rp: any) => ({
        id: rp.rutina.id,
        name: rp.rutina.nombre,
        description: rp.rutina.descripcion,
        exercises: (rp.rutina.rutina_ejercicio || [])
          .sort((a: any, b: any) => a.orden - b.orden)
          .map((re: any) => ({
            exerciseId: re.ejercicio_id,
            sets: re.series_objetivo,
            reps: re.reps_objetivo,
            restSeconds: 120,
            cadence: re.cadencia,
            rest: re.descanso,
            observation: re.observacion
          }))
      }));

    return routines;
  } catch (error) {
    await handleAuthError(error);
    return [];
  }
};

// --- SESIONES ---

export const getActiveSessions = async (): Promise<Session[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: persona } = await supabase.from('persona').select('id').eq('user_id', user.id).single();
  if (!persona) return [];

  const { data: relations } = await supabase
    .from('coach_alumno')
    .select('id_alumno')
    .eq('id_coach', persona.id)
    .eq('activo', true);

  const studentIds = relations?.map(r => r.id_alumno) || [];
  if (studentIds.length === 0) return [];

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
    .in('alumno_id', studentIds)
    .order('fecha', { ascending: false });

  if (error) {
    await handleAuthError(error);
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
      student: s.persona ? { name: `${s.persona.nombre} ${s.persona.apellido}`, email: s.persona.email } : undefined,
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

    // PRIMERO: Intentar Insert/Upsert sin Select para evitar bloqueo RLS en el retorno
    const { data: insertedData, error: insertError } = await supabase
      .from('sesion')
      .upsert(sessionPayload)
      .select('id') // Solo pedimos ID para minimizar riesgo de RLS en otras columnas (aunque select * es lo tipico)
      .single();

    // Si falla el insert, es un error fatal.
    if (insertError) {
      console.error("Fatal Error saving session (Insert):", insertError);
      throw insertError;
    }

    // Si pasamos aqui, la sesión EXISTE en DB.
    const sessionId = insertedData.id;

    // 3. Insertar detalles (Logs)
    if (sessionId) {
      // Limpiar detalles viejos
      const { error: deleteError } = await supabase.from('detalle_sesion').delete().eq('sesion_id', sessionId);
      if (deleteError) console.warn("Warning clearing old details:", deleteError);

      const logsToInsert: any[] = [];
      session.exercises.forEach(ex => {
        ex.sets.forEach((set, index) => {
          logsToInsert.push({
            sesion_id: sessionId,
            ejercicio_id: ex.exercise.id,
            nro_serie: index + 1,
            peso_kg: set.weight > 0 ? set.weight : null,
            reps_reales: set.reps > 0 ? set.reps : null,
            rpe: (set.rpe > 0 && set.rpe <= 10) ? set.rpe : null
          });
        });
      });

      if (logsToInsert.length > 0) {
        const { error: detailError } = await supabase
          .from('detalle_sesion')
          .insert(logsToInsert);

        if (detailError) {
          console.error("Error inserting details:", detailError);
          // No hacemos throw aqui para no "cancelar" la sesión padre, pero avisamos.
          throw detailError;
        }
      }
    }

    // 4. Retornar los datos completos (Re-fetch seguro)
    // Intentamos recuperar la sesión completa para la UI. Si esto falla por RLS, no rompemos el flujo, devolvemos lo que tenemos.
    const { data: finalSession, error: fetchError } = await supabase
      .from('sesion')
      .select(`
        *,
        persona!alumno_id (*),
        detalle_sesion (
          *,
          ejercicio (*)
        )
      `)
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      console.warn("Session saved due RLS prevented fetching result (Blind Save):", fetchError);
      // Retornamos un objeto "fake" con el ID real para que la UI sepa que se guardó
      return { ...sessionPayload, id: sessionId } as any;
    }

    return finalSession;
  } catch (error) {
    await handleAuthError(error);
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

export const deleteSession = async (sessionId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('sesion')
    .delete()
    .eq('id', sessionId);

  if (error) {
    await handleAuthError(error);
    return false;
  }
  return true;
};

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
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: persona } = await supabase.from('persona').select('id').eq('user_id', user.id).single();
      if (persona) {
        const { data: relations } = await supabase
          .from('coach_alumno')
          .select('id_alumno')
          .eq('id_coach', persona.id)
          .eq('activo', true);
        const studentIds = relations?.map(r => r.id_alumno) || [];
        if (studentIds.length > 0) {
          query = query.in('alumno_id', studentIds);
        }
      }
    }
  }

  const { data, error } = await query;

  if (error) {
    await handleAuthError(error);
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
//export const mockInitialize = async () => {
// Aquí podrías poner lógica para verificar auth
//return true;
//}