import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Modal, TextInput,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import { useAuthStore } from '../store/authStore';
import UserAvatar from '../components/UserAvatar';

const NEARBY_RESOURCES = [
  { id: 'r1', category: 'Jobs',      icon: 'briefcase-outline',        color: '#3EC878', bg: '#0F2018', count: 14, route: 'Jobs'       },
  { id: 'r2', category: 'Housing',   icon: 'home-outline',             color: '#F5A623', bg: '#1A1408', count: 8,  route: 'Housing'    },
  // TODO: re-enable when Healthcare screen is ready
  // { id: 'r3', category: 'Doctors', icon: 'medkit-outline', color: '#5BCFEF', bg: '#0A1820', count: 6, route: 'Healthcare' },
  { id: 'r4', category: 'Attorneys', icon: 'shield-checkmark-outline', color: '#9B72EF', bg: '#130F20', count: 5,  route: 'Attorney'   },
];

const SUGGESTED_CITIES = [
  { name: 'Queens, NY',        lat: 40.7282,  lng: -73.7949 },
  { name: 'Brooklyn, NY',      lat: 40.6782,  lng: -73.9442 },
  { name: 'Manhattan, NY',     lat: 40.7831,  lng: -73.9712 },
  { name: 'Bronx, NY',         lat: 40.8448,  lng: -73.8648 },
  { name: 'Jersey City, NJ',   lat: 40.7178,  lng: -74.0431 },
  { name: 'Newark, NJ',        lat: 40.7357,  lng: -74.1724 },
  { name: 'Hoboken, NJ',       lat: 40.7440,  lng: -74.0324 },
  { name: 'Los Angeles, CA',   lat: 34.0522,  lng: -118.2437 },
  { name: 'Chicago, IL',       lat: 41.8781,  lng: -87.6298 },
  { name: 'Houston, TX',       lat: 29.7604,  lng: -95.3698 },
  { name: 'Dallas, TX',        lat: 32.7767,  lng: -96.7970 },
  { name: 'Atlanta, GA',       lat: 33.7490,  lng: -84.3880 },
  { name: 'Boston, MA',        lat: 42.3601,  lng: -71.0589 },
  { name: 'Seattle, WA',       lat: 47.6062,  lng: -122.3321 },
  { name: 'San Jose, CA',      lat: 37.3382,  lng: -121.8863 },
  { name: 'Washington, DC',    lat: 38.9072,  lng: -77.0369 },
  { name: 'Philadelphia, PA',  lat: 39.9526,  lng: -75.1652 },
];

const AVATAR_BG_COLORS = ['#1A2035', '#0F2018', '#1A1408', '#0A1820', '#130F20', '#1A1025', '#1A1A08', '#0F1A2A'];

function getAvatarBg(handle) {
  if (!handle) return AVATAR_BG_COLORS[0];
  const idx = handle.charCodeAt(0) % AVATAR_BG_COLORS.length;
  return AVATAR_BG_COLORS[idx];
}

function formatTime(isoString) {
  if (!isoString) return '';
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}


function FeedCard({ post, navigation, C, s, api }) {
  const avatarBg = getAvatarBg(post.author_handle);
  const [liked,  setLiked]  = useState(post.is_liked  || false);
  const [likes,  setLikes]  = useState(post.likes_count || 0);
  const [saved,  setSaved]  = useState(post.is_saved  || false);
  const heartScale = useRef(new Animated.Value(1)).current;

  async function onLike() {
    const next = !liked;
    setLiked(next);
    setLikes(c => next ? c + 1 : c - 1);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 60, bounciness: 20 }),
      Animated.spring(heartScale, { toValue: 1,   useNativeDriver: true, speed: 30 }),
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

  function handlePress() {
    navigation.navigate('PostDetail', { post });
  }

  return (
    <View style={s.feedCard}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={s.feedHeader}>
        <TouchableOpacity
          style={s.avatarRing}
          onPress={() => post.author_id && navigation.navigate('UserProfile', { userId: post.author_id })}
          activeOpacity={0.85}
        >
          <UserAvatar
            uri={post.author_avatar_url}
            emoji={post.author_avatar}
            name={post.author_name}
            size={38}
            bg={avatarBg}
          />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.feedName}>{post.author_name}</Text>
            {post.author_country_flag ? <Text style={{ fontSize: 13 }}>{post.author_country_flag}</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <Text style={s.feedMeta}>{formatTime(post.created_at)}</Text>
            {post.location ? <Text style={s.feedMeta}>· 📍 {post.location}</Text> : null}
          </View>
        </View>
        <TouchableOpacity style={s.moreBtn} onPress={handlePress} activeOpacity={0.7}>
          <Ionicons name="ellipsis-horizontal" size={20} color={C.c35} />
        </TouchableOpacity>
      </View>

      {/* ── Body ───────────────────────────────────────────────── */}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.95}>
        <Text style={s.feedBody} numberOfLines={6}>{post.body}</Text>
      </TouchableOpacity>

      {/* ── Topics ─────────────────────────────────────────────── */}
      {post.topics_list?.length > 0 && (
        <View style={s.topicsRow}>
          {post.topics_list.map(t => (
            <View key={t} style={[s.topicChip, { backgroundColor: C.card2, borderColor: C.border }]}>
              <Text style={[s.topicChipTxt, { color: C.c35 }]}>#{t}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Action bar ─────────────────────────────────────────── */}
      <View style={s.actionBar}>
        <TouchableOpacity onPress={onLike} activeOpacity={0.75} style={[s.actionBtn, liked && s.actionBtnActive]}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? '#FF3B5C' : C.c35} />
          </Animated.View>
          <Text style={[s.actionTxt, liked && { color: '#FF3B5C' }]}>
            {likes > 0 ? likes.toLocaleString() : ''} {liked ? 'Liked' : 'Like'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePress} activeOpacity={0.75} style={s.actionBtn}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={C.c35} />
          <Text style={s.actionTxt}>
            {post.comments_count > 0 ? `${post.comments_count} ` : ''}Comment
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={async () => {
          const next = !saved;
          setSaved(next);
          try { await api(`/posts/${post.id}/save/`, { method: 'POST' }); }
          catch { setSaved(!next); }
        }} activeOpacity={0.75} style={[s.actionBtn, saved && s.actionBtnActive]}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color={saved ? C.vivid : C.c35} />
          <Text style={[s.actionTxt, saved && { color: C.vivid }]}>{saved ? 'Saved' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const RADII = [
  { label: '5 mi',   value: 5   },
  { label: '10 mi',  value: 10  },
  { label: '25 mi',  value: 25  },
  { label: '50 mi',  value: 50  },
  { label: '100 mi', value: 100 },
];


function LocationSheet({ visible, current, currentRadius, onSelect, onClose, C, s }) {
  const [query,        setQuery]        = useState('');
  const [pickedCity,   setPickedCity]   = useState(null);
  const [pickedRadius, setPickedRadius] = useState(currentRadius || 25);
  const [showList,     setShowList]     = useState(false);
  const [zoomLevel,    setZoomLevel]    = useState(1);
  const mapRef = useRef(null);

  const filtered = query.trim().length > 0
    ? SUGGESTED_CITIES.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : SUGGESTED_CITIES;

  const displayCity  = pickedCity || SUGGESTED_CITIES.find(c => c.name === current) || SUGGESTED_CITIES[0];
  const radiusMeters = displayCity ? pickedRadius * 1609.34 : 40000;
  const mapDelta     = (pickedRadius / 69) * 2.2 / zoomLevel;

  function zoomIn() {
    const next = Math.min(zoomLevel * 2, 16);
    setZoomLevel(next);
    if (mapRef.current && displayCity) {
      mapRef.current.animateToRegion({
        latitude: displayCity.lat, longitude: displayCity.lng,
        latitudeDelta: mapDelta / 2, longitudeDelta: mapDelta / 2,
      }, 300);
    }
  }

  function zoomOut() {
    const next = Math.max(zoomLevel / 2, 0.125);
    setZoomLevel(next);
    if (mapRef.current && displayCity) {
      mapRef.current.animateToRegion({
        latitude: displayCity.lat, longitude: displayCity.lng,
        latitudeDelta: mapDelta * 2, longitudeDelta: mapDelta * 2,
      }, 300);
    }
  }

  function handleConfirm() {
    onSelect(displayCity.name, pickedRadius);
    onClose();
    setQuery('');
    setPickedCity(null);
    setShowList(false);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>Set Your Location</Text>

        {/* Search bar */}
        <View style={s.sheetSearch}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            style={s.sheetInput}
            placeholder="Search city…"
            placeholderTextColor={C.c35}
            value={query}
            onChangeText={t => { setQuery(t); setShowList(true); }}
            onFocus={() => setShowList(true)}
          />
          {query.length > 0
            ? <TouchableOpacity onPress={() => { setQuery(''); setShowList(false); }}>
                <Text style={{ fontSize: 14, color: C.c35 }}>✕</Text>
              </TouchableOpacity>
            : <View style={s.sheetCurrentPill}>
                <Text style={s.sheetCurrentTxt}>{displayCity.name.split(',')[0]}</Text>
              </View>
          }
        </View>

        {/* City dropdown */}
        {showList && (
          <View style={s.cityDropdown}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
              {filtered.map(city => {
                const active = city.name === displayCity.name;
                return (
                  <TouchableOpacity
                    key={city.name}
                    style={[s.sheetCity, active && s.sheetCityActive]}
                    onPress={() => { setPickedCity(city); setQuery(''); setShowList(false); }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 14 }}>📍</Text>
                    <Text style={[s.sheetCityTxt, active && { color: C.vivid, fontWeight: '700' }]}>{city.name}</Text>
                    {active && <Text style={{ fontSize: 12, color: C.vivid, marginLeft: 'auto' }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Map with circle */}
        {!showList && displayCity && (
          <View style={s.mapWrap}>
            <MapView
              ref={mapRef}
              style={s.map}
              region={{
                latitude:  displayCity.lat,
                longitude: displayCity.lng,
                latitudeDelta:  mapDelta,
                longitudeDelta: mapDelta,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Circle
                center={{ latitude: displayCity.lat, longitude: displayCity.lng }}
                radius={radiusMeters}
                strokeColor="rgba(232,54,74,0.8)"
                strokeWidth={2}
                fillColor="rgba(232,54,74,0.12)"
              />
            </MapView>
            <View style={s.mapPin}>
              <Text style={{ fontSize: 20 }}>📍</Text>
            </View>
            <View style={s.mapBadge}>
              <Text style={s.mapBadgeTxt}>{pickedRadius} mi radius</Text>
            </View>
            {/* Zoom controls */}
            <View style={s.zoomControls}>
              <TouchableOpacity style={s.zoomBtn} onPress={zoomIn} activeOpacity={0.8}>
                <Text style={s.zoomTxt}>+</Text>
              </TouchableOpacity>
              <View style={s.zoomDivider} />
              <TouchableOpacity style={s.zoomBtn} onPress={zoomOut} activeOpacity={0.8}>
                <Text style={s.zoomTxt}>−</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Radius pills */}
        {!showList && (
          <View style={s.radiusPills}>
            {RADII.map(r => {
              const active = pickedRadius === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  style={[s.radiusPill, active && s.radiusPillActive]}
                  onPress={() => setPickedRadius(r.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.radiusPillTxt, active && s.radiusPillTxtActive]}>{r.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Confirm */}
        {!showList && (
          <TouchableOpacity style={s.radiusConfirm} onPress={handleConfirm} activeOpacity={0.85}>
            <Text style={s.radiusConfirmTxt}>Apply — {displayCity.name.split(',')[0]}, {pickedRadius} mi</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

export default function HomeScreen({ navigation }) {
  const { colors: C } = useTheme();
  const { user, updateUser } = useUser();
  const { api, user: authUser } = useAuthStore();
  const s = useMemo(() => getStyles(C), [C]);

  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [radius,            setRadius]            = useState(25);
  const [activeScope,       setActiveScope]       = useState('all');
  const [posts,             setPosts]             = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [refreshing,        setRefreshing]        = useState(false);
  const [fetchError,        setFetchError]        = useState('');

  const country   = user.homeCountry;              // { flag, name }
  const livesIn   = user.livesIn || '';            // "Queens, NY"
  const cityShort = livesIn.split(',')[0] || 'You';


  const buildUrl = useCallback((scope) => {
    if (scope === 'country' && country?.name) return `/posts/?country=${encodeURIComponent(country.name)}`;
    return '/posts/';
  }, [country]);

  const fetchPosts = useCallback(async (scope, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setFetchError('');
    try {
      const data = await api(buildUrl(scope));
      setPosts(Array.isArray(data) ? data : (data.results || []));
    } catch (e) {
      setFetchError(e.message || 'Failed to load posts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, buildUrl]);

  useEffect(() => {
    fetchPosts(activeScope);
  }, [activeScope, fetchPosts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts(activeScope, true);
  }, [activeScope, fetchPosts]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <LocationSheet
        visible={locationSheetOpen}
        current={livesIn || 'Queens, NY'}
        currentRadius={radius}
        onSelect={(city, r) => { updateUser({ livesIn: city }); setRadius(r); }}
        onClose={() => setLocationSheetOpen(false)}
        C={C} s={s}
      />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.av}>
          <UserAvatar
            uri={authUser?.profile?.avatar_url}
            emoji={authUser?.profile?.avatar_emoji}
            name={authUser?.name}
            size={36}
            radius={12}
            bg={C.vividD}
          />
          <View style={s.avOnline} />
        </View>
        <TouchableOpacity onPress={() => setLocationSheetOpen(true)} activeOpacity={0.7} style={{ marginRight: 8 }}>
          <Text style={s.uname}>{user.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 }}>
            <Text style={s.locationChipTxt}>📍 {cityShort || 'Set location'} · {radius} mi</Text>
            <Text style={s.locationChevron}>▾</Text>
          </View>
        </TouchableOpacity>

        <View style={s.headerRight}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.75}
          >
            <Ionicons name="search-outline" size={20} color={C.c35} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.iconBtn, activeScope === 'country' && s.iconBtnActive]}
            onPress={() => setActiveScope('country')}
            activeOpacity={0.75}
          >
            <Text style={s.iconBtnEmoji}>{country.flag}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.iconBtn, activeScope === 'all' && s.iconBtnActive]}
            onPress={() => setActiveScope('all')}
            activeOpacity={0.75}
          >
            <Ionicons name="globe-outline" size={20} color={activeScope === 'all' ? C.vivid : C.c35} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.vivid} />}
      >

        {/* ── NEARBY RESOURCES ────────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>
            {activeScope === 'country'
              ? `${country.flag} ${country.name} Community`
              : '🌍 All Communities'}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 10, paddingBottom: 4 }}>
          {NEARBY_RESOURCES.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[s.resourceCard, { borderColor: r.color + '44' }]}
              onPress={() => navigation.navigate(r.route)}
              activeOpacity={0.85}
            >
              <View style={[s.resourceIconWrap, { backgroundColor: r.bg }]}>
                <Ionicons name={r.icon} size={20} color={r.color} />
              </View>
              <Text style={s.resourceTitle} numberOfLines={1}>{r.category}</Text>
              <Text style={[s.resourceBadgeTxt, { color: r.color }]}>{r.count} near you</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── FEED ───────────────────────────────────────────────── */}
        <View style={[s.sectionHeader, { marginTop: 20 }]}>
          <Text style={s.sectionTitle}>
            {activeScope === 'country' ? `${country.flag} ${country.name} posts` : '🌍 All posts'}
          </Text>
          {!loading && posts.length > 0 && (
            <Text style={s.sectionSub}>{posts.length} post{posts.length !== 1 ? 's' : ''}</Text>
          )}
        </View>

        <View style={s.feedList}>
          {/* Loading */}
          {loading && (
            <View style={s.centerState}>
              <ActivityIndicator size="large" color={C.vivid} />
              <Text style={[s.emptySubtitle, { marginTop: 12 }]}>Loading posts…</Text>
            </View>
          )}

          {/* Error */}
          {!loading && fetchError ? (
            <View style={s.centerState}>
              <Text style={{ fontSize: 32 }}>⚠️</Text>
              <Text style={s.emptyTitle}>{fetchError}</Text>
              <TouchableOpacity onPress={() => fetchPosts(activeScope)} style={s.retryBtn}>
                <Text style={s.retryTxt}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Empty */}
          {!loading && !fetchError && posts.length === 0 && (
            <View style={s.centerState}>
              <Text style={{ fontSize: 36 }}>📭</Text>
              <Text style={s.emptyTitle}>No posts yet</Text>
              <Text style={s.emptySubtitle}>
                {activeScope === 'country' ? `No posts from ${country.name} community yet.` : 'No posts yet. Be the first!'}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('CreatePost')} style={s.retryBtn}>
                <Text style={s.retryTxt}>Create a post</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Posts */}
          {!loading && posts.map(post => (
            <FeedCard key={post.id} post={post} navigation={navigation} C={C} s={s} api={api} />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // Header
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg, gap: 8 },
  headerRight:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  av:             { width: 36, height: 36, borderRadius: 12, backgroundColor: C.vivid, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(232,54,74,0.3)' },
  avOnline:       { position: 'absolute', bottom: -2, right: -2, width: 9, height: 9, backgroundColor: C.green, borderRadius: 5, borderWidth: 2, borderColor: C.bg },
  uname:          { fontSize: 13, fontWeight: '700', color: C.cream },
  locationChipTxt:{ fontSize: 10, color: C.c35 },
  locationChevron:{ fontSize: 9, color: C.c35 },

  // Section headers
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, marginTop: 16, marginBottom: 10 },
  sectionTitle:    { fontSize: 13, fontWeight: '800', color: C.cream },
  sectionSub:      { fontSize: 10, color: C.c35 },

  // Nearby resources
  resourceCard:      { backgroundColor: C.card, borderWidth: 1, borderRadius: 16, padding: 12, width: 86, gap: 6, alignItems: 'center' },
  resourceIconWrap:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resourceBadgeTxt:  { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  resourceTitle:     { fontSize: 11, fontWeight: '800', color: C.cream, textAlign: 'center' },

  iconBtn:       { width: 36, height: 36, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  iconBtnActive: { backgroundColor: C.vividD, borderColor: C.vivid + '66' },
  iconBtnEmoji:  { fontSize: 18 },

  // Feed
  feedList:       { gap: 12, marginTop: 8, paddingHorizontal: 0 },
  feedCard:       { backgroundColor: C.card, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border, paddingBottom: 10 },
  feedHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10 },
  avatarRing:     { width: 46, height: 46, borderRadius: 23, padding: 2, borderWidth: 2, borderColor: C.vivid, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  feedAvatar:     { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  feedName:       { fontSize: 13, fontWeight: '700', color: C.cream },
  feedMeta:       { fontSize: 11, color: C.c35 },
  moreBtn:        { padding: 6 },
  feedBody:       { fontSize: 14, color: C.c60, lineHeight: 22, paddingHorizontal: 14, marginBottom: 10 },
  topicsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, marginBottom: 10 },
  topicChip:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50, borderWidth: 1 },
  topicChipTxt:   { fontSize: 11, fontWeight: '600' },
  // Action bar
  actionBar:      { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, marginTop: 6 },
  actionBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  actionBtnActive:{ backgroundColor: 'transparent' },
  actionTxt:      { fontSize: 12, fontWeight: '600', color: C.c35 },

  // Center states (loading / error / empty)
  centerState:    { alignItems: 'center', paddingVertical: 50, gap: 8, paddingHorizontal: 20 },
  emptyTitle:     { fontSize: 15, fontWeight: '700', color: C.cream, textAlign: 'center' },
  emptySubtitle:  { fontSize: 13, color: C.c35, textAlign: 'center' },
  retryBtn:       { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: C.vivid },
  retryTxt:       { fontSize: 13, fontWeight: '700', color: 'white' },

  // Location sheet
  sheetOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:            { backgroundColor: C.nav, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, borderTopWidth: 1, borderColor: C.border },
  sheetHandle:      { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:       { fontSize: 18, fontWeight: '800', color: C.cream, marginBottom: 4 },
  sheetSearch:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14 },
  sheetInput:       { flex: 1, fontSize: 14, color: C.cream },
  sheetCurrentPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.vividD, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.vivid + '44' },
  sheetCurrentTxt:  { fontSize: 12, color: C.vivid, fontWeight: '700' },
  sheetCity:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.border },
  sheetCityActive:  { backgroundColor: C.vividD + '55', marginHorizontal: -4, paddingHorizontal: 8, borderRadius: 10, borderBottomWidth: 0 },
  sheetCityTxt:     { fontSize: 14, color: C.c60, flex: 1 },

  // Map
  mapWrap:          { borderRadius: 16, overflow: 'hidden', height: 200, marginBottom: 12, position: 'relative' },
  map:              { width: '100%', height: '100%' },
  mapPin:           { position: 'absolute', top: '50%', left: '50%', marginLeft: -12, marginTop: -24 },
  mapBadge:         { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4 },
  mapBadgeTxt:      { fontSize: 11, fontWeight: '700', color: '#fff' },
  zoomControls:     { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10, overflow: 'hidden' },
  zoomBtn:          { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  zoomTxt:          { fontSize: 22, fontWeight: '300', color: '#fff', lineHeight: 26 },
  zoomDivider:      { height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  cityDropdown:     { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },

  // Radius
  radiusPills:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  radiusPill:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  radiusPillActive: { backgroundColor: C.vividD, borderColor: C.vivid + '66' },
  radiusPillTxt:    { fontSize: 12, fontWeight: '600', color: C.c35 },
  radiusPillTxtActive: { color: C.vivid, fontWeight: '700' },
  radiusConfirm:    { backgroundColor: C.vivid, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  radiusConfirmTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
