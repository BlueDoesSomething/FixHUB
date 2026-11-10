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

/** Push one local record to the backend. Resolves false when it is still local-only. */
export async function pushRepairRequest(record: SubmittedRepairRequest, ownerId: string): Promise<boolean> {
  try {
    const backend = getSupabaseBackend();
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
    await uploadRepairPhotos(backend, record, ownerId);
    return true;
  } catch {
    return false;
  }
}

async function uploadRepairPhotos(backend: Backend, record: SubmittedRepairRequest, ownerId: string) {
  if (!record.photos.length) return;
  try {
    const rows: Database['public']['Tables']['repair_photos']['Insert'][] = [];
    for (const [position, photo] of record.photos.entries()) {
      const safeName = photo.name.replace(/[^\w.-]+/g, '_').slice(-80) || 'photo';
      const storagePath = `${ownerId}/${record.id}/${position}-${safeName}`;
      const { error } = await backend.storage.from(PHOTO_BUCKET)
        .upload(storagePath, photo.blob, { contentType: photo.type, upsert: true });
      if (error) continue; // The request still syncs; missing photos stay on this device.
      rows.push({
        repair_id: record.id,
        storage_path: storagePath,
        file_name: photo.name.slice(0, 255),
        content_type: photo.type || 'image/jpeg',
        file_size: photo.size,
        position,
      });
    }
    if (rows.length) await backend.from('repair_photos').insert(rows);
  } catch {
    // Photo upload is supplementary; never fail the request sync because of it.
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

