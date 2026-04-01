import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

const VISA_KEYWORDS = ['OPT', 'H-1B', 'Green Card', 'Asylum', 'Family', 'EB-1'];

const FILTER_PILLS = ['All', 'OPT', 'H-1B', 'Green Card', 'Asylum', 'Family', 'EB-1'];

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  back: { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 24, color: C.cream, lineHeight: 28 },
  listBtn: { backgroundColor: C.purpleD, borderWidth: 1, borderColor: C.purple + '55', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 7 },
  listBtnTxt: { fontSize: 12, fontWeight: '700', color: C.purple },
  title: { fontSize: 18, fontWeight: '800', color: C.cream },
  sub: { fontSize: 12, color: C.c35, marginTop: 1 },
  searchRow: { paddingHorizontal: 20, marginBottom: 16 },
  searchBox: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 13, color: C.cream },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 10 },
  filterWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 4 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  filterPillActive: { backgroundColor: C.purpleD, borderColor: C.purple + '66' },
  filterPillTxt: { fontSize: 12, color: C.c35, fontWeight: '500' },
  filterPillTxtActive: { color: C.purple, fontWeight: '700' },
  attCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14 },
  attTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  attAv: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  verifiedBadge: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, backgroundColor: C.green, borderRadius: 5, borderWidth: 1, borderColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  attNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  attName: { fontSize: 14, fontWeight: '700', color: C.cream, flex: 1 },
  ratingBadge: { backgroundColor: C.goldD, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(245,166,35,0.2)' },
  ratingTxt: { fontSize: 11, color: C.gold, fontWeight: '700' },
  attFirm: { fontSize: 12, color: C.c35, marginBottom: 4 },
  attBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start', borderWidth: 1 },
  attBadgeTxt: { fontSize: 10, fontWeight: '700' },
  attMeta: { gap: 4, marginBottom: 12, paddingLeft: 4 },
  attSpec: { fontSize: 12, color: C.c60, fontWeight: '500' },
  attLang: { fontSize: 11, color: C.c35 },
  attPrice: { fontSize: 11, color: C.c35 },
  attLoc: { fontSize: 11, color: C.c35 },
  attFooter: { flexDirection: 'row', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  consultBtn: { flex: 1, backgroundColor: C.purple, paddingVertical: 10, borderRadius: 50, alignItems: 'center', shadowColor: C.purple, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
  consultTxt: { fontSize: 12, fontWeight: '700', color: 'white' },
  msgBtn: { flex: 1, backgroundColor: C.purpleD, paddingVertical: 10, borderRadius: 50, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(155,114,239,0.2)' },
  msgTxt: { fontSize: 12, fontWeight: '600', color: C.purple },
  disclaimer: { backgroundColor: C.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border },
  disclaimerTxt: { fontSize: 11, color: C.c35, lineHeight: 17 },
  confirmedBanner: { marginTop: 10, borderRadius: 10, padding: 10, borderWidth: 1 },
});

export default function AttorneyScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const ATTORNEYS = [
    {
      id: '1', name: 'Sarah Kim, Esq.', firm: 'Kim Immigration Law', rating: '4.9',
      specialty: 'H-1B · OPT · EB-2 NIW', languages: ['English', 'Korean'],
      price: 'Free consult · $200/hr', location: 'Manhattan, NY', emoji: '👩‍⚖️',
      color: C.purple, verified: true, badge: 'Top Rated',
    },
    {
      id: '2', name: 'Tariq Hassan, Esq.', firm: 'Hassan & Associates', rating: '4.8',
      specialty: 'Asylum · Deportation Defense · DACA', languages: ['English', 'Arabic', 'Urdu'],
      price: 'Sliding scale available', location: 'Queens, NY', emoji: '🧑‍⚖️',
      color: C.blue, verified: true, badge: 'Pro Bono',
    },
    {
      id: '3', name: 'Maria Flores, Esq.', firm: 'Flores Law Group', rating: '4.7',
      specialty: 'Family · Green Card · Naturalization', languages: ['English', 'Spanish'],
      price: 'Free consult · $150/hr', location: 'Bronx, NY', emoji: '👩‍⚖️',
      color: C.teal, verified: true, badge: null,
    },
    {
      id: '4', name: 'James Chen, Esq.', firm: 'Chen Global Immigration', rating: '4.9',
      specialty: 'EB-1A · O-1 · TN Visa', languages: ['English', 'Mandarin', 'Cantonese'],
      price: 'Free consult · $250/hr', location: 'Flushing, NY', emoji: '🧑‍⚖️',
      color: C.gold, verified: true, badge: 'EB-1 Expert',
    },
  ];

  const [search,      setSearch]      = useState('');
  const [activeFilter, setActiveFilter] = useState(0);
  const [consulted,   setConsulted]   = useState({});
  const [messaged,    setMessaged]    = useState({});

  const filtered = ATTORNEYS.filter(a => {
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.specialty.toLowerCase().includes(search.toLowerCase()) ||
      a.languages.some(l => l.toLowerCase().includes(search.toLowerCase()));
    const matchVisa = activeFilter === 0 || a.specialty.includes(VISA_KEYWORDS[activeFilter - 1]);
    return matchSearch && matchVisa;
  });

  const toggleConsult = (id) => setConsulted(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleMessage = (id) => setMessaged(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>⚖️ Immigration Attorneys</Text>
          <Text style={s.sub}>Free consultations · multilingual</Text>
        </View>
        <TouchableOpacity
          style={s.listBtn}
          onPress={() => navigation.navigate('ListAttorney')}
          activeOpacity={0.85}
        >
          <Text style={s.listBtnTxt}>+ List Yourself</Text>
        </TouchableOpacity>
      </View>

      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Text>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Name, visa type, language…"
            placeholderTextColor={C.c35}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={s.filterWrap}>
        {FILTER_PILLS.map((f, i) => (
          <TouchableOpacity key={i} style={[s.filterPill, i === activeFilter && s.filterPillActive]} onPress={() => setActiveFilter(i)}>
            <Text style={[s.filterPillTxt, i === activeFilter && s.filterPillTxtActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30, gap: 14 }}>

        <Text style={s.sectionLabel}>{filtered.length} ATTORNEYS NEAR YOU</Text>

        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 40, gap: 10 }}>
            <Text style={{ fontSize: 36 }}>⚖️</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.cream }}>No attorneys match</Text>
            <Text style={{ fontSize: 13, color: C.c35 }}>Try a different visa type or search term</Text>
          </View>
        )}

        {filtered.map((att) => {
          const isConsulted = consulted[att.id];
          const isMessaged  = messaged[att.id];
          return (
            <View key={att.id} style={[s.attCard, isConsulted && { borderColor: C.green + '55' }]}>
              <View style={s.attTop}>
                <View style={[s.attAv, { backgroundColor: att.color + '22' }]}>
                  <Text style={{ fontSize: 28 }}>{att.emoji}</Text>
                  {att.verified && (
                    <View style={s.verifiedBadge}>
                      <Text style={{ fontSize: 8, color: 'white' }}>✓</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.attNameRow}>
                    <Text style={s.attName}>{att.name}</Text>
                    <View style={s.ratingBadge}>
                      <Text style={s.ratingTxt}>★ {att.rating}</Text>
                    </View>
                  </View>
                  <Text style={s.attFirm}>{att.firm}</Text>
                  {att.badge && (
                    <View style={[s.attBadge, { backgroundColor: att.color + '22', borderColor: att.color + '44' }]}>
                      <Text style={[s.attBadgeTxt, { color: att.color }]}>{att.badge}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={s.attMeta}>
                <Text style={s.attSpec}>⚖️ {att.specialty}</Text>
                <Text style={s.attLang}>🗣 {att.languages.join(' · ')}</Text>
                <Text style={s.attPrice}>💰 {att.price}</Text>
                <Text style={s.attLoc}>📍 {att.location}</Text>
              </View>

              <View style={s.attFooter}>
                <TouchableOpacity
                  style={[s.consultBtn, isConsulted && { backgroundColor: C.greenD, shadowColor: C.green }]}
                  onPress={() => toggleConsult(att.id)}
                >
                  <Text style={[s.consultTxt, isConsulted && { color: C.green }]}>
                    {isConsulted ? '✓ Booked' : 'Free Consult →'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.msgBtn, isMessaged && { backgroundColor: att.color + '22', borderColor: att.color + '44' }]}
                  onPress={() => { toggleMessage(att.id); navigation.navigate('AppMain', { screen: 'Chat' }); }}
                >
                  <Text style={[s.msgTxt, { color: isMessaged ? att.color : C.purple }]}>
                    {isMessaged ? '✓ Sent' : '💬 Message'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isConsulted && (
                <View style={[s.confirmedBanner, { backgroundColor: C.greenD, borderColor: C.green + '33' }]}>
                  <Text style={{ color: C.green, fontSize: 12, fontWeight: '600' }}>
                    ✓ Consultation request sent · They'll contact you within 24h
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Disclaimer */}
        <View style={s.disclaimer}>
          <Text style={s.disclaimerTxt}>
            ⚠️ Zabroad connects you with attorneys for informational purposes. Always verify credentials independently. This is not legal advice.
          </Text>
        </View>

        <View style={{ height: 10 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
