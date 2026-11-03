import type { ReportRepair } from '@/data/reports';

export const REPORT_REFERENCE_DATE = '2026-10-31';
const batches = [
  { day: '2026-10-31', brands: ['Apple', 'Samsung', 'Apple', 'OPPO'] },
  { day: '2026-10-30', brands: ['Apple', 'Xiaomi'] },
  { day: '2026-10-28', brands: ['Samsung', 'Samsung', 'Dell'] },
  { day: '2026-10-26', brands: ['Apple', 'Huawei'] },
  { day: '2026-10-25', brands: ['Samsung', 'Samsung', 'vivo'] },
  { day: '2026-10-18', brands: ['Apple', 'Apple', 'OPPO'] },
  { day: '2026-10-10', brands: ['Apple', 'Xiaomi'] },
  { day: '2026-10-01', brands: ['Samsung', 'Dell'] },
  { day: '2026-09-20', brands: ['Samsung', 'Samsung', 'OPPO', 'Apple'] },
  { day: '2026-01-15', brands: ['Dell', 'Apple'] },
  { day: '2025-12-31', brands: ['Apple'] },
];
const revenue: Record<string, number> = { Apple: 250000, Samsung: 180000, OPPO: 120000, Xiaomi: 100000, vivo: 110000, Dell: 350000, Huawei: 130000 };
export const reportRepairs: ReportRepair[] = batches.flatMap(batch => batch.brands.map((brand, index) => ({
  id: `test-report-${batch.day}-${index}`, brand, status: 'Completed', completedAt: `${batch.day}T10:00:00+08:00`,
  serviceType: index % 3 === 0 ? 'dropoff' : 'home', revenueCentavos: revenue[brand],
})));
