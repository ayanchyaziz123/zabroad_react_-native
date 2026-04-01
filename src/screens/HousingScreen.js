import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

const TIPS = [
  { icon: '📑', title: 'No Credit History?', desc: 'Offer a larger security deposit (2–3 months) or show your offer letter/employment contract.' },
  { icon: '🪪', title: 'No SSN Yet?', desc: 'Many immigrant-friendly landlords accept ITIN, passport, or visa documents instead.' },
  { icon: '🤝', title: 'Find a Co-signer', desc: 'A US citizen co-signer dramatically increases your approval chances with larger landlords.' },
];

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  back: { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 24, color: C.cream, lineHeight: 28 },
  title: { fontSize: 20, fontWeight: '800', color: C.cream },
  sub: { fontSize: 12, color: C.c35, marginTop: 1 },
  searchRow: { paddingHorizontal: 20, marginBottom: 12, flexDirection: 'row', gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 13, color: C.cream },
  mapBtn: { width: 46, height: 46, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  filterScroll: { marginBottom: 16, flexGrow: 0 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  filterActive: { backgroundColor: C.gold + '22', borderColor: C.gold + '66' },
  filterTxt: { fontSize: 12, color: C.c35, fontWeight: '500' },
  filterTxtActive: { color: C.gold, fontWeight: '700' },
  tipsCard: { backgroundColor: C.card, borderWidth: 1, borderColor: 'rgba(245,166,35,0.15)', borderRadius: 18, padding: 14 },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: C.cream, marginBottom: 10 },
  tipRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'flex-start' },
  tipTitle2: { fontSize: 12, fontWeight: '700', color: C.cream, marginBottom: 2 },
  tipDesc: { fontSize: 11, color: C.c35, lineHeight: 17 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5 },
  listingCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14 },
  listingTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  listingEmoji: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  listingTitle: { fontSize: 14, fontWeight: '700', color: C.cream, marginBottom: 2 },
  listingPrice: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  listingArea: { fontSize: 11, color: C.c35 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  badge: { backgroundColor: C.greenD, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(62,200,120,0.2)' },
  badgeTxt: { fontSize: 10, color: C.green, fontWeight: '700' },
  listingDesc: { fontSize: 12, color: C.c35, lineHeight: 18, marginBottom: 10 },
  listingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  posterRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  posterName: { fontSize: 11, color: C.c35 },
  contactBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50 },
  contactTxt: { fontSize: 12, fontWeight: '700', color: '#0D0F1A' },
  postCta: { backgroundColor: C.goldD, borderWidth: 1, borderColor: 'rgba(245,166,35,0.2)', borderRadius: 18, padding: 16 },
  postCtaTitle: { fontSize: 14, fontWeight: '700', color: C.cream, marginBottom: 4 },
  postCtaSub: { fontSize: 12, color: C.c35, lineHeight: 18 },
});

export default function HousingScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const LISTINGS = [
    {
      id: '1', title: '1BR in Jackson Heights', price: '$1,450/mo', area: 'Jackson Heights, Queens',
      beds: '1 bed · 1 bath', noCredit: true, noSSN: true, furnished: true,
      desc: 'Sunny unit close to F/M/R trains. Landlord speaks Bengali & Spanish. No credit check.',
      emoji: '🏠', color: C.gold, poster: 'Karim Bhai', postedBy: '🧑', time: '3h ago',
    },
    {
      id: '2', title: 'Shared Room — Male Only', price: '$750/mo', area: 'Astoria, Queens',
      beds: 'Shared · 3 roommates', noCredit: true, noSSN: false, furnished: true,
      desc: 'Quiet South Asian household. Close to N/W train. Bills included. Muslim-friendly home.',
      emoji: '🛏', color: C.teal, poster: 'Ahmed S.', postedBy: '🧑‍🦲', time: '6h ago',
    },
    {
      id: '3', title: '2BR for Immigrant Family', price: '$2,100/mo', area: 'Bronx, NY',
      beds: '2 bed · 1 bath', noCredit: false, noSSN: false, furnished: false,
      desc: 'Spacious apartment. Landlord understands new immigrants. Offer letter accepted instead of credit.',
      emoji: '🏢', color: C.blue, poster: 'Luis M.', postedBy: '👨', time: '1d ago',
    },
    {
      id: '4', title: 'Studio near Flushing Meadows', price: '$1,200/mo', area: 'Flushing, Queens',
      beds: 'Studio · 1 bath', noCredit: true, noSSN: true, furnished: false,
      desc: 'Perfect for students & new grads. Close to 7 train. Landlord accepts ITIN.',
      emoji: '🏙', color: C.purple, poster: 'Wei L.', postedBy: '👩', time: '2d ago',
    },
  ];

  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState(0);
  const [contacted,    setContacted]    = useState({});
  const filters = ['All', 'No Credit', 'No SSN', 'Furnished', 'Shared', 'Family'];

  const filtered = LISTINGS.filter(l => {
    const matchSearch = !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.area.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      activeFilter === 0 ? true
      : activeFilter === 1 ? l.noCredit
      : activeFilter === 2 ? l.noSSN
      : activeFilter === 3 ? l.furnished
      : activeFilter === 4 ? l.beds.includes('Shared')
      : activeFilter === 5 ? l.beds.includes('2 bed') || l.beds.includes('3 bed')
      : true;
    return matchSearch && matchFilter;
  });

  const toggleContact = (id) => setContacted(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.title}>🏠 Housing</Text>
          <Text style={s.sub}>No credit check · immigrant-friendly</Text>
        </View>
      </View>

      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Text>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search area, price, type…"
            placeholderTextColor={C.c35}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={s.mapBtn}>
          <Text style={{ fontSize: 16 }}>🗺</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingBottom: 4 }}>
        {filters.map((f, i) => (
          <TouchableOpacity key={i} style={[s.filterPill, i === activeFilter && s.filterActive]} onPress={() => setActiveFilter(i)}>
            <Text style={[s.filterTxt, i === activeFilter && s.filterTxtActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 12 }}>

        {/* Tips */}
        <View style={s.tipsCard}>
          <Text style={s.tipsTitle}>🏠 Renting as an Immigrant</Text>
          {TIPS.map((tip, i) => (
            <View key={i} style={[s.tipRow, i < TIPS.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
              <Text style={{ fontSize: 20 }}>{tip.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.tipTitle2}>{tip.title}</Text>
                <Text style={s.tipDesc}>{tip.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>{filtered.length} LISTINGS · NEAR QUEENS, NY</Text>

        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 40, gap: 10 }}>
            <Text style={{ fontSize: 36 }}>🏠</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.cream }}>No listings match</Text>
            <Text style={{ fontSize: 13, color: C.c35 }}>Try a different filter or area</Text>
          </View>
        )}

        {filtered.map((listing) => {
          const isContacted = contacted[listing.id];
          return (
            <View key={listing.id} style={[s.listingCard, isContacted && { borderColor: C.green + '55' }]}>
              <View style={s.listingTop}>
                <View style={[s.listingEmoji, { backgroundColor: listing.color + '22' }]}>
                  <Text style={{ fontSize: 28 }}>{listing.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.listingTitle}>{listing.title}</Text>
                  <Text style={[s.listingPrice, { color: listing.color }]}>{listing.price}</Text>
                  <Text style={s.listingArea}>📍 {listing.area}</Text>
                </View>
              </View>

              <View style={s.badgeRow}>
                {listing.noCredit  && <View style={s.badge}><Text style={s.badgeTxt}>✓ No Credit</Text></View>}
                {listing.noSSN     && <View style={s.badge}><Text style={s.badgeTxt}>✓ No SSN</Text></View>}
                {listing.furnished && <View style={s.badge}><Text style={s.badgeTxt}>🛋 Furnished</Text></View>}
              </View>

              <Text style={s.listingDesc}>{listing.desc}</Text>

              <View style={s.listingFooter}>
                <View style={s.posterRow}>
                  <Text style={{ fontSize: 16 }}>{listing.postedBy}</Text>
                  <Text style={s.posterName}>{listing.poster} · {listing.time}</Text>
                </View>
                <TouchableOpacity
                  style={[s.contactBtn, { backgroundColor: isContacted ? C.greenD : listing.color, borderWidth: isContacted ? 1 : 0, borderColor: C.green + '44' }]}
                  onPress={() => toggleContact(listing.id)}
                >
                  <Text style={[s.contactTxt, isContacted && { color: C.green }]}>
                    {isContacted ? '✓ Contacted' : 'Contact →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Post listing CTA */}
        <TouchableOpacity style={s.postCta} onPress={() => navigation.navigate('Create')} activeOpacity={0.85}>
          <Text style={s.postCtaTitle}>🏠 Have a room or apartment?</Text>
          <Text style={s.postCtaSub}>Post your listing for free and reach 50K+ immigrants →</Text>
        </TouchableOpacity>

        <View style={{ height: 10 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
