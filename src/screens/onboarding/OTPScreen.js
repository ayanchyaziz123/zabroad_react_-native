import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

const BASE_URL = 'http://127.0.0.1:8000/api';
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function OTPScreen({ navigation, route }) {
  const { colors: C } = useTheme();
  const userData = route.params || {};
  const email = userData.email || '';

  const [code,      setCode]      = useState(['', '', '', '', '', '']);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [verified,  setVerified]  = useState(false);

  const inputs = useRef([]);
  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  // Countdown timer for resend
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
    if (!/^\d*$/.test(val)) return; // digits only
    const next = [...code];
    next[idx] = val.slice(-1); // only last char
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
    if (fullCode.length < OTP_LENGTH) {
      setError('Enter all 6 digits');
      shake();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${BASE_URL}/auth/otp/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Invalid code');

      // Animate success tick
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
      await fetch(`${BASE_URL}/auth/otp/send/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
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
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={[styles.back, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => navigation.goBack()}>
            <Text style={[styles.backTxt, { color: C.cream }]}>‹</Text>
          </TouchableOpacity>
          <View style={styles.progress}>
            {[0,1,2,3].map(i => (
              <View key={i} style={[styles.progressDot, { backgroundColor: i <= 1 ? C.vivid : C.border }]} />
            ))}
          </View>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.body}>
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: C.vividD }]}>
            <Text style={{ fontSize: 36 }}>✉️</Text>
          </View>

          <Text style={[styles.title, { color: C.cream }]}>Check your{'\n'}email</Text>
          <Text style={[styles.sub, { color: C.c35 }]}>
            We sent a 6-digit code to
          </Text>
          <Text style={[styles.emailTxt, { color: C.vivid }]}>{email}</Text>

          {/* OTP boxes */}
          <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
            {code.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={r => inputs.current[idx] = r}
                style={[
                  styles.otpBox,
                  {
                    backgroundColor: C.card,
                    borderColor: digit ? C.vivid : error ? C.vivid + '88' : C.border,
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

          {error ? (
            <Text style={[styles.errorTxt, { color: C.vivid }]}>{error}</Text>
          ) : null}

          {/* Success check */}
          {verified && (
            <Animated.View style={[styles.successWrap, { transform: [{ scale: successScale }] }]}>
              <View style={[styles.successCircle, { backgroundColor: C.green }]}>
                <Text style={{ fontSize: 24, color: 'white' }}>✓</Text>
              </View>
              <Text style={[styles.successTxt, { color: C.green }]}>Verified!</Text>
            </Animated.View>
          )}

          {/* Resend */}
          {!verified && (
            <TouchableOpacity onPress={handleResend} disabled={countdown > 0 || resending} style={styles.resendBtn}>
              <Text style={[styles.resendTxt, { color: countdown > 0 ? C.c35 : C.vivid }]}>
                {resending
                  ? 'Sending…'
                  : countdown > 0
                  ? `Resend code in ${countdown}s`
                  : 'Resend code'}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.spamTxt, { color: C.c35 }]}>
            Can't find it? Check your spam folder.
          </Text>
        </View>

        {/* Verify button */}
        {!verified && (
          <View style={[styles.footer, { borderTopColor: C.border }]}>
            <TouchableOpacity
              onPress={handleVerify}
              activeOpacity={filled === OTP_LENGTH ? 0.88 : 1}
              style={[styles.verifyBtn, filled < OTP_LENGTH && { opacity: 0.45 }]}
              disabled={loading}
            >
              <LinearGradient colors={[C.vivid, '#B82838']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.verifyGrad}>
                <Text style={styles.verifyTxt}>{loading ? 'Verifying…' : 'Verify Email'}</Text>
                {!loading && <Text style={{ fontSize: 16, color: 'white' }}>→</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  back:         { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backTxt:      { fontSize: 24, lineHeight: 28 },
  progress:     { flexDirection: 'row', gap: 6 },
  progressDot:  { width: 28, height: 4, borderRadius: 2 },
  body:         { flex: 1, paddingHorizontal: 28, paddingTop: 16, alignItems: 'center' },
  iconWrap:     { width: 80, height: 80, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title:        { fontSize: 32, fontWeight: '900', letterSpacing: -1, lineHeight: 38, marginBottom: 10, textAlign: 'center' },
  sub:          { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 4 },
  emailTxt:     { fontSize: 15, fontWeight: '700', marginBottom: 36, textAlign: 'center' },
  otpRow:       { flexDirection: 'row', gap: 10, marginBottom: 16 },
  otpBox:       { width: 48, height: 58, borderRadius: 14, borderWidth: 2, fontSize: 24, fontWeight: '800' },
  errorTxt:     { fontSize: 13, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  successWrap:  { alignItems: 'center', gap: 8, marginBottom: 16 },
  successCircle:{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  successTxt:   { fontSize: 16, fontWeight: '800' },
  resendBtn:    { paddingVertical: 10, marginBottom: 8 },
  resendTxt:    { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  spamTxt:      { fontSize: 12, textAlign: 'center', marginTop: 4 },
  footer:       { paddingHorizontal: 24, paddingVertical: 12, borderTopWidth: 1 },
  verifyBtn:    { borderRadius: 18, overflow: 'hidden' },
  verifyGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  verifyTxt:    { fontSize: 16, fontWeight: '800', color: 'white' },
});
