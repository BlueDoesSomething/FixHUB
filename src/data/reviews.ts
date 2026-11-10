export const MAX_REVIEW_LENGTH = 1000;
export const REVIEW_STORAGE_KEY = 'fixhub.reviews.v1';

export interface RepairReview {
  id: string;
  repairId: string;
  customerId: string;
  customerName: string;
  /** Numeric for records created in this browser; technician profile uuid once read from FIXHUB. */
  technicianId: number | string;
  /** Technician display name, present on reviews read from FIXHUB instead of the local directory. */
  technicianName?: string;
  device: string;
  rating: number;
  comment: string;
  createdAt: string;
  reply?: { comment: string; createdAt: string };
  /** True once the review exists in the FIXHUB backend (shared with the technician). */
  synced?: boolean;
}

export interface ReviewRepair {
  id: string;
  customerId: string;
  customerName: string;
  technicianId: number | string;
  technicianName: string;
  /** Technician profile uuid of a repair loaded from FIXHUB; required to publish the review. */
  technicianProfileId?: string;
  device: string;
  problem: string;
  date: string;
  completed: boolean;
}

export const completedReviewRepairs: ReviewRepair[] = [];

export function summarizeReviews(reviews: readonly RepairReview[]) {
  const total = reviews.length;
  return {
    total,
    average: total ? reviews.reduce((sum, review) => sum + review.rating, 0) / total : null,
    distribution: [5, 4, 3, 2, 1].map(rating => ({ rating, count: reviews.filter(review => review.rating === rating).length })),
  };
}

export function isRepairReview(value: unknown): value is RepairReview {
  if (!value || typeof value !== 'object') return false;
  const review = value as Partial<RepairReview>;
  const validDate = (date: unknown) => typeof date === 'string' && Number.isFinite(Date.parse(date));
  const validTechnician = (id: unknown) => (typeof id === 'number' && Number.isInteger(id) && id > 0)
    || (typeof id === 'string' && !!id && id.length <= 64);
  return typeof review.id === 'string' && !!review.id
    && typeof review.repairId === 'string' && !!review.repairId
    && typeof review.customerId === 'string' && !!review.customerId
    && typeof review.customerName === 'string' && !!review.customerName
    && validTechnician(review.technicianId)
    && (review.technicianName === undefined || (typeof review.technicianName === 'string'
      && !!review.technicianName.trim() && review.technicianName.length <= 200))
    && (review.synced === undefined || typeof review.synced === 'boolean')
    && typeof review.device === 'string' && !!review.device
    && typeof review.rating === 'number' && Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5
    && typeof review.comment === 'string' && review.comment.length <= MAX_REVIEW_LENGTH
    && validDate(review.createdAt)
    && (review.reply === undefined || (!!review.reply && typeof review.reply.comment === 'string'
      && !!review.reply.comment.trim() && review.reply.comment.length <= MAX_REVIEW_LENGTH && validDate(review.reply.createdAt)));
}

/**
 * Browser-saved reviews and reviews read from FIXHUB describe the same repair,
 * so they are keyed by repair id: the shared copy wins, while a reply that only
 * exists on this device is kept until FIXHUB returns one.
 */
export function mergeReviews(local: readonly RepairReview[], remote: readonly RepairReview[]): RepairReview[] {
  const merged = new Map<string, RepairReview>();
  for (const review of local) merged.set(review.repairId, review);
  for (const review of remote) {
    const existing = merged.get(review.repairId);
    merged.set(review.repairId, { ...review, reply: review.reply ?? existing?.reply });
  }
  return [...merged.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
