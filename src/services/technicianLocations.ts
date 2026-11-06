import type { Database } from '../types/database';
import type { GeoPoint } from '../types/map';
import { formatCoordinates, isGeoPoint } from '../utils/map';
import { getSupabaseBackend } from './supabase';

export type TechnicianLocation = Database['public']['Tables']['technician_locations']['Row'];
export type LocatedTechnician = Database['public']['Functions']['list_located_technicians']['Returns'][number];

export async function fetchMyTechnicianLocation(): Promise<TechnicianLocation | null> {
  const { data, error } = await getSupabaseBackend().rpc('get_my_technician_location').maybeSingle();
  if (error) throw new Error('Your saved location could not be loaded. Check your connection and database migrations.', { cause: error });
  return data;
}

export async function saveMyTechnicianLocation(point: GeoPoint, address: string): Promise<TechnicianLocation> {
  if (!isGeoPoint(point)) throw new Error('Select a valid map location before saving.');
  const label = address.trim() || `Pinned location (${formatCoordinates(point)})`;
  if (label.length > 500) throw new Error('Keep the address to 500 characters or fewer.');
  // Identity and active-technician authorization are resolved by the database, not by form fields.
  const { data, error } = await getSupabaseBackend().rpc('save_my_technician_location', {
    p_latitude: point.lat, p_longitude: point.lng, p_address: label,
  }).single();
  if (error || !data) throw new Error('Your location could not be saved. Sharing has not been confirmed.', { cause: error });
  return data;
}

export async function stopSharingMyTechnicianLocation(): Promise<void> {
  const { error } = await getSupabaseBackend().rpc('stop_sharing_my_technician_location');
  if (error) throw new Error('Sharing could not be stopped. Please try again.', { cause: error });
}

export async function listLocatedTechnicians(): Promise<LocatedTechnician[]> {
  const { data, error } = await getSupabaseBackend().rpc('list_located_technicians');
  if (error) throw new Error('Technician locations could not be loaded. Check your connection and try again.', { cause: error });
  return (data ?? []).filter(item => isGeoPoint({ lat: item.latitude, lng: item.longitude }));
}
