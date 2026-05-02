import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';

const ACCENT     = '#00B4D8';
const ACCENT_DIM = '#00B4D81A';

const CATEGORIES = [
  { key: 'all',         label: 'All',         icon: 'grid-outline' },
  { key: 'electronics', label: 'Electronics', icon: 'phone-portrait-outline' },
  { key: 'furniture',   label: 'Furniture',   icon: 'bed-outline' },
  { key: 'clothing',    label: 'Clothing',    icon: 'shirt-outline' },
  { key: 'vehicles',    label: 'Vehicles',    icon: 'car-outline' },
  { key: 'books',       label: 'Books',       icon: 'book-outline' },
  { key: 'services',    label: 'Services',    icon: 'construct-outline' },
  { key: 'food',        label: 'Food',        icon: 'fast-food-outline' },
  { key: 'other',       label: 'Other',       icon: 'ellipsis-horizontal-circle-outline' },
];

function formatTime(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function MarketplaceScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const api         = useAuthStore(st => st.api);
  const user        = useAuthStore(st => st.user);
  const locLat      = useLocationStore(st => st.latitude);
  const locLng      = useLocationStore(st => st.longitude);
  const locCity     = useLocationStore(st => st.city);

  const homeCountry = user?.profile?.home_country || '';
  const countryFlag = user?.profile?.country_flag || '🌍';

  const SCOPES = [
    { key: 'all',       label: '🌍 All' },
    { key: 'community', label: `${countryFlag} Community` },
    { key: 'nearby',    label: '📍 Nearby' },
  ];

  const [scope,          setScope]    = useState('all');
  const [listings,       setListings] = useState([]);
  const [loading,        setLoading]  = useState(true);
  const [refreshing,     setRefreshing] = useState(false);
  const [search,         setSearch]   = useState('');
  const [activeCategory, setCategory] = useState('all');

  const fetchListings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim())            params.append('search',    search.trim());
      if (activeCategory !== 'all') params.append('category',  activeCategory);

      if (scope === 'community' && homeCountry) {
        params.append('community', homeCountry);
      } else if (scope === 'nearby' && locLat != null && locLng != null) {
        params.append('lat', locLat);
        params.append('lng', locLng);
      }

      const query = params.toString();
      const data  = await api(`/marketplace/${query ? '?' + query : ''}`);
      setListings(Array.isArray(data) ? data : (data.results || []));
    } catch {
      // silently keep existing list
    } finally {
      setLoading(false);
    }
  }, [api, search, activeCategory, scope, homeCountry, locLat, locLng]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  }, [fetchListings]);

  const handleScopeChange = (key) => {
    setScope(key);
    setLoading(true);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Marketplace</Text>
          <Text style={s.sub}>Buy &amp; sell in your community</Text>
        </View>
        <TouchableOpacity style={s.postBtn} onPress={() => navigation.navigate('PostMarketplace')} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {/* ── Scope tabs ─────────────────────────────────────────── */}
      <View style={[s.scopeBar, { borderBottomColor: C.border }]}>
        {SCOPES.map(sc => {
          const active = sc.key === scope;
          return (
            <TouchableOpacity
              key={sc.key}
              style={[s.scopeTab, active && s.scopeTabActive]}
              onPress={() => handleScopeChange(sc.key)}
              activeOpacity={0.8}
            >
              <Text style={[s.scopeTabTxt, { color: active ? ACCENT : C.c35 }, active && s.scopeTabTxtActive]}>
                {sc.label}
              </Text>
              {active && <View style={[s.scopeUnderline, { backgroundColor: ACCENT }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Search ─────────────────────────────────────────────── */}
      <View style={s.searchWrap}>
        <View style={[s.searchBox, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="search-outline" size={16} color={C.c35} />
          <TextInput
            style={[s.searchInput, { color: C.cream }]}
            placeholder="Search listings…"
            placeholderTextColor={C.c35}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={fetchListings}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color={C.c35} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Category chips ──────────────────────────────────────── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
        {CATEGORIES.map(cat => {
          const active = cat.key === activeCategory;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[s.catChip, { backgroundColor: C.card, borderColor: C.border }, active && s.catChipActive]}
              onPress={() => setCategory(cat.key)}
              activeOpacity={0.8}
            >
              <Ionicons name={cat.icon} size={13} color={active ? ACCENT : C.c35} />
              <Text style={[s.catTxt, { color: C.c35 }, active && s.catTxtActive]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Nearby location label ───────────────────────────────── */}
      {scope === 'nearby' && locCity ? (
        <View style={s.nearbyBanner}>
          <Ionicons name="navigate-circle-outline" size={14} color={ACCENT} />
          <Text style={[s.nearbyTxt, { color: C.c35 }]}>Showing listings near <Text style={{ color: ACCENT, fontWeight: '700' }}>{locCity}</Text></Text>
        </View>
      ) : null}

      {/* ── List ───────────────────────────────────────────────── */}
      {loading && listings.length === 0 ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
        >
          <Text style={s.countLabel}>{listings.length} LISTING{listings.length !== 1 ? 'S' : ''}</Text>

          {listings.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="storefront-outline" size={44} color={C.c35} />
              <Text style={[s.emptyTxt, { color: C.cream }]}>
                {scope === 'community' ? `No listings in your community yet` :
                 scope === 'nearby'    ? 'No nearby listings found' :
                 'No listings yet'}
              </Text>
              <Text style={[s.emptySub, { color: C.c35 }]}>Be the first to post something</Text>
              {scope !== 'all' && (
                <TouchableOpacity
                  style={[s.switchBtn, { backgroundColor: ACCENT_DIM, borderColor: ACCENT + '44' }]}
                  onPress={() => handleScopeChange('all')}
                  activeOpacity={0.8}
                >
                  <Text style={[s.switchBtnTxt, { color: ACCENT }]}>View all listings</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            listings.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[s.card, { backgroundColor: C.card, borderColor: C.border }, item.is_hot && s.cardHot]}
                activeOpacity={0.92}
              >
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={s.cardImg} resizeMode="cover" />
                ) : (
                  <View style={[s.cardImgPlaceholder, { backgroundColor: C.card2 }]}>
                    <Ionicons name="image-outline" size={32} color={C.c35} />
                  </View>
                )}

                <View style={s.cardBody}>
                  <View style={s.cardTop}>
                    <Text style={[s.cardTitle, { color: C.cream }]} numberOfLines={1}>{item.title}</Text>
                    {item.is_hot && (
                      <View style={s.hotBadge}>
                        <Ionicons name="flame" size={10} color={ACCENT} />
                      </View>
                    )}
                  </View>

                  <Text style={s.cardPrice}>{item.price || 'Price on request'}</Text>
                  <Text style={[s.cardDesc, { color: C.c35 }]} numberOfLines={2}>{item.description}</Text>

                  <View style={s.chips}>
                    {item.category ? (
                      <View style={[s.chip, { backgroundColor: C.card2, borderColor: C.border }]}>
                        <Text style={[s.chipTxt, { color: C.c35 }]}>{CATEGORIES.find(c => c.key === item.category)?.label || item.category}</Text>
                      </View>
                    ) : null}
                    {item.location ? (
                      <View style={[s.chip, { backgroundColor: C.card2, borderColor: C.border }]}>
                        <Ionicons name="location-outline" size={10} color={C.c35} />
                        <Text style={[s.chipTxt, { color: C.c35 }]}>{item.location}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={[s.cardFooter, { borderTopColor: C.border }]}>
                    <Text style={[s.posterTxt, { color: C.c35 }]}>{item.poster} · {formatTime(item.created_at)}</Text>
                    <TouchableOpacity
                      style={[s.msgBtn, { backgroundColor: C.card2, borderColor: C.border }]}
                      onPress={() => navigation.navigate('AppMain', { screen: 'Chat', params: { userId: item.poster_id } })}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="chatbubble-outline" size={13} color={C.cream} />
                      <Text style={[s.msgTxt, { color: C.cream }]}>Message</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}

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
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Header
  header:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:   { fontSize: 16, fontWeight: '800', color: C.cream, letterSpacing: -0.3 },
  sub:     { fontSize: 11, color: C.c35, marginTop: 1 },
  postBtn: { width: 40, height: 40, backgroundColor: ACCENT_DIM, borderRadius: 13, borderWidth: 1, borderColor: ACCENT + '55', alignItems: 'center', justifyContent: 'center' },

  // Scope tabs
  scopeBar:         { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 12 },
  scopeTab:         { flex: 1, alignItems: 'center', paddingVertical: 10, position: 'relative' },
  scopeTabActive:   {},
  scopeTabTxt:      { fontSize: 13, fontWeight: '600' },
  scopeTabTxtActive:{ fontWeight: '700' },
  scopeUnderline:   { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, borderRadius: 2 },

  // Search
  searchWrap:  { paddingHorizontal: 16, marginBottom: 10 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 42 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },

  // Category chips
  catRow:        { paddingHorizontal: 16, paddingBottom: 10, gap: 6 },
  catChip:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  catChipActive: { backgroundColor: ACCENT_DIM, borderColor: ACCENT + '66' },
  catTxt:        { fontSize: 12, fontWeight: '600' },
  catTxtActive:  { color: ACCENT, fontWeight: '700' },

  // Nearby banner
  nearbyBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 8 },
  nearbyTxt:    { fontSize: 12 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // List
  list:       { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30, gap: 12 },
  countLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 2 },

  // Empty
  empty:        { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt:     { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptySub:     { fontSize: 12 },
  switchBtn:    { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, borderWidth: 1 },
  switchBtnTxt: { fontSize: 13, fontWeight: '700' },

  // Cards
  card:               { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  cardHot:            { borderColor: ACCENT + '55' },
  cardImg:            { width: '100%', height: 180 },
  cardImgPlaceholder: { width: '100%', height: 100, alignItems: 'center', justifyContent: 'center' },
  cardBody:    { padding: 14 },
  cardTop:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  cardTitle:   { flex: 1, fontSize: 15, fontWeight: '700' },
  hotBadge:    { width: 22, height: 22, borderRadius: 7, backgroundColor: ACCENT_DIM, borderWidth: 1, borderColor: ACCENT + '55', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardPrice:   { fontSize: 14, fontWeight: '800', color: ACCENT, marginBottom: 6 },
  cardDesc:    { fontSize: 12, lineHeight: 18, marginBottom: 10 },

  chips:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  chipTxt: { fontSize: 11, fontWeight: '500' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1 },
  posterTxt:  { fontSize: 11 },
  msgBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50 },
  msgTxt:     { fontSize: 12, fontWeight: '600' },

  // Post CTA
  postCta:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, borderColor: ACCENT + '33', backgroundColor: ACCENT_DIM },
  postCtaTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  postCtaSub:   { fontSize: 11 },
});
