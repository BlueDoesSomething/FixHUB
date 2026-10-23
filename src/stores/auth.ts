import { reactive } from 'vue';

export type Role = 'client' | 'technician' | 'admin';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  initials: string;
  color: string;
  homeRoute: string;
}

export const profiles: Record<Role, UserProfile> = {
  client: {
    name: 'Alex Rivera',
    email: 'alex.rivera@email.com',
    phone: '+63 917 123 4567',
    initials: 'AR',
    color: 'linear-gradient(135deg, #146344, #1b7a54)',
    homeRoute: '/client/home',
  },
  technician: {
    name: 'Juan Dela Cruz',
    email: 'juan.dela@fixhub.com',
    phone: '+63 918 765 4321',
    initials: 'JD',
    color: 'linear-gradient(135deg, #0f4a32, #16a34a)',
    homeRoute: '/technician/dashboard',
  },
  admin: {
    name: 'Admin User',
    email: 'admin@fixhub.com',
    phone: '+63 919 000 0000',
    initials: 'AD',
    color: 'linear-gradient(135deg, #12211a, #146344)',
    homeRoute: '/admin/dashboard',
  },
};

interface AuthState {
  role: Role;
  isAuthenticated: boolean;
}

const state = reactive<AuthState>({
  role: 'client',
  isAuthenticated: false,
});

export function useAuth() {
  function login(role: Role = state.role) {
    state.role = role;
    state.isAuthenticated = true;
  }

  function logout() {
    state.isAuthenticated = false;
  }

  function switchRole(role: Role) {
    state.role = role;
  }

  return {
    state,
    login,
    logout,
    switchRole,
    profile: () => profiles[state.role],
  };
}
