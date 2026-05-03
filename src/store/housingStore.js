import { create } from 'zustand';
import { useAuthStore } from './authStore';
import { useLocationStore } from './locationStore';

function timeAgo(isoString) {
  if (!isoString) return 'Just now';
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function normalize(l) {
  return {
    id:          String(l.id),
    title:       l.title,
    price:       l.price,
    location:    l.location,
    desc:        l.description,
    plan:        l.plan,
    poster:      l.poster,
    poster_id:   l.poster_id ?? null,
    initials:    (l.poster || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    postedFrom:  l.posted_from  || '',
    communities: l.home_country ? [l.home_country] : [],
    countryFlag: l.country_flag || '',
    featured:    l.is_featured,
    image_url:   l.image_url || null,
    time:        timeAgo(l.created_at),
  };
}

export const useHousingStore = create((set, get) => ({
  listings: [],
  loading:  false,
  error:    null,

  fetchListings: async ({ scope = 'all', search = '', homeCountry = '' } = {}) => {
    set({ loading: true, error: null });
    try {
      const api    = useAuthStore.getState().api;
      const loc    = useLocationStore.getState();
      const params = new URLSearchParams();

      if (scope === 'community' && homeCountry) {
        params.append('community', homeCountry);
      } else if (scope === 'nearby') {
        if (loc.latitude  != null) params.append('lat', loc.latitude);
        if (loc.longitude != null) params.append('lng', loc.longitude);
      }
      if (search.trim()) params.append('search', search.trim());

      const query = params.toString();
      const url   = `/housing/${query ? '?' + query : ''}`;
      const data  = await api(url);
      const list  = Array.isArray(data) ? data : (data.results ?? []);
      set({ listings: list.map(normalize), loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  addListing: async (listingData) => {
    const api = useAuthStore.getState().api;
    const fd  = new FormData();
    fd.append('title',        listingData.title);
    fd.append('price',        listingData.price);
    fd.append('location',     listingData.location);
    fd.append('description',  listingData.desc);
    fd.append('plan',         listingData.plan);
    fd.append('home_country', listingData.homeCountry || '');
    fd.append('country_flag', listingData.countryFlag || '');
    fd.append('posted_from',  listingData.postedFrom  || '');
    if (listingData.latitude  != null) fd.append('latitude',  parseFloat(Number(listingData.latitude).toFixed(6)));
    if (listingData.longitude != null) fd.append('longitude', parseFloat(Number(listingData.longitude).toFixed(6)));
    if (listingData.image) {
      const ext  = listingData.image.uri.split('.').pop();
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      fd.append('image', { uri: listingData.image.uri, name: `housing.${ext}`, type: mime });
    }
    const data = await api('/housing/', { method: 'POST', body: fd });
    set(state => ({ listings: [normalize(data), ...state.listings] }));
    return data;
  },

  deleteListing: async (id) => {
    const api = useAuthStore.getState().api;
    await api(`/housing/${id}/`, { method: 'DELETE' });
    set(state => ({ listings: state.listings.filter(l => l.id !== String(id)) }));
  },
}));
