import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, FlatList, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeContext';

// Well-known cities immigrants commonly live in
const CITIES = [
  // USA
  { flag: '🗽', name: 'New York, NY',         country: 'United States', coords: { lat: 40.71, lng: -74.00 } },
  { flag: '🌴', name: 'Los Angeles, CA',      country: 'United States', coords: { lat: 34.05, lng: -118.24 } },
  { flag: '🍕', name: 'Chicago, IL',          country: 'United States', coords: { lat: 41.88, lng: -87.63 } },
  { flag: '🤠', name: 'Houston, TX',          country: 'United States', coords: { lat: 29.76, lng: -95.37 } },
  { flag: '☀️', name: 'Miami, FL',            country: 'United States', coords: { lat: 25.77, lng: -80.19 } },
  { flag: '🎸', name: 'Austin, TX',           country: 'United States', coords: { lat: 30.27, lng: -97.74 } },
  { flag: '🌉', name: 'San Francisco, CA',    country: 'United States', coords: { lat: 37.77, lng: -122.42 } },
  { flag: '🏔️', name: 'Seattle, WA',          country: 'United States', coords: { lat: 47.61, lng: -122.33 } },
  { flag: '🏛️', name: 'Washington, DC',       country: 'United States', coords: { lat: 38.91, lng: -77.04 } },
  { flag: '🔔', name: 'Philadelphia, PA',     country: 'United States', coords: { lat: 39.95, lng: -75.16 } },
  { flag: '🌇', name: 'Dallas, TX',           country: 'United States', coords: { lat: 32.78, lng: -96.80 } },
  { flag: '🌞', name: 'Phoenix, AZ',          country: 'United States', coords: { lat: 33.45, lng: -112.07 } },
  { flag: '🌃', name: 'Atlanta, GA',          country: 'United States', coords: { lat: 33.75, lng: -84.39 } },
  { flag: '🎓', name: 'Boston, MA',           country: 'United States', coords: { lat: 42.36, lng: -71.06 } },
  { flag: '🎰', name: 'Las Vegas, NV',        country: 'United States', coords: { lat: 36.17, lng: -115.14 } },
  { flag: '🌺', name: 'Honolulu, HI',         country: 'United States', coords: { lat: 21.31, lng: -157.86 } },
  { flag: '🏙️', name: 'Jersey City, NJ',      country: 'United States', coords: { lat: 40.72, lng: -74.04 } },
  { flag: '🌆', name: 'Queens, NY',           country: 'United States', coords: { lat: 40.73, lng: -73.79 } },
  // Canada
  { flag: '🍁', name: 'Toronto, ON',          country: 'Canada',         coords: { lat: 43.65, lng: -79.38 } },
  { flag: '❄️', name: 'Vancouver, BC',         country: 'Canada',         coords: { lat: 49.28, lng: -123.12 } },
  { flag: '🥞', name: 'Montreal, QC',         country: 'Canada',         coords: { lat: 45.50, lng: -73.57 } },
  { flag: '🏔️', name: 'Calgary, AB',          country: 'Canada',         coords: { lat: 51.05, lng: -114.07 } },
  // UK
  { flag: '🇬🇧', name: 'London',               country: 'United Kingdom', coords: { lat: 51.51, lng: -0.13 } },
  { flag: '🎵', name: 'Manchester',            country: 'United Kingdom', coords: { lat: 53.48, lng: -2.24 } },
  // Europe
  { flag: '🗼', name: 'Paris',                country: 'France',         coords: { lat: 48.86, lng: 2.35 } },
  { flag: '🍺', name: 'Berlin',               country: 'Germany',        coords: { lat: 52.52, lng: 13.40 } },
  { flag: '🌷', name: 'Amsterdam',            country: 'Netherlands',    coords: { lat: 52.37, lng: 4.90 } },
  { flag: '🇸🇪', name: 'Stockholm',            country: 'Sweden',         coords: { lat: 59.33, lng: 18.07 } },
  // Middle East & Asia
  { flag: '🕌', name: 'Dubai',                country: 'UAE',            coords: { lat: 25.20, lng: 55.27 } },
  { flag: '🦁', name: 'Singapore',            country: 'Singapore',      coords: { lat: 1.35, lng: 103.82 } },
  { flag: '🏯', name: 'Tokyo',                country: 'Japan',          coords: { lat: 35.68, lng: 139.69 } },
  // Australia
  { flag: '🦘', name: 'Sydney',               country: 'Australia',      coords: { lat: -33.87, lng: 151.21 } },
  { flag: '🏄', name: 'Melbourne',            country: 'Australia',      coords: { lat: -37.81, lng: 144.96 } },
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

// Find the closest city from our list to a given GPS coordinate
function closestCity(lat, lng) {
  let best = null;
  let bestDist = Infinity;
  for (const city of CITIES) {
    const d = haversineKm(lat, lng, city.coords.lat, city.coords.lng);
    if (d < bestDist) { bestDist = d; best = city; }
  }
  // Only claim a match if within 80 km — otherwise fall back to free text
  return bestDist <= 80 ? best : null;
}

export default function LivesInScreen({ navigation, route }) {
  const { colors: C } = useTheme();
  const userData = route.params || {};

  const [search,      setSearch]      = useState('');
  const [selected,    setSelected]    = useState(null);
  const [customCity,  setCustomCity]  = useState('');
  const [showCustom,  setShowCustom]  = useState(false);

  // GPS detection state
  const [gpsStatus,   setGpsStatus]   = useState('idle'); // idle | detecting | found | denied | failed
  const [detectedGPS, setDetectedGPS] = useState(null);   // { label, isExact } — the GPS-resolved city string
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation while detecting
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

  // ── Auto-detect GPS on mount ────────────────────────────────────────────────
  useEffect(() => {
    detectLocation();
  }, []);

  async function detectLocation() {
    setGpsStatus('detecting');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsStatus('denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });
      const { latitude, longitude } = loc.coords;

      // Try to match a known city by proximity first
      const nearby = closestCity(latitude, longitude);
      if (nearby) {
        setSelected(nearby);
        setDetectedGPS({ label: nearby.name, isExact: true });
        setGpsStatus('found');
        return;
      }

      // Fall back to reverse-geocode for an exact address name
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
    const city = showCustom
      ? { flag: '📍', name: customCity.trim() }
      : selected;
    navigation.navigate('Interests', { ...userData, livesIn: city });
  }

  // ── GPS status banner ───────────────────────────────────────────────────────
  function GpsBanner() {
    if (gpsStatus === 'idle') return null;

    if (gpsStatus === 'detecting') {
      return (
        <Animated.View style={[styles.gpsBanner, { backgroundColor: C.vividD, borderColor: C.vivid + '44', transform: [{ scale: pulseAnim }] }]}>
          <ActivityIndicator size="small" color={C.vivid} />
          <Text style={[styles.gpsBannerTxt, { color: C.vivid }]}>Detecting your location…</Text>
        </Animated.View>
      );
    }

    if (gpsStatus === 'found' && detectedGPS) {
      return (
        <View style={[styles.gpsBanner, { backgroundColor: C.vividD, borderColor: C.vivid + '55' }]}>
          <Ionicons name="location" size={15} color={C.vivid} />
          <Text style={[styles.gpsBannerTxt, { color: C.vivid }]}>
            Detected: <Text style={{ fontWeight: '800' }}>{detectedGPS.label}</Text>
            {detectedGPS.isExact ? ' — pre-selected' : ' — edit below'}
          </Text>
          <TouchableOpacity onPress={detectLocation} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="refresh" size={14} color={C.vivid} />
          </TouchableOpacity>
        </View>
      );
    }

    if (gpsStatus === 'denied') {
      return (
        <View style={[styles.gpsBanner, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="location-outline" size={15} color={C.c35} />
          <Text style={[styles.gpsBannerTxt, { color: C.c35 }]}>Location permission denied — select manually</Text>
        </View>
      );
    }

    if (gpsStatus === 'failed') {
      return (
        <View style={[styles.gpsBanner, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="wifi-outline" size={15} color={C.c35} />
          <Text style={[styles.gpsBannerTxt, { color: C.c35, flex: 1 }]}>Could not detect location</Text>
          <TouchableOpacity onPress={detectLocation}>
            <Text style={[styles.retryLink, { color: C.vivid }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.back, { backgroundColor: C.card, borderColor: C.border }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color={C.cream} />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={[styles.progressDot, { backgroundColor: i <= 2 ? C.vivid : C.border }]} />
          ))}
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Title */}
      <View style={styles.titleWrap}>
        <Text style={[styles.step, { color: C.vivid }]}>Step 3 of 4</Text>
        <Text style={[styles.title, { color: C.cream }]}>Where do{'\n'}you live? 📍</Text>
        <Text style={[styles.sub, { color: C.c35 }]}>
          We use your location to show local housing, jobs, and community near you
        </Text>
      </View>

      {/* GPS banner */}
      <View style={styles.bannerWrap}>
        <GpsBanner />
      </View>

      {/* Search */}
      <View style={[styles.searchBox, { backgroundColor: C.card, borderColor: C.border }]}>
        <Ionicons name="search-outline" size={16} color={C.c35} />
        <TextInput
          style={[styles.searchInput, { color: C.cream }]}
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

      {/* Custom city input */}
      {showCustom && (
        <View style={styles.customWrap}>
          <View style={[styles.searchBox, { backgroundColor: C.card, borderColor: C.vivid + '88', marginHorizontal: 0 }]}>
            <Ionicons name="location" size={16} color={C.vivid} />
            <TextInput
              style={[styles.searchInput, { color: C.cream }]}
              placeholder="Type your city, State / Country…"
              placeholderTextColor={C.c35}
              value={customCity}
              onChangeText={setCustomCity}
              autoFocus={!detectedGPS?.isExact}
            />
          </View>
          <TouchableOpacity onPress={() => { setShowCustom(false); setCustomCity(''); setSelected(null); }}>
            <Text style={[styles.backToList, { color: C.c35 }]}>← Back to list</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* City list */}
      {!showCustom && (
        <FlatList
          data={filtered}
          keyExtractor={item => item.name}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isOther    = item.name === '✏️ Enter manually';
            const isSelected = selected?.name === item.name;
            const isDetected = detectedGPS?.isExact && detectedGPS.label === item.name;

            return (
              <TouchableOpacity
                style={[
                  styles.cityRow,
                  { backgroundColor: C.card, borderColor: C.border },
                  isSelected && { backgroundColor: C.vividD, borderColor: C.vivid },
                ]}
                onPress={() => {
                  setSelected(item);
                  setShowCustom(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cityFlag}>{item.flag}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.cityName, { color: isSelected ? C.vivid : C.cream }]}>
                      {item.name}
                    </Text>
                    {isDetected && (
                      <View style={[styles.gpsTag, { backgroundColor: C.vivid }]}>
                        <Text style={styles.gpsTagTxt}>GPS</Text>
                      </View>
                    )}
                  </View>
                  {item.country ? (
                    <Text style={[styles.cityCountry, { color: C.c35 }]}>{item.country}</Text>
                  ) : null}
                </View>
                {isSelected
                  ? <View style={[styles.check, { backgroundColor: C.vivid }]}>
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  : null
                }
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <TouchableOpacity
              style={[styles.manualRow, { backgroundColor: C.card, borderColor: C.border }]}
              onPress={() => { setShowCustom(true); setSelected(null); }}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil-outline" size={18} color={C.c35} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.cityName, { color: C.cream }]}>Enter manually</Text>
                <Text style={[styles.cityCountry, { color: C.c35 }]}>Type any city not in this list</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.c35} />
            </TouchableOpacity>
          }
        />
      )}

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: C.border, backgroundColor: C.bg }]}>
        {canContinue && (
          <View style={[styles.selectedBanner, { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]}>
            <Text style={{ fontSize: 18 }}>
              {showCustom ? '📍' : (selected?.flag || '📍')}
            </Text>
            <Text style={[styles.selectedTxt, { color: C.cream }]}>
              {showCustom ? customCity.trim() : selected?.name}
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
            <Ionicons name="arrow-forward" size={18} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  back:         { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  progressBar:  { flexDirection: 'row', gap: 6 },
  progressDot:  { width: 28, height: 4, borderRadius: 2 },

  titleWrap:  { paddingHorizontal: 24, paddingBottom: 12 },
  step:       { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  title:      { fontSize: 30, fontWeight: '900', letterSpacing: -1, lineHeight: 36, marginBottom: 6 },
  sub:        { fontSize: 13, lineHeight: 19 },

  bannerWrap: { paddingHorizontal: 20, marginBottom: 8 },
  gpsBanner:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  gpsBannerTxt:{ fontSize: 13, fontWeight: '600', flex: 1 },
  retryLink:  { fontSize: 13, fontWeight: '700' },

  searchBox:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 10, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput:{ flex: 1, fontSize: 15 },

  customWrap: { paddingHorizontal: 20, marginBottom: 10, gap: 8 },
  backToList: { fontSize: 13, fontWeight: '500' },

  listContent:{ paddingHorizontal: 20, paddingBottom: 160, gap: 8 },
  cityRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  cityFlag:   { fontSize: 24 },
  cityName:   { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  cityCountry:{ fontSize: 11, fontWeight: '500' },
  gpsTag:     { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  gpsTagTxt:  { fontSize: 9, fontWeight: '800', color: 'white', letterSpacing: 0.5 },
  check:      { width: 22, height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  manualRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, marginTop: 4 },

  footer:         { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, borderTopWidth: 1, gap: 10 },
  selectedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  selectedTxt:    { fontSize: 14, fontWeight: '600', flex: 1 },
  nextBtn:        { borderRadius: 18, overflow: 'hidden' },
  nextGrad:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  nextTxt:        { fontSize: 16, fontWeight: '800', color: 'white' },
});
