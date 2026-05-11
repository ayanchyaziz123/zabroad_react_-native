import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  RefreshControl, Image, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import UserAvatar from '../components/UserAvatar';

const AVATAR_BG_COLORS = ['#1A2035', '#0F2018', '#1A1408', '#0A1820', '#130F20', '#1A1025', '#1A1A08', '#0F1A2A'];
function getAvatarBg(handle) {
  if (!handle) return AVATAR_BG_COLORS[0];
  return AVATAR_BG_COLORS[handle.charCodeAt(0) % AVATAR_BG_COLORS.length];
}

function formatTime(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function PostCard({ post, C, s, api, navigation }) {
  const [liked,  setLiked]  = useState(post.is_liked || false);
  const [likes,  setLikes]  = useState(post.likes_count || 0);
  const [saved,  setSaved]  = useState(post.is_saved || false);
  const heartScale = useRef(new Animated.Value(1)).current;

  async function onLike() {
    const next = !liked;
    setLiked(next);
    setLikes(c => next ? c + 1 : c - 1);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.35, useNativeDriver: true, speed: 60, bounciness: 20 }),
      Animated.spring(heartScale, { toValue: 1,    useNativeDriver: true, speed: 30 }),
    ]).start();
    try {
      const res = await api(`/posts/${post.id}/like/`, { method: 'POST' });
      setLiked(res.liked);
      setLikes(res.likes_count);
    } catch {
      setLiked(liked);
      setLikes(c => next ? c - 1 : c + 1);
    }
  }

  function handlePress() { navigation.navigate('PostDetail', { post }); }

  return (
    <TouchableOpacity style={s.card} onPress={handlePress} activeOpacity={0.92}>
      <View style={s.cardHeader}>
        <TouchableOpacity
          onPress={() => post.author_id && navigation.navigate('UserProfile', { userId: post.author_id })}
          activeOpacity={0.85}
        >
          <View style={s.avatarRing}>
            <UserAvatar
              uri={post.author_avatar_url}
              emoji={post.author_avatar}
              name={post.author_name}
              size={36}
              bg={getAvatarBg(post.author_handle)}
            />
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={s.authorName}>{post.author_name}</Text>
            {post.author_country_flag ? <Text style={{ fontSize: 13 }}>{post.author_country_flag}</Text> : null}
            {post.is_anonymous && (
              <View style={[s.anonBadge, { backgroundColor: C.card2, borderColor: C.border }]}>
                <Ionicons name="glasses-outline" size={10} color={C.c35} />
              </View>
            )}
          </View>
          {post.location ? (
            <Text style={s.authorMeta}>📍 {post.location}</Text>
          ) : null}
        </View>
        <Text style={s.timeStr}>{formatTime(post.created_at)}</Text>
      </View>

      <Text style={s.body} numberOfLines={6}>{post.body}</Text>

      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={s.cardImage} resizeMode="cover" />
      ) : null}

      {post.topics_list?.length > 0 && (
        <View style={s.topicsRow}>
          {post.topics_list.map(t => (
            <View key={t} style={[s.topicChip, { backgroundColor: C.card2, borderColor: C.border }]}>
              <Text style={[s.topicChipTxt, { color: C.c35 }]}>#{t}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={s.footer}>
        <TouchableOpacity style={s.footerBtn} onPress={handlePress} activeOpacity={0.75}>
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={C.c35} />
          <Text style={s.footerTxt}>
            {post.comments_count > 0 ? `${post.comments_count} replies` : 'Reply'}
          </Text>
        </TouchableOpacity>

        <Text style={s.dot}>·</Text>

        <TouchableOpacity style={s.footerBtn} onPress={onLike} activeOpacity={0.75}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={liked ? 'thumbs-up' : 'thumbs-up-outline'}
              size={14}
              color={liked ? '#F4A227' : C.c35}
            />
          </Animated.View>
          <Text style={[s.footerTxt, liked && { color: '#F4A227' }]}>
            {likes > 0 ? `${likes} Helpful` : 'Helpful'}
          </Text>
        </TouchableOpacity>

        <Text style={s.dot}>·</Text>

        <TouchableOpacity style={s.footerBtn} onPress={async () => {
          const next = !saved;
          setSaved(next);
          try { await api(`/posts/${post.id}/save/`, { method: 'POST' }); }
          catch { setSaved(!next); }
        }} activeOpacity={0.75}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={14} color={saved ? '#3B8BF7' : C.c35} />
          <Text style={[s.footerTxt, saved && { color: '#3B8BF7' }]}>{saved ? 'Saved' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function CommunityPostsScreen({ navigation, route }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const { api, user } = useAuthStore();
  const currentCity  = useLocationStore(st => st.city);
  const gpsLat       = useLocationStore(st => st.latitude);
  const gpsLng       = useLocationStore(st => st.longitude);
  const homeCountry  = user?.profile?.home_country || '';
  const countryFlag  = user?.profile?.country_flag || '';

  const initialScope = route?.params?.scope || 'country';
  const [scope,      setScope]      = useState(initialScope);
  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');

  const debounceRef = useRef(null);

  const buildUrl = useCallback((sc, q = '') => {
    const parts = [];
    if (sc === 'country' && homeCountry) parts.push(`country=${encodeURIComponent(homeCountry)}`);
    if (gpsLat != null && gpsLng != null) { parts.push(`lat=${gpsLat}&lng=${gpsLng}`); }
    else if (currentCity) { parts.push(`near_city=${encodeURIComponent(currentCity)}`); }
    if (q.trim()) parts.push(`search=${encodeURIComponent(q.trim())}`);
    return parts.length ? `/posts/?${parts.join('&')}` : '/posts/';
  }, [homeCountry, currentCity, gpsLat, gpsLng]);

  const fetchPosts = useCallback(async (sc = scope, q = search, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const data = await api(buildUrl(sc, q));
      setPosts(Array.isArray(data) ? data : (data.results || []));
    } catch (e) {
      setError(e.message || 'Failed to load posts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, buildUrl, scope, search]);

  useFocusEffect(useCallback(() => { fetchPosts(scope, search); }, [scope]));

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPosts(scope, search), 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts(scope, search, true);
  }, [fetchPosts, scope, search]);

  function handleScope(sc) {
    setScope(sc);
    fetchPosts(sc, search);
  }

  const renderItem = useCallback(({ item }) => (
    <PostCard post={item} C={C} s={s} api={api} navigation={navigation} />
  ), [C, s, api, navigation]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color={C.cream} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Community Posts</Text>
          <Text style={s.headerSub}>{currentCity?.split(',')[0] || 'Nearby'}</Text>
        </View>
        <TouchableOpacity style={s.postBtn} onPress={() => navigation.navigate('CreatePost')} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color={C.cream} />
          <Text style={s.postBtnTxt}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* Scope toggle */}
      <View style={s.segmentWrap}>
        <TouchableOpacity
          style={[s.segmentBtn, scope === 'country' && s.segmentBtnActive]}
          onPress={() => handleScope('country')}
          activeOpacity={0.8}
        >
          <Text style={[s.segmentTxt, scope === 'country' && s.segmentTxtActive]}>
            {countryFlag ? `${countryFlag} ` : ''}{homeCountry || 'My Roots'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.segmentBtn, scope === 'all' && s.segmentBtnActive]}
          onPress={() => handleScope('all')}
          activeOpacity={0.8}
        >
          <Text style={[s.segmentTxt, scope === 'all' && s.segmentTxtActive]}>🌍 Everyone</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={[s.searchBox, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="search-outline" size={15} color={C.c35} />
          <TextInput
            style={[s.searchInput, { color: C.cream }]}
            placeholder="Search posts…"
            placeholderTextColor={C.c35}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={15} color={C.c35} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.centerState}>
          <ActivityIndicator size="large" color="#3B8BF7" />
        </View>
      ) : error ? (
        <View style={s.centerState}>
          <Text style={{ fontSize: 32 }}>⚠️</Text>
          <Text style={[s.emptyTitle, { color: C.cream }]}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => fetchPosts(scope, search)}>
            <Text style={s.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B8BF7" />}
          ListHeaderComponent={
            posts.length > 0 ? (
              <Text style={[s.countLabel, { color: C.c35 }]}>
                {posts.length} POST{posts.length !== 1 ? 'S' : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.centerState}>
              <Text style={{ fontSize: 40 }}>📭</Text>
              <Text style={[s.emptyTitle, { color: C.cream }]}>No posts yet</Text>
              <Text style={[s.emptyTitle, { color: C.c35, fontSize: 13, fontWeight: '500' }]}>
                {scope === 'country'
                  ? `No posts from ${homeCountry} community yet`
                  : 'Be the first to post something!'}
              </Text>
              <TouchableOpacity style={s.retryBtn} onPress={() => navigation.navigate('CreatePost')}>
                <Text style={s.retryTxt}>Create a post</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10 },
  backBtn:     { width: 34, height: 34, borderRadius: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: C.cream },
  headerSub:   { fontSize: 11, color: C.c35, marginTop: 1 },
  postBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  postBtnTxt:  { fontSize: 13, fontWeight: '700', color: C.cream },

  segmentWrap:      { flexDirection: 'row', marginHorizontal: 14, marginVertical: 10, backgroundColor: C.card, borderRadius: 14, padding: 3, borderWidth: 1, borderColor: C.border },
  segmentBtn:       { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 11 },
  segmentBtnActive: { backgroundColor: C.vividD },
  segmentTxt:       { fontSize: 13, fontWeight: '700', color: C.c35 },
  segmentTxtActive: { color: C.vivid },

  searchWrap:  { paddingHorizontal: 14, paddingBottom: 10 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },

  countLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },

  card: {
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    elevation: 1,
  },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 8 },
  avatarRing:  { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#3B8BF7', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  authorName:  { fontSize: 14, fontWeight: '700', color: C.cream },
  authorMeta:  { fontSize: 11, color: C.c35, marginTop: 2 },
  anonBadge:   { width: 18, height: 18, borderRadius: 5, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  timeStr:     { fontSize: 11, color: C.c35 },
  body:        { fontSize: 14, color: C.c60, lineHeight: 21, paddingHorizontal: 14, paddingBottom: 10 },
  cardImage:   { width: '100%', height: 200, backgroundColor: C.card2 },
  topicsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingBottom: 10 },
  topicChip:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50, borderWidth: 1 },
  topicChipTxt:{ fontSize: 11, fontWeight: '600' },

  footer:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, gap: 6 },
  footerBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerTxt:  { fontSize: 12, fontWeight: '600', color: C.c35 },
  dot:        { fontSize: 10, color: C.c35 },

  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30 },
  emptyTitle:  { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  retryBtn:    { marginTop: 4, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: '#3B8BF7' },
  retryTxt:    { fontSize: 13, fontWeight: '700', color: '#fff' },
});
