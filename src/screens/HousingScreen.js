import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import { useHousingStore } from '../store/housingStore';

const TIPS = [
  { icon: 'document-text-outline', title: 'No Credit History?', desc: 'Offer a larger security deposit (2–3 months) or show your offer letter/employment contract.' },
  { icon: 'card-outline',          title: 'No SSN Yet?',        desc: 'Many immigrant-friendly landlords accept ITIN, passport, or visa documents instead.' },
  { icon: 'people-outline',        title: 'Find a Co-signer',   desc: 'A US citizen co-signer dramatically increases your approval chances with larger landlords.' },
];

const LISTINGS = [
  {
    id: '1', title: '1BR in Jackson Heights', price: '$1,450/mo', area: 'Jackson Heights, Queens',
    beds: '1 bed · 1 bath', noCredit: true, noSSN: true, furnished: true,
    desc: 'Sunny unit close to F/M/R trains. Landlord speaks Bengali & Spanish. No credit check.',
    color: '#F5A623', poster: 'Karim Bhai', time: '3h ago', initials: 'KB',
    communities: ['Bangladesh', 'Pakistan'],
  },
  {
    id: '2', title: 'Shared Room — Male Only', price: '$750/mo', area: 'Astoria, Queens',
    beds: 'Shared · 3 roommates', noCredit: true, noSSN: false, furnished: true,
    desc: 'Quiet South Asian household. Close to N/W train. Bills included. Muslim-friendly home.',
    color: '#3EC8C8', poster: 'Ahmed S.', time: '6h ago', initials: 'AS',
    communities: ['Bangladesh', 'Pakistan', 'India', 'Egypt'],
  },
  {
    id: '3', title: '2BR for Immigrant Family', price: '$2,100/mo', area: 'Bronx, NY',
    beds: '2 bed · 1 bath', noCredit: false, noSSN: false, furnished: false,
    desc: 'Spacious apartment. Landlord understands new immigrants. Offer letter accepted instead of credit.',
    color: '#5B8DEF', poster: 'Luis M.', time: '1d ago', initials: 'LM',
    communities: ['Mexico', 'Colombia', 'Brazil', 'Dominican Republic'],
  },
  {
    id: '4', title: 'Studio near Flushing Meadows', price: '$1,200/mo', area: 'Flushing, Queens',
    beds: 'Studio · 1 bath', noCredit: true, noSSN: true, furnished: false,
    desc: 'Perfect for students & new grads. Close to 7 train. Landlord accepts ITIN.',
    color: '#A855F7', poster: 'Wei L.', time: '2d ago', initials: 'WL',
    communities: ['China', 'South Korea', 'Vietnam'],
  },
  {
    id: '5', title: 'Room in Nigerian Household', price: '$900/mo', area: 'Brooklyn, NY',
    beds: 'Shared · 2 roommates', noCredit: true, noSSN: false, furnished: true,
    desc: 'Welcoming Nigerian household. Bills partially included. Close to A/C train. No background check.',
    color: '#3EC878', poster: 'Chukwu O.', time: '4h ago', initials: 'CO',
    communities: ['Nigeria', 'Ghana', 'Ethiopia'],
  },
];

const FILTERS = ['All', 'No Credit', 'No SSN', 'Furnished', 'Shared', 'Family'];

export default function HousingScreen({ navigation }) {
  const { colors: C } = useTheme();
  const { user }      = useUser();
  const s = useMemo(() => getStyles(C), [C]);

  const listings      = useHousingStore(s => s.listings);
  const loading       = useHousingStore(s => s.loading);
  const fetchListings = useHousingStore(s => s.fetchListings);

  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState(0);
  const [activeScope,  setActiveScope]  = useState('all');
  const [contacted,    setContacted]    = useState({});
  const [refreshing,   setRefreshing]   = useState(false);

  useEffect(() => { fetchListings(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  }, []);

  const country = user.homeCountry || { flag: '🌍', name: '' };

  const SCOPES = [
    { key: 'community', label: `${country.flag} Community` },
    { key: 'all',       label: '🌍 All' },
  ];

  const filtered = listings.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      l.title.toLowerCase().includes(q) ||
      l.area.toLowerCase().includes(q);
    const matchFilter = activeFilter === 0;
    const matchScope = activeScope === 'all' ||
      l.communities.some(c => c.toLowerCase() === (country.name || '').toLowerCase());
    return matchSearch && matchFilter && matchScope;
  });

  const toggleContact = (id) => setContacted(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Housing</Text>
          <Text style={s.sub}>No credit check · immigrant-friendly</Text>
        </View>
        {/* Scope tabs */}
        <View style={s.scopeRow}>
          {SCOPES.map(sc => {
            const active = sc.key === activeScope;
            return (
              <TouchableOpacity
                key={sc.key}
                style={[s.scopeTab, active && s.scopeTabActive]}
                onPress={() => setActiveScope(sc.key)}
                activeOpacity={0.8}
              >
                <Text style={[s.scopeTabTxt, active && s.scopeTabTxtActive]}>{sc.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={C.c35} />
          <TextInput
            style={s.searchInput}
            placeholder="Search area, price, type…"
            placeholderTextColor={C.c35}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color={C.c35} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate('PostHousing')} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={C.gold} />
        </TouchableOpacity>
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow}>
        {FILTERS.map((f, i) => (
          <TouchableOpacity
            key={f}
            style={[s.filterPill, i === activeFilter && s.filterPillActive]}
            onPress={() => setActiveFilter(i)}
            activeOpacity={0.8}
          >
            <Text style={[s.filterTxt, i === activeFilter && s.filterTxtActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && listings.length === 0 && (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.gold} />
          <Text style={s.loadingTxt}>Loading listings…</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} />}
      >

        {/* Tips */}
        <View style={[s.tipsCard, { borderColor: C.gold + '33' }]}>
          <View style={s.tipsTitle}>
            <Ionicons name="home" size={14} color={C.gold} />
            <Text style={s.tipsTitleTxt}>Renting as an Immigrant</Text>
          </View>
          {TIPS.map((tip, i) => (
            <View key={tip.title} style={[s.tipRow, i < TIPS.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
              <View style={[s.tipIconWrap, { backgroundColor: C.goldD }]}>
                <Ionicons name={tip.icon} size={16} color={C.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.tipTitle}>{tip.title}</Text>
                <Text style={s.tipDesc}>{tip.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>
          {filtered.length} LISTING{filtered.length !== 1 ? 'S' : ''}
          {activeScope === 'community' ? ` IN ${(country.name || '').toUpperCase()} COMMUNITY` : ' · NEAR YOU'}
        </Text>

        {filtered.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="home-outline" size={40} color={C.c35} />
            <Text style={s.emptyTxt}>
              {activeScope === 'community' ? `No listings in ${country.name} community yet` : 'No listings match'}
            </Text>
            <Text style={s.emptySub}>Try a different filter or area</Text>
            {activeScope === 'community' && (
              <TouchableOpacity style={[s.switchBtn, { backgroundColor: C.goldD, borderColor: C.gold + '44' }]} onPress={() => setActiveScope('all')} activeOpacity={0.8}>
                <Text style={[s.switchBtnTxt, { color: C.gold }]}>View all listings</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map(listing => {
            const isContacted = contacted[listing.id];
            return (
              <View key={listing.id} style={[s.listingCard, isContacted && { borderColor: C.green + '55' }]}>
                <View style={s.listingTop}>
                  <View style={[s.listingAv, { backgroundColor: listing.color + '22' }]}>
                    <Text style={[s.listingInitials, { color: listing.color }]}>{listing.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.listingTitle}>{listing.title}</Text>
                    <Text style={[s.listingPrice, { color: listing.color }]}>{listing.price}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="location-outline" size={11} color={C.c35} />
                      <Text style={s.listingArea}>{listing.area}</Text>
                    </View>
                  </View>
                </View>

                <View style={s.badgeRow}>
                  {listing.noCredit  && (
                    <View style={[s.badge, { backgroundColor: C.greenD, borderColor: C.green + '33' }]}>
                      <Ionicons name="checkmark-circle" size={11} color={C.green} />
                      <Text style={[s.badgeTxt, { color: C.green }]}>No Credit</Text>
                    </View>
                  )}
                  {listing.noSSN && (
                    <View style={[s.badge, { backgroundColor: C.greenD, borderColor: C.green + '33' }]}>
                      <Ionicons name="checkmark-circle" size={11} color={C.green} />
                      <Text style={[s.badgeTxt, { color: C.green }]}>No SSN</Text>
                    </View>
                  )}
                  {listing.furnished && (
                    <View style={[s.badge, { backgroundColor: C.blueD, borderColor: C.blue + '33' }]}>
                      <Ionicons name="bed-outline" size={11} color={C.blue} />
                      <Text style={[s.badgeTxt, { color: C.blue }]}>Furnished</Text>
                    </View>
                  )}
                </View>

                <Text style={s.listingDesc}>{listing.desc}</Text>

                <View style={s.listingFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={[s.posterAv, { backgroundColor: listing.color + '22' }]}>
                      <Text style={[{ fontSize: 10, fontWeight: '800', color: listing.color }]}>{listing.initials[0]}</Text>
                    </View>
                    <Text style={s.posterName}>{listing.poster} · {listing.time}</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.contactBtn, isContacted
                      ? { backgroundColor: C.greenD, borderWidth: 1, borderColor: C.green + '44' }
                      : { backgroundColor: listing.color }
                    ]}
                    onPress={() => toggleContact(listing.id)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name={isContacted ? 'checkmark-circle' : 'chatbubble-outline'} size={13} color={isContacted ? C.green : '#0D0F1A'} />
                    <Text style={[s.contactTxt, isContacted && { color: C.green }]}>
                      {isContacted ? 'Contacted' : 'Contact'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Post listing CTA */}
        <TouchableOpacity style={[s.postCta, { backgroundColor: C.goldD, borderColor: C.gold + '33' }]} onPress={() => navigation.navigate('PostHousing')} activeOpacity={0.85}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Ionicons name="home" size={16} color={C.gold} />
            <Text style={[s.postCtaTitle, { color: C.cream }]}>Have a room or apartment?</Text>
          </View>
          <Text style={s.postCtaSub}>Share it with your community</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Header
  header:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  backBtn:  { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:    { fontSize: 16, fontWeight: '800', color: C.cream, letterSpacing: -0.3 },
  sub:      { fontSize: 11, color: C.c35, marginTop: 1 },

  // Scope tabs
  scopeRow:          { flexDirection: 'row', gap: 5, flexShrink: 0 },
  scopeTab:          { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  scopeTabActive:    { backgroundColor: C.vividD, borderColor: C.vivid + '66' },
  scopeTabTxt:       { fontSize: 10, fontWeight: '600', color: C.c35 },
  scopeTabTxtActive: { color: C.vivid, fontWeight: '700' },

  // Search
  searchWrap:  { paddingHorizontal: 16, marginBottom: 10, flexDirection: 'row', gap: 10 },
  searchBox:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 13, color: C.cream },
  iconBtn:     { width: 46, height: 46, backgroundColor: C.goldD, borderRadius: 14, borderWidth: 1, borderColor: C.gold + '55', alignItems: 'center', justifyContent: 'center' },

  // Filters
  filtersRow:      { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  filterPill:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  filterPillActive:{ backgroundColor: C.gold + '22', borderColor: C.gold + '66' },
  filterTxt:       { fontSize: 12, color: C.c35, fontWeight: '600' },
  filterTxtActive: { color: C.gold, fontWeight: '700' },

  loadingWrap: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  loadingTxt:  { fontSize: 13, color: C.c35, fontWeight: '600' },

  // List
  list:         { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30, gap: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 2 },

  // Tips
  tipsCard:     { backgroundColor: C.card, borderWidth: 1, borderRadius: 16, padding: 14 },
  tipsTitle:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  tipsTitleTxt: { fontSize: 13, fontWeight: '700', color: C.cream },
  tipRow:       { flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'flex-start' },
  tipIconWrap:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tipTitle:     { fontSize: 12, fontWeight: '700', color: C.cream, marginBottom: 2 },
  tipDesc:      { fontSize: 11, color: C.c35, lineHeight: 17 },

  // Empty
  emptyState:   { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt:     { fontSize: 15, fontWeight: '700', color: C.cream, textAlign: 'center' },
  emptySub:     { fontSize: 13, color: C.c35 },
  switchBtn:    { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, borderWidth: 1 },
  switchBtnTxt: { fontSize: 13, fontWeight: '700' },

  // Listing card
  listingCard:     { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 16 },
  listingTop:      { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  listingAv:       { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  listingInitials: { fontSize: 16, fontWeight: '900' },
  listingTitle:    { fontSize: 14, fontWeight: '700', color: C.cream, marginBottom: 2 },
  listingPrice:    { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  listingArea:     { fontSize: 11, color: C.c35 },
  badgeRow:        { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  badge:           { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  badgeTxt:        { fontSize: 10, fontWeight: '700' },
  listingDesc:     { fontSize: 12, color: C.c35, lineHeight: 18, marginBottom: 10 },
  listingFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  posterAv:        { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  posterName:      { fontSize: 11, color: C.c35 },
  contactBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50 },
  contactTxt:      { fontSize: 12, fontWeight: '700', color: '#0D0F1A' },

  // Post CTA
  postCta:      { borderWidth: 1, borderRadius: 18, padding: 16 },
  postCtaTitle: { fontSize: 14, fontWeight: '700' },
  postCtaSub:   { fontSize: 12, color: C.c35, lineHeight: 18 },
});
