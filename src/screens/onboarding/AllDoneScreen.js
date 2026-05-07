import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useAuthStore } from '../../store/authStore';

const NAVY = '#1B3266';

export default function AllDoneScreen({ navigation, route }) {
  const { colors: C } = useTheme();
  const { updateUser } = useUser();
  const register = useAuthStore(s => s.register);
  const userData = route.params || {};
  const [registering,  setRegistering]  = useState(false);
  const [regError,     setRegError]     = useState(null);
  const [detectedCity, setDetectedCity] = useState(null);

  const scaleAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const fromCountry = userData.fromCountry;
  const name        = userData.name?.split(' ')[0] || 'Friend';

  useEffect(() => {
    const confirmedCity = userData.livesIn?.name;
    if (confirmedCity) { setDetectedCity(confirmedCity); return; }
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [place] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude, longitude: loc.coords.longitude,
        });
        if (place) {
          const city   = place.city || place.subregion || place.district || '';
          const region = place.region || place.country || '';
          setDetectedCity(city ? `${city}, ${region}` : region);
        }
      } catch { /* remain null */ }
    })();
  }, [userData.livesIn]);

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
      const fc          = userData.fromCountry || { flag: '🌍', name: 'Other' };
      const livesIn     = userData.livesIn?.name || detectedCity || 'Unknown';
      const rawHandle   = (userData.email?.split('@')[0] || firstName.toLowerCase())
        .replace(/[^a-z0-9_]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toLowerCase();
      const handle      = rawHandle || 'user';

      await register({
        firstName, lastName,
        email:       userData.email,
        password:    userData.password,
        handle,
        homeCountry: fc.name,
        countryFlag: fc.flag,
        livesIn,
      });

      updateUser({ homeCountry: fc, livesIn, name: userData.name || 'User' });
      navigation.reset({ index: 0, routes: [{ name: 'AppMain' }] });
    } catch (e) {
      setRegError(e.message);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

      <Animated.View style={[s.center, { opacity: fadeAnim }]}>

        {/* Success Icon */}
        <Animated.View style={[s.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
          <View style={s.iconCircle}>
            <Text style={{ fontSize: 44 }}>🎉</Text>
          </View>
          {['🔴', '🟡', '🟢', '🔵', '🟣'].map((dot, i) => (
            <Animated.View
              key={i}
              style={[s.confetti, {
                top:  10 + Math.sin(i * 72 * Math.PI / 180) * 65,
                left: 50 + Math.cos(i * 72 * Math.PI / 180) * 65,
                transform: [{ scale: bounceAnim }],
              }]}
            >
              <Text style={{ fontSize: 14 }}>{dot}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        <Text style={s.title}>Welcome, {name}! 👋</Text>
        <Text style={s.sub}>Your Zabroad profile is ready</Text>

        {/* Profile summary */}
        <View style={s.summaryCard}>
          {fromCountry && (
            <View style={s.summaryRow}>
              <View style={s.summaryIcon}>
                <Text style={{ fontSize: 18 }}>{fromCountry.flag}</Text>
              </View>
              <View>
                <Text style={s.summaryLabel}>From</Text>
                <Text style={s.summaryValue}>{fromCountry.name}</Text>
              </View>
            </View>
          )}

          <View style={[s.summaryRow, fromCountry && s.summaryRowBorder]}>
            <View style={s.summaryIcon}>
              <Text style={{ fontSize: 18 }}>📍</Text>
            </View>
            <View>
              <Text style={s.summaryLabel}>Lives in</Text>
              <Text style={s.summaryValue}>{detectedCity || 'Detecting…'}</Text>
            </View>
          </View>

          {userData.interests?.length > 0 && (
            <View style={[s.summaryRow, s.summaryRowBorder]}>
              <View style={s.summaryIcon}>
                <Text style={{ fontSize: 18 }}>✨</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.summaryLabel}>Interests</Text>
                <Text style={s.summaryValue}>
                  {userData.interests.length} topic{userData.interests.length > 1 ? 's' : ''} selected
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* What's next */}
        <View style={s.nextCard}>
          <Text style={s.nextTitle}>What's waiting for you:</Text>
          {[
            `Community groups from ${fromCountry?.name || 'your country'}`,
            `Local services near ${(userData.livesIn?.name || detectedCity)?.split(',')[0] || 'your city'}`,
            'Personalised visa & job updates',
            'AI assistant ready to answer questions',
          ].map((item, i) => (
            <View key={i} style={s.nextRow}>
              <Text style={s.nextCheck}>✓</Text>
              <Text style={s.nextItem}>{item}</Text>
            </View>
          ))}
        </View>

      </Animated.View>

      {/* Enter App Button */}
      <Animated.View style={[s.footer, { opacity: fadeAnim }]}>
        {regError && (
          <Text style={s.errorTxt}>{regError}</Text>
        )}
        <TouchableOpacity
          onPress={handleEnter}
          disabled={registering}
          activeOpacity={0.88}
          style={[s.btn, registering && { opacity: 0.7 }]}
        >
          {registering
            ? <ActivityIndicator color={NAVY} />
            : <Text style={s.btnTxt}>Enter Zabroad  🚀</Text>
          }
        </TouchableOpacity>
      </Animated.View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: NAVY, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  iconWrap:   { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 24, position: 'relative' },
  iconCircle: { width: 110, height: 110, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  confetti:   { position: 'absolute' },

  title: { fontSize: 30, fontWeight: '900', letterSpacing: -1, marginBottom: 6, textAlign: 'center', color: '#fff' },
  sub:   { fontSize: 15, marginBottom: 24, textAlign: 'center', color: 'rgba(255,255,255,0.65)' },

  summaryCard:     { alignSelf: 'stretch', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', padding: 16, marginBottom: 14 },
  summaryRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryRowBorder:{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', paddingTop: 12, marginTop: 4 },
  summaryIcon:     { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  summaryLabel:    { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2, color: 'rgba(255,255,255,0.5)' },
  summaryValue:    { fontSize: 15, fontWeight: '700', color: '#fff' },

  nextCard:  { alignSelf: 'stretch', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.06)', padding: 14, gap: 8 },
  nextTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4, color: 'rgba(255,255,255,0.7)' },
  nextRow:   { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  nextCheck: { color: '#F4A227', fontSize: 12, fontWeight: '700' },
  nextItem:  { fontSize: 13, lineHeight: 18, flex: 1, color: 'rgba(255,255,255,0.75)' },

  footer:   { paddingHorizontal: 24, paddingBottom: 12 },
  errorTxt: { color: '#FF6B6B', textAlign: 'center', marginBottom: 8, fontSize: 13 },
  btn:      { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  btnTxt:   { fontSize: 17, fontWeight: '800', color: NAVY, letterSpacing: -0.3 },
});
