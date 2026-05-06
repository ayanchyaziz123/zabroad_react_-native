import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, Animated, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;
const NAVY = '#1B3266';

export default function OTPScreen({ navigation, route }) {
  const { colors: C } = useTheme();
  const api      = useAuthStore(s => s.api);
  const userData = route.params || {};
  const email    = userData.email || '';

  const [code,      setCode]      = useState(['', '', '', '', '', '']);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [verified,  setVerified]  = useState(false);

  const inputs       = useRef([]);
  const shakeAnim    = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function handleChange(val, idx) {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[idx] = val.slice(-1);
    setCode(next);
    setError('');
    if (val && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  }

  function handleKeyPress(e, idx) {
    if (e.nativeEvent.key === 'Backspace' && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  async function handleVerify() {
    const fullCode = code.join('');
    if (fullCode.length < OTP_LENGTH) { setError('Enter all 6 digits'); shake(); return; }
    setLoading(true);
    setError('');
    try {
      await api('/auth/otp/verify/', { method: 'POST', body: { email, code: fullCode } });
      setVerified(true);
      Animated.spring(successScale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }).start(() => {
        setTimeout(() => navigation.navigate('FromCountry', userData), 800);
      });
    } catch (e) {
      setError(e.message);
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      shake();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await api('/auth/otp/send/', { method: 'POST', body: { email } });
      setCountdown(RESEND_COOLDOWN);
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch {
      setError('Failed to resend. Try again.');
    } finally {
      setResending(false);
    }
  }

  const filled = code.filter(Boolean).length;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* ── Navy header ─────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerTopRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={s.progress}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={[s.progressDot, { backgroundColor: i <= 1 ? '#F4A227' : 'rgba(255,255,255,0.25)' }]} />
              ))}
            </View>
            <View style={{ width: 34 }} />
          </View>
          <Text style={s.headerLogo}>Zabroad ✈</Text>
          <Text style={s.headerTitle}>Check your{'\n'}email</Text>
          <Text style={s.headerSub}>
            We sent a 6-digit code to{' '}
            <Text style={{ color: '#F4A227', fontWeight: '700' }}>{email}</Text>
          </Text>
        </View>

        {/* ── Body ────────────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={[s.body, { backgroundColor: C.bg }]}
          style={{ backgroundColor: C.bg }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[s.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
            {code.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={r => inputs.current[idx] = r}
                style={[
                  s.otpBox,
                  {
                    backgroundColor: C.card,
                    borderColor: digit ? '#3B8BF7' : error ? '#FF3B30' : C.border,
                    color: C.cream,
                  },
                ]}
                value={digit}
                onChangeText={val => handleChange(val, idx)}
                onKeyPress={e => handleKeyPress(e, idx)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
                autoFocus={idx === 0}
              />
            ))}
          </Animated.View>

          {error ? <Text style={s.errorTxt}>{error}</Text> : null}

          {verified && (
            <Animated.View style={[s.successWrap, { transform: [{ scale: successScale }] }]}>
              <View style={[s.successCircle, { backgroundColor: '#22C55E' }]}>
                <Text style={{ fontSize: 24, color: 'white' }}>✓</Text>
              </View>
              <Text style={[s.successTxt, { color: '#22C55E' }]}>Verified!</Text>
            </Animated.View>
          )}

          {!verified && (
            <TouchableOpacity onPress={handleResend} disabled={countdown > 0 || resending} style={s.resendBtn}>
              <Text style={[s.resendTxt, { color: countdown > 0 ? C.c35 : '#3B8BF7' }]}>
                {resending ? 'Sending…' : countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[s.spamTxt, { color: C.c35 }]}>
            Can't find it? Check your spam folder.
          </Text>
        </ScrollView>

        {/* ── Verify button ───────────────────────────────────── */}
        {!verified && (
          <View style={[s.footer, { borderTopColor: C.border, backgroundColor: C.bg }]}>
            <TouchableOpacity
              onPress={handleVerify}
              activeOpacity={filled === OTP_LENGTH ? 0.88 : 1}
              style={[s.btn, filled < OTP_LENGTH && { opacity: 0.45 }]}
              disabled={loading}
            >
              <Text style={s.btnTxt}>{loading ? 'Verifying…' : 'Verify Email  →'}</Text>
            </TouchableOpacity>
          </View>
        )}

      </KeyboardAvoidingView>
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

  // ── Body ──────────────────────────────────────────────────────────────────
  body:          { paddingHorizontal: 24, paddingTop: 36, paddingBottom: 40, alignItems: 'center', flexGrow: 1 },
  otpRow:        { flexDirection: 'row', gap: 10, marginBottom: 16 },
  otpBox:        { width: 48, height: 58, borderRadius: 14, borderWidth: 2, fontSize: 24, fontWeight: '800' },
  errorTxt:      { fontSize: 13, fontWeight: '600', color: '#FF3B30', marginBottom: 12, textAlign: 'center' },
  successWrap:   { alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 8 },
  successCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  successTxt:    { fontSize: 16, fontWeight: '800' },
  resendBtn:     { paddingVertical: 10, marginBottom: 8 },
  resendTxt:     { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  spamTxt:       { fontSize: 12, textAlign: 'center', marginTop: 4 },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: { paddingHorizontal: 24, paddingVertical: 12, borderTopWidth: 1 },
  btn:    { backgroundColor: NAVY, borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  btnTxt: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
});
