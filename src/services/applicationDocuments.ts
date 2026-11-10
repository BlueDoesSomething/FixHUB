import { getSupabaseBackend } from './supabase';
import type { UploadedFile } from '../data/technicianApplication';

const bucket = 'application-documents';

export async function uploadApplicationDocuments(userId: string, applicationId: string, files: UploadedFile[]) {
  const storage = getSupabaseBackend().storage.from(bucket);
  const prefix = `${userId}/${applicationId}`;
  const { data: existing, error: listError } = await storage.list(prefix, { limit: 100 });
  if (listError) throw listError;
  for (const [index, file] of files.entries()) {
    const name = `${index}--${encodeURIComponent(file.name)}`;
    if (existing?.some(saved => saved.name === name)) continue;
    const [prefix, base64] = file.dataUrl.split(',', 2);
    if (!prefix?.startsWith('data:') || !base64) throw new Error('Invalid application document.');
    const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    const { error } = await storage.upload(`${prefix}/${name}`, bytes, { contentType: file.type, upsert: false });
    if (error) throw error;
  }
}

export async function listApplicationDocuments(userId: string, applicationId: string): Promise<UploadedFile[]> {
  const prefix = `${userId}/${applicationId}`;
  const storage = getSupabaseBackend().storage.from(bucket);
  const { data, error } = await storage.list(prefix, { limit: 100 });
  if (error) throw error;
  return Promise.all((data ?? []).filter(file => file.id).map(async file => {
    const { data: signed, error: signError } = await storage.createSignedUrl(`${prefix}/${file.name}`, 3600);
    if (signError || !signed?.signedUrl) throw signError ?? new Error('Unable to open document.');
    return {
      name: decodeURIComponent(file.name.split('--').slice(1).join('--')),
      type: String(file.metadata?.mimetype ?? 'application/octet-stream'),
      size: Number(file.metadata?.size ?? 0), dataUrl: signed.signedUrl,
    };
  }));
}
