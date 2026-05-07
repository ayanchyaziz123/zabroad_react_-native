import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  RefreshControl, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';

const NAVY    = '#1B3266';
const CARD_GAP = 10;
const H_PAD    = 16;
const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - H_PAD * 2 - CARD_GAP) / 2;

const TYPE_META = {
  job:     { label: 'Job',      icon: 'briefcase-outline',  color: '#3B8BF7' },
  housing: { label: 'Housing',  icon: 'home-outline',       color: '#F4A227' },
  market:  { label: 'For Sale', icon: 'storefront-outline', color: '#28D99E' },
};

const TABS = [
  { key: 'all',     label: 'All'       },
  { key: 'job',     label: 'Jobs'      },
  { key: 'housing', label: 'Housing'   },
  { key: 'market',  label: 'Market'    },
];

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

function GridCard({ item, onPress, C, s }) {
  const meta = TYPE_META[item._type];
  const dist = formatDist(item.distanceMi);

  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={s.cardImg} resizeMode="cover" />
      ) : (
        <View style={[s.cardImgPlaceholder, { backgroundColor: meta.color + '18' }]}>
          <Ionicons name={meta.icon} size={28} color={meta.color + 'AA'} />
        </View>
      )}

      <View style={[s.typeBadge, { backgroundColor: meta.color }]}>
        <Text style={s.typeBadgeTxt}>{meta.label}</Text>
      </View>

      {dist && (
        <View style={s.distBadge}>
          <Ionicons name="navigate-outline" size={9} color="#fff" />
          <Text style={s.distTxt}>{dist}</Text>
        </View>
      )}

      <View style={s.cardBody}>
        <Text style={[s.cardTitle, { color: C.cream }]} numberOfLines={2}>{item.title}</Text>
        {item.sub ? (
          <Text style={[s.cardSub, { color: meta.color }]} numberOfLines={1}>{item.sub}</Text>
        ) : null}
        {item.location ? (
          <View style={s.locRow}>
            <Ionicons name="location-outline" size={9} color={C.c35} />
            <Text style={[s.locTxt, { color: C.c35 }]} numberOfLines={1}>{item.location}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function AllListingsScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const { api } = useAuthStore();
  const lat = useLocationStore(st => st.latitude);
  const lng = useLocationStore(st => st.longitude);

  const [jobs,      setJobs]      = useState([]);
  const [housing,   setHousing]   = useState([]);
  const [market,    setMarket]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search,    setSearch]    = useState('');

  const searchTimer = useRef(null);

  const fetchAll = useCallback(async (searchVal = '') => {
    try {
      const q = searchVal.trim()
        ? `?search=${encodeURIComponent(searchVal.trim())}${lat != null ? `&lat=${lat}&lng=${lng}` : ''}`
        : lat != null ? `?lat=${lat}&lng=${lng}` : '';

      const [jobsData, housingData, marketData] = await Promise.all([
        api(`/jobs/${q}`).catch(() => []),
        api(`/housing/${q}`).catch(() => []),
        api(`/marketplace/${q}`).catch(() => []),
      ]);

      setJobs(Array.isArray(jobsData) ? jobsData : (jobsData.results || []));
      setHousing(Array.isArray(housingData) ? housingData : (housingData.results || []));
      setMarket(Array.isArray(marketData) ? marketData : (marketData.results || []));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, lat, lng]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSearch = (text) => {
    setSearch(text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchAll(text), 400);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll(search);
  };

  const combined = useMemo(() => {
    const j = jobs.map(i => ({
      ...i,
      _type: 'job',
      sub: i.company,
      distanceMi: distanceMiles(lat, lng, i.latitude ?? null, i.longitude ?? null),
    }));
    const h = housing.map(i => ({
      ...i,
      _type: 'housing',
      sub: i.price,
      distanceMi: distanceMiles(lat, lng, i.latitude ?? null, i.longitude ?? null),
    }));
    const m = market.map(i => ({
      ...i,
      _type: 'market',
      sub: i.price || null,
      distanceMi: distanceMiles(lat, lng, i.latitude ?? null, i.longitude ?? null),
    }));

    let all;
    if      (activeTab === 'job')     all = j;
    else if (activeTab === 'housing') all = h;
    else if (activeTab === 'market')  all = m;
    else                              all = [...j, ...h, ...m];

    if (lat != null) {
      all.sort((a, b) => {
        if (a.distanceMi == null && b.distanceMi == null) return 0;
        if (a.distanceMi == null) return 1;
        if (b.distanceMi == null) return -1;
        return a.distanceMi - b.distanceMi;
      });
    }
    return all;
  }, [jobs, housing, market, activeTab, lat, lng]);

  const renderItem = ({ item, index }) => {
    const isLeft = index % 2 === 0;
    return (
      <View style={[s.gridItem, isLeft ? { marginRight: CARD_GAP / 2 } : { marginLeft: CARD_GAP / 2 }]}>
        <GridCard
          item={item}
          C={C} s={s}
          onPress={() => {
            if (item._type === 'job')     navigation.navigate('JobDetail',         { job: item });
            if (item._type === 'housing') navigation.navigate('HousingDetail',     { listing: item });
            if (item._type === 'market')  navigation.navigate('MarketplaceDetail', { item });
          }}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Browse All</Text>
          <Text style={s.subtitle}>{combined.length} listings</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={[s.searchBox, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="search-outline" size={16} color={C.c35} />
          <TextInput
            style={[s.searchInput, { color: C.cream }]}
            placeholder="Search jobs, housing, listings…"
            placeholderTextColor={C.c35}
            value={search}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); fetchAll(''); }} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color={C.c35} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Type filter tabs */}
      <View style={s.tabRow}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          const color = tab.key === 'job' ? '#3B8BF7' : tab.key === 'housing' ? '#F4A227' : tab.key === 'market' ? '#28D99E' : C.vivid;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[s.tabBtn, active && { backgroundColor: color + '22', borderColor: color + '66' }]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              <Text style={[s.tabTxt, { color: active ? color : C.c35 }, active && { fontWeight: '700' }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.vivid} />
        </View>
      ) : (
        <FlatList
          data={combined}
          keyExtractor={item => `${item._type}-${item.id}`}
          renderItem={renderItem}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.vivid} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="search-outline" size={44} color={C.c35} />
              <Text style={[s.emptyTxt, { color: C.cream }]}>No listings found</Text>
              <Text style={[s.emptySub, { color: C.c35 }]}>
                {search ? 'Try a different search term' : 'Nothing posted yet in this category'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, backgroundColor: NAVY },
  backBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:   { fontSize: 16, fontWeight: '800', color: '#fff' },
  subtitle:{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },

  searchWrap: { paddingHorizontal: H_PAD, paddingTop: 12, paddingBottom: 8 },
  searchBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 42 },
  searchInput:{ flex: 1, fontSize: 13, paddingVertical: 0 },

  tabRow: { flexDirection: 'row', paddingHorizontal: H_PAD, gap: 8, marginBottom: 10 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border },
  tabTxt: { fontSize: 13, fontWeight: '600' },

  list:    { paddingHorizontal: H_PAD, paddingBottom: 30, paddingTop: 4 },
  gridItem:{ flex: 1 },

  card:               { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginBottom: CARD_GAP },
  cardImg:            { width: '100%', height: CARD_W * 0.82 },
  cardImgPlaceholder: { width: '100%', height: CARD_W * 0.75, alignItems: 'center', justifyContent: 'center' },

  typeBadge:    { position: 'absolute', top: 8, left: 8, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  typeBadgeTxt: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  distBadge:    { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  distTxt:      { fontSize: 9, fontWeight: '700', color: '#fff' },

  cardBody:  { padding: 10, gap: 3 },
  cardTitle: { fontSize: 13, fontWeight: '700', lineHeight: 17 },
  cardSub:   { fontSize: 12, fontWeight: '600' },
  locRow:    { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locTxt:    { fontSize: 10, flex: 1 },

  empty:    { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyTxt: { fontSize: 16, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center' },
});
