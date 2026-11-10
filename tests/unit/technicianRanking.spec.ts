import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import type { Technician } from '@/data/catalog';
import { technicians, seedReviews } from './fixtures/reviews';
import { REVIEW_STORAGE_KEY, type RepairReview } from '@/data/reviews';
import { signInTestUser, signOutTestUser } from './fixtures/accounts';
import { rankTechnicians } from '@/utils/technicianRanking';
import { createReviewsStore } from '@/stores/reviews';
import { useAuth } from '@/stores/auth';
import TopTechnicians from '@/components/admin/TopTechnicians.vue';
import AdminDashboardPage from '@/views/admin/AdminDashboardPage.vue';
vi.mock('@/services/adminAnalytics', () => ({ fetchOverview: async () => ({ users: 0, technicians: 0, activeRepairs: 0, completed: 0, applications: 0, weekly: [], recent: [], topTechnicians: [] }), fetchAdminApplications: async () => [] }));

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/data/catalog', async importOriginal => ({
  ...await importOriginal<typeof import('@/data/catalog')>(), technicians: (await import('./fixtures/reviews')).technicians,
}));
vi.mock('@/data/reviews', async importOriginal => ({
  ...await importOriginal<typeof import('@/data/reviews')>(), completedReviewRepairs: (await import('./fixtures/reviews')).completedReviewRepairs,
}));
vi.mock('@ionic/vue', () => ({ IonPage: { template: '<div><slot /></div>' }, IonContent: { template: '<div><slot /></div>' } }));
vi.mock('@/stores/reviews', async importOriginal => {
  const original = await importOriginal<typeof import('@/stores/reviews')>();
  return { ...original, useReviews: () => store };
});

let store: ReturnType<typeof createReviewsStore>;
let wrapper: VueWrapper | undefined;
const auth = { ...useAuth(), login: signInTestUser, logout: signOutTestUser };
beforeEach(() => { localStorage.clear(); localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(seedReviews())); store = createReviewsStore(localStorage); auth.login('admin'); });
afterEach(() => { wrapper?.unmount(); wrapper = undefined; auth.logout(); });

function technician(id: number, repairs: number, name = `Technician ${id}`): Technician {
  return { ...technicians[0], id, repairs, name };
}

function review(technicianId: number, rating: number, id = `rating-${technicianId}`): RepairReview {
  return { ...seedReviews()[0], id, repairId: `repair-${id}`, technicianId, rating };
}

describe('technician ranking', () => {
  test('combines customer ratings and repair volume rather than sorting by rating alone', () => {
    const ranked = rankTechnicians(technicians, seedReviews());
    expect(ranked.map(technician => technician.id)).toEqual([1, 2, 3]);
    expect(ranked[0].score).toBeCloseTo(95.333333);
    expect(ranked[0].averageRating).toBeCloseTo(14 / 3);
    expect(ranked[0].reviewCount).toBe(3);
    expect(ranked[1].averageRating).toBe(5);
    expect(ranked[1].score).toBeCloseTo(100 * (0.7 + 0.3 * 210 / 382));
    expect(ranked.every(technician => technician.score >= 0 && technician.score <= 100)).toBe(true);
  });

  test('gives higher repair totals a higher score when ratings are equal', () => {
    const ranked = rankTechnicians([technician(1, 50), technician(2, 100)], [review(1, 4), review(2, 4)]);
    expect(ranked.map(technician => technician.id)).toEqual([2, 1]);
    expect(ranked[0].score).toBeCloseTo(86);
    expect(ranked[1].score).toBeCloseTo(71);
  });

  test('gives better feedback a higher score when repair totals are equal', () => {
    const ranked = rankTechnicians([technician(1, 100), technician(2, 100)], [review(1, 3), review(2, 5)]);
    expect(ranked.map(technician => technician.id)).toEqual([2, 1]);
    expect(ranked[0].score).toBe(100);
  });

  test('excludes unverified technicians, zero completed repairs, and unreviewed profiles', () => {
    const profiles = [technician(1, 100), { ...technician(2, 1000), verified: false }, technician(3, 0), technician(4, 1000)];
    const ranked = rankTechnicians(profiles, [review(1, 5), review(2, 5), review(3, 5)]);
    expect(ranked.map(technician => technician.id)).toEqual([1]);
    expect(ranked[0].score).toBe(100);
  });

  test('breaks equal scores by review count and then name, independent of input order', () => {
    const profiles = [technician(1, 100, 'Zoe'), technician(2, 100, 'Alex'), technician(3, 100, 'Sam')];
    const reviews = [review(1, 4), review(2, 4), review(3, 4), review(3, 4, 'second-review')];
    expect(rankTechnicians(profiles, reviews).map(technician => technician.id)).toEqual([3, 2, 1]);
    expect(rankTechnicians([...profiles].reverse(), reviews).map(technician => technician.id)).toEqual([3, 2, 1]);
  });

  test('returns an empty list without dividing by zero when there are no eligible technicians', () => {
    expect(rankTechnicians([], seedReviews())).toEqual([]);
    expect(rankTechnicians(technicians, [])).toEqual([]);
    expect(rankTechnicians([technician(1, 0)], [review(1, 5)])).toEqual([]);
  });

  test('does not change the source profiles or review ordering', () => {
    const profiles = technicians.map(technician => ({ ...technician }));
    const reviews = seedReviews();
    const before = JSON.stringify({ profiles, reviews });
    rankTechnicians(profiles, reviews);
    expect(JSON.stringify({ profiles, reviews })).toBe(before);
  });
});

describe('admin top technicians', () => {
  test('shows rank, current rating, review count, completed repairs, and combined score', () => {
    wrapper = mount(TopTechnicians, { props: { technicians: rankTechnicians(technicians, seedReviews()) } });
    const rows = wrapper.findAll('[data-technician-id]');
    expect(rows).toHaveLength(3);
    expect(rows[0].attributes('data-technician-id')).toBe('1');
    expect(rows[0].text()).toContain('Juan Dela Cruz');
    expect(rows[0].text()).toContain('4.7');
    expect(rows[0].text()).toContain('3 reviews');
    expect(rows[0].text()).toContain('382');
    expect(rows[0].text()).toContain('95.3');
    expect(rows[0].get('[aria-label="Rank 1"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('70%');
    expect(wrapper.text()).toContain('30%');
    expect(wrapper.text()).not.toMatch(/demo|sample/i);
  });

  test('updates the admin ranking when Supabase sends new metrics', async () => {
    wrapper = mount(TopTechnicians, { props: { technicians: rankTechnicians(technicians, seedReviews()) } });
    await wrapper.setProps({ technicians: rankTechnicians(technicians, [...seedReviews(), review(1, 1, 'new')]) });
    await nextTick();
    const rows = wrapper.findAll('[data-technician-id]');
    expect(rows[0].attributes('data-technician-id')).toBe('2');
    expect(rows[1].attributes('data-technician-id')).toBe('1');
    expect(rows[1].text()).toContain('4 reviews');
    expect(rows[1].text()).toContain('382');
  });

  test('shows an honest empty state rather than falling back to hard-coded ratings', () => {
    wrapper = mount(TopTechnicians, { props: { technicians: [] } });
    expect(wrapper.findAll('[data-technician-id]')).toHaveLength(0);
    expect(wrapper.text()).toContain('No technicians qualify yet');
  });

  test('is included in the admin overview before the weekly repair chart', () => {
    wrapper = mount(AdminDashboardPage, { global: { stubs: { BarChart: true } } });
    expect(wrapper.get('[data-testid="top-technicians"]').text()).toContain('Top Technicians');
    expect(wrapper.html().indexOf('top-technicians-title')).toBeLessThan(wrapper.html().indexOf('Weekly Repairs'));
  });
});
