import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

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
    if (selected) navigation.navigate('Interests', { ...userData, fromCountry: selected });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.back, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backTxt, { color: C.cream }]}>‹</Text>
        </TouchableOpacity>
        <View style={styles.progress}>
          {[1,2,3].map(i => (
            <View key={i} style={[styles.progressDot, { backgroundColor: i <= 2 ? C.vivid : C.border }]} />
          ))}
        </View>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.titleWrap}>
        <Text style={[styles.step, { color: C.vivid }]}>Step 2 of 3</Text>
        <Text style={[styles.title, { color: C.cream }]}>Where are{'\n'}you from? 🌍</Text>
        <Text style={[styles.sub, { color: C.c35 }]}>We'll connect you with people from your home country</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: C.card, borderColor: C.border }]}>
        <Text style={{ fontSize: 16 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: C.cream }]}
          placeholder="Search your country…"
          placeholderTextColor={C.c35}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ fontSize: 16, color: C.c35 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Country list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.name}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 10 }}
        columnWrapperStyle={{ gap: 10 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selected?.name === item.name;
          return (
            <TouchableOpacity
              style={[
                styles.countryCard,
                { backgroundColor: C.card, borderColor: C.border },
                isSelected && { backgroundColor: C.vividD, borderColor: C.vivid },
              ]}
              onPress={() => setSelected(item)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 28 }}>{item.flag}</Text>
              <Text style={[styles.countryName, { color: isSelected ? C.vivid : C.cream }]} numberOfLines={1}>
                {item.name}
              </Text>
              {isSelected && (
                <View style={[styles.checkMark, { backgroundColor: C.vivid }]}>
                  <Text style={{ fontSize: 10, color: 'white', fontWeight: '800' }}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Next */}
      <View style={[styles.footer, { borderTopColor: C.border, backgroundColor: C.bg }]}>
        {selected && (
          <View style={[styles.selectedBanner, { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]}>
            <Text style={{ fontSize: 20 }}>{selected.flag}</Text>
            <Text style={[styles.selectedTxt, { color: C.cream }]}>{selected.name} selected</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={selected ? 0.88 : 1}
          style={[styles.nextBtn, !selected && { opacity: 0.4 }]}
        >
          <LinearGradient colors={[C.vivid, '#B82838']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextGrad}>
            <Text style={styles.nextTxt}>Continue</Text>
            <Text style={{ fontSize: 16, color: 'white' }}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  back: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 24, lineHeight: 28 },
  progress: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 28, height: 4, borderRadius: 2 },
  titleWrap: { paddingHorizontal: 24, paddingBottom: 16 },
  step: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -1, lineHeight: 36, marginBottom: 6 },
  sub: { fontSize: 14, lineHeight: 20 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 14, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 15 },
  countryCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, position: 'relative' },
  countryName: { fontSize: 13, fontWeight: '600', flex: 1 },
  checkMark: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, borderTopWidth: 1, gap: 10 },
  selectedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  selectedTxt: { fontSize: 14, fontWeight: '600' },
  nextBtn: { borderRadius: 18, overflow: 'hidden' },
  nextGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  nextTxt: { fontSize: 16, fontWeight: '800', color: 'white' },
});
