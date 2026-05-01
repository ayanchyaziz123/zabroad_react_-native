import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
  Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
      navigation.replace('AppMain');
    } catch (e) {
      setErrors({ password: e.message || 'Incorrect email or password' });
      shake();
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Back */}
        <View style={s.topBar}>
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: C.card, borderColor: C.border }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color={C.cream} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + headline */}
          <View style={s.logoRow}>
            <LinearGradient colors={[C.vivid, '#8B1525']} style={s.logoGrad}>
              <Text style={{ fontSize: 24 }}>🌍</Text>
            </LinearGradient>
            <Text style={[s.brand, { color: C.cream }]}>
              <Text style={{ color: C.vivid }}>Z</Text>abroad
            </Text>
          </View>

          <Text style={[s.title, { color: C.cream }]}>Welcome back</Text>
          <Text style={[s.sub, { color: C.c35 }]}>Sign in to continue your journey</Text>

          {/* Form */}
          <Animated.View style={[s.form, { transform: [{ translateX: shakeAnim }] }]}>

            {/* Email */}
            <View style={s.fieldWrap}>
              <Text style={[s.fieldLabel, { color: C.c35 }]}>Email</Text>
              <View style={[s.inputRow, { backgroundColor: C.card, borderColor: errors.email ? '#FF3B30' : C.border }]}>
                <Ionicons name="mail-outline" size={17} color={C.c35} />
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
                <Ionicons name="lock-closed-outline" size={17} color={C.c35} />
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
              <Text style={[s.forgotTxt, { color: C.vivid }]}>Forgot password?</Text>
            </TouchableOpacity>

          </Animated.View>

          {/* Sign in button */}
          <TouchableOpacity
            style={[s.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={[C.vivid, '#B82838']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.loginGrad}
            >
              {loading
                ? <ActivityIndicator color="white" />
                : <>
                    <Text style={s.loginTxt}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divider}>
            <View style={[s.divLine, { backgroundColor: C.border }]} />
            <Text style={[s.divTxt, { color: C.c35 }]}>or</Text>
            <View style={[s.divLine, { backgroundColor: C.border }]} />
          </View>

          {/* Sign up link */}
          <View style={s.signupRow}>
            <Text style={[s.signupTxt, { color: C.c35 }]}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.75}>
              <Text style={[s.signupLink, { color: C.vivid }]}>Create account</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1 },
  topBar:   { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  backBtn:  { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  body:     { paddingHorizontal: 26, paddingTop: 12, paddingBottom: 40 },

  // Brand
  logoRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 },
  logoGrad: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  brand:    { fontSize: 28, fontWeight: '900', letterSpacing: -1 },

  // Headline
  title:    { fontSize: 32, fontWeight: '900', letterSpacing: -1, lineHeight: 38, marginBottom: 8 },
  sub:      { fontSize: 15, lineHeight: 22, marginBottom: 32 },

  // Form
  form:       { gap: 0 },
  fieldWrap:  { marginBottom: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14 },
  input:      { flex: 1, fontSize: 15 },
  errorTxt:   { fontSize: 12, color: '#FF3B30', fontWeight: '600', marginTop: 5 },
  forgotRow:  { alignItems: 'flex-end', marginTop: -6, marginBottom: 28 },
  forgotTxt:  { fontSize: 13, fontWeight: '600' },

  // CTA
  loginBtn:   { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  loginGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  loginTxt:   { fontSize: 16, fontWeight: '800', color: 'white', letterSpacing: 0.2 },

  // Divider
  divider:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  divLine:  { flex: 1, height: StyleSheet.hairlineWidth },
  divTxt:   { fontSize: 12, fontWeight: '500' },

  // Sign up
  signupRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  signupTxt:  { fontSize: 14 },
  signupLink: { fontSize: 14, fontWeight: '700' },
});
