import { supabase } from '@/lib/supabaseClient';

export async function uploadCardImage(file: File, userId: string) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${Date.now()}.${ext}`;

  // ✅ 기존 버킷 이름 사용 (business-cards)
  const { data, error } = await supabase
    .storage
    .from('business-cards')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data: pub } = supabase.storage
    .from('business-cards')
    .getPublicUrl(path);

  return { path, publicUrl: pub.publicUrl };
}
