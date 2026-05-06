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

function normalize(j) {
  return {
    id:          String(j.id),
    title:       j.title,
    company:     j.company,
    location:    j.location,
    desc:        j.description,
    plan:        j.plan,
    poster:      j.poster,
    poster_id:   j.poster_id ?? null,
    initials:    (j.poster || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    postedFrom:  j.posted_from || '',
    communities: j.home_country ? [j.home_country] : [],
    countryFlag: j.country_flag || '',
    hot:         j.is_hot,
    image_url:   j.image_url || null,
    category:    j.category  || 'other',
    posted:      timeAgo(j.created_at),
    lat:         j.latitude  ?? null,
    lng:         j.longitude ?? null,
  };
}

export const useJobsStore = create((set, get) => ({
  jobs:    [],
  loading: false,
  error:   null,

  fetchJobs: async ({ scope = 'all', search = '', homeCountry = '', lat = null, lng = null, category = '' } = {}) => {
    set({ loading: true, error: null });
    try {
      const api    = useAuthStore.getState().api;
      const loc    = useLocationStore.getState();
      const params = new URLSearchParams();

      if (scope === 'community' && homeCountry) {
        params.append('community', homeCountry);
      }
      // City-selected lat/lng takes priority over GPS
      const useLat = lat ?? loc.latitude;
      const useLng = lng ?? loc.longitude;
      if (useLat != null) params.append('lat', useLat);
      if (useLng != null) params.append('lng', useLng);
      if (search.trim()) params.append('search', search.trim());
      if (category && category !== 'all') params.append('category', category);

      const query = params.toString();
      const url   = `/jobs/${query ? '?' + query : ''}`;
      const data  = await api(url);
      const list  = Array.isArray(data) ? data : (data.results ?? []);
      set({ jobs: list.map(normalize), loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  addJob: async (jobData) => {
    const api = useAuthStore.getState().api;
    const fd  = new FormData();
    fd.append('title',        jobData.title);
    fd.append('company',      jobData.company);
    fd.append('location',     jobData.location);
    fd.append('description',  jobData.desc);
    fd.append('plan',         jobData.plan);
    fd.append('home_country', jobData.homeCountry || '');
    fd.append('country_flag', jobData.countryFlag || '');
    fd.append('posted_from',  jobData.postedFrom  || '');
    fd.append('category',     jobData.category    || 'other');
    if (jobData.latitude  != null) fd.append('latitude',  parseFloat(Number(jobData.latitude).toFixed(6)));
    if (jobData.longitude != null) fd.append('longitude', parseFloat(Number(jobData.longitude).toFixed(6)));
    if (jobData.image) {
      const ext  = jobData.image.uri.split('.').pop();
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      fd.append('image', { uri: jobData.image.uri, name: `job.${ext}`, type: mime });
    }
    const data = await api('/jobs/', { method: 'POST', body: fd });
    set(state => ({ jobs: [normalize(data), ...state.jobs] }));
    return data;
  },

  deleteJob: async (id) => {
    const api = useAuthStore.getState().api;
    await api(`/jobs/${id}/`, { method: 'DELETE' });
    set(state => ({ jobs: state.jobs.filter(j => j.id !== String(id)) }));
  },
}));
