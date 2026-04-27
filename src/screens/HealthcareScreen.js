import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const DOCTORS = [
  {
    id: '1', name: 'Dr. Ayesha Karim', clinic: 'Queens Family Health Center',
    specialty: 'Primary Care', rating: '4.9',
    languages: ['English', 'Bangla'], insurance: 'OPT · Medicaid · Uninsured OK',
    location: 'Queens, NY · 0.8mi', avail: 'Tomorrow 3pm',
    color: '#3EC8C8', badge: 'Immigrant Friendly', filter: 'Primary Care',
    initials: 'AK',
  },
  {
    id: '2', name: 'Dr. Rajesh Patel', clinic: 'Manhattan Internal Medicine',
    specialty: 'Internal Medicine', rating: '4.8',
    languages: ['English', 'Hindi', 'Gujarati'], insurance: 'OPT · Most plans',
    location: 'Manhattan, NY · 2.1mi', avail: 'Thu 10am',
    color: '#5B8DEF', badge: null, filter: 'Primary Care',
    initials: 'RP',
  },
  {
    id: '3', name: 'Dr. Fatima Al-Hassan', clinic: 'Brooklyn Community Clinic',
    specialty: 'Family Medicine', rating: '4.9',
    languages: ['English', 'Arabic', 'French'], insurance: 'Uninsured OK · Sliding scale',
    location: 'Brooklyn, NY · 3.4mi', avail: 'Fri 2pm',
    color: '#A855F7', badge: 'Sliding Scale', filter: 'Family Medicine',
    initials: 'FA',
  },
  {
    id: '4', name: 'Dr. Chen Wei', clinic: 'Flushing Wellness Center',
    specialty: 'Mental Health', rating: '4.7',
    languages: ['English', 'Mandarin', 'Cantonese'], insurance: 'OPT · Telehealth available',
    location: 'Flushing, NY · 1.9mi', avail: 'Mon 4pm',
    color: '#7C6FF7', badge: 'Telehealth', filter: 'Mental Health',
    initials: 'CW',
  },
  {
    id: '5', name: 'Dr. Maria Santos', clinic: "Bronx Women's Health",
    specialty: 'OB/GYN', rating: '4.8',
    languages: ['English', 'Spanish', 'Portuguese'], insurance: 'Medicaid · OPT',
    location: 'Bronx, NY · 4.2mi', avail: 'Wed 11am',
    color: '#F5A623', badge: null, filter: 'OB/GYN',
    initials: 'MS',
  },
  {
    id: '6', name: 'Dr. Samuel Okonkwo', clinic: 'Harlem Dental & Wellness',
    specialty: 'Dentistry', rating: '4.6',
    languages: ['English', 'Yoruba', 'Igbo'], insurance: 'Uninsured OK · Sliding scale',
    location: 'Harlem, NY · 1.2mi', avail: 'Sat 9am',
    color: '#3EC878', badge: 'Immigrant Friendly', filter: 'Dentist',
    initials: 'SO',
  },
];

const FILTERS = ['All', 'Primary Care', 'Family Medicine', 'Mental Health', 'OB/GYN', 'Dentist'];

const SPECIALTY_ICON = {
  'Primary Care':    'fitness-outline',
  'Internal Medicine':'pulse-outline',
  'Family Medicine': 'people-outline',
  'Mental Health':   'brain-outline',
  'OB/GYN':         'rose-outline',
  'Dentistry':       'happy-outline',
};

function DoctorCard({ doc, navigation, C, s }) {
  const [booked,    setBooked]    = useState(false);
  const [messaged,  setMessaged]  = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  function onBook() {
    if (booked) return;
    setBooked(true);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.06, useNativeDriver: true, speed: 60, bounciness: 12 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30 }),
    ]).start();
  }

  function onMessage() {
    setMessaged(true);
    navigation.navigate('Chat');
  }

  return (
    <Animated.View style={[s.docCard, { transform: [{ scale }] }, booked && { borderColor: C.green + '55' }]}>
      {/* Top row */}
      <View style={s.docTop}>
        <View style={[s.docAv, { backgroundColor: doc.color + '22' }]}>
          <Text style={[s.docInitials, { color: doc.color }]}>{doc.initials}</Text>
          {/* Verified badge */}
          <View style={[s.verifiedBadge, { backgroundColor: C.green }]}>
            <Ionicons name="checkmark" size={8} color="white" />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.docNameRow}>
            <Text style={s.docName} numberOfLines={1}>{doc.name}</Text>
            <View style={s.ratingBadge}>
              <Ionicons name="star" size={10} color={C.gold} />
              <Text style={s.ratingTxt}>{doc.rating}</Text>
            </View>
          </View>
          <Text style={s.docClinic} numberOfLines={1}>{doc.clinic}</Text>
          {doc.badge && (
            <View style={[s.docBadge, { backgroundColor: doc.color + '1A', borderColor: doc.color + '44' }]}>
              <Text style={[s.docBadgeTxt, { color: doc.color }]}>{doc.badge}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Meta */}
      <View style={s.docMeta}>
        <View style={s.metaRow}>
          <Ionicons name={SPECIALTY_ICON[doc.specialty] || 'medkit-outline'} size={13} color={doc.color} />
          <Text style={[s.docSpec, { color: doc.color }]}>{doc.specialty}</Text>
        </View>
        <View style={s.metaRow}>
          <Ionicons name="chatbubble-ellipses-outline" size={13} color={C.c35} />
          <Text style={s.docMetaTxt}>{doc.languages.join(' · ')}</Text>
        </View>
        <View style={s.metaRow}>
          <Ionicons name="shield-checkmark-outline" size={13} color={C.c35} />
          <Text style={s.docMetaTxt}>{doc.insurance}</Text>
        </View>
        <View style={s.metaRow}>
          <Ionicons name="location-outline" size={13} color={C.c35} />
          <Text style={s.docMetaTxt}>{doc.location}</Text>
        </View>
        <View style={s.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={C.green} />
          <Text style={[s.docMetaTxt, { color: C.green, fontWeight: '600' }]}>Next: {doc.avail}</Text>
        </View>
      </View>

      {/* Footer buttons */}
      <View style={s.docFooter}>
        <TouchableOpacity
          style={[s.bookBtn, booked && { backgroundColor: C.greenD }]}
          onPress={onBook}
          activeOpacity={0.85}
        >
          <Ionicons name={booked ? 'checkmark-circle' : 'calendar'} size={14} color={booked ? C.green : '#0D0F1A'} />
          <Text style={[s.bookTxt, booked && { color: C.green }]}>
            {booked ? 'Booked' : 'Book Appointment'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.msgBtn, messaged && { backgroundColor: doc.color + '1A', borderColor: doc.color + '44' }]}
          onPress={onMessage}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-outline" size={14} color={messaged ? doc.color : C.teal} />
          <Text style={[s.msgTxt, messaged && { color: doc.color }]}>
            {messaged ? 'Sent' : 'Message'}
          </Text>
        </TouchableOpacity>
      </View>

      {booked && (
        <View style={[s.bookedBanner, { backgroundColor: C.greenD, borderColor: C.green + '33' }]}>
          <Ionicons name="checkmark-circle" size={14} color={C.green} />
          <Text style={[s.bookedTxt, { color: C.green }]}>
            Confirmed · {doc.avail} · Reminder will be sent
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function HealthcareScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState(0);

  const filtered = DOCTORS.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      d.name.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q) ||
      d.languages.some(l => l.toLowerCase().includes(q));
    const matchFilter = activeFilter === 0 || d.filter === FILTERS[activeFilter];
    return matchSearch && matchFilter;
  });

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Healthcare</Text>
          <Text style={s.sub}>Multilingual doctors near you</Text>
        </View>
        <TouchableOpacity style={s.listBtn} onPress={() => navigation.navigate('ListDoctor')} activeOpacity={0.85}>
          <Ionicons name="add" size={14} color={C.teal} />
          <Text style={s.listBtnTxt}>List Practice</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={C.c35} />
          <TextInput
            style={s.searchInput}
            placeholder="Name, language, specialty…"
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

      {/* List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        <Text style={s.sectionLabel}>{filtered.length} DOCTOR{filtered.length !== 1 ? 'S' : ''} NEAR YOU</Text>

        {filtered.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="medical-outline" size={40} color={C.c35} />
            <Text style={s.emptyTxt}>No doctors found</Text>
            <Text style={s.emptySub}>Try a different filter or search term</Text>
          </View>
        ) : (
          filtered.map(doc => (
            <DoctorCard key={doc.id} doc={doc} navigation={navigation} C={C} s={s} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Header
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  backBtn:    { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 20, fontWeight: '800', color: C.cream, letterSpacing: -0.5 },
  sub:        { fontSize: 12, color: C.c35, marginTop: 1 },
  listBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.tealD, borderWidth: 1, borderColor: C.teal + '55', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 7 },
  listBtnTxt: { fontSize: 12, fontWeight: '700', color: C.teal },

  // Search
  searchWrap:  { paddingHorizontal: 16, marginBottom: 10 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 13, color: C.cream },

  // Filters
  filtersRow:  { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  filterPill:  { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  filterPillActive: { backgroundColor: C.teal + '22', borderColor: C.teal + '66' },
  filterTxt:   { fontSize: 12, color: C.c35, fontWeight: '600' },
  filterTxtActive: { color: C.teal, fontWeight: '700' },

  // List
  list:        { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30, gap: 12 },
  sectionLabel:{ fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 4 },

  // Empty
  emptyState:  { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt:    { fontSize: 15, fontWeight: '700', color: C.cream },
  emptySub:    { fontSize: 13, color: C.c35 },

  // Doctor card
  docCard:     { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 16 },
  docTop:      { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  docAv:       { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  docInitials: { fontSize: 18, fontWeight: '800' },
  verifiedBadge: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.bg },
  docNameRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  docName:     { fontSize: 14, fontWeight: '700', color: C.cream, flex: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.goldD, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: C.gold + '33' },
  ratingTxt:   { fontSize: 11, color: C.gold, fontWeight: '700' },
  docClinic:   { fontSize: 12, color: C.c35, marginBottom: 4 },
  docBadge:    { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1 },
  docBadgeTxt: { fontSize: 10, fontWeight: '700' },

  // Meta rows
  docMeta:     { gap: 5, marginBottom: 14, paddingTop: 2 },
  metaRow:     { flexDirection: 'row', alignItems: 'center', gap: 7 },
  docSpec:     { fontSize: 12, fontWeight: '700' },
  docMetaTxt:  { fontSize: 12, color: C.c35, flex: 1 },

  // Footer
  docFooter:   { flexDirection: 'row', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  bookBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.teal, paddingVertical: 10, borderRadius: 50, shadowColor: C.teal, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
  bookTxt:     { fontSize: 12, fontWeight: '700', color: '#0D0F1A' },
  msgBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.tealD, paddingVertical: 10, borderRadius: 50, borderWidth: 1, borderColor: C.teal + '33' },
  msgTxt:      { fontSize: 12, fontWeight: '600', color: C.teal },
  bookedBanner:{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10, borderRadius: 10, padding: 10, borderWidth: 1 },
  bookedTxt:   { fontSize: 12, fontWeight: '600', flex: 1 },
});
