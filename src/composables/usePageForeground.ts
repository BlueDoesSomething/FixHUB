import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';

/** Ionic keeps inactive pages mounted; document visibility alone is not enough. */
export function usePageForeground(active: () => boolean) {
  const visible = ref(typeof document === 'undefined' || document.visibilityState !== 'hidden');
  const nativeActive = ref(true);
  let disposed = false;
  let listener: PluginListenerHandle | undefined;
  const update = () => { visible.value = document.visibilityState !== 'hidden'; };
  onMounted(() => {
    document.addEventListener('visibilitychange', update);
    update();
    if (Capacitor.isNativePlatform()) {
      void App.addListener('appStateChange', state => { nativeActive.value = state.isActive; }).then(handle => {
        if (disposed) void handle.remove();
        else listener = handle;
      });
      void App.getState().then(state => { if (!disposed) nativeActive.value = state.isActive; });
    }
  });
  onBeforeUnmount(() => {
    disposed = true;
    document.removeEventListener('visibilitychange', update);
    void listener?.remove();
  });
  return computed(() => active() && visible.value && nativeActive.value);
}
