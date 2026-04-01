import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

// ─── All searchable content ────────────────────────────────────────────
const ALL_RESULTS = [
  // Jobs
  { id: 'j1', type: 'Job',       icon: '💼', title: 'Frontend Engineer – Stripe',          sub: 'Manhattan, NY · Remote · H-1B sponsored',    route: 'Jobs',      tag: 'Tech' },
  { id: 'j2', type: 'Job',       icon: '💼', title: 'Data Analyst – NYC Health',            sub: 'Brooklyn, NY · OPT/CPT friendly',             route: 'Jobs',      tag: 'Data' },
  { id: 'j3', type: 'Job',       icon: '💼', title: 'Software Engineer – Meta',             sub: 'NYC · H-1B Sponsor · $160K+',                 route: 'Jobs',      tag: 'Tech' },
  // Housing
  { id: 'h1', type: 'Housing',   icon: '🏠', title: '1BR in Jackson Heights',               sub: 'Queens, NY · No credit check · $1,450/mo',    route: 'Housing',   tag: 'Apartment' },
  { id: 'h2', type: 'Housing',   icon: '🏠', title: 'Shared Room in Astoria',               sub: 'Queens, NY · No SSN required · $750/mo',      route: 'Housing',   tag: 'Shared' },
  // Healthcare
  { id: 'hc1', type: 'Doctor',   icon: '🏥', title: 'Dr. Patel – Family Medicine',          sub: 'Flushing, NY · Accepts Medicaid · Hindi',     route: 'Healthcare', tag: 'Primary Care' },
  { id: 'hc2', type: 'Doctor',   icon: '🏥', title: 'Dr. Kim – Internal Medicine',          sub: 'Flushing, NY · Korean, English',              route: 'Healthcare', tag: 'Internal' },
  // Attorney
  { id: 'a1', type: 'Attorney',  icon: '⚖️', title: 'Mehta & Associates Immigration',       sub: 'Manhattan, NY · OPT, H-1B, Green Card',       route: 'Attorney',  tag: 'Immigration' },
  { id: 'a2', type: 'Attorney',  icon: '⚖️', title: 'Rodriguez Immigration Law',            sub: 'Bronx, NY · Asylum, Family Visa',             route: 'Attorney',  tag: 'Family' },
  // Visa
  { id: 'v1', type: 'Visa',      icon: '📋', title: 'OPT Extension Guide',                  sub: 'F-1 students · STEM eligible',                route: 'Visa',      tag: 'OPT' },
  { id: 'v2', type: 'Visa',      icon: '📋', title: 'H-1B Cap 2025 Process',               sub: 'Lottery dates & requirements',                route: 'Visa',      tag: 'H-1B' },
  { id: 'v3', type: 'Visa',      icon: '📋', title: 'Green Card EB-2 / EB-3',              sub: 'Priority dates & PERM process',               route: 'Visa',      tag: 'Green Card' },
  // Community
  { id: 'c1', type: 'Community', icon: '🏘️', title: 'NYC Bangladeshi Network',             sub: 'Queens, NY · 2.4K members',                   route: 'Community', tag: 'South Asian' },
  { id: 'c2', type: 'Community', icon: '🏘️', title: 'South Asian Pros NYC',               sub: 'Manhattan, NY · 5.1K members',                route: 'Community', tag: 'South Asian' },
  { id: 'c3', type: 'Community', icon: '🏘️', title: 'African Immigrant Hub',              sub: 'Bronx, NY · 1.8K members',                    route: 'Community', tag: 'African' },
  // AI / general
  { id: 'ai1', type: 'AI Help',  icon: '🤖', title: 'Ask AI about immigration',             sub: 'Get instant answers on visa, jobs, housing', route: 'AIAssistant', tag: 'AI' },
];

const TYPE_FILTERS = ['All', 'Job', 'Housing', 'Doctor', 'Attorney', 'Visa', 'Community'];

const TRENDING = ['OPT extension', 'H-1B lottery 2025', 'no credit check apartment', 'immigration attorney Queens', 'STEM OPT jobs'];

const RECENT = ['green card EB-2', 'medicaid doctor NYC'];

const TYPE_COLORS = {
  Job:       { bg: '#0F2D1E', text: '#52D68A' },
  Housing:   { bg: '#1A2A1A', text: '#86EFAC' },
  Doctor:    { bg: '#1A2C50', text: '#6EA8FE' },
  Attorney:  { bg: '#2C1F0E', text: '#FDB970' },
  Visa:      { bg: '#2A1F36', text: '#C084FC' },
  Community: { bg: '#1A2438', text: '#93C5FD' },
  'AI Help': { bg: '#2D1515', text: '#FCA5A5' },
};

export default function SearchScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const inputRef   = useRef(null);
  const [query,    setQuery]    = useState('');
  const [filter,   setFilter]   = useState('All');
  const [focused,  setFocused]  = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(timer);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return ALL_RESULTS.filter(r => {
      const matchQuery = r.title.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q) || r.tag.toLowerCase().includes(q);
      const matchFilter = filter === 'All' || r.type === filter;
      return matchQuery && matchFilter;
    });
  }, [query, filter]);

  function handleResultPress(r) {
    Keyboard.dismiss();
    navigation.navigate(r.route);
  }

  function handleSuggestion(text) {
    setQuery(text);
  }

  const showEmpty = query.trim().length > 0 && results.length === 0;
  const showResults = query.trim().length > 0 && results.length > 0;
  const showDiscover = !query.trim();

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={s.searchBar}>
          <Text style={{ fontSize: 14 }}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            placeholder="Jobs, housing, visa, doctors…"
            placeholderTextColor={C.c35}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 16, color: C.c35 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter pills (visible when searching) */}
      {(showResults || query.length > 0) && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
          style={{ flexGrow: 0 }}
        >
          {TYPE_FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterPill, filter === f && s.filterPillActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[s.filterTxt, filter === f && s.filterTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Discover state */}
        {showDiscover && (
          <>
            {/* Recent searches */}
            {RECENT.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionLabel}>RECENT</Text>
                  <TouchableOpacity><Text style={s.clearTxt}>Clear</Text></TouchableOpacity>
                </View>
                {RECENT.map(r => (
                  <TouchableOpacity key={r} style={s.recentRow} onPress={() => handleSuggestion(r)} activeOpacity={0.7}>
                    <Text style={{ fontSize: 14, color: C.c35 }}>🕐</Text>
                    <Text style={s.recentTxt}>{r}</Text>
                    <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={{ fontSize: 12, color: C.c35 }}>✕</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Trending */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>TRENDING IN YOUR AREA</Text>
              <View style={s.trendingGrid}>
                {TRENDING.map((t, i) => (
                  <TouchableOpacity key={t} style={s.trendingPill} onPress={() => handleSuggestion(t)} activeOpacity={0.8}>
                    <Text style={s.trendingNum}>{i + 1}</Text>
                    <Text style={s.trendingTxt}>{t}</Text>
                    <Text style={{ fontSize: 10 }}>🔥</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quick categories */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>BROWSE BY CATEGORY</Text>
              <View style={s.catGrid}>
                {[
                  { icon: '💼', label: 'Jobs',       route: 'Jobs',       bg: C.greenD,  color: C.green },
                  { icon: '🏠', label: 'Housing',    route: 'Housing',    bg: C.goldD,   color: C.gold  },
                  { icon: '📋', label: 'Visa',       route: 'Visa',       bg: C.vividD,  color: C.vivid },
                  { icon: '🏥', label: 'Healthcare', route: 'Healthcare', bg: C.blueD,   color: C.blue  },
                  { icon: '⚖️', label: 'Attorney',   route: 'Attorney',   bg: C.purpleD, color: C.purple || C.vivid },
                  { icon: '🏘️', label: 'Community',  route: 'Community',  bg: C.tealD,   color: C.teal  },
                ].map(cat => (
                  <TouchableOpacity
                    key={cat.label}
                    style={[s.catBox, { backgroundColor: cat.bg }]}
                    onPress={() => navigation.navigate(cat.route)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 26 }}>{cat.icon}</Text>
                    <Text style={[s.catLabel, { color: cat.color }]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Results */}
        {showResults && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>{results.length} RESULT{results.length !== 1 ? 'S' : ''} FOR "{query.toUpperCase()}"</Text>
            <View style={{ gap: 10 }}>
              {results.map(r => {
                const colors = TYPE_COLORS[r.type] || TYPE_COLORS['AI Help'];
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={s.resultCard}
                    onPress={() => handleResultPress(r)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.resultIconBox, { backgroundColor: colors.bg }]}>
                      <Text style={{ fontSize: 20 }}>{r.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.resultTitle} numberOfLines={1}>{r.title}</Text>
                      <Text style={s.resultSub}   numberOfLines={1}>{r.sub}</Text>
                    </View>
                    <View style={[s.typeBadge, { backgroundColor: colors.bg }]}>
                      <Text style={[s.typeTxt, { color: colors.text }]}>{r.type}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* AI fallback */}
              <TouchableOpacity
                style={s.aiFallback}
                onPress={() => navigation.navigate('AIAssistant')}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 20 }}>🤖</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.aiFallbackTitle}>Ask AI about "{query}"</Text>
                  <Text style={s.aiFallbackSub}>Get personalized help from your AI assistant</Text>
                </View>
                <Text style={{ fontSize: 16, color: C.vivid }}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Empty state */}
        {showEmpty && (
          <View style={s.emptyState}>
            <Text style={{ fontSize: 48 }}>🔍</Text>
            <Text style={s.emptyTitle}>No results for "{query}"</Text>
            <Text style={s.emptySub}>Try different keywords or ask the AI assistant</Text>
            <TouchableOpacity
              style={s.aiBtn}
              onPress={() => navigation.navigate('AIAssistant')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16 }}>🤖</Text>
              <Text style={s.aiBtnTxt}>Ask AI Assistant</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.nav },
  back: { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  backTxt: { fontSize: 24, color: C.cream, lineHeight: 28 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, color: C.cream },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 10, paddingBottom: 6 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 50, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  filterPillActive: { backgroundColor: C.vividD, borderColor: C.vivid + '44' },
  filterTxt: { fontSize: 12, color: C.c35, fontWeight: '600' },
  filterTxtActive: { color: C.vivid },
  scroll: { flex: 1 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5 },
  clearTxt: { fontSize: 12, color: C.vivid, fontWeight: '600' },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  recentTxt: { flex: 1, fontSize: 14, color: C.cream },
  trendingGrid: { gap: 8 },
  trendingPill: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  trendingNum: { fontSize: 12, fontWeight: '800', color: C.vivid, width: 16 },
  trendingTxt: { flex: 1, fontSize: 14, color: C.cream },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catBox: { width: '30.5%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: C.border },
  catLabel: { fontSize: 11, fontWeight: '700' },
  resultCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 12 },
  resultIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  resultTitle: { fontSize: 14, fontWeight: '700', color: C.cream, marginBottom: 2 },
  resultSub: { fontSize: 11, color: C.c35 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, flexShrink: 0 },
  typeTxt: { fontSize: 10, fontWeight: '700' },
  aiFallback: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.vividD, borderWidth: 1, borderColor: C.vivid + '33', borderRadius: 14, padding: 14 },
  aiFallbackTitle: { fontSize: 14, fontWeight: '700', color: C.cream },
  aiFallbackSub: { fontSize: 11, color: C.c35, marginTop: 1 },
  emptyState: { alignItems: 'center', paddingTop: 48, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.cream },
  emptySub: { fontSize: 13, color: C.c35, textAlign: 'center' },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: C.vividD, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 50, borderWidth: 1, borderColor: C.vivid + '44' },
  aiBtnTxt: { fontSize: 14, fontWeight: '700', color: C.vivid },
});
