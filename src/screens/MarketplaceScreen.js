import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  RefreshControl, Image, ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { SUGGESTED_CITIES } from '../components/AppTopBar';

const NAVY       = '#1B3266';
const ACCENT     = '#00B4D8';
const ACCENT_DIM = '#00B4D81A';

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

const CARD_GAP = 10;
const H_PAD    = 16;
const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - H_PAD * 2 - CARD_GAP) / 2;

export const MARKET_CATEGORIES = [
  { key: 'all',         label: 'All',          icon: 'grid-outline' },
  { key: 'electronics', label: 'Electronics',   icon: 'phone-portrait-outline' },
  { key: 'furniture',   label: 'Furniture',     icon: 'bed-outline' },
  { key: 'clothing',    label: 'Clothing',      icon: 'shirt-outline' },
  { key: 'vehicles',    label: 'Vehicles',      icon: 'car-outline' },
  { key: 'food',        label: 'Food',          icon: 'fast-food-outline' },
  { key: 'services',    label: 'Services',      icon: 'construct-outline' },
  { key: 'books',       label: 'Books',         icon: 'book-outline' },
  { key: 'other',       label: 'Other',         icon: 'ellipsis-horizontal-outline' },
];

function formatTime(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function GridCard({ item, onPress, C, s, userLat, userLng }) {
  const dist = formatDist(distanceMiles(userLat, userLng, item.latitude, item.longitude));
  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: C.card, borderColor: item.is_hot ? ACCENT + '55' : C.border }]}
      activeOpacity={0.88}
      onPress={() => onPress(item)}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={s.cardImg} resizeMode="cover" />
      ) : (
        <View style={[s.cardImgPlaceholder, { backgroundColor: C.card2 }]}>
          <Ionicons name="image-outline" size={26} color={C.c35} />
        </View>
      )}

      {item.is_hot && (
        <View style={s.hotBadge}>
          <Ionicons name="flame" size={10} color={ACCENT} />
        </View>
      )}

      {dist && (
        <View style={s.distBadge}>
          <Ionicons name="navigate-outline" size={9} color={ACCENT} />
          <Text style={s.distTxt}>{dist}</Text>
        </View>
      )}

      <View style={s.cardBody}>
        <Text style={[s.cardTitle, { color: C.cream }]} numberOfLines={2}>{item.title}</Text>
        <Text style={s.cardPrice}>{item.price || 'Ask'}</Text>
        {item.location ? (
          <View style={s.locRow}>
            <Ionicons name="location-outline" size={9} color={C.c35} />
            <Text style={[s.locTxt, { color: C.c35 }]} numberOfLines={1}>{item.location}</Text>
          </View>
        ) : null}
        <Text style={[s.timeTxt, { color: C.c35 }]}>{formatTime(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MarketplaceScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const api         = useAuthStore(st => st.api);
  const authUser    = useAuthStore(st => st.user);
  const homeCountry = authUser?.profile?.home_country || '';
  const countryFlag = authUser?.profile?.country_flag || '🌍';
  const userLat     = useLocationStore(st => st.latitude);
  const userLng     = useLocationStore(st => st.longitude);
  const currentCity = useLocationStore(st => st.city);
  const setCity     = useLocationStore(st => st.setCity);
  const forceDetect = useLocationStore(st => st.forceDetect);
  const cityShort   = currentCity?.split(',')[0] || 'Set location';

  const [cityOpen,   setCityOpen]   = useState(false);
  const [locating,   setLocating]   = useState(false);

  const [listings,       setListings]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [search,         setSearch]         = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [scope,          setScope]          = useState(homeCountry ? 'community' : 'all');
  const [showMine,       setShowMine]       = useState(false);

  const fetchListings = useCallback(async (
    searchText = search,
    cat        = activeCategory,
    sc         = scope,
    lat        = userLat,
    lng        = userLng,
  ) => {
    try {
      const params = new URLSearchParams();
      if (searchText.trim())             params.append('search',    searchText.trim());
      if (cat && cat !== 'all')          params.append('category',  cat);
      if (sc === 'community' && homeCountry) params.append('community', homeCountry);
      if (lat != null && lng != null)    { params.append('lat', lat); params.append('lng', lng); }
      const query = params.toString();
      const data  = await api(`/marketplace/${query ? '?' + query : ''}`);
      setListings(Array.isArray(data) ? data : (data.results || []));
    } catch {
      // silently keep existing list
    } finally {
      setLoading(false);
    }
  }, [api, search, activeCategory, scope, homeCountry, userLat, userLng]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchListings(search, activeCategory, scope, userLat, userLng);
    }, [activeCategory, scope, userLat, userLng])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings(search, activeCategory, scope);
    setRefreshing(false);
  }, [fetchListings]);

  function handleSearch(text) {
    setSearch(text);
    fetchListings(text, activeCategory, scope);
  }

  function handleCategory(cat) {
    setActiveCategory(cat);
    setShowMine(false);
    setLoading(true);
    fetchListings(search, cat, scope);
  }

  function handleScope(sc) {
    setScope(sc);
    setShowMine(false);
    setLoading(true);
    fetchListings(search, activeCategory, sc);
  }

  const displayed = useMemo(() => {
    if (!showMine) return listings;
    return listings.filter(item => String(item.poster_id) === String(authUser?.id));
  }, [listings, showMine, authUser]);

  function renderItem({ item, index }) {
    const isLeft = index % 2 === 0;
    return (
      <View style={[s.gridItem, isLeft ? { marginRight: CARD_GAP / 2 } : { marginLeft: CARD_GAP / 2 }]}>
        <GridCard
          item={item}
          onPress={i => navigation.navigate('MarketplaceDetail', { item: i })}
          C={C}
          s={s}
          userLat={userLat}
          userLng={userLng}
        />
      </View>
    );
  }

  const activeCatLabel = MARKET_CATEGORIES.find(c => c.key === activeCategory)?.label;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Title + city picker */}
        <TouchableOpacity style={{ flex: 1 }} onPress={() => setCityOpen(v => !v)} activeOpacity={0.75}>
          <Text style={s.title}>Marketplace</Text>
          <View style={s.cityRow}>
            <Ionicons name="location" size={10} color={ACCENT} />
            <Text style={[s.cityTxt, { color: ACCENT }]} numberOfLines={1}>
              {cityShort !== 'Set location' ? cityShort : 'Pick city'}
            </Text>
            <Ionicons name={cityOpen ? 'chevron-up' : 'chevron-down'} size={10} color={C.c35} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.iconBtn, showMine && { backgroundColor: ACCENT + '33', borderColor: ACCENT + '55' }]}
          onPress={() => setShowMine(v => !v)}
          activeOpacity={0.8}
        >
          <Ionicons name="person" size={15} color={showMine ? ACCENT : 'rgba(255,255,255,0.6)'} />
        </TouchableOpacity>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('PostMarketplace')} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Scope pills */}
      <View style={s.scopeRow}>
        <TouchableOpacity
          style={[s.scopePill, scope === 'all' && s.scopePillActive]}
          onPress={() => handleScope('all')}
          activeOpacity={0.75}
        >
          <Ionicons name="globe-outline" size={13} color={scope === 'all' ? '#fff' : 'rgba(255,255,255,0.5)'} />
          <Text style={[s.scopePillTxt, scope === 'all' && s.scopePillTxtActive]}>Everyone nearby</Text>
        </TouchableOpacity>
        {homeCountry ? (
          <TouchableOpacity
            style={[s.scopePill, scope === 'community' && s.scopePillActive]}
            onPress={() => handleScope('community')}
            activeOpacity={0.75}
          >
            <Text style={{ fontSize: 12, lineHeight: 16 }}>{countryFlag}</Text>
            <Text style={[s.scopePillTxt, scope === 'community' && s.scopePillTxtActive]}>
              {homeCountry} nearby
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* City dropdown */}
      {cityOpen && (
        <>
          <TouchableOpacity style={s.cityOverlay} activeOpacity={1} onPress={() => setCityOpen(false)} />
          <View style={[s.cityDropdown, { backgroundColor: C.nav, borderColor: C.border }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ maxHeight: 280 }}>
              {/* Near Me */}
              <TouchableOpacity
                style={[s.cityItem, { borderBottomColor: C.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                activeOpacity={0.75}
                disabled={locating}
                onPress={async () => {
                  setLocating(true);
                  await forceDetect();
                  setLocating(false);
                  setCityOpen(false);
                }}
              >
                <View style={[s.cityIcon, { backgroundColor: ACCENT_DIM }]}>
                  {locating
                    ? <ActivityIndicator size="small" color={ACCENT} />
                    : <Ionicons name="navigate" size={14} color={ACCENT} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cityName, { color: C.cream }]}>{locating ? 'Getting location…' : 'Near Me'}</Text>
                  <Text style={[s.citySub, { color: C.c35 }]}>Use your current GPS location</Text>
                </View>
              </TouchableOpacity>

              {/* City list */}
              {SUGGESTED_CITIES.map((city, idx) => {
                const active = city.name === currentCity;
                const isLast = idx === SUGGESTED_CITIES.length - 1;
                return (
                  <TouchableOpacity
                    key={city.name}
                    style={[s.cityItem, !isLast && { borderBottomColor: C.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                    activeOpacity={0.75}
                    onPress={() => { setCity(city.name, city.lat, city.lng); setCityOpen(false); }}
                  >
                    <View style={[s.cityIcon, { backgroundColor: active ? ACCENT_DIM : C.card2 }]}>
                      <Ionicons name="location-outline" size={14} color={active ? ACCENT : C.c35} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.cityName, { color: active ? ACCENT : C.cream }]}>{city.name.split(',')[0]}</Text>
                      <Text style={[s.citySub, { color: C.c35 }]}>{city.name.split(', ')[1] || ''}</Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={16} color={ACCENT} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={[s.searchBox, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="search-outline" size={16} color={C.c35} />
          <TextInput
            style={[s.searchInput, { color: C.cream }]}
            placeholder="Search listings…"
            placeholderTextColor={C.c35}
            value={search}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color={C.c35} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.catBar}
        style={s.catScroll}
      >
        {MARKET_CATEGORIES.map(cat => {
          const active = activeCategory === cat.key && !showMine;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[s.catChip, { backgroundColor: active ? ACCENT : C.card, borderColor: active ? ACCENT : C.border }]}
              onPress={() => handleCategory(cat.key)}
              activeOpacity={0.8}
            >
              <Ionicons name={cat.icon} size={13} color={active ? '#fff' : C.c35} />
              <Text style={[s.catChipTxt, { color: active ? '#fff' : C.c35 }]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* My Listings banner */}
      {showMine && (
        <View style={[s.mineBanner, { backgroundColor: ACCENT_DIM, borderColor: ACCENT + '33' }]}>
          <Ionicons name="person-circle-outline" size={15} color={ACCENT} />
          <Text style={[s.mineTxt, { color: ACCENT }]}>Showing your listings</Text>
          <TouchableOpacity onPress={() => setShowMine(false)} activeOpacity={0.7}>
            <Ionicons name="close" size={15} color={ACCENT} />
          </TouchableOpacity>
        </View>
      )}

      {/* Grid */}
      {loading && listings.length === 0 ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
          ListHeaderComponent={
            <Text style={s.countLabel}>
              {displayed.length} LISTING{displayed.length !== 1 ? 'S' : ''}
              {showMine ? ' · MY LISTINGS' : scope === 'community' ? ` · ${homeCountry.toUpperCase()}` : activeCategory !== 'all' ? ` · ${activeCatLabel?.toUpperCase()}` : ''}
            </Text>
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="storefront-outline" size={44} color={C.c35} />
              <Text style={[s.emptyTxt, { color: C.cream }]}>No listings found</Text>
              <Text style={[s.emptySub, { color: C.c35 }]}>
                {showMine ? "You haven't posted anything yet" : scope === 'community' ? `No listings from ${homeCountry} yet` : activeCategory !== 'all' ? 'Try a different category' : 'Be the first to post something'}
              </Text>
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity
              style={s.postCta}
              onPress={() => navigation.navigate('PostMarketplace')}
              activeOpacity={0.85}
            >
              <Ionicons name="storefront-outline" size={16} color={ACCENT} />
              <View style={{ flex: 1 }}>
                <Text style={[s.postCtaTitle, { color: C.cream }]}>Have something to sell?</Text>
                <Text style={[s.postCtaSub, { color: C.c35 }]}>List it for free in seconds</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={ACCENT} />
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, backgroundColor: NAVY },
  backBtn:   { width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:     { fontSize: 15, fontWeight: '800', color: '#fff' },
  cityRow:   { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  cityTxt:   { fontSize: 11, fontWeight: '600', flex: 1 },
  iconBtn:   { width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  flagEmoji: { fontSize: 15 },
  addBtn:    { width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },

  cityOverlay:  { position: 'absolute', top: 0, left: -1000, right: -1000, bottom: -2000, zIndex: 49 },
  cityDropdown: { position: 'absolute', top: 62, left: H_PAD, right: H_PAD, zIndex: 50, borderWidth: 1, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  cityItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  cityIcon:     { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cityName:     { fontSize: 14, fontWeight: '700' },
  citySub:      { fontSize: 11, marginTop: 1 },

  scopeRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingBottom: 10, backgroundColor: NAVY },
  scopePill:        { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  scopePillActive:  { backgroundColor: 'rgba(255,255,255,0.22)', borderColor: 'rgba(255,255,255,0.4)' },
  scopePillTxt:     { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  scopePillTxtActive: { color: '#fff', fontWeight: '700' },

  searchWrap:  { paddingHorizontal: H_PAD, paddingTop: 10, marginBottom: 8 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 42 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },

  catScroll: { flexGrow: 0, marginBottom: 10 },
  catBar:    { paddingHorizontal: H_PAD, gap: 8, flexDirection: 'row', alignItems: 'center' },
  catChip:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  catChipTxt:{ fontSize: 12, fontWeight: '600' },

  mineBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: H_PAD, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  mineTxt:    { flex: 1, fontSize: 12, fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list:       { paddingHorizontal: H_PAD, paddingTop: 4, paddingBottom: 30 },
  countLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 10 },

  gridItem: { flex: 1 },

  empty:    { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: 12 },

  card:               { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginBottom: CARD_GAP },
  cardImg:            { width: '100%', height: CARD_W * 0.85 },
  cardImgPlaceholder: { width: '100%', height: CARD_W * 0.75, alignItems: 'center', justifyContent: 'center' },
  hotBadge:  { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 7, backgroundColor: ACCENT_DIM, borderWidth: 1, borderColor: ACCENT + '55', alignItems: 'center', justifyContent: 'center' },
  distBadge: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  distTxt:   { fontSize: 9, fontWeight: '700', color: ACCENT },
  cardBody:  { padding: 10, gap: 3 },
  cardTitle: { fontSize: 13, fontWeight: '700', lineHeight: 17 },
  cardPrice: { fontSize: 13, fontWeight: '800', color: ACCENT },
  locRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locTxt:    { fontSize: 10, flex: 1 },
  timeTxt:   { fontSize: 10, marginTop: 1 },

  postCta:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, borderColor: ACCENT + '33', backgroundColor: ACCENT_DIM, marginTop: 4 },
  postCtaTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  postCtaSub:   { fontSize: 11 },
});
