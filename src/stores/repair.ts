import { reactive } from 'vue';

export type ServiceType = 'home' | 'dropoff';

export interface RepairDraft {
  device: string;
  brand: string;
  model: string;
  problem: string;
  photo: string | null;
  serviceType: ServiceType;
  location: string;
}

const state = reactive<RepairDraft>({
  device: 'Smartphone',
  brand: 'Apple',
  model: 'iPhone 13',
  problem: 'Phone is not charging.',
  photo: null,
  serviceType: 'home',
  location: '123 Mabini Street, Makati City',
});

export function useRepairDraft() {
  function reset() {
    state.device = 'Smartphone';
    state.brand = 'Apple';
    state.model = 'iPhone 13';
    state.problem = '';
    state.photo = null;
    state.serviceType = 'home';
    state.location = '';
  }

  return { draft: state, reset };
}
