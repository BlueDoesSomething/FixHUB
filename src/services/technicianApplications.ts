import { getSupabaseBackend } from './supabase';
import type { Database } from '../types/database';

type TechnicianApplicationRow = Database['public']['Tables']['technician_applications']['Row'];

type AdminProfileRow = {
  user_id: string;
  full_name: string;
  city: string;
  phone: string | null;
  role: string;
  created_at: string;
};

export async function fetchTechnicianApplications(): Promise<TechnicianApplicationRow[]> {
  const { data, error } = await (getSupabaseBackend() as any).rpc('admin_list_applications');
  if (error) throw error;
  return (data ?? [])
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) as TechnicianApplicationRow[];
}

export async function fetchMyTechnicianApplications(userId: string): Promise<TechnicianApplicationRow[]> {
  const { data, error } = await getSupabaseBackend().from('technician_applications')
    .select('*').eq('applicant_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function approveApplication(applicationId: string): Promise<void> {
  const { error } = await getSupabaseBackend().rpc('admin_approve_application', {
    p_application_id: applicationId,
  });
  if (error) throw error;
}

export async function rejectApplication(applicationId: string, note: string): Promise<void> {
  const { error } = await getSupabaseBackend().rpc('admin_reject_application', {
    p_application_id: applicationId,
    p_note: note,
  });
  if (error) throw error;
}

export async function requestApplicationInfo(applicationId: string, note: string): Promise<void> {
  const { error } = await getSupabaseBackend().rpc('admin_request_info', {
    p_application_id: applicationId,
    p_note: note,
  });
  if (error) throw error;
}

export async function startApplicationReview(applicationId: string): Promise<void> {
  const { error } = await getSupabaseBackend().rpc('admin_start_review', {
    p_application_id: applicationId,
  });
  if (error) throw error;
}

export type ApplicationSubmission = {
  p_full_name: string;
  p_contact_number: string;
  p_city: string;
  p_years_experience: number;
  p_brands: string[];
  p_specializations: string[];
  p_experience_description: string;
  p_service_type: Database['public']['Enums']['service_type'];
  p_coverage_area: string;
  p_working_days: string[];
  p_working_hours: string;
};

export async function submitApplication(payload: ApplicationSubmission, existingId?: string): Promise<string> {
  if (existingId) {
    const { data, error } = await getSupabaseBackend().from('technician_applications').update({
      full_name: payload.p_full_name, contact_number: payload.p_contact_number,
      city: payload.p_city, years_experience: payload.p_years_experience,
      brands: payload.p_brands, specializations: payload.p_specializations,
      experience_description: payload.p_experience_description,
      service_type: payload.p_service_type, coverage_area: payload.p_coverage_area,
      working_days: payload.p_working_days, working_hours: payload.p_working_hours,
    }).eq('id', existingId).select('id').single();
    if (error) throw error;
    return data.id;
  }
  const { data, error } = await getSupabaseBackend().rpc('submit_my_application', payload);
  if (error) throw error;
  return data as string;
}

export interface AdminUserRow {
  user_id: string;
  full_name: string;
  city: string;
  phone: string | null;
  role: string | null;
  created_at: string;
}

export async function fetchUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await (getSupabaseBackend() as any).rpc('admin_list_profiles');
  if (error) throw error;
  return (data ?? [] as AdminProfileRow[]).map((p: AdminProfileRow) => ({
    user_id: p.user_id,
    full_name: p.full_name,
    city: p.city,
    phone: p.phone ?? null,
    role: p.role,
    created_at: p.created_at,
  }));
}
