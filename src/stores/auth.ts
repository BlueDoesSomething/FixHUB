import { reactive } from 'vue';
import { loadSession, onAuthChange, supabaseSignIn, supabaseSignOut, supabaseSignUp, type AuthSession } from '../services/supabaseAuth';

export type Role = 'client' | 'technician' | 'admin';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  initials: string;
  color: string;
  homeRoute: string;
}

const rolePresentation: Record<Role, Pick<UserProfile, 'color' | 'homeRoute'>> = {
  client: {
    color: 'linear-gradient(135deg, #146344, #1b7a54)',
    homeRoute: '/client/home',
  },
  technician: {
    color: 'linear-gradient(135deg, #0f4a32, #16a34a)',
    homeRoute: '/technician/dashboard',
  },
  admin: {
    color: 'linear-gradient(135deg, #12211a, #146344)',
    homeRoute: '/admin/dashboard',
  },
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function homeRouteForRole(role: Role): string {
  return rolePresentation[role].homeRoute;
}

function profileFromSession(session: AuthSession): UserProfile {
  const role = session.account.role;
  return {
    name: session.account.full_name,
    email: session.email,
    phone: session.account.phone,
    initials: initialsFromName(session.account.full_name),
    color: rolePresentation[role].color,
    homeRoute: homeRouteForRole(role),
  };
}

interface AuthState {
  role: Role;
  isAuthenticated: boolean;
  loading: boolean;
  error: string;
  session: AuthSession | null;
}

const state = reactive<AuthState>({
  role: 'client',
  isAuthenticated: false,
  loading: true,
  error: '',
  session: null,
});

// Try to restore an existing Supabase session on app load.
let initialization: Promise<void> | undefined;
function initialize(): Promise<void> {
  if (!initialization) initialization = restoreSession();
  return initialization;
}

async function restoreSession() {
  if (!supabaseConfigured) {
    state.error = 'Sign-in is unavailable. Configure the Supabase connection.';
    state.loading = false;
    return;
  }
  try {
    const session = await loadSession();
    if (session) {
      state.session = session;
      state.role = session.account.role;
      state.isAuthenticated = true;
    }
  } catch {
    // Not signed in — stay in unauthenticated state.
  } finally {
    state.loading = false;
  }
}

// Listen for auth state changes (sign in, sign out, token refresh).
// Missing configuration must never grant access to a protected account.
const supabaseConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
if (supabaseConfigured) {
  onAuthChange((session) => {
    state.loading = false;
    if (session) {
      state.session = session;
      state.role = session.account.role;
      state.isAuthenticated = true;
      state.error = '';
    } else {
      state.session = null;
      state.isAuthenticated = false;
      state.role = 'client';
    }
  });
} else {
  state.loading = false;
}

// Expose init so the app entry point can trigger session restoration.
export { initialize as initializeAuth };

export function useAuth() {
  async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
    state.error = '';
    state.loading = true;
    try {
      const session = await supabaseSignIn(email, password);
      state.session = session;
      state.role = session.account.role;
      state.isAuthenticated = true;
      return profileFromSession(session);
    } catch (err) {
      state.error = err instanceof Error ? err.message : 'Sign-in failed.';
      state.loading = false;
      throw err;
    } finally {
      state.loading = false;
    }
  }

  async function signUp(name: string, email: string, password: string): Promise<void> {
    state.error = '';
    state.loading = true;
    try {
      await supabaseSignUp(name, email, password);
    } catch (err) {
      state.error = err instanceof Error ? err.message : 'Sign-up failed.';
      state.loading = false;
      throw err;
    } finally {
      state.loading = false;
    }
  }

  async function logout(): Promise<void> {
    if (state.session) {
      try { await supabaseSignOut(); } catch { /* session cleared below regardless */ }
    }
    state.session = null;
    state.isAuthenticated = false;
    state.role = 'client';
  }

  function profile(): UserProfile {
    if (state.session) return profileFromSession(state.session);
    return { name: '', email: '', phone: '', initials: '?', color: rolePresentation.client.color, homeRoute: '/' };
  }

  async function refreshSession() {
    const session = await loadSession();
    state.session = session;
    state.isAuthenticated = !!session;
    state.role = session?.account.role ?? 'client';
    return session;
  }

  return {
    state,
    loginWithEmail,
    signUp,
    logout,
    refreshSession,
    profile,
  };
}
