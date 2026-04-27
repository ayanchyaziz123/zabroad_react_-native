import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useAuthStore } from '../../store/authStore';

export default function AllDoneScreen({ navigation, route }) {
  const { colors: C } = useTheme();
  const { updateUser } = useUser();
  const register = useAuthStore(s => s.register);
  const userData = route.params || {};
  const [registering, setRegistering] = useState(false);
  const [regError,    setRegError]    = useState(null);
  const [detectedCity, setDetectedCity] = useState(null);  // e.g. "Queens, NY"
  const scaleAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const fromCountry = userData.fromCountry;
  const name        = userData.name?.split(' ')[0] || 'Friend';

  // ── Detect location on mount ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return; // silently skip — fallback used at register

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [place] = await Location.reverseGeocodeAsync({
          latitude:  loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (place) {
          // Build "City, State" or "City, Country" depending on what's available
          const city  = place.city || place.subregion || place.district || '';
          const region = place.region || place.country || '';
          setDetectedCity(city ? `${city}, ${region}` : region);
        }
      } catch {
        // Location unavailable — fallback handled at register time
      }
    })();
  }, []);

  // ── Entrance animation ─────────────────────────────────────────────────────
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.spring(bounceAnim, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleEnter = async () => {
    setRegError(null);
    setRegistering(true);
    try {
      const nameParts   = (userData.name || 'User').trim().split(' ');
      const firstName   = nameParts[0];
      const lastName    = nameParts.slice(1).join(' ') || '';
      const fromCountry = userData.fromCountry || { flag: '🌍', name: 'Other' };
      const livesIn     = detectedCity || 'Unknown';
      const handle      = '@' + (userData.email?.split('@')[0] || firstName.toLowerCase()).replace(/\s+/g, '_');

      await register({
        firstName,
        lastName,
        email:       userData.email,
        password:    userData.password,
        handle,
        homeCountry: fromCountry.name,
        countryFlag: fromCountry.flag,
        livesIn,
        visaStatus:  userData.visaStatus || 'OPT',
      });

      updateUser({
        homeCountry: fromCountry,
        livesIn,
        name: userData.name || 'User',
      });
      navigation.replace('AppMain');
    } catch (e) {
      setRegError(e.message);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient colors={['#1A0A0E', '#0D0F1A', C.bg]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <View style={[styles.orb, { backgroundColor: C.vivid }]} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View style={[styles.center, { opacity: fadeAnim }]}>

          {/* Success Icon */}
          <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient colors={[C.vivid, '#8B1525']} style={styles.iconCircle}>
              <Text style={{ fontSize: 44 }}>🎉</Text>
            </LinearGradient>
            {['🔴','🟡','🟢','🔵','🟣'].map((dot, i) => (
              <Animated.View
                key={i}
                style={[styles.confetti, {
                  top:  10 + Math.sin(i * 72 * Math.PI / 180) * 65,
                  left: 50 + Math.cos(i * 72 * Math.PI / 180) * 65,
                  transform: [{ scale: bounceAnim }],
                }]}
              >
                <Text style={{ fontSize: 14 }}>{dot}</Text>
              </Animated.View>
            ))}
          </Animated.View>

          <Text style={[styles.title, { color: C.cream }]}>Welcome, {name}! 👋</Text>
          <Text style={[styles.sub, { color: C.c35 }]}>Your Zabroad profile is ready</Text>

          {/* Profile Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: C.card, borderColor: C.border }]}>
            {fromCountry && (
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIcon, { backgroundColor: C.vividD }]}>
                  <Text style={{ fontSize: 18 }}>{fromCountry.flag}</Text>
                </View>
                <View>
                  <Text style={[styles.summaryLabel, { color: C.c35 }]}>From</Text>
                  <Text style={[styles.summaryValue, { color: C.cream }]}>{fromCountry.name}</Text>
                </View>
              </View>
            )}

            {/* Auto-detected location row */}
            <View style={[styles.summaryRow, fromCountry && { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12, marginTop: 4 }]}>
              <View style={[styles.summaryIcon, { backgroundColor: C.blueD }]}>
                <Text style={{ fontSize: 18 }}>📍</Text>
              </View>
              <View>
                <Text style={[styles.summaryLabel, { color: C.c35 }]}>Lives in</Text>
                <Text style={[styles.summaryValue, { color: C.cream }]}>
                  {detectedCity || 'Detecting…'}
                </Text>
              </View>
            </View>

            {userData.interests?.length > 0 && (
              <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12, marginTop: 4 }]}>
                <View style={[styles.summaryIcon, { backgroundColor: C.greenD }]}>
                  <Text style={{ fontSize: 18 }}>✨</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.summaryLabel, { color: C.c35 }]}>Interests</Text>
                  <Text style={[styles.summaryValue, { color: C.cream }]}>
                    {userData.interests.length} topic{userData.interests.length > 1 ? 's' : ''} selected
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* What's next */}
          <View style={[styles.nextCard, { backgroundColor: C.vividD, borderColor: C.vivid + '33' }]}>
            <Text style={[styles.nextTitle, { color: C.cream }]}>What's waiting for you:</Text>
            {[
              `Community groups from ${fromCountry?.name || 'your country'}`,
              `Local services near ${detectedCity?.split(',')[0] || 'your city'}`,
              'Personalised visa & job updates',
              'AI assistant ready to answer questions',
            ].map((item, i) => (
              <View key={i} style={styles.nextRow}>
                <Text style={{ color: C.vivid, fontSize: 12, fontWeight: '700' }}>✓</Text>
                <Text style={[styles.nextItem, { color: C.c60 }]}>{item}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Enter App Button */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          {regError && (
            <Text style={{ color: '#E8364A', textAlign: 'center', marginBottom: 8, fontSize: 13 }}>
              {regError}
            </Text>
          )}
          <TouchableOpacity
            onPress={handleEnter}
            disabled={registering}
            activeOpacity={0.88}
            style={styles.enterBtn}
          >
            <LinearGradient colors={[C.vivid, '#B82838']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.enterGrad, registering && { opacity: 0.7 }]}>
              <Text style={styles.enterTxt}>{registering ? 'Creating account…' : 'Enter Zabroad'}</Text>
              {!registering && <Text style={{ fontSize: 18, color: 'white' }}>🚀</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, justifyContent: 'space-between' },
  orb:         { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -60, right: -80, opacity: 0.1 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  iconWrap:    { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative' },
  iconCircle:  { width: 110, height: 110, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowColor: '#E8364A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  confetti:    { position: 'absolute' },
  title:       { fontSize: 30, fontWeight: '900', letterSpacing: -1, marginBottom: 6, textAlign: 'center' },
  sub:         { fontSize: 15, marginBottom: 24, textAlign: 'center' },
  summaryCard: { alignSelf: 'stretch', borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 14 },
  summaryRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  summaryLabel:{ fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  summaryValue:{ fontSize: 15, fontWeight: '700' },
  nextCard:    { alignSelf: 'stretch', borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  nextTitle:   { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  nextRow:     { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  nextItem:    { fontSize: 13, lineHeight: 18, flex: 1 },
  footer:      { paddingHorizontal: 24, paddingBottom: 8 },
  enterBtn:    { borderRadius: 18, overflow: 'hidden' },
  enterGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  enterTxt:    { fontSize: 17, fontWeight: '800', color: 'white', letterSpacing: -0.3 },
});
