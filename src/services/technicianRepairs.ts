import { getSupabaseBackend } from './supabase';
import type { Database } from '../types/database';
import { remoteStatusLabel, type AssignedRepairJob, type AvailableRepairJob } from '../data/repair';

/**
 * The technician job queue: pending repairs anyone can accept, and the repairs
 * assigned to the signed-in technician with their workflow status.
 *
 * Backend problems show an inline message instead of breaking the dashboard.
 */

type AvailableRow = Database['public']['Functions']['list_available_repairs']['Returns'][number];
type AssignedRow = Database['public']['Functions']['list_my_assigned_repairs']['Returns'][number];

/** Pending, unassigned repair requests, newest first. Errors include profile/access failures. */
export async function fetchAvailableRepairs(): Promise<AvailableRepairJob[]> {
  const backend = getSupabaseBackend();
  const { data, error } = await backend.rpc('list_available_repairs');
  if (error) throw error;
  if (!Array.isArray(data)) return [];
  return (data as AvailableRow[]).map(row => ({
      id: row.id,
      reference: row.reference,
      device: row.device,
      brand: row.brand,
      model: row.model,
      problem: row.problem,
      serviceType: row.service_type,
      location: row.location,
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      createdAt: row.created_at,
  }));
}

/** Takes ownership of a pending job. Resolves false when it was already taken. */
export async function acceptRepairJob(repairId: string): Promise<boolean> {
  try {
    const backend = getSupabaseBackend();
    const { error } = await backend.rpc('accept_repair_request', { p_repair_id: repairId });
    return !error;
  } catch {
    return false;
  }
}

/** Repairs assigned to the signed-in technician, nearest to accept first. Null when the read failed. */
export async function fetchAssignedRepairs(): Promise<AssignedRepairJob[] | null> {
  try {
    const backend = getSupabaseBackend();
    const { data, error } = await backend.rpc('list_my_assigned_repairs');
    if (error) return null;
    if (!Array.isArray(data)) return [];
    return (data as AssignedRow[]).map(row => ({
      id: row.id,
      reference: row.reference,
      device: row.device,
      brand: row.brand,
      model: row.model,
      problem: row.problem,
      serviceType: row.service_type,
      location: row.location,
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
      createdAt: row.created_at,
      status: remoteStatusLabel(row.status),
      dbStatus: row.status,
      customerName: row.customer_name,
      updatedAt: row.updated_at,
      cancellationReason: row.cancellation_reason,
    }));
  } catch {
    return null;
  }
}

/** Moves an assigned repair to its next workflow status. Resolves false on failure. */
export async function advanceRepairJob(repairId: string, nextStatus: string): Promise<boolean> {
  try {
    const backend = getSupabaseBackend();
    const { error } = await backend.rpc('advance_repair_status', {
      p_repair_id: repairId,
      p_new_status: nextStatus as Database['public']['Enums']['repair_status'],
    });
    return !error;
  } catch {
    return false;
  }
}
