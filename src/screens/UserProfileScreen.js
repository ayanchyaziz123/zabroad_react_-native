import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

// ─── User profiles keyed by handle ────────────────────────────────────
const USER_PROFILES = {
  '@tanvir_h': {
    avatar: '👨🏽', name: 'Tanvir Hossain', handle: '@tanvir_h',
    flag: '🇧🇩', origin: 'Bangladesh', loc: 'Queens, NY',
    visa: 'STEM OPT', joined: 'Jan 2023',
    bio: 'Software engineer hunting for H-1B sponsors. Love helping fellow Bangladeshis navigate the US immigration maze. Ask me anything about OPT!',
    followers: '312', following: '204', posts: '28',
    tags: ['STEM OPT', 'Java Dev', '3 yrs abroad'],
    badges: [{ icon: '💬', label: 'Helper' }, { icon: '🌍', label: 'Globetrotter' }],
    feed: [
      { id: 'p1', tag: 'Q&A',    title: 'Best OPT-friendly staffing agencies in NYC?',    body: 'TCS and Mastech keep ghosting me after phone screens. Any agencies that actually place OPT students in Java roles?', likes: 34, comments: 14, time: '18 min ago' },
      { id: 'p2', tag: 'TIP',    title: '5 things I wish I knew before starting OPT',     body: 'After 12 months on OPT I learned a lot the hard way. Here\'s my quick guide for new grads starting their OPT journey.', likes: 98, comments: 26, time: '3d ago' },
      { id: 'p3', tag: 'Q&A',    title: 'Can I freelance on STEM OPT?',                   body: 'My employer allows side projects. Can I take on freelance contracts as long as they are in my field of study?', likes: 41, comments: 18, time: '1w ago' },
    ],
  },
  '@aisha_k': {
    avatar: '👩🏾', name: 'Aisha Kamara', handle: '@aisha_k',
    flag: '🇳🇬', origin: 'Nigeria', loc: 'Bronx, NY',
    visa: 'Green Card (Pending)', joined: 'Mar 2022',
    bio: 'Community organizer & immigrant advocate. EAD approved after 9 months 🎉 Here to share my journey and help others navigate the process.',
    followers: '1.2K', following: '340', posts: '64',
    tags: ['Asylum', 'Community', '4 yrs abroad'],
    badges: [{ icon: '⭐', label: 'Top Rated' }, { icon: '💬', label: 'Helper' }, { icon: '🌍', label: 'Globetrotter' }],
    feed: [
      { id: 'p1', tag: 'WIN 🎉', title: 'EAD APPROVED after 9 months!!',                   body: 'After 9 months of waiting, endless RFEs and two attorney calls — my EAD is finally approved! Happy to share my timeline.', likes: 224, comments: 61, time: '1h ago' },
      { id: 'p2', tag: 'TIP',    title: 'How to survive the EAD wait without losing hope',  body: 'Month 7 of waiting was the hardest. Here\'s what helped me stay sane and productive during the long EAD wait.', likes: 156, comments: 33, time: '2w ago' },
      { id: 'p3', tag: 'Legal',  title: 'Finding pro bono immigration help in NYC',         body: 'A full list of free and sliding-scale immigration legal services in NYC — updated for 2026.', likes: 289, comments: 72, time: '1mo ago' },
    ],
  },
  '@yuna_nyc': {
    avatar: '👩🏻', name: 'Yuna Park', handle: '@yuna_nyc',
    flag: '🇰🇷', origin: 'South Korea', loc: 'Flushing, NY',
    visa: 'H-1B', joined: 'Aug 2023',
    bio: 'UX Designer at a NYC startup. Found my no-credit apartment and H-1B sponsor in the same year 🙌 Love Korean food and helping newcomers settle in.',
    followers: '540', following: '190', posts: '39',
    tags: ['H-1B', 'UX Design', '2 yrs abroad'],
    badges: [{ icon: '🌍', label: 'Globetrotter' }],
    feed: [
      { id: 'p1', tag: 'Housing', title: 'Found a no-credit-check 1BR in Flushing',         body: '$1,450/mo · No SSN required · 1 month deposit · Close to 7 train. Landlord is immigrant-friendly. DM me!', likes: 189, comments: 43, time: '2h ago' },
      { id: 'p2', tag: 'TIP',     title: 'How I built US credit from zero in 6 months',     body: 'Secured card + credit builder loan combo worked for me. Here\'s my exact step-by-step timeline.', likes: 211, comments: 57, time: '1w ago' },
      { id: 'p3', tag: 'JOBS',    title: 'Getting a UX job on OPT — my experience',         body: 'Took 4 months and 60+ applications but I got here. Here are the companies that were actually OPT-friendly in my experience.', likes: 144, comments: 38, time: '3w ago' },
    ],
  },
  '@marcus_t': {
    avatar: '👨🏿', name: 'Marcus Tesfaye', handle: '@marcus_t',
    flag: '🇪🇹', origin: 'Ethiopia', loc: 'Manhattan, NY',
    visa: 'Asylum Granted', joined: 'Jun 2021',
    bio: 'Asylum case approved after 2.5 years. Now helping others navigate the asylum process. Pro bono paralegal volunteer at Legal Aid NYC.',
    followers: '2.1K', following: '412', posts: '87',
    tags: ['Asylum', 'Legal Aid', '5 yrs abroad'],
    badges: [{ icon: '⭐', label: 'Top Rated' }, { icon: '💬', label: 'Helper' }, { icon: '🛡️', label: 'Advocate' }],
    feed: [
      { id: 'p1', tag: 'Legal',   title: 'Asylum case approved after 2.5 years — my story',  body: 'I want to share my full journey for anyone going through the process alone. It\'s brutal but possible.', likes: 418, comments: 92, time: '3h ago' },
      { id: 'p2', tag: 'TIP',     title: 'What asylum officers actually look for',            body: 'After going through the process and volunteering at Legal Aid, here\'s what I\'ve learned about what makes a strong case.', likes: 334, comments: 78, time: '2w ago' },
      { id: 'p3', tag: 'Q&A',     title: 'Can I travel internationally on a travel document?', body: 'My asylum was just granted. When can I apply for a refugee travel document and which countries can I visit?', likes: 97, comments: 31, time: '1mo ago' },
    ],
  },
  default: {
    avatar: '👤', name: 'Community Member', handle: '@member',
    flag: '🌍', origin: 'International', loc: 'New York, NY',
    visa: 'Immigrant', joined: '2024',
    bio: 'Member of the Zabroad community.',
    followers: '42', following: '80', posts: '5',
    tags: ['Immigrant', 'New York'],
    badges: [],
    feed: [],
  },
};

const TAG_BG = {
  'Q&A':     { bg: '#1A2C50', text: '#6EA8FE' },
  'WIN 🎉':  { bg: '#0F2D1E', text: '#52D68A' },
  'Housing': { bg: '#1A2A1A', text: '#86EFAC' },
  'Legal':   { bg: '#2A1F36', text: '#C084FC' },
  'JOBS':    { bg: '#2C1F0E', text: '#FDB970' },
  'TIP':     { bg: '#0F2D1E', text: '#86EFAC' },
};

function LikeButton({ count, s, C }) {
  const [liked, setLiked] = useState(false);
  const [n, setN] = useState(count);
  const scale = useRef(new Animated.Value(1)).current;
  function onPress() {
    setLiked(l => !l); setN(c => liked ? c - 1 : c + 1);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.5, useNativeDriver: true, speed: 50, bounciness: 16 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  }
  return (
    <TouchableOpacity style={s.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <Animated.Text style={{ fontSize: 15, transform: [{ scale }] }}>{liked ? '❤️' : '🤍'}</Animated.Text>
      <Text style={[s.actionTxt, liked && { color: '#FF6B6B' }]}>{n}</Text>
    </TouchableOpacity>
  );
}

export default function UserProfileScreen({ navigation, route }) {
  const handle  = route.params?.handle || 'default';
  const profile = USER_PROFILES[handle] || USER_PROFILES.default;

  const { colors: C, isDark } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(profile.followers);

  function toggleFollow() {
    setFollowing(f => !f);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>

        {/* Cover */}
        <LinearGradient
          colors={isDark ? ['#1E2438', '#0D0F1A'] : ['#EEF0FA', '#E4E7F5']}
          style={s.cover}
        >
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Text style={s.backTxt}>‹</Text>
          </TouchableOpacity>
          <Text style={s.coverFlag}>{profile.flag}</Text>
        </LinearGradient>

        {/* Avatar row */}
        <View style={s.avRow}>
          <View style={s.av}>
            <Text style={{ fontSize: 40 }}>{profile.avatar}</Text>
          </View>
          <View style={s.avActions}>
            <TouchableOpacity
              style={[s.followBtn, following ? s.followingStyle : s.followStyle]}
              onPress={toggleFollow}
              activeOpacity={0.85}
            >
              <Text style={[s.followBtnTxt, { color: following ? C.green : '#fff' }]}>
                {following ? '✓ Following' : '+ Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.msgBtn}
              onPress={() => navigation.navigate('AppMain', { screen: 'Chat' })}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16 }}>💬</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View style={s.info}>
          <Text style={s.name}>{profile.name}</Text>
          <Text style={s.handle}>{profile.handle} · {profile.loc}</Text>
          <Text style={s.bio}>{profile.bio}</Text>

          {/* Tags */}
          <View style={s.tagRow}>
            {profile.tags.map(t => (
              <View key={t} style={s.tag}><Text style={s.tagTxt}>{t}</Text></View>
            ))}
          </View>

          {/* Stats */}
          <View style={s.statsRow}>
            {[
              { val: profile.posts,     label: 'Posts'     },
              { val: followerCount,     label: 'Followers' },
              { val: profile.following, label: 'Following' },
            ].map(st => (
              <View key={st.label} style={s.statItem}>
                <Text style={s.statVal}>{st.val}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* About card */}
        <View style={s.section}>
          <View style={s.aboutCard}>
            {[
              { icon: '🌍', label: 'From',       val: `${profile.flag} ${profile.origin}` },
              { icon: '📋', label: 'Visa status', val: profile.visa },
              { icon: '📅', label: 'Joined',      val: profile.joined },
            ].map(row => (
              <View key={row.label} style={s.aboutRow}>
                <Text style={{ fontSize: 16 }}>{row.icon}</Text>
                <Text style={s.aboutLabel}>{row.label}</Text>
                <Text style={s.aboutVal}>{row.val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Badges */}
        {profile.badges.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>BADGES</Text>
            <View style={s.badgeRow}>
              {profile.badges.map(b => (
                <View key={b.label} style={s.badge}>
                  <Text style={{ fontSize: 22 }}>{b.icon}</Text>
                  <Text style={s.badgeLabel}>{b.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Posts */}
        {profile.feed.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>POSTS</Text>
            <View style={{ gap: 10 }}>
              {profile.feed.map(post => {
                const tagStyle = TAG_BG[post.tag] || TAG_BG['Q&A'];
                return (
                  <TouchableOpacity
                    key={post.id}
                    style={s.postCard}
                    onPress={() => navigation.navigate('PostDetail', { post: { ...post, avatar: profile.avatar, name: profile.name } })}
                    activeOpacity={0.9}
                  >
                    <View style={s.postHeader}>
                      <View style={[s.tagPill, { backgroundColor: tagStyle.bg }]}>
                        <Text style={[s.tagPillTxt, { color: tagStyle.text }]}>{post.tag}</Text>
                      </View>
                      <Text style={s.postTime}>{post.time}</Text>
                    </View>
                    <Text style={s.postTitle}>{post.title}</Text>
                    <Text style={s.postBody} numberOfLines={2}>{post.body}</Text>
                    <View style={s.postActions}>
                      <LikeButton count={post.likes} s={s} C={C} />
                      <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
                        <Text style={{ fontSize: 15 }}>💬</Text>
                        <Text style={s.actionTxt}>{post.comments}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
                        <Text style={{ fontSize: 15 }}>↗️</Text>
                        <Text style={s.actionTxt}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  cover:       { height: 140, justifyContent: 'space-between', padding: 16 },
  backBtn:     { width: 38, height: 38, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 13, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  backTxt:     { fontSize: 24, color: '#fff', lineHeight: 28 },
  coverFlag:   { fontSize: 48, alignSelf: 'flex-end', marginBottom: 4 },
  avRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, marginTop: -36 },
  av:          { width: 76, height: 76, borderRadius: 24, backgroundColor: C.card2, borderWidth: 3, borderColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  avActions:   { flexDirection: 'row', gap: 8, alignItems: 'center', paddingBottom: 4 },
  followBtn:   { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 50, borderWidth: 1 },
  followStyle: { backgroundColor: C.vivid, borderColor: C.vivid },
  followingStyle: { backgroundColor: C.greenD, borderColor: C.green + '44' },
  followBtnTxt:{ fontSize: 13, fontWeight: '700' },
  msgBtn:      { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  info:        { paddingHorizontal: 20, paddingTop: 14, gap: 8 },
  name:        { fontSize: 20, fontWeight: '800', color: C.cream, letterSpacing: -0.3 },
  handle:      { fontSize: 13, color: C.c35 },
  bio:         { fontSize: 14, color: C.c60, lineHeight: 21 },
  tagRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tag:         { backgroundColor: C.vividD, borderWidth: 1, borderColor: C.vivid + '33', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4 },
  tagTxt:      { fontSize: 11, color: C.vivid, fontWeight: '600' },
  statsRow:    { flexDirection: 'row', gap: 0, marginTop: 4, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: 'hidden' },
  statItem:    { flex: 1, alignItems: 'center', paddingVertical: 14, borderRightWidth: 1, borderRightColor: C.border },
  statVal:     { fontSize: 18, fontWeight: '800', color: C.cream },
  statLabel:   { fontSize: 10, color: C.c35, fontWeight: '600', marginTop: 2 },
  section:     { paddingHorizontal: 16, marginTop: 16 },
  sectionLabel:{ fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 10 },
  aboutCard:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: 'hidden' },
  aboutRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderBottomWidth: 1, borderBottomColor: C.border },
  aboutLabel:  { fontSize: 12, color: C.c35, fontWeight: '600', width: 90 },
  aboutVal:    { fontSize: 13, color: C.cream, fontWeight: '600', flex: 1 },
  badgeRow:    { flexDirection: 'row', gap: 10 },
  badge:       { alignItems: 'center', gap: 4, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  badgeLabel:  { fontSize: 10, color: C.c35, fontWeight: '600' },
  postCard:    { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, gap: 8 },
  postHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tagPill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  tagPillTxt:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  postTime:    { fontSize: 11, color: C.c35 },
  postTitle:   { fontSize: 14, fontWeight: '700', color: C.cream, lineHeight: 20 },
  postBody:    { fontSize: 13, color: C.c60, lineHeight: 19 },
  postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8, marginTop: 2 },
  actionBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionTxt:   { fontSize: 12, color: C.c35, fontWeight: '600' },
});
