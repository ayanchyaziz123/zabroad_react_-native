import React, { useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useNotificationStore } from '../store/notificationStore';

const TYPE_META = {
  like:     { icon: 'heart',                   color: '#F4A227' },
  comment:  { icon: 'chatbubble',              color: '#3182CE' },
  message:  { icon: 'mail',                    color: '#805AD5' },
  system:   { icon: 'notifications',           color: '#DD6B20' },
  job:      { icon: 'briefcase',               color: '#38A169' },
  housing:  { icon: 'home',                    color: '#D69E2E' },
  attorney: { icon: 'shield-checkmark',        color: '#6B46C1' },
  event:    { icon: 'calendar',                color: '#319795' },
};

const DEFAULT_META = { icon: 'notifications', color: '#718096' };

export default function NotificationsScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const notifications    = useNotificationStore(s => s.notifications);
  const unreadCount      = useNotificationStore(s => s.unreadCount);
  const loading          = useNotificationStore(s => s.loading);
  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
  const markRead         = useNotificationStore(s => s.markRead);
  const markAllRead      = useNotificationStore(s => s.markAllRead);

  const onRefresh = useCallback(() => fetchNotifications(), []);

  const handlePress = useCallback((notif) => {
    if (!notif.isRead) markRead(notif.id);
    if (notif.postId) {
      navigation.navigate('PostDetail', { postId: notif.postId });
    }
  }, [markRead, navigation]);

  const unread = notifications.filter(n => !n.isRead);
  const read   = notifications.filter(n =>  n.isRead);

  if (loading && notifications.length === 0) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        {renderHeader(s, C, unreadCount, markAllRead, navigation)}
        <View style={s.center}>
          <ActivityIndicator color={C.vivid} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {renderHeader(s, C, unreadCount, markAllRead, navigation)}

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={C.vivid} />}
      >
        {notifications.length === 0 && (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={40} color={C.c35} />
            </View>
            <Text style={s.emptyTitle}>No notifications yet</Text>
            <Text style={s.emptySub}>When someone likes or comments on your posts, you'll see it here.</Text>
          </View>
        )}

        {unread.length > 0 && (
          <>
            <Text style={s.sectionLabel}>NEW  ·  {unread.length} unread</Text>
            {unread.map(n => <NotifCard key={n.id} notif={n} s={s} C={C} onPress={handlePress} />)}
          </>
        )}

        {read.length > 0 && (
          <>
            {unread.length > 0 && <Text style={[s.sectionLabel, { marginTop: 20 }]}>EARLIER</Text>}
            {read.map(n => <NotifCard key={n.id} notif={n} s={s} C={C} onPress={handlePress} />)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function renderHeader(s, C, unreadCount, markAllRead, navigation) {
  return (
    <View style={s.header}>
      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={20} color={C.cream} />
      </TouchableOpacity>

      <View style={s.headerCenter}>
        <Text style={s.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </View>

      {unreadCount > 0 ? (
        <TouchableOpacity onPress={markAllRead} style={s.markAllBtn}>
          <Text style={s.markAllTxt}>Mark all read</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 80 }} />
      )}
    </View>
  );
}

function NotifCard({ notif, s, C, onPress }) {
  const meta = TYPE_META[notif.type] || DEFAULT_META;
  return (
    <TouchableOpacity
      style={[s.card, !notif.isRead && s.cardUnread]}
      activeOpacity={0.75}
      onPress={() => onPress(notif)}
    >
      <View style={[s.iconWrap, { backgroundColor: meta.color + '22' }]}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>

      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <Text style={[s.cardTitle, !notif.isRead && s.cardTitleUnread]} numberOfLines={1}>
            {notif.title}
          </Text>
          {!notif.isRead && <View style={s.dot} />}
        </View>
        <Text style={s.cardText} numberOfLines={2}>{notif.body}</Text>
        <View style={s.cardBottom}>
          <Text style={s.cardAvatar}>{notif.senderAvatar}</Text>
          <Text style={s.cardTime}>{notif.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.nav,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:  { fontSize: 16, fontWeight: '700', color: C.cream },
  badge:        { backgroundColor: C.vivid, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeTxt:     { fontSize: 11, color: '#fff', fontWeight: '800' },
  markAllBtn:   { paddingVertical: 6, paddingHorizontal: 4 },
  markAllTxt:   { fontSize: 12, color: C.vivid, fontWeight: '600' },

  // Section labels
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: C.c35,
    letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8,
  },

  // Card
  card: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    borderRadius: 16, padding: 14, marginBottom: 8,
  },
  cardUnread: { borderColor: C.vivid + '40', backgroundColor: C.vividD },
  iconWrap:   { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody:   { flex: 1 },
  cardTop:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  cardTitle:  { flex: 1, fontSize: 13, fontWeight: '600', color: C.c60 },
  cardTitleUnread: { color: C.cream, fontWeight: '700' },
  dot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: C.vivid, flexShrink: 0 },
  cardText:   { fontSize: 12, color: C.c35, lineHeight: 17, marginBottom: 6 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardAvatar: { fontSize: 13 },
  cardTime:   { fontSize: 11, color: C.c35, fontWeight: '500' },

  // Empty state
  empty:     { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.cream },
  emptySub:   { fontSize: 13, color: C.c35, textAlign: 'center', lineHeight: 19 },
});
