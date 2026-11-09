import { describe, expect, test } from 'vitest';
import { categories, devices } from '@/data/catalog';
import { emptyRepairDraft, REPAIR_DEVICES, validateRepair } from '@/data/repair';
import { nearbyTechnicians } from '@/utils/nearbyTechnicians';
import type { LocatedTechnician } from '@/services/technicianLocations';

const supported = ['Smartphone', 'Tablet', 'Other'];
const retired = ['Laptop', 'Desktop', 'Computer', 'Console'];
function technician(id: string, specializations: string[]): LocatedTechnician {
  return { id, full_name: id, specializations, service_type: 'both', latitude: 14.55, longitude: 121.02, address: 'Shop', updated_at: '2026-11-01T00:00:00Z', location_mode: 'manual', live_expires_at: null };
}

describe('supported repair devices', () => {
  test('keeps dashboard categories, repair buttons, and validation in sync', () => {
    expect(categories.map(category => category.name)).toEqual(supported);
    expect(devices.map(device => device.name)).toEqual(supported);
    expect(REPAIR_DEVICES).toEqual(supported);
  });

  test.each(supported)('allows %s for new repair requests', device => {
    expect(validateRepair({ ...emptyRepairDraft(), device }, false).device).toBeUndefined();
  });

  test.each(retired)('rejects the retired %s category without changing the draft', device => {
    const draft = { ...emptyRepairDraft(), device, brand: 'Saved brand', model: 'Saved model' };
    expect(validateRepair(draft, false).device).toContain('supported device');
    expect(draft).toMatchObject({ device, brand: 'Saved brand', model: 'Saved model' });
  });

  test('excludes retired-device-only profiles even when browsing without a device filter', () => {
    const technicians = [
      ...retired.map(name => technician(name, [name])),
      technician('mobile', ['Smartphone']), technician('tablet', ['Tablet']),
      technician('mixed', ['Laptop', 'Smartphone']), technician('skills', ['Screen Replacement']),
    ];
    const matches = nearbyTechnicians(technicians, null, 10, Date.now());
    expect(matches.map(tech => tech.id).sort()).toEqual(['mixed', 'mobile', 'skills', 'tablet']);
    expect(nearbyTechnicians(technicians, null, 10, Date.now(), 'Smartphone').map(tech => tech.id).sort()).toEqual(['mixed', 'mobile', 'skills']);
    expect(nearbyTechnicians(technicians, null, 10, Date.now(), 'Laptop')).toEqual([]);
  });
});
