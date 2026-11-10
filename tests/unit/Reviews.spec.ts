import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { createReviewsStore } from '@/stores/reviews';
import { useAuth } from '@/stores/auth';
import ReviewsPage from '@/views/client/ReviewsPage.vue';
import ReviewFeed from '@/components/reviews/ReviewFeed.vue';
import ReviewCard from '@/components/reviews/ReviewCard.vue';
import StarRating from '@/components/reviews/StarRating.vue';
import { signInTestUser, signOutTestUser } from './fixtures/accounts';
import { seedReviews } from './fixtures/reviews';
import { REVIEW_STORAGE_KEY } from '@/data/reviews';

vi.mock('@/data/catalog', async importOriginal => ({
  ...await importOriginal<typeof import('@/data/catalog')>(), technicians: (await import('./fixtures/reviews')).technicians,
}));
vi.mock('@/data/reviews', async importOriginal => ({
  ...await importOriginal<typeof import('@/data/reviews')>(), completedReviewRepairs: (await import('./fixtures/reviews')).completedReviewRepairs,
}));

const navigation = vi.hoisted(() => ({ push: vi.fn(), route: { query: {} as Record<string, string> } }));
vi.mock('vue-router', () => ({ useRouter: () => navigation, useRoute: () => navigation.route }));
vi.mock('@ionic/vue', () => ({ IonPage: { template: '<div><slot /></div>' }, IonContent: { template: '<div><slot /></div>' } }));
vi.mock('@/stores/reviews', async importOriginal => {
  const original = await importOriginal<typeof import('@/stores/reviews')>();
  return { ...original, useReviews: () => store };
});

let store: ReturnType<typeof createReviewsStore>;
let wrapper: VueWrapper | undefined;
const auth = { ...useAuth(), login: signInTestUser, logout: signOutTestUser };
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(seedReviews()));
  store = createReviewsStore(localStorage);
  auth.login('client');
  navigation.route.query = {};
});
afterEach(() => { wrapper?.unmount(); wrapper = undefined; auth.logout(); });

function renderCustomer() {
  wrapper = mount(ReviewsPage, { global: { stubs: { ScreenHeader: true } } });
  return wrapper;
}

describe('customer reviews', () => {
  test('requires a completed repair and a star rating before submitting', async () => {
    renderCustomer();
    await wrapper!.get('form').trigger('submit');
    expect(wrapper!.get('[role="alert"]').text()).toContain('completed repairs');
    await wrapper!.get('#review-repair').setValue('repair-4');
    await wrapper!.get('form').trigger('submit');
    expect(wrapper!.get('[role="alert"]').text()).toContain('1 to 5 stars');
    expect(store.mine()).toHaveLength(0);
  });

  test('prefills a repair from history, submits feedback, and displays the saved review', async () => {
    navigation.route.query = { repair: 'repair-4' };
    renderCustomer();
    expect((wrapper!.get('#review-repair').element as HTMLSelectElement).value).toBe('repair-4');
    await wrapper!.get('input[value="4"]').setValue();
    await wrapper!.get('#review-comment').setValue('Careful repair and friendly service.');
    await wrapper!.get('form').trigger('submit');
    expect(wrapper!.get('[role="status"]').text()).toContain('Thank you');
    expect(wrapper!.findAllComponents(ReviewCard)).toHaveLength(1);
    expect(wrapper!.get('[data-review-id="review-repair-4"]').text()).toContain('Juan Dela Cruz');
    expect(wrapper!.get('[data-review-id="review-repair-4"]').text()).toContain('Careful repair');
    expect(wrapper!.findAll('#review-repair option')).toHaveLength(4);
    expect((wrapper!.get('#review-comment').element as HTMLTextAreaElement).value).toBe('');
  });

  test('retains the draft when storage fails and does not show a success message', async () => {
    store = createReviewsStore({ getItem: () => null, setItem: () => { throw new Error('Full'); } });
    renderCustomer();
    await wrapper!.get('#review-repair').setValue('repair-4');
    await wrapper!.get('input[value="5"]').setValue();
    await wrapper!.get('#review-comment').setValue('Do not lose my draft.');
    await wrapper!.get('form').trigger('submit');
    expect(wrapper!.get('[role="alert"]').text()).toContain('not been published');
    expect(wrapper!.find('[role="status"]').exists()).toBe(false);
    expect((wrapper!.get('#review-comment').element as HTMLTextAreaElement).value).toBe('Do not lose my draft.');
    expect((wrapper!.get('input[value="5"]').element as HTMLInputElement).checked).toBe(true);
  });

  test('shows the caught-up state after every completed repair has a review', () => {
    for (const repair of store.pendingRepairs()) store.submitReview(repair.id, 5, '');
    renderCustomer();
    expect(wrapper!.text()).toContain("You're all caught up");
    expect(wrapper!.find('form').exists()).toBe(false);
    expect(wrapper!.findAllComponents(ReviewCard)).toHaveLength(4);
  });
});

describe('technician review feed', () => {
  test('filters ratings and sorts without changing the full summary', async () => {
    wrapper = mount(ReviewFeed, { props: { technicianId: 1 } });
    expect(wrapper.findAllComponents(ReviewCard)).toHaveLength(3);
    expect(wrapper.get('[aria-label="Rating summary"]').text()).toContain('4.7');
    await wrapper.findAll('select')[0].setValue(4);
    expect(wrapper.findAllComponents(ReviewCard)).toHaveLength(1);
    expect(wrapper.findComponent(ReviewCard).props('review').customerName).toBe('Daniel Cruz');
    expect(wrapper.get('[aria-label="Rating summary"]').text()).toContain('3 reviews');
    await wrapper.findAll('select')[0].setValue(1);
    expect(wrapper.text()).toContain('No reviews match');
    await wrapper.findAll('select')[0].setValue(0);
    await wrapper.findAll('select')[1].setValue('lowest');
    expect(wrapper.findAllComponents(ReviewCard)[0].props('review').rating).toBe(4);
    await wrapper.findAll('select')[1].setValue('highest');
    expect(wrapper.findAllComponents(ReviewCard)[0].props('review').rating).toBe(5);
  });

  test('saves and edits a technician response, visible to the customer', async () => {
    const review = store.submitReview('repair-4', 5, 'Great work.');
    auth.login('technician');
    wrapper = mount(ReviewFeed, { props: { technicianId: 1, canReply: true } });
    const selector = `[data-review-id="${review.id}"]`;
    await wrapper.get(`${selector} button`).trigger('click');
    await wrapper.get(`${selector} textarea`).setValue('Thank you for your feedback!');
    await wrapper.get(`${selector} form`).trigger('submit');
    expect(wrapper.get(`${selector} .review-card__reply`).text()).toContain('Thank you for your feedback!');
    expect(wrapper.get(`${selector} [role="status"]`).text()).toContain('sent to FIXHUB');
    await wrapper.get(`${selector} button`).trigger('click');
    expect((wrapper.get(`${selector} textarea`).element as HTMLTextAreaElement).value).toBe('Thank you for your feedback!');
    await wrapper.get(`${selector} textarea`).setValue('Happy to help!');
    await wrapper.get(`${selector} form`).trigger('submit');
    auth.login('client');
    expect(store.mine()[0].reply?.comment).toBe('Happy to help!');
  });

  test('public reviews cannot show reply controls and render comments as text', () => {
    const review = store.submitReview('repair-4', 5, '<script>alert("test")</script>');
    wrapper = mount(ReviewCard, { props: { review } });
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.find('script').exists()).toBe(false);
    expect(wrapper.text()).toContain('<script>alert("test")</script>');
  });

  test('star rating exposes native labeled radios and a read-only accessible description', async () => {
    wrapper = mount(StarRating, { props: { modelValue: 0 } });
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(5);
    await wrapper.get('input[value="3"]').setValue();
    expect(wrapper.emitted('update:modelValue')).toEqual([[3]]);
    await wrapper.setProps({ modelValue: 3, readonly: true });
    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('3 out of 5 stars');
  });
});
