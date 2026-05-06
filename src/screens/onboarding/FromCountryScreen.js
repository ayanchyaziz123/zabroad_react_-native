import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const NAVY = '#1B3266';

const COUNTRIES = [
  { flag: '🇧🇩', name: 'Bangladesh' },
  { flag: '🇮🇳', name: 'India' },
  { flag: '🇵🇰', name: 'Pakistan' },
  { flag: '🇳🇬', name: 'Nigeria' },
  { flag: '🇲🇽', name: 'Mexico' },
  { flag: '🇨🇳', name: 'China' },
  { flag: '🇵🇭', name: 'Philippines' },
  { flag: '🇧🇷', name: 'Brazil' },
  { flag: '🇪🇹', name: 'Ethiopia' },
  { flag: '🇻🇳', name: 'Vietnam' },
  { flag: '🇬🇭', name: 'Ghana' },
  { flag: '🇰🇷', name: 'South Korea' },
  { flag: '🇨🇴', name: 'Colombia' },
  { flag: '🇪🇬', name: 'Egypt' },
  { flag: '🇹🇷', name: 'Turkey' },
  { flag: '🇵🇪', name: 'Peru' },
  { flag: '🇮🇩', name: 'Indonesia' },
  { flag: '🇷🇴', name: 'Romania' },
  { flag: '🇺🇦', name: 'Ukraine' },
  { flag: '🇯🇵', name: 'Japan' },
  { flag: '🇿🇦', name: 'South Africa' },
  { flag: '🇸🇾', name: 'Syria' },
  { flag: '🇮🇶', name: 'Iraq' },
  { flag: '🇳🇵', name: 'Nepal' },
  { flag: '🇱🇰', name: 'Sri Lanka' },
  { flag: '🇲🇦', name: 'Morocco' },
  { flag: '🇸🇳', name: 'Senegal' },
  { flag: '🇯🇲', name: 'Jamaica' },
  { flag: '🇵🇹', name: 'Portugal' },
  { flag: '🇵🇱', name: 'Poland' },
  { flag: '🇷🇺', name: 'Russia' },
  { flag: '🇮🇷', name: 'Iran' },
  { flag: '🇦🇫', name: 'Afghanistan' },
  { flag: '🇸🇸', name: 'South Sudan' },
  { flag: '🇾🇪', name: 'Yemen' },
  { flag: '🇻🇪', name: 'Venezuela' },
  { flag: '🇪🇨', name: 'Ecuador' },
  { flag: '🇹🇳', name: 'Tunisia' },
  { flag: '🌍', name: 'Other' },
];

export default function FromCountryScreen({ navigation, route }) {
  const { colors: C } = useTheme();
  const userData = route.params || {};
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleNext = () => {
    if (selected) navigation.navigate('LivesIn', { ...userData, fromCountry: selected });
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

      {/* ── Navy header ─────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerTopRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={s.progress}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={[s.progressDot, { backgroundColor: i <= 2 ? '#F4A227' : 'rgba(255,255,255,0.25)' }]} />
            ))}
          </View>
          <View style={{ width: 34 }} />
        </View>
        <Text style={s.headerLogo}>Zabroad ✈</Text>
        <Text style={s.headerTitle}>Where are{'\n'}you from? 🌍</Text>
        <Text style={s.headerSub}>We'll connect you with people from your home country</Text>
      </View>

      {/* ── Search ──────────────────────────────────────────── */}
      <View style={[s.searchWrap, { backgroundColor: C.bg }]}>
        <View style={[s.searchBox, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="search-outline" size={16} color={C.c35} />
          <TextInput
            style={[s.searchInput, { color: C.cream }]}
            placeholder="Search your country…"
            placeholderTextColor={C.c35}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={C.c35} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Country grid ────────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.name}
        numColumns={2}
        style={{ backgroundColor: C.bg }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 10 }}
        columnWrapperStyle={{ gap: 10 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selected?.name === item.name;
          return (
            <TouchableOpacity
              style={[
                s.countryCard,
                { backgroundColor: C.card, borderColor: C.border },
                isSelected && { backgroundColor: C.vividD, borderColor: '#3B8BF7' },
              ]}
              onPress={() => setSelected(item)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 28 }}>{item.flag}</Text>
              <Text style={[s.countryName, { color: isSelected ? '#3B8BF7' : C.cream }]} numberOfLines={1}>
                {item.name}
              </Text>
              {isSelected && (
                <View style={s.checkMark}>
                  <Text style={{ fontSize: 10, color: 'white', fontWeight: '800' }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* ── Footer ──────────────────────────────────────────── */}
      <View style={[s.footer, { borderTopColor: C.border, backgroundColor: C.bg }]}>
        {selected && (
          <View style={[s.selectedBanner, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={{ fontSize: 20 }}>{selected.flag}</Text>
            <Text style={[s.selectedTxt, { color: C.cream }]}>{selected.name} selected</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={selected ? 0.88 : 1}
          style={[s.btn, !selected && { opacity: 0.4 }]}
        >
          <Text style={s.btnTxt}>Continue  →</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },

  // ── Navy header ────────────────────────────────────────────────────────────
  header:       { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backBtn:      { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  progress:     { flexDirection: 'row', gap: 6 },
  progressDot:  { width: 24, height: 4, borderRadius: 2 },
  headerLogo:   { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.4, marginBottom: 10 },
  headerTitle:  { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5, lineHeight: 32, marginBottom: 6 },
  headerSub:    { fontSize: 13, color: 'rgba(255,255,255,0.60)', lineHeight: 19 },

  // ── Search ────────────────────────────────────────────────────────────────
  searchWrap:  { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 15 },

  // ── Country card ──────────────────────────────────────────────────────────
  countryCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, position: 'relative' },
  countryName: { fontSize: 13, fontWeight: '600', flex: 1 },
  checkMark:   { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 6, backgroundColor: '#3B8BF7', alignItems: 'center', justifyContent: 'center' },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer:         { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, borderTopWidth: 1, gap: 10 },
  selectedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  selectedTxt:    { fontSize: 14, fontWeight: '600' },
  btn:            { backgroundColor: NAVY, borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  btnTxt:         { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
});
