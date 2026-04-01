import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

const CATEGORIES = ['All', 'South Asian', 'African', 'Latino', 'East Asian', 'Middle East'];

const COMMUNITIES = [
  { flag: '🇧🇩', name: 'NYC Bangladeshi Network',    loc: 'Queens, NY',      members: '2.4K', joined: true,  privacy: 'public',   tags: ['South Asian', 'Jobs', 'Culture'] },
  { flag: '🇮🇳', name: 'South Asian Pros NYC',        loc: 'Manhattan, NY',   members: '5.1K', joined: false, privacy: 'approval', tags: ['South Asian', 'Tech', 'OPT'] },
  { flag: '🇳🇬', name: 'African Immigrant Hub',       loc: 'Bronx, NY',       members: '1.8K', joined: false, privacy: 'public',   tags: ['African', 'Community', 'Housing'] },
  { flag: '🇲🇽', name: 'Latino Unidos NYC',           loc: 'Brooklyn, NY',    members: '3.2K', joined: false, privacy: 'approval', tags: ['Latino', 'Legal', 'Family'] },
  { flag: '🇵🇰', name: 'Pakistani Community USA',     loc: 'Jersey City, NJ', members: '1.1K', joined: false, privacy: 'invite',   tags: ['South Asian', 'Culture', 'Food'] },
  { flag: '🇨🇳', name: 'Chinese Immigrants NYC',      loc: 'Flushing, NY',    members: '4.3K', joined: false, privacy: 'public',   tags: ['East Asian', 'Business', 'Housing'] },
  { flag: '🇰🇷', name: 'Korean American Network',     loc: 'Manhattan, NY',   members: '2.8K', joined: false, privacy: 'approval', tags: ['East Asian', 'Jobs', 'Culture'] },
  { flag: '🇪🇹', name: 'Ethiopian Diaspora NYC',      loc: 'Bronx, NY',       members: '980',  joined: false, privacy: 'public',   tags: ['African', 'Community', 'Religion'] },
  { flag: '🇸🇦', name: 'Arab American Association',   loc: 'Brooklyn, NY',    members: '1.5K', joined: false, privacy: 'invite',   tags: ['Middle East', 'Legal', 'Culture'] },
  { flag: '🇵🇭', name: 'Filipino Community NY',       loc: 'Queens, NY',      members: '3.6K', joined: false, privacy: 'public',   tags: ['East Asian', 'Healthcare', 'Jobs'] },
];

export default function CommunityScreen({ navigation }) {
  const { colors: C, isDark } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const [search, setSearch]   = useState('');
  const [cat, setCat]         = useState('All');
  const [joined, setJoined]   = useState(
    COMMUNITIES.reduce((acc, c) => ({ ...acc, [c.name]: c.joined }), {})
  );

  const filtered = COMMUNITIES.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.loc.toLowerCase().includes(search.toLowerCase());
    const matchCat    = cat === 'All' || c.tags.some(t => t.startsWith(cat));
    return matchSearch && matchCat;
  });

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Communities</Text>
        <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate('CreateCommunity')} activeOpacity={0.8}>
          <Text style={s.createBtnTxt}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search communities…"
          placeholderTextColor={C.c35}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.catRow}
        style={{ flexGrow: 0 }}
      >
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c}
            style={[s.catPill, cat === c && s.catPillActive]}
            onPress={() => setCat(c)}
            activeOpacity={0.8}
          >
            <Text style={[s.catTxt, cat === c && s.catTxtActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={s.list} contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        {/* Joined banner */}
        {cat === 'All' && (
          <LinearGradient
            colors={isDark ? ['#0F1D14', '#0D0F1A'] : ['#E6F4EC', '#F5F7FF']}
            style={s.joinedBanner}
          >
            <Text style={{ fontSize: 20 }}>🏘️</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.joinedTitle}>You're in {Object.values(joined).filter(Boolean).length} community</Text>
              <Text style={s.joinedSub}>Keep exploring groups near you</Text>
            </View>
          </LinearGradient>
        )}

        {filtered.map((c) => (
          <TouchableOpacity key={c.name} style={s.card} activeOpacity={0.9} onPress={() => navigation.navigate('CommunityDetail', { community: c })}>
            <LinearGradient
              colors={isDark ? ['#1E2438', '#111627'] : ['#EEF0FA', '#E4E7F5']}
              style={s.cardBanner}
            >
              <Text style={{ fontSize: 36 }}>{c.flag}</Text>
              <View style={s.memberBadge}>
                <Text style={s.memberTxt}>👥 {c.members}</Text>
              </View>
              {c.privacy !== 'public' && (
                <View style={s.lockBadge}>
                  <Text style={s.lockTxt}>{c.privacy === 'invite' ? '✉️' : '🔒'}</Text>
                </View>
              )}
            </LinearGradient>
            <View style={s.cardBody}>
              <Text style={s.cardName}>{c.name}</Text>
              <Text style={s.cardLoc}>📍 {c.loc}</Text>
              <View style={s.tagRow}>
                {c.tags.slice(0, 3).map(t => (
                  <View key={t} style={s.tag}>
                    <Text style={s.tagTxt}>{t}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[s.joinBtn, joined[c.name] ? s.joinedStyle : s.openStyle]}
                activeOpacity={0.8}
                onPress={() => setJoined(prev => ({ ...prev, [c.name]: !prev[c.name] }))}
              >
                <Text style={[s.joinBtnTxt, { color: joined[c.name] ? C.green : C.vivid }]}>
                  {joined[c.name]
                    ? '✓ Joined'
                    : c.privacy === 'invite'
                      ? '✉️ Invite Only'
                      : c.privacy === 'approval'
                        ? '🔒 Request to Join'
                        : '+ Join Community'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={s.empty}>
            <Text style={{ fontSize: 40 }}>🌍</Text>
            <Text style={s.emptyTxt}>No communities found</Text>
            <Text style={s.emptySub}>Try a different search or category</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.nav },
  back: { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  createBtn: { width: 38, height: 38, backgroundColor: C.vivid, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  createBtnTxt: { color: '#fff', fontSize: 20, fontWeight: '300', lineHeight: 24 },
  backTxt: { fontSize: 24, color: C.cream, lineHeight: 28 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.cream },
  searchWrap: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: C.cream },
  catRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  catPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  catPillActive: { backgroundColor: C.vividD, borderColor: C.vivid + '44' },
  catTxt: { fontSize: 12, color: C.c35, fontWeight: '600' },
  catTxtActive: { color: C.vivid },
  list: { flex: 1 },
  joinedBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.green + '33' },
  joinedTitle: { fontSize: 13, fontWeight: '700', color: C.cream },
  joinedSub: { fontSize: 11, color: C.c35, marginTop: 2 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, overflow: 'hidden' },
  cardBanner: { height: 90, alignItems: 'center', justifyContent: 'center' },
  memberBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3 },
  memberTxt: { fontSize: 10, color: '#fff', fontWeight: '600' },
  lockBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 50, paddingHorizontal: 7, paddingVertical: 2 },
  lockTxt: { fontSize: 10 },
  cardBody: { padding: 14 },
  cardName: { fontSize: 15, fontWeight: '700', color: C.cream, marginBottom: 4 },
  cardLoc: { fontSize: 12, color: C.c35, marginBottom: 10 },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tag: { backgroundColor: C.blueD, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3 },
  tagTxt: { fontSize: 10, color: C.blue, fontWeight: '600' },
  joinBtn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  joinedStyle: { backgroundColor: C.greenD, borderColor: C.green + '33' },
  openStyle: { backgroundColor: C.vividD, borderColor: C.vivid + '33' },
  joinBtnTxt: { fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTxt: { fontSize: 16, fontWeight: '700', color: C.cream },
  emptySub: { fontSize: 13, color: C.c35 },
});
