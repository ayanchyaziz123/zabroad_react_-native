import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

const FEATURES = [
  { icon: '🏘️', text: 'Find your community' },
  { icon: '💼', text: 'OPT & visa-friendly jobs' },
  { icon: '🏠', text: 'Housing without credit' },
  { icon: '⚖️', text: 'Free legal help' },
  { icon: '🩺', text: 'Immigrant-friendly doctors' },
  { icon: '🤖', text: 'AI visa assistant 24/7' },
];

export default function WelcomeScreen({ navigation }) {
  const { colors: C, isDark } = useTheme();
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(40)).current;
  const scaleAnim  = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient
        colors={isDark ? ['#1A0A0E', '#0D0F1A', C.bg] : [C.bg, C.bg]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Background glow orbs — only in dark mode */}
      {isDark && <View style={[styles.orb1, { backgroundColor: C.vivid }]} />}
      {isDark && <View style={[styles.orb2, { backgroundColor: C.purple }]} />}

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View style={[styles.top, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
          {/* Logo */}
          <View style={styles.logoWrap}>
            <LinearGradient colors={[C.vivid, '#8B1525']} style={styles.logoIcon}>
              <Text style={{ fontSize: 36 }}>🌍</Text>
            </LinearGradient>
            <Text style={[styles.logoText, { color: C.cream }]}>
              <Text style={{ color: C.vivid }}>Z</Text>
              <Text style={{ color: C.cream }}>abroad</Text>
            </Text>
            <Text style={[styles.logoTagline, { color: C.c35 }]}>Your life abroad, simplified.</Text>
          </View>

          {/* Stats bar */}
          <View style={[styles.statsBar, { backgroundColor: C.card, borderColor: C.border }]}>
            {[
              { num: '50K+', label: 'Members' },
              { num: '80',   label: 'Countries' },
              { num: '24/7', label: 'AI Support' },
            ].map((s, i) => (
              <View key={i} style={[styles.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: C.border }]}>
                <Text style={[styles.statNum, { color: C.vivid }]}>{s.num}</Text>
                <Text style={[styles.statLabel, { color: C.c35 }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Feature pills */}
          <View style={styles.featureWrap}>
            {FEATURES.map((f, i) => (
              <View key={i} style={[styles.featurePill, { backgroundColor: C.card, borderColor: C.border }]}>
                <Text style={{ fontSize: 14 }}>{f.icon}</Text>
                <Text style={[styles.featureTxt, { color: C.c60 }]}>{f.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* CTA Buttons */}
        <Animated.View style={[styles.bottom, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={[styles.primaryBtn, { shadowColor: C.vivid }]}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.88}
          >
            <LinearGradient colors={[C.vivid, '#B82838']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryGrad}>
              <Text style={styles.primaryTxt}>Get Started — It's Free</Text>
              <Text style={{ fontSize: 16 }}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: C.border2, backgroundColor: C.card }]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryTxt, { color: C.c60 }]}>Already have an account? <Text style={{ color: C.vivid, fontWeight: '700' }}>Sign In</Text></Text>
          </TouchableOpacity>

          <Text style={[styles.terms, { color: C.c35 }]}>
            By continuing you agree to our Terms & Privacy Policy
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'space-between' },
  orb1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, top: -80, right: -80, opacity: 0.12 },
  orb2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, bottom: 100, left: -60, opacity: 0.08 },
  top: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoIcon: { width: 80, height: 80, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: '#E8364A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
  logoText: { fontSize: 38, fontWeight: '900', letterSpacing: -1.5, marginBottom: 6 },
  logoTagline: { fontSize: 14, fontWeight: '400', letterSpacing: 0.2 },
  statsBar: { flexDirection: 'row', borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 24, alignSelf: 'stretch' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statNum: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  featureWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  featurePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 50, borderWidth: 1 },
  featureTxt: { fontSize: 12, fontWeight: '500' },
  bottom: { paddingHorizontal: 24, paddingBottom: 8, gap: 10 },
  primaryBtn: { borderRadius: 18, overflow: 'hidden', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  primaryGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 17 },
  primaryTxt: { fontSize: 16, fontWeight: '800', color: 'white', letterSpacing: -0.3 },
  secondaryBtn: { borderRadius: 18, borderWidth: 1, paddingVertical: 15, alignItems: 'center' },
  secondaryTxt: { fontSize: 14 },
  terms: { textAlign: 'center', fontSize: 11, paddingBottom: 4 },
});
