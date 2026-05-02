import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Base URL ──────────────────────────────────────────────────────────────────
// Android emulator: use 10.0.2.2  |  iOS simulator / Expo Go: use your machine IP
// Example: 'http://192.168.1.5:8000/api'
export const BASE_URL = 'http://192.168.1.202:8000/api';

// ── Token helpers ─────────────────────────────────────────────────────────────
const KEYS = { access: '@zabroad_access', refresh: '@zabroad_refresh' };

export async function saveTokens(access, refresh) {
  await AsyncStorage.multiSet([[KEYS.access, access], [KEYS.refresh, refresh]]);
}

export async function getAccessToken() {
  return AsyncStorage.getItem(KEYS.access);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([KEYS.access, KEYS.refresh]);
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(endpoint, options = {}) {
  const token = await getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    // Return error detail from Django
    const message = data.detail || Object.values(data)[0]?.[0] || 'Something went wrong';
    throw new Error(message);
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  register: (body) => request('/auth/register/', { method: 'POST', body }),
  login:    (body) => request('/auth/login/',    { method: 'POST', body }),
  me:       ()     => request('/auth/me/'),
  updateMe: (body) => request('/auth/me/', { method: 'PATCH', body }),
};

// ── Posts / Feed ──────────────────────────────────────────────────────────────
export const posts = {
  // scope: 'country' (my community) | 'local' | 'global' (all)
  list:    (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/posts/${qs ? '?' + qs : ''}`);
  },
  get:     (id)   => request(`/posts/${id}/`),
  create:  (body) => request('/posts/', { method: 'POST', body }),
  delete:  (id)   => request(`/posts/${id}/`, { method: 'DELETE' }),
  like:    (id)   => request(`/posts/${id}/like/`, { method: 'POST' }),
  comments: {
    list:   (postId)       => request(`/posts/${postId}/comments/`),
    create: (postId, body) => request(`/posts/${postId}/comments/`, { method: 'POST', body }),
  },
};

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const jobs = {
  list:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/jobs/${qs ? '?' + qs : ''}`);
  },
  get:    (id)   => request(`/jobs/${id}/`),
  create: (body) => request('/jobs/', { method: 'POST', body }),
  update: (id, body) => request(`/jobs/${id}/`, { method: 'PATCH', body }),
  delete: (id)   => request(`/jobs/${id}/`, { method: 'DELETE' }),
};

// ── Housing ───────────────────────────────────────────────────────────────────
export const housing = {
  list:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/housing/${qs ? '?' + qs : ''}`);
  },
  get:    (id)   => request(`/housing/${id}/`),
  create: (body) => request('/housing/', { method: 'POST', body }),
  update: (id, body) => request(`/housing/${id}/`, { method: 'PATCH', body }),
  delete: (id)   => request(`/housing/${id}/`, { method: 'DELETE' }),
};

// ── Doctors ───────────────────────────────────────────────────────────────────
export const doctors = {
  list:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/doctors/${qs ? '?' + qs : ''}`);
  },
  get:    (id)   => request(`/doctors/${id}/`),
  create: (body) => request('/doctors/', { method: 'POST', body }),
  update: (id, body) => request(`/doctors/${id}/`, { method: 'PATCH', body }),
};

// ── Attorneys ─────────────────────────────────────────────────────────────────
export const attorneys = {
  list:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/attorneys/${qs ? '?' + qs : ''}`);
  },
  get:    (id)   => request(`/attorneys/${id}/`),
  create: (body) => request('/attorneys/', { method: 'POST', body }),
  update: (id, body) => request(`/attorneys/${id}/`, { method: 'PATCH', body }),
};

// ── Events ────────────────────────────────────────────────────────────────────
export const events = {
  list:   (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/events/${qs ? '?' + qs : ''}`);
  },
  get:    (id)   => request(`/events/${id}/`),
  create: (body) => request('/events/', { method: 'POST', body }),
  rsvp:   (id)   => request(`/events/${id}/rsvp/`, { method: 'POST' }),
};
