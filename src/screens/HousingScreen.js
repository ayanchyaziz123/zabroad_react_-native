import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  RefreshControl, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useHousingStore } from '../store/housingStore';

const GOLD = '#F5A623';
const GOLD_DIM = '#F5A62318';

const TIPS = [
  { icon: 'document-text-outline', title: 'No Credit History?',  desc: 'Offer 2–3 months deposit or show your employment letter.' },
  { icon: 'card-outline',          title: 'No SSN Yet?',          desc: 'Many landlords accept ITIN, passport, or visa documents.' },
  { icon: 'people-outline',        title: 'Find a Co-signer',     desc: 'A US citizen co-signer increases approval chances greatly.' },
];

export default function HousingScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const user          = useAuthStore(st => st.user);
  const listings      = useHousingStore(st => st.listings);
  const loading       = useHousingStore(st => st.loading);
  const fetchListings = useHousingStore(st => st.fetchListings);
  const deleteListing = useHousingStore(st => st.deleteListing);

  const homeCountry = user?.profile?.home_country || '';
  const countryFlag = user?.profile?.country_flag || '🌍';

  const SCOPES = [
    { key: 'all',       label: '🌍 All' },
    { key: 'community', label: `${countryFlag} Community` },
  ];

  const [scope,       setScope]      = useState('all');
  const [search,      setSearch]     = useState('');
  const [refreshing,  setRefreshing] = useState(false);

  const load = useCallback((s = scope, q = search) => {
    fetchListings({ scope: s, search: q, homeCountry });
  }, [scope, search, homeCountry]);

  useEffect(() => { load(); }, [scope]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings({ scope, search, homeCountry });
    setRefreshing(false);
  }, [scope, search, homeCountry]);

  const handleScopeChange = (key) => { setScope(key); };

  const handleSearch = (text) => {
    setSearch(text);
    fetchListings({ scope, search: text, homeCountry });
  };

  const handleDelete = (listing) => {
    Alert.alert('Delete listing', 'Remove this listing permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteListing(listing.id).catch(() => Alert.alert('Error', 'Could not delete.')) },
    ]);
  };

  const isOwn = (listing) => listing.poster_id && user?.id && listing.poster_id === user.id;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Housing</Text>
          <Text style={s.sub}>Immigrant-friendly listings</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('PostHousing')} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={GOLD} />
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
              <Text style={[s.scopeTabTxt, { color: active ? GOLD : C.c35 }, active && s.scopeTabTxtActive]}>
                {sc.label}
              </Text>
              {active && <View style={[s.scopeUnderline, { backgroundColor: GOLD }]} />}
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

      {loading && listings.length === 0 ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
        >
          {/* Tips card */}
          <View style={[s.tipsCard, { backgroundColor: C.card, borderColor: GOLD + '33' }]}>
            <View style={s.tipsHeader}>
              <Ionicons name="home" size={14} color={GOLD} />
              <Text style={[s.tipsTitleTxt, { color: C.cream }]}>Renting as an Immigrant</Text>
            </View>
            {TIPS.map((tip, i) => (
              <View key={tip.title} style={[s.tipRow, i < TIPS.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
                <View style={[s.tipIcon, { backgroundColor: GOLD_DIM }]}>
                  <Ionicons name={tip.icon} size={16} color={GOLD} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.tipTitle, { color: C.cream }]}>{tip.title}</Text>
                  <Text style={[s.tipDesc, { color: C.c35 }]}>{tip.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Count label */}
          <Text style={s.countLabel}>
            {listings.length} LISTING{listings.length !== 1 ? 'S' : ''}
            {scope === 'community' ? ` · ${homeCountry.toUpperCase()}` : ''}
          </Text>

          {listings.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="home-outline" size={44} color={C.c35} />
              <Text style={[s.emptyTxt, { color: C.cream }]}>
                {scope === 'community' ? 'No listings in your community' : 'No listings yet'}
              </Text>
              <Text style={[s.emptySub, { color: C.c35 }]}>Be the first to post</Text>
              {scope !== 'all' && (
                <TouchableOpacity
                  style={[s.switchBtn, { backgroundColor: GOLD_DIM, borderColor: GOLD + '44' }]}
                  onPress={() => handleScopeChange('all')}
                  activeOpacity={0.8}
                >
                  <Text style={[s.switchBtnTxt, { color: GOLD }]}>View all listings</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            listings.map(listing => {
              const planColor = listing.plan === 'premium' ? '#9B72EF' : listing.plan === 'standard' ? '#F5A623' : GOLD;
              const own       = isOwn(listing);
              return (
                <TouchableOpacity key={listing.id} style={[s.card, { backgroundColor: C.card, borderColor: C.border }, listing.featured && s.cardFeatured]} activeOpacity={0.92} onPress={() => navigation.navigate('HousingDetail', { listing })}>

                  {/* Image */}
                  {listing.image_url ? (
                    <Image source={{ uri: listing.image_url }} style={s.cardImg} resizeMode="cover" />
                  ) : null}

                  <View style={s.cardBody}>
                    {/* Top */}
                    <View style={s.cardTop}>
                      <View style={[s.avatar, { backgroundColor: planColor + '22' }]}>
                        <Text style={[s.avatarTxt, { color: planColor }]}>{listing.initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[s.cardTitle, { color: C.cream }]} numberOfLines={1}>{listing.title}</Text>
                          {listing.featured && (
                            <View style={s.featuredBadge}>
                              <Ionicons name="star" size={9} color="#9B72EF" />
                            </View>
                          )}
                        </View>
                        <Text style={[s.cardPrice, { color: planColor }]}>{listing.price}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                          <Ionicons name="location-outline" size={11} color={C.c35} />
                          <Text style={[s.cardLocation, { color: C.c35 }]}>{listing.location}</Text>
                        </View>
                      </View>
                      {own && (
                        <TouchableOpacity onPress={() => handleDelete(listing)} style={s.deleteBtn} activeOpacity={0.7}>
                          <Ionicons name="trash-outline" size={16} color={C.red || '#FF4444'} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Badges */}
                    {(listing.countryFlag || listing.postedFrom) ? (
                      <View style={s.badgeRow}>
                        {listing.countryFlag ? (
                          <View style={[s.badge, { backgroundColor: C.card2, borderColor: C.border }]}>
                            <Text style={{ fontSize: 11 }}>{listing.countryFlag}</Text>
                            <Text style={[s.badgeTxt, { color: C.c35 }]}>{listing.communities[0] || ''}</Text>
                          </View>
                        ) : null}
                        {listing.postedFrom ? (
                          <View style={[s.badge, { backgroundColor: C.card2, borderColor: C.border }]}>
                            <Ionicons name="location-outline" size={10} color={C.c35} />
                            <Text style={[s.badgeTxt, { color: C.c35 }]}>{listing.postedFrom}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}

                    {/* Description */}
                    <Text style={[s.cardDesc, { color: C.c35 }]} numberOfLines={2}>{listing.desc}</Text>

                    {/* Footer */}
                    <View style={[s.cardFooter, { borderTopColor: C.border }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <View style={[s.posterAv, { backgroundColor: planColor + '22' }]}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: planColor }}>{listing.initials[0]}</Text>
                        </View>
                        <Text style={[s.posterName, { color: C.c35 }]}>{listing.poster} · {listing.time}</Text>
                      </View>
                      {!own && (
                        <TouchableOpacity
                          style={[s.contactBtn, { backgroundColor: planColor }]}
                          onPress={() => listing.poster_id && navigation.navigate('AppMain', { screen: 'Chat', params: { userId: listing.poster_id } })}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="chatbubble-outline" size={13} color="white" />
                          <Text style={s.contactTxt}>Contact</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Post CTA */}
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
  addBtn:  { width: 40, height: 40, backgroundColor: GOLD_DIM, borderRadius: 13, borderWidth: 1, borderColor: GOLD + '55', alignItems: 'center', justifyContent: 'center' },

  scopeBar:         { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 12 },
  scopeTab:         { flex: 1, alignItems: 'center', paddingVertical: 10, position: 'relative' },
  scopeTabActive:   {},
  scopeTabTxt:      { fontSize: 13, fontWeight: '600' },
  scopeTabTxtActive:{ fontWeight: '700' },
  scopeUnderline:   { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, borderRadius: 2 },

  searchWrap:  { paddingHorizontal: 16, marginBottom: 10 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 42 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },


  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },

  list:       { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30, gap: 12 },
  countLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 2 },

  tipsCard:    { borderWidth: 1, borderRadius: 16, padding: 14 },
  tipsHeader:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  tipsTitleTxt:{ fontSize: 13, fontWeight: '700' },
  tipRow:      { flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'flex-start' },
  tipIcon:     { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tipTitle:    { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  tipDesc:     { fontSize: 11, lineHeight: 17 },

  empty:        { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt:     { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptySub:     { fontSize: 12 },
  switchBtn:    { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, borderWidth: 1 },
  switchBtnTxt: { fontSize: 13, fontWeight: '700' },

  card:         { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  cardFeatured: { borderColor: '#9B72EF55' },
  cardImg:      { width: '100%', height: 180 },
  cardBody:     { padding: 14 },
  cardTop:      { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  avatar:       { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarTxt:    { fontSize: 15, fontWeight: '900' },
  cardTitle:    { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  cardPrice:    { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  cardLocation: { fontSize: 11 },
  featuredBadge:{ width: 20, height: 20, borderRadius: 6, backgroundColor: '#9B72EF22', borderWidth: 1, borderColor: '#9B72EF55', alignItems: 'center', justifyContent: 'center' },
  deleteBtn:    { padding: 6 },

  badgeRow:  { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  badge:     { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  badgeTxt:  { fontSize: 10, fontWeight: '700' },

  cardDesc:   { fontSize: 12, lineHeight: 18, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1 },
  posterAv:   { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  posterName: { fontSize: 11 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50 },
  contactTxt: { fontSize: 12, fontWeight: '700', color: 'white' },

  postCta:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  postCtaTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  postCtaSub:   { fontSize: 11 },
});
