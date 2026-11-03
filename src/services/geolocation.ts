import type { GeoPoint } from '../types/map';
import { isGeoPoint } from '../utils/map';

export interface LocatedPoint extends GeoPoint {
  accuracy: number;
}

export function getCurrentLocation(): Promise<LocatedPoint> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(new Error('Location is not available in this browser. Select a point on the map instead.'));
  }
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return Promise.reject(new Error('Location access requires HTTPS or localhost. You can still select a point on the map.'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude };
        if (!isGeoPoint(point)) {
          reject(new Error('Your device returned an invalid location. Select a point on the map instead.'));
          return;
        }
        resolve({ ...point, accuracy: coords.accuracy });
      },
      error => {
        const messages: Record<number, string> = {
          1: 'Location permission was denied. Enable it in your browser settings, or select a point on the map.',
          2: 'Your current location could not be found. Select a point on the map instead.',
          3: 'Finding your location timed out. Try again or select a point on the map.',
        };
        reject(new Error(messages[error.code] ?? 'Location could not be retrieved. Select a point on the map.'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  });
}
