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
    const appUser: User = {
      id: profileData.id, // We use the Persona ID for app logic, not Auth ID
      name: `${profileData.nombre} ${profileData.apellido}`,
      email: profileData.email,
      role: profileData.rol === 'coach' ? UserRole.COACH : UserRole.STUDENT,
      avatarUrl: undefined
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

// getCurrentSession is no longer used - session is managed via onAuthStateChange in SessionContext.