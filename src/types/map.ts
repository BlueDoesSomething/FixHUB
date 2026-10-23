export interface MapMarker {
  x: number;
  y: number;
  kind: 'dest' | 'tech' | 'pulse';
  label?: string;
  color?: string;
}
