import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
  Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen({ navigation }) {
  const { colors: C } = useTheme();
  const login = useAuthStore(s => s.login);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const passRef   = useRef(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 55, useNativeDriver: true }),
    ]).start();
  }

  function validate() {
    const e = {};
    if (!email.trim() || !email.includes('@')) e.email    = 'Enter a valid email address';
    if (password.length < 6)                   e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) { shake(); return; }
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      navigation.reset({ index: 0, routes: [{ name: 'AppMain' }] });
    } catch (e) {
      setErrors({ password: e.message || 'Incorrect email or password' });
      shake();
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* ── Navy header ─────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerLogo}>Zabroad ✈</Text>
            <Text style={s.headerTitle}>Welcome back</Text>
            <Text style={s.headerSub}>Sign in to continue your journey</Text>
          </View>
        </View>

        {/* ── Form body ────────────────────────────────────────── */}
        <ScrollView
          contentContainerStyle={[s.body, { backgroundColor: C.bg }]}
          style={{ backgroundColor: C.bg }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[s.form, { transform: [{ translateX: shakeAnim }] }]}>

            {/* Email */}
            <View style={s.fieldWrap}>
              <Text style={[s.fieldLabel, { color: C.c35 }]}>Email</Text>
              <View style={[s.inputRow, { backgroundColor: C.card, borderColor: errors.email ? '#FF3B30' : C.border }]}>
                <Ionicons name="mail-outline" size={16} color={C.c35} />
                <TextInput
                  style={[s.input, { color: C.cream }]}
                  value={email}
                  onChangeText={v => { setEmail(v); setErrors(p => ({ ...p, email: '' })); }}
                  placeholder="you@email.com"
                  placeholderTextColor={C.c35}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passRef.current?.focus()}
                />
              </View>
              {errors.email ? <Text style={s.errorTxt}>{errors.email}</Text> : null}
            </View>

            {/* Password */}
            <View style={s.fieldWrap}>
              <Text style={[s.fieldLabel, { color: C.c35 }]}>Password</Text>
              <View style={[s.inputRow, { backgroundColor: C.card, borderColor: errors.password ? '#FF3B30' : C.border }]}>
                <Ionicons name="lock-closed-outline" size={16} color={C.c35} />
                <TextInput
                  ref={passRef}
                  style={[s.input, { color: C.cream }]}
                  value={password}
                  onChangeText={v => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
                  placeholder="Your password"
                  placeholderTextColor={C.c35}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.c35} />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={s.errorTxt}>{errors.password}</Text> : null}
            </View>

            {/* Forgot */}
            <TouchableOpacity style={s.forgotRow} onPress={() => navigation.navigate('ForgotPassword')} activeOpacity={0.7}>
              <Text style={s.forgotTxt}>Forgot password?</Text>
            </TouchableOpacity>

          </Animated.View>

          {/* Sign In button */}
          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <>
                  <Text style={s.btnTxt}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={[s.divLine, { backgroundColor: C.border }]} />
            <Text style={[s.divTxt, { color: C.c35 }]}>or</Text>
            <View style={[s.divLine, { backgroundColor: C.border }]} />
          </View>

          {/* Sign up link */}
          <View style={s.switchRow}>
            <Text style={[s.switchTxt, { color: C.c35 }]}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.75}>
              <Text style={s.switchLink}>Create account</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const NAVY = '#1B3266';

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },

  // ── Navy header ────────────────────────────────────────────────────────────
  header: { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 28 },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  headerCenter: { paddingHorizontal: 2 },
  headerLogo:   { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.4, marginBottom: 12 },
  headerTitle:  { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5, lineHeight: 34, marginBottom: 6 },
  headerSub:    { fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 20 },

  // ── Form body ──────────────────────────────────────────────────────────────
  body: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 },
  form: { gap: 0 },

  fieldWrap:  { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 7 },
  inputRow:   {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  input:    { flex: 1, fontSize: 15 },
  errorTxt: { fontSize: 12, color: '#FF3B30', fontWeight: '600', marginTop: 4 },

  forgotRow: { alignItems: 'flex-end', marginTop: -4, marginBottom: 26 },
  forgotTxt: { fontSize: 13, fontWeight: '600', color: '#3B8BF7' },

  // CTA
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#1B3266', borderRadius: 13,
    paddingVertical: 15, marginBottom: 22,
  },
  btnTxt: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22 },
  divLine: { flex: 1, height: StyleSheet.hairlineWidth },
  divTxt:  { fontSize: 12, fontWeight: '500' },

  // Switch
  switchRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  switchTxt:  { fontSize: 14 },
  switchLink: { fontSize: 14, fontWeight: '700', color: '#3B8BF7' },
});
