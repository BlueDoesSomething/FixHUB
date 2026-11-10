import { getSupabaseBackend } from './supabase';
import { reportDateRange } from '../utils/reports';
import type { ReportPeriod, ReportRepair } from '../data/reports';
import type { Database } from '../types/database';
import type { TechnicianApplication, ApplicationStatus } from '../data/technicianApplication';
import { fetchTechnicianApplications } from './technicianApplications';
import { listApplicationDocuments } from './applicationDocuments';

export interface Overview {
  users: number;
  technicians: number;
  activeRepairs: number;
  completed: number;
  applications: number;
  weekly: { day: string; total: number }[];
  recent: { id: string; reference: string; device: string; brand: string; status: string; createdAt: string; customer: string }[];
  topTechnicians: { id: string; name: string; specialty: string; repairs: number; averageRating: number; reviewCount: number; score: number }[];
}

export async function fetchOverview(): Promise<Overview> {
  const { data, error } = await (getSupabaseBackend() as any).rpc('admin_overview');
  if (error) throw error;
  return data as Overview;
}

export async function fetchReportRepairs(period: ReportPeriod, referenceDate: string): Promise<ReportRepair[]> {
  const range = reportDateRange(period, referenceDate);
  if (!range) return [];
  // reportDateRange uses calendar dates in Manila; convert midnight to UTC.
  const start = new Date(range.start.getTime() - 8 * 60 * 60 * 1000).toISOString();
  const end = new Date(range.end.getTime() - 8 * 60 * 60 * 1000).toISOString();
  const rows: ReportRepair[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await getSupabaseBackend().from('repair_requests')
      .select('id,brand,status,updated_at,service_type')
      .eq('status', 'completed').gte('updated_at', start).lt('updated_at', end)
      .order('updated_at').order('id').range(offset, offset + 999);
    if (error) throw error;
    rows.push(...(data ?? []).map(row => ({
      id: row.id, brand: row.brand, status: 'Completed' as const,
      completedAt: row.updated_at, serviceType: row.service_type === 'dropoff' ? 'dropoff' as const : 'home' as const,
      revenueCentavos: 0, // No payment/price is recorded; revenue is not displayed.
    })));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

type ApplicationRow = Database['public']['Tables']['technician_applications']['Row'];
export function mapApplication(row: ApplicationRow): TechnicianApplication {
  const statuses: Record<string, ApplicationStatus> = {
    pending: 'Pending', under_review: 'Under Review', needs_information: 'Needs Information',
    approved: 'Approved', rejected: 'Rejected',
  };
  return {
    id: row.id, createdAt: row.created_at, updatedAt: row.updated_at,
    status: statuses[row.status],
    applicant: { userId: row.applicant_id, fullName: row.full_name, email: row.email,
      contactNumber: row.contact_number, city: row.city },
    professional: { yearsExperience: String(row.years_experience), brands: row.brands,
      specializations: row.specializations, experienceDescription: row.experience_description },
    service: { serviceType: row.service_type, coverageArea: row.coverage_area,
      workingDays: row.working_days, workingHours: row.working_hours },
    documents: { certificates: [], workPhotos: [] },
    review: { reviewer: row.reviewer_id ?? undefined, reviewedAt: row.reviewed_at ?? undefined,
      feedback: row.feedback ?? undefined }, history: [],
  };
}

export async function fetchAdminApplications(): Promise<TechnicianApplication[]> {
  return Promise.all((await fetchTechnicianApplications()).map(async row => {
    const app = mapApplication(row);
    app.documents.certificates = await listApplicationDocuments(row.applicant_id, row.id);
    return app;
  }));
}
