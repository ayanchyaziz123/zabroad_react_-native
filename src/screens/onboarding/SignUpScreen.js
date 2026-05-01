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

export default function SignUpScreen({ navigation }) {
  const { colors: C } = useTheme();
  const { api } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [errors,    setErrors]    = useState({});
  const [sending,   setSending]   = useState(false);

  const lastNameRef = useRef(null);
  const emailRef    = useRef(null);
  const passRef     = useRef(null);
  const confRef     = useRef(null);
  const shakeAnim   = useRef(new Animated.Value(0)).current;

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
    if (!firstName.trim())       e.firstName = 'First name is required';
    if (!lastName.trim())        e.lastName  = 'Last name is required';
    if (!email.includes('@'))    e.email     = 'Enter a valid email address';
    if (password.length < 8)     e.password  = 'Password must be at least 8 characters';
    if (confirm !== password)    e.confirm   = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleNext() {
    if (!validate()) { shake(); return; }
    setSending(true);
    try {
      await api('/auth/otp/send/', {
        method: 'POST',
        body: { email: email.trim().toLowerCase() },
      });
      navigation.navigate('OTP', {
        name:     `${firstName.trim()} ${lastName.trim()}`,
        email:    email.trim().toLowerCase(),
        password,
      });
    } catch (e) {
      setErrors({ email: e.message || 'Failed to send verification code.' });
      shake();
    } finally {
      setSending(false);
    }
  }

  function clearError(key) {
    setErrors(p => ({ ...p, [key]: '' }));
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: C.card, borderColor: C.border }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color={C.cream} />
          </TouchableOpacity>
          {/* Progress dots */}
          <View style={s.progress}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={[s.progressDot, { backgroundColor: i === 0 ? C.vivid : C.border }]} />
            ))}
          </View>
          <View style={{ width: 40 }} />
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

          <Text style={[s.title, { color: C.cream }]}>Create your{'\n'}account</Text>
          <Text style={[s.sub, { color: C.c35 }]}>Join thousands of immigrants building a better life abroad</Text>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>

            {/* Name row */}
            <View style={s.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLabel, { color: C.c35 }]}>First Name</Text>
                <View style={[s.inputRow, { backgroundColor: C.card, borderColor: errors.firstName ? '#FF3B30' : C.border }]}>
                  <TextInput
                    style={[s.input, { color: C.cream }]}
                    value={firstName}
                    onChangeText={v => { setFirstName(v); clearError('firstName'); }}
                    placeholder="First"
                    placeholderTextColor={C.c35}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                  />
                </View>
                {errors.firstName ? <Text style={s.errorTxt}>{errors.firstName}</Text> : null}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLabel, { color: C.c35 }]}>Last Name</Text>
                <View style={[s.inputRow, { backgroundColor: C.card, borderColor: errors.lastName ? '#FF3B30' : C.border }]}>
                  <TextInput
                    ref={lastNameRef}
                    style={[s.input, { color: C.cream }]}
                    value={lastName}
                    onChangeText={v => { setLastName(v); clearError('lastName'); }}
                    placeholder="Last"
                    placeholderTextColor={C.c35}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                </View>
                {errors.lastName ? <Text style={s.errorTxt}>{errors.lastName}</Text> : null}
              </View>
            </View>

            {/* Email */}
            <View style={s.fieldWrap}>
              <Text style={[s.fieldLabel, { color: C.c35 }]}>Email Address</Text>
              <View style={[s.inputRow, { backgroundColor: C.card, borderColor: errors.email ? '#FF3B30' : C.border }]}>
                <Ionicons name="mail-outline" size={17} color={C.c35} />
                <TextInput
                  ref={emailRef}
                  style={[s.input, { color: C.cream }]}
                  value={email}
                  onChangeText={v => { setEmail(v); clearError('email'); }}
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
                  onChangeText={v => { setPassword(v); clearError('password'); }}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={C.c35}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="oneTimeCode"
                  returnKeyType="next"
                  onSubmitEditing={() => confRef.current?.focus()}
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
                  ref={confRef}
                  style={[s.input, { color: C.cream }]}
                  value={confirm}
                  onChangeText={v => { setConfirm(v); clearError('confirm'); }}
                  placeholder="Re-enter password"
                  placeholderTextColor={C.c35}
                  secureTextEntry={!showConf}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="oneTimeCode"
                  returnKeyType="done"
                  onSubmitEditing={handleNext}
                />
                <TouchableOpacity onPress={() => setShowConf(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showConf ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.c35} />
                </TouchableOpacity>
              </View>
              {errors.confirm ? <Text style={s.errorTxt}>{errors.confirm}</Text> : null}
            </View>

          </Animated.View>

          {/* Terms */}
          <Text style={[s.terms, { color: C.c35 }]}>
            By creating an account you agree to our{' '}
            <Text style={{ color: C.vivid, fontWeight: '600' }}>Terms</Text>
            {' '}and{' '}
            <Text style={{ color: C.vivid, fontWeight: '600' }}>Privacy Policy</Text>
          </Text>

          {/* CTA */}
          <TouchableOpacity
            style={[s.btn, sending && { opacity: 0.7 }]}
            onPress={handleNext}
            disabled={sending}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={[C.vivid, '#B82838']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.btnGrad}
            >
              {sending
                ? <ActivityIndicator color="white" />
                : <>
                    <Text style={s.btnTxt}>Continue</Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                  </>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign in link */}
          <View style={s.signInRow}>
            <Text style={[s.signInTxt, { color: C.c35 }]}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.75}>
              <Text style={[s.signInLink, { color: C.vivid }]}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1 },
  topBar:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Progress
  progress:    { flexDirection: 'row', gap: 6 },
  progressDot: { width: 26, height: 4, borderRadius: 2 },

  body:     { paddingHorizontal: 26, paddingTop: 12, paddingBottom: 40 },

  // Brand
  logoRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
  logoGrad: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  brand:    { fontSize: 28, fontWeight: '900', letterSpacing: -1 },

  // Headline
  title:    { fontSize: 32, fontWeight: '900', letterSpacing: -1, lineHeight: 38, marginBottom: 8 },
  sub:      { fontSize: 14, lineHeight: 22, marginBottom: 28 },

  // Fields
  nameRow:    { flexDirection: 'row', gap: 12, marginBottom: 18 },
  fieldWrap:  { marginBottom: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14 },
  input:      { flex: 1, fontSize: 15 },
  errorTxt:   { fontSize: 12, color: '#FF3B30', fontWeight: '600', marginTop: 5 },

  terms:    { fontSize: 12, lineHeight: 19, textAlign: 'center', marginBottom: 22 },

  // CTA
  btn:     { borderRadius: 16, overflow: 'hidden', marginBottom: 22 },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
  btnTxt:  { fontSize: 16, fontWeight: '800', color: 'white', letterSpacing: 0.2 },

  // Sign in
  signInRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  signInTxt:  { fontSize: 14 },
  signInLink: { fontSize: 14, fontWeight: '700' },
});
