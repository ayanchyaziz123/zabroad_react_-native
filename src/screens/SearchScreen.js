import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Keyboard, ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import UserAvatar from '../components/UserAvatar';

// ── Static content (resources) ────────────────────────────────────────────────
const RESOURCES = [
  { id: 'j1',  type: 'Job',       icon: 'briefcase-outline',        title: 'Frontend Engineer – Stripe',       sub: 'Manhattan, NY · H-1B sponsored',    route: 'Jobs',      color: '#3EC878' },
  { id: 'j2',  type: 'Job',       icon: 'briefcase-outline',        title: 'Data Analyst – NYC Health',         sub: 'Brooklyn, NY · OPT/CPT friendly',   route: 'Jobs',      color: '#3EC878' },
  { id: 'h1',  type: 'Housing',   icon: 'home-outline',             title: '1BR in Jackson Heights',            sub: 'Queens, NY · No credit check',       route: 'Housing',   color: '#F5A623' },
  { id: 'h2',  type: 'Housing',   icon: 'home-outline',             title: 'Shared Room in Astoria',            sub: 'Queens, NY · No SSN required',       route: 'Housing',   color: '#F5A623' },
  { id: 'a1',  type: 'Attorney',  icon: 'shield-checkmark-outline', title: 'Mehta & Associates Immigration',    sub: 'Manhattan, NY · H-1B, Green Card',   route: 'Attorney',  color: '#9B72EF' },
  { id: 'a2',  type: 'Attorney',  icon: 'shield-checkmark-outline', title: 'Rodriguez Immigration Law',         sub: 'Bronx, NY · Asylum, Family Visa',    route: 'Attorney',  color: '#9B72EF' },
  { id: 'v1',  type: 'Visa',      icon: 'document-text-outline',    title: 'OPT Extension Guide',               sub: 'F-1 students · STEM eligible',       route: 'Visa',      color: '#E84393' },
  { id: 'v2',  type: 'Visa',      icon: 'document-text-outline',    title: 'H-1B Cap 2025 Process',             sub: 'Lottery dates & requirements',       route: 'Visa',      color: '#E84393' },
  { id: 'c1',  type: 'Community', icon: 'people-outline',           title: 'NYC Bangladeshi Network',           sub: 'Queens, NY · 2.4K members',          route: 'Community', color: '#3BA9EF' },
  { id: 'c2',  type: 'Community', icon: 'people-outline',           title: 'South Asian Pros NYC',              sub: 'Manhattan, NY · 5.1K members',       route: 'Community', color: '#3BA9EF' },
];

const TRENDING = ['H-1B lottery 2025', 'no credit check apartment', 'OPT extension', 'immigration attorney Queens', 'green card EB-2'];

const CATEGORIES = [
  { icon: 'briefcase-outline',        label: 'Jobs',      route: 'Jobs',     color: '#3EC878' },
  { icon: 'home-outline',             label: 'Housing',   route: 'Housing',  color: '#F5A623' },
  { icon: 'shield-checkmark-outline', label: 'Attorneys', route: 'Attorney', color: '#9B72EF' },
];

const TYPE_FILTERS = ['All', 'Post', 'Job', 'Housing', 'Attorney'];

function formatTime(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function SearchScreen({ navigation }) {
  const { colors: C } = useTheme();
  const { api } = useAuthStore();
  const s = useMemo(() => getStyles(C), [C]);

  const inputRef = useRef(null);
  const [query,       setQuery]       = useState('');
  const [filter,      setFilter]      = useState('All');
  const [posts,       setPosts]       = useState([]);
  const [loadingPosts,setLoadingPosts]= useState(false);
  const debounceRef   = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  // Debounced post search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setPosts([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoadingPosts(true);
      try {
        const data = await api(`/posts/?search=${encodeURIComponent(query.trim())}`);
        setPosts(Array.isArray(data) ? data : (data.results || []));
      } catch {
        setPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Filter static resources
  const resourceResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return RESOURCES.filter(r => {
      const matchQ = r.title.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
      const matchF = filter === 'All' || r.type === filter;
      return matchQ && matchF;
    });
  }, [query, filter]);

  const postResults = useMemo(() => {
    if (filter !== 'All' && filter !== 'Post') return [];
    return posts;
  }, [posts, filter]);

  const totalResults  = resourceResults.length + postResults.length;
  const hasQuery      = query.trim().length > 0;
  const showDiscover  = !hasQuery;
  const showResults   = hasQuery;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Search bar ───────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={16} color={C.c35} />
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            placeholder="Search posts, jobs, housing, visa…"
            placeholderTextColor={C.c35}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setPosts([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color={C.c35} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter pills ─────────────────────────────────────────── */}
      {hasQuery && (
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

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Discover state ────────────────────────────────────── */}
        {showDiscover && (
          <>
            {/* Trending */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>TRENDING</Text>
              {TRENDING.map((t, i) => (
                <TouchableOpacity
                  key={t}
                  style={s.trendRow}
                  onPress={() => setQuery(t)}
                  activeOpacity={0.75}
                >
                  <View style={s.trendNum}>
                    <Text style={s.trendNumTxt}>{i + 1}</Text>
                  </View>
                  <Text style={s.trendTxt}>{t}</Text>
                  <Ionicons name="trending-up-outline" size={16} color={C.c35} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Browse categories */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>BROWSE</Text>
              <View style={s.catGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.label}
                    style={[s.catCard, { borderColor: cat.color + '33' }]}
                    onPress={() => navigation.navigate(cat.route)}
                    activeOpacity={0.82}
                  >
                    <View style={[s.catIcon, { backgroundColor: cat.color + '18' }]}>
                      <Ionicons name={cat.icon} size={22} color={cat.color} />
                    </View>
                    <Text style={s.catLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ── Results ───────────────────────────────────────────── */}
        {showResults && (
          <>
            {/* Loading indicator */}
            {loadingPosts && (
              <View style={s.loadingRow}>
                <ActivityIndicator size="small" color={C.vivid} />
                <Text style={s.loadingTxt}>Searching posts…</Text>
              </View>
            )}

            {/* Result count */}
            {!loadingPosts && (
              <Text style={s.resultCount}>
                {totalResults > 0
                  ? `${totalResults} result${totalResults !== 1 ? 's' : ''} for "${query}"`
                  : `No results for "${query}"`}
              </Text>
            )}

            {/* Posts */}
            {postResults.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionLabel}>POSTS</Text>
                {postResults.map(post => (
                  <TouchableOpacity
                    key={post.id}
                    style={s.postCard}
                    onPress={() => { Keyboard.dismiss(); navigation.navigate('PostDetail', { post }); }}
                    activeOpacity={0.85}
                  >
                    <View style={s.postCardHeader}>
                      <UserAvatar
                        uri={post.author_avatar_url}
                        emoji={post.author_avatar}
                        name={post.author_name}
                        size={32}
                        radius={10}
                        bg={C.vividD}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={s.postAuthor} numberOfLines={1}>{post.author_name}</Text>
                        <Text style={s.postTime}>{formatTime(post.created_at)}</Text>
                      </View>
                    </View>
                    <Text style={s.postBody} numberOfLines={3}>{post.body}</Text>
                    {post.topics_list?.length > 0 && (
                      <View style={s.topicsRow}>
                        {post.topics_list.slice(0, 3).map(t => (
                          <View key={t} style={[s.topicChip, { backgroundColor: C.vividD }]}>
                            <Text style={[s.topicTxt, { color: C.vivid }]}>#{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <View style={s.postStats}>
                      <Ionicons name="heart-outline" size={13} color={C.c35} />
                      <Text style={s.postStatTxt}>{post.likes_count || 0}</Text>
                      <Ionicons name="chatbubble-ellipses-outline" size={13} color={C.c35} style={{ marginLeft: 8 }} />
                      <Text style={s.postStatTxt}>{post.comments_count || 0}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Resources */}
            {resourceResults.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionLabel}>RESOURCES</Text>
                {resourceResults.map(r => (
                  <TouchableOpacity
                    key={r.id}
                    style={s.resourceCard}
                    onPress={() => { Keyboard.dismiss(); navigation.navigate(r.route); }}
                    activeOpacity={0.82}
                  >
                    <View style={[s.resourceIcon, { backgroundColor: r.color + '18' }]}>
                      <Ionicons name={r.icon} size={20} color={r.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.resourceTitle} numberOfLines={1}>{r.title}</Text>
                      <Text style={s.resourceSub} numberOfLines={1}>{r.sub}</Text>
                    </View>
                    <View style={[s.typeBadge, { backgroundColor: r.color + '18' }]}>
                      <Text style={[s.typeTxt, { color: r.color }]}>{r.type}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Empty state */}
            {!loadingPosts && totalResults === 0 && (
              <View style={s.emptyState}>
                <View style={[s.emptyIcon, { backgroundColor: C.card }]}>
                  <Ionicons name="search-outline" size={30} color={C.c35} />
                </View>
                <Text style={s.emptyTitle}>No results found</Text>
                <Text style={s.emptySub}>Try different keywords or ask the AI</Text>
                <TouchableOpacity
                  style={s.aiBtn}
                  onPress={() => navigation.navigate('AIAssistant')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="sparkles-outline" size={16} color="white" />
                  <Text style={s.aiBtnTxt}>Ask AI Assistant</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* AI suggestion at bottom when there are results */}
            {!loadingPosts && totalResults > 0 && (
              <TouchableOpacity
                style={s.aiFallback}
                onPress={() => navigation.navigate('AIAssistant')}
                activeOpacity={0.85}
              >
                <View style={[s.resourceIcon, { backgroundColor: C.vividD }]}>
                  <Ionicons name="sparkles-outline" size={18} color={C.vivid} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.resourceTitle}>Ask AI about "{query}"</Text>
                  <Text style={s.resourceSub}>Get personalized immigration guidance</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.c35} />
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 24, paddingBottom: 40 },

  // Header
  header:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  backBtn:   { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, color: C.cream },

  // Filters
  filterRow:       { paddingHorizontal: 14, gap: 8, paddingVertical: 10 },
  filterPill:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  filterPillActive:{ backgroundColor: C.vividD, borderColor: C.vivid + '66' },
  filterTxt:       { fontSize: 12, fontWeight: '600', color: C.c35 },
  filterTxtActive: { color: C.vivid },

  // Section
  section:      { gap: 10 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 2 },

  // Trending
  trendRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  trendNum:    { width: 24, height: 24, borderRadius: 8, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  trendNumTxt: { fontSize: 11, fontWeight: '800', color: C.vivid },
  trendTxt:    { flex: 1, fontSize: 14, color: C.cream, fontWeight: '500' },

  // Categories
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: { flex: 1, aspectRatio: 1, borderRadius: 18, backgroundColor: C.card, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  catIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  catLabel:{ fontSize: 12, fontWeight: '700', color: C.cream },

  // Loading
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadingTxt: { fontSize: 13, color: C.c35 },
  resultCount:{ fontSize: 12, color: C.c35, fontWeight: '600', marginBottom: -12 },

  // Post cards
  postCard:       { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14 },
  postCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  postAuthor:     { fontSize: 13, fontWeight: '700', color: C.cream },
  postTime:       { fontSize: 11, color: C.c35, marginTop: 1 },
  postBody:       { fontSize: 14, color: C.c60, lineHeight: 21, marginBottom: 10 },
  topicsRow:      { flexDirection: 'row', gap: 6, marginBottom: 10 },
  topicChip:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  topicTxt:       { fontSize: 10, fontWeight: '700' },
  postStats:      { flexDirection: 'row', alignItems: 'center', paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
  postStatTxt:    { fontSize: 12, color: C.c35, fontWeight: '600', marginLeft: 4 },

  // Resource cards
  resourceCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 12 },
  resourceIcon:  { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  resourceTitle: { fontSize: 14, fontWeight: '700', color: C.cream, marginBottom: 2 },
  resourceSub:   { fontSize: 11, color: C.c35 },
  typeBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, flexShrink: 0 },
  typeTxt:       { fontSize: 10, fontWeight: '700' },

  // AI fallback
  aiFallback: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.vividD, borderWidth: 1, borderColor: C.vivid + '33', borderRadius: 14, padding: 14 },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 32, gap: 12 },
  emptyIcon:  { width: 70, height: 70, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.cream },
  emptySub:   { fontSize: 13, color: C.c35, textAlign: 'center' },
  aiBtn:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, backgroundColor: C.vivid, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 50 },
  aiBtnTxt:   { fontSize: 14, fontWeight: '700', color: 'white' },
});
