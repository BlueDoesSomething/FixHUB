import type { GeoPoint } from '../types/map';
import { isGeoPoint } from '../utils/map';
import { devices } from './catalog';

export type ServiceType = 'home' | 'dropoff';

/** Lifecycle of a request confirmed by FIXHUB. */
export type RepairRequestStatus =
  | 'Pending'
  | 'Accepted'
  | 'En Route'
  | 'Arrived'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

const REMOTE_STATUS_LABELS: Record<string, RepairRequestStatus> = {
  pending: 'Pending',
  accepted: 'Accepted',
  en_route: 'En Route',
  arrived: 'Arrived',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Database enum values are lower snake case; the UI shows spaced labels. */
export function remoteStatusLabel(status: string): RepairRequestStatus {
  return REMOTE_STATUS_LABELS[status] ?? 'Pending';
}

/** Pill class for a request status (matches the fx-pill--* design system). */
export function statusPillClass(request: Pick<SubmittedRepairRequest, 'status' | 'synced'>): string {
  switch (request.status) {
    case 'Completed': return 'fx-pill--completed';
    case 'Cancelled': return 'fx-pill--danger';
    case 'Pending': return 'fx-pill--progress';
    default: return 'fx-pill--accent';
  }
}

/** A pending, unassigned job as shown in the technician's queue. */
export interface AvailableRepairJob {
  id: string;
  reference: string;
  device: string;
  brand: string;
  model: string;
  problem: string;
  serviceType: 'home' | 'dropoff' | 'both';
  location: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  customerName: string;
}

/** A repair assigned to the signed-in technician, with its live workflow status. */
export interface AssignedRepairJob extends AvailableRepairJob {
  status: RepairRequestStatus;
  /** Database enum value used for the next status transition. */
  dbStatus: string;
  updatedAt: string;
  cancellationReason: string | null;
}

const NEXT_REPAIR_STEPS: Record<string, { dbStatus: string; label: string }> = {
  accepted: { dbStatus: 'en_route', label: 'Head to the customer' },
  en_route: { dbStatus: 'arrived', label: 'Mark as arrived' },
  arrived: { dbStatus: 'in_progress', label: 'Start the repair' },
  in_progress: { dbStatus: 'completed', label: 'Mark as completed' },
};

/** The next allowed workflow step, or null when no transition is available. */
export function nextRepairStep(dbStatus: string): { dbStatus: string; label: string } | null {
  return NEXT_REPAIR_STEPS[dbStatus] ?? null;
}

export const REPAIR_DEVICES = devices.map(device => device.name);
export const REPAIR_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_REPAIR_PHOTOS = 3;
export const MAX_REPAIR_PHOTO_BYTES = 5 * 1024 * 1024;

export interface RepairPhoto {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  /** Signed Storage URL for photos loaded from the backend instead of this device. */
  url?: string;
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
  /** True once the request exists in the FIXHUB backend (visible to technicians). */
  synced?: boolean;
  updatedAt?: string;
  /** Reason the backend gave when a sync attempt failed. */
  syncError?: string;
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
