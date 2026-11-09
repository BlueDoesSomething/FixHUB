import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import { initializeAuth } from './stores/auth';
import { installNativeAuthLinks } from './services/authRedirect';

import { IonicVue } from '@ionic/vue';
import { createIcons, icons } from 'lucide';

/* Tailwind base (before Ionic so Ionic resets win) */
import './assets/css/tailwind-base.css';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import './theme/fixhub.css';
import './assets/css/main.css';

/* App design system (client / technician / admin dashboards) */
import './assets/css/app.css';

/* Tailwind components + utilities (last so they win over Ionic/custom) */
import './assets/css/tailwind-utilities.css';

/* Expose lucide globally so components can call lucide.createIcons() */
(globalThis as Record<string, unknown>).lucide = {
  createIcons: (options: Record<string, unknown> = {}) => createIcons({ icons, ...options }),
};

const app = createApp(App)
  .use(IonicVue)
  .use(router);

router.isReady().then(async () => {
  // Restore any existing Supabase session before mounting.
  await initializeAuth();
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  app.mount('#app');
  void installNativeAuthLinks(path => router.replace(path)).catch(() => {
    void router.replace('/auth/callback?error=link_unavailable');
  });
});
