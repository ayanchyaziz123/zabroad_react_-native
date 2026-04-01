import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  back: { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 24, color: C.cream, lineHeight: 28 },
  listBtn: { backgroundColor: C.tealD, borderWidth: 1, borderColor: C.teal + '55', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 7, marginLeft: 'auto' },
  listBtnTxt: { fontSize: 12, fontWeight: '700', color: C.teal },
  title: { fontSize: 20, fontWeight: '800', color: C.cream },
  sub: { fontSize: 12, color: C.c35, marginTop: 1 },
  searchRow: { paddingHorizontal: 20, marginBottom: 10 },
  searchBox: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 13, color: C.cream },
  filterWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 4 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  filterActive: { backgroundColor: C.teal + '22', borderColor: C.teal + '66' },
  filterTxt: { fontSize: 12, color: C.c35, fontWeight: '500' },
  filterTxtActive: { color: C.teal, fontWeight: '700' },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5 },

  // Doctor card — same layout as attorney
  docCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14 },
  docTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  docAv: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  verifiedBadge: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, backgroundColor: C.green, borderRadius: 5, borderWidth: 1, borderColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  docNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  docName: { fontSize: 14, fontWeight: '700', color: C.cream, flex: 1 },
  ratingBadge: { backgroundColor: C.goldD, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(245,166,35,0.2)' },
  ratingTxt: { fontSize: 11, color: C.gold, fontWeight: '700' },
  docClinic: { fontSize: 12, color: C.c35, marginBottom: 4 },
  docBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start', borderWidth: 1 },
  docBadgeTxt: { fontSize: 10, fontWeight: '700' },
  docMeta: { gap: 4, marginBottom: 12, paddingLeft: 4 },
  docSpec: { fontSize: 12, color: C.c60, fontWeight: '600' },
  docLang: { fontSize: 11, color: C.c35 },
  docIns: { fontSize: 11, color: C.c35 },
  docLoc: { fontSize: 11, color: C.c35 },
  docAvail: { fontSize: 11, color: C.green, fontWeight: '600' },
  docFooter: { flexDirection: 'row', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  bookBtn: { flex: 1, backgroundColor: C.teal, paddingVertical: 10, borderRadius: 50, alignItems: 'center', shadowColor: C.teal, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
  bookTxt: { fontSize: 12, fontWeight: '700', color: '#0D0F1A' },
  msgBtn: { flex: 1, backgroundColor: C.tealD, paddingVertical: 10, borderRadius: 50, alignItems: 'center', borderWidth: 1, borderColor: C.teal + '33' },
  msgTxt: { fontSize: 12, fontWeight: '600', color: C.teal },
  bookedBanner: { marginTop: 10, borderRadius: 10, padding: 10, borderWidth: 1 },
});

export default function HealthcareScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const DOCTORS = [
    {
      id: '1', name: 'Dr. Ayesha Karim', clinic: 'Queens Family Health Center', specialty: '🩺 Primary Care',
      rating: '4.9', languages: ['English', 'Bangla'], insurance: 'OPT · Medicaid · Uninsured OK',
      location: 'Queens, NY · 0.8mi', avail: 'Tomorrow 3pm', emoji: '👩‍⚕️',
      color: C.teal, badge: 'Immigrant Friendly', filter: 'Primary Care',
    },
    {
      id: '2', name: 'Dr. Rajesh Patel', clinic: 'Manhattan Internal Medicine', specialty: '🫀 Internal Medicine',
      rating: '4.8', languages: ['English', 'Hindi', 'Gujarati'], insurance: 'OPT · Most plans',
      location: 'Manhattan, NY · 2.1mi', avail: 'Thu 10am', emoji: '🧑‍⚕️',
      color: C.blue, badge: null, filter: 'Primary Care',
    },
    {
      id: '3', name: 'Dr. Fatima Al-Hassan', clinic: 'Brooklyn Community Clinic', specialty: '👨‍👩‍👧 Family Medicine',
      rating: '4.9', languages: ['English', 'Arabic', 'French'], insurance: 'Uninsured OK · Sliding scale',
      location: 'Brooklyn, NY · 3.4mi', avail: 'Fri 2pm', emoji: '👩‍⚕️',
      color: C.purple, badge: 'Sliding Scale', filter: 'Family Medicine',
    },
    {
      id: '4', name: 'Dr. Chen Wei', clinic: 'Flushing Wellness Center', specialty: '🧠 Mental Health',
      rating: '4.7', languages: ['English', 'Mandarin', 'Cantonese'], insurance: 'OPT · Telehealth available',
      location: 'Flushing, NY · 1.9mi', avail: 'Mon 4pm', emoji: '🧑‍⚕️',
      color: C.vivid, badge: 'Telehealth', filter: 'Mental Health',
    },
    {
      id: '5', name: 'Dr. Maria Santos', clinic: 'Bronx Women\'s Health', specialty: '👶 OB/GYN',
      rating: '4.8', languages: ['English', 'Spanish', 'Portuguese'], insurance: 'Medicaid · OPT',
      location: 'Bronx, NY · 4.2mi', avail: 'Wed 11am', emoji: '👩‍⚕️',
      color: C.gold, badge: null, filter: 'OB/GYN',
    },
  ];

  const filters = ['All', 'Primary Care', 'Family Medicine', 'Mental Health', 'OB/GYN', 'Dentist'];

  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState(0);
  const [booked,       setBooked]       = useState({});
  const [messaged,     setMessaged]     = useState({});

  const filtered = DOCTORS.filter(d => {
    const matchSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase()) ||
      d.languages.some(l => l.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = activeFilter === 0 || d.filter === filters[activeFilter];
    return matchSearch && matchFilter;
  });

  const toggleBook    = (id) => setBooked(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleMessage = (id) => { setMessaged(prev => ({ ...prev, [id]: true })); navigation.navigate('Chat'); };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>🩺 Healthcare</Text>
          <Text style={s.sub}>Multilingual doctors near you</Text>
        </View>
        <TouchableOpacity style={s.listBtn} onPress={() => navigation.navigate('ListDoctor')} activeOpacity={0.85}>
          <Text style={s.listBtnTxt}>+ List Practice</Text>
        </TouchableOpacity>
      </View>

      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Text>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Name, language, specialty…"
            placeholderTextColor={C.c35}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={s.filterWrap}>
        {filters.map((f, i) => (
          <TouchableOpacity key={i} style={[s.filterPill, i === activeFilter && s.filterActive]} onPress={() => setActiveFilter(i)}>
            <Text style={[s.filterTxt, i === activeFilter && s.filterTxtActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, gap: 14 }}>

        <Text style={s.sectionLabel}>{filtered.length} DOCTORS NEAR YOU</Text>

        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 40, gap: 10 }}>
            <Text style={{ fontSize: 36 }}>🩺</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.cream }}>No doctors found</Text>
            <Text style={{ fontSize: 13, color: C.c35 }}>Try a different filter or search term</Text>
          </View>
        )}

        {filtered.map((doc) => {
          const isBooked   = booked[doc.id];
          const isMessaged = messaged[doc.id];
          return (
            <View key={doc.id} style={[s.docCard, isBooked && { borderColor: C.green + '55' }]}>
              <View style={s.docTop}>
                <View style={[s.docAv, { backgroundColor: doc.color + '22' }]}>
                  <Text style={{ fontSize: 28 }}>{doc.emoji}</Text>
                  <View style={s.verifiedBadge}>
                    <Text style={{ fontSize: 8, color: 'white' }}>✓</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.docNameRow}>
                    <Text style={s.docName}>{doc.name}</Text>
                    <View style={s.ratingBadge}>
                      <Text style={s.ratingTxt}>★ {doc.rating}</Text>
                    </View>
                  </View>
                  <Text style={s.docClinic}>{doc.clinic}</Text>
                  {doc.badge && (
                    <View style={[s.docBadge, { backgroundColor: doc.color + '22', borderColor: doc.color + '44' }]}>
                      <Text style={[s.docBadgeTxt, { color: doc.color }]}>{doc.badge}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={s.docMeta}>
                <Text style={s.docSpec}>{doc.specialty}</Text>
                <Text style={s.docLang}>🗣 {doc.languages.join(' · ')}</Text>
                <Text style={s.docIns}>🛡 {doc.insurance}</Text>
                <Text style={s.docLoc}>📍 {doc.location}</Text>
                <Text style={s.docAvail}>📅 Next available: {doc.avail}</Text>
              </View>

              <View style={s.docFooter}>
                <TouchableOpacity
                  style={[s.bookBtn, isBooked && { backgroundColor: C.greenD, shadowOpacity: 0 }]}
                  onPress={() => toggleBook(doc.id)}
                >
                  <Text style={[s.bookTxt, isBooked && { color: C.green }]}>
                    {isBooked ? '✓ Booked' : 'Book Appointment →'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.msgBtn, isMessaged && { backgroundColor: doc.color + '22', borderColor: doc.color + '44' }]}
                  onPress={() => toggleMessage(doc.id)}
                >
                  <Text style={[s.msgTxt, isMessaged && { color: doc.color }]}>
                    {isMessaged ? '✓ Sent' : '💬 Message'}
                  </Text>
                </TouchableOpacity>
              </View>

              {isBooked && (
                <View style={[s.bookedBanner, { backgroundColor: C.greenD, borderColor: C.green + '33' }]}>
                  <Text style={{ color: C.green, fontSize: 12, fontWeight: '600' }}>
                    ✓ Appointment confirmed · {doc.avail} · They'll send a reminder
                  </Text>
                </View>
              )}
            </View>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}
