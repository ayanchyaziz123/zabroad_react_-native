import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

const CATS = ['✦ All', '🏘️ Community', '🩺 Healthcare', '📋 Visa & Legal', '💼 Jobs', '🏠 Housing', '⚖️ Attorney'];
const CAT_ROUTES = [null, 'Community', 'Healthcare', 'Visa', 'Jobs', 'Housing', 'Attorney'];

const CATEGORY_GRID = [
  { icon: '🏘️', name: 'Community',    count: '50K+ members', pill: '80 groups',    colorKey: 'vivid'  },
  { icon: '🩺', name: 'Healthcare',   count: '340 doctors',  pill: 'NEW ✦',         colorKey: 'teal'   },
  { icon: '📋', name: 'Visa & Legal', count: '120 guides',   pill: 'Updated',       colorKey: 'blue'   },
  { icon: '💼', name: 'Jobs',         count: '1.2K listings',pill: 'OPT friendly',  colorKey: 'green'  },
  { icon: '🏠', name: 'Housing',      count: '480 listings', pill: 'No credit OK',  colorKey: 'gold'   },
  { icon: '⚖️', name: 'Attorney',     count: '95 attorneys', pill: 'Free consult',  colorKey: 'purple' },
];

const TRENDING = [
  { rank: '01', colorKey: 'vivid',  topic: 'OPT → H-1B Cap Season 2026',      meta: '1.4K posts · Visa & Legal · 🔥' },
  { rank: '02', colorKey: 'teal',   topic: 'Healthcare Without Insurance USA', meta: '980 posts · Healthcare · ✦ New' },
  { rank: '03', colorKey: 'gold',   topic: 'Renting Without Credit History',   meta: '870 posts · Housing'             },
  { rank: '04', colorKey: 'blue',   topic: 'EB-2 NIW vs EB-1A Strategy',      meta: '640 posts · Legal'               },
  { rank: '05', colorKey: 'green',  topic: 'STEM OPT Extensions 2026',        meta: '520 posts · Visa & Legal'        },
];

const NEARBY = [
  { emoji: '🏘️', name: 'BD Community Center', dist: '0.4mi', type: 'Community', colorKey: 'vivid'  },
  { emoji: '🩺', name: 'Dr. Ayesha Karim',     dist: '0.8mi', type: 'Doctor',    colorKey: 'teal'   },
  { emoji: '💼', name: 'Tech Jobs Fair',        dist: '1.2mi', type: 'Event',     colorKey: 'gold'   },
  { emoji: '⚖️', name: 'Free Legal Aid NYC',   dist: '1.5mi', type: 'Attorney',  colorKey: 'blue'   },
];

const CATEGORY_ROUTES = {
  'Community':    'Community',
  'Healthcare':   'Healthcare',
  'Visa & Legal': 'Visa',
  'Jobs':         'Jobs',
  'Housing':      'Housing',
  'Attorney':     'Attorney',
};

const NEARBY_ROUTES = {
  'Community': 'Community',
  'Doctor':    'Healthcare',
  'Event':     'Jobs',
  'Attorney':  'Attorney',
};

export default function ExploreScreen({ navigation }) {
  const { colors: C, isDark } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const [activeCat, setActiveCat] = useState(0);
  const [search, setSearch] = useState('');

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        <View style={s.header}>
          <Text style={s.title}>Explore <Text style={{ color: C.vivid }}>✦</Text></Text>
          <Text style={s.sub}>Discover communities, doctors & resources</Text>
          <View style={s.searchRow}>
            <View style={s.searchBox}>
              <Text style={{ fontSize: 16 }}>🔍</Text>
              <TextInput
                style={s.searchInput}
                placeholder="Communities, doctors, events…"
                placeholderTextColor={C.c35}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                onSubmitEditing={() => { if (search.trim().length > 0) navigation.navigate('Search'); }}
              onFocus={() => navigation.navigate('Search')}
              />
            </View>
            <TouchableOpacity style={s.filterBtn}><Text style={{ fontSize: 18 }}>⚡</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {CATS.map((cat, i) => (
              <TouchableOpacity key={i} style={[s.catPill, i === activeCat && s.catPillActive]} onPress={() => { setActiveCat(i); if (CAT_ROUTES[i]) navigation.navigate(CAT_ROUTES[i]); }}>
                <Text style={[s.catPillTxt, i === activeCat && s.catPillTxtActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* MAP CARD */}
        <TouchableOpacity activeOpacity={0.9} style={s.mapCard}>
          <LinearGradient colors={isDark ? ['#1A1E35','#0D1020'] : ['#DDE0F5','#C8CCF0']} style={s.mapVis}>
            {[
              { top: '28%', left: '30%', label: '🏘 BD Community', color: C.vivid },
              { top: '50%', left: '55%', label: '🩺 Doctor',       color: C.teal  },
              { top: '65%', left: '20%', label: '💼 Jobs Fair',    color: C.gold  },
              { top: '32%', left: '68%', label: '⚖️ Legal Aid',    color: C.blue  },
            ].map((pin, i) => (
              <View key={i} style={[s.pin, { top: pin.top, left: pin.left }]}>
                <View style={[s.pinBubble, { backgroundColor: pin.color }]}>
                  <Text style={s.pinTxt}>{pin.label}</Text>
                </View>
                <View style={[s.pinArrow, { borderTopColor: pin.color }]} />
              </View>
            ))}
            <LinearGradient colors={['transparent', isDark ? 'rgba(13,15,26,0.8)' : 'rgba(240,242,250,0.8)']} style={s.mapOverlay} />
          </LinearGradient>
          <View style={s.mapInfo}>
            <View>
              <Text style={s.miTitle}>📍 14 spots near Queens, NY</Text>
              <Text style={s.miSub}>Communities · Doctors · Events · Services</Text>
            </View>
            <View style={s.miCta}><Text style={s.miCtaTxt}>Open Map</Text></View>
          </View>
        </TouchableOpacity>

        {/* NEARBY */}
        <View style={s.section}>
          <View style={s.secHdr}>
            <Text style={s.secTitle}>Near You</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Community')}><Text style={s.secSee}>See all →</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {NEARBY.map((n, i) => (
              <TouchableOpacity key={i} style={s.nearbyCard} activeOpacity={0.8} onPress={() => navigation.navigate(NEARBY_ROUTES[n.type])}>
                <View style={[s.nearbyIcon, { backgroundColor: C[n.colorKey] + '22' }]}>
                  <Text style={{ fontSize: 22 }}>{n.emoji}</Text>
                </View>
                <Text style={[s.nearbyType, { color: C[n.colorKey] }]}>{n.type}</Text>
                <Text style={s.nearbyName}>{n.name}</Text>
                <Text style={s.nearbyDist}>📍 {n.dist}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* CATEGORIES */}
        <View style={s.section}>
          <View style={s.secHdr}>
            <Text style={s.secTitle}>Browse Categories</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Visa')}><Text style={s.secSee}>See all →</Text></TouchableOpacity>
          </View>
          <View style={s.catGrid}>
            {CATEGORY_GRID.map((cat, i) => {
              const color = C[cat.colorKey];
              const bg    = C[cat.colorKey + 'D'];
              return (
                <TouchableOpacity key={i} activeOpacity={0.85} style={s.catCard} onPress={() => navigation.navigate(CATEGORY_ROUTES[cat.name])}>
                  <View style={[s.catCardTop, { backgroundColor: color }]} />
                  <Text style={s.catCardEmoji}>{cat.icon}</Text>
                  <Text style={s.catCardName}>{cat.name}</Text>
                  <Text style={s.catCardCount}>{cat.count}</Text>
                  <View style={[s.catCardPill, { backgroundColor: bg, borderColor: color + '44' }]}>
                    <Text style={[s.catCardPillTxt, { color }]}>{cat.pill}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* TRENDING */}
        <View style={[s.section, { marginBottom: 4 }]}>
          <View style={s.secHdr}>
            <Text style={s.secTitle}>🔥 Trending Topics</Text>
            <TouchableOpacity><Text style={s.secSee}>See all →</Text></TouchableOpacity>
          </View>
          <View style={{ gap: 8 }}>
            {TRENDING.map((t, i) => (
              <TouchableOpacity key={i} style={s.trendItem} activeOpacity={0.8} onPress={() => navigation.navigate('Visa')}>
                <Text style={[s.trendRank, { color: C[t.colorKey] }]}>{t.rank}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.trendTopic} numberOfLines={1}>{t.topic}</Text>
                  <Text style={s.trendMeta}>{t.meta}</Text>
                </View>
                <Text style={s.trendArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { padding: 20, paddingBottom: 0 },
  title: { fontSize: 32, fontWeight: '900', color: C.cream, letterSpacing: -1, marginBottom: 4 },
  sub: { fontSize: 13, color: C.c35, marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  searchBox: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 13, color: C.cream },
  filterBtn: { width: 46, height: 46, backgroundColor: C.vivid, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: C.vivid, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
  catPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  catPillActive: { backgroundColor: C.vivid, borderColor: C.vivid, shadowColor: C.vivid, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
  catPillTxt: { fontSize: 12, fontWeight: '500', color: C.c35 },
  catPillTxtActive: { color: 'white', fontWeight: '700' },
  mapCard: { marginHorizontal: 20, marginTop: 18, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  mapVis: { height: 140, position: 'relative' },
  pin: { position: 'absolute', alignItems: 'center' },
  pinBubble: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  pinTxt: { fontSize: 10, fontWeight: '700', color: 'white' },
  pinArrow: { borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -1 },
  mapOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 50 },
  mapInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: C.card },
  miTitle: { fontSize: 13, fontWeight: '700', color: C.cream },
  miSub: { fontSize: 11, color: C.c35, marginTop: 2 },
  miCta: { backgroundColor: C.vividD, borderWidth: 1, borderColor: C.vivid + '33', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  miCtaTxt: { fontSize: 12, fontWeight: '700', color: C.vivid },
  section: { paddingHorizontal: 20, marginTop: 18 },
  secHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  secTitle: { fontSize: 11, fontWeight: '700', color: C.c35, letterSpacing: 1.5, textTransform: 'uppercase' },
  secSee: { fontSize: 12, color: C.vivid, fontWeight: '600' },
  nearbyCard: { width: 120, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, alignItems: 'center' },
  nearbyIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  nearbyType: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
  nearbyName: { fontSize: 11, fontWeight: '600', color: C.cream, textAlign: 'center', marginBottom: 4, lineHeight: 15 },
  nearbyDist: { fontSize: 10, color: C.c35 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: { width: '47%', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, overflow: 'hidden', position: 'relative' },
  catCardTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: 2 },
  catCardEmoji: { fontSize: 26, marginBottom: 8 },
  catCardName: { fontSize: 13, fontWeight: '700', color: C.cream, marginBottom: 3 },
  catCardCount: { fontSize: 10, color: C.c35, marginBottom: 8 },
  catCardPill: { borderWidth: 1, borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  catCardPillTxt: { fontSize: 9, fontWeight: '700' },
  trendItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  trendRank: { fontSize: 16, fontWeight: '800', width: 26, textAlign: 'center' },
  trendTopic: { fontSize: 13, fontWeight: '600', color: C.cream, marginBottom: 3 },
  trendMeta: { fontSize: 10, color: C.c35 },
  trendArrow: { fontSize: 14, color: C.c35 },
});
