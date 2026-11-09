import type { GeoPoint } from '../types/map';
import type { ServiceType } from '../data/repair';
import { REPAIR_DEVICES } from '../data/repair';
import type { LocatedTechnician } from '../services/technicianLocations';
import { distanceKm, isGeoPoint } from './map';

const supportedDevices = new Set(REPAIR_DEVICES.map(name => name.toLowerCase()));
// Retired tags remain recognizable so old computer/console-only profiles are
// not mistaken for general repair skills after their catalog options disappear.
const deviceTags = new Set([...supportedDevices, 'laptop', 'desktop', 'computer', 'console']);

function supportsDevice(specializations: string[], device?: string) {
  const declared = specializations.map(name => name.toLowerCase()).filter(name => deviceTags.has(name));
  if (!declared.length) return !device || supportedDevices.has(device.toLowerCase());
  return device
    ? supportedDevices.has(device.toLowerCase()) && declared.includes(device.toLowerCase())
    : declared.some(name => supportedDevices.has(name));
}

export function nearbyTechnicians(technicians: LocatedTechnician[], point: GeoPoint | null, radius: number, now: number, device?: string, service?: ServiceType) {
  return technicians.filter(tech => isGeoPoint({ lat: tech.latitude, lng: tech.longitude })
    && (tech.location_mode !== 'live' || (!!tech.live_expires_at && Date.parse(tech.live_expires_at) > now))
    && (!service || tech.service_type === 'both' || tech.service_type === service)
    // Current applications list repair skills (e.g. Screen Replacement), not
    // supported devices. Do not discard every real technician for lacking a
    // fictional device tag. Honor device tags only in records that declare them.
    && supportsDevice(tech.specializations, device))
    .map(tech => ({ ...tech, distance: point ? distanceKm(point, { lat: tech.latitude, lng: tech.longitude }) : null }))
    .filter(tech => tech.distance === null || tech.distance <= radius)
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0) || a.full_name.localeCompare(b.full_name) || a.id.localeCompare(b.id));
}

export function technicianDirections(tech: LocatedTechnician, point: GeoPoint | null) {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('destination', `${tech.latitude},${tech.longitude}`);
  if (point) url.searchParams.set('origin', `${point.lat},${point.lng}`);
  return url.toString();
}
