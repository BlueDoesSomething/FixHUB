import { reactive } from 'vue';
import {
  completedReviewRepairs, isRepairReview, MAX_REVIEW_LENGTH, mergeReviews, REVIEW_STORAGE_KEY,
  summarizeReviews, type RepairReview, type ReviewRepair,
} from '../data/reviews';
import { technicians } from '../data/catalog';
import {
  fetchMyTechnicianProfileId, fetchRemoteReviewableRepairs, fetchRemoteReviews, publishRemoteReply, publishRemoteReview,
} from '../services/reviewsSync';
import { isSupabaseConfigured } from '../services/supabase';
import { useAuth } from './auth';

type ReviewStorage = Pick<Storage, 'getItem' | 'setItem'>;
const storageMessage = 'Reviews could not be saved. Allow browser storage and try again. Your feedback has not been published.';

function browserStorage(): ReviewStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; }
  catch { return null; }
}

export function createReviewsStore(storage: ReviewStorage | null = browserStorage()) {
  const state = reactive({
    reviews: [] as RepairReview[],
    storageError: '',
    /** Completed repairs read from FIXHUB that still wait for this customer's review. */
    remoteRepairs: [] as ReviewRepair[],
    /** Profile id of the signed-in technician, read from FIXHUB. */
    myTechnicianProfileId: null as string | null,
  });
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

  let refreshing: Promise<void> | undefined;

  /**
   * Reads shared reviews and reviewable repairs from FIXHUB, merging them into
   * the browser records. Never throws: an offline or unconfigured build simply
   * keeps showing what this device has.
   */
  function refresh(): Promise<void> {
    if (!isSupabaseConfigured()) return Promise.resolve();
    if (refreshing) return refreshing;
    const auth = useAuth();
    refreshing = (async () => {
      try {
        const customer = auth.state.isAuthenticated && auth.state.role === 'client'
          ? { email: auth.profile().email, name: auth.profile().name }
          : null;
        const [remoteReviews, remoteRepairs, profileId] = await Promise.all([
          fetchRemoteReviews(),
          customer ? fetchRemoteReviewableRepairs(customer) : Promise.resolve([] as ReviewRepair[]),
          auth.state.role === 'technician' ? fetchMyTechnicianProfileId() : Promise.resolve(null),
        ]);
        if (auth.state.isAuthenticated) {
          state.reviews = mergeReviews(state.reviews, remoteReviews);
          state.remoteRepairs = remoteRepairs;
          if (profileId) state.myTechnicianProfileId = profileId;
        }
      } catch {
        // Shared reads are supplementary; browser records stay available.
      } finally {
        refreshing = undefined;
      }
    })();
    return refreshing;
  }

  function mine() {
    const auth = useAuth();
    if (!auth.state.isAuthenticated) return [];
    const userId = auth.state.session?.userId;
    return state.reviews.filter(review => review.customerId === auth.profile().email
      || (!!userId && review.customerId === userId));
  }

  function candidateRepairs() {
    const auth = useAuth();
    if (!auth.state.isAuthenticated) return [];
    const email = auth.profile().email;
    const local = completedReviewRepairs.filter(repair => repair.customerId === email && repair.completed);
    const remote = auth.state.role === 'client'
      ? state.remoteRepairs.filter(repair => !local.some(item => item.id === repair.id))
      : [];
    return [...local, ...remote];
  }

  function pendingRepairs() {
    // A repair leaves the list as soon as it carries a review, so submitReview
    // can still distinguish "already reviewed" from "not one of your jobs".
    return candidateRepairs().filter(repair => !state.reviews.some(review => review.repairId === repair.id));
  }

  function forTechnician(technicianId: number | string) {
    return state.reviews.filter(review => review.technicianId === technicianId);
  }

  function submitReview(repairId: string, rating: number, comment: string) {
    const auth = useAuth();
    if (!auth.state.isAuthenticated || auth.state.role !== 'client') throw new Error('Sign in as a customer to leave a review.');
    const repair = candidateRepairs().find(repair => repair.id === repairId);
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
      technicianName: repair.technicianName,
      device: repair.device,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };
    persist([review, ...state.reviews]);
    publishReview(review, repair);
    return review;
  }

  /** Offer a review of a FIXHUB repair to the backend once, best effort. */
  function publishReview(review: RepairReview, repair: ReviewRepair) {
    const auth = useAuth();
    const userId = auth.state.session?.userId;
    if (!repair.technicianProfileId || !userId || !isSupabaseConfigured()) return;
    void publishRemoteReview({
      repairId: review.repairId,
      technicianProfileId: repair.technicianProfileId,
      customerId: userId,
      rating: review.rating,
      comment: review.comment,
    }).then(remoteId => {
      if (!remoteId) return;
      // Adopt the shared id so a reply can target the backend row from now on.
      state.reviews = state.reviews.map(item => item.id === review.id || item.repairId === review.repairId
        ? { ...item, id: remoteId, synced: true }
        : item);
    });
  }

  function saveReply(reviewId: string, comment: string) {
    const auth = useAuth();
    const review = state.reviews.find(review => review.id === reviewId);
    const technician = technicians.find(tech => tech.name === auth.profile().name);
    const ownsReview = !!review && (
      (!!technician && review.technicianId === technician.id)
      || (!!state.myTechnicianProfileId && review.technicianId === state.myTechnicianProfileId)
    );
    if (!auth.state.isAuthenticated || auth.state.role !== 'technician' || !review || !ownsReview) {
      throw new Error('Only the technician who received this review can reply.');
    }
    if (!comment.trim() || comment.length > MAX_REVIEW_LENGTH) throw new Error(`Enter a reply of 1–${MAX_REVIEW_LENGTH} characters.`);
    const updated = { ...review, reply: { comment: comment.trim(), createdAt: new Date().toISOString() } };
    persist(state.reviews.map(item => item.id === reviewId ? updated : item));
    publishReply(updated);
  }

  /** Send a shared review's response to FIXHUB so the customer sees it anywhere. */
  function publishReply(review: RepairReview) {
    const auth = useAuth();
    const userId = auth.state.session?.userId;
    if (!review.synced || typeof review.technicianId !== 'string' || !userId || !isSupabaseConfigured()) return;
    void publishRemoteReply({ reviewId: review.id, technicianUserId: userId, comment: review.reply?.comment ?? '' });
  }

  return {
    state,
    refresh,
    mine,
    pendingRepairs,
    forTechnician,
    submitReview,
    saveReply,
    summary: (technicianId: number | string) => summarizeReviews(forTechnician(technicianId)),
  };
}

const store = createReviewsStore();
export function useReviews() { return store; }
