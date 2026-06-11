import { create } from 'zustand';
import {
  loginAdmin as apiLoginAdmin,
  loginPlayer as apiLoginPlayer,
  setAdminToken,
  setPlayerToken,
} from '../network/api';

export type AuthRole = 'player' | 'admin';

const PLAYER_TOKEN_KEY = 'spiny-player-token';
const ADMIN_TOKEN_KEY = 'spiny-admin-token';
const AUTH_ROLE_KEY = 'spiny-auth-role';
const AUTH_EMAIL_KEY = 'spiny-auth-email';

interface AuthState {
  role: AuthRole | null;
  email: string | null;
  isHydrated: boolean;
  loginPlayer: (email: string, password: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  email: null,
  isHydrated: false,

  hydrate: () => {
    const role = sessionStorage.getItem(AUTH_ROLE_KEY) as AuthRole | null;
    const email = sessionStorage.getItem(AUTH_EMAIL_KEY);
    const playerToken = sessionStorage.getItem(PLAYER_TOKEN_KEY);
    const adminToken = sessionStorage.getItem(ADMIN_TOKEN_KEY);

    if (role === 'player' && playerToken) {
      setPlayerToken(playerToken);
      set({ role: 'player', email, isHydrated: true });
      return;
    }

    if (role === 'admin' && adminToken) {
      setAdminToken(adminToken);
      set({ role: 'admin', email, isHydrated: true });
      return;
    }

    set({ role: null, email: null, isHydrated: true });
  },

  loginPlayer: async (email, password) => {
    const response = await apiLoginPlayer(email, password);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.setItem(PLAYER_TOKEN_KEY, response.accessToken);
    sessionStorage.setItem(AUTH_ROLE_KEY, 'player');
    sessionStorage.setItem(AUTH_EMAIL_KEY, email);
    setAdminToken(null);
    setPlayerToken(response.accessToken);
    set({ role: 'player', email });
  },

  loginAdmin: async (email, password) => {
    const response = await apiLoginAdmin(email, password);
    sessionStorage.removeItem(PLAYER_TOKEN_KEY);
    sessionStorage.setItem(ADMIN_TOKEN_KEY, response.accessToken);
    sessionStorage.setItem(AUTH_ROLE_KEY, 'admin');
    sessionStorage.setItem(AUTH_EMAIL_KEY, email);
    setPlayerToken(null);
    setAdminToken(response.accessToken);
    set({ role: 'admin', email });
  },

  logout: () => {
    sessionStorage.removeItem(PLAYER_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_ROLE_KEY);
    sessionStorage.removeItem(AUTH_EMAIL_KEY);
    setPlayerToken(null);
    setAdminToken(null);
    set({ role: null, email: null });
  },
}));
