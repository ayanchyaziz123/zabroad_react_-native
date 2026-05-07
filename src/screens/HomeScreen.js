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
import { useNotificationStore } from '../store/notificationStore';
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
  { key: 'Marketplace',label: 'Shop Local', emoji: '🛒', bg: '#E8871E', badge: '#fff'    },
  { key: 'Jobs',       label: 'Jobs',       emoji: '💼', bg: '#1B4FA8', badge: '#F4A227' },
  { key: 'Housing',    label: 'Housing',    emoji: '🏠', bg: '#1B4FA8', badge: '#F4A227' },
  { key: 'Events',     label: 'Events',     emoji: '🎉', bg: '#7B2FBE', badge: '#F4A227' },
];

const TYPE_META = {
  job:     { label: 'Job',      icon: 'briefcase-outline',  color: '#3B8BF7' },
  housing: { label: 'Housing',  icon: 'home-outline',       color: '#F4A227' },
  market:  { label: 'Shop Local', icon: 'storefront-outline', color: '#28D99E' },
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
  const [browseModal,   setBrowseModal]   = useState(false);

  const unreadCount    = useNotificationStore(s => s.unreadCount);

  const homeCountry    = authUser?.profile?.home_country || '';
  const countryFlag    = authUser?.profile?.country_flag || authUser?.profile?.home_country_flag || '';
  const cityShort      = currentCity.split(',')[0] || 'Set location';
  const firstName      = authUser?.profile?.full_name?.split(' ')[0] || authUser?.username || 'there';
  const hour           = new Date().getHours();
  const greeting       = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

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
    const lat       = cityCoords?.lat ?? null;
    const lng       = cityCoords?.lng ?? null;
    const isCountry = activeScope === 'country';
    const scope     = isCountry ? 'community' : 'all';
    const country   = isCountry ? homeCountry : '';

    fetchJobs({ lat, lng, scope, homeCountry: country });
    fetchHousing({ lat, lng, scope, homeCountry: country });

    const params = new URLSearchParams();
    if (lat != null) { params.append('lat', lat); params.append('lng', lng); }
    if (isCountry && homeCountry) params.append('community', homeCountry);
    const q = params.toString();
    api(`/marketplace/${q ? '?' + q : ''}`).then(data => {
      setMarketPreview(Array.isArray(data) ? data : (data.results || []));
    }).catch(() => {}).finally(() => setMarketLoading(false));
  }, [cityCoords, activeScope]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const lat       = cityCoords?.lat ?? null;
    const lng       = cityCoords?.lng ?? null;
    const isCountry = activeScope === 'country';
    const scope     = isCountry ? 'community' : 'all';
    const country   = isCountry ? homeCountry : '';
    const params    = new URLSearchParams();
    if (lat != null) { params.append('lat', lat); params.append('lng', lng); }
    if (isCountry && homeCountry) params.append('community', homeCountry);
    const q = params.toString();
    Promise.all([
      fetchPosts(activeScope, true),
      fetchJobs({ lat, lng, scope, homeCountry: country }),
      fetchHousing({ lat, lng, scope, homeCountry: country }),
      api(`/marketplace/${q ? '?' + q : ''}`).then(d => setMarketPreview(Array.isArray(d) ? d : (d.results || []))).catch(() => {}),
    ]).finally(() => setRefreshing(false));
  }, [activeScope, fetchPosts, fetchJobs, fetchHousing, api, cityCoords, homeCountry]);

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

      {/* ── BROWSE CATEGORY MODAL ───────────────────────────────── */}
      <Modal visible={browseModal} transparent animationType="slide" onRequestClose={() => setBrowseModal(false)}>
        <TouchableOpacity style={bm.overlay} activeOpacity={1} onPress={() => setBrowseModal(false)} />
        <View style={[bm.sheet, { backgroundColor: C.nav }]}>
          <View style={bm.handle} />
          <Text style={[bm.title, { color: C.cream }]}>Browse Listings</Text>
          {[
            { label: 'Jobs',        sub: 'Find jobs near you',          emoji: '💼', color: '#3B8BF7', screen: 'Jobs'        },
            { label: 'Housing',     sub: 'Rooms, apartments & homes',   emoji: '🏠', color: '#F4A227', screen: 'Housing'     },
            { label: 'Marketplace', sub: 'Buy & sell in the community', emoji: '🛒', color: '#28D99E', screen: 'Marketplace' },
          ].map((opt, i, arr) => (
            <TouchableOpacity
              key={opt.screen}
              style={[bm.row, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border }]}
              activeOpacity={0.75}
              onPress={() => { setBrowseModal(false); navigation.navigate(opt.screen); }}
            >
              <View style={[bm.iconBox, { backgroundColor: opt.color + '18' }]}>
                <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[bm.rowLabel, { color: C.cream }]}>{opt.label}</Text>
                <Text style={[bm.rowSub,   { color: C.c35  }]}>{opt.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={opt.color} />
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B8BF7" />}
      >

        {/* ── HEADER ──────────────────────────────────────────────── */}
        <View style={s.headerWrap}>

          {/* ── Row 1: Location + Icons ── */}
          <View style={s.headerRow}>
            <TouchableOpacity style={s.locBar} onPress={() => setCityModal(true)} activeOpacity={0.8}>
              <Ionicons name="location-sharp" size={15} color="#F4A227" />
              <View style={{ flex: 1 }}>
                <Text style={s.headerGreeting}>{greeting}, {firstName} 👋</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={s.locBarTxt} numberOfLines={1}>
                    {currentCity || 'Set your location'}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.5)" />
                </View>
              </View>
            </TouchableOpacity>
            <View style={s.headerRight}>
              {/* Search */}
              <TouchableOpacity
                style={s.headerIconBtn}
                onPress={() => navigation.navigate('Search')}
                activeOpacity={0.8}
              >
                <Ionicons name="search-outline" size={19} color="#fff" />
              </TouchableOpacity>

              {/* Notifications */}
              <TouchableOpacity
                style={s.headerIconBtn}
                onPress={() => navigation.navigate('Notifications')}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications-outline" size={19} color="#fff" />
                {unreadCount > 0 && (
                  <View style={s.notifDot}>
                    <Text style={s.notifDotTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
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

          {/* ── Row 2: Scope toggle + Location ── */}
          <View style={s.scopeRow}>
            {/* Everyone nearby */}
            <TouchableOpacity
              style={[s.scopeToggleBtn, activeScope === 'all' && s.scopeToggleBtnActive]}
              onPress={() => setActiveScope('all')}
              activeOpacity={0.75}
            >
              <Ionicons name="globe-outline" size={13} color={activeScope === 'all' ? '#fff' : 'rgba(255,255,255,0.5)'} />
              <Text style={[s.scopeToggleTxt, activeScope === 'all' && s.scopeToggleTxtActive]}>
                Everyone nearby
              </Text>
            </TouchableOpacity>

            {/* Community nearby */}
            {countryFlag ? (
              <TouchableOpacity
                style={[s.scopeToggleBtn, activeScope === 'country' && s.scopeToggleBtnActive]}
                onPress={() => setActiveScope(sc => sc === 'country' ? 'all' : 'country')}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 12, lineHeight: 16 }}>{countryFlag}</Text>
                <Text style={[s.scopeToggleTxt, activeScope === 'country' && s.scopeToggleTxtActive]}>
                  {homeCountry} nearby
                </Text>
              </TouchableOpacity>
            ) : null}

          </View>
        </View>

        {/* ── CATEGORY ICONS ──────────────────────────────────────── */}
        <View style={s.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[s.catItem, cat.disabled && { opacity: 0.4 }]}
              onPress={() => !cat.disabled && navigation.navigate(cat.key)}
              activeOpacity={cat.disabled ? 1 : 0.75}
              disabled={cat.disabled}
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
              onPress={() => setBrowseModal(true)}
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
        <View style={s.section}>
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
  headerWrap: { backgroundColor: '#1B3266', paddingBottom: 12 },

  locBar:    { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  locBarTxt: { fontSize: 17, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },

  // Row 1
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10,
  },
  headerGreeting: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.55)', marginBottom: 1 },
  headerRight:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn:  { width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifDot:       { position: 'absolute', top: -3, right: -3, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  notifDotTxt:    { fontSize: 8, fontWeight: '800', color: '#fff' },
  avatarBorder:   { borderRadius: 17, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },

  // Row 2 — scope toggle + location
  scopeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingBottom: 4,
  },
  scopeToggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  scopeToggleBtnActive: { backgroundColor: 'rgba(255,255,255,0.22)', borderColor: 'rgba(255,255,255,0.4)' },
  scopeToggleTxt:       { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  scopeToggleTxtActive: { color: '#fff', fontWeight: '700' },


  // ── Category bar ─────────────────────────────────────────────────────────────
  catRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: H_PAD, paddingVertical: 12,
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
  section:      { marginTop: 24 },
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
  gridBody:     { padding: 10, gap: 4 },
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

const bm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:   { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 10, paddingBottom: 36 },
  handle:  { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(150,150,150,0.35)', alignSelf: 'center', marginBottom: 16 },
  title:   { fontSize: 17, fontWeight: '800', paddingHorizontal: 20, marginBottom: 12 },
  row:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowLabel:{ fontSize: 15, fontWeight: '700' },
  rowSub:  { fontSize: 12, marginTop: 2 },
});
