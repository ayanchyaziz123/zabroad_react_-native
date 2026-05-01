import { create } from 'zustand';
import { useAuthStore } from './authStore';

export function formatMsgTime(isoString) {
  if (!isoString) return '';
  const d   = new Date(isoString);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[d.getDay()];
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const useChatStore = create((set, get) => ({
  conversations:  [],
  messages:       {},   // { [convoId]: [msg, ...] }
  loading:        false,
  loadingMsgs:    false,
  inConversation: false,
  setInConversation: (val) => set({ inConversation: val }),

  fetchConversations: async () => {
    set({ loading: true });
    try {
      const api  = useAuthStore.getState().api;
      const data = await api('/chat/');
      const list = Array.isArray(data) ? data : (data.results ?? []);
      // Sort by last message time, newest first
      list.sort((a, b) => {
        const at = a.last_message?.created_at || a.created_at;
        const bt = b.last_message?.created_at || b.created_at;
        return new Date(bt) - new Date(at);
      });
      set({ conversations: list, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  // Open or create a convo with a specific user_id, returns conversation
  startConversation: async (userId) => {
    const api  = useAuthStore.getState().api;
    const data = await api('/chat/start/', { method: 'POST', body: { user_id: userId } });
    // Upsert into conversations list
    set(state => {
      const exists = state.conversations.find(c => c.id === data.id);
      if (exists) return {};
      return { conversations: [data, ...state.conversations] };
    });
    return data;
  },

  fetchMessages: async (convoId) => {
    set({ loadingMsgs: true });
    try {
      const api  = useAuthStore.getState().api;
      const data = await api(`/chat/${convoId}/messages/`);
      const list = Array.isArray(data) ? data : (data.results ?? []);
      set(state => ({
        messages: { ...state.messages, [convoId]: list },
        loadingMsgs: false,
        // Clear unread count for this convo since backend marks them read on GET
        conversations: state.conversations.map(c =>
          c.id === convoId ? { ...c, unread_count: 0 } : c
        ),
      }));
    } catch {
      set({ loadingMsgs: false });
    }
  },

  sendMessage: async (convoId, text, mediaUri = null) => {
    const api     = useAuthStore.getState().api;
    const current = useAuthStore.getState().user;
    const tempId  = `temp-${Date.now()}`;
    // Optimistic update
    const tempMsg = {
      id:               tempId,
      sender_id:        current?.id,
      sender_name:      current?.first_name
                          ? `${current.first_name} ${current.last_name || ''}`.trim()
                          : current?.username || 'You',
      sender_avatar_url: current?.profile?.avatar_url || null,
      text:             text || '',
      media_url:        mediaUri,
      is_read:          false,
      created_at:       new Date().toISOString(),
      _pending:         true,
    };
    set(state => ({
      messages: {
        ...state.messages,
        [convoId]: [...(state.messages[convoId] || []), tempMsg],
      },
    }));
    try {
      let body;
      if (mediaUri) {
        const fd = new FormData();
        if (text) fd.append('text', text);
        const filename = mediaUri.split('/').pop();
        const ext      = filename.split('.').pop().toLowerCase();
        const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
        fd.append('media', { uri: mediaUri, name: filename, type: mimeType });
        body = fd;
      } else {
        body = { text };
      }
      const msg = await api(`/chat/${convoId}/messages/`, { method: 'POST', body });
      set(state => ({
        messages: {
          ...state.messages,
          [convoId]: state.messages[convoId].map(m => m.id === tempId ? msg : m),
        },
        conversations: state.conversations.map(c =>
          c.id === convoId
            ? {
                ...c,
                last_message: {
                  text:       msg.text || '',
                  has_media:  !!msg.media_url,
                  created_at: msg.created_at,
                  sender_id:  current?.id,
                },
              }
            : c
        ),
      }));
    } catch {
      set(state => ({
        messages: {
          ...state.messages,
          [convoId]: state.messages[convoId].map(m =>
            m.id === tempId ? { ...m, _pending: false, _failed: true } : m
          ),
        },
      }));
    }
  },

  retryMessage: async (convoId, failedMsg) => {
    // Remove the failed message then re-send
    set(state => ({
      messages: {
        ...state.messages,
        [convoId]: state.messages[convoId].filter(m => m.id !== failedMsg.id),
      },
    }));
    await get().sendMessage(convoId, failedMsg.text, failedMsg.media_url);
  },
}));
