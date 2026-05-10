import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, RefreshControl, Image,
  Dimensions, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD  = 16;
const CARD_W = (SCREEN_W - H_PAD * 2 - 12) / 2;

const SHOP_TYPES = [
  { key: 'all',          label: 'All',         emoji: '🏪' },
  { key: 'grocery',      label: 'Grocery',     emoji: '🛒' },
  { key: 'restaurant',   label: 'Restaurant',  emoji: '🍽️' },
  { key: 'fashion',      label: 'Fashion',     emoji: '👗' },
  { key: 'electronics',  label: 'Electronics', emoji: '📱' },
  { key: 'beauty',       label: 'Beauty',      emoji: '💄' },
  { key: 'pharmacy',     label: 'Pharmacy',    emoji: '💊' },
  { key: 'services',     label: 'Services',    emoji: '🤝' },
  { key: 'other',        label: 'Other',       emoji: '📦' },
];

const TYPE_COLORS = {
  grocery: '#28A745', restaurant: '#FF6B35', fashion: '#E91E8C',
  electronics: '#3B8BF7', beauty: '#9C27B0', pharmacy: '#17A2B8',
  services: '#F4A227', bookstore: '#795548', hardware: '#607D8B', other: '#6C757D',
};

function ShopCard({ shop, onPress, C, s }) {
  const color = TYPE_COLORS[shop.shop_type] || '#6C757D';
  const typeLabel = SHOP_TYPES.find(t => t.key === shop.shop_type)?.label || 'Shop';
  const typeEmoji = SHOP_TYPES.find(t => t.key === shop.shop_type)?.emoji || '🏪';
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.88}>
      <View style={[s.cardImg, { backgroundColor: color + '18' }]}>
        {shop.cover_url ? (
          <Image source={{ uri: shop.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : shop.logo_url ? (
          <Image source={{ uri: shop.logo_url }} style={s.logoCenter} resizeMode="contain" />
        ) : (
          <Text style={s.cardEmoji}>{typeEmoji}</Text>
        )}
        <View style={[s.typeBadge, { backgroundColor: color }]}>
          <Text style={s.typeBadgeTxt}>{typeLabel}</Text>
        </View>
        {shop.is_open && (
          <View style={s.openBadge}>
            <View style={s.openDot} />
            <Text style={s.openTxt}>Open</Text>
          </View>
        )}
        {shop.is_verified && (
          <View style={s.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
          </View>
        )}
      </View>
      <View style={s.cardBody}>
        <Text style={[s.cardName, { color: C.cream }]} numberOfLines={1}>{shop.shop_name}</Text>
        <View style={s.cardLocRow}>
          <Ionicons name="location-outline" size={11} color={C.c35} />
          <Text style={[s.cardLoc, { color: C.c35 }]} numberOfLines={1}>
            {shop.city}{shop.state ? `, ${shop.state}` : ''}
          </Text>
        </View>
        <Text style={[s.cardProducts, { color }]}>
          {shop.product_count} product{shop.product_count !== 1 ? 's' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function LocalShopScreen({ navigation }) {
  const { colors: C } = useTheme();
  const { api }       = useAuthStore();
  const currentCity   = useLocationStore(s => s.city);
  const gpsLat        = useLocationStore(s => s.latitude);
  const gpsLng        = useLocationStore(s => s.longitude);
  const s = useMemo(() => getStyles(C), [C]);

  const [shops,      setShops]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [activeType, setActiveType] = useState('all');
  const [myShop,     setMyShop]     = useState(null);
  const searchTimer = useRef(null);

  const fetchShops = useCallback(async (q = search, type = activeType, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q)                                params.append('search', q);
      if (type && type !== 'all')           params.append('type', type);
      if (gpsLat != null && gpsLng != null) { params.append('lat', gpsLat); params.append('lng', gpsLng); }
      else if (currentCity)                 params.append('city', currentCity.split(',')[0]);
      const qs   = params.toString();
      const data = await api(`/shops/${qs ? '?' + qs : ''}`);
      setShops(Array.isArray(data) ? data : (data.results || []));
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, [api, search, activeType, gpsLat, gpsLng, currentCity]);

  const fetchMyShop = useCallback(async () => {
    try {
      const data = await api('/shops/my/');
      const list = Array.isArray(data) ? data : (data.results || []);
      setMyShop(list[0] || null);
    } catch { setMyShop(null); }
  }, [api]);

  useEffect(() => { fetchShops(); fetchMyShop(); }, [activeType, gpsLat, gpsLng]);

  const onSearchChange = (text) => {
    setSearch(text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchShops(text, activeType), 400);
  };

  const onTypeChange = (type) => { setActiveType(type); fetchShops(search, type); };
  const onRefresh    = () => { setRefreshing(true); fetchShops(search, activeType, true); fetchMyShop(); };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Local Shops</Text>
          <Text style={s.headerSub}>
            {currentCity ? `Near ${currentCity.split(',')[0]}` : 'Shops in your area'}
          </Text>
        </View>
        <TouchableOpacity
          style={s.myShopBtn}
          onPress={() => myShop
            ? navigation.navigate('LocalShopDetail', { shopId: myShop.id })
            : navigation.navigate('CreateShop')
          }
          activeOpacity={0.8}
        >
          <Ionicons name={myShop ? 'storefront' : 'add-circle-outline'} size={17} color="#fff" />
          <Text style={s.myShopBtnTxt}>{myShop ? 'My Shop' : 'Add Shop'}</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={[s.searchBar, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="search-outline" size={16} color={C.c35} />
          <TextInput
            style={[s.searchInput, { color: C.cream }]}
            placeholder="Search shops, categories..."
            placeholderTextColor={C.c35}
            value={search}
            onChangeText={onSearchChange}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); fetchShops('', activeType); }}>
              <Ionicons name="close-circle" size={16} color={C.c35} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Type filter */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow} style={s.filterScroll}
      >
        {SHOP_TYPES.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.filterPill, activeType === t.key && s.filterPillActive]}
            onPress={() => onTypeChange(t.key)}
            activeOpacity={0.75}
          >
            <Text style={{ fontSize: 13 }}>{t.emoji}</Text>
            <Text style={[s.filterPillTxt, activeType === t.key && s.filterPillTxtActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid */}
      {loading ? (
        <View style={s.centerState}>
          <ActivityIndicator size="large" color="#3B8BF7" />
          <Text style={[s.emptyTxt, { color: C.c35, marginTop: 10 }]}>Finding shops nearby…</Text>
        </View>
      ) : shops.length === 0 ? (
        <View style={s.centerState}>
          <Text style={{ fontSize: 44 }}>🏪</Text>
          <Text style={[s.emptyTitle, { color: C.cream }]}>No shops yet</Text>
          <Text style={[s.emptyTxt, { color: C.c35 }]}>Be the first to list your shop!</Text>
          <TouchableOpacity style={s.addFirstBtn} onPress={() => navigation.navigate('CreateShop')} activeOpacity={0.85}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={s.addFirstBtnTxt}>Add Your Shop</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.gridRow}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B8BF7" />}
          renderItem={({ item }) => (
            <ShopCard
              shop={item} C={C} s={s}
              onPress={() => navigation.navigate('LocalShopDetail', { shopId: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1B3266', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14 },
  backBtn:      { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub:    { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  myShopBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 12, paddingHorizontal: 11, paddingVertical: 7 },
  myShopBtnTxt: { fontSize: 12, fontWeight: '700', color: '#fff' },

  searchWrap:  { paddingHorizontal: H_PAD, paddingTop: 12, paddingBottom: 6 },
  searchBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14 },

  filterScroll:       { flexGrow: 0 },
  filterRow:          { paddingHorizontal: H_PAD, paddingBottom: 10, gap: 8 },
  filterPill:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  filterPillActive:   { backgroundColor: '#1B3266', borderColor: '#3B8BF7' },
  filterPillTxt:      { fontSize: 12, fontWeight: '600', color: C.c35 },
  filterPillTxtActive:{ color: '#fff' },

  grid:    { paddingHorizontal: H_PAD, paddingTop: 4, paddingBottom: 32 },
  gridRow: { gap: 12, marginBottom: 12 },

  card:         { width: CARD_W, backgroundColor: C.card, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  cardImg:      { width: '100%', height: 110, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  logoCenter:   { width: 64, height: 64, borderRadius: 16 },
  cardEmoji:    { fontSize: 36 },
  typeBadge:    { position: 'absolute', bottom: 8, left: 8, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  typeBadgeTxt: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  openBadge:    { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  openDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#28D99E' },
  openTxt:      { fontSize: 9, fontWeight: '700', color: '#28D99E' },
  verifiedBadge:{ position: 'absolute', top: 8, left: 8, backgroundColor: '#3B8BF7', borderRadius: 50, padding: 2 },
  cardBody:     { padding: 10, gap: 3 },
  cardName:     { fontSize: 13, fontWeight: '800' },
  cardLocRow:   { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardLoc:      { fontSize: 11, flex: 1 },
  cardProducts: { fontSize: 11, fontWeight: '700', marginTop: 2 },

  centerState:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle:     { fontSize: 16, fontWeight: '800' },
  emptyTxt:       { fontSize: 13, textAlign: 'center' },
  addFirstBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1B3266', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, marginTop: 6 },
  addFirstBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
