import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Animated,
  RefreshControl, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import UserAvatar from '../components/UserAvatar';

const COVER_HEIGHT = 180;
const AVATAR_SIZE  = 84;
const AVATAR_HALF  = AVATAR_SIZE / 2;

function formatTime(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)     return 'Just now';
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Post card ──────────────────────────────────────────────────────────────────
function PostCard({ post, navigation, C, s }) {
  const [liked, setLiked] = useState(post.is_liked || false);
  const [count, setCount] = useState(post.likes_count || 0);
  const { api } = useAuthStore();
  const scale = useRef(new Animated.Value(1)).current;

  async function onLike() {
    const next = !liked;
    setLiked(next);
    setCount(c => next ? c + 1 : c - 1);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.35, useNativeDriver: true, speed: 60, bounciness: 18 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }),
    ]).start();
    try {
      const res = await api(`/posts/${post.id}/like/`, { method: 'POST' });
      setLiked(res.liked);
      setCount(res.likes_count);
    } catch {
      setLiked(liked);
      setCount(c => next ? c - 1 : c + 1);
    }
  }

  return (
    <TouchableOpacity
      style={s.postCard}
      onPress={() => navigation.navigate('PostDetail', { post })}
      activeOpacity={0.88}
    >
      <Text style={s.postBody} numberOfLines={4}>{post.body}</Text>
      {post.topics_list?.length > 0 && (
        <View style={s.postTopics}>
          {post.topics_list.slice(0, 3).map(t => (
            <View key={t} style={[s.topicChip, { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]}>
              <Text style={[s.topicTxt, { color: C.vivid }]}>#{t}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={s.postFooter}>
        <TouchableOpacity style={s.postStat} onPress={onLike} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={14} color={liked ? '#F4A227' : C.c35} />
          </Animated.View>
          <Text style={[s.postStatTxt, liked && { color: '#F4A227' }]}>{count}</Text>
        </TouchableOpacity>
        <View style={s.postStat}>
          <Ionicons name="chatbubble-ellipses-outline" size={13} color={C.c35} />
          <Text style={s.postStatTxt}>{post.comments_count || 0}</Text>
        </View>
        <Text style={s.postTime}>{formatTime(post.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function UserProfileScreen({ navigation, route }) {
  const userId = route.params?.userId;
  const { colors: C, isDark } = useTheme();
  const { api, user: currentUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const s = useMemo(() => getStyles(C), [C]);

  const [profile,    setProfile]    = useState(null);
  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');

  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (!userId) { setError('No user ID provided.'); setLoading(false); return; }
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const data = await api(`/auth/profile/${userId}/`);
      setProfile(data.user);
      setPosts(data.posts || []);
    } catch {
      setError('Could not load profile.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile(true);
  }, [fetchProfile]);

  const isOwnProfile = currentUser?.id === userId;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[s.safe, { paddingTop: insets.top }]}>
        <TouchableOpacity style={[s.floatBack, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <View style={s.centerState}>
          <ActivityIndicator size="large" color={C.vivid} />
        </View>
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !profile) {
    return (
      <View style={[s.safe, { paddingTop: insets.top }]}>
        <TouchableOpacity style={[s.floatBack, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <View style={s.centerState}>
          <Ionicons name="person-outline" size={52} color={C.c35} />
          <Text style={s.errorTxt}>{error || 'Profile not found'}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => fetchProfile()} activeOpacity={0.85}>
            <Text style={s.retryTxt}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const p           = profile.profile || {};
  const name        = profile.name    || profile.email || 'User';
  const handle      = p.handle        || '';
  const avatarUrl   = p.avatar_url    || null;
  const coverUrl    = p.cover_url     || null;
  const avatarEmoji = p.avatar_emoji  || '🧑‍💻';
  const homeCountry = p.home_country  || '';
  const countryFlag = p.country_flag  || '';
  const livesIn     = p.lives_in      || '';
  const bio         = p.bio           || '';

  return (
    <View style={s.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.vivid} />}
      >
        {/* ── Cover photo ──────────────────────────────────────────── */}
        <View style={s.cover}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={isDark
                ? ['#1B2340', '#0E1428', '#080C18']
                : ['#C9D4F5', '#A8B8EE', '#8EA4E8']}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />
          )}
          {/* Bottom fade into background */}
          <LinearGradient
            colors={['transparent', C.bg]}
            locations={[0.5, 1]}
            style={s.coverFade}
          />
          {/* Back button */}
          <TouchableOpacity
            style={[s.floatBack, { top: insets.top + 10 }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ── Avatar + action button ────────────────────────────────── */}
        <View style={s.avatarSection}>
          <View style={s.avatarRing}>
            <UserAvatar uri={avatarUrl} emoji={avatarEmoji} name={name} size={AVATAR_SIZE} bg={C.vividD} />
          </View>

          {isOwnProfile ? (
            <TouchableOpacity
              style={s.actionBtn}
              onPress={() => navigation.navigate('AppMain', { screen: 'Profile' })}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={15} color={C.cream} />
              <Text style={s.actionBtnTxt}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.actionBtn, s.actionBtnPrimary]}
              onPress={() => navigation.navigate('AppMain', { screen: 'Chat', params: { userId } })}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={15} color="#fff" />
              <Text style={[s.actionBtnTxt, { color: '#fff' }]}>Message</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Identity ─────────────────────────────────────────────── */}
        <View style={s.identity}>
          <Text style={s.name}>{name}</Text>
          {handle ? <Text style={s.handle}>@{handle.replace(/^@/, '')}</Text> : null}
          {bio ? <Text style={s.bio}>{bio}</Text> : null}

          {/* Location chips */}
          {(homeCountry || livesIn) ? (
            <View style={s.chips}>
              {homeCountry ? (
                <View style={s.chip}>
                  <Text style={s.chipEmoji}>{countryFlag}</Text>
                  <Text style={s.chipTxt}>{homeCountry}</Text>
                </View>
              ) : null}
              {livesIn ? (
                <View style={s.chip}>
                  <Ionicons name="location-outline" size={12} color={C.c35} />
                  <Text style={s.chipTxt}>{livesIn}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ── Stats ────────────────────────────────────────────────── */}
        <View style={s.statsRow}>
          <View style={[s.statItem, { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: C.border }]}>
            <Text style={s.statVal}>{posts.length}</Text>
            <Text style={s.statLabel}>Posts</Text>
          </View>
          <View style={[s.statItem, { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: C.border }]}>
            <Text style={s.statVal}>{countryFlag || '🌍'}</Text>
            <Text style={s.statLabel} numberOfLines={1}>{homeCountry || 'Global'}</Text>
          </View>
          <View style={s.statItem}>
            <Text style={s.statVal} numberOfLines={1}>{livesIn ? livesIn.split(',')[0] : '—'}</Text>
            <Text style={s.statLabel}>Based in</Text>
          </View>
        </View>

        {/* ── Divider ──────────────────────────────────────────────── */}
        <View style={s.divider} />

        {/* ── Posts section ────────────────────────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Posts</Text>
            <View style={s.sectionBadge}>
              <Text style={s.sectionBadgeTxt}>{posts.length}</Text>
            </View>
          </View>

          {posts.length === 0 ? (
            <View style={s.emptyState}>
              <View style={[s.emptyIcon, { backgroundColor: C.card }]}>
                <Ionicons name="document-text-outline" size={28} color={C.c35} />
              </View>
              <Text style={s.emptyTxt}>No public posts yet</Text>
              <Text style={s.emptySub}>
                {isOwnProfile ? 'Share your first post with the community' : `${name.split(' ')[0]} hasn't posted yet`}
              </Text>
            </View>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post} navigation={navigation} C={C} s={s} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const getStyles = (C) => StyleSheet.create({
  safe:  { flex: 1, backgroundColor: C.bg },

  // Cover
  cover:     { height: COVER_HEIGHT, position: 'relative' },
  coverFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 80 },
  floatBack: {
    position: 'absolute', left: 14,
    width: 38, height: 38, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },

  // Avatar section
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: -(AVATAR_HALF + 6),
    zIndex: 5,
  },
  avatarRing: {
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2,
    borderWidth: 3,
    borderColor: C.bg,
    backgroundColor: C.vividD,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
    borderColor: C.border, backgroundColor: C.card,
    marginBottom: 4,
  },
  actionBtnPrimary: { backgroundColor: C.vivid, borderColor: C.vivid },
  actionBtnTxt: { fontSize: 13, fontWeight: '700', color: C.cream },

  // Identity
  identity: { paddingHorizontal: 20, paddingTop: 14, gap: 5 },
  name:     { fontSize: 22, fontWeight: '800', color: C.cream, letterSpacing: -0.4 },
  handle:   { fontSize: 13, color: C.c35 },
  bio:      { fontSize: 14, color: C.c60, lineHeight: 22, marginTop: 2 },
  chips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  chipEmoji:{ fontSize: 13 },
  chipTxt:  { fontSize: 12, fontWeight: '600', color: C.c35 },

  // Stats
  statsRow:  { flexDirection: 'row', marginHorizontal: 18, marginTop: 18, borderRadius: 18, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, overflow: 'hidden' },
  statItem:  { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  statVal:   { fontSize: 15, fontWeight: '800', color: C.cream, textAlign: 'center', paddingHorizontal: 4 },
  statLabel: { fontSize: 10, fontWeight: '600', color: C.c35, textTransform: 'uppercase', letterSpacing: 0.5 },

  divider:   { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginHorizontal: 18, marginTop: 22 },

  // Posts section
  section:       { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle:  { fontSize: 16, fontWeight: '800', color: C.cream },
  sectionBadge:  { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 50, paddingHorizontal: 8, paddingVertical: 2 },
  sectionBadgeTxt: { fontSize: 11, fontWeight: '700', color: C.c35 },

  // Post cards
  postCard:    { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  postBody:    { fontSize: 14, color: C.c60, lineHeight: 22, marginBottom: 10 },
  postTopics:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  topicChip:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, borderWidth: 1 },
  topicTxt:    { fontSize: 10, fontWeight: '700' },
  postFooter:  { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
  postStat:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postStatTxt: { fontSize: 12, fontWeight: '600', color: C.c35 },
  postTime:    { marginLeft: 'auto', fontSize: 11, color: C.c35 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon:  { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTxt:   { fontSize: 15, fontWeight: '700', color: C.cream },
  emptySub:   { fontSize: 13, color: C.c35, textAlign: 'center', paddingHorizontal: 30, lineHeight: 20 },

  // States
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingTop: 100 },
  errorTxt:    { fontSize: 15, fontWeight: '700', color: C.cream },
  retryBtn:    { paddingHorizontal: 28, paddingVertical: 11, borderRadius: 12, backgroundColor: C.vivid },
  retryTxt:    { fontSize: 13, fontWeight: '700', color: 'white' },
});
