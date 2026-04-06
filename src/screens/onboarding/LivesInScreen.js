import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

const CITIES = [
  { flag: '🗽', name: 'New York, USA',        country: 'United States' },
  { flag: '🌴', name: 'Los Angeles, USA',     country: 'United States' },
  { flag: '🍕', name: 'Chicago, USA',         country: 'United States' },
  { flag: '🤠', name: 'Houston, USA',         country: 'United States' },
  { flag: '🎸', name: 'Austin, USA',          country: 'United States' },
  { flag: '☀️', name: 'Miami, USA',           country: 'United States' },
  { flag: '🌉', name: 'San Francisco, USA',   country: 'United States' },
  { flag: '🏔️', name: 'Seattle, USA',         country: 'United States' },
  { flag: '🍁', name: 'Toronto, Canada',      country: 'Canada' },
  { flag: '❄️', name: 'Vancouver, Canada',    country: 'Canada' },
  { flag: '🇬🇧', name: 'London, UK',           country: 'United Kingdom' },
  { flag: '🗼', name: 'Paris, France',         country: 'France' },
  { flag: '🍺', name: 'Berlin, Germany',      country: 'Germany' },
  { flag: '🌷', name: 'Amsterdam, Netherlands',country: 'Netherlands' },
  { flag: '🕌', name: 'Dubai, UAE',           country: 'UAE' },
  { flag: '🦁', name: 'Singapore',            country: 'Singapore' },
  { flag: '🏯', name: 'Tokyo, Japan',         country: 'Japan' },
  { flag: '🦘', name: 'Sydney, Australia',    country: 'Australia' },
  { flag: '🇸🇪', name: 'Stockholm, Sweden',    country: 'Sweden' },
  { flag: '🇳🇴', name: 'Oslo, Norway',          country: 'Norway' },
  { flag: '🌐', name: 'Other city',           country: '' },
];

export default function LivesInScreen({ navigation, route }) {
  const { colors: C } = useTheme();
  const userData = route.params || {};
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);
  const [custom,   setCustom]   = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const filtered = CITIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.country.toLowerCase().includes(search.toLowerCase())
  );

  const handleNext = () => {
    const city = showCustom ? { flag: '📍', name: custom } : selected;
    if (city?.name) navigation.navigate('Interests', { ...userData, livesIn: city });
  };

  const canContinue = showCustom ? custom.trim().length > 2 : !!selected;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.back, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backTxt, { color: C.cream }]}>‹</Text>
        </TouchableOpacity>
        <View style={styles.progress}>
          {[1,2,3,4].map(i => (
            <View key={i} style={[styles.progressDot, { backgroundColor: i <= 3 ? C.vivid : C.border }]} />
          ))}
        </View>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.titleWrap}>
        <Text style={[styles.step, { color: C.vivid }]}>Step 3 of 4</Text>
        <Text style={[styles.title, { color: C.cream }]}>Where do{'\n'}you live now? 📍</Text>
        <Text style={[styles.sub, { color: C.c35 }]}>Select your city from the list or type it manually</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: C.card, borderColor: C.border }]}>
        <Text style={{ fontSize: 16 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: C.cream }]}
          placeholder="Search city or country…"
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

      {/* Custom city input */}
      {showCustom ? (
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <View style={[styles.searchWrap, { backgroundColor: C.card, borderColor: C.vivid + '66', marginHorizontal: 0 }]}>
            <Text style={{ fontSize: 16 }}>📍</Text>
            <TextInput
              style={[styles.searchInput, { color: C.cream }]}
              placeholder="Type your city name…"
              placeholderTextColor={C.c35}
              value={custom}
              onChangeText={setCustom}
              autoFocus
            />
          </View>
          <TouchableOpacity onPress={() => { setShowCustom(false); setCustom(''); }}>
            <Text style={[styles.cancelCustom, { color: C.c35 }]}>← Back to list</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={item => item.name}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 8 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isOther    = item.name === 'Other city';
          const isSelected = selected?.name === item.name;
          return (
            <TouchableOpacity
              style={[
                styles.cityRow,
                { backgroundColor: C.card, borderColor: C.border },
                isSelected && { backgroundColor: C.vividD, borderColor: C.vivid },
              ]}
              onPress={() => {
                if (isOther) { setShowCustom(true); setSelected(null); }
                else { setSelected(item); setShowCustom(false); }
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 24 }}>{item.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cityName, { color: isSelected ? C.vivid : C.cream }]}>{item.name}</Text>
                {item.country ? <Text style={[styles.cityCountry, { color: C.c35 }]}>{item.country}</Text> : null}
              </View>
              {isSelected && (
                <View style={[styles.checkMark, { backgroundColor: C.vivid }]}>
                  <Text style={{ fontSize: 10, color: 'white', fontWeight: '800' }}>✓</Text>
                </View>
              )}
              {isOther && !isSelected && (
                <Text style={[styles.cityCountry, { color: C.vivid }]}>Type manually →</Text>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Next */}
      <View style={[styles.footer, { borderTopColor: C.border, backgroundColor: C.bg }]}>
        {(selected || (showCustom && custom.trim())) && (
          <View style={[styles.selectedBanner, { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]}>
            <Text style={{ fontSize: 20 }}>{showCustom ? '📍' : selected?.flag}</Text>
            <Text style={[styles.selectedTxt, { color: C.cream }]}>
              {showCustom ? custom : selected?.name}
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={canContinue ? 0.88 : 1}
          style={[styles.nextBtn, !canContinue && { opacity: 0.4 }]}
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
  cancelCustom: { fontSize: 13, marginTop: 8, fontWeight: '500' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  cityName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  cityCountry: { fontSize: 11, fontWeight: '500' },
  checkMark: { width: 20, height: 20, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, borderTopWidth: 1, gap: 10 },
  selectedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  selectedTxt: { fontSize: 14, fontWeight: '600' },
  nextBtn: { borderRadius: 18, overflow: 'hidden' },
  nextGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  nextTxt: { fontSize: 16, fontWeight: '800', color: 'white' },
});
