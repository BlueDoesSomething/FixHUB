import { getSupabaseBackend } from './supabase';
import type { Database } from '../types/database';
import { remoteStatusLabel, type SubmittedRepairRequest } from '../data/repair';

/**
 * Submitted requests are authoritative only after FIXHUB confirms them.
 * Browser-saved records from older versions may still be retried, but they
 * never count as submitted requests until the server has accepted them.
 */

const PHOTO_BUCKET = 'repair-photos';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

type RepairRequestRow = Database['public']['Tables']['repair_requests']['Row'];
type RepairPhotoRow = Database['public']['Tables']['repair_photos']['Row'];

type Backend = ReturnType<typeof getSupabaseBackend>;

/** The repair exists in FIXHUB, but attached photos still need to be delivered. */
export class RepairPhotoUploadError extends Error {
  constructor() { super('Your repair request reached FIXHUB, but its photos could not be saved. Your draft and photos are still on this device; check your connection and submit again to retry.'); }
}

/** Push one local record to the backend. Resolves false when it is still local-only. */
export async function pushRepairRequest(record: SubmittedRepairRequest, ownerId: string): Promise<boolean> {
  let backend: Backend;
  try {
    backend = getSupabaseBackend();
    const { error } = await backend.rpc('create_my_repair_request', {
      p_device: record.device,
      p_brand: record.brand,
      p_model: record.model,
      p_problem: record.problem,
      p_service_type: record.serviceType,
      p_location: record.location,
      p_latitude: record.coordinates?.lat,
      p_longitude: record.coordinates?.lng,
      p_request_id: record.id,
    });
    if (error) {
      // An earlier attempt may have committed before its response was lost.
      const { data: existing } = await backend.from('repair_requests').select('id').eq('id', record.id).maybeSingle();
      if (!existing) return false;
    }
  } catch {
    return false;
  }
  await uploadRepairPhotos(backend, record, ownerId);
  return true;
}

async function uploadRepairPhotos(backend: Backend, record: SubmittedRepairRequest, ownerId: string) {
  if (!record.photos.length) return;
  try {
    const { data: existing, error: readError } = await backend.from('repair_photos')
      .select('position,storage_path').eq('repair_id', record.id);
    if (readError) throw readError;
    const storage = backend.storage.from(PHOTO_BUCKET);
    for (const [position, photo] of record.photos.entries()) {
      const safeName = photo.name.replace(/[^\w.-]+/g, '_').slice(-80) || 'photo';
      const fileName = `${position}-${safeName}`;
      const storagePath = `${ownerId}/${record.id}/${fileName}`;
      const saved = existing?.find(row => row.position === position);
      if (saved) {
        if (saved.storage_path !== storagePath) throw new Error('A different photo already occupies this position.');
        continue;
      }
      // The Storage policy allows inserts, not overwrites. A retry can reuse an
      // object from an earlier attempt whose metadata insert did not complete.
      const { error: uploadError } = await storage.upload(storagePath, photo.blob, { contentType: photo.type, upsert: false });
      if (uploadError) {
        // Only a duplicate-object conflict can mean an earlier attempt saved
        // this photo. A permission or network failure must never count as saved.
        if (uploadError.status !== 409) throw uploadError;
        const { data: files, error: listError } = await storage.list(`${ownerId}/${record.id}`, { limit: 100 });
        if (listError || !files?.some(file => file.name === fileName)) throw uploadError;
      }
      const row: Database['public']['Tables']['repair_photos']['Insert'] = {
        repair_id: record.id,
        storage_path: storagePath,
        file_name: photo.name.slice(0, 255),
        content_type: photo.type || 'image/jpeg',
        file_size: photo.size,
        position,
      };
      const { error: insertError } = await backend.from('repair_photos').insert(row);
      if (insertError) {
        const { data: confirmed } = await backend.from('repair_photos')
          .select('storage_path').eq('repair_id', record.id).eq('position', position).maybeSingle();
        if (confirmed?.storage_path !== storagePath) throw insertError;
      }
    }
  } catch {
    throw new RepairPhotoUploadError();
  }
}

/** Every confirmed request of the signed-in customer, newest first. */
export async function fetchRemoteRepairRequests(ownerId: string): Promise<SubmittedRepairRequest[]> {
  const backend = getSupabaseBackend();
  const { data: rows, error } = await backend.from('repair_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!rows?.length) return [];
  return hydrate(backend, rows as RepairRequestRow[], ownerId);
}

/** A request is shown only if it exists in FIXHUB. */
export async function fetchRemoteRepairRequest(ownerId: string, requestId: string): Promise<SubmittedRepairRequest | null> {
  const backend = getSupabaseBackend();
  const { data: row, error } = await backend.from('repair_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;
  const [hydrated] = await hydrate(backend, [row as RepairRequestRow], ownerId);
  return hydrated ?? null;
}

async function hydrate(backend: Backend, rows: RepairRequestRow[], ownerId: string): Promise<SubmittedRepairRequest[]> {
  const ids = rows.map(row => row.id);
  const { data: photoRows } = await backend.from('repair_photos').select('*').in('repair_id', ids);
  const photos = (photoRows ?? []) as RepairPhotoRow[];
  const urls = await signedUrls(backend, photos.map(photo => photo.storage_path));
  const byRepair = new Map<string, RepairPhotoRow[]>();
  for (const photo of photos) {
    const list = byRepair.get(photo.repair_id) ?? [];
    list.push(photo);
    byRepair.set(photo.repair_id, list);
  }
  return rows.map(row => ({
    id: row.id,
    ownerId,
    reference: row.reference ?? `FH-${row.id.replace(/-/g, '').slice(0, 12).toUpperCase()}`,
    device: row.device,
    brand: row.brand,
    model: row.model,
    problem: row.problem,
    serviceType: row.service_type === 'dropoff' ? 'dropoff' : 'home',
    location: row.location,
    coordinates: row.latitude !== null && row.longitude !== null ? { lat: row.latitude, lng: row.longitude } : null,
    photos: (byRepair.get(row.id) ?? [])
      .sort((a, b) => a.position - b.position)
      .map(photo => ({
        id: photo.id,
        name: photo.file_name,
        type: photo.content_type,
        size: photo.file_size,
        // Remote photos render from their signed URL; the blob is only a placeholder.
        blob: new Blob([], { type: photo.content_type }),
        url: urls.get(photo.storage_path),
      })),
    status: remoteStatusLabel(row.status),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    synced: true,
  }));
}

async function signedUrls(backend: Backend, paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (!paths.length) return urls;
  try {
    const { data, error } = await backend.storage.from(PHOTO_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
    if (error || !Array.isArray(data)) return urls;
    for (const entry of data) {
      if (entry.path && entry.signedUrl) urls.set(entry.path, entry.signedUrl);
    }
  } catch {
    // Photos without a URL simply render their file name.
  }
  return urls;
}

/** Customer cancels their own pending request. Resolves false when unavailable. */
export async function cancelRepairRequest(requestId: string): Promise<boolean> {
  try {
    const backend = getSupabaseBackend();
    const { error } = await backend.rpc('cancel_my_repair_request', { p_repair_id: requestId });
    return !error;
  } catch {
    return false;
  }
}

/** Older local-only records are never presented as submitted requests. */
export function mergeRepairRequests(
  _local: readonly SubmittedRepairRequest[],
  remote: readonly SubmittedRepairRequest[],
): SubmittedRepairRequest[] {
  return remote.map(request => ({ ...request, synced: true }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

