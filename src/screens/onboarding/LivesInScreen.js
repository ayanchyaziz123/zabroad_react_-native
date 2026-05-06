import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, FlatList, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeContext';

const NAVY = '#1B3266';

const CITIES = [
  { flag: '🗽', name: 'New York, NY',      country: 'United States', coords: { lat: 40.71, lng: -74.00 } },
  { flag: '🌴', name: 'Los Angeles, CA',   country: 'United States', coords: { lat: 34.05, lng: -118.24 } },
  { flag: '🍕', name: 'Chicago, IL',       country: 'United States', coords: { lat: 41.88, lng: -87.63 } },
  { flag: '🤠', name: 'Houston, TX',       country: 'United States', coords: { lat: 29.76, lng: -95.37 } },
  { flag: '☀️', name: 'Miami, FL',         country: 'United States', coords: { lat: 25.77, lng: -80.19 } },
  { flag: '🎸', name: 'Austin, TX',        country: 'United States', coords: { lat: 30.27, lng: -97.74 } },
  { flag: '🌉', name: 'San Francisco, CA', country: 'United States', coords: { lat: 37.77, lng: -122.42 } },
  { flag: '🏔️', name: 'Seattle, WA',       country: 'United States', coords: { lat: 47.61, lng: -122.33 } },
  { flag: '🏛️', name: 'Washington, DC',    country: 'United States', coords: { lat: 38.91, lng: -77.04 } },
  { flag: '🔔', name: 'Philadelphia, PA',  country: 'United States', coords: { lat: 39.95, lng: -75.16 } },
  { flag: '🌇', name: 'Dallas, TX',        country: 'United States', coords: { lat: 32.78, lng: -96.80 } },
  { flag: '🌞', name: 'Phoenix, AZ',       country: 'United States', coords: { lat: 33.45, lng: -112.07 } },
  { flag: '🌃', name: 'Atlanta, GA',       country: 'United States', coords: { lat: 33.75, lng: -84.39 } },
  { flag: '🎓', name: 'Boston, MA',        country: 'United States', coords: { lat: 42.36, lng: -71.06 } },
  { flag: '🎰', name: 'Las Vegas, NV',     country: 'United States', coords: { lat: 36.17, lng: -115.14 } },
  { flag: '🌺', name: 'Honolulu, HI',      country: 'United States', coords: { lat: 21.31, lng: -157.86 } },
  { flag: '🏙️', name: 'Jersey City, NJ',   country: 'United States', coords: { lat: 40.72, lng: -74.04 } },
  { flag: '🌆', name: 'Queens, NY',        country: 'United States', coords: { lat: 40.73, lng: -73.79 } },
  { flag: '🍁', name: 'Toronto, ON',       country: 'Canada',         coords: { lat: 43.65, lng: -79.38 } },
  { flag: '❄️', name: 'Vancouver, BC',      country: 'Canada',         coords: { lat: 49.28, lng: -123.12 } },
  { flag: '🥞', name: 'Montreal, QC',      country: 'Canada',         coords: { lat: 45.50, lng: -73.57 } },
  { flag: '🏔️', name: 'Calgary, AB',       country: 'Canada',         coords: { lat: 51.05, lng: -114.07 } },
  { flag: '🇬🇧', name: 'London',            country: 'United Kingdom', coords: { lat: 51.51, lng: -0.13 } },
  { flag: '🎵', name: 'Manchester',         country: 'United Kingdom', coords: { lat: 53.48, lng: -2.24 } },
  { flag: '🗼', name: 'Paris',             country: 'France',         coords: { lat: 48.86, lng: 2.35 } },
  { flag: '🍺', name: 'Berlin',            country: 'Germany',        coords: { lat: 52.52, lng: 13.40 } },
  { flag: '🌷', name: 'Amsterdam',         country: 'Netherlands',    coords: { lat: 52.37, lng: 4.90 } },
  { flag: '🇸🇪', name: 'Stockholm',         country: 'Sweden',         coords: { lat: 59.33, lng: 18.07 } },
  { flag: '🕌', name: 'Dubai',             country: 'UAE',            coords: { lat: 25.20, lng: 55.27 } },
  { flag: '🦁', name: 'Singapore',         country: 'Singapore',      coords: { lat: 1.35, lng: 103.82 } },
  { flag: '🏯', name: 'Tokyo',             country: 'Japan',          coords: { lat: 35.68, lng: 139.69 } },
  { flag: '🦘', name: 'Sydney',            country: 'Australia',      coords: { lat: -33.87, lng: 151.21 } },
  { flag: '🏄', name: 'Melbourne',         country: 'Australia',      coords: { lat: -37.81, lng: 144.96 } },
];

const EARTH_RADIUS_KM = 6371;

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function closestCity(lat, lng) {
  let best = null;
  let bestDist = Infinity;
  for (const city of CITIES) {
    const d = haversineKm(lat, lng, city.coords.lat, city.coords.lng);
    if (d < bestDist) { bestDist = d; best = city; }
  }
  return bestDist <= 80 ? best : null;
}

export default function LivesInScreen({ navigation, route }) {
  const { colors: C } = useTheme();
  const userData = route.params || {};

  const [search,     setSearch]     = useState('');
  const [selected,   setSelected]   = useState(null);
  const [customCity, setCustomCity] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [gpsStatus,  setGpsStatus]  = useState('idle');
  const [detectedGPS, setDetectedGPS] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (gpsStatus !== 'detecting') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [gpsStatus]);

  useEffect(() => { detectLocation(); }, []);

  async function detectLocation() {
    setGpsStatus('detecting');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setGpsStatus('denied'); return; }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 5000 });
      const { latitude, longitude } = loc.coords;

      const nearby = closestCity(latitude, longitude);
      if (nearby) {
        setSelected(nearby);
        setDetectedGPS({ label: nearby.name, isExact: true });
        setGpsStatus('found');
        return;
      }

      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (place) {
        const city   = place.city || place.subregion || place.district || '';
        const region = place.region || place.isoCountryCode || '';
        const label  = city ? `${city}, ${region}` : region;
        setDetectedGPS({ label, isExact: false });
        setCustomCity(label);
        setShowCustom(true);
        setGpsStatus('found');
      } else {
        setGpsStatus('failed');
      }
    } catch {
      setGpsStatus('failed');
    }
  }

  const filtered = CITIES.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q);
  });

  const canContinue = showCustom ? customCity.trim().length > 1 : !!selected;

  function handleNext() {
    if (!canContinue) return;
    const city = showCustom ? { flag: '📍', name: customCity.trim() } : selected;
    navigation.navigate('Interests', { ...userData, livesIn: city });
  }

  function GpsBanner() {
    if (gpsStatus === 'idle') return null;

    if (gpsStatus === 'detecting') {
      return (
        <Animated.View style={[s.gpsBanner, { backgroundColor: C.card, borderColor: C.border, transform: [{ scale: pulseAnim }] }]}>
          <ActivityIndicator size="small" color="#3B8BF7" />
          <Text style={[s.gpsBannerTxt, { color: C.cream }]}>Detecting your location…</Text>
        </Animated.View>
      );
    }

    if (gpsStatus === 'found' && detectedGPS) {
      return (
        <View style={[s.gpsBanner, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="location" size={15} color="#3B8BF7" />
          <Text style={[s.gpsBannerTxt, { color: C.cream }]}>
            Detected: <Text style={{ fontWeight: '800', color: '#3B8BF7' }}>{detectedGPS.label}</Text>
            {detectedGPS.isExact ? ' — pre-selected' : ' — edit below'}
          </Text>
          <TouchableOpacity onPress={detectLocation} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="refresh" size={14} color="#3B8BF7" />
          </TouchableOpacity>
        </View>
      );
    }

    if (gpsStatus === 'denied') {
      return (
        <View style={[s.gpsBanner, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="location-outline" size={15} color={C.c35} />
          <Text style={[s.gpsBannerTxt, { color: C.c35 }]}>Location permission denied — select manually</Text>
        </View>
      );
    }

    if (gpsStatus === 'failed') {
      return (
        <View style={[s.gpsBanner, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="wifi-outline" size={15} color={C.c35} />
          <Text style={[s.gpsBannerTxt, { color: C.c35, flex: 1 }]}>Could not detect location</Text>
          <TouchableOpacity onPress={detectLocation}>
            <Text style={[s.retryLink]}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  }

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
              <View key={i} style={[s.progressDot, { backgroundColor: i <= 3 ? '#F4A227' : 'rgba(255,255,255,0.25)' }]} />
            ))}
          </View>
          <View style={{ width: 34 }} />
        </View>
        <Text style={s.headerLogo}>Zabroad ✈</Text>
        <Text style={s.headerTitle}>Where do{'\n'}you live? 📍</Text>
        <Text style={s.headerSub}>We use your location to show local housing, jobs, and community near you</Text>
      </View>

      {/* ── GPS banner ──────────────────────────────────────── */}
      <View style={[s.bannerWrap, { backgroundColor: C.bg }]}>
        <GpsBanner />
      </View>

      {/* ── Search ──────────────────────────────────────────── */}
      <View style={[s.searchWrap, { backgroundColor: C.bg }]}>
        <View style={[s.searchBox, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="search-outline" size={16} color={C.c35} />
          <TextInput
            style={[s.searchInput, { color: C.cream }]}
            placeholder="Search city or country…"
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

      {/* ── Custom city input ───────────────────────────────── */}
      {showCustom && (
        <View style={[s.customWrap, { backgroundColor: C.bg }]}>
          <View style={[s.searchBox, { backgroundColor: C.card, borderColor: '#3B8BF7' }]}>
            <Ionicons name="location" size={16} color="#3B8BF7" />
            <TextInput
              style={[s.searchInput, { color: C.cream }]}
              placeholder="Type your city, State / Country…"
              placeholderTextColor={C.c35}
              value={customCity}
              onChangeText={setCustomCity}
              autoFocus={!detectedGPS?.isExact}
            />
          </View>
          <TouchableOpacity onPress={() => { setShowCustom(false); setCustomCity(''); setSelected(null); }}>
            <Text style={[s.backToList, { color: C.c35 }]}>← Back to list</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── City list ───────────────────────────────────────── */}
      {!showCustom && (
        <FlatList
          data={filtered}
          keyExtractor={item => item.name}
          style={{ backgroundColor: C.bg }}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSelected = selected?.name === item.name;
            const isDetected = detectedGPS?.isExact && detectedGPS.label === item.name;
            return (
              <TouchableOpacity
                style={[
                  s.cityRow,
                  { backgroundColor: C.card, borderColor: C.border },
                  isSelected && { backgroundColor: C.vividD, borderColor: '#3B8BF7' },
                ]}
                onPress={() => { setSelected(item); setShowCustom(false); }}
                activeOpacity={0.8}
              >
                <Text style={s.cityFlag}>{item.flag}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[s.cityName, { color: isSelected ? '#3B8BF7' : C.cream }]}>
                      {item.name}
                    </Text>
                    {isDetected && (
                      <View style={s.gpsTag}>
                        <Text style={s.gpsTagTxt}>GPS</Text>
                      </View>
                    )}
                  </View>
                  {item.country ? <Text style={[s.cityCountry, { color: C.c35 }]}>{item.country}</Text> : null}
                </View>
                {isSelected
                  ? <View style={s.check}><Ionicons name="checkmark" size={12} color="white" /></View>
                  : null
                }
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <TouchableOpacity
              style={[s.manualRow, { backgroundColor: C.card, borderColor: C.border }]}
              onPress={() => { setShowCustom(true); setSelected(null); }}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil-outline" size={18} color={C.c35} />
              <View style={{ flex: 1 }}>
                <Text style={[s.cityName, { color: C.cream }]}>Enter manually</Text>
                <Text style={[s.cityCountry, { color: C.c35 }]}>Type any city not in this list</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.c35} />
            </TouchableOpacity>
          }
        />
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <View style={[s.footer, { borderTopColor: C.border, backgroundColor: C.bg }]}>
        {canContinue && (
          <View style={[s.selectedBanner, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={{ fontSize: 18 }}>{showCustom ? '📍' : (selected?.flag || '📍')}</Text>
            <Text style={[s.selectedTxt, { color: C.cream }]}>
              {showCustom ? customCity.trim() : selected?.name}
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={canContinue ? 0.88 : 1}
          style={[s.btn, !canContinue && { opacity: 0.4 }]}
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

  // ── GPS banner ────────────────────────────────────────────────────────────
  bannerWrap:   { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
  gpsBanner:    { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  gpsBannerTxt: { fontSize: 13, fontWeight: '600', flex: 1 },
  retryLink:    { fontSize: 13, fontWeight: '700', color: '#3B8BF7' },

  // ── Search ────────────────────────────────────────────────────────────────
  searchWrap:  { paddingHorizontal: 20, paddingBottom: 10 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 15 },

  customWrap:  { paddingHorizontal: 20, paddingBottom: 10, gap: 8 },
  backToList:  { fontSize: 13, fontWeight: '500' },

  // ── City list ─────────────────────────────────────────────────────────────
  listContent: { paddingHorizontal: 20, paddingBottom: 160, gap: 8 },
  cityRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  cityFlag:    { fontSize: 24 },
  cityName:    { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  cityCountry: { fontSize: 11, fontWeight: '500' },
  gpsTag:      { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#3B8BF7' },
  gpsTagTxt:   { fontSize: 9, fontWeight: '800', color: 'white', letterSpacing: 0.5 },
  check:       { width: 22, height: 22, borderRadius: 8, backgroundColor: '#3B8BF7', alignItems: 'center', justifyContent: 'center' },
  manualRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginTop: 4 },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer:         { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, borderTopWidth: 1, gap: 10 },
  selectedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  selectedTxt:    { fontSize: 14, fontWeight: '600', flex: 1 },
  btn:            { backgroundColor: NAVY, borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  btnTxt:         { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
});
