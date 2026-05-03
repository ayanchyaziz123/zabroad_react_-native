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

const ACCENT     = '#00B4D8';
const ACCENT_DIM = '#00B4D81A';

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

  const api = useAuthStore(st => st.api);

  const [listings,   setListings]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');

  const fetchListings = useCallback(async (searchText = search) => {
    try {
      const params = new URLSearchParams();
      if (searchText.trim()) params.append('search', searchText.trim());
      const query = params.toString();
      const data  = await api(`/marketplace/${query ? '?' + query : ''}`);
      setListings(Array.isArray(data) ? data : (data.results || []));
    } catch {
      // silently keep existing list
    } finally {
      setLoading(false);
    }
  }, [api, search]);

  useEffect(() => { fetchListings(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  }, [fetchListings]);

  function handleSearch(text) {
    setSearch(text);
    fetchListings(text);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
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

      {/* List */}
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
              <Text style={[s.emptyTxt, { color: C.cream }]}>No listings yet</Text>
              <Text style={[s.emptySub, { color: C.c35 }]}>Be the first to post something</Text>
            </View>
          ) : (
            listings.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[s.card, { backgroundColor: C.card, borderColor: C.border }, item.is_hot && s.cardHot]}
                activeOpacity={0.92}
                onPress={() => navigation.navigate('MarketplaceDetail', { item })}
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

                  {item.location ? (
                    <View style={s.chips}>
                      <View style={[s.chip, { backgroundColor: C.card2, borderColor: C.border }]}>
                        <Ionicons name="location-outline" size={10} color={C.c35} />
                        <Text style={[s.chipTxt, { color: C.c35 }]}>{item.location}</Text>
                      </View>
                    </View>
                  ) : null}

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

  header:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:   { fontSize: 16, fontWeight: '800', color: C.cream, letterSpacing: -0.3 },
  sub:     { fontSize: 11, color: C.c35, marginTop: 1 },
  postBtn: { width: 40, height: 40, backgroundColor: ACCENT_DIM, borderRadius: 13, borderWidth: 1, borderColor: ACCENT + '55', alignItems: 'center', justifyContent: 'center' },

  searchWrap:  { paddingHorizontal: 16, marginBottom: 10 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 42 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list:       { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30, gap: 12 },
  countLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 2 },

  empty:    { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: 12 },

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

  postCta:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, borderColor: ACCENT + '33', backgroundColor: ACCENT_DIM },
  postCtaTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  postCtaSub:   { fontSize: 11 },
});
