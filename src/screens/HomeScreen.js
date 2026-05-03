import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Modal, TextInput,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { useJobsStore } from '../store/jobsStore';
import { useHousingStore } from '../store/housingStore';
import UserAvatar from '../components/UserAvatar';


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

      {/* ── Image ──────────────────────────────────────────────── */}
      {post.image_url ? (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.95}>
          <Image source={{ uri: post.image_url }} style={s.feedImage} resizeMode="cover" />
        </TouchableOpacity>
      ) : null}

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
            <Ionicons name={liked ? 'thumbs-up' : 'thumbs-up-outline'} size={16} color={liked ? '#F4A227' : C.c35} />
          </Animated.View>
          <Text style={[s.actionTxt, liked && { color: '#F4A227' }]}>
            {likes > 0 ? `${likes.toLocaleString()} ` : ''}Helpful
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
          <View style={s.sheetCityList}>
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

// ── Combined listing card ─────────────────────────────────────────────────────
const TYPE_META = {
  job:     { label: 'Job',     icon: 'briefcase-outline',  color: '#3EC878' },
  housing: { label: 'Housing', icon: 'home-outline',       color: '#F5A623' },
  market:  { label: 'For Sale',icon: 'storefront-outline', color: '#00B4D8' },
};

function ListingCard({ item, onPress, C, s }) {
  const meta = TYPE_META[item._type] || TYPE_META.market;
  return (
    <TouchableOpacity style={s.previewCard} onPress={onPress} activeOpacity={0.88}>
      {/* Image */}
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={s.previewImg} resizeMode="cover" />
      ) : (
        <View style={[s.previewImgEmpty, { backgroundColor: meta.color + '15' }]}>
          <Ionicons name={meta.icon} size={24} color={meta.color + 'BB'} />
        </View>
      )}
      {/* Type badge */}
      <View style={[s.typeBadge, { backgroundColor: meta.color }]}>
        <Text style={s.typeBadgeTxt}>{meta.label}</Text>
      </View>
      {/* Hot badge */}
      {item.hot && (
        <View style={s.previewHotBadge}>
          <Text style={s.previewHotTxt}>🔥</Text>
        </View>
      )}
      <View style={s.previewBody}>
        <Text style={s.previewTitle} numberOfLines={2}>{item.title}</Text>
        {item.sub ? (
          <View style={[s.previewSubPill, { backgroundColor: meta.color + '18' }]}>
            <Text style={[s.previewSubTxt, { color: meta.color }]} numberOfLines={1}>{item.sub}</Text>
          </View>
        ) : null}
        {item.location ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 }}>
            <Ionicons name="location-outline" size={10} color={C.c35} />
            <Text style={s.previewLoc} numberOfLines={1}>{item.location}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { colors: C } = useTheme();
  const { api, user: authUser, updateProfile } = useAuthStore();
  const gpsLat = useLocationStore(s => s.latitude);
  const gpsLng = useLocationStore(s => s.longitude);
  const s = useMemo(() => getStyles(C), [C]);

  const jobs           = useJobsStore(st => st.jobs);
  const jobsLoading    = useJobsStore(st => st.loading);
  const fetchJobs      = useJobsStore(st => st.fetchJobs);
  const listings       = useHousingStore(st => st.listings);
  const housingLoading = useHousingStore(st => st.loading);
  const fetchHousing   = useHousingStore(st => st.fetchListings);

  const [marketPreview,      setMarketPreview]      = useState([]);
  const [marketLoading,      setMarketLoading]      = useState(true);

  // Location state — seeded from authStore profile, locally mutable
  const [currentCity, setCurrentCity] = useState('');
  const [radius,      setRadius]      = useState(25);

  // Seed city from authStore once the profile is available
  useEffect(() => {
    const profileCity = authUser?.profile?.lives_in;
    if (profileCity && !currentCity) setCurrentCity(profileCity);
  }, [authUser?.profile?.lives_in]);

  const [locationSheetOpen,  setLocationSheetOpen]  = useState(false);
  const [cityDropdownOpen,   setCityDropdownOpen]   = useState(false);
  const [activeScope,        setActiveScope]        = useState('all');
  const [posts,             setPosts]             = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [refreshing,        setRefreshing]        = useState(false);
  const [fetchError,        setFetchError]        = useState('');

  // Category bar hide-on-scroll
  const CAT_BAR_H    = 80;
  const catBarHeight = useRef(new Animated.Value(CAT_BAR_H)).current;
  const catBarOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY  = useRef(0);
  const catVisible   = useRef(true);

  const handleMainScroll = useCallback((e) => {
    const y = e.nativeEvent.contentOffset.y;
    const goingDown = y > lastScrollY.current + 4;
    const goingUp   = y < lastScrollY.current - 4;
    lastScrollY.current = y;

    if (goingDown && catVisible.current) {
      catVisible.current = false;
      Animated.parallel([
        Animated.timing(catBarHeight,  { toValue: 0, duration: 200, useNativeDriver: false }),
        Animated.timing(catBarOpacity, { toValue: 0, duration: 150, useNativeDriver: false }),
      ]).start();
    } else if (goingUp && !catVisible.current) {
      catVisible.current = true;
      Animated.parallel([
        Animated.timing(catBarHeight,  { toValue: CAT_BAR_H, duration: 220, useNativeDriver: false }),
        Animated.timing(catBarOpacity, { toValue: 1,          duration: 200, useNativeDriver: false }),
      ]).start();
    }
  }, [catBarHeight, catBarOpacity]);

  // Derived display values — single source of truth: authStore
  const homeCountry = authUser?.profile?.home_country || '';
  const countryFlag = authUser?.profile?.country_flag || '🌍';
  const cityShort   = currentCity.split(',')[0] || 'Set location';
  const displayName = authUser?.name || '';

  // Interleave jobs / housing / marketplace into one combined list
  const combinedListings = useMemo(() => {
    const j = jobs.slice(0, 5).map(i => ({ ...i, _type: 'job',     sub: i.company,                       location: i.location }));
    const h = listings.slice(0, 5).map(i => ({ ...i, _type: 'housing', sub: i.price,                         location: i.location }));
    const m = marketPreview.slice(0, 5).map(i => ({ ...i, id: String(i.id), _type: 'market',  sub: i.price ? `$${i.price}` : null, location: i.location, image_url: i.image_url || null }));
    const result = [];
    const max = Math.max(j.length, h.length, m.length);
    for (let i = 0; i < max; i++) {
      if (j[i]) result.push(j[i]);
      if (h[i]) result.push(h[i]);
      if (m[i]) result.push(m[i]);
    }
    return result;
  }, [jobs, listings, marketPreview]);

  // Build the fetch URL — city chip selection → known lat/lng → precise ascending distance sort
  const buildUrl = useCallback((scope) => {
    const parts = [];
    if (scope === 'country' && homeCountry) parts.push(`country=${encodeURIComponent(homeCountry)}`);
    const knownCity = SUGGESTED_CITIES.find(c => c.name === currentCity);
    if (knownCity) {
      parts.push(`lat=${knownCity.lat}&lng=${knownCity.lng}`);
    } else if (gpsLat != null && gpsLng != null) {
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

  // Re-fetch when scope or city changes (city change → new buildUrl → new fetchPosts → effect fires)
  useEffect(() => {
    fetchPosts(activeScope);
  }, [activeScope, fetchPosts]);

  // Fetch preview data once on mount
  useEffect(() => {
    fetchJobs();
    fetchHousing();
    api('/marketplace/').then(data => {
      setMarketPreview(Array.isArray(data) ? data : (data.results || []));
    }).catch(() => {}).finally(() => setMarketLoading(false));
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchPosts(activeScope, true),
      fetchJobs(),
      fetchHousing(),
      api('/marketplace/').then(d => setMarketPreview(Array.isArray(d) ? d : (d.results || []))).catch(() => {}),
    ]).finally(() => setRefreshing(false));
  }, [activeScope, fetchPosts, fetchJobs, fetchHousing, api]);

  // Update city: local state immediately (fast UI), persist to backend silently
  function handleLocationSelect(city, r) {
    setCurrentCity(city);
    setRadius(r);
    updateProfile({ lives_in: city }).catch(() => {});
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <LocationSheet
        visible={locationSheetOpen}
        current={currentCity}
        currentRadius={radius}
        onSelect={handleLocationSelect}
        onClose={() => setLocationSheetOpen(false)}
        C={C} s={s}
      />

      {/* ── HEADER + CITY DROPDOWN ─────────────────────────────── */}
      <View style={{ zIndex: 100 }}>
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

          {/* City selector — tapping opens dropdown */}
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setCityDropdownOpen(v => !v)}
            activeOpacity={0.75}
          >
            <Text style={s.uname} numberOfLines={1}>
              {displayName ? `Hi, ${displayName.split(' ')[0]}` : 'Zabroad'}
            </Text>
            <View style={s.cityPickerRow}>
              <Ionicons name="location" size={11} color={C.vivid} />
              <Text style={s.cityPickerTxt} numberOfLines={1}>
                {cityShort !== 'Set location' ? cityShort : 'Pick your city'}
              </Text>
              <Ionicons
                name={cityDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={11}
                color={C.c35}
              />
            </View>
          </TouchableOpacity>

          <View style={s.headerRight}>
            <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('Search')} activeOpacity={0.75}>
              <Ionicons name="search-outline" size={20} color={C.c35} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.iconBtn, activeScope === 'country' && s.iconBtnActive]}
              onPress={() => setActiveScope(sc => sc === 'country' ? 'all' : 'country')}
              activeOpacity={0.75}
            >
              <Text style={s.iconBtnEmoji}>{countryFlag}</Text>
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

        {/* Inline dropdown */}
        {cityDropdownOpen && (
          <>
            {/* Tap-outside overlay */}
            <TouchableOpacity
              style={s.dropdownOverlay}
              activeOpacity={1}
              onPress={() => setCityDropdownOpen(false)}
            />
            <View style={[s.cityDropdown, { backgroundColor: C.nav, borderColor: C.border }]}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 300 }}
              >
                {/* Near Me row */}
                {gpsLat != null && (
                  <TouchableOpacity
                    style={[s.cityRow, { borderBottomColor: C.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                    activeOpacity={0.75}
                    onPress={() => {
                      const { city: gpsCity } = useLocationStore.getState();
                      setCurrentCity(gpsCity || '');
                      updateProfile({ lives_in: gpsCity || '' }).catch(() => {});
                      setCityDropdownOpen(false);
                    }}
                  >
                    <View style={[s.cityRowIcon, { backgroundColor: C.vividD }]}>
                      <Ionicons name="navigate" size={14} color={C.vivid} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.cityRowName, { color: C.cream }]}>Near Me</Text>
                      <Text style={[s.cityRowSub, { color: C.c35 }]}>Use your current GPS location</Text>
                    </View>
                    {!currentCity && <Ionicons name="checkmark-circle" size={16} color={C.vivid} />}
                  </TouchableOpacity>
                )}

                {SUGGESTED_CITIES.map((city, idx) => {
                  const active = city.name === currentCity;
                  const isLast = idx === SUGGESTED_CITIES.length - 1;
                  return (
                    <TouchableOpacity
                      key={city.name}
                      style={[s.cityRow, !isLast && { borderBottomColor: C.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                      activeOpacity={0.75}
                      onPress={() => {
                        setCurrentCity(city.name);
                        updateProfile({ lives_in: city.name }).catch(() => {});
                        setCityDropdownOpen(false);
                      }}
                    >
                      <View style={[s.cityRowIcon, { backgroundColor: active ? C.vividD : C.card2 }]}>
                        <Ionicons name="location-outline" size={14} color={active ? C.vivid : C.c35} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.cityRowName, { color: active ? C.vivid : C.cream }]}>
                          {city.name.split(',')[0]}
                        </Text>
                        <Text style={[s.cityRowSub, { color: C.c35 }]}>
                          {city.name.split(', ')[1] || ''}
                        </Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={16} color={C.vivid} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </>
        )}
      </View>

      {/* ── CATEGORY BAR ───────────────────────────────────────── */}
      <Animated.View style={[s.catBarWrap, { height: catBarHeight, opacity: catBarOpacity, borderBottomColor: C.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.catBar}
          contentContainerStyle={s.catBarContent}
        >
          {[
            { key: 'Jobs',        label: 'Jobs',        icon: 'briefcase-outline',        color: '#3EC878' },
            { key: 'Housing',     label: 'Housing',     icon: 'home-outline',             color: '#F5A623' },
            { key: 'Marketplace', label: 'Marketplace', icon: 'storefront-outline',       color: '#00B4D8' },
            { key: 'Attorney',    label: 'Attorneys',   icon: 'shield-checkmark-outline', color: '#9B72EF' },
            { key: 'Healthcare',  label: 'Healthcare',  icon: 'medkit-outline',           color: '#F4627D' },
            { key: 'Events',      label: 'Events',      icon: 'calendar-outline',         color: '#F4A227' },
          ].map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={s.catItem}
              onPress={() => navigation.navigate(cat.key)}
              activeOpacity={0.75}
            >
              <View style={[s.catIcon, { backgroundColor: cat.color + '18' }]}>
                <Ionicons name={cat.icon} size={18} color={cat.color} />
              </View>
              <Text style={[s.catLabel, { color: C.c35 }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
        onScroll={handleMainScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.vivid} />}
      >

        {/* ── GREETING ────────────────────────────────────────────── */}
        <View style={s.greeting}>
          <Text style={s.greetingLine}>
            {activeScope === 'country'
              ? `${countryFlag} ${homeCountry} community`
              : 'Welcome back' + (displayName ? `, ${displayName.split(' ')[0]}` : '')}
          </Text>
          <Text style={s.greetingSubLine}>
            {cityShort !== 'Set location'
              ? `Discover what's near ${cityShort}`
              : 'Set your location to see nearby listings'}
          </Text>
        </View>

        {/* ── LATEST COMMUNITY LISTINGS ──────────────────────────── */}
        <View style={s.previewSection}>
          <View style={s.previewHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[s.previewHeaderDot, { backgroundColor: C.vivid }]} />
              <Text style={s.previewHeaderTitle}>Latest Community Listings</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[
                { label: 'Jobs',    route: 'Jobs',        color: '#3EC878' },
                { label: 'Housing', route: 'Housing',     color: '#F5A623' },
                { label: 'Market',  route: 'Marketplace', color: '#00B4D8' },
              ].map(t => (
                <TouchableOpacity key={t.route} onPress={() => navigation.navigate(t.route)} activeOpacity={0.7} style={[s.typeLink, { backgroundColor: t.color + '18' }]}>
                  <Text style={[s.typeLinkTxt, { color: t.color }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {(jobsLoading && housingLoading && marketLoading && combinedListings.length === 0) ? (
            <View style={s.previewLoadingRow}>
              <ActivityIndicator size="small" color={C.vivid} />
            </View>
          ) : combinedListings.length === 0 ? (
            <View style={s.previewLoadingRow}>
              <Text style={s.previewEmpty}>No listings yet — be the first to post!</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 2 }}>
              {combinedListings.map(item => (
                <ListingCard
                  key={`${item._type}-${item.id}`}
                  item={item}
                  C={C} s={s}
                  onPress={() => {
                    if (item._type === 'job')     navigation.navigate('Jobs');
                    if (item._type === 'housing') navigation.navigate('HousingDetail', { listing: item });
                    if (item._type === 'market')  navigation.navigate('MarketplaceDetail', { item });
                  }}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── COMMUNITY FEED HEADER ──────────────────────────────── */}
        <View style={s.feedDivider}>
          <View style={s.feedDividerLine} />
          <View style={s.feedDividerPill}>
            <Ionicons name="people-outline" size={12} color={C.c35} />
            <Text style={s.feedDividerTxt}>
              {activeScope === 'country' ? `${homeCountry} Community Feed` : 'Community Feed'}
            </Text>
          </View>
          <View style={s.feedDividerLine} />
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
                {activeScope === 'country' ? `No posts from ${homeCountry} community yet.` : 'No posts yet. Be the first!'}
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

  // City picker in header
  cityPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  cityPickerTxt: { fontSize: 11, fontWeight: '600', color: C.vivid, flex: 1 },

  // Dropdown overlay (tap-outside dismiss)
  dropdownOverlay: { position: 'absolute', top: 0, left: -1000, right: -1000, bottom: -2000, zIndex: 49 },

  // Inline city dropdown panel
  cityDropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
    backgroundColor: C.nav, borderWidth: 1, borderTopWidth: 0, borderColor: C.border,
    borderBottomLeftRadius: 18, borderBottomRightRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12,
  },

  // Each row inside the dropdown
  cityRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  cityRowIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cityRowName: { fontSize: 14, fontWeight: '700' },
  cityRowSub:  { fontSize: 11, marginTop: 1 },

  // Category bar
  catBarWrap:    { overflow: 'hidden', borderBottomWidth: 1 },
  catBar:        { flex: 1 },
  catBarContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 6, flexDirection: 'row' },
  catItem:       { alignItems: 'center', gap: 5, width: 66 },
  catIcon:       { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catLabel:      { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  // Greeting
  greeting:        { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 },
  greetingLine:    { fontSize: 20, fontWeight: '800', color: C.cream, letterSpacing: -0.4 },
  greetingSubLine: { fontSize: 13, color: C.c35, marginTop: 3 },

  // Section labels (kept for reference)
  sectionTitle:    { fontSize: 13, fontWeight: '800', color: C.cream },
  sectionSub:      { fontSize: 10, color: C.c35 },

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
  feedImage:      { width: '100%', height: 220, marginBottom: 10, backgroundColor: C.card2 },
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
  sheetCityList:    { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },

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

  // Radius
  radiusPills:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  radiusPill:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  radiusPillActive: { backgroundColor: C.vividD, borderColor: C.vivid + '66' },
  radiusPillTxt:    { fontSize: 12, fontWeight: '600', color: C.c35 },
  radiusPillTxtActive: { color: C.vivid, fontWeight: '700' },
  radiusConfirm:    { backgroundColor: C.vivid, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  radiusConfirmTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Preview sections
  previewSection:     { marginTop: 24 },
  previewHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  previewHeaderDot:   { width: 4, height: 16, borderRadius: 2 },
  previewHeaderTitle: { fontSize: 15, fontWeight: '800', color: C.cream, letterSpacing: -0.2 },
  seeAllBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  seeAllTxt:          { fontSize: 12, fontWeight: '700' },
  previewLoadingRow:  { height: 130, alignItems: 'center', justifyContent: 'center', gap: 8 },
  previewEmpty:       { fontSize: 12, color: C.c35 },

  previewCard:     { width: 162, backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  previewImg:      { width: '100%', height: 90, backgroundColor: C.card2 },
  previewImgEmpty: { width: '100%', height: 90, alignItems: 'center', justifyContent: 'center' },
  typeBadge:    { position: 'absolute', top: 8, left: 8, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  typeBadgeTxt: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  previewHotBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 50, paddingHorizontal: 6, paddingVertical: 2 },
  previewHotTxt:   { fontSize: 9 },
  typeLink:    { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 50 },
  typeLinkTxt: { fontSize: 10, fontWeight: '700' },
  previewBody:     { padding: 11 },
  previewTitle:    { fontSize: 12, fontWeight: '700', color: C.cream, lineHeight: 17 },
  previewSubPill:  { alignSelf: 'flex-start', marginTop: 5, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  previewSubTxt:   { fontSize: 10, fontWeight: '700' },
  previewLoc:      { fontSize: 10, color: C.c35, flex: 1 },

  // Community feed divider
  feedDivider:     { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 28, marginBottom: 4, gap: 10 },
  feedDividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  feedDividerPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  feedDividerTxt:  { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 0.5 },
});
