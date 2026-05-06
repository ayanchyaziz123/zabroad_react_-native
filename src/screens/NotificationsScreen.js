import React, { useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useNotificationStore, formatNotifTime } from '../store/notificationStore';

const TYPE_META = {
  like:     { icon: 'thumbs-up',        color: '#F4A227' },
  comment:  { icon: 'chatbubble',       color: '#3182CE' },
  message:  { icon: 'mail',             color: '#805AD5' },
  system:   { icon: 'notifications',    color: '#DD6B20' },
  job:      { icon: 'briefcase',        color: '#38A169' },
  housing:  { icon: 'home',             color: '#D69E2E' },
  attorney: { icon: 'shield-checkmark', color: '#6B46C1' },
  event:    { icon: 'calendar',         color: '#319795' },
  follow:   { icon: 'person-add',       color: '#0EA5E9' },
};
const DEFAULT_META = { icon: 'notifications', color: '#718096' };

export default function NotificationsScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const notifications          = useNotificationStore(st => st.notifications);
  const unreadCount            = useNotificationStore(st => st.unreadCount);
  const loading                = useNotificationStore(st => st.loading);
  const refreshing             = useNotificationStore(st => st.refreshing);
  const error                  = useNotificationStore(st => st.error);
  const fetchNotifications     = useNotificationStore(st => st.fetchNotifications);
  const markRead               = useNotificationStore(st => st.markRead);
  const markAllRead            = useNotificationStore(st => st.markAllRead);
  const deleteNotification     = useNotificationStore(st => st.deleteNotification);
  const deleteAllNotifications = useNotificationStore(st => st.deleteAllNotifications);

  // Refresh whenever screen gains focus
  useFocusEffect(useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]));

  const onRefresh = useCallback(() => {
    fetchNotifications({ silent: true });
  }, [fetchNotifications]);

  // Navigate to the relevant screen based on notification type
  const handlePress = useCallback((notif) => {
    if (!notif.isRead) markRead(notif.id);
    switch (notif.type) {
      case 'like':
      case 'comment':
        if (notif.postId) navigation.navigate('PostDetail', { postId: notif.postId });
        break;
      case 'message':
        navigation.navigate('Chat');
        break;
      case 'job':
        navigation.navigate('Jobs');
        break;
      case 'housing':
        navigation.navigate('Housing');
        break;
      case 'attorney':
        navigation.navigate('Attorneys');
        break;
      default:
        break;
    }
  }, [markRead, navigation]);

  // Long-press → delete option
  const handleLongPress = useCallback((notif) => {
    Alert.alert(notif.title, notif.body, [
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteNotification(notif.id),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [deleteNotification]);

  function confirmDeleteAll() {
    Alert.alert('Clear All Notifications', 'This will permanently remove all your notifications.', [
      { text: 'Clear All', style: 'destructive', onPress: deleteAllNotifications },
      { text: 'Cancel',    style: 'cancel' },
    ]);
  }

  const unread = notifications.filter(n => !n.isRead);
  const read   = notifications.filter(n =>  n.isRead);

  // ── Initial loading ──────────────────────────────────────────────────────────
  if (loading && notifications.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header s={s} C={C} unreadCount={unreadCount} markAllRead={markAllRead}
          confirmDeleteAll={confirmDeleteAll} navigation={navigation}
          hasNotifications={false} />
        <View style={s.center}>
          <ActivityIndicator color={C.vivid} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error && notifications.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header s={s} C={C} unreadCount={unreadCount} markAllRead={markAllRead}
          confirmDeleteAll={confirmDeleteAll} navigation={navigation}
          hasNotifications={false} />
        <View style={s.center}>
          <View style={[s.emptyIcon, { backgroundColor: C.card, borderColor: C.border }]}>
            <Ionicons name="cloud-offline-outline" size={34} color={C.c35} />
          </View>
          <Text style={[s.emptyTitle, { color: C.cream }]}>Could not load</Text>
          <Text style={[s.emptySub, { color: C.c35 }]}>{error}</Text>
          <TouchableOpacity
            style={[s.retryBtn, { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]}
            onPress={() => fetchNotifications()}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={14} color={C.vivid} />
            <Text style={[s.retryTxt, { color: C.vivid }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header s={s} C={C} unreadCount={unreadCount} markAllRead={markAllRead}
        confirmDeleteAll={confirmDeleteAll} navigation={navigation}
        hasNotifications={notifications.length > 0} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.vivid} />
        }
      >
        {notifications.length === 0 ? (
          <View style={s.empty}>
            <View style={[s.emptyIcon, { backgroundColor: C.card, borderColor: C.border }]}>
              <Ionicons name="notifications-off-outline" size={34} color={C.c35} />
            </View>
            <Text style={[s.emptyTitle, { color: C.cream }]}>All caught up</Text>
            <Text style={[s.emptySub, { color: C.c35 }]}>
              When someone likes or comments on your posts, you'll see it here.
            </Text>
          </View>
        ) : null}

        {unread.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { color: C.c35 }]}>NEW · {unread.length} UNREAD</Text>
            {unread.map(n => (
              <NotifCard
                key={n.id} notif={n} s={s} C={C}
                onPress={handlePress} onLongPress={handleLongPress}
              />
            ))}
          </>
        )}

        {read.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { color: C.c35, marginTop: unread.length > 0 ? 20 : 0 }]}>
              EARLIER
            </Text>
            {read.map(n => (
              <NotifCard
                key={n.id} notif={n} s={s} C={C}
                onPress={handlePress} onLongPress={handleLongPress}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header({ s, C, unreadCount, markAllRead, confirmDeleteAll, navigation, hasNotifications }) {
  return (
    <View style={[s.header, { borderBottomColor: C.border, backgroundColor: C.nav }]}>
      <TouchableOpacity
        style={[s.backBtn, { backgroundColor: C.card, borderColor: C.border }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-back" size={20} color={C.cream} />
      </TouchableOpacity>

      <View style={s.headerCenter}>
        <Text style={[s.headerTitle, { color: C.cream }]}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={[s.badge, { backgroundColor: C.vivid }]}>
            <Text style={s.badgeTxt}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </View>

      <View style={s.headerActions}>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.75}>
            <Text style={[s.markAllTxt, { color: C.vivid }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
        {hasNotifications && (
          <TouchableOpacity
            onPress={confirmDeleteAll}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.75}
          >
            <Ionicons name="trash-outline" size={19} color={C.c35} />
          </TouchableOpacity>
        )}
        {!unreadCount && !hasNotifications && <View style={{ width: 72 }} />}
      </View>
    </View>
  );
}

// ── Notification Card ─────────────────────────────────────────────────────────
function NotifCard({ notif, s, C, onPress, onLongPress }) {
  const meta    = TYPE_META[notif.type] || DEFAULT_META;
  const unread  = !notif.isRead;
  return (
    <TouchableOpacity
      style={[
        s.card,
        { backgroundColor: C.card, borderColor: C.border },
        unread && { backgroundColor: C.vividD, borderColor: C.vivid + '40' },
      ]}
      activeOpacity={0.75}
      onPress={() => onPress(notif)}
      onLongPress={() => onLongPress(notif)}
    >
      {/* Icon */}
      <View style={[s.iconWrap, { backgroundColor: meta.color + '22' }]}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>

      {/* Body */}
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <Text
            style={[s.cardTitle, { color: unread ? C.cream : C.c60 }, unread && s.cardTitleUnread]}
            numberOfLines={1}
          >
            {notif.title}
          </Text>
          {unread && <View style={[s.dot, { backgroundColor: C.vivid }]} />}
        </View>

        <Text style={[s.cardText, { color: C.c35 }]} numberOfLines={2}>
          {notif.body}
        </Text>

        <View style={s.cardMeta}>
          <Text style={s.senderAvatar}>{notif.senderAvatar || '🔔'}</Text>
          <Text style={[s.senderName, { color: C.c35 }]} numberOfLines={1}>
            {notif.senderName || 'Zabroad'}
          </Text>
          <Text style={[s.cardTime, { color: C.c35 }]}>
            · {formatNotifTime(notif.createdAt)}
          </Text>
        </View>
      </View>

      {/* Chevron for actionable types */}
      {['like','comment','message','job','housing','attorney'].includes(notif.type) && (
        <Ionicons name="chevron-forward" size={15} color={C.c35} style={{ alignSelf: 'center', flexShrink: 0 }} />
      )}
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const getStyles = (C) => StyleSheet.create({
  safe:    { flex: 1, backgroundColor: C.bg },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 36, paddingTop: 12 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  headerCenter:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:   { fontSize: 17, fontWeight: '800' },
  badge:         { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 22, alignItems: 'center' },
  badgeTxt:      { fontSize: 11, color: '#fff', fontWeight: '800' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 72, justifyContent: 'flex-end' },
  markAllTxt:    { fontSize: 12, fontWeight: '600' },

  // Section
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.4,
    textTransform: 'uppercase', marginBottom: 10,
  },

  // Card
  card: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 8,
  },
  iconWrap:       { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody:       { flex: 1, gap: 3 },
  cardTop:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle:      { flex: 1, fontSize: 13, fontWeight: '600' },
  cardTitleUnread:{ fontWeight: '800' },
  dot:            { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  cardText:       { fontSize: 12, lineHeight: 17 },
  cardMeta:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  senderAvatar:   { fontSize: 12 },
  senderName:     { fontSize: 11, fontWeight: '600', flex: 1 },
  cardTime:       { fontSize: 11 },

  // Empty / error
  empty:     { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptySub:   { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  retryBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, borderWidth: 1, marginTop: 4 },
  retryTxt:   { fontSize: 13, fontWeight: '700' },
});
