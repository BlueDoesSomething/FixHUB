import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchOverview, fetchReportRepairs } from '@/services/adminAnalytics';

const api = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), range: vi.fn() }));
vi.mock('@/services/supabase', () => ({ getSupabaseBackend: () => ({ rpc: api.rpc, from: api.from }) }));

beforeEach(() => {
  vi.clearAllMocks();
  const query = {
    select: vi.fn(), eq: vi.fn(), gte: vi.fn(), lt: vi.fn(), order: vi.fn(), range: api.range,
  };
  for (const name of ['select', 'eq', 'gte', 'lt', 'order'] as const) query[name].mockReturnValue(query);
  api.from.mockReturnValue(query);
});

describe('admin Supabase analytics', () => {
  test('fetches admin-only overview without browser storage', async () => {
    api.rpc.mockResolvedValue({ data: { users: 12, technicians: 3 }, error: null });
    expect((await fetchOverview()).users).toBe(12);
    expect(api.rpc).toHaveBeenCalledWith('admin_overview');
    api.rpc.mockResolvedValue({ data: null, error: new Error('Admin access required.') });
    await expect(fetchOverview()).rejects.toThrow('Admin access required.');
  });

  test('pages through all completed repairs using Manila calendar boundaries', async () => {
    const row = { id: 'repair', brand: 'Samsung', service_type: 'home', status: 'completed', updated_at: '2026-10-31T10:00:00+08:00' };
    api.range.mockResolvedValueOnce({ data: Array(1000).fill(row), error: null })
      .mockResolvedValueOnce({ data: [row], error: null });
    const repairs = await fetchReportRepairs('day', '2026-10-31');
    expect(repairs).toHaveLength(1001);
    expect(api.range).toHaveBeenNthCalledWith(1, 0, 999);
    expect(api.range).toHaveBeenNthCalledWith(2, 1000, 1999);
    const query = api.from.mock.results[0].value;
    expect(query.gte).toHaveBeenCalledWith('updated_at', '2026-10-30T16:00:00.000Z');
    expect(query.lt).toHaveBeenCalledWith('updated_at', '2026-10-31T16:00:00.000Z');
    expect(repairs[0].status).toBe('Completed');
  });
});
