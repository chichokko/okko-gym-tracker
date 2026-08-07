import { supabase } from '../lib/supabaseClient';
import { User, UserRole } from '../types';

export const signInWithEmail = async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
  try {
    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) return { user: null, error: authError.message };
    if (!authData.user) return { user: null, error: "No se pudo obtener el usuario." };

    // 2. Fetch User Profile from 'persona' table to get the Role
    const { data: profileData, error: profileError } = await supabase
      .from('persona')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      // Fallback if profile doesn't exist (edge case)
      console.error("Profile fetch error:", profileError);
      return { user: null, error: "Usuario autenticado pero sin perfil de 'Persona' asociado." };
    }

    // 3. Map to App User Type
    const defaultConfig = { unit: 'kg' as const, smallBrickWeight: 5, largeBrickWeight: 7.5 };
    
    // Safety check for JSONB config mapping
    let appConfig = defaultConfig;
    if (profileData.configuracion) {
        try {
            const parsed = typeof profileData.configuracion === 'string' ? JSON.parse(profileData.configuracion) : profileData.configuracion;
            appConfig = { ...defaultConfig, ...parsed };
        } catch (e) {
            console.warn("Could not parse user config", e);
        }
    }

    const appUser: User = {
      id: profileData.id, // We use the Persona ID for app logic, not Auth ID
      name: `${profileData.nombre} ${profileData.apellido}`,
      firstName: profileData.nombre,
      lastName: profileData.apellido,
      email: profileData.email,
      role: profileData.rol === 'coach' ? UserRole.COACH : UserRole.STUDENT,
      avatarUrl: profileData.avatar_url || undefined,
      config: appConfig,
      coachCode: profileData.cod_coach || undefined
    };

    return { user: appUser, error: null };

  } catch (err: any) {
    return { user: null, error: err.message || "Error desconocido" };
  }
};

// Use scope: 'local' to only clear local session, not invalidate tokens server-side
export const signOut = async () => {
  await supabase.auth.signOut({ scope: 'local' });
};

export const signUpWithEmail = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  coachCode?: string
): Promise<{ user: User | null; error: string | null }> => {
  try {
    // 1. Crear el usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) return { user: null, error: authError.message };
    if (!authData.user) return { user: null, error: "No se pudo crear el usuario." };

    // 2. Buscar si el coachCode es válido
    let cod_coach = null;
    if (coachCode) {
      const { data: coachData } = await supabase
        .from('persona')
        .select('id')
        .eq('cod_coach', coachCode)
        .eq('rol', 'coach')
        .single();
        
      if (coachData) {
        cod_coach = coachData.id;
      }
    }

    // 3. Crear el perfil en persona
    const { data: insertedPersona, error: profileError } = await supabase
      .from('persona')
      .insert({
        user_id: authData.user.id,
        nombre: firstName,
        apellido: lastName,
        email: email,
        rol: 'alumno',
        cod_coach: cod_coach
      })
      .select('id')
      .single();

    if (profileError) {
      console.error("Profile insert error:", profileError);
      return { user: null, error: "Usuario creado, pero hubo un error al crear el perfil." };
    }

    // 4. If coach code was used, also create the coach_alumno relationship
    if (cod_coach && insertedPersona) {
      await supabase.from('coach_alumno').insert({
        id_alumno: insertedPersona.id,
        id_coach: cod_coach,
        activo: true
      });
    }

    // El signUp inicia sesión automáticamente, así que podemos intentar devolver el User formateado.
    // De forma simplificada, devolvemos el usuario base o dejamos que el listener de sesión se encargue.
    return { 
      user: {
        id: '', // Se actualizará al recargar la sesión
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        role: UserRole.STUDENT,
        config: { unit: 'kg', smallBrickWeight: 5, largeBrickWeight: 7.5 }
      }, 
      error: null 
    };
  } catch (err: any) {
    return { user: null, error: err.message || "Error desconocido" };
  }
};

export const updateUserEmail = async (email: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || "Error desconocido" };
  }
};

export const updateUserPassword = async (password: string): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    return { error: null };
  } catch (err: any) {
    return { error: err.message || "Error desconocido" };
  }
};

// getCurrentSession is no longer used - session is managed via onAuthStateChange in SessionContext.