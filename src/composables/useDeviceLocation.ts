import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { watchCurrentLocation, type LocatedPoint } from '../services/geolocation';
import { usePageForeground } from './usePageForeground';

export function useDeviceLocation(active: () => boolean, autoLocate: boolean, onPoint: (point: LocatedPoint) => void) {
  const foreground = usePageForeground(active);
  const following = ref(autoLocate);
  const running = ref(false);
  const point = ref<LocatedPoint | null>(null);
  const error = ref('');
  let dispose: (() => void) | undefined;
  let generation = 0;
  function suspend() {
    generation += 1;
    dispose?.();
    dispose = undefined;
    running.value = false;
  }
  function begin() {
    suspend();
    if (!foreground.value || !following.value) return;
    const current = generation;
    error.value = '';
    running.value = true;
    const cleanup = watchCurrentLocation(value => {
      if (current !== generation) return;
      point.value = value;
      onPoint(value);
    }, cause => {
      if (current !== generation) return;
      error.value = cause.message;
      following.value = false;
      suspend();
    });
    if (current !== generation) cleanup();
    else dispose = cleanup;
  }
  function stop() { following.value = false; error.value = ''; suspend(); }
  function start() {
    error.value = '';
    if (following.value) begin();
    else following.value = true;
  }
  watch(() => foreground.value && following.value, enabled => { if (enabled) begin(); else suspend(); }, { immediate: true, flush: 'sync' });
  onBeforeUnmount(suspend);
  return { point, following, running, error, locating: computed(() => running.value && !point.value), start, stop };
}
