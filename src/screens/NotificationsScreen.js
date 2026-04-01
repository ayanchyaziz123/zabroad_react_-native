import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

const NOTIFS = [
  { id: '1',  icon: '🤖', title: 'Zabroad AI answered your question',        body: 'Your OPT timeline question has been answered.',          time: 'Just now',  read: false, type: 'ai'      },
  { id: '2',  icon: '🎉', title: 'Welcome to Zabroad!',                      body: 'Your profile is set up. Start exploring communities.',   time: '2 min ago', read: false, type: 'system'  },
  { id: '3',  icon: '💼', title: 'New job match: Junior Java Dev at Citi',   body: 'OPT/STEM sponsorship · $75K–$90K · Apply by Apr 10.',    time: '1h ago',    read: false, type: 'job'     },
  { id: '4',  icon: '🏠', title: 'New housing listing in Queens',            body: 'No-SSN required · $1,400/mo · Near 7 train.',            time: '2h ago',    read: true,  type: 'housing' },
  { id: '5',  icon: '⚖️', title: 'Free legal clinic this Saturday',          body: 'Immigration attorneys available at Downtown Manhattan.', time: '3h ago',    read: true,  type: 'legal'   },
  { id: '6',  icon: '🩺', title: 'Dr. Ayesha Karim: appointment reminder',   body: 'Your appointment is tomorrow at 10:00 AM.',              time: '5h ago',    read: true,  type: 'health'  },
  { id: '7',  icon: '🏘️', title: 'NYC Bangladeshi Network has a new post',   body: 'Tanvir H. asked: Best halal restaurants in Astoria?',    time: '6h ago',    read: true,  type: 'comm'    },
  { id: '8',  icon: '📋', title: 'H-1B cap registration opens in 2 weeks',   body: 'USCIS H-1B registration window opens March 1.',          time: '1d ago',    read: true,  type: 'visa'    },
  { id: '9',  icon: '👍', title: '32 people liked your post',                body: '"OPT-friendly staffing agencies in NYC?" got 32 likes.', time: '1d ago',    read: true,  type: 'social'  },
  { id: '10', icon: '🔔', title: 'OPT expiry reminder',                      body: 'Your OPT expires in 45 days. Start your extension now.', time: '2d ago',   read: true,  type: 'visa'    },
];

const TYPE_COLORS = {
  ai:      'vividD',
  system:  'blueD',
  job:     'greenD',
  housing: 'goldD',
  legal:   'purpleD',
  health:  'tealD',
  comm:    'blueD',
  visa:    'vividD',
  social:  'greenD',
};

export default function NotificationsScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const [notifs, setNotifs] = useState(NOTIFS);

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const markRead    = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={s.badge}><Text style={s.badgeTxt}>{unreadCount}</Text></View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={s.markAll}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 70 }} />
        )}
      </View>

      <ScrollView style={s.list} contentContainerStyle={{ padding: 16, gap: 8 }} showsVerticalScrollIndicator={false}>
        {unreadCount > 0 && (
          <Text style={s.sectionLabel}>NEW · {unreadCount} unread</Text>
        )}

        {notifs.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[s.card, !n.read && s.cardUnread]}
            activeOpacity={0.8}
            onPress={() => markRead(n.id)}
          >
            <View style={[s.iconWrap, { backgroundColor: C[TYPE_COLORS[n.type]] }]}>
              <Text style={{ fontSize: 20 }}>{n.icon}</Text>
            </View>
            <View style={s.content}>
              <View style={s.topRow}>
                <Text style={[s.title, !n.read && s.titleUnread]} numberOfLines={1}>{n.title}</Text>
                {!n.read && <View style={s.unreadDot} />}
              </View>
              <Text style={s.body} numberOfLines={2}>{n.body}</Text>
              <Text style={s.time}>{n.time}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {notifs.every(n => n.read) && (
          <View style={s.allRead}>
            <Text style={{ fontSize: 36 }}>✅</Text>
            <Text style={s.allReadTxt}>You're all caught up!</Text>
            <Text style={s.allReadSub}>No new notifications</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.nav },
  back: { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 24, color: C.cream, lineHeight: 28 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.cream },
  badge: { backgroundColor: C.vivid, borderRadius: 50, paddingHorizontal: 7, paddingVertical: 2 },
  badgeTxt: { fontSize: 11, color: 'white', fontWeight: '700' },
  markAll: { fontSize: 12, color: C.vivid, fontWeight: '600' },
  list: { flex: 1 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  card: { flexDirection: 'row', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, alignItems: 'flex-start' },
  cardUnread: { borderColor: C.vivid + '33', backgroundColor: C.vividD },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  title: { flex: 1, fontSize: 13, fontWeight: '600', color: C.c60 },
  titleUnread: { color: C.cream, fontWeight: '700' },
  unreadDot: { width: 8, height: 8, backgroundColor: C.vivid, borderRadius: 4, flexShrink: 0 },
  body: { fontSize: 12, color: C.c35, lineHeight: 18, marginBottom: 4 },
  time: { fontSize: 10, color: C.c35, fontWeight: '500' },
  allRead: { alignItems: 'center', paddingTop: 60, gap: 10 },
  allReadTxt: { fontSize: 16, fontWeight: '700', color: C.cream },
  allReadSub: { fontSize: 13, color: C.c35 },
});
