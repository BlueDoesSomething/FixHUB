export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface MapMarker extends GeoPoint {
  id: string;
  kind: 'dest' | 'tech' | 'pulse';
  label?: string;
  title?: string;
  color?: string;
  draggable?: boolean;
}
