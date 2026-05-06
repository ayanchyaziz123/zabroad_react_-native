import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FEATURES = [
  { icon: '🏘️', text: 'Find your community' },
  { icon: '💼', text: 'OPT & visa-friendly jobs' },
  { icon: '🏠', text: 'Housing without credit' },
  { icon: '⚖️', text: 'Free legal help' },
  { icon: '🩺', text: 'Immigrant-friendly doctors' },
  { icon: '🤖', text: 'AI visa assistant 24/7' },
];

export default function WelcomeScreen({ navigation }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

      <Animated.View style={[s.top, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Logo */}
        <View style={s.logoWrap}>
          <Text style={s.logoEmoji}>✈️</Text>
          <Text style={s.logoText}>Zabroad</Text>
          <Text style={s.logoTagline}>Your life abroad, simplified.</Text>
        </View>

        {/* Stats */}
        <View style={s.statsBar}>
          {[
            { num: '50K+', label: 'Members' },
            { num: '80',   label: 'Countries' },
            { num: '24/7', label: 'AI Support' },
          ].map((item, i) => (
            <View key={i} style={[s.statItem, i < 2 && s.statBorder]}>
              <Text style={s.statNum}>{item.num}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Feature pills */}
        <View style={s.pillsWrap}>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.pill}>
              <Text style={{ fontSize: 13 }}>{f.icon}</Text>
              <Text style={s.pillTxt}>{f.text}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* CTA */}
      <Animated.View style={[s.bottom, { opacity: fadeAnim }]}>
        <TouchableOpacity style={s.primaryBtn} onPress={() => navigation.navigate('SignUp')} activeOpacity={0.88}>
          <Text style={s.primaryTxt}>Get Started — It's Free  →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.secondaryBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
          <Text style={s.secondaryTxt}>
            Already have an account?{'  '}
            <Text style={s.secondaryLink}>Sign In</Text>
          </Text>
        </TouchableOpacity>

        <Text style={s.terms}>By continuing you agree to our Terms & Privacy Policy</Text>
      </Animated.View>

    </SafeAreaView>
  );
}

const NAVY = '#1B3266';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY, justifyContent: 'space-between' },

  top: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },

  logoWrap:   { alignItems: 'center', marginBottom: 32 },
  logoEmoji:  { fontSize: 44, marginBottom: 10 },
  logoText:   { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: -1.5, marginBottom: 8 },
  logoTagline:{ fontSize: 15, color: 'rgba(255,255,255,0.65)', fontWeight: '400' },

  statsBar:  { flexDirection: 'row', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 24, alignSelf: 'stretch' },
  statItem:  { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statBorder:{ borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.15)' },
  statNum:   { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 },

  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  pill:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  pillTxt:   { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.85)' },

  bottom: { paddingHorizontal: 24, paddingBottom: 10, gap: 10 },

  primaryBtn:  { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  primaryTxt:  { fontSize: 16, fontWeight: '800', color: NAVY, letterSpacing: -0.2 },

  secondaryBtn: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  secondaryTxt: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  secondaryLink:{ color: '#fff', fontWeight: '700' },

  terms: { textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingBottom: 4 },
});
