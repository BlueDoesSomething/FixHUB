import type { GeoPoint } from '../types/map';
import { isGeoPoint } from '../utils/map';

export interface AddressResult extends GeoPoint { id: string; label: string }

export const SEARCH_ATTRIBUTION = import.meta.env.VITE_MAP_SEARCH_ATTRIBUTION || 'Search © OpenStreetMap contributors, via Nominatim';
const cache = new Map<string, AddressResult[]>();
let queue: Promise<unknown> = Promise.resolve();
let lastRequest = 0;

/** Explicit searches only (no autocomplete); serialize and cache to respect the public service. */
export function searchAddresses(query: string, signal?: AbortSignal): Promise<AddressResult[]> {
  const term = query.trim();
  if (term.length < 3 || term.length > 500) return Promise.reject(new Error('Enter an address or landmark of 3–500 characters.'));
  const run = async () => {
    signal?.throwIfAborted();
    const key = term.toLowerCase();
    if (cache.has(key)) return cache.get(key)!;
    const wait = Math.max(0, 1100 - (Date.now() - lastRequest));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    signal?.throwIfAborted();
    if (import.meta.env.VITE_MAP_SEARCH_URL && !import.meta.env.VITE_MAP_SEARCH_ATTRIBUTION) {
      throw new Error('The custom address search provider needs VITE_MAP_SEARCH_ATTRIBUTION configured.');
    }
    const url = new URL(import.meta.env.VITE_MAP_SEARCH_URL || 'https://nominatim.openstreetmap.org/search');
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
      throw new Error('The address search provider must use HTTPS.');
    }
    url.searchParams.set('q', term);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '5');
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 10000);
    lastRequest = Date.now();
    try {
      const response = await fetch(url.toString(), { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Search unavailable');
      const body: unknown = await response.json();
      if (!Array.isArray(body)) throw new Error('Invalid search response');
      const results: AddressResult[] = [];
      for (const row of body) {
        if (!row || typeof row !== 'object' || typeof row.display_name !== 'string'
          || !['string', 'number'].includes(typeof row.lat) || !['string', 'number'].includes(typeof row.lon)
          || String(row.lat).trim() === '' || String(row.lon).trim() === '') continue;
        const point = { lat: Number(row.lat), lng: Number(row.lon) };
        if (isGeoPoint(point) && row.display_name.trim()) {
          results.push({ ...point, id: String(row.place_id ?? results.length), label: row.display_name });
        }
      }
      if (cache.size >= 50) cache.clear();
      cache.set(key, results);
      return results;
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new Error('Address search is unavailable. Try again, use GPS, or place a pin on the map.', { cause: error });
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  };
  const request = queue.then(run, run);
  queue = request.catch(() => undefined);
  return request;
}
