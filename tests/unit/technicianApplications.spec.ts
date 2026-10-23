import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { TechnicianApplicationPayload } from '@/data/technicianApplication';

function payload(overrides: Partial<TechnicianApplicationPayload['applicant']> = {}): TechnicianApplicationPayload {
  return {
    applicant: {
      userId: 'test.tech@email.com',
      fullName: 'Test Technician',
      email: 'test.tech@email.com',
      contactNumber: '+63 917 000 0000',
      city: 'Manila',
      ...overrides,
    },
    professional: {
      yearsExperience: '4',
      brands: ['Samsung'],
      specializations: ['Screen Replacement'],
      experienceDescription: 'I have repaired phones for several years.',
    },
    service: {
      serviceType: 'Both',
      coverageArea: 'Manila',
      workingDays: ['Mon', 'Tue'],
      workingHours: '9:00 AM - 6:00 PM',
    },
    documents: {
      certificates: [],
      workPhotos: [],
    },
  };
}

describe('technicianApplications store', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) window.localStorage.clear();
    vi.resetModules();
  });

  test('seeds demo applications when storage is empty', async () => {
    const { useTechnicianApplications } = await import('@/stores/technicianApplications');
    const store = useTechnicianApplications();
    expect(store.all().length).toBeGreaterThan(0);
  });

  test('submitting a new application stores it as Pending and links it to the user', async () => {
    const { useTechnicianApplications } = await import('@/stores/technicianApplications');
    const store = useTechnicianApplications();
    const before = store.all().length;

    const app = store.submit(payload());

    expect(app.status).toBe('Pending');
    expect(store.all().length).toBe(before + 1);
    expect(store.mine('test.tech@email.com')?.id).toBe(app.id);
  });

  test('approving an application grants a technician profile id', async () => {
    const { useTechnicianApplications } = await import('@/stores/technicianApplications');
    const store = useTechnicianApplications();
    const app = store.submit(payload());

    const updated = store.review(app.id, 'approve', 'Credentials verified.');

    expect(updated?.status).toBe('Approved');
    expect(updated?.technicianProfileId).toBeTruthy();
    expect(updated?.history.some((event) => event.status === 'Approved')).toBe(true);
  });

  test('requesting information sets the status and keeps the applicant editable', async () => {
    const { useTechnicianApplications } = await import('@/stores/technicianApplications');
    const store = useTechnicianApplications();
    const app = store.submit(payload());

    const updated = store.review(app.id, 'request-info', 'Please upload a valid ID.');

    expect(updated?.status).toBe('Needs Information');
    expect(updated?.review.feedback).toBe('Please upload a valid ID.');

    const resubmitted = store.resubmit(app.id, payload());
    expect(resubmitted?.status).toBe('Pending');
  });
});
