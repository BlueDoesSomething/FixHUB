export type ReportPeriod = 'day' | 'week' | 'month' | 'year';

export interface ReportRepair {
  id: string;
  brand: string | null;
  status: 'Completed' | 'Pending' | 'Cancelled';
  completedAt: string | null;
  serviceType: 'home' | 'dropoff';
  revenueCentavos: number;
}

export const REPORT_PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];
export const REPORT_TIME_ZONE = 'Asia/Manila';
export const reportRepairs: ReportRepair[] = [];
