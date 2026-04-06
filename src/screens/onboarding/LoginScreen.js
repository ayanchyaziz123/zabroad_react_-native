import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { FontAwesome } from '@expo/vector-icons';

function Field({ label, value, onChange, placeholder, secure, showPass, onTogglePass, inputRef, next, error, keyboardType, C }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.fieldLabel, { color: C.c35 }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: C.card, borderColor: error ? C.vivid : C.border }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: C.cream }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={C.c35}
          secureTextEntry={secure && !showPass}
          keyboardType={keyboardType || 'default'}
          returnKeyType={next ? 'next' : 'done'}
          onSubmitEditing={() => next?.current?.focus()}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {secure && (
          <TouchableOpacity onPress={onTogglePass} style={{ padding: 4 }}>
            <Text style={{ fontSize: 16 }}>{showPass ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={[styles.errorTxt, { color: C.vivid }]}>{error}</Text> : null}
    </View>
  );
}

export default function LoginScreen({ navigation }) {
  const { colors: C } = useTheme();
  const login = useAuthStore(s => s.login);

  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const passRef   = useRef(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const validate = () => {
    const e = {};
    if (!email.includes('@')) e.email    = 'Enter a valid email';
    if (password.length < 6)  e.password = 'Password must be 6+ characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) { shake(); return; }
    setLoading(true);
    try {
      await login({ email, password });
      navigation.replace('AppMain');
    } catch (e) {
      setErrors({ password: e.message });
      shake();
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = () => {
    if (!email.includes('@')) {
      setErrors({ email: 'Enter your email first to reset password' });
      shake();
      return;
    }
    setForgotSent(true);
    setTimeout(() => setForgotSent(false), 4000);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={[styles.back, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => navigation.goBack()}>
            <Text style={[styles.backTxt, { color: C.cream }]}>‹</Text>
          </TouchableOpacity>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoRow}>
            <LinearGradient colors={[C.vivid, '#8B1525']} style={styles.logoIcon}>
              <Text style={{ fontSize: 26 }}>🌍</Text>
            </LinearGradient>
            <Text style={[styles.logoTxt, { color: C.cream }]}>
              <Text style={{ color: C.vivid }}>Z</Text>abroad
            </Text>
          </View>

          <Text style={[styles.title, { color: C.cream }]}>Welcome back 👋</Text>
          <Text style={[styles.sub, { color: C.c35 }]}>Sign in to your Zabroad account</Text>

          {/* Social */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: C.card, borderColor: C.border }]} activeOpacity={0.8} onPress={handleLogin}>
              <FontAwesome name="google" size={18} color="#DB4437" />
              <Text style={[styles.socialTxt, { color: C.cream }]}>Continue with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: C.card, borderColor: C.border }]} activeOpacity={0.8} onPress={handleLogin}>
              <FontAwesome name="facebook" size={20} color="#1877F2" />
              <Text style={[styles.socialTxt, { color: C.cream }]}>Continue with Facebook</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={[styles.divLine, { backgroundColor: C.border }]} />
            <Text style={[styles.divTxt, { color: C.c35 }]}>or with email</Text>
            <View style={[styles.divLine, { backgroundColor: C.border }]} />
          </View>

          {/* Shake animation wrapper */}
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <Field C={C} label="Email Address" value={email} onChange={setEmail}
              placeholder="you@email.com" keyboardType="email-address"
              next={passRef} error={errors.email} />
            <Field C={C} label="Password" value={password} onChange={setPassword}
              placeholder="Your password" secure showPass={showPass}
              onTogglePass={() => setShowPass(p => !p)} inputRef={passRef}
              error={errors.password} />
          </Animated.View>

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotRow} onPress={handleForgot}>
            <Text style={[styles.forgotTxt, { color: forgotSent ? C.green : C.vivid }]}>
              {forgotSent ? '✓ Reset link sent to your email' : 'Forgot password?'}
            </Text>
          </TouchableOpacity>

          {/* Guest option */}
          <TouchableOpacity style={[styles.guestBtn, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => navigation.replace('AppMain')} activeOpacity={0.8}>
            <Text style={[styles.guestTxt, { color: C.c35 }]}>👀 Continue as Guest</Text>
          </TouchableOpacity>

          <Text style={[styles.signupHint, { color: C.c35 }]}>
            Don't have an account?{' '}
            <Text style={{ color: C.vivid, fontWeight: '700' }} onPress={() => navigation.navigate('SignUp')}>Sign Up</Text>
          </Text>
        </ScrollView>

        {/* Sign In Button */}
        <View style={[styles.footer, { borderTopColor: C.border }]}>
          <TouchableOpacity
            onPress={handleLogin}
            activeOpacity={0.88}
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            disabled={loading}
          >
            <LinearGradient colors={[C.vivid, '#B82838']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginGrad}>
              <Text style={styles.loginTxt}>{loading ? 'Signing in…' : 'Sign In'}</Text>
              {!loading && <Text style={{ fontSize: 16, color: 'white' }}>→</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  back: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 24, lineHeight: 28 },
  body: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  logoIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  logoTxt: { fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -1, lineHeight: 36, marginBottom: 6 },
  sub: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  socialRow: { gap: 10, marginBottom: 20 },
  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  socialTxt: { fontSize: 14, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  divLine: { flex: 1, height: 1 },
  divTxt: { fontSize: 12, fontWeight: '500' },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  input: { flex: 1, fontSize: 15 },
  errorTxt: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  forgotRow: { alignItems: 'flex-end', marginTop: -8, marginBottom: 20 },
  forgotTxt: { fontSize: 13, fontWeight: '600' },
  guestBtn: { borderRadius: 16, borderWidth: 1, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  guestTxt: { fontSize: 14, fontWeight: '600' },
  signupHint: { fontSize: 13, textAlign: 'center' },
  footer: { paddingHorizontal: 24, paddingVertical: 12, borderTopWidth: 1 },
  loginBtn: { borderRadius: 18, overflow: 'hidden' },
  loginGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  loginTxt: { fontSize: 16, fontWeight: '800', color: 'white' },
});
