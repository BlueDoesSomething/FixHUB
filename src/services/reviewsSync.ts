import { getSupabaseBackend } from './supabase';
import type { Database } from '../types/database';
import type { RepairReview, ReviewRepair } from '../data/reviews';

/**
 * Shares repair reviews through FIXHUB so a rating written on one device is
 * visible to the technician (and every other customer) on another.
 *
 * Every function is best-effort: the browser copy stays the source of truth
 * for this device and a backend problem never breaks the local flow.
 */

type ReviewRow = Database['public']['Functions']['list_reviews']['Returns'][number];
type ReviewableRow = Database['public']['Functions']['list_my_reviewable_repairs']['Returns'][number];

/** All reviews with their customer/technician display names, newest first. */
export async function fetchRemoteReviews(): Promise<RepairReview[]> {
  try {
    const backend = getSupabaseBackend();
    const { data, error } = await backend.rpc('list_reviews');
    if (error || !Array.isArray(data)) return [];
    return (data as ReviewRow[]).map(row => ({
      id: row.id,
      repairId: row.repair_id,
      customerId: row.customer_id,
      customerName: row.customer_name,
      technicianId: row.technician_id,
      technicianName: row.technician_name,
      device: row.device,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at,
      reply: row.reply_comment && row.reply_created_at
        ? { comment: row.reply_comment, createdAt: row.reply_created_at }
        : undefined,
      synced: true,
    }));
  } catch {
    return [];
  }
}

/** Completed repairs of the signed-in customer that still wait for a review. */
export async function fetchRemoteReviewableRepairs(customer: { email: string; name: string }): Promise<ReviewRepair[]> {
  try {
    const backend = getSupabaseBackend();
    const { data, error } = await backend.rpc('list_my_reviewable_repairs');
    if (error || !Array.isArray(data)) return [];
    return (data as ReviewableRow[]).map(row => {
      const device = [row.device, row.brand, row.model].map(part => part?.trim()).filter(Boolean).join(' ');
      return {
        id: row.repair_id,
        customerId: customer.email,
        customerName: customer.name,
        technicianId: row.technician_id,
        technicianProfileId: row.technician_id,
        technicianName: row.technician_name,
        device: device || row.repair_id.slice(0, 8),
        problem: row.problem,
        date: row.completed_at.slice(0, 10),
        completed: true,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Publishes one local review so the technician can see it. Resolves with the
 * backend review id, or null when the review stays on this device only.
 */
export async function publishRemoteReview(input: {
  repairId: string;
  technicianProfileId: string;
  customerId: string;
  rating: number;
  comment: string;
}): Promise<string | null> {
  try {
    const backend = getSupabaseBackend();
    const { data, error } = await backend.from('reviews')
      .insert({
        repair_id: input.repairId,
        customer_id: input.customerId,
        technician_id: input.technicianProfileId,
        rating: input.rating,
        comment: input.comment,
      })
      .select('id')
      .maybeSingle();
    if (error || !data) return null;
    return data.id;
  } catch {
    return null;
  }
}

/** Publishes the reviewed technician's response. Resolves false when it stays local. */
export async function publishRemoteReply(input: { reviewId: string; technicianUserId: string; comment: string }): Promise<boolean> {
  try {
    const backend = getSupabaseBackend();
    const { error } = await backend.from('review_replies').insert({
      review_id: input.reviewId,
      technician_id: input.technicianUserId,
      comment: input.comment,
    });
    return !error;
  } catch {
    return false;
  }
}

/** The signed-in technician's profile id, used to match reviews and replies. */
export async function fetchMyTechnicianProfileId(): Promise<string | null> {
  try {
    const backend = getSupabaseBackend();
    const { data, error } = await backend.rpc('my_technician_profile_id');
    if (error) return null;
    return typeof data === 'string' && data ? data : null;
  } catch {
    return null;
  }
}
