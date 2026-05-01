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

// ── Raw fetch — returns { ok, status, data } without throwing ─────────────────
async function fetchJSON(endpoint, options = {}, token = null) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body: isFormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

function extractError(data) {
  return (
    data?.detail ||
    data?.non_field_errors?.[0] ||
    (data ? Object.values(data)[0]?.[0] : null) ||
    'Something went wrong'
  );
}

// ── Auth Store ────────────────────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  user:            null,   // { id, name, email, profile: { handle, avatar_emoji, home_country, country_flag, lives_in, visa_status, bio } }
  accessToken:     null,
  isAuthenticated: false,
  isLoading:       true,   // true while restoring session on app launch
  error:           null,

  // ── Authenticated request with automatic token refresh ────────────────────
  api: async (endpoint, options = {}) => {
    const { accessToken } = get();

    let { ok, status, data } = await fetchJSON(endpoint, options, accessToken);

    if (status === 401) {
      // Access token expired — try to silently refresh
      const { refresh } = await loadTokens();
      if (!refresh) {
        await deleteTokens();
        set({ user: null, accessToken: null, isAuthenticated: false });
        throw new Error('Session expired. Please log in again.');
      }
      const refreshResult = await fetchJSON('/auth/token/refresh/', {
        method: 'POST',
        body: { refresh },
      });
      if (!refreshResult.ok) {
        await deleteTokens();
        set({ user: null, accessToken: null, isAuthenticated: false });
        throw new Error('Session expired. Please log in again.');
      }
      const newAccess  = refreshResult.data.access;
      const newRefresh = refreshResult.data.refresh || refresh; // server rotates token when ROTATE_REFRESH_TOKENS=True
      await saveTokens(newAccess, newRefresh);
      set({ accessToken: newAccess });
      // Retry the original request with the new token
      ({ ok, data } = await fetchJSON(endpoint, options, newAccess));
    }

    if (!ok) throw new Error(extractError(data));
    return data;
  },

  // ── Restore session on app launch ──────────────────────────────────────────
  restoreSession: async () => {
    try {
      const { access, refresh } = await loadTokens();
      if (!access) {
        set({ isLoading: false });
        return;
      }

      let { ok, status, data } = await fetchJSON('/auth/me/', {}, access);

      // Access token expired — try refresh before giving up
      if (status === 401 && refresh) {
        const refreshResult = await fetchJSON('/auth/token/refresh/', {
          method: 'POST',
          body: { refresh },
        });
        if (refreshResult.ok) {
          const newAccess  = refreshResult.data.access;
          const newRefresh = refreshResult.data.refresh || refresh;
          await saveTokens(newAccess, newRefresh);
          ({ ok, data } = await fetchJSON('/auth/me/', {}, newAccess));
          if (ok) {
            set({ user: data, accessToken: newAccess, isAuthenticated: true, isLoading: false });
            return;
          }
        }
      }

      if (ok) {
        set({ user: data, accessToken: access, isAuthenticated: true, isLoading: false });
      } else {
        await deleteTokens();
        set({ isLoading: false });
      }
    } catch {
      await deleteTokens();
      set({ isLoading: false });
    }
  },

  // ── Register ───────────────────────────────────────────────────────────────
  register: async ({ firstName, lastName, email, password, handle, homeCountry, countryFlag, livesIn, visaStatus }) => {
    set({ error: null });
    try {
      const { ok, data } = await fetchJSON('/auth/register/', {
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
      if (!ok) throw new Error(extractError(data));
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
      // Django SimpleJWT expects username field — we send email as username
      const { ok: loginOk, data: loginData } = await fetchJSON('/auth/login/', {
        method: 'POST',
        body: { username: email, password },
      });
      if (!loginOk) throw new Error(extractError(loginData));
      await saveTokens(loginData.access, loginData.refresh);

      // Fetch full user profile
      const { ok: meOk, data: meData } = await fetchJSON('/auth/me/', {}, loginData.access);
      if (!meOk) throw new Error('Failed to load profile');
      set({ user: meData, accessToken: loginData.access, isAuthenticated: true });
      return meData;
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  // ── Logout ─────────────────────────────────────────────────────────────────
  logout: async () => {
    const { accessToken } = get();
    try {
      const { refresh } = await loadTokens();
      if (refresh) {
        await fetchJSON('/auth/logout/', { method: 'POST', body: { refresh } }, accessToken);
      }
    } catch {
      // Ignore — clear locally regardless
    }
    await deleteTokens();
    set({ user: null, accessToken: null, isAuthenticated: false, error: null });
  },

  // ── Update profile ─────────────────────────────────────────────────────────
  updateProfile: async (fields) => {
    set({ error: null });
    try {
      const user = await get().api('/auth/me/', { method: 'PATCH', body: fields });
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
