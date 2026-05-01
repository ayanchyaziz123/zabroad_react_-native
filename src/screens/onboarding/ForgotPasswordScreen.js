import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';

// Two steps: 1 = enter email, 2 = enter OTP + new password
export default function ForgotPasswordScreen({ navigation }) {
  const { colors: C } = useTheme();
  const { api } = useAuthStore();

  const [step,        setStep]        = useState(1);
  const [email,       setEmail]       = useState('');
  const [code,        setCode]        = useState('');
  const [password,    setPassword]    = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState({});
  const [done,        setDone]        = useState(false);

  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const codeRef    = useRef(null);
  const passRef    = useRef(null);
  const confirmRef = useRef(null);

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 55, useNativeDriver: true }),
    ]).start();
  }

  // Step 1 — send OTP
  async function handleSendCode() {
    const e = {};
    if (!email.trim() || !email.includes('@')) e.email = 'Enter a valid email address';
    setErrors(e);
    if (Object.keys(e).length) { shake(); return; }

    setLoading(true);
    try {
      await api('/auth/password/forgot/', { method: 'POST', body: { email: email.trim().toLowerCase() } });
      setStep(2);
    } catch (err) {
      setErrors({ email: err.message || 'Could not send code. Try again.' });
      shake();
    } finally {
      setLoading(false);
    }
  }

  // Step 2 — verify OTP + set new password
  async function handleReset() {
    const e = {};
    if (code.length < 6)         e.code     = 'Enter the 6-digit code';
    if (password.length < 6)     e.password = 'Password must be at least 6 characters';
    if (password !== confirmPass) e.confirm  = 'Passwords do not match';
    setErrors(e);
    if (Object.keys(e).length) { shake(); return; }

    setLoading(true);
    try {
      await api('/auth/password/reset/', {
        method: 'POST',
        body: { email: email.trim().toLowerCase(), code, password },
      });
      setDone(true);
    } catch (err) {
      setErrors({ code: err.message || 'Invalid or expired code.' });
      shake();
    } finally {
      setLoading(false);
    }
  }

  // Success screen
  if (done) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>
        <View style={s.successWrap}>
          <LinearGradient colors={[C.vivid, '#8B1525']} style={s.successIcon}>
            <Ionicons name="checkmark" size={36} color="white" />
          </LinearGradient>
          <Text style={[s.successTitle, { color: C.cream }]}>Password Reset!</Text>
          <Text style={[s.successSub, { color: C.c35 }]}>
            Your password has been updated successfully.{'\n'}Sign in with your new password.
          </Text>
          <TouchableOpacity
            style={s.doneBtn}
            onPress={() => navigation.replace('Login')}
            activeOpacity={0.88}
          >
            <LinearGradient colors={[C.vivid, '#B82838']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.doneBtnGrad}>
              <Text style={s.doneBtnTxt}>Sign In</Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: C.card, borderColor: C.border }]}
            onPress={() => step === 1 ? navigation.goBack() : setStep(1)}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color={C.cream} />
          </TouchableOpacity>
          {/* Step indicator */}
          <View style={s.steps}>
            <View style={[s.stepDot, { backgroundColor: C.vivid }]} />
            <View style={[s.stepLine, { backgroundColor: step === 2 ? C.vivid : C.border }]} />
            <View style={[s.stepDot, { backgroundColor: step === 2 ? C.vivid : C.border }]} />
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[s.iconWrap, { backgroundColor: C.vividD }]}>
            <Ionicons name={step === 1 ? 'mail-outline' : 'key-outline'} size={28} color={C.vivid} />
          </View>

          <Text style={[s.title, { color: C.cream }]}>
            {step === 1 ? 'Forgot Password?' : 'Reset Password'}
          </Text>
          <Text style={[s.sub, { color: C.c35 }]}>
            {step === 1
              ? 'Enter your email and we\'ll send you a 6-digit reset code.'
              : `Enter the code sent to ${email} and choose a new password.`}
          </Text>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>

            {/* ── Step 1: Email ─────────────────────────────── */}
            {step === 1 && (
              <View style={s.fieldWrap}>
                <Text style={[s.fieldLabel, { color: C.c35 }]}>Email Address</Text>
                <View style={[s.inputRow, { backgroundColor: C.card, borderColor: errors.email ? '#FF3B30' : C.border }]}>
                  <Ionicons name="mail-outline" size={17} color={C.c35} />
                  <TextInput
                    style={[s.input, { color: C.cream }]}
                    value={email}
                    onChangeText={v => { setEmail(v); setErrors({}); }}
                    placeholder="you@email.com"
                    placeholderTextColor={C.c35}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSendCode}
                  />
                </View>
                {errors.email ? <Text style={s.errorTxt}>{errors.email}</Text> : null}
              </View>
            )}

            {/* ── Step 2: Code + new password ───────────────── */}
            {step === 2 && (
              <>
                {/* Code */}
                <View style={s.fieldWrap}>
                  <Text style={[s.fieldLabel, { color: C.c35 }]}>6-Digit Code</Text>
                  <View style={[s.inputRow, { backgroundColor: C.card, borderColor: errors.code ? '#FF3B30' : C.border }]}>
                    <Ionicons name="shield-checkmark-outline" size={17} color={C.c35} />
                    <TextInput
                      ref={codeRef}
                      style={[s.input, { color: C.cream, letterSpacing: 6, fontSize: 18, fontWeight: '700' }]}
                      value={code}
                      onChangeText={v => { setCode(v.replace(/\D/g, '').slice(0, 6)); setErrors(p => ({ ...p, code: '' })); }}
                      placeholder="000000"
                      placeholderTextColor={C.c35}
                      keyboardType="number-pad"
                      returnKeyType="next"
                      onSubmitEditing={() => passRef.current?.focus()}
                    />
                  </View>
                  {errors.code ? <Text style={s.errorTxt}>{errors.code}</Text> : null}
                  <TouchableOpacity onPress={handleSendCode} style={s.resendRow} activeOpacity={0.7}>
                    <Text style={[s.resendTxt, { color: C.vivid }]}>Resend code</Text>
                  </TouchableOpacity>
                </View>

                {/* New password */}
                <View style={s.fieldWrap}>
                  <Text style={[s.fieldLabel, { color: C.c35 }]}>New Password</Text>
                  <View style={[s.inputRow, { backgroundColor: C.card, borderColor: errors.password ? '#FF3B30' : C.border }]}>
                    <Ionicons name="lock-closed-outline" size={17} color={C.c35} />
                    <TextInput
                      ref={passRef}
                      style={[s.input, { color: C.cream }]}
                      value={password}
                      onChangeText={v => { setPassword(v); setErrors(p => ({ ...p, password: '' })); }}
                      placeholder="Min. 6 characters"
                      placeholderTextColor={C.c35}
                      secureTextEntry={!showPass}
                      autoCapitalize="none"
                      returnKeyType="next"
                      onSubmitEditing={() => confirmRef.current?.focus()}
                    />
                    <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.c35} />
                    </TouchableOpacity>
                  </View>
                  {errors.password ? <Text style={s.errorTxt}>{errors.password}</Text> : null}
                </View>

                {/* Confirm password */}
                <View style={s.fieldWrap}>
                  <Text style={[s.fieldLabel, { color: C.c35 }]}>Confirm Password</Text>
                  <View style={[s.inputRow, { backgroundColor: C.card, borderColor: errors.confirm ? '#FF3B30' : C.border }]}>
                    <Ionicons name="lock-closed-outline" size={17} color={C.c35} />
                    <TextInput
                      ref={confirmRef}
                      style={[s.input, { color: C.cream }]}
                      value={confirmPass}
                      onChangeText={v => { setConfirmPass(v); setErrors(p => ({ ...p, confirm: '' })); }}
                      placeholder="Repeat password"
                      placeholderTextColor={C.c35}
                      secureTextEntry={!showConfirm}
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleReset}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.c35} />
                    </TouchableOpacity>
                  </View>
                  {errors.confirm ? <Text style={s.errorTxt}>{errors.confirm}</Text> : null}
                </View>
              </>
            )}
          </Animated.View>

          {/* CTA */}
          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.7 }]}
            onPress={step === 1 ? handleSendCode : handleReset}
            disabled={loading}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={[C.vivid, '#B82838']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.btnGrad}
            >
              {loading
                ? <ActivityIndicator color="white" />
                : <>
                    <Text style={s.btnTxt}>
                      {step === 1 ? 'Send Reset Code' : 'Reset Password'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.backToLogin} onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={[s.backToLoginTxt, { color: C.c35 }]}>
              Remember your password?{'  '}
              <Text style={{ color: C.vivid, fontWeight: '700' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1 },
  topBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Step indicator
  steps:    { flexDirection: 'row', alignItems: 'center', gap: 0 },
  stepDot:  { width: 10, height: 10, borderRadius: 5 },
  stepLine: { width: 40, height: 2, borderRadius: 1 },

  body:    { paddingHorizontal: 26, paddingTop: 16, paddingBottom: 40, gap: 0 },

  iconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title:    { fontSize: 30, fontWeight: '900', letterSpacing: -0.8, lineHeight: 36, marginBottom: 10 },
  sub:      { fontSize: 14, lineHeight: 22, marginBottom: 32 },

  fieldWrap:  { marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14 },
  input:      { flex: 1, fontSize: 15 },
  errorTxt:   { fontSize: 12, color: '#FF3B30', fontWeight: '600', marginTop: 5 },
  resendRow:  { alignItems: 'flex-end', marginTop: 8 },
  resendTxt:  { fontSize: 13, fontWeight: '600' },

  btn:     { borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 20 },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  btnTxt:  { fontSize: 16, fontWeight: '800', color: 'white', letterSpacing: 0.2 },

  backToLogin:    { alignItems: 'center' },
  backToLoginTxt: { fontSize: 14, textAlign: 'center' },

  // Success
  successWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 16 },
  successIcon:  { width: 80, height: 80, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  successSub:   { fontSize: 15, lineHeight: 24, textAlign: 'center' },
  doneBtn:      { borderRadius: 16, overflow: 'hidden', width: '100%', marginTop: 16 },
  doneBtnGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  doneBtnTxt:   { fontSize: 16, fontWeight: '800', color: 'white' },
});
