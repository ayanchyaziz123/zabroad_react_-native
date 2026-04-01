import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

// ─── Field lives OUTSIDE so it never re-mounts on keystroke ───────────────────
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
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
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
// ─────────────────────────────────────────────────────────────────────────────

export default function SignUpScreen({ navigation }) {
  const { colors: C } = useTheme();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors,   setErrors]   = useState({});
  const emailRef = useRef(null);
  const passRef  = useRef(null);

  const validate = () => {
    const e = {};
    if (!name.trim())         e.name     = 'Full name is required';
    if (!email.includes('@')) e.email    = 'Enter a valid email';
    if (password.length < 6)  e.password = 'Password must be 6+ characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) navigation.navigate('FromCountry', { name, email, password });
  };

  const strengthColor = password.length >= 10 ? C.green : password.length >= 6 ? C.gold : C.vivid;

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
              <View key={i} style={[styles.progressDot, { backgroundColor: i === 0 ? C.vivid : C.border }]} />
            ))}
          </View>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.step, { color: C.vivid }]}>Step 1 of 4</Text>
          <Text style={[styles.title, { color: C.cream }]}>Create your{'\n'}account</Text>
          <Text style={[styles.sub, { color: C.c35 }]}>Join 50,000+ immigrants building a better life abroad</Text>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            {[{ icon: '🍎', label: 'Apple' }, { icon: '🔵', label: 'Google' }].map((s, i) => (
              <TouchableOpacity key={i} style={[styles.socialBtn, { backgroundColor: C.card, borderColor: C.border }]} activeOpacity={0.8}>
                <Text style={{ fontSize: 18 }}>{s.icon}</Text>
                <Text style={[styles.socialTxt, { color: C.cream }]}>Continue with {s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.divLine, { backgroundColor: C.border }]} />
            <Text style={[styles.divTxt, { color: C.c35 }]}>or with email</Text>
            <View style={[styles.divLine, { backgroundColor: C.border }]} />
          </View>

          {/* Fields — pass C as prop, no re-mounting */}
          <Field
            C={C} label="Full Name" value={name} onChange={setName}
            placeholder="Azizur Rahman" next={emailRef} error={errors.name}
          />
          <Field
            C={C} label="Email Address" value={email} onChange={setEmail}
            placeholder="you@email.com" inputRef={emailRef} next={passRef}
            keyboardType="email-address" error={errors.email}
          />
          <Field
            C={C} label="Password" value={password} onChange={setPassword}
            placeholder="Min. 6 characters" secure showPass={showPass}
            onTogglePass={() => setShowPass(p => !p)} inputRef={passRef}
            error={errors.password}
          />

          {/* Strength bar */}
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              {[2, 4, 7, 10].map((threshold, i) => (
                <View key={i} style={[styles.strengthBar, { backgroundColor: password.length >= threshold ? strengthColor : C.border }]} />
              ))}
              <Text style={[styles.strengthTxt, { color: C.c35 }]}>
                {password.length < 6 ? 'Too short' : password.length < 10 ? 'Good' : 'Strong 💪'}
              </Text>
            </View>
          )}

          <Text style={[styles.terms, { color: C.c35 }]}>
            By creating an account you agree to our{' '}
            <Text style={{ color: C.vivid }}>Terms</Text> and{' '}
            <Text style={{ color: C.vivid }}>Privacy Policy</Text>
          </Text>
        </ScrollView>

        {/* Next */}
        <View style={[styles.footer, { borderTopColor: C.border }]}>
          <TouchableOpacity onPress={handleNext} activeOpacity={0.88} style={styles.nextBtn}>
            <LinearGradient colors={[C.vivid, '#B82838']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextGrad}>
              <Text style={styles.nextTxt}>Continue</Text>
              <Text style={{ fontSize: 16, color: 'white' }}>→</Text>
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
  progress: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 28, height: 4, borderRadius: 2 },
  body: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20 },
  step: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: -1, lineHeight: 38, marginBottom: 8 },
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
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8, marginBottom: 16 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthTxt: { fontSize: 11, fontWeight: '600' },
  terms: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 },
  footer: { paddingHorizontal: 24, paddingVertical: 12, borderTopWidth: 1 },
  nextBtn: { borderRadius: 18, overflow: 'hidden' },
  nextGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  nextTxt: { fontSize: 16, fontWeight: '800', color: 'white' },
});
