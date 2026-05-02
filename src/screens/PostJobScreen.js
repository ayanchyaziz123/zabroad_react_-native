import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, Animated, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { G_PRIMARY, G_SUCCESS, BRAND } from '../theme/colors';
import { useJobsStore } from '../store/jobsStore';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';

const PLANS = [
  {
    key: 'free',
    label: 'Basic',
    price: 'Free',
    color: null,
    features: [
      'Active for 7 days',
      'Community feed visibility',
      'No credit card needed',
    ],
  },
  {
    key: 'standard',
    label: 'Standard',
    price: '$4.99',
    color: '#F5A623',
    badge: 'Popular',
    features: [
      'Active for 30 days',
      'Priority placement in feed',
      'Hot badge on your card',
      'One-time payment',
    ],
  },
  {
    key: 'premium',
    label: 'Premium',
    price: '$9.99',
    color: '#9B72EF',
    features: [
      'Active for 60 days',
      'Featured at top of feed',
      'Hot badge + highlighted card',
      'One-time payment',
    ],
  },
];

export default function PostJobScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const { user: authUser } = useAuthStore();
  const addJob             = useJobsStore(s => s.addJob);
  const api                = useAuthStore(s => s.api);
  const locCity            = useLocationStore(s => s.city);
  const locLat             = useLocationStore(s => s.latitude);
  const locLng             = useLocationStore(s => s.longitude);

  const [paying,      setPaying]      = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [cardNumber,  setCardNumber]  = useState('');
  const [expiry,      setExpiry]      = useState('');
  const [cvv,         setCvv]         = useState('');
  const [cardName,    setCardName]    = useState('');

  const [title,    setTitle]    = useState('');
  const [company,  setCompany]  = useState('');
  const [location, setLocation] = useState('');
  const [desc,     setDesc]     = useState('');
  const [plan,     setPlan]     = useState('free');

  const [submitted, setSubmitted] = useState(false);
  const successScale   = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  // Pre-fill location from device GPS on mount
  useEffect(() => {
    if (locCity && !location) setLocation(locCity);
  }, [locCity]);

  const canPost = title.trim().length > 2 && company.trim().length > 1 && location.trim().length > 1 && desc.trim().length >= 20;

  async function postJob() {
    await addJob({
      title,
      company,
      location,
      latitude:    locLat,
      longitude:   locLng,
      desc,
      plan,
      homeCountry: authUser?.profile?.home_country || '',
      countryFlag: authUser?.profile?.country_flag || '🌍',
      postedFrom:  authUser?.profile?.lives_in     || '',
    });
    setSubmitted(true);
    Animated.parallel([
      Animated.spring(successScale,   { toValue: 1, useNativeDriver: true, bounciness: 14, speed: 8 }),
      Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }

  function handlePost() {
    if (plan === 'free') {
      postJob().catch(() => alert('Failed to post job. Please try again.'));
    } else {
      setCardName(authUser ? `${authUser.first_name} ${authUser.last_name}`.trim() : '');
      setShowPayment(true);
    }
  }

  async function handlePay() {
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard.length < 16 || expiry.length < 5 || cvv.length < 3 || !cardName.trim()) {
      alert('Please fill in all card details.');
      return;
    }
    setPaying(true);
    try {
      // Create payment intent on backend
      await api('/jobs/payment-intent/', { method: 'POST', body: { plan } });
      // Payment intent created — post the job
      setShowPayment(false);
      await postJob();
    } catch (e) {
      alert(e.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  function formatCardNumber(val) {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(val) {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    return clean.length >= 3 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    const activePlan = PLANS.find(p => p.key === plan);
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <Animated.View style={[s.successWrap, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
          <View style={[s.successCard, { backgroundColor: C.card, borderColor: C.green + '44' }]}>
            <View style={[s.successIcon, { backgroundColor: C.greenD }]}>
              <Ionicons name="briefcase" size={36} color={C.green} />
            </View>
            <Text style={s.successTitle}>Job Posted!</Text>
            <Text style={s.successJobTitle}>{title}</Text>
            <Text style={s.successSub}>{company} · {location}</Text>
            <View style={[s.successPlanBadge, { backgroundColor: (activePlan.color || C.green) + '22', borderColor: (activePlan.color || C.green) + '55' }]}>
              <Ionicons name="checkmark-circle" size={13} color={activePlan.color || C.green} />
              <Text style={[s.successPlanTxt, { color: activePlan.color || C.green }]}>{activePlan.label} Plan · {activePlan.price}</Text>
            </View>
            <Text style={s.successNote}>Your listing is now visible to your community.</Text>
            <TouchableOpacity style={s.doneBtnWrap} onPress={() => navigation.navigate('Jobs')} activeOpacity={0.85}>
              <LinearGradient colors={G_SUCCESS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.doneBtnInner}>
                <Ionicons name="checkmark-circle" size={18} color="white" />
                <Text style={s.doneBtnTxt}>View Listings</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSubmitted(false); setTitle(''); setCompany(''); setLocation(''); setDesc(''); setPlan('free'); }} style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 13, color: C.c35, fontWeight: '600' }}>Post another job</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Share a Job</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={s.form}>

          {/* Job Title */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>JOB TITLE *</Text>
            <View style={s.inputRow}>
              <Ionicons name="briefcase-outline" size={16} color={C.c35} />
              <TextInput
                style={s.input}
                placeholder="e.g. Waiter, Driver, Cashier…"
                placeholderTextColor={C.c35}
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>

          {/* Company */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>COMPANY / EMPLOYER *</Text>
            <View style={s.inputRow}>
              <Ionicons name="business-outline" size={16} color={C.c35} />
              <TextInput
                style={s.input}
                placeholder="e.g. Tandoori Nights, Self-employed…"
                placeholderTextColor={C.c35}
                value={company}
                onChangeText={setCompany}
              />
            </View>
          </View>

          {/* Location */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>LOCATION *</Text>
            <View style={s.inputRow}>
              <Ionicons name="location-outline" size={16} color={C.c35} />
              <TextInput
                style={s.input}
                placeholder="e.g. Jackson Heights, NY"
                placeholderTextColor={C.c35}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* Description */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>DESCRIPTION *</Text>
            <TextInput
              style={s.textArea}
              placeholder="Describe the role, hours, pay, who to contact, and any requirements…"
              placeholderTextColor={C.c35}
              value={desc}
              onChangeText={setDesc}
              multiline
              textAlignVertical="top"
            />
            <Text style={[s.charCount, { color: desc.length >= 20 ? C.green : C.c35 }]}>
              {desc.length} chars {desc.length < 20 && desc.length > 0 ? `· ${20 - desc.length} more needed` : desc.length >= 20 ? '· Looks good' : ''}
            </Text>
          </View>

          {/* Plans */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>LISTING PLAN</Text>
            <View style={s.plansCol}>
              {PLANS.map(p => {
                const active  = plan === p.key;
                const accent  = p.color || C.green;
                const accentD = p.color ? p.color + '18' : C.greenD;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[s.planCard, active && { borderColor: accent, backgroundColor: accentD }]}
                    onPress={() => setPlan(p.key)}
                    activeOpacity={0.85}
                  >
                    {/* Plan header */}
                    <View style={s.planHeader}>
                      <View style={s.planLeft}>
                        <View style={[s.planRadio, active && { borderColor: accent, backgroundColor: accent }]}>
                          {active && <Ionicons name="checkmark" size={11} color="white" />}
                        </View>
                        <Text style={[s.planLabel, active && { color: accent }]}>{p.label}</Text>
                        {p.badge && (
                          <View style={[s.planBadge, { backgroundColor: accent + '22', borderColor: accent + '55' }]}>
                            <Text style={[s.planBadgeTxt, { color: accent }]}>{p.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[s.planPrice, active && { color: accent }]}>{p.price}</Text>
                    </View>

                    {/* Features */}
                    <View style={s.featuresCol}>
                      {p.features.map(f => (
                        <View key={f} style={s.featureRow}>
                          <Ionicons name="checkmark-circle" size={13} color={active ? accent : C.c35} />
                          <Text style={[s.featureTxt, active && { color: C.cream }]}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Post button */}
      <View style={s.footer}>
        <View style={s.postBtnShadow}>
          <TouchableOpacity style={s.postBtnTap} onPress={handlePost} disabled={!canPost} activeOpacity={0.85}>
            {canPost ? (
              <LinearGradient colors={G_PRIMARY} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.postBtnInner}>
                <Ionicons name="paper-plane" size={16} color="white" />
                <Text style={s.postBtnTxt}>
                  {plan === 'free' ? 'Post Job — Free' : `Post Job — ${PLANS.find(p => p.key === plan).price}`}
                </Text>
              </LinearGradient>
            ) : (
              <View style={[s.postBtnInner, s.postBtnOff]}>
                <Ionicons name="paper-plane" size={16} color={C.c35} />
                <Text style={[s.postBtnTxt, { color: C.c35 }]}>
                  {plan === 'free' ? 'Post Job — Free' : `Post Job — ${PLANS.find(p => p.key === plan).price}`}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Modal */}
      <Modal visible={showPayment} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: C.card }]}>

            {/* Modal header */}
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>Card Details</Text>
                <Text style={s.modalSub}>
                  {PLANS.find(p => p.key === plan)?.label} · {PLANS.find(p => p.key === plan)?.price} one-time
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowPayment(false)} style={[s.modalClose, { backgroundColor: C.card2 }]}>
                <Ionicons name="close" size={18} color={C.cream} />
              </TouchableOpacity>
            </View>

            {/* Card icon row */}
            <View style={s.cardIcons}>
              {['card', 'card-outline', 'wallet-outline'].map((ic, i) => (
                <View key={i} style={[s.cardIconWrap, { backgroundColor: C.card2, borderColor: C.border }]}>
                  <Ionicons name={ic} size={18} color={C.c35} />
                </View>
              ))}
            </View>

            {/* Cardholder name */}
            <View style={s.payFieldGroup}>
              <Text style={s.payLabel}>CARDHOLDER NAME</Text>
              <View style={[s.payInputRow, { backgroundColor: C.card2, borderColor: C.border }]}>
                <Ionicons name="person-outline" size={15} color={C.c35} />
                <TextInput
                  style={[s.payInput, { color: C.cream }]}
                  placeholder="Name on card"
                  placeholderTextColor={C.c35}
                  value={cardName}
                  onChangeText={setCardName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Card number */}
            <View style={s.payFieldGroup}>
              <Text style={s.payLabel}>CARD NUMBER</Text>
              <View style={[s.payInputRow, { backgroundColor: C.card2, borderColor: C.border }]}>
                <Ionicons name="card-outline" size={15} color={C.c35} />
                <TextInput
                  style={[s.payInput, { color: C.cream }]}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor={C.c35}
                  value={cardNumber}
                  onChangeText={v => setCardNumber(formatCardNumber(v))}
                  keyboardType="number-pad"
                  maxLength={19}
                />
              </View>
            </View>

            {/* Expiry + CVV */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[s.payFieldGroup, { flex: 1 }]}>
                <Text style={s.payLabel}>EXPIRY</Text>
                <View style={[s.payInputRow, { backgroundColor: C.card2, borderColor: C.border }]}>
                  <Ionicons name="calendar-outline" size={15} color={C.c35} />
                  <TextInput
                    style={[s.payInput, { color: C.cream }]}
                    placeholder="MM/YY"
                    placeholderTextColor={C.c35}
                    value={expiry}
                    onChangeText={v => setExpiry(formatExpiry(v))}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
              </View>
              <View style={[s.payFieldGroup, { flex: 1 }]}>
                <Text style={s.payLabel}>CVV</Text>
                <View style={[s.payInputRow, { backgroundColor: C.card2, borderColor: C.border }]}>
                  <Ionicons name="lock-closed-outline" size={15} color={C.c35} />
                  <TextInput
                    style={[s.payInput, { color: C.cream }]}
                    placeholder="•••"
                    placeholderTextColor={C.c35}
                    value={cvv}
                    onChangeText={v => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    secureTextEntry
                    maxLength={4}
                  />
                </View>
              </View>
            </View>

            {/* Pay button */}
            <View style={[s.payBtnShadow, paying && { opacity: 0.7 }]}>
              <TouchableOpacity style={s.payBtnTap} onPress={handlePay} disabled={paying} activeOpacity={0.85}>
                <LinearGradient colors={G_SUCCESS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.payBtnInner}>
                  {paying ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="lock-closed" size={15} color="white" />
                  )}
                  <Text style={s.payBtnTxt}>
                    {paying ? 'Processing…' : `Pay ${PLANS.find(p => p.key === plan)?.price}`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={s.secureRow}>
              <Ionicons name="shield-checkmark-outline" size={12} color={C.c35} />
              <Text style={s.secureTxt}>Secured · Your card info is encrypted</Text>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:{ width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: C.cream },

  form:       { padding: 20, gap: 20, paddingBottom: 40 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5 },

  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  input:      { flex: 1, fontSize: 14, color: C.cream },

  textArea:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: C.cream, minHeight: 120, textAlignVertical: 'top' },
  charCount:  { fontSize: 11, fontWeight: '600', textAlign: 'right' },

  // Plans
  plansCol:     { gap: 10 },
  planCard:     { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14 },
  planHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  planLeft:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planRadio:    { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  planLabel:    { fontSize: 14, fontWeight: '800', color: C.cream },
  planBadge:    { borderRadius: 50, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  planBadgeTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  planPrice:    { fontSize: 16, fontWeight: '900', color: C.cream },
  featuresCol:  { gap: 6 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  featureTxt:   { fontSize: 12, color: C.c35, fontWeight: '500' },

  footer:  { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  postBtnShadow: { borderRadius: 16, shadowColor: BRAND.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  postBtnTap:    { borderRadius: 16, overflow: 'hidden' },
  postBtnInner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  postBtnOff:    { backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  postBtnTxt:    { fontSize: 15, fontWeight: '800', color: 'white' },

  // Payment modal
  modalOverlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard:     { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 16 },
  modalHeader:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  modalTitle:    { fontSize: 18, fontWeight: '800', color: C.cream, marginBottom: 2 },
  modalSub:      { fontSize: 12, color: C.c35, fontWeight: '600' },
  modalClose:    { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardIcons:     { flexDirection: 'row', gap: 8 },
  cardIconWrap:  { width: 44, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  payFieldGroup: { gap: 6 },
  payLabel:      { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5 },
  payInputRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  payInput:      { flex: 1, fontSize: 14 },
  payBtnShadow:  { borderRadius: 14, marginTop: 4, shadowColor: BRAND.teal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  payBtnTap:     { borderRadius: 14, overflow: 'hidden' },
  payBtnInner:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  payBtnTxt:     { fontSize: 15, fontWeight: '800', color: 'white' },
  secureRow:     { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', paddingBottom: 8 },
  secureTxt:     { fontSize: 11, color: C.c35, fontWeight: '500' },

  // Success
  successWrap:      { flex: 1, padding: 24, justifyContent: 'center' },
  successCard:      { borderWidth: 1, borderRadius: 24, padding: 28, alignItems: 'center', gap: 8 },
  successIcon:      { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successTitle:     { fontSize: 26, fontWeight: '900', color: C.cream, letterSpacing: -0.5 },
  successJobTitle:  { fontSize: 16, fontWeight: '700', color: C.cream },
  successSub:       { fontSize: 13, color: C.c35 },
  successPlanBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4 },
  successPlanTxt:   { fontSize: 12, fontWeight: '700' },
  successNote:      { fontSize: 13, color: C.c35, textAlign: 'center', lineHeight: 19, marginTop: 4 },
  doneBtnWrap:  { borderRadius: 50, overflow: 'hidden', marginTop: 12 },
  doneBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 13 },
  doneBtnTxt:   { fontSize: 15, fontWeight: '800', color: 'white' },
});
