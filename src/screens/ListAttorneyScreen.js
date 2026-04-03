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
    locked:   ['Profile photo', 'Verified ✓ badge', 'Priority placement', 'Message inbox', 'Consultation booking', 'Featured by visa type', 'Analytics'],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 49,
    icon: '⭐',
    badge: 'Most Popular',
    color: '#9B72EF',
    tagline: '7-day free trial · Cancel anytime',
    features: ['Profile photo', 'Verified bar license ✓ badge', 'Priority placement in results', 'Direct message inbox', 'Consultation booking link'],
    locked:   ['Featured by visa type', 'Case intake form', 'Analytics dashboard'],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: 99,
    icon: '🏆',
    badge: 'Best Value',
    color: '#5B8DEF',
    tagline: '7-day free trial · Cancel anytime',
    features: ['Everything in Pro', 'Featured by visa type — appear first in H-1B, Asylum, Green Card searches', 'Case intake form before contact', 'Analytics — views, contacts & bookings', 'Priority support'],
    locked:   [],
  },
];

const VISA_AREAS = [
  'F-1 / OPT', 'H-1B', 'Green Card', 'Asylum', 'Family Visa',
  'EB-1 / O-1', 'DACA', 'Removal Defense', 'Naturalization', 'TPS',
];

const LANGUAGES = [
  'English', 'Spanish', 'Bengali', 'Hindi', 'Urdu', 'Arabic',
  'Mandarin', 'French', 'Portuguese', 'Korean',
];

const CONSULT_TYPES = [
  { key: 'free',  icon: '🆓', label: 'Free initial consult', sub: 'First 30 min at no charge' },
  { key: 'paid',  icon: '💳', label: 'Paid consultation',    sub: 'Set your own hourly rate'  },
  { key: 'both',  icon: '🤝', label: 'Both options',         sub: 'Flexible based on case'    },
];

const BAR_STATES = ['New York', 'New Jersey', 'California', 'Texas', 'Florida', 'Illinois'];

export default function ListAttorneyScreen({ navigation }) {
  const { colors: C, isDark } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const [step, setStep] = useState(0);

  // Step 0 – About
  const [fullName,  setFullName]  = useState('');
  const [firmName,  setFirmName]  = useState('');
  const [location,  setLocation]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [email,     setEmail]     = useState('');
  const [website,   setWebsite]   = useState('');
  const [barState,  setBarState]  = useState('');
  const [barNumber, setBarNumber] = useState('');
  const [yearsExp,  setYearsExp]  = useState('');

  // Step 1 – Practice
  const [areas,     setAreas]     = useState([]);
  const [languages, setLanguages] = useState(['English']);
  const [bio,       setBio]       = useState('');
  const [rate,      setRate]      = useState('');

  // Step 2 – Availability
  const [consultType, setConsultType] = useState('');
  const [freeMinutes, setFreeMinutes] = useState('30');
  const [availDays,   setAvailDays]   = useState([]);
  const [acceptsNew,  setAcceptsNew]  = useState(true);
  const [responseTime,setResponseTime]= useState('24 hours');

  // Step 3 — Subscription plan
  const [selectedPlan, setSelectedPlan] = useState('pro');

  // Submit
  const [submitted, setSubmitted] = useState(false);
  const successScale   = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const canNext = [
    fullName.trim().length >= 2 && location.trim().length >= 2 && email.includes('@') && barState !== '',
    areas.length >= 1 && bio.trim().length >= 30,
    consultType !== '',
    true, // visibility always valid (base always selected)
    true,
  ][step];

  function toggleArea(a)    { setAreas(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]); }
  function toggleLang(l)    { setLanguages(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l]); }
  function toggleDay(d)     { setAvailDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]); }

  function handleSubmit() {
    setSubmitted(true);
    Animated.parallel([
      Animated.spring(successScale,   { toValue: 1, useNativeDriver: true, bounciness: 14, speed: 8 }),
      Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }

  if (submitted) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <Animated.View style={[s.successWrap, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
          <LinearGradient colors={isDark ? ['#1A1535', '#0D0F1A'] : ['#EDE7FF', '#F5F3FF']} style={s.successCard}>
            <Text style={{ fontSize: 56 }}>⚖️</Text>
            <Text style={s.successTitle}>Profile Submitted!</Text>
            <Text style={s.successName}>{fullName || 'Attorney'}</Text>
            <Text style={s.successFirm}>{firmName || 'Private Practice'}</Text>
            <Text style={s.successSub}>Your listing is under review. We verify all attorney credentials before publishing. You'll hear from us within 24–48 hours.</Text>
            {(() => { const p = SUBSCRIPTION_PLANS.find(pl => pl.key === selectedPlan); return p ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: p.color + '18', borderRadius: 50, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: p.color + '44' }}>
                <Text style={{ fontSize: 13 }}>{p.icon}</Text>
                <Text style={{ fontSize: 12, color: p.color, fontWeight: '700' }}>{p.name} Plan</Text>
                <Text style={{ fontSize: 12, color: C.c35 }}>· {p.price === 0 ? 'Free' : `$${p.price}/mo`}</Text>
              </View>
            ) : null; })()}
            <View style={s.successStats}>
              {[
                { icon: '⚖️', val: areas.length,    label: 'Specialties' },
                { icon: '🌐', val: languages.length, label: 'Languages'  },
                { icon: consultType === 'free' ? '🆓' : '💳', val: consultType === 'free' ? 'Free' : 'Paid', label: 'Consult' },
              ].map(st => (
                <View key={st.label} style={s.successStat}>
                  <Text style={{ fontSize: 18 }}>{st.icon}</Text>
                  <Text style={s.successStatVal}>{st.val}</Text>
                  <Text style={s.successStatLabel}>{st.label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={s.successBtn} onPress={() => navigation.navigate('Attorney')} activeOpacity={0.85}>
              <Text style={s.successBtnTxt}>View Attorney Listings →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 13, color: C.c35, fontWeight: '600' }}>Back to Home</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={step === 0 ? () => navigation.goBack() : () => setStep(p => p - 1)}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>List as Attorney</Text>
          <Text style={s.headerSub}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</Text>
        </View>
        <View style={s.stepBadge}>
          <Text style={s.stepBadgeTxt}>{step + 1}/{STEPS.length}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={s.progressBg}>
        <View style={[s.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── STEP 0: ABOUT ── */}
          {step === 0 && (
            <>
              <Field label="Full Name *"       value={fullName}  onChange={setFullName}  placeholder="e.g. Priya Mehta, Esq." C={C} s={s} />
              <Field label="Law Firm / Practice" value={firmName} onChange={setFirmName} placeholder="e.g. Mehta & Associates (optional)" C={C} s={s} />
              <Field label="Office Location *" value={location}  onChange={setLocation}  placeholder="e.g. Manhattan, NY" C={C} s={s} />
              <Field label="Email Address *"   value={email}     onChange={setEmail}     placeholder="attorney@lawfirm.com" keyboard="email-address" C={C} s={s} />
              <Field label="Phone Number"      value={phone}     onChange={setPhone}     placeholder="+1 (212) 000-0000" keyboard="phone-pad" C={C} s={s} />
              <Field label="Website"           value={website}   onChange={setWebsite}   placeholder="www.yourfirm.com (optional)" C={C} s={s} />
              <Field label="Years of Experience" value={yearsExp} onChange={setYearsExp} placeholder="e.g. 8" keyboard="numeric" C={C} s={s} />

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>Bar Admission State *</Text>
                <View style={s.pillGrid}>
                  {BAR_STATES.map(st => (
                    <TouchableOpacity
                      key={st}
                      style={[s.pill, barState === st && s.pillActive]}
                      onPress={() => setBarState(st)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.pillTxt, barState === st && { color: C.purple, fontWeight: '700' }]}>{st}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Field label="Bar Number *" value={barNumber} onChange={setBarNumber} placeholder="e.g. NY-123456" C={C} s={s} />

              <View style={s.verifyNote}>
                <Text style={{ fontSize: 16 }}>🔐</Text>
                <Text style={s.verifyTxt}>All credentials are verified by our team before your profile goes live. Your bar number is never shown publicly.</Text>
              </View>
            </>
          )}

          {/* ── STEP 1: PRACTICE ── */}
          {step === 1 && (
            <>
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>AREAS OF PRACTICE * (pick at least 1)</Text>
                <View style={s.pillGrid}>
                  {VISA_AREAS.map(a => (
                    <TouchableOpacity
                      key={a}
                      style={[s.pill, areas.includes(a) && s.pillActive]}
                      onPress={() => toggleArea(a)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.pillTxt, areas.includes(a) && { color: C.purple, fontWeight: '700' }]}>{a}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>LANGUAGES SPOKEN</Text>
                <View style={s.pillGrid}>
                  {LANGUAGES.map(l => (
                    <TouchableOpacity
                      key={l}
                      style={[s.pill, languages.includes(l) && s.pillActive]}
                      onPress={() => toggleLang(l)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.pillTxt, languages.includes(l) && { color: C.purple, fontWeight: '700' }]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>BIO / ABOUT YOUR PRACTICE * (min 30 chars)</Text>
                <TextInput
                  style={[s.input, s.textArea]}
                  placeholder="Describe your experience, approach, and the clients you typically help. What makes your practice unique?"
                  placeholderTextColor={C.c35}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  maxLength={600}
                  textAlignVertical="top"
                />
                <Text style={[s.charCount, bio.length < 30 && bio.length > 0 && { color: C.vivid }]}>
                  {bio.length}/600{bio.length < 30 && bio.length > 0 ? ` · ${30 - bio.length} more` : ''}
                </Text>
              </View>

              <Field label="Hourly Rate (optional)" value={rate} onChange={setRate} placeholder="e.g. $250/hr or 'Contact for pricing'" C={C} s={s} />
            </>
          )}

          {/* ── STEP 2: AVAILABILITY ── */}
          {step === 2 && (
            <>
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>CONSULTATION TYPE *</Text>
                {CONSULT_TYPES.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[s.optionCard, consultType === opt.key && s.optionCardActive]}
                    onPress={() => setConsultType(opt.key)}
                    activeOpacity={0.8}
                  >
                    <View style={[s.optionIcon, consultType === opt.key && { backgroundColor: C.purpleD }]}>
                      <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.optionLabel, consultType === opt.key && { color: C.purple }]}>{opt.label}</Text>
                      <Text style={s.optionSub}>{opt.sub}</Text>
                    </View>
                    <View style={[s.radio, consultType === opt.key && s.radioActive]}>
                      {consultType === opt.key && <View style={s.radioDot} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {(consultType === 'free' || consultType === 'both') && (
                <View style={s.fieldGroup}>
                  <Text style={s.fieldLabel}>FREE CONSULT DURATION (MINUTES)</Text>
                  <View style={s.pillGrid}>
                    {['15', '20', '30', '45', '60'].map(m => (
                      <TouchableOpacity
                        key={m}
                        style={[s.pill, freeMinutes === m && s.pillActive]}
                        onPress={() => setFreeMinutes(m)}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.pillTxt, freeMinutes === m && { color: C.purple, fontWeight: '700' }]}>{m} min</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>AVAILABLE DAYS</Text>
                <View style={s.pillGrid}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[s.pill, availDays.includes(d) && s.pillActive]}
                      onPress={() => toggleDay(d)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.pillTxt, availDays.includes(d) && { color: C.purple, fontWeight: '700' }]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>TYPICAL RESPONSE TIME</Text>
                <View style={s.pillGrid}>
                  {['Same day', '24 hours', '48 hours', 'Within a week'].map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[s.pill, responseTime === t && s.pillActive]}
                      onPress={() => setResponseTime(t)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.pillTxt, responseTime === t && { color: C.purple, fontWeight: '700' }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>ACCEPTING NEW CLIENTS?</Text>
                <View style={s.pillGrid}>
                  {[{ label: 'Yes, open', val: true }, { label: 'Waitlist only', val: false }].map(opt => (
                    <TouchableOpacity
                      key={String(opt.val)}
                      style={[s.pill, acceptsNew === opt.val && s.pillActive]}
                      onPress={() => setAcceptsNew(opt.val)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.pillTxt, acceptsNew === opt.val && { color: C.purple, fontWeight: '700' }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* ── STEP 3: CHOOSE PLAN ── */}
          {step === 3 && (
            <>
              <Text style={s.fieldLabel}>CHOOSE YOUR PLAN</Text>
              <Text style={[s.optionSub, { marginBottom: 16 }]}>All paid plans include a 7-day free trial. Upgrade or cancel anytime.</Text>

              {SUBSCRIPTION_PLANS.map(plan => {
                const active = selectedPlan === plan.key;
                return (
                  <TouchableOpacity
                    key={plan.key}
                    style={[s.planCard, active && { borderColor: plan.color + '99', shadowColor: plan.color, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }]}
                    onPress={() => setSelectedPlan(plan.key)}
                    activeOpacity={0.85}
                  >
                    {active && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: plan.color + '0D', borderRadius: 16 }]} />}

                    {/* Top row */}
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
                        <View key={f} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                          <Text style={{ fontSize: 12, color: plan.color, fontWeight: '700', marginTop: 1 }}>✓</Text>
                          <Text style={{ fontSize: 12, color: C.c60, flex: 1 }}>{f}</Text>
                        </View>
                      ))}
                      {plan.locked.map(f => (
                        <View key={f} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                          <Text style={{ fontSize: 12, color: C.c35, marginTop: 1 }}>✕</Text>
                          <Text style={{ fontSize: 12, color: C.c35, flex: 1 }}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}

              <View style={[s.verifyNote, { marginTop: 4 }]}>
                <Text style={{ fontSize: 16 }}>💡</Text>
                <Text style={s.verifyTxt}>One new client from Zabroad typically covers months of subscription. You can upgrade or cancel anytime from your profile.</Text>
              </View>
            </>
          )}

          {/* ── STEP 4: PREVIEW ── */}
          {step === 4 && (
            <>
              <Text style={s.fieldLabel}>HOW YOUR LISTING WILL LOOK</Text>
              <View style={s.previewCard}>
                <View style={s.previewTop}>
                  <View style={s.previewAv}>
                    <Text style={{ fontSize: 28 }}>⚖️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={s.previewName}>{fullName || 'Your Name'}</Text>
                      <View style={s.verifiedBadge}><Text style={s.verifiedTxt}>✓</Text></View>
                    </View>
                    <Text style={s.previewFirm}>{firmName || 'Your Firm'} · {location || 'Location'}</Text>
                    <Text style={s.previewExp}>{yearsExp ? `${yearsExp} yrs experience` : 'Experience'} · {barState}</Text>
                  </View>
                </View>
                <View style={s.previewAreas}>
                  {areas.slice(0, 4).map(a => (
                    <View key={a} style={s.areaPill}><Text style={s.areaPillTxt}>{a}</Text></View>
                  ))}
                  {areas.length > 4 && <View style={s.areaPill}><Text style={s.areaPillTxt}>+{areas.length - 4}</Text></View>}
                </View>
                <Text style={s.previewBio} numberOfLines={3}>{bio || 'Your bio will appear here…'}</Text>
                <View style={s.previewFooter}>
                  <View style={s.previewLangs}>
                    <Text style={s.previewLangTxt}>🌐 {languages.slice(0, 3).join(', ')}</Text>
                  </View>
                  <View style={[s.previewConsult, consultType === 'free' || consultType === 'both' ? s.freeConsult : s.paidConsult]}>
                    <Text style={[s.previewConsultTxt, { color: consultType === 'free' || consultType === 'both' ? C.green : C.gold }]}>
                      {consultType === 'free' ? `🆓 Free ${freeMinutes}min consult` : consultType === 'both' ? `🆓 Free consult` : '💳 Paid consult'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Summary */}
              <View style={s.summaryCard}>
                {[
                  { label: 'Specialties',    val: areas.length > 0 ? areas.join(', ') : '—' },
                  { label: 'Languages',      val: languages.join(', ') },
                  { label: 'Consultation',   val: CONSULT_TYPES.find(c => c.key === consultType)?.label || '—' },
                  { label: 'Response time',  val: responseTime },
                  { label: 'New clients',    val: acceptsNew ? 'Accepting' : 'Waitlist' },
                  { label: 'Rate',           val: rate || 'Not specified' },
                ].map(row => (
                  <View key={row.label} style={s.summaryRow}>
                    <Text style={s.summaryLabel}>{row.label}</Text>
                    <Text style={s.summaryVal} numberOfLines={2}>{row.val}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom CTA */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.nextBtn, !canNext && s.nextBtnDisabled]}
          onPress={step === STEPS.length - 1 ? handleSubmit : () => setStep(p => p + 1)}
          disabled={!canNext}
          activeOpacity={0.85}
        >
          <Text style={s.nextBtnTxt}>
            {step === STEPS.length - 1
              ? '✅ Submit for Review'
              : step === 3
                ? selectedPlan === 'free' ? 'Continue with Free →' : `Start Free Trial — ${SUBSCRIPTION_PLANS.find(p => p.key === selectedPlan)?.name} →`
                : `Continue → ${STEPS[step + 1]}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, placeholder, keyboard = 'default', C, s }) {
  return (
    <View style={s.fieldGroup}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor={C.c35}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.nav },
  back:        { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  backTxt:     { fontSize: 24, color: C.cream, lineHeight: 28 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: C.cream },
  headerSub:   { fontSize: 11, color: C.c35, marginTop: 1 },
  stepBadge:   { backgroundColor: C.purpleD, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.purple + '44' },
  stepBadgeTxt:{ fontSize: 12, fontWeight: '700', color: C.purple },
  progressBg:  { height: 3, backgroundColor: C.border },
  progressFill:{ height: 3, backgroundColor: C.purple },
  scroll:      { flex: 1 },
  scrollContent:{ padding: 20, gap: 18 },
  fieldGroup:  { gap: 8 },
  fieldLabel:  { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5 },
  input:       { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: C.cream },
  textArea:    { minHeight: 110, paddingTop: 12, textAlignVertical: 'top' },
  charCount:   { fontSize: 10, color: C.c35, textAlign: 'right' },
  pillGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  pillActive:  { backgroundColor: C.purpleD, borderColor: C.purple + '55' },
  pillTxt:     { fontSize: 12, color: C.c35, fontWeight: '600' },
  verifyNote:  { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: C.blueD, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.blue + '33' },
  verifyTxt:   { flex: 1, fontSize: 12, color: C.c60, lineHeight: 18 },
  optionCard:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14 },
  optionCardActive: { borderColor: C.purple + '66', backgroundColor: C.purpleD },
  optionIcon:  { width: 44, height: 44, borderRadius: 14, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionLabel: { fontSize: 14, fontWeight: '700', color: C.cream, marginBottom: 2 },
  optionSub:   { fontSize: 11, color: C.c35 },
  radio:       { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: C.purple },
  radioDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: C.purple },
  previewCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 16, gap: 10 },
  previewTop:  { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  previewAv:   { width: 52, height: 52, borderRadius: 17, backgroundColor: C.purpleD, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  previewName: { fontSize: 16, fontWeight: '800', color: C.cream },
  previewFirm: { fontSize: 12, color: C.c35, marginTop: 2 },
  previewExp:  { fontSize: 11, color: C.c35, marginTop: 2 },
  verifiedBadge: { width: 16, height: 16, backgroundColor: C.green, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  verifiedTxt:   { fontSize: 9, color: '#fff', fontWeight: '800' },
  previewAreas:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  areaPill:      { backgroundColor: C.purpleD, borderRadius: 50, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1, borderColor: C.purple + '33' },
  areaPillTxt:   { fontSize: 10, color: C.purple, fontWeight: '600' },
  previewBio:    { fontSize: 13, color: C.c60, lineHeight: 19 },
  previewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewLangs:  {},
  previewLangTxt:{ fontSize: 11, color: C.c35 },
  previewConsult:{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50, borderWidth: 1 },
  freeConsult:   { backgroundColor: C.greenD, borderColor: C.green + '44' },
  paidConsult:   { backgroundColor: C.goldD, borderColor: C.gold + '44' },
  previewConsultTxt: { fontSize: 11, fontWeight: '700' },
  planCard:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 12, overflow: 'hidden' },
  planIconWrap:  { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planName:      { fontSize: 16, fontWeight: '800', color: C.cream },
  planTagline:   { fontSize: 11, color: C.c35, marginTop: 1 },
  planBadge:     { borderRadius: 50, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1 },
  planBadgeTxt:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  planPriceMain: { fontSize: 20, fontWeight: '900', color: C.cream },
  planPricePer:  { fontSize: 10, color: C.c35, textAlign: 'right' },
  planRadio:     { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  planRadioDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: 'white' },
  summaryCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: 'hidden' },
  summaryRow:  { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  summaryLabel:{ fontSize: 12, color: C.c35, fontWeight: '600' },
  summaryVal:  { fontSize: 13, color: C.cream, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  bottomBar:   { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.nav },
  nextBtn:        { backgroundColor: C.purple, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: C.purple, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  nextBtnDisabled:{ backgroundColor: C.purple, opacity: 0.35, shadowOpacity: 0, elevation: 0 },
  nextBtnTxt:     { fontSize: 15, fontWeight: '800', color: '#fff' },
  successWrap: { flex: 1, padding: 20 },
  successCard: { flex: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 10, borderWidth: 1, borderColor: C.purple + '33' },
  successTitle:{ fontSize: 22, fontWeight: '900', color: C.cream },
  successName: { fontSize: 17, fontWeight: '700', color: C.cream },
  successFirm: { fontSize: 13, color: C.c35 },
  successSub:  { fontSize: 13, color: C.c60, textAlign: 'center', lineHeight: 20, marginVertical: 4 },
  successStats:{ flexDirection: 'row', gap: 20, marginVertical: 6 },
  successStat: { alignItems: 'center', gap: 2 },
  successStatVal:  { fontSize: 16, fontWeight: '800', color: C.cream },
  successStatLabel:{ fontSize: 10, color: C.c35 },
  successBtn:  { backgroundColor: C.purple, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50, marginTop: 6 },
  successBtnTxt:{ fontSize: 14, fontWeight: '800', color: '#fff' },
});
