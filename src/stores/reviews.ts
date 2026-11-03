import { reactive } from 'vue';
import { completedReviewRepairs, isRepairReview, MAX_REVIEW_LENGTH, REVIEW_STORAGE_KEY, summarizeReviews, type RepairReview } from '../data/reviews';
import { technicians } from '../data/catalog';
import { useAuth } from './auth';

type ReviewStorage = Pick<Storage, 'getItem' | 'setItem'>;
const storageMessage = 'Reviews could not be saved. Allow browser storage and try again. Your feedback has not been published.';

function browserStorage(): ReviewStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; }
  catch { return null; }
}

export function createReviewsStore(storage: ReviewStorage | null = browserStorage()) {
  const state = reactive({ reviews: [] as RepairReview[], storageError: '' });
  try {
    const raw = storage?.getItem(REVIEW_STORAGE_KEY);
    if (raw !== null && raw !== undefined) {
      const saved: unknown = JSON.parse(raw);
      if (!Array.isArray(saved) || !saved.every(isRepairReview)
        || new Set(saved.map(review => review.id)).size !== saved.length
        || new Set(saved.map(review => review.repairId)).size !== saved.length) throw new Error('Invalid saved reviews');
      // Ignore records from the retired examples without deleting browser data.
      state.reviews = saved.filter(review => !review.id.startsWith('sample-') && !review.repairId.startsWith('sample-'));
    }
  } catch {
    state.storageError = 'Saved reviews could not be read. Reload after checking your browser storage. No saved data has been replaced.';
  }

  function persist(reviews: RepairReview[]) {
    // Do not overwrite unreadable data, or report success before the browser has saved it.
    if (state.storageError) throw new Error(state.storageError);
    try {
      if (!storage) throw new Error('Storage unavailable');
      storage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews));
    } catch { throw new Error(storageMessage); }
    state.reviews = reviews;
  }

  function mine() {
    const auth = useAuth();
    return auth.state.isAuthenticated ? state.reviews.filter(review => review.customerId === auth.profile().email) : [];
  }

  function pendingRepairs() {
    const auth = useAuth();
    return completedReviewRepairs.filter(repair => auth.state.isAuthenticated && repair.completed && repair.customerId === auth.profile().email
      && !state.reviews.some(review => review.repairId === repair.id));
  }

  function forTechnician(technicianId: number) {
    return state.reviews.filter(review => review.technicianId === technicianId);
  }

  function submitReview(repairId: string, rating: number, comment: string) {
    const auth = useAuth();
    if (!auth.state.isAuthenticated || auth.state.role !== 'client') throw new Error('Sign in as a customer to leave a review.');
    const repair = completedReviewRepairs.find(repair => repair.id === repairId && repair.customerId === auth.profile().email);
    if (!repair?.completed) throw new Error('Choose one of your completed repairs.');
    if (state.reviews.some(review => review.repairId === repairId)) throw new Error('You have already reviewed this repair.');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Select a rating from 1 to 5 stars.');
    if (comment.length > MAX_REVIEW_LENGTH) throw new Error(`Keep your review within ${MAX_REVIEW_LENGTH} characters.`);
    const review: RepairReview = {
      id: `review-${repair.id}`,
      repairId: repair.id,
      customerId: repair.customerId,
      customerName: repair.customerName,
      technicianId: repair.technicianId,
      device: repair.device,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };
    persist([review, ...state.reviews]);
    return review;
  }

  function saveReply(reviewId: string, comment: string) {
    const auth = useAuth();
    const review = state.reviews.find(review => review.id === reviewId);
    const technician = technicians.find(tech => tech.name === auth.profile().name);
    if (!auth.state.isAuthenticated || auth.state.role !== 'technician' || !review || review.technicianId !== technician?.id) {
      throw new Error('Only the technician who received this review can reply.');
    }
    if (!comment.trim() || comment.length > MAX_REVIEW_LENGTH) throw new Error(`Enter a reply of 1–${MAX_REVIEW_LENGTH} characters.`);
    const updated = { ...review, reply: { comment: comment.trim(), createdAt: new Date().toISOString() } };
    persist(state.reviews.map(item => item.id === reviewId ? updated : item));
  }

  return { state, mine, pendingRepairs, forTechnician, submitReview, saveReply, summary: (technicianId: number) => summarizeReviews(forTechnician(technicianId)) };
}

const store = createReviewsStore();
export function useReviews() { return store; }
