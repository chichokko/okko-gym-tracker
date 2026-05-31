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
      config: appConfig
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