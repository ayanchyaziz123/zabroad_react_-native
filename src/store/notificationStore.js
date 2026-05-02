import { create } from 'zustand';
import { useAuthStore } from './authStore';

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function normalize(n) {
  return {
    id:          String(n.id),
    type:        n.type,
    title:       n.title,
    body:        n.body,
    senderName:  n.sender_name,
    senderAvatar: n.sender_avatar,
    postId:      n.post_id,
    isRead:      n.is_read,
    time:        timeAgo(n.created_at),
    createdAt:   n.created_at,
  };
}

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount:   0,
  loading:       false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const api  = useAuthStore.getState().api;
      const data = await api('/notifications/');
      const list = Array.isArray(data) ? data : (data.results ?? []);
      const notifications = list.map(normalize);
      set({
        notifications,
        unreadCount: notifications.filter(n => !n.isRead).length,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    // Optimistic update
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      unreadCount:   Math.max(0, state.unreadCount - (state.notifications.find(n => n.id === id && !n.isRead) ? 1 : 0)),
    }));
    try {
      const api = useAuthStore.getState().api;
      await api(`/notifications/${id}/read/`, { method: 'PATCH' });
    } catch {
      // Revert on failure
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
}));
