import type { GeoPoint } from '../../types/map';

export interface LandingTechnician {
  id: number;
  name: string;
  initials: string;
  specialization: string;
  rating: number;
  reviews: number;
  distance: string;
  completed: number;
  available: boolean;
  avatarBg: string;
  location: string;
  coordinates: GeoPoint;
  markerColor: string;
}

export const technicians: LandingTechnician[] = [];
