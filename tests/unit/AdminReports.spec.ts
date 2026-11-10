import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import AdminReportsPage from '@/views/admin/AdminReportsPage.vue';
import DonutChart from '@/components/DonutChart.vue';
import BarChart from '@/components/BarChart.vue';
import { reportRepairs } from './fixtures/reports';

vi.mock('@ionic/vue', () => ({ IonPage: { template: '<div><slot /></div>' }, IonContent: { template: '<div><slot /></div>' } }));
vi.mock('@/services/adminAnalytics', () => ({ fetchReportRepairs: async () => reportRepairs }));
let wrapper: VueWrapper | undefined;
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-31T10:00:00+08:00')); });
afterEach(() => { wrapper?.unmount(); wrapper = undefined; vi.useRealTimers(); });
function render() {
  wrapper = mount(AdminReportsPage, { global: { stubs: { ScreenHeader: true } } });
  return wrapper;
}

describe('admin report filters', () => {
  test('starts with the current month and shows a labeled brand donut for supplied records', async () => {
    render();
    await flushPromises();
    expect(wrapper!.get('[data-period="month"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper!.get('[data-testid="report-range"]').text()).toContain('October 2026');
    expect(wrapper!.get('[data-testid="report-total"]').text()).toBe('21');
    expect(wrapper!.get('[data-testid="report-top-brand"]').text()).toContain('Apple · 7 repairs');
    expect(wrapper!.get('[data-testid="brand-donut"] svg').attributes('role')).toBe('img');
    expect(wrapper!.get('[data-testid="brand-donut"] desc').text()).toContain('21 completed repairs');
    expect(wrapper!.text()).not.toMatch(/demo|sample|illustrative/i);
  });

  test('updates totals, the donut, and service bars with every period selection', async () => {
    render();
    await flushPromises();
    for (const [period, count] of [['day', 4], ['week', 11], ['month', 21], ['year', 27]] as const) {
      await wrapper!.get(`[data-period="${period}"]`).trigger('click');
      await flushPromises();
      expect(wrapper!.get(`[data-period="${period}"]`).attributes('aria-pressed')).toBe('true');
      expect(wrapper!.findAll('[aria-pressed="true"]')).toHaveLength(1);
      expect(wrapper!.get('[data-testid="report-total"]').text()).toBe(String(count));
      expect(wrapper!.get('[data-testid="brand-donut"] .donut-chart__center strong').text()).toBe(String(count));
      const services = wrapper!.findComponent(BarChart).props('data');
      expect(services.reduce((sum: number, service: { value: number }) => sum + service.value, 0)).toBe(count);
    }
  });

  test('filters by the reference date and displays a single-brand period accurately', async () => {
    render();
    await wrapper!.get('#report-date').setValue('2025-12-31');
    await flushPromises();
    expect(wrapper!.get('[data-testid="report-total"]').text()).toBe('1');
    expect(wrapper!.get('[data-testid="report-range"]').text()).toContain('December 2025');
    expect(wrapper!.findAll('.donut-chart__segment')).toHaveLength(1);
    expect(wrapper!.get('.donut-chart__segment').attributes('stroke-dasharray')).toBe('100 0');
    expect(wrapper!.get('.donut-chart__legend').text()).toContain('100.0%');
  });

  test('shows zero totals and empty charts for a period with no completed repairs', async () => {
    render();
    await wrapper!.get('#report-date').setValue('2030-01-01');
    await flushPromises();
    expect(wrapper!.get('[data-testid="report-total"]').text()).toBe('0');
    expect(wrapper!.findAll('.donut-chart__segment')).toHaveLength(0);
    expect(wrapper!.findComponent(BarChart).exists()).toBe(false);
    expect(wrapper!.find('[data-testid="report-top-brand"]').exists()).toBe(false);
    expect(wrapper!.text()).toContain('No completed repairs in this period');
    expect(wrapper!.html()).not.toContain('NaN');
  });

  test('does not leave stale charts visible after the date is cleared', async () => {
    render();
    await wrapper!.get('#report-date').setValue('');
    expect(wrapper!.get('[role="alert"]').text()).toContain('valid date');
    expect(wrapper!.find('[data-testid="report-total"]').exists()).toBe(false);
    expect(wrapper!.findComponent(DonutChart).exists()).toBe(false);
    await wrapper!.get('#report-date').setValue('2026-10-31');
    await flushPromises();
    expect(wrapper!.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper!.get('[data-testid="report-total"]').text()).toBe('21');
  });
});

describe('donut chart', () => {
  test('shows sorted counts, accessible text, and contiguous proportional SVG arcs', () => {
    const segments = [{ label: 'Samsung', value: 1, color: '#2563eb' }, { label: 'Apple', value: 3, color: '#146344' }];
    wrapper = mount(DonutChart, { props: { label: 'Repairs by brand', segments } });
    const circles = wrapper.findAll('.donut-chart__segment');
    expect(circles).toHaveLength(2);
    expect(circles[0].attributes('stroke-dasharray')).toBe('75 25');
    expect(circles[1].attributes('stroke-dashoffset')).toBe('-75');
    expect(wrapper.findAll('[data-brand]').map(row => row.attributes('data-brand'))).toEqual(['Apple', 'Samsung']);
    expect(wrapper.get('svg > title').text()).toBe('Repairs by brand');
    expect(wrapper.get('desc').text()).toContain('Apple: 3 (75.0%)');
    expect(segments[0].label).toBe('Samsung');
  });

  test('does not render invalid, zero, or negative segments as repairs', () => {
    wrapper = mount(DonutChart, { props: { label: 'Empty chart', segments: [{ label: 'A', value: 0, color: '#000' }, { label: 'B', value: -1, color: '#000' }, { label: 'C', value: NaN, color: '#000' }] } });
    expect(wrapper.findAll('.donut-chart__segment')).toHaveLength(0);
    expect(wrapper.get('.donut-chart__center strong').text()).toBe('0');
    expect(wrapper.get('desc').text()).toContain('No completed repairs');
    expect(wrapper.html()).not.toContain('NaN');
  });
});
