import { create } from 'zustand';
import { useAuthStore } from './authStore';

// Normalize backend job → frontend shape
function normalize(j) {
  return {
    id:          String(j.id),
    title:       j.title,
    company:     j.company,
    location:    j.location,
    desc:        j.description,
    plan:        j.plan,
    poster:      j.poster,
    postedFrom:  j.posted_from || '',
    communities: j.home_country ? [j.home_country] : [],
    countryFlag: j.country_flag || '🌍',
    hot:         j.is_hot,
    posted:      j.created_at ? timeAgo(j.created_at) : 'Just now',
  };
}

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60)         return 'Just now';
  if (diff < 3600)       return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const useJobsStore = create((set, get) => ({
  jobs:    [],
  loading: false,
  error:   null,

  fetchJobs: async () => {
    set({ loading: true, error: null });
    try {
      const api  = useAuthStore.getState().api;
      const data = await api('/jobs/');
      const list = Array.isArray(data) ? data : (data.results ?? []);
      set({ jobs: list.map(normalize), loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  addJob: async (jobData) => {
    try {
      const api  = useAuthStore.getState().api;
      const data = await api('/jobs/', {
        method: 'POST',
        body: {
          title:        jobData.title,
          company:      jobData.company,
          location:     jobData.location,
          description:  jobData.desc,
          plan:         jobData.plan,
          home_country: jobData.homeCountry,
          country_flag: jobData.countryFlag,
          posted_from:  jobData.postedFrom,
        },
      });
      // Prepend normalized job immediately for instant UI feedback
      set(state => ({ jobs: [normalize(data), ...state.jobs] }));
      return data;
    } catch (e) {
      throw e;
    }
  },
}));
