import type { GeoPoint } from '../types/map';
import { isGeoPoint } from '../utils/map';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface LocatedPoint extends GeoPoint {
  accuracy: number;
}

function locationError(error: unknown): Error {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  const messages: Record<string, string> = {
    '1': 'Location permission was denied. Enable it in your browser settings, or select a point on the map.',
    '2': 'Your current location could not be found. Select a point on the map instead.',
    '3': 'Finding your location timed out. Try again or select a point on the map.',
    'OS-PLUG-GLOC-0003': 'Location permission was denied. Enable it in your device settings, or select a point on the map.',
    'OS-PLUG-GLOC-0007': 'Device location services are off. Enable GPS, or select a point on the map.',
    'OS-PLUG-GLOC-0009': 'The request to enable location was declined. Turn on Location in your device settings and try again, or select a point on the map.',
    'OS-PLUG-GLOC-0010': 'Finding your location timed out. Try again or select a point on the map.',
    'OS-PLUG-GLOC-0014': 'Google Play Services needs attention. Update or enable it, then try GPS again, or select a point on the map.',
    'OS-PLUG-GLOC-0015': 'Google Play Services is unavailable. Try again with device Location enabled, or select a point on the map.',
    'OS-PLUG-GLOC-0016': 'Your device location settings could not be used. Turn on Location and improve location accuracy in device settings, or select a point on the map.',
    'OS-PLUG-GLOC-0017': 'Device location and network services are off. Enable Location and try again, or select a point on the map.',
    'OS-PLUG-GLOC-0018': 'Location is missing from this Android build. Install the latest FIXHUB APK, or select a point on the map.',
    'UNIMPLEMENTED': 'Native location is not available in this Android build. Install the latest FIXHUB APK, or select a point on the map.',
  };
  return new Error(messages[code] ?? 'Location could not be retrieved. Enable device location, or select a point on the map.');
}

async function nativeLocationOptions(cancelled = () => false) {
  let permissions = await Geolocation.checkPermissions();
  if (cancelled()) return undefined;
  if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') {
    permissions = await Geolocation.requestPermissions({ permissions: ['location'] });
  }
  if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') {
    throw locationError({ code: 'OS-PLUG-GLOC-0003' });
  }
  return {
    // Asking for high accuracy with only coarse permission makes Android request
    // precise permission again. Respect the user's approximate-location choice.
    enableHighAccuracy: permissions.location === 'granted',
    timeout: 30000,
    maximumAge: 0,
    enableLocationFallback: true,
  };
}

function locatedPoint(coords: { latitude: number; longitude: number; accuracy: number }): LocatedPoint {
  const point = { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy };
  if (!isGeoPoint(point) || !Number.isFinite(point.accuracy) || point.accuracy < 0) {
    throw new Error('Your device returned an invalid location. Select a point on the map instead.');
  }
  return point;
}

/** Foreground-only callers own this watch and must dispose it on page/app leave. */
export function watchCurrentLocation(onPoint: (point: LocatedPoint) => void, onError: (error: Error) => void): () => void {
  let stopped = false;
  let browserId: number | undefined;
  let nativeId: string | undefined;
  const stop = () => {
    stopped = true;
    if (browserId !== undefined) navigator.geolocation.clearWatch(browserId);
    if (nativeId !== undefined) void Geolocation.clearWatch({ id: nativeId }).catch(() => undefined);
    browserId = undefined;
    nativeId = undefined;
  };
  const fail = (error: Error) => { if (!stopped) { onError(error); stop(); } };
  const receive = ({ coords, timestamp }: { coords: { latitude: number; longitude: number; accuracy: number }; timestamp: number }) => {
    if (stopped) return;
    try {
      const point = locatedPoint(coords);
      if (Number.isFinite(timestamp) && Date.now() - timestamp <= 30000 && timestamp <= Date.now() + 5000) onPoint(point);
    } catch (error) {
      fail(error as Error);
    }
  };
  if (Capacitor.isNativePlatform()) {
    void (async () => {
      const options = await nativeLocationOptions(() => stopped);
      if (stopped || !options) return;
      const id = await Geolocation.watchPosition({ ...options, interval: 5000, minimumUpdateInterval: 3000 }, (position, error) => {
        if (error) fail(locationError(error));
        else if (position) receive(position);
      });
      if (stopped) await Geolocation.clearWatch({ id });
      else nativeId = id;
    })().catch(error => fail(error instanceof Error && !('code' in error) ? error : locationError(error)));
  } else if (typeof navigator === 'undefined' || !navigator.geolocation) {
    fail(new Error('Location is not available in this browser. Select a point on the map instead.'));
  } else if (typeof window !== 'undefined' && window.isSecureContext === false) {
    fail(new Error('Location access requires HTTPS or localhost. You can still select a point on the map.'));
  } else {
    browserId = navigator.geolocation.watchPosition(receive, error => fail(locationError(error)), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    // A synchronous failure (including test implementations) can happen before the ID is assigned.
    if (stopped) stop();
  }
  return stop;
}

export async function getCurrentLocation(): Promise<LocatedPoint> {
  if (Capacitor.isNativePlatform()) {
    let position;
    try {
      const options = await nativeLocationOptions();
      position = await Geolocation.getCurrentPosition(options);
    } catch (error) {
      throw error instanceof Error && !('code' in error) ? error : locationError(error);
    }
    return locatedPoint(position.coords);
  }
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(new Error('Location is not available in this browser. Select a point on the map instead.'));
  }
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return Promise.reject(new Error('Location access requires HTTPS or localhost. You can still select a point on the map.'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        try {
          resolve(locatedPoint(coords));
        } catch (error) {
          reject(error);
        }
      },
      error => reject(locationError(error)),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  });
}
