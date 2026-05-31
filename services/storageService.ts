import { supabase } from '../lib/supabaseClient';

async function getAuthUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export const uploadImage = async (
  bucket: 'Avatares' | 'Logos',
  file: File
): Promise<string | null> => {
  const authUserId = await getAuthUserId();
  if (!authUserId) {
    console.error('No authenticated user');
    return null;
  }

  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `${authUserId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error(`Error uploading to ${bucket}:`, error);
    return null;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return data.publicUrl;
};

export const deleteImage = async (bucket: 'Avatares' | 'Logos', url: string): Promise<boolean> => {
  try {
    const urlObj = new URL(url);
    const segments = urlObj.pathname.split('/');
    const bucketIndex = segments.findIndex(s => s === bucket);
    if (bucketIndex === -1) return false;
    const filePath = segments.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};
