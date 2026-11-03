export const MAX_REVIEW_LENGTH = 1000;
export const REVIEW_STORAGE_KEY = 'fixhub.reviews.v1';

export interface RepairReview {
  id: string;
  repairId: string;
  customerId: string;
  customerName: string;
  technicianId: number;
  device: string;
  rating: number;
  comment: string;
  createdAt: string;
  reply?: { comment: string; createdAt: string };
}

export interface ReviewRepair {
  id: string;
  customerId: string;
  customerName: string;
  technicianId: number;
  technicianName: string;
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
  return typeof review.id === 'string' && !!review.id
    && typeof review.repairId === 'string' && !!review.repairId
    && typeof review.customerId === 'string' && !!review.customerId
    && typeof review.customerName === 'string' && !!review.customerName
    && typeof review.technicianId === 'number' && Number.isInteger(review.technicianId) && review.technicianId > 0
    && typeof review.device === 'string' && !!review.device
    && typeof review.rating === 'number' && Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5
    && typeof review.comment === 'string' && review.comment.length <= MAX_REVIEW_LENGTH
    && validDate(review.createdAt)
    && (review.reply === undefined || (!!review.reply && typeof review.reply.comment === 'string'
      && !!review.reply.comment.trim() && review.reply.comment.length <= MAX_REVIEW_LENGTH && validDate(review.reply.createdAt)));
}
