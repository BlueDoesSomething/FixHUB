import { describe, expect, test } from 'vitest';
import {
  fetchRemoteRepairRequests, mergeRepairRequests, pushRepairRequest,
} from '@/services/repairSync';
import { nextRepairStep, remoteStatusLabel, statusPillClass, type SubmittedRepairRequest } from '@/data/repair';

function record(overrides: Partial<SubmittedRepairRequest> = {}): SubmittedRepairRequest {
  return {
    id: 'req-1',
    ownerId: 'client-1',
    reference: 'FH-ABCDEF012345',
    device: 'Smartphone',
    brand: 'Samsung',
    model: 'Galaxy S23',
    problem: 'The phone is not charging correctly.',
    photos: [],
    serviceType: 'home',
    location: 'Example building, Makati',
    coordinates: null,
    createdAt: '2026-11-01T00:00:00.000Z',
    status: 'Pending',
    ...overrides,
  };
}

describe('repair request status presentation', () => {
  test.each([
    ['pending', 'Pending'],
    ['accepted', 'Accepted'],
    ['en_route', 'En Route'],
    ['arrived', 'Arrived'],
    ['in_progress', 'In Progress'],
    ['completed', 'Completed'],
    ['cancelled', 'Cancelled'],
    ['unexpected', 'Pending'],
  ])('maps the database status %s to %s', (remote, label) => {
    expect(remoteStatusLabel(remote)).toBe(label);
  });

  test('colors only confirmed request status pills', () => {
    expect(statusPillClass({ status: 'Completed', synced: true })).toBe('fx-pill--completed');
    expect(statusPillClass({ status: 'Cancelled', synced: true })).toBe('fx-pill--danger');
    expect(statusPillClass({ status: 'Pending', synced: true })).toBe('fx-pill--progress');
    expect(statusPillClass({ status: 'In Progress', synced: true })).toBe('fx-pill--accent');
    expect(statusPillClass({ status: 'Pending' })).toBe('fx-pill--progress');
  });

  test('offers exactly the next allowed workflow step for a technician', () => {
    expect(nextRepairStep('accepted')).toEqual({ dbStatus: 'en_route', label: 'Head to the customer' });
    expect(nextRepairStep('en_route')?.dbStatus).toBe('arrived');
    expect(nextRepairStep('arrived')?.dbStatus).toBe('in_progress');
    expect(nextRepairStep('in_progress')?.dbStatus).toBe('completed');
    expect(nextRepairStep('completed')).toBeNull();
    expect(nextRepairStep('cancelled')).toBeNull();
    expect(nextRepairStep('pending')).toBeNull();
  });
});

describe('server-confirmed repair requests', () => {
  test('does not show older browser-only requests as submitted', () => {
    expect(mergeRepairRequests([record()], [])).toEqual([]);
  });

  test('uses backend lifecycle and photos instead of stale browser copies', () => {
    const local = record({ status: 'Pending', photos: [{ id: 'p1', name: 'device.png', type: 'image/png', size: 3, blob: new Blob(['x'], { type: 'image/png' }) }] });
    const remote = record({ status: 'In Progress', updatedAt: '2026-11-02T00:00:00.000Z', synced: true, photos: [] });
    const [merged] = mergeRepairRequests([local], [remote]);
    expect(merged.status).toBe('In Progress');
    expect(merged.synced).toBe(true);
    expect(merged.updatedAt).toBe('2026-11-02T00:00:00.000Z');
    expect(merged.photos).toHaveLength(0);
  });

  test('lists only server-confirmed requests', () => {
    const shared = record({ id: 'shared', createdAt: '2026-11-03T00:00:00.000Z', status: 'Accepted', synced: true });
    const localOnly = record({ id: 'local-only', createdAt: '2026-11-05T00:00:00.000Z' });
    const merged = mergeRepairRequests([localOnly, shared], [shared]);
    expect(merged.map(request => request.id)).toEqual(['shared']);
    expect(merged.find(request => request.id === 'shared')?.status).toBe('Accepted');
  });

  test('does not mistake an unavailable backend for an empty history', async () => {
    await expect(pushRepairRequest(record(), 'client-1')).resolves.toBe(false);
    await expect(fetchRemoteRepairRequests('client-1')).rejects.toThrow();
  });
});
