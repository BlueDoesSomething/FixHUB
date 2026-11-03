import { describe, expect, test } from 'vitest';
import { distanceKm, formatCoordinates, isGeoPoint } from '@/utils/map';
import { useRepairDraft } from '@/stores/repair';

describe('map coordinates', () => {
  test('accepts geographic coordinates and rejects invalid or pixel coordinates', () => {
    expect(isGeoPoint({ lat: 14.5547, lng: 121.0244 })).toBe(true);
    for (const point of [null, {}, { x: 200, y: 180 }, { lat: 91, lng: 0 }, { lat: 0, lng: -181 }, { lat: NaN, lng: 0 }, { lat: '14', lng: 121 }]) {
      expect(isGeoPoint(point)).toBe(false);
    }
  });

  test('formats coordinates without claiming a reverse-geocoded street address', () => {
    expect(formatCoordinates({ lat: 14.5547, lng: 121.0244 })).toBe('14.55470, 121.02440');
  });

  test('computes straight-line distances, including across the date line', () => {
    expect(distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 0 })).toBe(0);
    expect(distanceKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111.195, 2);
    expect(distanceKm({ lat: 0, lng: 179 }, { lat: 0, lng: -179 })).toBeCloseTo(222.39, 2);
  });

  test('repair draft reset clears previously selected coordinates', () => {
    const { draft, reset } = useRepairDraft();
    draft.coordinates = { lat: 14.5547, lng: 121.0244 };
    reset();
    expect(draft.coordinates).toBeNull();
    expect(draft.location).toBe('');
  });
});
