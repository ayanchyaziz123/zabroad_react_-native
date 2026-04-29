import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';

const VISA_FILTERS = ['All', 'OPT', 'H-1B', 'Green Card', 'Asylum', 'Family', 'EB-1'];
const VISA_KEYWORDS = ['OPT', 'H-1B', 'Green Card', 'Asylum', 'Family', 'EB-1'];

const ATTORNEYS = [
  {
    id: '1', name: 'Sarah Kim, Esq.', firm: 'Kim Immigration Law', rating: '4.9',
    specialty: 'H-1B · OPT · EB-2 NIW', languages: ['English', 'Korean'],
    price: 'Free consult · $200/hr', location: 'Manhattan, NY',
    color: '#9B72EF', badge: 'Top Rated', initials: 'SK',
    communities: ['South Korea', 'Korea'],
  },
  {
    id: '2', name: 'Tariq Hassan, Esq.', firm: 'Hassan & Associates', rating: '4.8',
    specialty: 'Asylum · Deportation Defense · DACA', languages: ['English', 'Arabic', 'Urdu'],
    price: 'Sliding scale available', location: 'Queens, NY',
    color: '#5B8DEF', badge: 'Pro Bono', initials: 'TH',
    communities: ['Bangladesh', 'Pakistan', 'Egypt', 'Nigeria'],
  },
  {
    id: '3', name: 'Maria Flores, Esq.', firm: 'Flores Law Group', rating: '4.7',
    specialty: 'Family · Green Card · Naturalization', languages: ['English', 'Spanish'],
    price: 'Free consult · $150/hr', location: 'Bronx, NY',
    color: '#3EC8C8', badge: null, initials: 'MF',
    communities: ['Mexico', 'Colombia', 'Brazil'],
  },
  {
    id: '4', name: 'James Chen, Esq.', firm: 'Chen Global Immigration', rating: '4.9',
    specialty: 'EB-1A · O-1 · TN Visa', languages: ['English', 'Mandarin', 'Cantonese'],
    price: 'Free consult · $250/hr', location: 'Flushing, NY',
    color: '#F5A623', badge: 'EB-1 Expert', initials: 'JC',
    communities: ['China', 'Hong Kong', 'Taiwan'],
  },
  {
    id: '5', name: 'Priya Sharma, Esq.', firm: 'Sharma Immigration Counsel', rating: '4.8',
    specialty: 'H-1B · L-1 · OPT · EB-3', languages: ['English', 'Hindi', 'Gujarati'],
    price: 'Free consult · $180/hr', location: 'Jersey City, NJ',
    color: '#3EC878', badge: 'Immigrant Friendly', initials: 'PS',
    communities: ['India', 'Nepal', 'Sri Lanka'],
  },
  {
    id: '6', name: 'Amara Okafor, Esq.', firm: 'Okafor Law PLLC', rating: '4.7',
    specialty: 'Asylum · Family · TPS · DACA', languages: ['English', 'Yoruba', 'French'],
    price: 'Sliding scale · Free consult', location: 'Brooklyn, NY',
    color: '#FB7185', badge: 'Pro Bono', initials: 'AO',
    communities: ['Nigeria', 'Ghana', 'Ethiopia'],
  },
];

function AttorneyCard({ att, navigation, C, s }) {
  const [consulted, setConsulted] = useState(false);
  const [messaged,  setMessaged]  = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  function onConsult() {
    if (consulted) return;
    setConsulted(true);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.04, useNativeDriver: true, speed: 60, bounciness: 10 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }),
    ]).start();
  }

  function onMessage() {
    setMessaged(true);
    navigation.navigate('Chat');
  }

  return (
    <Animated.View style={[s.attCard, { transform: [{ scale }] }, consulted && { borderColor: C.green + '55' }]}>
      <View style={s.attTop}>
        <View style={[s.attAv, { backgroundColor: att.color + '22' }]}>
          <Text style={[s.attInitials, { color: att.color }]}>{att.initials}</Text>
          <View style={[s.verifiedBadge, { backgroundColor: C.green }]}>
            <Ionicons name="checkmark" size={8} color="white" />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.attNameRow}>
            <Text style={s.attName} numberOfLines={1}>{att.name}</Text>
            <View style={s.ratingBadge}>
              <Ionicons name="star" size={10} color={C.gold} />
              <Text style={s.ratingTxt}>{att.rating}</Text>
            </View>
          </View>
          <Text style={s.attFirm} numberOfLines={1}>{att.firm}</Text>
          {att.badge && (
            <View style={[s.attBadge, { backgroundColor: att.color + '1A', borderColor: att.color + '44' }]}>
              <Text style={[s.attBadgeTxt, { color: att.color }]}>{att.badge}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.attMeta}>
        <View style={s.metaRow}>
          <Ionicons name="scale-outline" size={13} color={att.color} />
          <Text style={[s.attSpec, { color: att.color }]}>{att.specialty}</Text>
        </View>
        <View style={s.metaRow}>
          <Ionicons name="chatbubble-ellipses-outline" size={13} color={C.c35} />
          <Text style={s.attMetaTxt}>{att.languages.join(' · ')}</Text>
        </View>
        <View style={s.metaRow}>
          <Ionicons name="cash-outline" size={13} color={C.c35} />
          <Text style={s.attMetaTxt}>{att.price}</Text>
        </View>
        <View style={s.metaRow}>
          <Ionicons name="location-outline" size={13} color={C.c35} />
          <Text style={s.attMetaTxt}>{att.location}</Text>
        </View>
      </View>

      <View style={s.attFooter}>
        <TouchableOpacity
          style={[s.consultBtn, consulted && { backgroundColor: C.greenD }]}
          onPress={onConsult}
          activeOpacity={0.85}
        >
          <Ionicons name={consulted ? 'checkmark-circle' : 'calendar'} size={14} color={consulted ? C.green : 'white'} />
          <Text style={[s.consultTxt, consulted && { color: C.green }]}>
            {consulted ? 'Booked' : 'Free Consult'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.msgBtn, messaged && { backgroundColor: att.color + '1A', borderColor: att.color + '44' }]}
          onPress={onMessage}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-outline" size={14} color={messaged ? att.color : C.purple} />
          <Text style={[s.msgTxt, messaged && { color: att.color }]}>
            {messaged ? 'Sent' : 'Message'}
          </Text>
        </TouchableOpacity>
      </View>

      {consulted && (
        <View style={[s.confirmedBanner, { backgroundColor: C.greenD, borderColor: C.green + '33' }]}>
          <Ionicons name="checkmark-circle" size={14} color={C.green} />
          <Text style={[s.confirmedTxt, { color: C.green }]}>
            Request sent · They'll contact you within 24h
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function AttorneyScreen({ navigation }) {
  const { colors: C } = useTheme();
  const { user }      = useUser();
  const s = useMemo(() => getStyles(C), [C]);

  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState(0);
  const [activeScope,  setActiveScope]  = useState('all');

  const country = user.homeCountry || { flag: '🌍', name: '' };

  const SCOPES = [
    { key: 'community', label: `${country.flag} Community` },
    { key: 'all',       label: '🌍 All' },
  ];

  const filtered = ATTORNEYS.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.name.toLowerCase().includes(q) ||
      a.specialty.toLowerCase().includes(q) ||
      a.languages.some(l => l.toLowerCase().includes(q));
    const matchVisa = activeFilter === 0 || a.specialty.includes(VISA_KEYWORDS[activeFilter - 1]);
    const matchScope = activeScope === 'all' ||
      a.communities.some(c => c.toLowerCase() === (country.name || '').toLowerCase());
    return matchSearch && matchVisa && matchScope;
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Immigration Attorneys</Text>
          <Text style={s.sub}>Free consultations · multilingual</Text>
        </View>
        {/* Community / All scope tabs */}
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

      {/* ── Search ──────────────────────────────────────────────── */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={C.c35} />
          <TextInput
            style={s.searchInput}
            placeholder="Name, visa type, language…"
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
      </View>

      {/* ── Visa type filter pills ───────────────────────────────── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow}>
        {VISA_FILTERS.map((f, i) => (
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

      {/* ── List ────────────────────────────────────────────────── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        <Text style={s.sectionLabel}>
          {filtered.length} ATTORNEY{filtered.length !== 1 ? 'S' : ''}
          {activeScope === 'community' ? ` IN ${(country.name || '').toUpperCase()} COMMUNITY` : ' NEAR YOU'}
        </Text>

        {filtered.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="scale-outline" size={40} color={C.c35} />
            <Text style={s.emptyTxt}>
              {activeScope === 'community'
                ? `No attorneys in ${country.name} community yet`
                : 'No attorneys match'}
            </Text>
            <Text style={s.emptySub}>Try a different filter or search term</Text>
            {activeScope === 'community' && (
              <TouchableOpacity style={[s.switchBtn, { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]} onPress={() => setActiveScope('all')} activeOpacity={0.8}>
                <Text style={[s.switchBtnTxt, { color: C.vivid }]}>View all attorneys</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filtered.map(att => (
            <AttorneyCard key={att.id} att={att} navigation={navigation} C={C} s={s} />
          ))
        )}

        {/* Disclaimer */}
        <View style={[s.disclaimer, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="information-circle-outline" size={14} color={C.c35} />
          <Text style={s.disclaimerTxt}>
            Zabroad connects you with attorneys for informational purposes. Always verify credentials independently. This is not legal advice.
          </Text>
        </View>
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
  scopeRow:        { flexDirection: 'row', gap: 5, flexShrink: 0 },
  scopeTab:        { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  scopeTabActive:  { backgroundColor: C.vividD, borderColor: C.vivid + '66' },
  scopeTabTxt:     { fontSize: 10, fontWeight: '600', color: C.c35 },
  scopeTabTxtActive:{ color: C.vivid, fontWeight: '700' },

  // Search
  searchWrap:  { paddingHorizontal: 16, marginBottom: 10 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 13, color: C.cream },

  // Filters
  filtersRow:      { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  filterPill:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  filterPillActive:{ backgroundColor: C.purpleD, borderColor: C.purple + '66' },
  filterTxt:       { fontSize: 12, color: C.c35, fontWeight: '600' },
  filterTxtActive: { color: C.purple, fontWeight: '700' },

  // List
  list:         { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30, gap: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 4 },

  // Empty
  emptyState:   { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt:     { fontSize: 15, fontWeight: '700', color: C.cream, textAlign: 'center' },
  emptySub:     { fontSize: 13, color: C.c35 },
  switchBtn:    { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, borderWidth: 1 },
  switchBtnTxt: { fontSize: 13, fontWeight: '700' },

  // Attorney card
  attCard:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 16 },
  attTop:       { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  attAv:        { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  attInitials:  { fontSize: 18, fontWeight: '800' },
  verifiedBadge:{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.bg },
  attNameRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  attName:      { fontSize: 14, fontWeight: '700', color: C.cream, flex: 1 },
  ratingBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.goldD, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: C.gold + '33' },
  ratingTxt:    { fontSize: 11, color: C.gold, fontWeight: '700' },
  attFirm:      { fontSize: 12, color: C.c35, marginBottom: 4 },
  attBadge:     { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1 },
  attBadgeTxt:  { fontSize: 10, fontWeight: '700' },

  // Meta rows
  attMeta:    { gap: 5, marginBottom: 14 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 7 },
  attSpec:    { fontSize: 12, fontWeight: '700', flex: 1 },
  attMetaTxt: { fontSize: 12, color: C.c35, flex: 1 },

  // Footer
  attFooter:     { flexDirection: 'row', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  consultBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.purple, paddingVertical: 10, borderRadius: 50, shadowColor: C.purple, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
  consultTxt:    { fontSize: 12, fontWeight: '700', color: 'white' },
  msgBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.purpleD, paddingVertical: 10, borderRadius: 50, borderWidth: 1, borderColor: C.purple + '33' },
  msgTxt:        { fontSize: 12, fontWeight: '600', color: C.purple },
  confirmedBanner:{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10, borderRadius: 10, padding: 10, borderWidth: 1 },
  confirmedTxt:  { fontSize: 12, fontWeight: '600', flex: 1 },

  // Disclaimer
  disclaimer:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 14, padding: 12 },
  disclaimerTxt: { flex: 1, fontSize: 11, color: C.c35, lineHeight: 17 },
});
