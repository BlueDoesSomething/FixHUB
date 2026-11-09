import type { Database } from '../types/database';
import type { GeoPoint } from '../types/map';
import { formatCoordinates, isGeoPoint } from '../utils/map';
import { getSupabaseBackend } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { locationServiceError } from './locationErrors';

export type TechnicianLocation = Database['public']['Tables']['technician_locations']['Row'];
export type LocatedTechnician = Database['public']['Functions']['list_located_technicians']['Returns'][number];

export async function fetchMyTechnicianLocation(): Promise<TechnicianLocation | null> {
  const { data, error } = await getSupabaseBackend().rpc('get_my_technician_location').maybeSingle();
  if (error) throw locationServiceError(error, 'Your saved location could not be loaded. Check your connection and try again.');
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
  if (error || !data) throw locationServiceError(error, 'Your location could not be saved. Sharing has not been confirmed.');
  return data;
}

export async function stopSharingMyTechnicianLocation(): Promise<void> {
  const { error } = await getSupabaseBackend().rpc('stop_sharing_my_technician_location');
  if (error) throw locationServiceError(error, 'Sharing could not be stopped. Please try again.');
}

export async function publishMyLiveLocation(point: GeoPoint): Promise<TechnicianLocation> {
  if (!isGeoPoint(point)) throw new Error('Wait for a valid GPS location before sharing.');
  const { data, error } = await (getSupabaseBackend() as any).rpc('publish_my_live_location', {
    p_latitude: point.lat, p_longitude: point.lng,
  }).single();
  if (error || !data) throw locationServiceError(error, 'Live location could not be updated. Check your connection and try again.');
  return data;
}

type DirectoryListener = { refresh: () => void; connection: (connected: boolean) => void };
type DirectorySubscription = { listeners: Set<DirectoryListener>; connected: boolean; disposed: boolean; channel?: RealtimeChannel };
let directorySubscription: DirectorySubscription | undefined;
let channelRemoval: Promise<unknown> = Promise.resolve();

/** One ref-counted topic across Ionic transition overlap and multiple map panels. */
export function subscribeToTechnicianLocations(refresh: () => void, connection: (connected: boolean) => void): () => void {
  const backend = getSupabaseBackend();
  const listener = { refresh, connection };
  const subscription = directorySubscription ?? { listeners: new Set<DirectoryListener>(), connected: false, disposed: false };
  subscription.listeners.add(listener);
  connection(subscription.connected);
  if (!directorySubscription) {
    directorySubscription = subscription;
    void (async () => {
      // realtime-js deduplicates topics: wait until the previous one is removed.
      await channelRemoval;
      if (subscription.disposed) return;
      await backend.realtime.setAuth();
      if (subscription.disposed) return;
      subscription.channel = backend.channel('technician-directory', { config: { private: true } })
        .on('broadcast', { event: 'locations_changed' }, () => {
          if (!subscription.disposed) subscription.listeners.forEach(item => item.refresh());
        });
      subscription.channel.subscribe(status => {
        if (subscription.disposed) return;
        subscription.connected = status === 'SUBSCRIBED';
        subscription.listeners.forEach(item => {
          item.connection(subscription.connected);
          if (subscription.connected) item.refresh(); // close snapshot/subscription race
        });
      });
    })().catch(() => { if (!subscription.disposed) subscription.listeners.forEach(item => item.connection(false)); });
  }
  return () => {
    subscription.listeners.delete(listener);
    if (subscription.listeners.size || subscription.disposed) return;
    subscription.disposed = true;
    directorySubscription = undefined;
    if (subscription.channel) channelRemoval = backend.removeChannel(subscription.channel).catch(() => undefined);
  };
}

export async function listLocatedTechnicians(): Promise<LocatedTechnician[]> {
  const { data, error } = await getSupabaseBackend().rpc('list_located_technicians');
  if (error) throw locationServiceError(error, 'Technician locations could not be loaded. Check your connection and try again.');
  return (data ?? []).filter(item => isGeoPoint({ lat: item.latitude, lng: item.longitude }));
}
