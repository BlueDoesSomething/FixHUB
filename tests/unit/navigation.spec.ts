import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { reactive } from 'vue';
import { activeMobileNavItem, mobileNavItems, moreNavItems, navConfig } from '@/data/navigation';
import type { Role } from '@/stores/auth';
import FxTabBar from '@/components/FxTabBar.vue';
import MorePage from '@/views/shared/MorePage.vue';

const navigation = vi.hoisted(() => ({ route: { path: '/admin/dashboard' }, push: vi.fn() }));
vi.mock('vue-router', () => ({ useRoute: () => navigation.route, useRouter: () => navigation }));
vi.mock('@ionic/vue', () => ({
  IonPage: { template: '<div><slot /></div>' },
  IonContent: { template: '<div><slot /></div>' },
  IonTabBar: { template: '<nav><slot /></nav>' },
  IonTabButton: { props: ['href', 'tab'], template: '<a :href="href"><slot /></a>' },
  IonLabel: { template: '<span><slot /></span>' },
}));

let wrapper: VueWrapper | undefined;
beforeEach(() => { navigation.route = reactive({ path: '/admin/dashboard' }); navigation.push.mockClear(); });
afterEach(() => { wrapper?.unmount(); wrapper = undefined; });

describe('responsive navigation configuration', () => {
  test.each<Role>(['client', 'technician', 'admin'])('%s has five bottom buttons and a complete overflow menu', role => {
    const items = navConfig[role];
    const bottom = mobileNavItems(items);
    expect(bottom).toHaveLength(5);
    expect(bottom.filter(item => item.id === 'more')).toHaveLength(1);
    expect(bottom.filter(item => item.fab)).toHaveLength(1);
    expect(moreNavItems(items).every(item => !bottom.includes(item))).toBe(true);
    expect(moreNavItems(items)).toContainEqual(expect.objectContaining({ id: 'profile' }));
    expect([...bottom, ...moreNavItems(items)]).toHaveLength(items.length);
    expect(items.filter(item => !item.mobileOnly).some(item => item.id === 'more')).toBe(false);
  });

  test.each<[Role, string, string]>([
    ['client', '/client/home', 'home'],
    ['client', '/client/request/location', 'request'],
    ['client', '/client/request/review', 'request'],
    ['client', '/client/requests/saved-id', 'history'],
    ['client', '/client/messages/chat', 'messages'],
    ['client', '/client/reviews', 'more'],
    ['client', '/client/care/screen', 'more'],
    ['client', '/client/profile', 'more'],
    ['technician', '/technician/profile', 'more'],
    ['technician', '/technician/reviews', 'more'],
    ['technician', '/technician/messages/chat', 'messages'],
    ['admin', '/admin/applications', 'more'],
    ['admin', '/admin/profile', 'more'],
    ['admin', '/admin/reports', 'reports'],
    ['admin', '/admin/more', 'more'],
  ])('highlights %s %s under %s', (role, path, expected) => {
    expect(activeMobileNavItem(navConfig[role], path)?.id).toBe(expected);
  });

  test('does not match an unrelated route or a partial path segment', () => {
    expect(activeMobileNavItem(navConfig.client, '/client/requested')).toBeUndefined();
    expect(activeMobileNavItem(navConfig.admin, '/client/home')).toBeUndefined();
  });
});

describe('responsive menu components', () => {
  test('renders only five mobile links, labels the navigation, and tracks nested active routes', async () => {
    wrapper = mount(FxTabBar, { props: { items: navConfig.admin } });
    expect(wrapper.get('nav').attributes('aria-label')).toBe('Main navigation');
    expect(wrapper.findAll('a')).toHaveLength(5);
    expect(wrapper.text()).toContain('Overview');
    expect(wrapper.text()).not.toContain('Applications');
    expect(wrapper.get('[data-nav-id="dashboard"]').attributes('aria-current')).toBe('page');
    navigation.route.path = '/admin/applications';
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-nav-id="more"]').attributes('aria-current')).toBe('page');
    expect(wrapper.get('[data-nav-id="dashboard"]').attributes('aria-current')).toBeUndefined();
    expect(wrapper.get('.fx-tab--active').attributes('data-nav-id')).toBe('more');
  });

  test.each<Role>(['client', 'technician', 'admin'])('shows every %s secondary tool as a keyboard-accessible More link', async role => {
    wrapper = mount(MorePage, { props: { role }, global: { stubs: { ScreenHeader: true } } });
    const links = wrapper.findAll('a.tile');
    expect(links.map(link => link.attributes('href'))).toEqual(moreNavItems(navConfig[role]).map(item => item.route));
    await links[0].trigger('click');
    expect(navigation.push).toHaveBeenCalledWith(moreNavItems(navConfig[role])[0].route);
    expect(links.every(link => !link.attributes('href')?.endsWith('/more'))).toBe(true);
  });
});
