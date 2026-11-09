import type { GeoPoint } from '../types/map';

export interface Category {
  name: string;
  icon: string;
}

export interface Device {
  name: string;
  icon: string;
}

export interface Technician {
  id: number;
  name: string;
  initials: string;
  color: string;
  specialty: string;
  rating: number;
  reviews: number;
  distance: string;
  response: string;
  repairs: number;
  verified: boolean;
  coordinates: GeoPoint;
  best?: boolean;
}

export interface ServiceRequest {
  id: number;
  customer: string;
  initials: string;
  color: string;
  device: string;
  problem: string;
  type: 'Home' | 'Drop-off';
  time: string;
  distance: string;
}

export const categories: Category[] = [
  {
    name: 'Smartphone',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  },
  {
    name: 'Tablet',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  },
  {
    name: 'Other',
    icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
  },
];

export const devices: Device[] = [
  { name: 'Smartphone', icon: '📱' },
  { name: 'Tablet', icon: '📲' },
  { name: 'Other', icon: '🔧' },
];

// These collections stay empty until their authorized database queries are connected.
export const technicians: Technician[] = [];
export const newRequests: ServiceRequest[] = [];
