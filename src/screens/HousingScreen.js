import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  RefreshControl, Image, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useHousingStore } from '../store/housingStore';
import { useLocationStore } from '../store/locationStore';
import { SUGGESTED_CITIES } from '../components/AppTopBar';

const NAVY     = '#1B3266';
const GOLD     = '#F5A623';
const GOLD_DIM = '#F5A62318';

const CARD_GAP = 10;
const H_PAD    = 16;
const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - H_PAD * 2 - CARD_GAP) / 2;

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

function HousingGridCard({ listing, onPress, C, s, userLat, userLng }) {
  const dist = formatDist(distanceMiles(userLat, userLng, listing.latitude, listing.longitude));
  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: C.card, borderColor: listing.featured ? '#9B72EF55' : C.border }]}
      activeOpacity={0.88}
      onPress={() => onPress(listing)}
    >
      {listing.image_url ? (
        <Image source={{ uri: listing.image_url }} style={s.cardImg} resizeMode="cover" />
      ) : (
        <View style={[s.cardImgPlaceholder, { backgroundColor: C.card2 }]}>
          <Ionicons name="home-outline" size={26} color={C.c35} />
        </View>
      )}
      {listing.featured && (
        <View style={[s.hotBadge, { backgroundColor: '#9B72EF22', borderColor: '#9B72EF55' }]}>
          <Ionicons name="star" size={10} color="#9B72EF" />
        </View>
      )}
      {dist && (
        <View style={s.distBadge}>
          <Ionicons name="navigate-outline" size={9} color={GOLD} />
          <Text style={[s.distTxt, { color: GOLD }]}>{dist}</Text>
        </View>
      )}
      <View style={s.cardBody}>
        <Text style={[s.cardTitle, { color: C.cream }]} numberOfLines={2}>{listing.title}</Text>
        <Text style={[s.cardPrice, { color: GOLD }]}>{listing.price}</Text>
        {listing.location ? (
          <View style={s.locRow}>
            <Ionicons name="location-outline" size={9} color={C.c35} />
            <Text style={[s.locTxt, { color: C.c35 }]} numberOfLines={1}>{listing.location}</Text>
          </View>
        ) : null}
        <Text style={[s.timeTxt, { color: C.c35 }]}>{listing.time}</Text>
      </View>
    </TouchableOpacity>
  );
}

export const HOUSING_CATEGORIES = [
  { key: 'all',        label: 'All',        icon: 'grid-outline' },
  { key: 'apartment',  label: 'Apartment',  icon: 'business-outline' },
  { key: 'house',      label: 'House',      icon: 'home-outline' },
  { key: 'room',       label: 'Room',       icon: 'bed-outline' },
  { key: 'studio',     label: 'Studio',     icon: 'cube-outline' },
  { key: 'condo',      label: 'Condo',      icon: 'layers-outline' },
  { key: 'shared',     label: 'Shared',     icon: 'people-outline' },
  { key: 'commercial', label: 'Commercial', icon: 'storefront-outline' },
  { key: 'other',      label: 'Other',      icon: 'ellipsis-horizontal-outline' },
];


export default function HousingScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const { user: authUser } = useAuthStore();
  const homeCountry   = authUser?.profile?.home_country || '';
  const countryFlag   = authUser?.profile?.country_flag || '';
  const currentUserId = authUser?.id ?? null;

  const listings      = useHousingStore(st => st.listings);
  const loading       = useHousingStore(st => st.loading);
  const fetchListings = useHousingStore(st => st.fetchListings);
  const deleteListing = useHousingStore(st => st.deleteListing);

  const currentCity = useLocationStore(st => st.city);
  const setCity     = useLocationStore(st => st.setCity);
  const forceDetect = useLocationStore(st => st.forceDetect);
  const lat         = useLocationStore(st => st.latitude);
  const lng         = useLocationStore(st => st.longitude);
  const cityShort   = currentCity?.split(',')[0] || 'Set location';

  const [scope,      setScope]      = useState('all');
  const [search,     setSearch]     = useState('');
  const [activeCat,  setActiveCat]  = useState('all');
  const [showMine,   setShowMine]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cityOpen,   setCityOpen]   = useState(false);
  const [locating,   setLocating]   = useState(false);

  const doFetch = useCallback((sc = scope, cat = activeCat, q = search) => {
    fetchListings({ scope: sc, homeCountry, search: q, category: cat, lat, lng });
  }, [scope, activeCat, search, homeCountry, lat, lng]);

  useFocusEffect(useCallback(() => { doFetch(); }, [activeCat, scope, lat, lng]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings({ scope, search, homeCountry, category: activeCat, lat, lng });
    setRefreshing(false);
  }, [scope, search, homeCountry, activeCat, lat, lng]);

  const displayed = useMemo(() => {
    if (!showMine || !currentUserId) return listings;
    return listings.filter(l => String(l.poster_id) === String(currentUserId));
  }, [listings, showMine, currentUserId]);

  const handleSearch = (text) => {
    setSearch(text);
    fetchListings({ scope, search: text, homeCountry, category: activeCat, lat, lng });
  };

  const handleCategory = (key) => {
    setActiveCat(key);
    fetchListings({ scope, homeCountry, search, category: key, lat, lng });
  };

  const handleDelete = (listing) => {
    Alert.alert('Delete listing', 'Remove this listing permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteListing(listing.id).catch(() => Alert.alert('Error', 'Could not delete.')) },
    ]);
  };

  const isOwn = (listing) => listing.poster_id && currentUserId && String(listing.poster_id) === String(currentUserId);

  function renderItem({ item, index }) {
    const isLeft = index % 2 === 0;
    return (
      <View style={[s.gridItem, isLeft ? { marginRight: CARD_GAP / 2 } : { marginLeft: CARD_GAP / 2 }]}>
        <HousingGridCard
          listing={item}
          onPress={l => navigation.navigate('HousingDetail', { listing: l })}
          C={C} s={s} userLat={lat} userLng={lng}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={{ flex: 1 }} onPress={() => setCityOpen(v => !v)} activeOpacity={0.75}>
          <Text style={s.title}>Housing</Text>
          <View style={s.cityRow}>
            <Ionicons name="location" size={10} color={GOLD} />
            <Text style={[s.cityTxt, { color: GOLD }]} numberOfLines={1}>
              {cityShort !== 'Set location' ? cityShort : 'Pick city'}
            </Text>
            <Ionicons name={cityOpen ? 'chevron-up' : 'chevron-down'} size={10} color={C.c35} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.mineBtn, scope === 'all' && { backgroundColor: GOLD_DIM, borderColor: GOLD + '66' }]}
          onPress={() => { setScope('all'); doFetch('all', activeCat, search); }}
          activeOpacity={0.75}
        >
          <Ionicons name="globe-outline" size={16} color={scope === 'all' ? GOLD : 'rgba(255,255,255,0.6)'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.mineBtn, scope === 'community' && { backgroundColor: GOLD + '33', borderColor: GOLD + '66' }]}
          onPress={() => { setScope('community'); doFetch('community', activeCat, search); }}
          activeOpacity={0.75}
        >
          <Text style={s.scopeFlagEmoji}>{countryFlag || '🌍'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.mineBtn, showMine && { backgroundColor: GOLD + '33', borderColor: GOLD + '55' }]}
          onPress={() => setShowMine(v => !v)}
          activeOpacity={0.8}
        >
          <Ionicons name="person" size={15} color={showMine ? GOLD : 'rgba(255,255,255,0.6)'} />
        </TouchableOpacity>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('PostHousing')} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* City dropdown */}
      {cityOpen && (
        <>
          <TouchableOpacity style={s.cityOverlay} activeOpacity={1} onPress={() => setCityOpen(false)} />
          <View style={[s.cityDropdown, { backgroundColor: C.nav, borderColor: C.border }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ maxHeight: 280 }}>
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
                <View style={[s.cityIcon, { backgroundColor: GOLD_DIM }]}>
                  {locating ? <ActivityIndicator size="small" color={GOLD} /> : <Ionicons name="navigate" size={14} color={GOLD} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cityName, { color: C.cream }]}>{locating ? 'Getting location…' : 'Near Me'}</Text>
                  <Text style={[s.citySub, { color: C.c35 }]}>Use your current GPS location</Text>
                </View>
              </TouchableOpacity>
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
                    <View style={[s.cityIcon, { backgroundColor: active ? GOLD_DIM : C.card2 }]}>
                      <Ionicons name="location-outline" size={14} color={active ? GOLD : C.c35} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.cityName, { color: active ? GOLD : C.cream }]}>{city.name.split(',')[0]}</Text>
                      <Text style={[s.citySub, { color: C.c35 }]}>{city.name.split(', ')[1] || ''}</Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={16} color={GOLD} />}
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
            placeholder="Search area, title…"
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

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipBar} contentContainerStyle={s.chipBarContent}>
        {HOUSING_CATEGORIES.map(cat => {
          const active = activeCat === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[s.chip, active && { backgroundColor: GOLD_DIM, borderColor: GOLD + '77' }]}
              onPress={() => handleCategory(cat.key)}
              activeOpacity={0.8}
            >
              <Ionicons name={cat.icon} size={13} color={active ? GOLD : C.c35} />
              <Text style={[s.chipTxt, { color: active ? GOLD : C.c35 }, active && { fontWeight: '700' }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Mine banner */}
      {showMine && (
        <View style={[s.mineBanner, { backgroundColor: GOLD_DIM, borderColor: GOLD + '33' }]}>
          <Ionicons name="person-circle-outline" size={14} color={GOLD} />
          <Text style={[s.mineBannerTxt, { color: GOLD }]}>Showing your listings only</Text>
          <TouchableOpacity onPress={() => setShowMine(false)} hitSlop={8}>
            <Ionicons name="close" size={14} color={GOLD} />
          </TouchableOpacity>
        </View>
      )}

      {loading && listings.length === 0 ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
          ListHeaderComponent={
            <Text style={s.countLabel}>
              {displayed.length} LISTING{displayed.length !== 1 ? 'S' : ''}
              {showMine ? ' · MINE' : scope === 'community' ? ` · ${homeCountry.toUpperCase()}` : ''}
            </Text>
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="home-outline" size={44} color={C.c35} />
              <Text style={[s.emptyTxt, { color: C.cream }]}>
                {showMine ? 'You have no listings yet' : scope === 'community' ? 'No listings in your community' : 'No listings yet'}
              </Text>
              <Text style={[s.emptySub, { color: C.c35 }]}>
                {showMine ? 'Post your first listing' : 'Be the first to post'}
              </Text>
              {(showMine || scope !== 'all') && (
                <TouchableOpacity
                  style={[s.switchBtn, { backgroundColor: GOLD_DIM, borderColor: GOLD + '44' }]}
                  onPress={() => { setShowMine(false); setScope('all'); }}
                  activeOpacity={0.8}
                >
                  <Text style={[s.switchBtnTxt, { color: GOLD }]}>View all listings</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity
              style={[s.postCta, { backgroundColor: GOLD_DIM, borderColor: GOLD + '33' }]}
              onPress={() => navigation.navigate('PostHousing')}
              activeOpacity={0.85}
            >
              <Ionicons name="home" size={16} color={GOLD} />
              <View style={{ flex: 1 }}>
                <Text style={[s.postCtaTitle, { color: C.cream }]}>Have a room or apartment?</Text>
                <Text style={[s.postCtaSub, { color: C.c35 }]}>Share it with your community</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={GOLD} />
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, backgroundColor: NAVY },
  backBtn:  { width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:    { fontSize: 15, fontWeight: '800', color: '#fff' },
  cityRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  cityTxt:  { fontSize: 11, fontWeight: '600', flex: 1 },
  mineBtn:  { width: 32, height: 32, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  addBtn:   { width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },

  scopeFlagEmoji: { fontSize: 15 },

  cityOverlay:  { position: 'absolute', top: 0, left: -1000, right: -1000, bottom: -2000, zIndex: 49 },
  cityDropdown: { position: 'absolute', top: 62, left: 16, right: 16, zIndex: 50, borderWidth: 1, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  cityItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  cityIcon:     { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cityName:     { fontSize: 14, fontWeight: '700' },
  citySub:      { fontSize: 11, marginTop: 1 },

  searchWrap:  { paddingHorizontal: 16, paddingTop: 10, marginBottom: 8 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 42 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },

  chipBar:        { maxHeight: 44, marginBottom: 8 },
  chipBarContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.card },
  chipTxt:        { fontSize: 12, fontWeight: '600', color: C.c35 },

  mineBanner:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  mineBannerTxt: { flex: 1, fontSize: 12, fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },

  list:       { paddingHorizontal: H_PAD, paddingTop: 4, paddingBottom: 30 },
  countLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 10 },

  gridItem: { flex: 1 },

  empty:        { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt:     { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptySub:     { fontSize: 12 },
  switchBtn:    { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, borderWidth: 1 },
  switchBtnTxt: { fontSize: 13, fontWeight: '700' },

  card:               { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginBottom: CARD_GAP },
  cardImg:            { width: '100%', height: CARD_W * 0.85 },
  cardImgPlaceholder: { width: '100%', height: CARD_W * 0.75, alignItems: 'center', justifyContent: 'center' },
  hotBadge:  { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  distBadge: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  distTxt:   { fontSize: 9, fontWeight: '700' },
  cardBody:  { padding: 10, gap: 3 },
  cardTitle: { fontSize: 13, fontWeight: '700', lineHeight: 17 },
  cardPrice: { fontSize: 13, fontWeight: '800' },
  locRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locTxt:    { fontSize: 10, flex: 1 },
  timeTxt:   { fontSize: 10, marginTop: 1 },

  postCta:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 4 },
  postCtaTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  postCtaSub:   { fontSize: 11 },
});
