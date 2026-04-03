import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

const STEPS = ['About You', 'Practice', 'Availability', 'Visibility', 'Preview'];

const SUBSCRIPTION_PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    icon: '🌱',
    badge: null,
    color: '#8B8FA8',
    tagline: 'Get started at no cost',
    features: ['Basic text listing', 'Appears at bottom of results', 'External contact link only'],
    locked:   ['Profile photo', 'Verified ✓ badge', 'Priority placement', 'Message inbox', 'Booking button', 'Analytics'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 29,
    icon: '⭐',
    badge: 'Most Popular',
    color: '#5B8DEF',
    tagline: '7-day free trial · Cancel anytime',
    features: ['Profile photo', 'Verified ✓ badge', 'Priority placement in results', 'Direct message inbox from patients'],
    locked:   ['Featured at top', 'Booking button', 'Analytics dashboard'],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: 59,
    icon: '🏆',
    badge: 'Best Value',
    color: '#3EC878',
    tagline: '7-day free trial · Cancel anytime',
    features: ['Everything in Pro', 'Featured at top of results', 'In-app booking button', 'Analytics — views & contacts', 'Priority support'],
    locked:   [],
  },
];

const SPECIALTIES = [
  'Primary Care', 'Family Medicine', 'Internal Medicine', 'Pediatrics',
  'OB/GYN', 'Mental Health', 'Dentistry', 'Dermatology', 'Cardiology', 'Orthopedics',
];

const LANGUAGES = [
  'English', 'Spanish', 'Bengali', 'Hindi', 'Urdu', 'Arabic',
  'Mandarin', 'French', 'Portuguese', 'Korean',
];

const INSURANCE_OPTIONS = [
  'Medicaid', 'Medicare', 'OPT / F-1 OK', 'Uninsured OK',
  'Sliding Scale', 'Most Private Plans', 'Telehealth Available',
];

const CONSULT_MODES = [
  { key: 'in_person', icon: '🏥', label: 'In-Person Only',     sub: 'Patients visit your clinic'         },
  { key: 'telehealth', icon: '💻', label: 'Telehealth Only',   sub: 'Video / phone consultations'        },
  { key: 'both',       icon: '🤝', label: 'Both Options',      sub: 'Flexible for each patient'          },
];

const AVAIL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Field({ label, children, required }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#8B8FA8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
        {label}{required && <Text style={{ color: '#3EC878' }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

export default function ListDoctorScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  // Step 0 — About You
  const [fullName,    setFullName]    = useState('');
  const [clinic,      setClinic]      = useState('');
  const [location,    setLocation]    = useState('');
  const [email,       setEmail]       = useState('');
  const [phone,       setPhone]       = useState('');
  const [website,     setWebsite]     = useState('');
  const [npiNumber,   setNpiNumber]   = useState('');
  const [yearsExp,    setYearsExp]    = useState('');

  // Step 1 — Practice
  const [specialties,    setSpecialties]    = useState([]);
  const [languages,      setLanguages]      = useState([]);
  const [insurances,     setInsurances]     = useState([]);
  const [bio,            setBio]            = useState('');

  // Step 2 — Availability
  const [consultMode,  setConsultMode]  = useState(null);
  const [availDays,    setAvailDays]    = useState([]);
  const [responseTime, setResponseTime] = useState('');
  const [acceptsNew,   setAcceptsNew]   = useState(true);

  // Step 3 — Subscription plan
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const successScale   = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const toggle = (arr, setArr, val) =>
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const canNext = [
    fullName.trim().length > 0 && clinic.trim().length > 0 && location.trim().length > 0 && email.trim().length > 0,
    specialties.length > 0 && languages.length > 0 && bio.trim().length >= 30,
    consultMode !== null && availDays.length > 0,
    true,
    true,
  ];

  function handleSubmit() {
    setSubmitted(true);
    Animated.parallel([
      Animated.spring(successScale,   { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
      Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }

  const inputStyle = { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.cream };
  const accentColor = C.teal;

  // ── Success screen ─────────────────────────────────────────────────────
  if (submitted) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <Animated.View style={[s.successWrap, { opacity: successOpacity }]}>
          <Animated.View style={{ transform: [{ scale: successScale }], alignItems: 'center' }}>
            <LinearGradient colors={[C.teal, C.teal + 'AA']} style={s.successIcon}>
              <Text style={{ fontSize: 40 }}>🩺</Text>
            </LinearGradient>
            <Text style={s.successTitle}>Profile Submitted!</Text>
            <Text style={s.successSub}>
              We're verifying your medical license.{'\n'}Your profile will go live within 24–48 hours.
            </Text>
            <View style={[s.successCard, { borderColor: C.teal + '44' }]}>
              <Text style={[s.previewName, { color: C.teal }]}>Dr. {fullName}</Text>
              <Text style={s.previewRow}>🏥 {clinic} · {location}</Text>
              <Text style={s.previewRow}>🩺 {specialties.slice(0, 2).join(' · ')}</Text>
              <Text style={s.previewRow}>🗣 {languages.slice(0, 3).join(' · ')}</Text>
              {(() => { const p = SUBSCRIPTION_PLANS.find(pl => pl.key === selectedPlan); return p ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border }}>
                  <Text style={{ fontSize: 13 }}>{p.icon}</Text>
                  <Text style={{ fontSize: 12, color: p.color, fontWeight: '700' }}>{p.name} Plan</Text>
                  <Text style={{ fontSize: 12, color: C.c35 }}>· {p.price === 0 ? 'Free' : `$${p.price}/mo`}</Text>
                </View>
              ) : null; })()}
            </View>
            <TouchableOpacity style={[s.doneBtn, { backgroundColor: C.teal }]} onPress={() => navigation.goBack()}>
              <Text style={s.doneBtnTxt}>Done ✓</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Wizard ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => step > 0 ? setStep(s => s - 1) : navigation.goBack()} style={s.back}>
            <Text style={s.backTxt}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>List Your Practice</Text>
            <Text style={s.sub}>Step {step + 1} of {STEPS.length} · {STEPS[step]}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%`, backgroundColor: accentColor }]} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>

          {/* ── STEP 0: About You ─────────────────────────────── */}
          {step === 0 && (
            <View style={{ gap: 0 }}>
              <Text style={s.stepTitle}>About You</Text>
              <Text style={s.stepSub}>Your personal and contact information</Text>
              <Field label="Full Name" required>
                <TextInput style={inputStyle} placeholder="Dr. Jane Smith" placeholderTextColor={C.c35} value={fullName} onChangeText={setFullName} />
              </Field>
              <Field label="Clinic / Practice Name" required>
                <TextInput style={inputStyle} placeholder="e.g. Queens Family Health Center" placeholderTextColor={C.c35} value={clinic} onChangeText={setClinic} />
              </Field>
              <Field label="Location" required>
                <TextInput style={inputStyle} placeholder="e.g. Queens, NY" placeholderTextColor={C.c35} value={location} onChangeText={setLocation} />
              </Field>
              <Field label="Contact Email" required>
                <TextInput style={inputStyle} placeholder="doctor@clinic.com" placeholderTextColor={C.c35} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </Field>
              <Field label="Phone Number">
                <TextInput style={inputStyle} placeholder="+1 (718) 000-0000" placeholderTextColor={C.c35} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </Field>
              <Field label="Website">
                <TextInput style={inputStyle} placeholder="https://yourclinic.com" placeholderTextColor={C.c35} value={website} onChangeText={setWebsite} autoCapitalize="none" />
              </Field>
              <Field label="NPI Number">
                <TextInput style={inputStyle} placeholder="10-digit NPI number" placeholderTextColor={C.c35} value={npiNumber} onChangeText={setNpiNumber} keyboardType="number-pad" />
              </Field>
              <Field label="Years of Experience">
                <TextInput style={inputStyle} placeholder="e.g. 8" placeholderTextColor={C.c35} value={yearsExp} onChangeText={setYearsExp} keyboardType="number-pad" />
              </Field>
            </View>
          )}

          {/* ── STEP 1: Practice ──────────────────────────────── */}
          {step === 1 && (
            <View style={{ gap: 0 }}>
              <Text style={s.stepTitle}>Your Practice</Text>
              <Text style={s.stepSub}>Specialties, languages, and what you accept</Text>
              <Field label="Specialties" required>
                <View style={s.chipGrid}>
                  {SPECIALTIES.map(sp => {
                    const sel = specialties.includes(sp);
                    return (
                      <TouchableOpacity key={sp} style={[s.chip, sel && { backgroundColor: accentColor + '22', borderColor: accentColor + '66' }]} onPress={() => toggle(specialties, setSpecialties, sp)}>
                        <Text style={[s.chipTxt, sel && { color: accentColor, fontWeight: '700' }]}>{sp}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Field>
              <Field label="Languages Spoken" required>
                <View style={s.chipGrid}>
                  {LANGUAGES.map(lang => {
                    const sel = languages.includes(lang);
                    return (
                      <TouchableOpacity key={lang} style={[s.chip, sel && { backgroundColor: accentColor + '22', borderColor: accentColor + '66' }]} onPress={() => toggle(languages, setLanguages, lang)}>
                        <Text style={[s.chipTxt, sel && { color: accentColor, fontWeight: '700' }]}>{lang}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Field>
              <Field label="Insurance & Payment Accepted">
                <View style={s.chipGrid}>
                  {INSURANCE_OPTIONS.map(ins => {
                    const sel = insurances.includes(ins);
                    return (
                      <TouchableOpacity key={ins} style={[s.chip, sel && { backgroundColor: accentColor + '22', borderColor: accentColor + '66' }]} onPress={() => toggle(insurances, setInsurances, ins)}>
                        <Text style={[s.chipTxt, sel && { color: accentColor, fontWeight: '700' }]}>{ins}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Field>
              <Field label="About Your Practice" required>
                <TextInput
                  style={[inputStyle, { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                  placeholder="Describe your approach to patient care, immigrant-friendly services, and what makes your practice unique… (min 30 characters)"
                  placeholderTextColor={C.c35}
                  multiline
                  value={bio}
                  onChangeText={setBio}
                />
                <Text style={{ fontSize: 11, color: bio.length >= 30 ? C.teal : C.c35, marginTop: 4 }}>
                  {bio.length}/500 {bio.length >= 30 ? '✓' : `(${30 - bio.length} more to go)`}
                </Text>
              </Field>
            </View>
          )}

          {/* ── STEP 2: Availability ──────────────────────────── */}
          {step === 2 && (
            <View style={{ gap: 0 }}>
              <Text style={s.stepTitle}>Availability</Text>
              <Text style={s.stepSub}>How patients can reach and book you</Text>
              <Field label="Consultation Mode" required>
                {CONSULT_MODES.map(m => (
                  <TouchableOpacity
                    key={m.key}
                    style={[s.optionRow, consultMode === m.key && { borderColor: accentColor + '66', backgroundColor: accentColor + '11' }]}
                    onPress={() => setConsultMode(m.key)}
                  >
                    <Text style={{ fontSize: 22 }}>{m.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.optionLabel, consultMode === m.key && { color: accentColor }]}>{m.label}</Text>
                      <Text style={s.optionSub}>{m.sub}</Text>
                    </View>
                    <View style={[s.radio, consultMode === m.key && { borderColor: accentColor, backgroundColor: accentColor }]}>
                      {consultMode === m.key && <View style={s.radioDot} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </Field>
              <Field label="Available Days" required>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {AVAIL_DAYS.map(d => {
                    const sel = availDays.includes(d);
                    return (
                      <TouchableOpacity key={d} style={[s.dayPill, sel && { backgroundColor: accentColor, borderColor: accentColor }]} onPress={() => toggle(availDays, setAvailDays, d)}>
                        <Text style={[s.dayTxt, sel && { color: '#0D0F1A', fontWeight: '700' }]}>{d}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Field>
              <Field label="Avg. Response Time">
                <TextInput style={inputStyle} placeholder="e.g. Within 24 hours" placeholderTextColor={C.c35} value={responseTime} onChangeText={setResponseTime} />
              </Field>
              <Field label="Accepting New Patients">
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {[true, false].map(val => (
                    <TouchableOpacity
                      key={String(val)}
                      style={[s.chip, acceptsNew === val && { backgroundColor: accentColor + '22', borderColor: accentColor + '66' }]}
                      onPress={() => setAcceptsNew(val)}
                    >
                      <Text style={[s.chipTxt, acceptsNew === val && { color: accentColor, fontWeight: '700' }]}>{val ? 'Yes, accepting' : 'Not currently'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Field>
            </View>
          )}

          {/* ── STEP 3: Choose Plan ───────────────────────────── */}
          {step === 3 && (
            <View style={{ gap: 0 }}>
              <Text style={s.stepTitle}>Choose Your Plan</Text>
              <Text style={s.stepSub}>Upgrade anytime from your profile. All paid plans include a 7-day free trial.</Text>

              {SUBSCRIPTION_PLANS.map(plan => {
                const active = selectedPlan === plan.key;
                return (
                  <TouchableOpacity
                    key={plan.key}
                    style={[s.planCard, active && { borderColor: plan.color + '99', shadowColor: plan.color, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }]}
                    onPress={() => setSelectedPlan(plan.key)}
                    activeOpacity={0.85}
                  >
                    {/* Active background tint */}
                    {active && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: plan.color + '0D', borderRadius: 16 }]} />}

                    {/* Top row: icon + name + badge + price */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <View style={[s.planIconWrap, { backgroundColor: plan.color + '18' }]}>
                        <Text style={{ fontSize: 20 }}>{plan.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                          <Text style={[s.planName, active && { color: plan.color }]}>{plan.name}</Text>
                          {plan.badge && (
                            <View style={[s.planBadge, { backgroundColor: plan.color + '22', borderColor: plan.color + '55' }]}>
                              <Text style={[s.planBadgeTxt, { color: plan.color }]}>{plan.badge}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={s.planTagline}>{plan.tagline}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        {plan.price === 0
                          ? <Text style={[s.planPriceMain, { color: plan.color }]}>Free</Text>
                          : <><Text style={[s.planPriceMain, active && { color: plan.color }]}>${plan.price}</Text>
                             <Text style={s.planPricePer}>/mo</Text></>
                        }
                      </View>
                      <View style={[s.planRadio, active && { borderColor: plan.color, backgroundColor: plan.color }]}>
                        {active && <View style={s.planRadioDot} />}
                      </View>
                    </View>

                    {/* Features */}
                    <View style={{ gap: 5 }}>
                      {plan.features.map(f => (
                        <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 12, color: plan.color, fontWeight: '700' }}>✓</Text>
                          <Text style={{ fontSize: 12, color: C.c60 }}>{f}</Text>
                        </View>
                      ))}
                      {plan.locked.map(f => (
                        <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 12, color: C.c35 }}>✕</Text>
                          <Text style={{ fontSize: 12, color: C.c35 }}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}

              <View style={{ backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <Text style={{ fontSize: 16 }}>💡</Text>
                <Text style={{ flex: 1, fontSize: 12, color: C.c35, lineHeight: 18 }}>You can upgrade, downgrade, or cancel anytime from your profile settings. No long-term commitment.</Text>
              </View>
            </View>
          )}

          {/* ── STEP 4: Preview ───────────────────────────────── */}
          {step === 4 && (
            <View style={{ gap: 14 }}>
              <Text style={s.stepTitle}>Preview Your Profile</Text>
              <Text style={s.stepSub}>This is how you'll appear to patients</Text>

              {/* Live card preview */}
              <View style={[s.previewCard, { borderColor: accentColor + '44' }]}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
                  <View style={[s.previewAv, { backgroundColor: accentColor + '22' }]}>
                    <Text style={{ fontSize: 26 }}>👩‍⚕️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.previewName}>Dr. {fullName || 'Your Name'}</Text>
                    <Text style={s.previewRow}>{clinic || 'Clinic name'} · {location || 'Location'}</Text>
                  </View>
                  <View style={[s.previewBadge, { backgroundColor: C.goldD }]}>
                    <Text style={{ fontSize: 11, color: C.gold, fontWeight: '700' }}>★ New</Text>
                  </View>
                </View>
                <View style={{ gap: 3, paddingLeft: 4, marginBottom: 10 }}>
                  {specialties.length > 0  && <Text style={s.previewRow}>🩺 {specialties.join(' · ')}</Text>}
                  {languages.length > 0    && <Text style={s.previewRow}>🗣 {languages.join(' · ')}</Text>}
                  {insurances.length > 0   && <Text style={s.previewRow}>🛡 {insurances.join(' · ')}</Text>}
                  {location               && <Text style={s.previewRow}>📍 {location}</Text>}
                  {availDays.length > 0    && <Text style={s.previewRow}>📅 Available: {availDays.join(', ')}</Text>}
                </View>
                {bio.length > 0 && <Text style={{ fontSize: 12, color: C.c60, lineHeight: 18 }} numberOfLines={3}>{bio}</Text>}
              </View>

              {/* Summary table */}
              <View style={s.summaryCard}>
                {[
                  ['NPI Number', npiNumber || 'Not provided'],
                  ['Experience', yearsExp ? `${yearsExp} years` : 'Not provided'],
                  ['Mode', CONSULT_MODES.find(m => m.key === consultMode)?.label || '—'],
                  ['Response time', responseTime || 'Not set'],
                  ['New patients', acceptsNew ? 'Yes' : 'No'],
                ].map(([k, v]) => (
                  <View key={k} style={s.summaryRow}>
                    <Text style={s.summaryKey}>{k}</Text>
                    <Text style={s.summaryVal}>{v}</Text>
                  </View>
                ))}
              </View>

              <View style={[s.noteCard, { borderColor: accentColor + '33' }]}>
                <Text style={{ fontSize: 13, color: C.cream, fontWeight: '700', marginBottom: 4 }}>🔒 Verification</Text>
                <Text style={{ fontSize: 12, color: C.c35, lineHeight: 18 }}>We verify your NPI number and medical license before your profile goes live. This usually takes 24–48 hours.</Text>
              </View>
            </View>
          )}

        </ScrollView>

        {/* Bottom CTA */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.nextBtn, { backgroundColor: canNext[step] ? accentColor : C.card, borderWidth: canNext[step] ? 0 : 1, borderColor: C.border }]}
            onPress={() => step < STEPS.length - 1 ? setStep(s => s + 1) : handleSubmit()}
            disabled={!canNext[step]}
          >
            <Text style={[s.nextBtnTxt, { color: canNext[step] ? '#0D0F1A' : C.c35 }]}>
              {step < STEPS.length - 1
                ? step === 3
                  ? selectedPlan === 'free' ? 'Continue with Free →' : `Start Free Trial — ${SUBSCRIPTION_PLANS.find(p => p.key === selectedPlan)?.name} →`
                  : 'Continue →'
                : 'Submit Profile →'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  back:          { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backTxt:       { fontSize: 24, color: C.cream, lineHeight: 28 },
  title:         { fontSize: 17, fontWeight: '800', color: C.cream },
  sub:           { fontSize: 12, color: C.c35, marginTop: 1 },
  progressTrack: { height: 3, backgroundColor: C.border, marginHorizontal: 20, borderRadius: 2, marginBottom: 8 },
  progressFill:  { height: 3, borderRadius: 2 },
  stepTitle:     { fontSize: 22, fontWeight: '800', color: C.cream, marginBottom: 4 },
  stepSub:       { fontSize: 13, color: C.c35, marginBottom: 20, lineHeight: 18 },
  chipGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:          { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  chipTxt:       { fontSize: 12, color: C.c35, fontWeight: '500' },
  optionRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginBottom: 8 },
  optionLabel:   { fontSize: 14, fontWeight: '600', color: C.cream, marginBottom: 2 },
  optionSub:     { fontSize: 12, color: C.c35 },
  radio:         { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
  dayPill:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  dayTxt:        { fontSize: 12, color: C.c35, fontWeight: '500' },
  previewCard:   { backgroundColor: C.card, borderWidth: 1, borderRadius: 18, padding: 14 },
  previewAv:     { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  previewBadge:  { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  previewName:   { fontSize: 15, fontWeight: '800', color: C.cream, marginBottom: 2 },
  previewRow:    { fontSize: 12, color: C.c35, marginBottom: 1 },
  summaryCard:   { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  summaryKey:    { fontSize: 12, color: C.c35 },
  summaryVal:    { fontSize: 12, color: C.cream, fontWeight: '600' },
  noteCard:      { backgroundColor: C.card, borderWidth: 1, borderRadius: 14, padding: 14 },
  planCard:       { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 12, overflow: 'hidden' },
  planIconWrap:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planName:       { fontSize: 16, fontWeight: '800', color: C.cream },
  planTagline:    { fontSize: 11, color: C.c35, marginTop: 1 },
  planBadge:      { borderRadius: 50, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1 },
  planBadgeTxt:   { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  planPriceMain:  { fontSize: 20, fontWeight: '900', color: C.cream },
  planPricePer:   { fontSize: 10, color: C.c35, textAlign: 'right' },
  planRadio:      { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  planRadioDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: 'white' },
  footer:        { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  nextBtn:       { borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  nextBtnTxt:    { fontSize: 15, fontWeight: '800' },
  successWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  successIcon:   { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle:  { fontSize: 30, fontWeight: '900', color: C.cream, marginBottom: 8 },
  successSub:    { fontSize: 14, color: C.c35, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  successCard:   { alignSelf: 'stretch', backgroundColor: C.card, borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 24, gap: 4 },
  doneBtn:       { alignSelf: 'stretch', borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  doneBtnTxt:    { fontSize: 16, fontWeight: '800', color: 'white' },
});
