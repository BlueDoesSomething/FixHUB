import type { GeoPoint } from '../types/map';
import { isGeoPoint } from '../utils/map';

export type ServiceType = 'home' | 'dropoff';
export type RepairRequestStatus = 'Pending';

export const REPAIR_DEVICES = ['Smartphone', 'Laptop', 'Desktop', 'Tablet', 'Console', 'Other'];
export const REPAIR_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_REPAIR_PHOTOS = 3;
export const MAX_REPAIR_PHOTO_BYTES = 5 * 1024 * 1024;

export interface RepairPhoto {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
}

export interface RepairDraft {
  id: string;
  device: string;
  brand: string;
  model: string;
  problem: string;
  photos: RepairPhoto[];
  serviceType: ServiceType;
  location: string;
  coordinates: GeoPoint | null;
}

export interface SubmittedRepairRequest extends RepairDraft {
  ownerId: string;
  reference: string;
  createdAt: string;
  status: RepairRequestStatus;
}

export type RepairErrors = Partial<Record<'device' | 'brand' | 'model' | 'problem' | 'photos' | 'serviceType' | 'location', string>>;

export function repairId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function emptyRepairDraft(): RepairDraft {
  return { id: repairId(), device: 'Smartphone', brand: '', model: '', problem: '', photos: [], serviceType: 'home', location: '', coordinates: null };
}

/** Explicit plain-object snapshots keep Vue proxies and preview URLs out of IndexedDB. */
export function snapshotRepair(draft: RepairDraft): RepairDraft {
  return {
    id: draft.id,
    device: draft.device,
    brand: draft.brand.trim(),
    model: draft.model.trim(),
    problem: draft.problem.trim(),
    photos: draft.photos.map(photo => ({ id: photo.id, name: photo.name, type: photo.type, size: photo.size, blob: photo.blob })),
    serviceType: draft.serviceType,
    location: draft.location.trim(),
    coordinates: draft.coordinates ? { lat: draft.coordinates.lat, lng: draft.coordinates.lng } : null,
  };
}

export function validateRepair(draft: RepairDraft, requireLocation = true): RepairErrors {
  const errors: RepairErrors = {};
  if (!REPAIR_DEVICES.includes(draft.device)) errors.device = 'Select a supported device type.';
  if (!draft.brand.trim() || draft.brand.trim().length > 100) errors.brand = 'Enter a brand (up to 100 characters).';
  if (!draft.model.trim() || draft.model.trim().length > 120) errors.model = 'Enter a model (up to 120 characters).';
  if (draft.problem.trim().length < 10 || draft.problem.trim().length > 5000) errors.problem = 'Describe the problem in 10–5,000 characters.';
  if (!['home', 'dropoff'].includes(draft.serviceType)) errors.serviceType = 'Choose home service or drop-off.';
  if (draft.photos.length > MAX_REPAIR_PHOTOS || draft.photos.some(photo =>
    !REPAIR_IMAGE_TYPES.includes(photo.type) || photo.size <= 0 || photo.size > MAX_REPAIR_PHOTO_BYTES
    || !photo.blob || photo.blob.size !== photo.size || photo.blob.type !== photo.type)) {
    errors.photos = 'Attach up to 3 valid JPG, PNG, or WebP images, each no larger than 5 MB.';
  }
  if (requireLocation && (!isGeoPoint(draft.coordinates) || !draft.location.trim() || draft.location.length > 500)) {
    errors.location = 'Confirm a map location and an address or coordinate label before submitting.';
  }
  return errors;
}

export function serviceLabel(type: ServiceType): string {
  return type === 'home' ? 'Home Service' : 'Drop-off';
}
