import { REPORT_TIME_ZONE, type ReportPeriod, type ReportRepair } from '../data/reports';

const businessDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: REPORT_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const displayDate = (date: Date) => date.toLocaleDateString('en-PH', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });

function parseCalendarDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export function reportDateRange(period: ReportPeriod, referenceDate: string) {
  const start = parseCalendarDate(referenceDate);
  if (!start) return null;
  if (period === 'week') start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
  if (period === 'month') start.setUTCDate(1);
  if (period === 'year') start.setUTCMonth(0, 1);
  const end = new Date(start);
  if (period === 'day') end.setUTCDate(end.getUTCDate() + 1);
  if (period === 'week') end.setUTCDate(end.getUTCDate() + 7);
  if (period === 'month') end.setUTCMonth(end.getUTCMonth() + 1);
  if (period === 'year') end.setUTCFullYear(end.getUTCFullYear() + 1);
  const last = new Date(end);
  last.setUTCDate(last.getUTCDate() - 1);
  const label = period === 'year' ? String(start.getUTCFullYear())
    : period === 'month' ? start.toLocaleDateString('en-PH', { timeZone: 'UTC', month: 'long', year: 'numeric' })
      : period === 'day' ? displayDate(start) : `${displayDate(start)} – ${displayDate(last)}`;
  return { start, end, label };
}

function completionCalendarDate(timestamp: string | null) {
  if (!timestamp) return null;
  const instant = new Date(timestamp);
  if (!Number.isFinite(instant.getTime())) return null;
  const parts = businessDateFormatter.formatToParts(instant);
  const part = (type: string) => parts.find(part => part.type === type)!.value;
  return parseCalendarDate(`${part('year')}-${part('month')}-${part('day')}`);
}

const brands: Record<string, { label: string; color: string }> = {
  apple: { label: 'Apple', color: '#146344' },
  'apple / iphone': { label: 'Apple', color: '#146344' },
  iphone: { label: 'Apple', color: '#146344' },
  samsung: { label: 'Samsung', color: '#2563eb' },
  oppo: { label: 'OPPO', color: '#d97706' },
  xiaomi: { label: 'Xiaomi', color: '#7c3aed' },
  vivo: { label: 'vivo', color: '#0891b2' },
  dell: { label: 'Dell', color: '#db2777' },
  huawei: { label: 'Huawei', color: '#dc2626' },
};
const otherColors = ['#475569', '#4f46e5', '#0d9488', '#a16207'];

function brandDetails(value: string | null) {
  const cleaned = value?.trim().replace(/\s+/g, ' ') || 'Unknown';
  const key = cleaned.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(brands, key)) return brands[key];
  const hash = Array.from(key).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return { label: cleaned.toLowerCase().replace(/\b\w/g, character => character.toUpperCase()), color: otherColors[hash % otherColors.length] };
}

export function buildRepairReport(records: readonly ReportRepair[], period: ReportPeriod, referenceDate: string) {
  const range = reportDateRange(period, referenceDate);
  if (!range) return null;
  const completed = records.filter(record => {
    if (record.status !== 'Completed') return false;
    const day = completionCalendarDate(record.completedAt);
    return day !== null && day >= range.start && day < range.end;
  });
  const counts = new Map<string, { label: string; value: number; color: string }>();
  for (const record of completed) {
    const brand = brandDetails(record.brand);
    const previous = counts.get(brand.label);
    counts.set(brand.label, { ...brand, value: (previous?.value ?? 0) + 1 });
  }
  const brandDistribution = [...counts.values()].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  const services = [
    { label: 'Home', value: completed.filter(record => record.serviceType === 'home').length, color: 'var(--secondary)' },
    { label: 'Drop-off', value: completed.filter(record => record.serviceType === 'dropoff').length, color: 'var(--accent)' },
  ].map(service => ({ ...service, height: completed.length ? service.value / completed.length * 100 : 0 }));
  return {
    range,
    total: completed.length,
    revenueCentavos: completed.reduce((sum, record) => sum + record.revenueCentavos, 0),
    brands: brandDistribution,
    services,
  };
}
