import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Dimensions,
  ActivityIndicator, RefreshControl, Image, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { useJobsStore } from '../store/jobsStore';
import { useHousingStore } from '../store/housingStore';
import { useNotificationStore } from '../store/notificationStore';
import UserAvatar from '../components/UserAvatar';
import { barsHidden, showBars, hideBars } from '../utils/scrollAnim';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP    = 12;
const H_PAD       = 16;
const H_CARD_W    = Math.round((SCREEN_W - H_PAD * 2) * 0.43);
const POST_CARD_W = Math.round(SCREEN_W * 0.78);
const HEADER_H    = 112;

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
  { key: 'Jobs',        label: 'Jobs',       emoji: '💼', bg: '#2563EB', badge: '#F4A227' },
  { key: 'Housing',     label: 'Housing',    emoji: '🏠', bg: '#D97706', badge: '#fff'    },
  { key: 'Events',      label: 'Events',     emoji: '🎉', bg: '#9333EA', badge: '#F4A227' },
  { key: 'Marketplace', label: 'Market',     emoji: '🛒', bg: '#16A34A', badge: '#fff'    },
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


function ListingGridCard({ item, onPress, isCommunity, s }) {
  const meta = TYPE_META[item._type] || TYPE_META.market;

  return (
    <TouchableOpacity style={s.gridCard} onPress={onPress} activeOpacity={0.88}>
      {/* Full-bleed image or colored placeholder */}
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={s.gridImg} resizeMode="cover" />
      ) : (
        <View style={[s.gridImgEmpty, { backgroundColor: meta.color + '22' }]}>
          <View style={[s.gridIconCircle, { backgroundColor: meta.color + '30' }]}>
            <Ionicons name={meta.icon} size={30} color={meta.color} />
          </View>
        </View>
      )}

      {/* Dark gradient overlay — bottom half */}
      <View style={s.gridOverlay} pointerEvents="none">
        {/* Price pill */}
        {item.sub ? (
          <Text style={[s.gridOverlayPrice, { color: meta.color }]} numberOfLines={1}>
            {item.sub}
          </Text>
        ) : null}
        {/* Title */}
        <Text style={s.gridOverlayTitle} numberOfLines={2}>{item.title}</Text>
        {/* Distance */}
        {item.distanceMi != null ? (
          <View style={s.gridLocRow}>
            <Ionicons name="location-outline" size={9} color="rgba(255,255,255,0.6)" />
            <Text style={s.gridOverlayLoc}>{formatDist(item.distanceMi)}</Text>
          </View>
        ) : null}
      </View>

      {/* Type badge — top left */}
      <View style={[s.gridTypeBadge, { backgroundColor: meta.color }]}>
        <Text style={s.gridTypeTxt}>{meta.label}</Text>
      </View>

      {/* Hot + community badges — top right */}
      <View style={s.gridTopRight}>
        {item.hot ? <Text style={s.gridHotEmoji}>🔥</Text> : null}
        {isCommunity ? (
          <View style={s.gridVerifiedBadge}>
            <Ionicons name="checkmark-circle" size={9} color="#28D99E" />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ── Post preview card (horizontal strip) ─────────────────────────────────────

function PostPreviewCard({ post, navigation, C, s }) {
  return (
    <TouchableOpacity
      style={s.pCard}
      onPress={() => navigation.navigate('PostDetail', { post })}
      activeOpacity={0.88}
    >
      <View style={s.pCardTop}>
        <UserAvatar
          uri={post.author_avatar_url}
          emoji={post.author_avatar}
          name={post.author_name}
          size={26}
          bg={getAvatarBg(post.author_handle)}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={s.pCardName} numberOfLines={1}>{post.author_name}</Text>
            {post.author_country_flag ? <Text style={{ fontSize: 11 }}>{post.author_country_flag}</Text> : null}
          </View>
          <Text style={s.pCardTime}>{formatTime(post.created_at)}</Text>
        </View>
      </View>

      <Text style={s.pCardBody} numberOfLines={2}>{post.body}</Text>

      {post.topics_list?.length > 0 && (
        <View style={s.pCardTopics}>
          {post.topics_list.slice(0, 2).map(t => (
            <Text key={t} style={s.pCardTopic}>#{t}</Text>
          ))}
        </View>
      )}

      <View style={s.pCardFooter}>
        <Ionicons name="chatbubble-ellipses-outline" size={11} color={C.c35} />
        <Text style={s.pCardStat}>{post.comments_count || 0}</Text>
        <Text style={s.pCardDot}>·</Text>
        <Ionicons name="thumbs-up-outline" size={11} color={C.c35} />
        <Text style={s.pCardStat}>{post.likes_count || 0}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const { colors: C } = useTheme();
  const { api, user: authUser } = useAuthStore();
  const insets = useSafeAreaInsets();
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
  const [nextEvent,     setNextEvent]     = useState(null);
  const [activeScope,   setActiveScope]   = useState('country');
  const [posts,         setPosts]         = useState([]);
  const [refreshing,    setRefreshing]    = useState(false);
  const [cityModal,      setCityModal]     = useState(false);
  const [browseModal,    setBrowseModal]   = useState(false);

  const unreadCount    = useNotificationStore(s => s.unreadCount);

  const lastScrollY  = useRef(0);
  const barsTarget   = useRef(0); // 0=visible 1=hidden — prevents redundant calls
  const handleScroll = useCallback((e) => {
    const y  = e.nativeEvent.contentOffset.y;
    const dy = y - lastScrollY.current;
    lastScrollY.current = y;
    if (dy > 3 && barsTarget.current !== 1) {
      barsTarget.current = 1;
      hideBars();
    } else if (dy < -3 && barsTarget.current !== 0) {
      barsTarget.current = 0;
      showBars();
    }
  }, []);

  const firstName      = authUser?.profile?.full_name?.split(' ')[0] || authUser?.username || '';
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

    const j = jobs.slice(0, 6).map(i => ({ ...i, _type: 'job',     sub: i.company,       distanceMi: dist(i.latitude, i.longitude) }));
    const h = listings.slice(0, 6).map(i => ({ ...i, _type: 'housing', sub: i.price, hot: i.is_featured || false, distanceMi: dist(i.latitude, i.longitude) }));
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

  const fetchPosts = useCallback(async (scope) => {
    try {
      const data = await api(buildUrl(scope));
      setPosts(Array.isArray(data) ? data : (data.results || []));
    } catch {}
    finally { setRefreshing(false); }
  }, [api, buildUrl]);

  useFocusEffect(
    useCallback(() => {
      fetchPosts(activeScope);
      return () => { barsTarget.current = 0; showBars(); };
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

    api('/events/?upcoming=true').then(data => {
      const list = Array.isArray(data) ? data : (data.results || []);
      setNextEvent(list[0] || null);
    }).catch(() => {});
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
      api('/events/?upcoming=true').then(d => { const l = Array.isArray(d) ? d : (d.results || []); setNextEvent(l[0] || null); }).catch(() => {}),
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

      {/* ── FIXED HEADER (absolute, animates up on scroll-down) ── */}
      <Animated.View style={[s.headerWrap, {
        position: 'absolute', zIndex: 10, top: 0, left: 0, right: 0,
        paddingTop: insets.top,
        transform: [{ translateY: barsHidden.interpolate({ inputRange: [0, 1], outputRange: [0, -(HEADER_H + insets.top)] }) }],
      }]}>
        {/* Row 1: Location + Icons + AI Bot */}
        <View style={s.headerRow}>
          <TouchableOpacity style={s.locBar} onPress={() => setCityModal(true)} activeOpacity={0.8}>
            <Ionicons name="location-sharp" size={13} color="#F4A227" />
            <Text style={s.locBarTxt} numberOfLines={1}>{currentCity || 'Set location'}</Text>
            <Ionicons name="chevron-down" size={11} color={C.c35} />
          </TouchableOpacity>
          <View style={s.headerRight}>
            <TouchableOpacity style={s.headerIconBtn} onPress={() => navigation.navigate('Search')} activeOpacity={0.8}>
              <Ionicons name="search-outline" size={18} color={C.cream} />
            </TouchableOpacity>
            <TouchableOpacity style={s.headerIconBtn} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={18} color={C.cream} />
              {unreadCount > 0 && (
                <View style={s.notifDot}>
                  <Text style={s.notifDotTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.headerIconBtn} onPress={() => navigation.navigate('AIAssistant')} activeOpacity={0.85}>
              <Ionicons name="hardware-chip-outline" size={18} color={C.cream} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Row 2: Scope toggle */}
        <View style={s.segmentWrap}>
          <TouchableOpacity
            style={[s.segmentBtn, activeScope === 'country' && s.segmentBtnActive]}
            onPress={() => setActiveScope('country')}
            activeOpacity={0.8}
          >
            <Text style={[s.segmentTxt, activeScope === 'country' && s.segmentTxtActive]}>
              {countryFlag ? `${countryFlag} ` : ''}{homeCountry || 'My Roots'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.segmentBtn, activeScope === 'all' && s.segmentBtnActive]}
            onPress={() => setActiveScope('all')}
            activeOpacity={0.8}
          >
            <Text style={[s.segmentTxt, activeScope === 'all' && s.segmentTxtActive]}>
              🌍 Everyone
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── SCROLLABLE CONTENT ───────────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HEADER_H, paddingBottom: insets.bottom + 70 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B8BF7" />}
      >

        {/* ── GREETING ─────────────────────────────────────────── */}
        {firstName ? (
          <View style={s.greetingWrap}>
            <Text style={s.greetingHi}>Hey, {firstName} 👋</Text>
            <Text style={s.greetingBy}>What are you looking for today?</Text>
          </View>
        ) : null}

        {/* ── CATEGORY ICONS ──────────────────────────────────── */}
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

          {/* ── COMMUNITY POSTS STRIP ────────────────────────── */}
          {posts.length > 0 && (
            <View style={[s.section, { marginTop: 12 }]}>
              <View style={s.sectionHdr}>
                <View style={s.sectionTitleWrap}>
                  <View style={s.sectionAccent} />
                  <View>
                    <Text style={s.sectionTitle}>Community</Text>
                    <Text style={s.sectionSub}>
                      {activeScope === 'country' ? (countryFlag ? `${countryFlag} ${homeCountry}` : homeCountry) : '🌍 Everyone'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={s.seeAllBtn} onPress={() => navigation.navigate('CommunityPosts', { scope: activeScope })} activeOpacity={0.75}>
                  <Text style={s.seeAllTxt}>See all</Text>
                  <Ionicons name="chevron-forward" size={13} color="#3B8BF7" />
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={POST_CARD_W + 10}
                snapToAlignment="start"
                contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 10 }}
              >
                {posts.slice(0, 8).map(post => (
                  <PostPreviewCard key={post.id} post={post} navigation={navigation} C={C} s={s} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── POPULAR LISTINGS ──────────────────────────────── */}
          <View style={s.section}>
            <View style={s.sectionHdr}>
              <View style={s.sectionTitleWrap}>
                <View style={s.sectionAccent} />
                <View>
                  <Text style={s.sectionTitle}>
                    {activeScope === 'country'
                      ? `${homeCountry || 'Community'} Marketplace`
                      : cityShort && cityShort !== 'Set location' ? `Near ${cityShort}` : 'Popular Listings'}
                  </Text>
                  <Text style={s.sectionSub}>
                    {activeScope === 'country' ? 'From your community' : 'Jobs, housing & more'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={s.seeAllBtn} onPress={() => setBrowseModal(true)} activeOpacity={0.75}>
                <Text style={s.seeAllTxt}>See all</Text>
                <Ionicons name="chevron-forward" size={13} color="#3B8BF7" />
              </TouchableOpacity>
            </View>

            {(jobsLoading && housingLoading && marketLoading && combinedListings.length === 0) ? (
              <View style={s.centerState}><ActivityIndicator size="small" color="#3B8BF7" /></View>
            ) : combinedListings.length === 0 ? (
              <View style={s.centerState}>
                <Text style={s.emptySubtitle}>No listings yet — be the first to post!</Text>
              </View>
            ) : (
              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hGridContent}>
                  {combinedListings.filter((_, i) => i % 2 === 0).map(item => (
                    <ListingGridCard
                      key={`${item._type}-${item.id}`}
                      item={item} isCommunity={activeScope === 'country'} s={s}
                      onPress={() => {
                        if (item._type === 'job')     navigation.navigate('JobDetail',         { job: item });
                        if (item._type === 'housing') navigation.navigate('HousingDetail',     { listing: item });
                        if (item._type === 'market')  navigation.navigate('MarketplaceDetail', { item });
                      }}
                    />
                  ))}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.hGridContent, { marginTop: CARD_GAP }]}>
                  {combinedListings.filter((_, i) => i % 2 !== 0).map(item => (
                    <ListingGridCard
                      key={`${item._type}-${item.id}`}
                      item={item} isCommunity={activeScope === 'country'} s={s}
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

          {/* ── UPCOMING EVENT ────────────────────────────────── */}
          {nextEvent && (() => {
            const evtDate = new Date(nextEvent.date);
            const dateStr = evtDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const timeStr = evtDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            const catColors = { legal: '#3B8BF7', jobs: '#F4A227', community: '#28D99E', health: '#28D99E', cultural: '#A855F7', networking: '#3B8BF7' };
            const catEmojis = { legal: '⚖️', jobs: '💼', community: '🤝', health: '🧠', cultural: '🎉', networking: '🌐' };
            const color  = catColors[nextEvent.category] || '#3B8BF7';
            const emoji  = catEmojis[nextEvent.category] || '🗓';
            return (
              <View style={[s.section, { marginTop: 16 }]}>
                <View style={s.sectionHdr}>
                  <View style={s.sectionTitleWrap}>
                    <View style={[s.sectionAccent, { backgroundColor: color }]} />
                    <View>
                      <Text style={s.sectionTitle}>Upcoming Event</Text>
                      <Text style={s.sectionSub}>{dateStr} · {nextEvent.category}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={s.seeAllBtn} onPress={() => navigation.navigate('Events')} activeOpacity={0.75}>
                    <Text style={s.seeAllTxt}>See all</Text>
                    <Ionicons name="chevron-forward" size={13} color="#3B8BF7" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[s.eventCard, { borderColor: color + '44' }]}
                  onPress={() => navigation.navigate('EventDetail', { event: nextEvent })}
                  activeOpacity={0.88}
                >
                  <View style={s.eventBody}>
                    <View style={s.eventBodyLeft}>
                      <View style={s.eventImgWrap}>
                        {nextEvent.image_url ? (
                          <Image source={{ uri: nextEvent.image_url }} style={s.eventImg} resizeMode="cover" />
                        ) : (
                          <View style={[s.eventImgPlaceholder, { backgroundColor: color + '22' }]}>
                            <Text style={{ fontSize: 24 }}>{emoji}</Text>
                          </View>
                        )}
                        <View style={s.eventImgOverlay}>
                          <View style={[s.eventCatChip, { backgroundColor: color }]}>
                            <Text style={[s.eventCatTxt, { color: '#fff' }]}>{nextEvent.category?.toUpperCase()}</Text>
                          </View>
                          <View style={[s.freePill, { backgroundColor: nextEvent.is_free ? '#28D99E' : '#F4A227' }]}>
                            <Text style={{ fontSize: 8, fontWeight: '800', color: '#fff' }}>
                              {nextEvent.is_free ? 'FREE' : (nextEvent.price || 'PAID')}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={s.eventInfo}>
                        <Text style={[s.eventImgTitle, { color: C.cream }]} numberOfLines={2}>
                          {nextEvent.title}
                        </Text>
                        <View style={s.eventChipRow}>
                          <View style={[s.eventInfoChip, { backgroundColor: C.card2 }]}>
                            <Ionicons name="calendar-outline" size={9} color={color} />
                            <Text style={[s.eventInfoTxt, { color: C.c60 }]}>{dateStr}</Text>
                          </View>
                          <View style={[s.eventInfoChip, { backgroundColor: C.card2 }]}>
                            <Ionicons name="time-outline" size={9} color={color} />
                            <Text style={[s.eventInfoTxt, { color: C.c60 }]}>{timeStr}</Text>
                          </View>
                        </View>
                        <View style={s.eventRsvpRow}>
                          <Text style={[s.eventAttendees, { color: C.c35 }]}>{nextEvent.rsvp_count} going</Text>
                          <TouchableOpacity
                            style={[s.rsvpPill, { backgroundColor: color }]}
                            onPress={() => navigation.navigate('EventDetail', { event: nextEvent })}
                            activeOpacity={0.85}
                          >
                            <Text style={s.rsvpPillTxt}>RSVP →</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    <View style={s.eventMapWrap}>
                      {nextEvent.latitude != null && nextEvent.longitude != null ? (
                        <MapView
                          style={s.eventMap}
                          region={{
                            latitude:      Number(nextEvent.latitude),
                            longitude:     Number(nextEvent.longitude),
                            latitudeDelta:  0.01,
                            longitudeDelta: 0.01,
                          }}
                          scrollEnabled={false}
                          zoomEnabled={false}
                          pitchEnabled={false}
                          rotateEnabled={false}
                          pointerEvents="none"
                        >
                          <Marker coordinate={{ latitude: Number(nextEvent.latitude), longitude: Number(nextEvent.longitude) }} />
                        </MapView>
                      ) : (
                        <View style={[s.eventMapPlaceholder, { backgroundColor: color + '15' }]}>
                          <Ionicons name="location" size={20} color={color} />
                          <Text style={[s.eventMapLocTxt, { color: C.c35 }]} numberOfLines={4}>
                            {nextEvent.location}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })()}


        </ScrollView>

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const getStyles = (C) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // ── Header ──────────────────────────────────────────────────────────────────
  headerWrap: { backgroundColor: C.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border, paddingBottom: 12 },

  locBar:    { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  locBarTxt: { fontSize: 13, fontWeight: '700', color: C.cream, letterSpacing: -0.1 },

  // Row 1
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8,
  },
  headerRight:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn:  { width: 34, height: 34, borderRadius: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  notifDot:       { position: 'absolute', top: -3, right: -3, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  notifDotTxt:    { fontSize: 8, fontWeight: '800', color: '#fff' },
  avatarBorder:   { borderRadius: 17, borderWidth: 1.5, borderColor: C.border, overflow: 'hidden' },
  // Segmented scope control
  segmentWrap:      { flexDirection: 'row', marginHorizontal: 14, marginBottom: 10, backgroundColor: C.card, borderRadius: 14, padding: 3, borderWidth: 1, borderColor: C.border },
  segmentBtn:       { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 11 },
  segmentBtnActive: { backgroundColor: C.vividD },
  segmentTxt:       { fontSize: 13, fontWeight: '700', color: C.c35 },
  segmentTxtActive: { color: C.vivid },

  // ── Category bar ─────────────────────────────────────────────────────────────
  catRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: H_PAD, paddingTop: 6, paddingBottom: 10,
    backgroundColor: C.bg,
  },
  catItem:   { alignItems: 'center', gap: 5, flex: 1 },
  catIconBox:{
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6,
    elevation: 4,
  },
  catEmoji:  { fontSize: 20 },
  catLabel:  { fontSize: 10, fontWeight: '700', textAlign: 'center', letterSpacing: 0.1 },

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

  // ── Greeting ─────────────────────────────────────────────────────────────────
  greetingWrap: { paddingHorizontal: H_PAD, paddingTop: 10, paddingBottom: 2 },
  greetingHi:   { fontSize: 23, fontWeight: '800', color: C.cream, letterSpacing: -0.5 },
  greetingBy:   { fontSize: 13, color: C.c35, marginTop: 3 },

  // ── Section ───────────────────────────────────────────────────────────────────
  section:      { marginTop: 28 },
  sectionHdr:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: H_PAD, marginBottom: 14 },
  sectionTitle:    { fontSize: 17, fontWeight: '900', color: C.cream, letterSpacing: -0.3 },
  sectionTitleWrap:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionAccent:   { width: 3, height: 16, borderRadius: 2, backgroundColor: '#3B8BF7' },
  sectionSub:      { fontSize: 10, color: C.c35, marginTop: 2 },
  seeAllBtn:       { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#3B8BF715', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  seeAllTxt:       { fontSize: 12, fontWeight: '700', color: '#3B8BF7' },

  // ── Listing grid (2-row horizontal scroll) ────────────────────────────────────
  hGridContent: { paddingHorizontal: H_PAD, gap: CARD_GAP, flexDirection: 'row', alignItems: 'flex-start' },
  gridCard: {
    width: H_CARD_W, height: 175,
    borderRadius: 16, overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 10,
    elevation: 5,
  },
  gridImg:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gridImgEmpty: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  gridIconCircle: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  gridOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 10, paddingTop: 28, paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  gridOverlayPrice: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2, marginBottom: 2 },
  gridOverlayTitle: { fontSize: 12, fontWeight: '800', color: '#fff', lineHeight: 17 },
  gridLocRow:       { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  gridOverlayLoc:   { fontSize: 9, color: 'rgba(255,255,255,0.6)' },
  gridTypeBadge: {
    position: 'absolute', top: 9, left: 9,
    borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4,
  },
  gridTypeTxt:  { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.4 },
  gridTopRight: { position: 'absolute', top: 9, right: 9, flexDirection: 'row', alignItems: 'center', gap: 4 },
  gridHotEmoji: { fontSize: 13 },
  gridVerifiedBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },

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

  // ── Upcoming event card ───────────────────────────────────────────────────────
  eventCard:           { marginHorizontal: H_PAD, borderRadius: 16, borderWidth: 1, overflow: 'hidden', backgroundColor: C.card, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 3 },
  eventImg:            { width: '100%', height: '100%' },
  eventImgPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  eventImgOverlay:     { position: 'absolute', top: 6, left: 6, right: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eventImgTitle:       { fontSize: 12, fontWeight: '800', lineHeight: 17 },
  eventImgOrganizer:   { fontSize: 10, marginTop: 1 },
  eventCatChip:        { alignSelf: 'flex-start', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  eventCatTxt:         { fontSize: 8, fontWeight: '800', letterSpacing: 0.4 },
  freePill:            { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', flexShrink: 0 },

  // left col + right map split
  eventBody:           { flexDirection: 'row', height: 170 },
  eventBodyLeft:       { flex: 1, flexDirection: 'column' },
  eventImgWrap:        { flex: 1, position: 'relative' },
  eventInfo:           { paddingHorizontal: 10, paddingVertical: 8, gap: 5, justifyContent: 'space-between' },
  eventChipRow:        { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  eventInfoChip:       { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: C.border },
  eventInfoTxt:        { fontSize: 9 },
  eventRsvpRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eventAttendees:      { fontSize: 10, color: C.c35 },
  rsvpPill:            { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 },
  rsvpPillTxt:         { fontSize: 11, fontWeight: '800', color: '#fff' },

  // map panel (right half)
  eventMapWrap:        { width: '45%', borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: C.border, overflow: 'hidden' },
  eventMap:            { width: '100%', height: '100%' },
  eventMapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8 },
  eventMapLocTxt:      { fontSize: 9, textAlign: 'center', lineHeight: 13 },

  // ── States ────────────────────────────────────────────────────────────────────
  centerState:   { alignItems: 'center', paddingVertical: 40, gap: 8, paddingHorizontal: 20 },
  emptyTitle:    { fontSize: 15, fontWeight: '700', color: C.cream, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: C.c35, textAlign: 'center' },
  retryBtn:      { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: '#3B8BF7' },
  retryTxt:      { fontSize: 13, fontWeight: '700', color: 'white' },

  iconBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

  // ── Post preview strip ────────────────────────────────────────────────────
  pCard:        { width: POST_CARD_W, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 10, gap: 6 },
  pCardTop:     { flexDirection: 'row', alignItems: 'center', gap: 7 },
  pCardName:    { fontSize: 12, fontWeight: '700', color: C.cream },
  pCardTime:    { fontSize: 10, color: C.c35 },
  pCardBody:    { fontSize: 12, color: C.c60, lineHeight: 17 },
  pCardTopics:  { flexDirection: 'row', gap: 5 },
  pCardTopic:   { fontSize: 10, fontWeight: '600', color: '#3B8BF7' },
  pCardFooter:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, paddingTop: 6 },
  pCardStat:    { fontSize: 11, fontWeight: '600', color: C.c35 },
  pCardDot:     { fontSize: 10, color: C.c35 },

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
