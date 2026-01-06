import { createClient } from '@supabase/supabase-js';



const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase Environment Variables! Check your .env file or Cloudflare Pages configuration.");
}

// Initialize client with whatever we have - if vars are missing, this might still throw or act erroneously
// inside Supabase logic, but at least we warned.
// To be extra safe, we pass empty strings to avoid immediate crash if libs expect string, 
// though functional methods like getSession will fail gracefully (or returning error) rather than crashing app startup.
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');