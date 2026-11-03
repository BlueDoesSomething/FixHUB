import { describe, expect, test } from 'vitest';
import type { ReportRepair } from '@/data/reports';
import { REPORT_REFERENCE_DATE as REPORT_DEMO_DATE, reportRepairs as sampleReportRepairs } from './fixtures/reports';
import { buildRepairReport, reportDateRange } from '@/utils/reports';

const record = (overrides: Partial<ReportRepair> = {}): ReportRepair => ({
  id: 'test-repair', brand: 'Apple', status: 'Completed', completedAt: '2026-10-31T10:00:00+08:00', serviceType: 'home', revenueCentavos: 250000, ...overrides,
});

describe('report calendar periods', () => {
  test.each([
    ['day', '2026-10-31', '2026-11-01'],
    ['week', '2026-10-26', '2026-11-02'],
    ['month', '2026-10-01', '2026-11-01'],
    ['year', '2026-01-01', '2027-01-01'],
  ] as const)('%s includes the start and excludes the next period', (period, start, end) => {
    const range = reportDateRange(period, REPORT_DEMO_DATE)!;
    expect(range.start.toISOString().slice(0, 10)).toBe(start);
    expect(range.end.toISOString().slice(0, 10)).toBe(end);
  });

  test('keeps Sunday in its Monday-based week and supports weeks spanning years', () => {
    expect(reportDateRange('week', '2026-11-01')?.start.toISOString().slice(0, 10)).toBe('2026-10-26');
    const range = reportDateRange('week', '2027-01-01')!;
    expect(range.start.toISOString().slice(0, 10)).toBe('2026-12-28');
    expect(range.end.toISOString().slice(0, 10)).toBe('2027-01-04');
    expect(range.label).toContain('2026');
    expect(range.label).toContain('2027');
  });

  test('supports leap years and exact month lengths', () => {
    const range = reportDateRange('month', '2024-02-29')!;
    expect(range.start.toISOString().slice(0, 10)).toBe('2024-02-01');
    expect(range.end.toISOString().slice(0, 10)).toBe('2024-03-01');
  });

  test.each(['', 'invalid', '2026-02-29', '2026-02-30', '2026-13-01', '2026-1-1'])('rejects invalid reference date %j', date => {
    expect(reportDateRange('month', date)).toBeNull();
    expect(buildRepairReport(sampleReportRepairs, 'month', date)).toBeNull();
  });
});

describe('repair report aggregation', () => {
  test.each([['day', 4], ['week', 11], ['month', 21], ['year', 27]] as const)('filters the %s repair count and both charts together', (period, expected) => {
    const report = buildRepairReport(sampleReportRepairs, period, REPORT_DEMO_DATE)!;
    expect(report.total).toBe(expected);
    expect(report.brands.reduce((sum, brand) => sum + brand.value, 0)).toBe(expected);
    expect(report.services.reduce((sum, service) => sum + service.value, 0)).toBe(expected);
    expect(report.services.reduce((sum, service) => sum + service.height, 0)).toBeCloseTo(100);
  });

  test('applies Philippines midnight boundaries rather than browser or UTC dates', () => {
    const records = [
      record({ completedAt: '2026-10-30T15:59:59.999Z' }),
      record({ completedAt: '2026-10-30T16:00:00.000Z', revenueCentavos: 12345 }),
      record({ completedAt: '2026-10-31T15:59:59.999Z', revenueCentavos: 67890 }),
      record({ completedAt: '2026-10-31T16:00:00.000Z' }),
    ];
    const report = buildRepairReport(records, 'day', '2026-10-31')!;
    expect(report.total).toBe(2);
    expect(report.revenueCentavos).toBe(80235);
  });

  test('excludes pending, cancelled, and undated or invalid completions', () => {
    const records = [record(), record({ status: 'Pending' }), record({ status: 'Cancelled' }), record({ completedAt: null }), record({ completedAt: 'not-a-date' })];
    expect(buildRepairReport(records, 'day', REPORT_DEMO_DATE)?.total).toBe(1);
  });

  test('normalizes brand variants and preserves missing-brand repairs as Unknown', () => {
    const records = ['Apple', ' APPLE ', 'apple / iphone', 'iPhone', 'Samsung', ' SAMSUNG ', null, '', 'Acme Tech', ' ACME   TECH '].map(brand => record({ brand }));
    const report = buildRepairReport(records, 'day', REPORT_DEMO_DATE)!;
    expect(report.brands.map(brand => [brand.label, brand.value])).toEqual([['Apple', 4], ['Acme Tech', 2], ['Samsung', 2], ['Unknown', 2]]);
    expect(report.total).toBe(10);
  });

  test('sorts brands highest first and keeps their colors stable across periods', () => {
    const month = buildRepairReport(sampleReportRepairs, 'month', REPORT_DEMO_DATE)!;
    const day = buildRepairReport(sampleReportRepairs, 'day', REPORT_DEMO_DATE)!;
    expect(month.brands[0]).toMatchObject({ label: 'Apple', value: 7 });
    expect(day.brands[0]).toMatchObject({ label: 'Apple', value: 2 });
    for (const brand of day.brands) expect(month.brands.find(item => item.label === brand.label)?.color).toBe(brand.color);
    expect(month.brands.every((brand, index, rows) => !index || brand.value <= rows[index - 1].value)).toBe(true);
  });

  test('reports a prior year separately and returns honest zero totals for an empty period', () => {
    expect(buildRepairReport(sampleReportRepairs, 'year', '2025-12-31')?.total).toBe(1);
    const empty = buildRepairReport(sampleReportRepairs, 'month', '2030-01-01')!;
    expect(empty).toMatchObject({ total: 0, revenueCentavos: 0, brands: [] });
    expect(empty.services.every(service => service.value === 0 && service.height === 0)).toBe(true);
  });

  test('counts zero-revenue completed jobs without mutating source data', () => {
    const records = [record({ revenueCentavos: 0 })];
    const before = JSON.stringify(records);
    const report = buildRepairReport(records, 'month', REPORT_DEMO_DATE)!;
    expect(report).toMatchObject({ total: 1, revenueCentavos: 0 });
    expect(JSON.stringify(records)).toBe(before);
  });
});
