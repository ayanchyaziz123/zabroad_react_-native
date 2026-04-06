import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { FontAwesome } from '@expo/vector-icons';

export default function SignUpScreen({ navigation }) {
  const { colors: C } = useTheme();

  // ── All input values in refs — zero re-renders while typing ──────────────
  const firstNameVal = useRef('');
  const lastNameVal  = useRef('');
  const emailVal     = useRef('');
  const passVal      = useRef('');
  const confVal      = useRef('');

  // ── Only UI state (doesn't affect inputs) ────────────────────────────────
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [errors,   setErrors]   = useState({});

  // ── Input element refs for focus chaining ────────────────────────────────
  const lastNameRef = useRef(null);
  const emailRef    = useRef(null);
  const passRef     = useRef(null);
  const confRef     = useRef(null);

  const validate = () => {
    const e = {};
    if (!firstNameVal.current.trim())                       e.firstName = 'First name is required';
    if (!lastNameVal.current.trim())                        e.lastName  = 'Last name is required';
    if (!emailVal.current.includes('@'))                    e.email     = 'Enter a valid email';
    if (passVal.current.length < 8)                        e.password  = 'Min. 8 characters';
    if (confVal.current !== passVal.current)               e.confirm   = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      navigation.navigate('FromCountry', {
        name:     `${firstNameVal.current.trim()} ${lastNameVal.current.trim()}`,
        email:    emailVal.current,
        password: passVal.current,
      });
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={[s.back, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => navigation.goBack()}>
            <Text style={[s.backTxt, { color: C.cream }]}>‹</Text>
          </TouchableOpacity>
          <View style={s.progress}>
            {[0,1,2,3].map(i => <View key={i} style={[s.dot, { backgroundColor: i === 0 ? C.vivid : C.border }]} />)}
          </View>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <Text style={[s.step, { color: C.vivid }]}>Step 1 of 4</Text>
          <Text style={[s.title, { color: C.cream }]}>Create your{'\n'}account</Text>
          <Text style={[s.sub, { color: C.c35 }]}>Join 50,000+ immigrants building a better life abroad</Text>

          {/* Social */}
          <View style={s.socialRow}>
            <TouchableOpacity style={[s.socialBtn, { backgroundColor: C.card, borderColor: C.border }]} activeOpacity={0.8}>
              <FontAwesome name="google" size={18} color="#DB4437" />
              <Text style={[s.socialTxt, { color: C.cream }]}>Continue with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.socialBtn, { backgroundColor: C.card, borderColor: C.border }]} activeOpacity={0.8}>
              <FontAwesome name="facebook" size={20} color="#1877F2" />
              <Text style={[s.socialTxt, { color: C.cream }]}>Continue with Facebook</Text>
            </TouchableOpacity>
          </View>

          <View style={s.divider}>
            <View style={[s.divLine, { backgroundColor: C.border }]} />
            <Text style={[s.divTxt, { color: C.c35 }]}>or with email</Text>
            <View style={[s.divLine, { backgroundColor: C.border }]} />
          </View>

          {/* First + Last name row */}
          <View style={s.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.label, { color: C.c35 }]}>First Name</Text>
              <View style={[s.box, { backgroundColor: C.card, borderColor: errors.firstName ? C.vivid : C.border }]}>
                <TextInput
                  style={[s.input, { color: C.cream }]}
                  onChangeText={v => { firstNameVal.current = v; }}
                  placeholder="Azizur"
                  placeholderTextColor={C.c35}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoComplete="given-name"
                  textContentType="givenName"
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                />
              </View>
              {errors.firstName ? <Text style={[s.err, { color: C.vivid }]}>{errors.firstName}</Text> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.label, { color: C.c35 }]}>Last Name</Text>
              <View style={[s.box, { backgroundColor: C.card, borderColor: errors.lastName ? C.vivid : C.border }]}>
                <TextInput
                  ref={lastNameRef}
                  style={[s.input, { color: C.cream }]}
                  onChangeText={v => { lastNameVal.current = v; }}
                  placeholder="Rahman"
                  placeholderTextColor={C.c35}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoComplete="family-name"
                  textContentType="familyName"
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>
              {errors.lastName ? <Text style={[s.err, { color: C.vivid }]}>{errors.lastName}</Text> : null}
            </View>
          </View>

          {/* Email */}
          <Text style={[s.label, { color: C.c35 }]}>Email Address</Text>
          <View style={[s.box, { backgroundColor: C.card, borderColor: errors.email ? C.vivid : C.border }]}>
            <TextInput
              ref={emailRef}
              style={[s.input, { color: C.cream }]}
              onChangeText={v => { emailVal.current = v; }}
              placeholder="you@email.com"
              placeholderTextColor={C.c35}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passRef.current?.focus()}
            />
          </View>
          {errors.email ? <Text style={[s.err, { color: C.vivid }]}>{errors.email}</Text> : null}

          {/* Password */}
          <Text style={[s.label, { color: C.c35 }]}>Password</Text>
          <View style={[s.box, { backgroundColor: C.card, borderColor: errors.password ? C.vivid : C.border }]}>
            <TextInput
              ref={passRef}
              style={[s.input, { color: C.cream }]}
              onChangeText={v => { passVal.current = v; }}
              placeholder="Min. 8 characters"
              placeholderTextColor={C.c35}
              secureTextEntry={!showPass}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              textContentType="none"
              returnKeyType="next"
              onSubmitEditing={() => confRef.current?.focus()}
            />
            <TouchableOpacity onPress={() => setShowPass(p => !p)} style={{ padding: 4 }}>
              <Text style={{ fontSize: 16 }}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={[s.err, { color: C.vivid }]}>{errors.password}</Text> : null}

          {/* Confirm Password */}
          <Text style={[s.label, { color: C.c35 }]}>Confirm Password</Text>
          <View style={[s.box, { backgroundColor: C.card, borderColor: errors.confirm ? C.vivid : C.border }]}>
            <TextInput
              ref={confRef}
              style={[s.input, { color: C.cream }]}
              onChangeText={v => { confVal.current = v; }}
              placeholder="Re-enter password"
              placeholderTextColor={C.c35}
              secureTextEntry={!showConf}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              textContentType="none"
              returnKeyType="done"
              onSubmitEditing={handleNext}
            />
            <TouchableOpacity onPress={() => setShowConf(p => !p)} style={{ padding: 4 }}>
              <Text style={{ fontSize: 16 }}>{showConf ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          {errors.confirm ? <Text style={[s.err, { color: C.vivid }]}>{errors.confirm}</Text> : null}

          <Text style={[s.terms, { color: C.c35 }]}>
            By creating an account you agree to our{' '}
            <Text style={{ color: C.vivid }}>Terms</Text> and{' '}
            <Text style={{ color: C.vivid }}>Privacy Policy</Text>
          </Text>

        </ScrollView>

        <View style={[s.footer, { borderTopColor: C.border }]}>
          <TouchableOpacity onPress={handleNext} activeOpacity={0.88} style={s.nextBtn}>
            <LinearGradient colors={[C.vivid, '#B82838']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.nextGrad}>
              <Text style={s.nextTxt}>Continue</Text>
              <Text style={{ fontSize: 16, color: 'white' }}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  back:      { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backTxt:   { fontSize: 24, lineHeight: 28 },
  progress:  { flexDirection: 'row', gap: 6 },
  dot:       { width: 28, height: 4, borderRadius: 2 },
  body:      { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  step:      { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title:     { fontSize: 32, fontWeight: '900', letterSpacing: -1, lineHeight: 38, marginBottom: 8 },
  sub:       { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  socialRow: { gap: 10, marginBottom: 20 },
  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  socialTxt: { fontSize: 14, fontWeight: '600' },
  divider:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  divLine:   { flex: 1, height: 1 },
  divTxt:    { fontSize: 12, fontWeight: '500' },
  nameRow:   { flexDirection: 'row', gap: 12 },
  label:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 14 },
  box:       { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  input:     { flex: 1, fontSize: 15 },
  err:       { fontSize: 11, fontWeight: '600', marginTop: 4, marginBottom: 2 },
  terms:     { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 16 },
  footer:    { paddingHorizontal: 24, paddingVertical: 12, borderTopWidth: 1 },
  nextBtn:   { borderRadius: 18, overflow: 'hidden' },
  nextGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  nextTxt:   { fontSize: 16, fontWeight: '800', color: 'white' },
});
