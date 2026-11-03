import type { Technician } from '../data/catalog';
import { summarizeReviews, type RepairReview } from '../data/reviews';

export const TECHNICIAN_RANKING_WEIGHTS = { rating: 0.7, repairs: 0.3 } as const;

export interface RankedTechnician extends Technician {
  averageRating: number;
  reviewCount: number;
  score: number;
}

/** Use review records, not the old hard-coded profile ratings, to rank eligible technicians. */
export function rankTechnicians(technicians: readonly Technician[], reviews: readonly RepairReview[]): RankedTechnician[] {
  const candidates = technicians.flatMap(technician => {
    if (!technician.verified || technician.repairs <= 0) return [];
    const summary = summarizeReviews(reviews.filter(review => review.technicianId === technician.id));
    if (summary.average === null) return [];
    return [{ ...technician, averageRating: summary.average, reviewCount: summary.total }];
  });
  const mostRepairs = candidates.reduce((highest, technician) => Math.max(highest, technician.repairs), 0);

  return candidates.map(technician => ({
    ...technician,
    score: 100 * (
      TECHNICIAN_RANKING_WEIGHTS.rating * technician.averageRating / 5
      + TECHNICIAN_RANKING_WEIGHTS.repairs * technician.repairs / mostRepairs
    ),
  })).sort((a, b) => b.score - a.score
    || b.averageRating - a.averageRating
    || b.repairs - a.repairs
    || b.reviewCount - a.reviewCount
    || a.name.localeCompare(b.name)
    || a.id - b.id);
}
