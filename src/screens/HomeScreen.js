import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Dimensions,
  ActivityIndicator, RefreshControl, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { useJobsStore } from '../store/jobsStore';
import { useHousingStore } from '../store/housingStore';
import UserAvatar from '../components/UserAvatar';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP  = 12;
const H_PAD     = 16;
const H_CARD_W  = Math.round((SCREEN_W - H_PAD * 2) * 0.43);

// ── City list (mirrors AppTopBar) ─────────────────────────────────────────────
const CITIES = [
  { name: 'Queens, NY',       lat: 40.7282,  lng: -73.7949 },
  { name: 'Brooklyn, NY',     lat: 40.6782,  lng: -73.9442 },
  { name: 'Manhattan, NY',    lat: 40.7831,  lng: -73.9712 },
  { name: 'Bronx, NY',        lat: 40.8448,  lng: -73.8648 },
  { name: 'Jersey City, NJ',  lat: 40.7178,  lng: -74.0431 },
  { name: 'Newark, NJ',       lat: 40.7357,  lng: -74.1724 },
  { name: 'Hoboken, NJ',      lat: 40.7440,  lng: -74.0324 },
  { name: 'Los Angeles, CA',  lat: 34.0522,  lng: -118.2437 },
  { name: 'Chicago, IL',      lat: 41.8781,  lng: -87.6298 },
  { name: 'Houston, TX',      lat: 29.7604,  lng: -95.3698 },
  { name: 'Dallas, TX',       lat: 32.7767,  lng: -96.7970 },
  { name: 'Atlanta, GA',      lat: 33.7490,  lng: -84.3880 },
  { name: 'Boston, MA',       lat: 42.3601,  lng: -71.0589 },
  { name: 'Lawrence, MA',     lat: 42.7070,  lng: -71.1631 },
  { name: 'Lowell, MA',       lat: 42.6334,  lng: -71.3162 },
  { name: 'Worcester, MA',    lat: 42.2626,  lng: -71.8023 },
  { name: 'Seattle, WA',      lat: 47.6062,  lng: -122.3321 },
  { name: 'San Jose, CA',     lat: 37.3382,  lng: -121.8863 },
  { name: 'Washington, DC',   lat: 38.9072,  lng: -77.0369 },
  { name: 'Philadelphia, PA', lat: 39.9526,  lng: -75.1652 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function distanceMiles(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDist(mi) {
  if (mi == null) return null;
  if (mi < 0.5)  return '< 1 mi';
  if (mi < 10)   return `${mi.toFixed(1)} mi`;
  return `${Math.round(mi)} mi`;
}

function formatTime(isoString) {
  if (!isoString) return '';
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const AVATAR_BG_COLORS = ['#1A2035', '#0F2018', '#1A1408', '#0A1820', '#130F20', '#1A1025', '#1A1A08', '#0F1A2A'];
function getAvatarBg(handle) {
  if (!handle) return AVATAR_BG_COLORS[0];
  return AVATAR_BG_COLORS[handle.charCodeAt(0) % AVATAR_BG_COLORS.length];
}

// ── Category definitions ──────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'Jobs',        label: 'Jobs',        emoji: '💼', bg: '#1B4FA8', badge: '#F4A227' },
  { key: 'Housing',     label: 'Housing',     emoji: '🏠', bg: '#1B4FA8', badge: '#F4A227' },
  { key: 'Marketplace', label: 'Marketplace', emoji: '🛒', bg: '#E8871E', badge: '#fff' },
  { key: 'Services',    label: 'Services',    emoji: '🤝', bg: '#1B4FA8', badge: '#28D99E' },
];

const TYPE_META = {
  job:     { label: 'Job',      icon: 'briefcase-outline',  color: '#3B8BF7' },
  housing: { label: 'Housing',  icon: 'home-outline',       color: '#F4A227' },
  market:  { label: 'For Sale', icon: 'storefront-outline', color: '#28D99E' },
};

// ── City picker modal ─────────────────────────────────────────────────────────

function CityPickerModal({ visible, onClose, currentCity, onSelect, C }) {
  const forceDetect = useLocationStore(st => st.forceDetect);
  const setCity     = useLocationStore(st => st.setCity);
  const [locating, setLocating] = useState(false);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={cpStyles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[cpStyles.sheet, { backgroundColor: C.nav }]}>
        <View style={cpStyles.handle} />
        <Text style={[cpStyles.sheetTitle, { color: C.cream }]}>Choose Location</Text>

        {/* Near Me */}
        <TouchableOpacity
          style={[cpStyles.cityRow, { borderBottomColor: C.border }]}
          disabled={locating}
          activeOpacity={0.75}
          onPress={async () => {
            setLocating(true);
            await forceDetect();
            const { city } = useLocationStore.getState();
            onSelect(city || '');
            setLocating(false);
            onClose();
          }}
        >
          <View style={[cpStyles.cityIconWrap, { backgroundColor: '#3B8BF715' }]}>
            {locating
              ? <ActivityIndicator size="small" color="#3B8BF7" />
              : <Ionicons name="navigate" size={16} color="#3B8BF7" />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[cpStyles.cityName, { color: C.cream }]}>
              {locating ? 'Getting location…' : 'Near Me (GPS)'}
            </Text>
            <Text style={[cpStyles.citySub, { color: C.c35 }]}>Use your current GPS location</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={C.c35} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
          {CITIES.map((city, idx) => {
            const active = city.name === currentCity;
            const isLast = idx === CITIES.length - 1;
            return (
              <TouchableOpacity
                key={city.name}
                style={[cpStyles.cityRow, !isLast && { borderBottomColor: C.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                activeOpacity={0.75}
                onPress={() => {
                  setCity(city.name, city.lat, city.lng);
                  onSelect(city.name);
                  onClose();
                }}
              >
                <View style={[cpStyles.cityIconWrap, { backgroundColor: active ? '#3B8BF715' : C.card2 }]}>
                  <Ionicons name="location-outline" size={14} color={active ? '#3B8BF7' : C.c35} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[cpStyles.cityName, { color: active ? '#3B8BF7' : C.cream }]}>
                    {city.name.split(',')[0]}
                  </Text>
                  <Text style={[cpStyles.citySub, { color: C.c35 }]}>
                    {city.name.split(', ')[1] || ''}
                  </Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={16} color="#3B8BF7" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const cpStyles = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingBottom: 34 },
  handle:       { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(150,150,150,0.35)', alignSelf: 'center', marginBottom: 14 },
  sheetTitle:   { fontSize: 17, fontWeight: '800', paddingHorizontal: 20, marginBottom: 12 },
  cityRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  cityIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cityName:     { fontSize: 14, fontWeight: '700' },
  citySub:      { fontSize: 11, marginTop: 1 },
});

// ── Listing grid card ─────────────────────────────────────────────────────────

function ListingGridCard({ item, onPress, C, s }) {
  const meta = TYPE_META[item._type] || TYPE_META.market;
  return (
    <TouchableOpacity style={s.gridCard} onPress={onPress} activeOpacity={0.88}>
      <View style={s.gridImgWrap}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={s.gridImg} resizeMode="cover" />
        ) : (
          <View style={[s.gridImgEmpty, { backgroundColor: meta.color + '18' }]}>
            <Ionicons name={meta.icon} size={32} color={meta.color + 'AA'} />
          </View>
        )}
        {/* Dark overlay at image bottom */}
        <View style={s.gridOverlay}>
          <Text style={s.gridOverlayTitle} numberOfLines={2}>{item.title}</Text>
          {item.location ? (
            <View style={s.gridLocRow}>
              <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.75)" />
              <Text style={s.gridOverlayLoc} numberOfLines={1}>{item.location}</Text>
            </View>
          ) : null}
        </View>
        {/* Type badge */}
        <View style={[s.gridTypeBadge, { backgroundColor: meta.color }]}>
          <Text style={s.gridTypeTxt}>{meta.label}</Text>
        </View>
        {item.hot ? (
          <View style={s.gridHotBadge}><Text style={{ fontSize: 10 }}>🔥</Text></View>
        ) : null}
      </View>
      <View style={s.gridBody}>
        <Text style={[s.gridPrice, { color: meta.color }]} numberOfLines={1}>
          {item.sub || '—'}
        </Text>
        {item.distanceMi != null ? (
          <View style={s.gridDistRow}>
            <Ionicons name="navigate-outline" size={9} color={C.c35} />
            <Text style={[s.gridDistTxt, { color: C.c35 }]}>{formatDist(item.distanceMi)}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ── Feed card ─────────────────────────────────────────────────────────────────

function FeedCard({ post, navigation, C, s, api, cityCoords }) {
  const avatarBg  = getAvatarBg(post.author_handle);
  const postDist  = formatDist(distanceMiles(cityCoords?.lat, cityCoords?.lng, post.latitude, post.longitude));
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

  function handlePress() { navigation.navigate('PostDetail', { post }); }

  const timeStr = formatTime(post.created_at);

  return (
    <TouchableOpacity style={s.feedCard} onPress={handlePress} activeOpacity={0.92}>
      {/* Header row */}
      <View style={s.feedHeader}>
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
              bg={avatarBg}
            />
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={s.feedName}>{post.author_name}</Text>
            {post.author_country_flag ? <Text style={{ fontSize: 13 }}>{post.author_country_flag}</Text> : null}
          </View>
          {postDist ? (
            <Text style={s.feedMeta}>📡 {postDist}</Text>
          ) : post.location ? (
            <Text style={s.feedMeta}>📍 {post.location}</Text>
          ) : null}
        </View>
        <TouchableOpacity style={s.moreBtn} onPress={handlePress} activeOpacity={0.7}>
          <Ionicons name="ellipsis-horizontal" size={20} color={C.c35} />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <Text style={s.feedBody} numberOfLines={5}>{post.body}</Text>

      {/* Image */}
      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={s.feedImage} resizeMode="cover" />
      ) : null}

      {/* Topics */}
      {post.topics_list?.length > 0 && (
        <View style={s.topicsRow}>
          {post.topics_list.map(t => (
            <View key={t} style={[s.topicChip, { backgroundColor: C.card2, borderColor: C.border }]}>
              <Text style={[s.topicChipTxt, { color: C.c35 }]}>#{t}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={s.feedFooter}>
        {/* Replies */}
        <TouchableOpacity style={s.feedFooterBtn} onPress={handlePress} activeOpacity={0.75}>
          <Ionicons name="chatbubble-ellipses-outline" size={14} color={C.c35} />
          <Text style={s.feedFooterTxt}>
            {post.comments_count > 0 ? `${post.comments_count} replies` : 'Reply'}
          </Text>
        </TouchableOpacity>

        <Text style={s.feedFooterDot}>·</Text>

        {/* Likes */}
        <TouchableOpacity style={s.feedFooterBtn} onPress={onLike} activeOpacity={0.75}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={liked ? 'thumbs-up' : 'thumbs-up-outline'}
              size={14}
              color={liked ? '#F4A227' : C.c35}
            />
          </Animated.View>
          <Text style={[s.feedFooterTxt, liked && { color: '#F4A227' }]}>
            {likes > 0 ? `${likes} Helpful` : 'Helpful'}
          </Text>
        </TouchableOpacity>

        <Text style={s.feedFooterDot}>·</Text>

        {/* Save */}
        <TouchableOpacity style={s.feedFooterBtn} onPress={async () => {
          const next = !saved;
          setSaved(next);
          try { await api(`/posts/${post.id}/save/`, { method: 'POST' }); }
          catch { setSaved(!next); }
        }} activeOpacity={0.75}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={14} color={saved ? '#3B8BF7' : C.c35} />
          <Text style={[s.feedFooterTxt, saved && { color: '#3B8BF7' }]}>{saved ? 'Saved' : 'Save'}</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />
        <Text style={s.feedTimeTxt}>{timeStr}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const { colors: C } = useTheme();
  const { api, user: authUser } = useAuthStore();
  const currentCity   = useLocationStore(s => s.city);
  const gpsLat        = useLocationStore(s => s.latitude);
  const gpsLng        = useLocationStore(s => s.longitude);
  const s = useMemo(() => getStyles(C), [C]);

  const jobs           = useJobsStore(st => st.jobs);
  const jobsLoading    = useJobsStore(st => st.loading);
  const fetchJobs      = useJobsStore(st => st.fetchJobs);
  const listings       = useHousingStore(st => st.listings);
  const housingLoading = useHousingStore(st => st.loading);
  const fetchHousing   = useHousingStore(st => st.fetchListings);

  const [marketPreview, setMarketPreview] = useState([]);
  const [marketLoading, setMarketLoading] = useState(true);
  const [activeScope,   setActiveScope]   = useState('all');
  const [posts,         setPosts]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [fetchError,    setFetchError]    = useState('');
  const [cityModal,     setCityModal]     = useState(false);

  const homeCountry    = authUser?.profile?.home_country || '';
  const countryFlag    = authUser?.profile?.country_flag || authUser?.profile?.home_country_flag || '';
  const cityShort      = currentCity.split(',')[0] || 'Set location';

  const cityCoords = useMemo(() => {
    if (gpsLat != null && gpsLng != null) return { lat: gpsLat, lng: gpsLng };
    return null;
  }, [gpsLat, gpsLng]);

  const combinedListings = useMemo(() => {
    const cLat = cityCoords?.lat ?? null;
    const cLng = cityCoords?.lng ?? null;
    const dist = (itemLat, itemLng) => distanceMiles(cLat, cLng, itemLat, itemLng);

    const j = jobs.slice(0, 6).map(i => ({ ...i, _type: 'job',     sub: i.company,       distanceMi: dist(i.lat, i.lng) }));
    const h = listings.slice(0, 6).map(i => ({ ...i, _type: 'housing', sub: i.price, hot: i.featured || false, distanceMi: dist(i.lat, i.lng) }));
    const m = marketPreview.slice(0, 6).map(i => ({
      ...i, id: String(i.id), _type: 'market',
      sub: i.price || null,
      hot: i.is_hot || false,
      image_url: i.image_url || null,
      distanceMi: dist(i.latitude ?? null, i.longitude ?? null),
    }));
    const all = [...j, ...h, ...m];
    if (cLat != null) {
      all.sort((a, b) => {
        if (a.distanceMi == null && b.distanceMi == null) return 0;
        if (a.distanceMi == null) return 1;
        if (b.distanceMi == null) return -1;
        return a.distanceMi - b.distanceMi;
      });
    }
    return all;
  }, [jobs, listings, marketPreview, cityCoords]);

  const buildUrl = useCallback((scope) => {
    const parts = [];
    if (scope === 'country' && homeCountry) parts.push(`country=${encodeURIComponent(homeCountry)}`);
    if (gpsLat != null && gpsLng != null) {
      parts.push(`lat=${gpsLat}&lng=${gpsLng}`);
    } else if (currentCity) {
      parts.push(`near_city=${encodeURIComponent(currentCity)}`);
    }
    return parts.length ? `/posts/?${parts.join('&')}` : '/posts/';
  }, [homeCountry, currentCity, gpsLat, gpsLng]);

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

  useFocusEffect(
    useCallback(() => {
      fetchPosts(activeScope);
    }, [activeScope, fetchPosts])
  );

  useEffect(() => {
    const lat = cityCoords?.lat ?? null;
    const lng = cityCoords?.lng ?? null;
    fetchJobs({ lat, lng });
    fetchHousing({ lat, lng });
    const q = lat != null ? `?lat=${lat}&lng=${lng}` : '';
    api(`/marketplace/${q}`).then(data => {
      setMarketPreview(Array.isArray(data) ? data : (data.results || []));
    }).catch(() => {}).finally(() => setMarketLoading(false));
  }, [cityCoords]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const lat = cityCoords?.lat ?? null;
    const lng = cityCoords?.lng ?? null;
    const q   = lat != null ? `?lat=${lat}&lng=${lng}` : '';
    Promise.all([
      fetchPosts(activeScope, true),
      fetchJobs({ lat, lng }),
      fetchHousing({ lat, lng }),
      api(`/marketplace/${q}`).then(d => setMarketPreview(Array.isArray(d) ? d : (d.results || []))).catch(() => {}),
    ]).finally(() => setRefreshing(false));
  }, [activeScope, fetchPosts, fetchJobs, fetchHousing, api, cityCoords]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── CITY PICKER MODAL ───────────────────────────────────── */}
      <CityPickerModal
        visible={cityModal}
        onClose={() => setCityModal(false)}
        currentCity={currentCity}
        onSelect={() => {}}
        C={C}
      />

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B8BF7" />}
      >

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <View style={s.headerWrap}>
          {/* Single compact row */}
          <View style={s.headerRow}>
            <Text style={s.headerLogo}>Zabroad ✈</Text>

            <View style={s.headerRight}>
              {/* Globe — Everyone scope */}
              <TouchableOpacity
                style={[s.scopeIconBtn, activeScope === 'all' && s.scopeIconBtnActive]}
                onPress={() => setActiveScope('all')}
                activeOpacity={0.75}
              >
                <Ionicons name="globe-outline" size={19} color={activeScope === 'all' ? '#fff' : 'rgba(255,255,255,0.5)'} />
              </TouchableOpacity>

              {/* Country flag — country scope */}
              {countryFlag ? (
                <TouchableOpacity
                  style={[s.scopeIconBtn, activeScope === 'country' && s.scopeIconBtnActive]}
                  onPress={() => setActiveScope(sc => sc === 'country' ? 'all' : 'country')}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 16, lineHeight: 20 }}>{countryFlag}</Text>
                </TouchableOpacity>
              ) : null}

              {/* Location */}
              <TouchableOpacity style={s.locPill} onPress={() => setCityModal(true)} activeOpacity={0.8}>
                <Ionicons name="location" size={11} color="#F4A227" />
                <Text style={s.locPillTxt} numberOfLines={1}>{cityShort}</Text>
                <Ionicons name="chevron-down" size={10} color="rgba(255,255,255,0.55)" />
              </TouchableOpacity>

              {/* Avatar */}
              <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
                <View style={s.avatarBorder}>
                  <UserAvatar
                    uri={authUser?.profile?.avatar_url}
                    emoji={authUser?.profile?.avatar}
                    name={authUser?.profile?.full_name || authUser?.username}
                    size={32}
                    bg="#1A3266"
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar */}
          <TouchableOpacity
            style={s.searchBar}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.85}
          >
            <Ionicons name="search-outline" size={14} color="#aaa" />
            <Text style={s.searchPlaceholder}>Search jobs, housing, services...</Text>
            <View style={s.filtersBtn}>
              <Text style={s.filtersBtnTxt}>Filters</Text>
              <Ionicons name="chevron-forward" size={11} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── CATEGORY ICONS ──────────────────────────────────────── */}
        <View style={s.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={s.catItem}
              onPress={() => navigation.navigate(cat.key)}
              activeOpacity={0.75}
            >
              <View style={[s.catIconBox, { backgroundColor: cat.bg }]}>
                <Text style={s.catEmoji}>{cat.emoji}</Text>
              </View>
              <Text style={[s.catLabel, { color: C.cream }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>


        {/* ── POPULAR LISTINGS ────────────────────────────────────── */}
        <View style={s.section}>
          <View style={s.sectionHdr}>
            <Text style={s.sectionTitle}>
              {cityShort && cityShort !== 'Set location' ? `Popular in ${cityShort}` : 'Popular Listings'}
            </Text>
            <TouchableOpacity
              style={s.seeAllBtn}
              onPress={() => navigation.navigate('Marketplace')}
              activeOpacity={0.75}
            >
              <Text style={s.seeAllTxt}>See all</Text>
              <Ionicons name="chevron-forward" size={13} color="#3B8BF7" />
            </TouchableOpacity>
          </View>

          {(jobsLoading && housingLoading && marketLoading && combinedListings.length === 0) ? (
            <View style={s.centerState}>
              <ActivityIndicator size="small" color="#3B8BF7" />
            </View>
          ) : combinedListings.length === 0 ? (
            <View style={s.centerState}>
              <Text style={s.emptySubtitle}>No listings yet — be the first to post!</Text>
            </View>
          ) : (
            <View>
              {/* Row 1 — even-indexed items */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.hGridContent}
              >
                {combinedListings.filter((_, i) => i % 2 === 0).map(item => (
                  <ListingGridCard
                    key={`${item._type}-${item.id}`}
                    item={item}
                    C={C} s={s}
                    onPress={() => {
                      if (item._type === 'job')     navigation.navigate('JobDetail',         { job: item });
                      if (item._type === 'housing') navigation.navigate('HousingDetail',     { listing: item });
                      if (item._type === 'market')  navigation.navigate('MarketplaceDetail', { item });
                    }}
                  />
                ))}
              </ScrollView>

              {/* Row 2 — odd-indexed items */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[s.hGridContent, { marginTop: CARD_GAP }]}
              >
                {combinedListings.filter((_, i) => i % 2 !== 0).map(item => (
                  <ListingGridCard
                    key={`${item._type}-${item.id}`}
                    item={item}
                    C={C} s={s}
                    onPress={() => {
                      if (item._type === 'job')     navigation.navigate('JobDetail',         { job: item });
                      if (item._type === 'housing') navigation.navigate('HousingDetail',     { listing: item });
                      if (item._type === 'market')  navigation.navigate('MarketplaceDetail', { item });
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* ── COMMUNITY UPDATES ───────────────────────────────────── */}
        <View style={[s.section, { marginTop: 28 }]}>
          <View style={s.sectionHdr}>
            <Text style={s.sectionTitle}>Community Updates</Text>
          </View>

          {/* Loading */}
          {loading && (
            <View style={s.centerState}>
              <ActivityIndicator size="large" color="#3B8BF7" />
              <Text style={[s.emptySubtitle, { marginTop: 10 }]}>Loading posts…</Text>
            </View>
          )}

          {/* Error */}
          {!loading && fetchError ? (
            <View style={s.centerState}>
              <Text style={{ fontSize: 30 }}>⚠️</Text>
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
                {activeScope === 'country'
                  ? `No posts from ${homeCountry} community yet.`
                  : cityShort && cityShort !== 'Set location'
                    ? `No posts near ${cityShort} yet. Be the first!`
                    : 'No posts yet. Be the first!'}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('CreatePost')} style={s.retryBtn}>
                <Text style={s.retryTxt}>Create a post</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Feed */}
          {!loading && posts.map(post => (
            <FeedCard
              key={post.id}
              post={post}
              navigation={navigation}
              C={C} s={s}
              api={api}
              cityCoords={cityCoords}
            />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const getStyles = (C) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // ── Header ──────────────────────────────────────────────────────────────────
  headerWrap: { backgroundColor: '#1B3266', paddingBottom: 10 },

  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 9, paddingBottom: 7,
  },
  headerLogo:  { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  avatarBorder:{ borderRadius: 17, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },

  // Scope icon buttons (icon only, no text)
  scopeIconBtn: {
    width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scopeIconBtnActive: { backgroundColor: 'rgba(255,255,255,0.22)' },

  // Location pill (compact)
  locPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(244,162,39,0.15)', borderWidth: 1, borderColor: 'rgba(244,162,39,0.35)',
    maxWidth: 110,
  },
  locPillTxt: { fontSize: 11, fontWeight: '700', color: '#F4A227', flex: 1 },

  // Search bar
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, marginHorizontal: 12, marginTop: 8,
    paddingHorizontal: 10, paddingVertical: 8, gap: 7,
  },
  searchPlaceholder: { flex: 1, fontSize: 13, color: '#999' },
  filtersBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#2B5FC7', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7,
  },
  filtersBtnTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // ── Category bar ─────────────────────────────────────────────────────────────
  catRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: 8, paddingVertical: 12,
    backgroundColor: C.bg,
  },
  catItem:   { alignItems: 'center', gap: 5, flex: 1 },
  catIconBox:{
    width: 48, height: 48, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.14, shadowRadius: 4,
    elevation: 3,
  },
  catEmoji:  { fontSize: 22 },
  catLabel:  { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  // ── Promo banners ─────────────────────────────────────────────────────────────
  bannersWrap: { paddingHorizontal: H_PAD, gap: 10, marginBottom: 4 },
  banner: {
    borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6,
    elevation: 3,
  },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 3 },
  bannerSub:   { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  bannerEmoji: { fontSize: 34, marginLeft: 8 },

  // ── Section ───────────────────────────────────────────────────────────────────
  section:      { marginTop: 22 },
  sectionHdr:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: H_PAD, marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: C.cream },
  seeAllBtn:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllTxt:    { fontSize: 13, fontWeight: '700', color: '#3B8BF7' },

  // ── Listing grid (2-row horizontal scroll) ────────────────────────────────────
  hGridContent: { paddingHorizontal: H_PAD, gap: CARD_GAP, flexDirection: 'row', alignItems: 'flex-start' },
  gridCard: {
    width: H_CARD_W, backgroundColor: C.card,
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6,
    elevation: 2,
  },
  gridImgWrap:   { position: 'relative', width: '100%', height: 110 },
  gridImg:       { width: '100%', height: '100%' },
  gridImgEmpty:  { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  gridOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 9, paddingTop: 30, paddingBottom: 9,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  gridOverlayTitle: { fontSize: 13, fontWeight: '800', color: '#fff', lineHeight: 18 },
  gridLocRow:       { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  gridOverlayLoc:   { fontSize: 10, color: 'rgba(255,255,255,0.78)', flex: 1 },
  gridTypeBadge: {
    position: 'absolute', top: 8, left: 8,
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  gridTypeTxt:  { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  gridHotBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 50,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  gridBody:     { padding: 10 },
  gridPrice:    { fontSize: 14, fontWeight: '800' },
  gridDistRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  gridDistTxt:  { fontSize: 10, fontWeight: '600' },

  // ── Feed cards ────────────────────────────────────────────────────────────────
  feedCard: {
    backgroundColor: C.card,
    borderRadius: 16, marginHorizontal: H_PAD, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    elevation: 1,
  },
  feedHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 6 },
  avatarRing:  { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#3B8BF7', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  feedName:    { fontSize: 14, fontWeight: '700', color: C.cream },
  feedMeta:    { fontSize: 11, color: C.c35, marginTop: 2 },
  moreBtn:     { padding: 6 },
  feedBody:    { fontSize: 14, color: C.c60, lineHeight: 21, paddingHorizontal: 14, paddingBottom: 10 },
  feedImage:   { width: '100%', height: 200, backgroundColor: C.card2 },
  topicsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingBottom: 10 },
  topicChip:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50, borderWidth: 1 },
  topicChipTxt:{ fontSize: 11, fontWeight: '600' },

  feedFooter:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, gap: 6 },
  feedFooterBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  feedFooterTxt:  { fontSize: 12, fontWeight: '600', color: C.c35 },
  feedFooterDot:  { fontSize: 10, color: C.c35 },
  feedTimeTxt:    { fontSize: 11, color: C.c35 },

  // ── States ────────────────────────────────────────────────────────────────────
  centerState:   { alignItems: 'center', paddingVertical: 40, gap: 8, paddingHorizontal: 20 },
  emptyTitle:    { fontSize: 15, fontWeight: '700', color: C.cream, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: C.c35, textAlign: 'center' },
  retryBtn:      { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: '#3B8BF7' },
  retryTxt:      { fontSize: 13, fontWeight: '700', color: 'white' },

  iconBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
});
