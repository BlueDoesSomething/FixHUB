import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useAuth } from '../stores/auth';
import { listLocatedTechnicians, subscribeToTechnicianLocations, type LocatedTechnician } from '../services/technicianLocations';
import { usePageForeground } from './usePageForeground';
import { LocationSetupError } from '../services/locationErrors';

export function useTechnicianDirectory(active: () => boolean) {
  const { state: auth } = useAuth();
  const foreground = usePageForeground(active);
  const userId = computed(() => auth.session?.userId);
  const technicians = ref<LocatedTechnician[]>([]);
  const loading = ref(false);
  const error = ref('');
  const connected = ref(false);
  const setupRequired = ref(false);
  const now = ref(Date.now());
  let epoch = 0;
  let pending = false;
  let unsubscribe: (() => void) | undefined;
  let poll: ReturnType<typeof setInterval> | undefined;
  async function refresh(manual = true) {
    if (!foreground.value || !userId.value) return;
    if (setupRequired.value && !manual) return;
    if (loading.value) { pending = true; return; }
    const current = epoch;
    loading.value = true;
    try {
      const data = await listLocatedTechnicians();
      if (current !== epoch) return;
      technicians.value = data;
      now.value = Date.now();
      error.value = '';
      const wasPaused = setupRequired.value;
      setupRequired.value = false;
      if (wasPaused) connect(current);
    } catch (cause) {
      if (current !== epoch) return;
      // Do not leave stale/hidden technicians visible after a failed refresh.
      technicians.value = [];
      error.value = cause instanceof Error ? cause.message : 'Technician locations could not be loaded.';
      if (cause instanceof LocationSetupError) {
        setupRequired.value = true;
        pending = false;
        disconnect();
      }
    } finally {
      if (current === epoch) {
        loading.value = false;
        if (pending) { pending = false; void refresh(false); }
      }
    }
  }
  function disconnect() {
    unsubscribe?.();
    unsubscribe = undefined;
    clearInterval(poll);
    poll = undefined;
    connected.value = false;
  }
  function stop() {
    epoch += 1;
    disconnect();
    loading.value = false;
    pending = false;
    technicians.value = [];
  }
  function connect(current: number) {
    if (unsubscribe || poll || current !== epoch) return;
    try {
      unsubscribe = subscribeToTechnicianLocations(() => { if (current === epoch) void refresh(false); }, value => { if (current === epoch) connected.value = value; });
    } catch { connected.value = false; }
    // Reconcile lost events, expiry, and deployments without Realtime enabled.
    poll = setInterval(() => { now.value = Date.now(); void refresh(false); }, 15000);
  }
  watch(() => [foreground.value, userId.value] as const, (_value, previous) => {
    stop();
    if (userId.value !== previous?.[1]) setupRequired.value = false;
    if (!setupRequired.value) error.value = '';
    if (!foreground.value || !userId.value || setupRequired.value) return;
    connect(epoch);
    void refresh(false);
  }, { immediate: true, flush: 'sync' });
  onBeforeUnmount(stop);
  return { technicians, loading, error, connected, setupRequired, now, refresh };
}
