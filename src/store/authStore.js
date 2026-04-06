import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://127.0.0.1:8000/api';
// On a physical device or Android emulator change to your machine's local IP:
// const BASE_URL = 'http://192.168.1.x:8000/api';

// ── Token helpers ─────────────────────────────────────────────────────────────
async function saveTokens(access, refresh) {
  await SecureStore.setItemAsync('access_token',  access);
  await SecureStore.setItemAsync('refresh_token', refresh);
}

async function loadTokens() {
  const access  = await SecureStore.getItemAsync('access_token');
  const refresh = await SecureStore.getItemAsync('refresh_token');
  return { access, refresh };
}

async function deleteTokens() {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
}

// ── Core request ──────────────────────────────────────────────────────────────
async function request(endpoint, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res  = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    const message =
      data.detail ||
      data.non_field_errors?.[0] ||
      Object.values(data)[0]?.[0] ||
      'Something went wrong';
    throw new Error(message);
  }
  return data;
}

// ── Auth Store ────────────────────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  user:          null,   // { id, name, email, profile: { handle, avatar_emoji, home_country, country_flag, lives_in, visa_status, bio } }
  accessToken:   null,
  isAuthenticated: false,
  isLoading:     true,   // true while restoring session on app launch
  error:         null,

  // ── Restore session on app launch ──────────────────────────────────────────
  restoreSession: async () => {
    try {
      const { access, refresh } = await loadTokens();
      if (!access) {
        set({ isLoading: false });
        return;
      }
      // Verify token by fetching /me
      const user = await request('/auth/me/', {}, access);
      set({ user, accessToken: access, isAuthenticated: true, isLoading: false });
    } catch {
      // Token expired or invalid — clear and go to login
      await deleteTokens();
      set({ isLoading: false });
    }
  },

  // ── Register (step 1 of onboarding — only name/email/password) ─────────────
  // Full profile fields (handle, home_country etc.) are sent from AllDoneScreen
  register: async ({ firstName, lastName, email, password, handle, homeCountry, countryFlag, livesIn, visaStatus }) => {
    set({ error: null });
    try {
      const data = await request('/auth/register/', {
        method: 'POST',
        body: {
          first_name:   firstName,
          last_name:    lastName,
          email,
          password,
          handle,
          home_country: homeCountry,
          country_flag: countryFlag,
          lives_in:     livesIn,
          visa_status:  visaStatus,
        },
      });
      await saveTokens(data.access, data.refresh);
      set({ user: data.user, accessToken: data.access, isAuthenticated: true });
      return data.user;
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  // ── Login ──────────────────────────────────────────────────────────────────
  login: async ({ email, password }) => {
    set({ error: null });
    try {
      // Django SimpleJWT login uses username field — we use email as username
      const data = await request('/auth/login/', {
        method: 'POST',
        body: { username: email, password },
      });
      await saveTokens(data.access, data.refresh);
      // Fetch full user profile
      const user = await request('/auth/me/', {}, data.access);
      set({ user, accessToken: data.access, isAuthenticated: true });
      return user;
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  // ── Logout ─────────────────────────────────────────────────────────────────
  logout: async () => {
    const { accessToken } = get();
    try {
      const refresh = await SecureStore.getItemAsync('refresh_token');
      if (refresh) {
        await request('/auth/logout/', { method: 'POST', body: { refresh } }, accessToken);
      }
    } catch {
      // Ignore — clear locally regardless
    }
    await deleteTokens();
    set({ user: null, accessToken: null, isAuthenticated: false, error: null });
  },

  // ── Update profile ─────────────────────────────────────────────────────────
  updateProfile: async (fields) => {
    const { accessToken } = get();
    set({ error: null });
    try {
      const user = await request('/auth/me/', { method: 'PATCH', body: fields }, accessToken);
      set({ user });
      return user;
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  // ── Update user locally (no API call) — for onboarding steps ───────────────
  setUserLocal: (fields) => {
    set(state => ({ user: state.user ? { ...state.user, ...fields } : fields }));
  },

  clearError: () => set({ error: null }),
}));
