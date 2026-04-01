import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';

const FEED_DATA = [
  {
    id: 'f0', type: 'featured', scope: 'bd_usa',
    avatar: '🤖', avatarBg: '#2D1B2E', name: 'Zabroad AI', handle: '@zabroad_ai',
    time: 'Pinned', location: null, tag: 'AI TIP', tagColor: '#E8364A',
    body: 'H-1B cap lottery opens April 1 — registration window is March 7–22. Make sure your employer has filed an LCA and your attorney has your docs ready.',
    likes: 312, comments: 74, route: 'AIAssistant',
    image: { emoji: '🤖', bg: ['#2D1B2E', '#1A0F1E'], label: 'H-1B Season 2026', sublabel: 'Act now · Deadline April 1' },
  },
  {
    id: 'f1', type: 'post', scope: 'local',
    avatar: '👨🏽', avatarBg: '#1A2035', name: 'Tanvir Hossain', handle: '@tanvir_h',
    time: '18 min ago', location: 'Queens, NY', tag: 'Q&A', tagColor: '#5B8DEF',
    body: 'Best OPT-friendly staffing agencies in NYC? TCS and Mastech keep ghosting me after phone screens. My EAD expires in 6 months 😟 Any leads?',
    likes: 34, comments: 14, route: 'PostDetail', image: null,
  },
  {
    id: 'f2', type: 'post', scope: 'local',
    avatar: '👩🏾', avatarBg: '#0F2018', name: 'Aisha Kamara', handle: '@aisha_k',
    time: '1h ago', location: 'Bronx, NY', tag: 'Win 🎉', tagColor: '#3EC878',
    body: 'EAD APPROVED after 9 months of waiting, endless RFEs and two attorney calls 🎉 For anyone still waiting — keep faith. Happy to share my full timeline.',
    likes: 224, comments: 61, route: 'PostDetail',
    image: { emoji: '📄', bg: ['#0F2018', '#0A1810'], label: 'EAD Card Approved ✓', sublabel: '9 months · Queens, NY' },
  },
  {
    id: 'f3', type: 'post', scope: 'local',
    avatar: '👩🏻', avatarBg: '#0F1E25', name: 'Yuna Park', handle: '@yuna_nyc',
    time: '2h ago', location: 'Flushing, NY', tag: 'Housing', tagColor: '#86EFAC',
    body: 'Found a no-credit-check 1BR in Flushing! $1,450/mo · No SSN required · 1 month deposit · Close to 7 train. Landlord is immigrant-friendly. DM me for info.',
    likes: 189, comments: 43, route: 'PostDetail',
    image: { emoji: '🏠', bg: ['#0F2018', '#0A1A14'], label: 'Flushing, Queens', sublabel: '$1,450/mo · No credit check' },
  },
  {
    id: 'f4', type: 'post', scope: 'bd_usa',
    avatar: '👨🏿', avatarBg: '#1E1225', name: 'Marcus Tesfaye', handle: '@marcus_t',
    time: '3h ago', location: 'Manhattan, NY', tag: 'Legal', tagColor: '#C084FC',
    body: 'Asylum case approved after 2.5 years. I want to share my journey for anyone going through this alone. It\'s brutal but possible. The key was a pro bono attorney.',
    likes: 418, comments: 92, route: 'PostDetail', image: null,
  },
  {
    id: 'f5', type: 'post', scope: 'global',
    avatar: '👩🏽', avatarBg: '#201A08', name: 'Priya Sharma', handle: '@priya_s',
    time: '4h ago', location: 'Jersey City, NJ', tag: 'Jobs', tagColor: '#FDB970',
    body: 'Got my H-1B transfer approved! Moving to Google NYC 🎉 Petition filed Oct 1st, approved in 3 weeks on premium processing. The fear is worse than the process.',
    likes: 502, comments: 108, route: 'PostDetail',
    image: { emoji: '🔍', bg: ['#1A1A08', '#121208'], label: 'Google NYC · H-1B Transfer', sublabel: 'Approved in 3 weeks · Premium' },
  },
  {
    id: 'f6', type: 'post', scope: 'local',
    avatar: '👨🏽', avatarBg: '#0F1A2A', name: 'Carlos Mendez', handle: '@carlosm',
    time: '5h ago', location: 'Brooklyn, NY', tag: 'Q&A', tagColor: '#5B8DEF',
    body: 'Can I work part-time on F-1 OPT while waiting for H-1B approval? I have a full-time offer + a consulting gig. Would it affect my cap-gap extension?',
    likes: 28, comments: 19, route: 'PostDetail', image: null,
  },
  {
    id: 'f7', type: 'event', scope: 'bd_usa',
    avatar: '⚖️', avatarBg: '#1A1025', name: 'Legal Aid NYC', handle: '@legalaidnyc',
    time: 'This Saturday', location: 'Downtown Manhattan', tag: 'Event', tagColor: '#C084FC',
    body: 'Free immigration consultation this Saturday! DACA renewals, asylum, visa renewals & green card. Walk-ins welcome. 10am–4pm at 199 Water St.',
    likes: 320, comments: 88, route: 'Attorney',
    image: { emoji: '⚖️', bg: ['#1A1025', '#100A18'], label: 'Free Legal Aid Event', sublabel: 'Sat 10am–4pm · 199 Water St' },
  },
  {
    id: 'f8', type: 'post', scope: 'local',
    avatar: '👩🏾', avatarBg: '#0F2018', name: 'Fatima Rahman', handle: '@fatima_r',
    time: '6h ago', location: 'Queens, NY', tag: 'Tip', tagColor: '#3EC878',
    body: 'How I got Medicaid in NYC as an immigrant — step by step. A lot of people don\'t know you can qualify on certain visa types. Apply at your local HRA office with your I-94.',
    likes: 276, comments: 53, route: 'PostDetail', image: null,
  },
  {
    id: 'f9', type: 'post', scope: 'global',
    avatar: '👩🏽', avatarBg: '#1A0F1E', name: 'Meera Iyer', handle: '@meera_nyc',
    time: '10h ago', location: 'Hoboken, NJ', tag: 'Q&A', tagColor: '#5B8DEF',
    body: 'Credit builder loan vs secured card for new immigrants? I moved here 4 months ago with zero credit history. Bank suggested secured card but I\'ve heard about Self. Which is better?',
    likes: 61, comments: 24, route: 'PostDetail', image: null,
  },
  {
    id: 'f10', type: 'post', scope: 'bd_usa',
    avatar: '👩🏽', avatarBg: '#1A1A08', name: 'Nadia Osei', handle: '@nadia_o',
    time: '14h ago', location: 'Queens, NY', tag: 'Housing', tagColor: '#86EFAC',
    body: 'Roommate wanted in Jackson Heights — immigrant-friendly building. $900/mo, no credit check, landlord accepts ITIN. Female preferred. Move-in April 1.',
    likes: 88, comments: 31, route: 'PostDetail',
    image: { emoji: '🏘️', bg: ['#0F1A10', '#0A1208'], label: 'Jackson Heights, Queens', sublabel: '$900/mo · ITIN accepted' },
  },
  {
    id: 'f11', type: 'post', scope: 'bd_all',
    avatar: '👨🏽', avatarBg: '#0F1A2A', name: 'Rafiq Islam', handle: '@rafiq_dhaka',
    time: '3h ago', location: 'London, UK', tag: 'Visa', tagColor: '#5B8DEF',
    body: 'Just got my UK Skilled Worker visa approved after moving from Dhaka! The process took 6 weeks. Happy to answer questions for anyone applying from Bangladesh.',
    likes: 203, comments: 47, route: 'PostDetail',
    image: { emoji: '🇬🇧', bg: ['#0F1A2A', '#080F1A'], label: 'UK Skilled Worker Visa ✓', sublabel: 'London · 6 weeks processing' },
  },
  {
    id: 'f12', type: 'post', scope: 'bd_all',
    avatar: '👩🏽', avatarBg: '#1A1008', name: 'Sumaiya Akter', handle: '@sumaiya_ca',
    time: '7h ago', location: 'Toronto, Canada', tag: 'Jobs', tagColor: '#FDB970',
    body: 'Bangladeshi tech professionals in Canada — there\'s a growing community in Toronto. Just joined a BD engineers group here with 400+ members. DM for the invite link.',
    likes: 156, comments: 62, route: 'PostDetail', image: null,
  },
];

// SCOPES are built dynamically from the user's home country — see HomeScreen component

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Good morning ☀️';
  if (h >= 12 && h < 17) return 'Good afternoon 🌤';
  if (h >= 17 && h < 21) return 'Good evening 🌆';
  return 'Good night 🌙';
}


function LikeButton({ count, s, C }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(count);
  const scale = useRef(new Animated.Value(1)).current;
  function onPress() {
    setLiked(l => !l);
    setLikeCount(c => liked ? c - 1 : c + 1);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.5, useNativeDriver: true, speed: 50, bounciness: 16 }),
      Animated.spring(scale, { toValue: 1,   useNativeDriver: true, speed: 20 }),
    ]).start();
  }
  return (
    <TouchableOpacity style={s.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <Animated.Text style={{ fontSize: 15, transform: [{ scale }] }}>{liked ? '❤️' : '🤍'}</Animated.Text>
      <Text style={[s.actionTxt, liked && { color: '#FF6B6B' }]}>{likeCount}</Text>
    </TouchableOpacity>
  );
}

function SaveButton({ s, C }) {
  const [saved, setSaved] = useState(false);
  return (
    <TouchableOpacity style={s.actionBtn} onPress={() => setSaved(v => !v)} activeOpacity={0.7}>
      <Text style={{ fontSize: 15 }}>{saved ? '🔖' : '🏷️'}</Text>
      <Text style={[s.actionTxt, saved && { color: C.gold }]}>{saved ? 'Saved' : 'Save'}</Text>
    </TouchableOpacity>
  );
}

function FeedCard({ item, navigation, C, s }) {
  function handlePress() {
    navigation.navigate(item.route, item.route === 'PostDetail' ? { post: item } : undefined);
  }

  return (
    <TouchableOpacity style={s.feedCard} onPress={handlePress} activeOpacity={0.96}>

      {/* Author row */}
      <View style={s.feedHeader}>
        <TouchableOpacity
          style={[s.feedAvatar, { backgroundColor: item.avatarBg }]}
          onPress={() => item.handle && navigation.navigate('UserProfile', { handle: item.handle })}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 19 }}>{item.avatar}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.feedName}>{item.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <Text style={s.feedMeta}>{item.time}</Text>
            {item.location && <Text style={s.feedMeta}>· 📍 {item.location}</Text>}
          </View>
        </View>
        <View style={[s.tagPill, { backgroundColor: item.tagColor + '18' }]}>
          <Text style={[s.tagTxt, { color: item.tagColor }]}>{item.tag}</Text>
        </View>
      </View>

      {/* Body text */}
      <Text style={s.feedBody} numberOfLines={item.image ? 2 : 4}>{item.body}</Text>

      {/* Image card */}
      {item.image && (
        <LinearGradient colors={item.image.bg} style={s.feedImage}>
          <Text style={{ fontSize: 44 }}>{item.image.emoji}</Text>
          <View>
            <Text style={s.feedImageLabel}>{item.image.label}</Text>
            <Text style={s.feedImageSub}>{item.image.sublabel}</Text>
          </View>
        </LinearGradient>
      )}

      {/* Actions */}
      <View style={s.feedActions}>
        <LikeButton count={item.likes} s={s} C={C} />
        <TouchableOpacity style={s.actionBtn} onPress={handlePress} activeOpacity={0.7}>
          <Text style={s.actionIcon}>💬</Text>
          <Text style={s.actionTxt}>{item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
          <Text style={s.actionIcon}>↗️</Text>
          <Text style={s.actionTxt}>Share</Text>
        </TouchableOpacity>
        <SaveButton s={s} C={C} />
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { colors: C, isDark } = useTheme();
  const { user } = useUser();
  const s = useMemo(() => getStyles(C), [C]);

  const country = user.homeCountry; // { flag, name }

  // Build scope tabs dynamically from user's home country
  const SCOPES = useMemo(() => [
    {
      key: 'c_local',
      label: `${country.flag} in USA`,
      hint: `${country.name} community in the United States`,
    },
    {
      key: 'c_global',
      label: `${country.flag} Worldwide`,
      hint: `${country.name}s across all countries`,
    },
    {
      key: 'local',
      label: '📍 Local',
      hint: `Posts near ${user.livesIn || 'your area'}`,
    },
    {
      key: 'global',
      label: '🌍 Global',
      hint: 'Everyone on Zabroad worldwide',
    },
  ], [country, user.livesIn]);

  const [activeScope, setActiveScope] = useState('c_local');

  const activeScopeData = SCOPES.find(sc => sc.key === activeScope);

  const filteredFeed = useMemo(() => {
    if (activeScope === 'global') return FEED_DATA;
    if (activeScope === 'c_global') return FEED_DATA.filter(i => i.scope === 'bd_usa' || i.scope === 'bd_all');
    if (activeScope === 'c_local')  return FEED_DATA.filter(i => i.scope === 'bd_usa');
    return FEED_DATA.filter(i => i.scope === activeScope);
  }, [activeScope]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.av}>
            <Text style={{ fontSize: 20 }}>🧑‍💻</Text>
            <View style={s.avOnline} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.uname}>{user.name}</Text>
            <Text style={s.locationChipTxt}>📍 {user.livesIn || 'Set location'}</Text>
          </View>
          <TouchableOpacity style={s.aiBtn} onPress={() => navigation.navigate('AIAssistant')} activeOpacity={0.8}>
            <Text style={{ fontSize: 14 }}>🤖</Text>
            <Text style={s.aiBtnTxt}>AI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <Text style={{ fontSize: 17 }}>🔔</Text>
            <View style={s.notifDot} />
          </TouchableOpacity>
        </View>

        {/* ── COMPOSE BAR ────────────────────────────────────────── */}
        <TouchableOpacity style={s.composeBar} onPress={() => navigation.navigate('CreatePost')} activeOpacity={0.9}>
          <View style={s.composeAv}>
            <Text style={{ fontSize: 18 }}>🧑‍💻</Text>
          </View>
          <Text style={s.composeTxt}>What's on your mind?</Text>
          <View style={s.composeDivider} />
          <Text style={{ fontSize: 18 }}>📷</Text>
        </TouchableOpacity>


        {/* ── SCOPE FILTER TABS ──────────────────────────────────── */}
        <View style={s.scopeContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 14, paddingVertical: 2 }}>
            {SCOPES.map(sc => {
              const isActive = sc.key === activeScope;
              return (
                <TouchableOpacity
                  key={sc.key}
                  style={[s.scopeTab, isActive && s.scopeTabActive]}
                  onPress={() => setActiveScope(sc.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.scopeTabTxt, isActive && s.scopeTabTxtActive]}>{sc.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={s.scopeHint}>
            <Text style={s.scopeHintTxt}>{activeScopeData?.hint}</Text>
            <Text style={s.scopeCount}>{filteredFeed.length} posts</Text>
          </View>
        </View>

        {/* ── FEED ───────────────────────────────────────────────── */}
        <View style={s.feedList}>
          {filteredFeed.length === 0 && (
            <View style={s.emptyState}>
              <Text style={{ fontSize: 36 }}>📭</Text>
              <Text style={s.emptyTitle}>Nothing here yet</Text>
              <Text style={s.emptySubtitle}>Be the first to post in this scope!</Text>
            </View>
          )}
          {filteredFeed.map(item => (
            <FeedCard key={item.id} item={item} navigation={navigation} C={C} s={s} />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // Header — single compact row
  header:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8 },
  av:             { width: 36, height: 36, borderRadius: 12, backgroundColor: C.vivid, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(232,54,74,0.3)' },
  avOnline:       { position: 'absolute', bottom: -2, right: -2, width: 9, height: 9, backgroundColor: C.green, borderRadius: 5, borderWidth: 2, borderColor: C.bg },
  uname:          { fontSize: 13, fontWeight: '700', color: C.cream },
  locationChipTxt:{ fontSize: 10, color: C.c35, marginTop: 1 },
  aiBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.vividD, borderWidth: 1, borderColor: C.vivid + '55', borderRadius: 20 },
  aiBtnTxt:       { fontSize: 11, fontWeight: '800', color: C.vivid },
  notifBtn:       { width: 34, height: 34, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  notifDot:       { position: 'absolute', top: 6, right: 6, width: 7, height: 7, backgroundColor: C.vivid, borderRadius: 4, borderWidth: 2, borderColor: C.bg },

  // Compose bar
  composeBar:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 14, marginTop: 8, marginBottom: 2, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  composeAv:      { width: 32, height: 32, borderRadius: 10, backgroundColor: C.vividD, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  composeTxt:     { flex: 1, fontSize: 13, color: C.c35 },
  composeDivider: { width: 1, height: 20, backgroundColor: C.border },

  // Scope filter
  scopeContainer:    { marginTop: 10 },
  scopeTab:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  scopeTabActive:    { backgroundColor: C.vividD, borderColor: C.vivid + '66' },
  scopeTabTxt:       { fontSize: 12, fontWeight: '600', color: C.c35 },
  scopeTabTxtActive: { color: C.vivid, fontWeight: '700' },
  scopeHint:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, marginTop: 6, marginBottom: 2 },
  scopeHintTxt:      { fontSize: 11, color: C.c35 },
  scopeCount:        { fontSize: 11, fontWeight: '700', color: C.c35 },

  // Feed
  feedList:       { gap: 1, marginTop: 8 },
  feedCard:       { backgroundColor: C.card, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border, paddingBottom: 4 },
  feedHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  feedAvatar:     { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  feedName:       { fontSize: 14, fontWeight: '700', color: C.cream },
  feedMeta:       { fontSize: 11, color: C.c35 },
  tagPill:        { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 50, flexShrink: 0 },
  tagTxt:         { fontSize: 10, fontWeight: '700' },
  feedBody:       { fontSize: 14, color: C.c60, lineHeight: 21, paddingHorizontal: 14, marginBottom: 12 },
  feedImage:      { marginHorizontal: 14, marginBottom: 12, borderRadius: 16, height: 160, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, overflow: 'hidden' },
  feedImageLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  feedImageSub:   { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 },
  feedActions:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4, borderTopWidth: 1, borderTopColor: C.border },
  actionBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8 },
  actionIcon:     { fontSize: 16 },
  actionTxt:      { fontSize: 13, color: C.c35, fontWeight: '600' },

  // Empty state
  emptyState:    { alignItems: 'center', paddingVertical: 50, gap: 8 },
  emptyTitle:    { fontSize: 15, fontWeight: '700', color: C.cream },
  emptySubtitle: { fontSize: 13, color: C.c35 },
});
