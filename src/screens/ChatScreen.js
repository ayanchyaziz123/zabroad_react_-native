import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, Animated, ActivityIndicator, RefreshControl,
  Image, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useChatStore, formatMsgTime } from '../store/chatStore';
import UserAvatar from '../components/UserAvatar';

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots({ C }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 150),
        Animated.timing(dot, { toValue: -5, duration: 280, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0,  duration: 280, useNativeDriver: true }),
        Animated.delay(500 - i * 150),
      ]))
    );
    Animated.parallel(anims).start();
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.c35, transform: [{ translateY: dot }] }}
        />
      ))}
    </View>
  );
}

// ── Date separator between messages ──────────────────────────────────────────
function dateSeparatorLabel(isoString) {
  if (!isoString) return '';
  const d   = new Date(isoString);
  const now = new Date();
  const isToday     = d.toDateString() === now.toDateString();
  const yesterday   = new Date(now); yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday)     return 'Today';
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// ── Preview text for last message in list ────────────────────────────────────
function lastMsgPreview(lastMsg, isMe) {
  if (!lastMsg) return 'No messages yet';
  const prefix = isMe ? 'You: ' : '';
  if (lastMsg.has_media && !lastMsg.text) return `${prefix}📷 Photo`;
  if (lastMsg.has_media && lastMsg.text)  return `${prefix}📷 ${lastMsg.text}`;
  return `${prefix}${lastMsg.text}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ChatScreen({ route }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const insets = useSafeAreaInsets();

  const currentUser    = useAuthStore(s => s.user);
  const currentUserId  = currentUser?.id;

  const conversations      = useChatStore(s => s.conversations);
  const messages           = useChatStore(s => s.messages);
  const loading            = useChatStore(s => s.loading);
  const loadingMsgs        = useChatStore(s => s.loadingMsgs);
  const fetchConversations = useChatStore(s => s.fetchConversations);
  const fetchMessages      = useChatStore(s => s.fetchMessages);
  const sendMessage        = useChatStore(s => s.sendMessage);
  const retryMessage       = useChatStore(s => s.retryMessage);
  const startConversation  = useChatStore(s => s.startConversation);
  const setInConversation  = useChatStore(s => s.setInConversation);

  const [activeConvoId, setActiveConvoId] = useState(null);
  const [input,         setInput]         = useState('');
  const [mediaUri,      setMediaUri]      = useState(null);
  const [search,        setSearch]        = useState('');
  const [refreshing,    setRefreshing]    = useState(false);
  const scrollRef   = useRef(null);
  const inputRef    = useRef(null);

  // ── Media picker ──────────────────────────────────────────────────────────
  async function pickMedia() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photos to share media.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) setMediaUri(result.assets[0].uri);
  }

  async function openCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets?.[0]) setMediaUri(result.assets[0].uri);
  }

  function showMediaOptions() {
    Alert.alert('Share Media', '', [
      { text: 'Camera',        onPress: openCamera },
      { text: 'Photo Library', onPress: pickMedia  },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  useEffect(() => { fetchConversations(); }, []);

  const targetUserId = route?.params?.userId;
  useEffect(() => {
    if (!targetUserId) return;
    startConversation(targetUserId).then(convo => {
      setActiveConvoId(convo.id);
    }).catch(() => {});
  }, [targetUserId]);

  useEffect(() => {
    if (activeConvoId) {
      setInConversation(true);
      fetchMessages(activeConvoId);
    } else {
      setInConversation(false);
      setInput('');
      setMediaUri(null);
    }
    return () => setInConversation(false);
  }, [activeConvoId]);

  // Scroll to bottom when messages arrive
  useEffect(() => {
    if (!activeConvoId) return;
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages[activeConvoId]?.length]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeConvo    = conversations.find(c => c.id === activeConvoId);
  const convoMessages  = messages[activeConvoId] || [];
  const otherUser      = activeConvo?.other_user;
  const otherName      = otherUser?.name || 'Unknown';

  const filteredConvos = useMemo(() => {
    if (!search) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(c => (c.other_user?.name || '').toLowerCase().includes(q));
  }, [conversations, search]);

  // ── Send ───────────────────────────────────────────────────────────────────
  function handleSend() {
    if ((!input.trim() && !mediaUri) || !activeConvoId) return;
    sendMessage(activeConvoId, input.trim(), mediaUri);
    setInput('');
    setMediaUri(null);
  }

  // ── Chat view ──────────────────────────────────────────────────────────────
  if (activeConvoId) {
    // Build display list with date separators and grouping info
    const displayItems = [];
    convoMessages.forEach((msg, idx) => {
      const prev = convoMessages[idx - 1];
      if (!isSameDay(prev?.created_at, msg.created_at)) {
        displayItems.push({ type: 'date', key: `date-${idx}`, label: dateSeparatorLabel(msg.created_at) });
      }
      const next = convoMessages[idx + 1];
      const isFirst = !prev || prev.sender_id !== msg.sender_id || !isSameDay(prev.created_at, msg.created_at);
      const isLast  = !next || next.sender_id !== msg.sender_id || !isSameDay(msg.created_at, next?.created_at);
      displayItems.push({ type: 'msg', key: String(msg.id), msg, isFirst, isLast });
    });

    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        {/* Chat header */}
        <View style={s.chatHeader}>
          <TouchableOpacity onPress={() => setActiveConvoId(null)} style={s.backBtn} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={22} color={C.cream} />
          </TouchableOpacity>
          <UserAvatar
            uri={otherUser?.avatar_url}
            name={otherName}
            size={40}
            radius={13}
            bg={C.purpleD}
          />
          <View style={{ flex: 1 }}>
            <Text style={s.chatName} numberOfLines={1}>{otherName}</Text>
            <Text style={s.chatStatus}>Community member</Text>
          </View>
          <TouchableOpacity style={s.headerIcon} activeOpacity={0.7}>
            <Ionicons name="ellipsis-horizontal" size={20} color={C.c35} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Message list */}
          {loadingMsgs && convoMessages.length === 0 ? (
            <View style={s.loadingWrap}>
              <ActivityIndicator size="large" color={C.vivid} />
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={s.msgList}
              contentContainerStyle={[
                s.msgListContent,
                convoMessages.length === 0 && { flex: 1 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
            >
              {convoMessages.length === 0 ? (
                <View style={s.emptyChat}>
                  <View style={[s.emptyChatAvCircle, { backgroundColor: C.purpleD }]}>
                    <UserAvatar uri={otherUser?.avatar_url} name={otherName} size={64} radius={22} bg={C.purpleD} />
                  </View>
                  <Text style={s.emptyChatName}>{otherName}</Text>
                  <Text style={s.emptyChatSub}>You're connected on Zabroad</Text>
                  <Text style={s.emptyChatHint}>Say hello 👋</Text>
                </View>
              ) : (
                displayItems.map(item => {
                  if (item.type === 'date') {
                    return (
                      <View key={item.key} style={s.dateSep}>
                        <View style={s.dateLine} />
                        <Text style={s.dateLabel}>{item.label}</Text>
                        <View style={s.dateLine} />
                      </View>
                    );
                  }
                  const { msg, isFirst, isLast } = item;
                  const isMe = msg.sender_id === currentUserId;

                  // Bubble radius — group consecutive messages
                  const r = 18;
                  const bubbleRadius = isMe
                    ? { borderTopLeftRadius: r, borderBottomLeftRadius: r, borderTopRightRadius: isFirst ? r : 6, borderBottomRightRadius: isLast ? 4 : 6 }
                    : { borderTopRightRadius: r, borderBottomRightRadius: r, borderTopLeftRadius: isFirst ? r : 6, borderBottomLeftRadius: isLast ? 4 : 6 };

                  return (
                    <View key={item.key} style={[s.msgRow, isMe && s.msgRowMe, !isLast && s.msgRowGrouped]}>
                      {/* Avatar — only on last message of a group for "other" side */}
                      {!isMe ? (
                        isLast ? (
                          <UserAvatar
                            uri={msg.sender_avatar_url}
                            name={msg.sender_name}
                            size={28}
                            radius={9}
                            bg={C.purpleD}
                            style={{ flexShrink: 0, alignSelf: 'flex-end' }}
                          />
                        ) : (
                          <View style={{ width: 28 }} />
                        )
                      ) : null}

                      <TouchableOpacity
                        activeOpacity={msg._failed ? 0.6 : 1}
                        onPress={msg._failed ? () => {
                          Alert.alert('Message failed', 'Tap Retry to resend.', [
                            { text: 'Retry',  onPress: () => retryMessage(activeConvoId, msg) },
                            { text: 'Cancel', style: 'cancel' },
                          ]);
                        } : undefined}
                        style={[
                          s.bubble,
                          isMe ? s.bubbleMe : s.bubbleOther,
                          bubbleRadius,
                          msg._pending && { opacity: 0.65 },
                          msg._failed  && { opacity: 0.5, borderWidth: 1, borderColor: '#ff4444' },
                          msg.media_url && !msg.text && s.bubbleMediaOnly,
                        ]}
                      >
                        {msg.media_url ? (
                          <Image source={{ uri: msg.media_url }} style={s.msgImage} resizeMode="cover" />
                        ) : null}
                        {msg.text ? (
                          <Text style={[s.bubbleTxt, { color: isMe ? '#fff' : C.c60 }, msg.media_url && { marginTop: 6 }]}>
                            {msg.text}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
              {/* Status row for last sent message */}
              {convoMessages.length > 0 && (() => {
                const last = convoMessages[convoMessages.length - 1];
                if (last.sender_id !== currentUserId) return null;
                return (
                  <Text style={s.delivered}>
                    {last._pending ? 'Sending…' : last._failed ? '⚠ Failed · Tap to retry' : last.is_read ? 'Read ✓✓' : 'Delivered ✓'}
                  </Text>
                );
              })()}
            </ScrollView>
          )}

          {/* Input bar */}
          <View style={[s.inputWrap, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
            {mediaUri && (
              <View style={s.mediaPreview}>
                <Image source={{ uri: mediaUri }} style={s.mediaThumb} resizeMode="cover" />
                <TouchableOpacity style={s.mediaRemove} onPress={() => setMediaUri(null)} activeOpacity={0.8}>
                  <Ionicons name="close-circle" size={22} color="white" />
                </TouchableOpacity>
              </View>
            )}
            <View style={s.inputRow}>
              <TouchableOpacity style={s.attachBtn} onPress={showMediaOptions} activeOpacity={0.75}>
                <Ionicons name="image-outline" size={22} color={C.c35} />
              </TouchableOpacity>
              <TextInput
                ref={inputRef}
                style={s.msgInput}
                placeholder="Message…"
                placeholderTextColor={C.c35}
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={2000}
                returnKeyType="default"
              />
              <TouchableOpacity
                style={[s.sendBtn, (!input.trim() && !mediaUri) && s.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim() && !mediaUri}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-up" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Conversation list ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Messages</Text>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={C.c35} />
          <TextInput
            style={s.searchInput}
            placeholder="Search conversations…"
            placeholderTextColor={C.c35}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color={C.c35} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && conversations.length === 0 ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.vivid} />
          <Text style={s.loadingTxt}>Loading messages…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.vivid} />}
        >
          {filteredConvos.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="chatbubbles-outline" size={52} color={C.c35} />
              <Text style={s.emptyTxt}>
                {search ? 'No results' : 'No messages yet'}
              </Text>
              <Text style={s.emptySub}>
                {search
                  ? `No conversations matching "${search}"`
                  : 'Tap Message on any post or profile to start a conversation'}
              </Text>
            </View>
          ) : (
            filteredConvos.map(convo => {
              const other   = convo.other_user;
              const lastMsg = convo.last_message;
              const unread  = convo.unread_count || 0;
              const isMe    = lastMsg?.sender_id === currentUserId;
              const preview = lastMsgPreview(lastMsg, isMe);
              const time    = lastMsg ? formatMsgTime(lastMsg.created_at) : '';

              return (
                <TouchableOpacity
                  key={convo.id}
                  style={[s.convoItem, unread > 0 && s.convoUnread]}
                  onPress={() => setActiveConvoId(convo.id)}
                  activeOpacity={0.75}
                >
                  <UserAvatar
                    uri={other?.avatar_url}
                    name={other?.name}
                    size={52}
                    radius={17}
                    bg={C.purpleD}
                  />
                  <View style={s.convoBody}>
                    <View style={s.convoTop}>
                      <Text
                        style={[s.convoName, unread > 0 && { color: C.cream, fontWeight: '700' }]}
                        numberOfLines={1}
                      >
                        {other?.name || 'Unknown'}
                      </Text>
                      <Text style={[s.convoTime, unread > 0 && { color: C.vivid, fontWeight: '600' }]}>
                        {time}
                      </Text>
                    </View>
                    <View style={s.convoBottom}>
                      <Text
                        style={[s.convoPreview, unread > 0 && { color: C.c60, fontWeight: '500' }]}
                        numberOfLines={1}
                      >
                        {preview}
                      </Text>
                      {unread > 0 && (
                        <View style={s.unreadBadge}>
                          <Text style={s.unreadTxt}>{unread > 99 ? '99+' : unread}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const getStyles = (C) => StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },

  // List header
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  title:        { fontSize: 26, fontWeight: '800', color: C.cream, letterSpacing: -0.5 },

  // Search
  searchWrap:   { paddingHorizontal: 16, marginBottom: 8 },
  searchBox:    { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput:  { flex: 1, fontSize: 13, color: C.cream },

  loadingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  loadingTxt:   { fontSize: 13, color: C.c35, fontWeight: '600' },

  // Empty list
  emptyState:   { alignItems: 'center', paddingTop: 80, gap: 12, paddingHorizontal: 40 },
  emptyTxt:     { fontSize: 17, fontWeight: '700', color: C.cream, textAlign: 'center' },
  emptySub:     { fontSize: 13, color: C.c35, textAlign: 'center', lineHeight: 20 },

  // Convo row
  convoItem:    { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  convoUnread:  { backgroundColor: C.card },
  convoBody:    { flex: 1, justifyContent: 'center' },
  convoTop:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  convoName:    { fontSize: 14, fontWeight: '600', color: C.c60, flex: 1, marginRight: 8 },
  convoTime:    { fontSize: 11, color: C.c35 },
  convoBottom:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convoPreview: { flex: 1, fontSize: 12, color: C.c35, marginRight: 8 },
  unreadBadge:  { backgroundColor: C.vivid, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
  unreadTxt:    { fontSize: 10, fontWeight: '700', color: 'white' },

  // Chat header
  chatHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  backBtn:      { width: 36, height: 36, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  chatName:     { fontSize: 15, fontWeight: '700', color: C.cream },
  chatStatus:   { fontSize: 11, color: C.c35, marginTop: 1 },
  headerIcon:   { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  // Message list
  msgList:        { flex: 1 },
  msgListContent: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6 },

  // Date separator
  dateSep:    { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  dateLine:   { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: C.border },
  dateLabel:  { fontSize: 11, color: C.c35, fontWeight: '600', paddingHorizontal: 4 },

  // Message rows
  msgRow:        { flexDirection: 'row', gap: 6, alignItems: 'flex-end', marginBottom: 2 },
  msgRowMe:      { flexDirection: 'row-reverse' },
  msgRowGrouped: { marginBottom: 1 },

  // Bubbles
  bubble:        { maxWidth: '76%', padding: 11 },
  bubbleOther:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  bubbleMe:      { backgroundColor: C.vivid },
  bubbleMediaOnly: { padding: 3 },
  bubbleTxt:     { fontSize: 14, lineHeight: 21 },

  // Media image inside bubble
  msgImage:      { width: 220, height: 200, borderRadius: 12 },

  // Status row
  delivered:     { fontSize: 10, color: C.c35, textAlign: 'right', marginTop: 2, marginRight: 4, marginBottom: 4 },

  // Empty chat state
  emptyChat:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 60 },
  emptyChatAvCircle: { marginBottom: 6 },
  emptyChatName:   { fontSize: 18, fontWeight: '700', color: C.cream },
  emptyChatSub:    { fontSize: 13, color: C.c35 },
  emptyChatHint:   { fontSize: 22, marginTop: 6 },

  // Input
  inputWrap:    { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, backgroundColor: C.nav, paddingTop: 10 },
  inputRow:     { flexDirection: 'row', gap: 8, alignItems: 'flex-end', paddingHorizontal: 10 },
  attachBtn:    { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 2 },
  msgInput:     { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 22, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 8, fontSize: 14, color: C.cream, maxHeight: 120, lineHeight: 20 },
  sendBtn:      { width: 42, height: 42, backgroundColor: C.vivid, borderRadius: 21, alignItems: 'center', justifyContent: 'center', shadowColor: C.vivid, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, flexShrink: 0, marginBottom: 2 },
  sendBtnDisabled: { opacity: 0.35 },

  // Media preview
  mediaPreview: { marginHorizontal: 12, marginBottom: 8, alignSelf: 'flex-start' },
  mediaThumb:   { width: 80, height: 80, borderRadius: 14, backgroundColor: C.card },
  mediaRemove:  { position: 'absolute', top: -8, right: -8 },
});
