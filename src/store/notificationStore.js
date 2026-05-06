import { create } from 'zustand';
import { useAuthStore } from './authStore';

export function formatNotifTime(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)     return 'Just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function normalize(n) {
  return {
    id:           String(n.id),
    type:         n.type,
    title:        n.title,
    body:         n.body,
    senderName:   n.sender_name,
    senderAvatar: n.sender_avatar,
    postId:       n.post_id,
    isRead:       n.is_read,
    createdAt:    n.created_at,  // keep raw ISO; compute display time at render
  };
}

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount:   0,
  loading:       false,
  refreshing:    false,
  error:         null,

  fetchNotifications: async ({ silent = false } = {}) => {
    if (silent) set({ refreshing: true, error: null });
    else        set({ loading: true,    error: null });
    try {
      const api  = useAuthStore.getState().api;
      const data = await api('/notifications/');
      const list = Array.isArray(data) ? data : (data.results ?? []);
      const notifications = list.map(normalize);
      set({
        notifications,
        unreadCount: notifications.filter(n => !n.isRead).length,
        loading: false, refreshing: false, error: null,
      });
    } catch (e) {
      set({ loading: false, refreshing: false, error: e?.message || 'Could not load notifications.' });
    }
  },

  markRead: async (id) => {
    const target = get().notifications.find(n => n.id === id);
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      unreadCount:   Math.max(0, state.unreadCount - (target && !target.isRead ? 1 : 0)),
    }));
    try {
      const api = useAuthStore.getState().api;
      await api(`/notifications/${id}/read/`, { method: 'PATCH' });
    } catch {
      get().fetchNotifications();
    }
  },

  markAllRead: async () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      const api = useAuthStore.getState().api;
      await api('/notifications/mark-all-read/', { method: 'POST' });
    } catch {
      get().fetchNotifications();
    }
  },

  deleteNotification: async (id) => {
    const snapshot = get().notifications;
    const target   = snapshot.find(n => n.id === id);
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
      unreadCount:   Math.max(0, state.unreadCount - (target && !target.isRead ? 1 : 0)),
    }));
    try {
      const api = useAuthStore.getState().api;
      await api(`/notifications/${id}/delete/`, { method: 'DELETE' });
    } catch {
      set({ notifications: snapshot, unreadCount: snapshot.filter(n => !n.isRead).length });
    }
  },

  deleteAllNotifications: async () => {
    const snapshot = get().notifications;
    set({ notifications: [], unreadCount: 0 });
    try {
      const api = useAuthStore.getState().api;
      await api('/notifications/delete-all/', { method: 'DELETE' });
    } catch {
      set({ notifications: snapshot, unreadCount: snapshot.filter(n => !n.isRead).length });
    }
  },
}));
