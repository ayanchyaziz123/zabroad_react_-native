import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { useLocationStore } from './locationStore';

function normalize(l) {
  return {
    id:          String(l.id),
    title:       l.title,
    price:       l.price,
    location:    l.location,
    desc:        l.description,
    plan:        l.plan,
    poster:      l.poster,
    initials:    (l.poster || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    postedFrom:  l.posted_from  || '',
    communities: l.home_country ? [l.home_country] : [],
    countryFlag: l.country_flag || '🌍',
    featured:    l.is_featured,
    time:        timeAgo(l.created_at),
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

export const useHousingStore = create((set, get) => ({
  listings: [],
  loading:  false,
  error:    null,

  fetchListings: async () => {
    set({ loading: true, error: null });
    try {
      const api    = useAuthStore.getState().api;
      const loc    = useLocationStore.getState();
      const params = loc.coordsParam() || loc.nearCityParam();
      const url    = params ? `/housing/?${params}` : '/housing/';
      const data   = await api(url);
      const list   = Array.isArray(data) ? data : (data.results ?? []);
      set({ listings: list.map(normalize), loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  addListing: async (listingData) => {
    const api  = useAuthStore.getState().api;
    const data = await api('/housing/', {
      method: 'POST',
      body: {
        title:        listingData.title,
        price:        listingData.price,
        location:     listingData.location,
        latitude:     listingData.latitude  ?? null,
        longitude:    listingData.longitude ?? null,
        description:  listingData.desc,
        plan:         listingData.plan,
        home_country: listingData.homeCountry,
        country_flag: listingData.countryFlag,
        posted_from:  listingData.postedFrom,
      },
    });
    set(state => ({ listings: [normalize(data), ...state.listings] }));
    return data;
  },
}));
