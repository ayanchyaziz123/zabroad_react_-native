import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { useLocationStore } from './locationStore';

function normalize(a) {
  return {
    id:          String(a.id),
    name:        a.name,
    firm:        a.firm         || '',
    location:    a.location,
    languages:   a.languages    || '',
    specialty:   a.specialty    || '',
    price:       a.price        || '',
    desc:        a.description  || '',
    plan:        a.plan,
    poster:      a.poster,
    initials:    (a.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    communities: a.home_country ? [a.home_country] : [],
    countryFlag: a.country_flag || '🌍',
    postedFrom:  a.posted_from  || '',
    featured:    a.is_featured,
    time:        timeAgo(a.created_at),
  };
}

function timeAgo(isoString) {
  if (!isoString) return 'Just now';
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const useAttorneyStore = create((set) => ({
  attorneys: [],
  loading:   false,
  error:     null,

  fetchAttorneys: async () => {
    set({ loading: true, error: null });
    try {
      const api      = useAuthStore.getState().api;
      const nearCity = useLocationStore.getState().nearCityParam();
      const url      = nearCity ? `/attorneys/?${nearCity}` : '/attorneys/';
      const data     = await api(url);
      const list     = Array.isArray(data) ? data : (data.results ?? []);
      set({ attorneys: list.map(normalize), loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  addAttorney: async (formData) => {
    const api  = useAuthStore.getState().api;
    const data = await api('/attorneys/', {
      method: 'POST',
      body: {
        name:         formData.name,
        firm:         formData.firm,
        location:     formData.location,
        languages:    formData.languages,
        specialty:    formData.specialty,
        price:        formData.price,
        description:  formData.desc,
        plan:         formData.plan,
        home_country: formData.homeCountry,
        country_flag: formData.countryFlag,
        posted_from:  formData.postedFrom,
      },
    });
    set(state => ({ attorneys: [normalize(data), ...state.attorneys] }));
    return data;
  },
}));
