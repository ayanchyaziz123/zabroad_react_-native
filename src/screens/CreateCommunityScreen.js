import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView, Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

const CATEGORIES = ['South Asian', 'African', 'Latino', 'East Asian', 'Middle East', 'European', 'Caribbean', 'Mixed'];

const FLAG_OPTIONS = ['🌍', '🇧🇩', '🇮🇳', '🇵🇰', '🇳🇬', '🇪🇹', '🇲🇽', '🇨🇴', '🇨🇳', '🇰🇷', '🇯🇵', '🇵🇭', '🇸🇦', '🇪🇬', '🇧🇷', '🇵🇹', '🇫🇷', '🇩🇪', '🇬🇧', '🇺🇸'];

const PRIVACY_OPTIONS = [
  { key: 'public',   icon: '🌐', label: 'Public',   sub: 'Anyone can find and join' },
  { key: 'approval', icon: '🔒', label: 'Approval', sub: 'Members need your approval' },
  { key: 'invite',   icon: '✉️',  label: 'Invite Only', sub: 'Only invited people can join' },
];

const TOPIC_TAGS = ['Jobs', 'Housing', 'Visa', 'Culture', 'Food', 'Events', 'Healthcare', 'Legal', 'Education', 'Religion', 'Family', 'Business'];

const STEPS = ['Basics', 'Details', 'Privacy', 'Preview'];

export default function CreateCommunityScreen({ navigation }) {
  const { colors: C, isDark } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const [step, setStep] = useState(0);

  // Step 0 – Basics
  const [name,     setName]     = useState('');
  const [flag,     setFlag]     = useState('🌍');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');

  // Step 1 – Details
  const [description, setDescription] = useState('');
  const [tags,        setTags]        = useState([]);
  const [rules,       setRules]       = useState(['Be respectful to all members', '']);

  // Step 2 – Privacy
  const [privacy,     setPrivacy]     = useState('public');
  const [maxMembers,  setMaxMembers]  = useState('');

  // Submission
  const [submitted,   setSubmitted]   = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  // Validation per step
  const canNext = [
    name.trim().length >= 3 && category !== '' && location.trim().length >= 2,
    description.trim().length >= 20 && tags.length >= 1,
    true,
    true,
  ][step];

  function nextStep() {
    if (step < STEPS.length - 1) setStep(s => s + 1);
  }

  function prevStep() {
    if (step > 0) setStep(s => s - 1);
  }

  function toggleTag(t) {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function updateRule(i, val) {
    setRules(prev => prev.map((r, idx) => idx === i ? val : r));
  }

  function addRule() {
    if (rules.length < 8) setRules(prev => [...prev, '']);
  }

  function removeRule(i) {
    setRules(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleCreate() {
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
          <LinearGradient colors={isDark ? ['#0F2D1E', '#0D0F1A'] : ['#D1FAE5', '#F0FDF4']} style={s.successGrad}>
            <Text style={{ fontSize: 64 }}>{flag}</Text>
            <Text style={s.successTitle}>Community Created! 🎉</Text>
            <Text style={s.successName}>{name}</Text>
            <Text style={s.successSub}>Your community is live. Share it with others to grow your network.</Text>
            <View style={s.successStats}>
              <View style={s.successStat}>
                <Text style={s.successStatVal}>1</Text>
                <Text style={s.successStatLabel}>Member</Text>
              </View>
              <View style={s.successStat}>
                <Text style={s.successStatVal}>{privacy === 'public' ? '🌐' : privacy === 'approval' ? '🔒' : '✉️'}</Text>
                <Text style={s.successStatLabel}>{PRIVACY_OPTIONS.find(p => p.key === privacy)?.label}</Text>
              </View>
              <View style={s.successStat}>
                <Text style={s.successStatVal}>{tags.length}</Text>
                <Text style={s.successStatLabel}>Topics</Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.successBtn}
              onPress={() => navigation.navigate('CommunityDetail', {
                community: { flag, name, loc: location, members: '1', tags, joined: true, description, privacy }
              })}
              activeOpacity={0.85}
            >
              <Text style={s.successBtnTxt}>Open Community →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Community')} style={{ marginTop: 10 }}>
              <Text style={[s.successBtnTxt, { color: C.c35, fontSize: 13 }]}>Back to Communities</Text>
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
        <TouchableOpacity style={s.back} onPress={step === 0 ? () => navigation.goBack() : prevStep}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Create Community</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Step progress */}
      <View style={s.progressRow}>
        {STEPS.map((label, i) => (
          <View key={label} style={s.progressItem}>
            <View style={[s.progressDot, i <= step && s.progressDotActive, i < step && s.progressDotDone]}>
              {i < step
                ? <Text style={s.progressCheck}>✓</Text>
                : <Text style={[s.progressNum, i === step && { color: C.vivid }]}>{i + 1}</Text>
              }
            </View>
            <Text style={[s.progressLabel, i === step && { color: C.vivid }]}>{label}</Text>
          </View>
        ))}
        <View style={s.progressLine} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.scroll} contentContainerStyle={{ padding: 20, gap: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── STEP 0: BASICS ── */}
          {step === 0 && (
            <>
              {/* Flag picker */}
              <View style={s.section}>
                <Text style={s.sectionLabel}>COMMUNITY ICON</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {FLAG_OPTIONS.map(f => (
                    <TouchableOpacity
                      key={f}
                      style={[s.flagPill, flag === f && s.flagPillActive]}
                      onPress={() => setFlag(f)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 24 }}>{f}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Name */}
              <View style={s.section}>
                <Text style={s.sectionLabel}>COMMUNITY NAME *</Text>
                <TextInput
                  style={[s.input, name.length > 0 && name.trim().length < 3 && s.inputError]}
                  placeholder="e.g. NYC Bangladeshi Network"
                  placeholderTextColor={C.c35}
                  value={name}
                  onChangeText={setName}
                  maxLength={60}
                />
                <Text style={s.charCount}>{name.length}/60</Text>
                {name.length > 0 && name.trim().length < 3 && (
                  <Text style={s.errorTxt}>Name must be at least 3 characters</Text>
                )}
              </View>

              {/* Category */}
              <View style={s.section}>
                <Text style={s.sectionLabel}>CULTURAL CATEGORY *</Text>
                <View style={s.pillGrid}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[s.selectPill, category === c && s.selectPillActive]}
                      onPress={() => setCategory(c)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.selectPillTxt, category === c && { color: C.vivid, fontWeight: '700' }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Location */}
              <View style={s.section}>
                <Text style={s.sectionLabel}>LOCATION *</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. Queens, NY"
                  placeholderTextColor={C.c35}
                  value={location}
                  onChangeText={setLocation}
                  maxLength={80}
                />
              </View>
            </>
          )}

          {/* ── STEP 1: DETAILS ── */}
          {step === 1 && (
            <>
              {/* Description */}
              <View style={s.section}>
                <Text style={s.sectionLabel}>DESCRIPTION *</Text>
                <TextInput
                  style={[s.input, s.textArea]}
                  placeholder="What is this community about? Who is it for? What kind of support does it offer?"
                  placeholderTextColor={C.c35}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={[s.charCount, description.length < 20 && description.length > 0 && { color: C.vivid }]}>
                  {description.length}/500{description.length < 20 && description.length > 0 ? ` (${20 - description.length} more needed)` : ''}
                </Text>
              </View>

              {/* Tags */}
              <View style={s.section}>
                <Text style={s.sectionLabel}>TOPICS (pick at least 1) *</Text>
                <View style={s.pillGrid}>
                  {TOPIC_TAGS.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[s.selectPill, tags.includes(t) && s.selectPillActive]}
                      onPress={() => toggleTag(t)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.selectPillTxt, tags.includes(t) && { color: C.vivid, fontWeight: '700' }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Rules */}
              <View style={s.section}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={s.sectionLabel}>COMMUNITY RULES</Text>
                  {rules.length < 8 && (
                    <TouchableOpacity onPress={addRule}>
                      <Text style={{ fontSize: 12, color: C.vivid, fontWeight: '700' }}>+ Add rule</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ gap: 8 }}>
                  {rules.map((rule, i) => (
                    <View key={i} style={s.ruleRow}>
                      <View style={s.ruleBullet}>
                        <Text style={s.ruleBulletTxt}>{i + 1}</Text>
                      </View>
                      <TextInput
                        style={[s.input, { flex: 1, marginBottom: 0, paddingVertical: 10 }]}
                        placeholder={`Rule ${i + 1}…`}
                        placeholderTextColor={C.c35}
                        value={rule}
                        onChangeText={val => updateRule(i, val)}
                        maxLength={120}
                      />
                      {rules.length > 1 && (
                        <TouchableOpacity onPress={() => removeRule(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Text style={{ fontSize: 16, color: C.c35 }}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* ── STEP 2: PRIVACY ── */}
          {step === 2 && (
            <>
              <View style={s.section}>
                <Text style={s.sectionLabel}>WHO CAN JOIN?</Text>
                <View style={{ gap: 10 }}>
                  {PRIVACY_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[s.privacyCard, privacy === opt.key && s.privacyCardActive]}
                      onPress={() => setPrivacy(opt.key)}
                      activeOpacity={0.8}
                    >
                      <View style={[s.privacyIcon, privacy === opt.key && { backgroundColor: C.vividD }]}>
                        <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.privacyLabel, privacy === opt.key && { color: C.vivid }]}>{opt.label}</Text>
                        <Text style={s.privacySub}>{opt.sub}</Text>
                      </View>
                      <View style={[s.radio, privacy === opt.key && s.radioActive]}>
                        {privacy === opt.key && <View style={s.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.section}>
                <Text style={s.sectionLabel}>MAX MEMBERS (optional)</Text>
                <TextInput
                  style={s.input}
                  placeholder="Leave blank for unlimited"
                  placeholderTextColor={C.c35}
                  value={maxMembers}
                  onChangeText={setMaxMembers}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            </>
          )}

          {/* ── STEP 3: PREVIEW ── */}
          {step === 3 && (
            <>
              <Text style={s.sectionLabel}>PREVIEW</Text>
              {/* Community card preview */}
              <View style={s.previewCard}>
                <LinearGradient
                  colors={isDark ? ['#1E2438', '#111627'] : ['#EEF0FA', '#E4E7F5']}
                  style={s.previewBanner}
                >
                  <Text style={{ fontSize: 44 }}>{flag}</Text>
                  <View style={s.memberBadge}>
                    <Text style={s.memberTxt}>👥 1</Text>
                  </View>
                </LinearGradient>
                <View style={{ padding: 14 }}>
                  <Text style={s.previewName}>{name || 'Community Name'}</Text>
                  <Text style={s.previewLoc}>📍 {location || 'Location'}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {tags.slice(0, 3).map(t => (
                      <View key={t} style={s.previewTag}>
                        <Text style={s.previewTagTxt}>{t}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={s.previewJoinBtn}>
                    <Text style={[s.previewJoinTxt, { color: C.vivid }]}>+ Join Community</Text>
                  </View>
                </View>
              </View>

              {/* Summary */}
              <View style={s.summaryCard}>
                {[
                  { label: 'Category',    val: category },
                  { label: 'Privacy',     val: PRIVACY_OPTIONS.find(p => p.key === privacy)?.label },
                  { label: 'Topics',      val: tags.join(', ') || '—' },
                  { label: 'Max members', val: maxMembers || 'Unlimited' },
                ].map(row => (
                  <View key={row.label} style={s.summaryRow}>
                    <Text style={s.summaryLabel}>{row.label}</Text>
                    <Text style={s.summaryVal} numberOfLines={1}>{row.val}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Bottom padding for button */}
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom CTA */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={[s.nextBtn, !canNext && s.nextBtnDisabled]}
          onPress={step === STEPS.length - 1 ? handleCreate : nextStep}
          disabled={!canNext}
          activeOpacity={0.85}
        >
          <Text style={s.nextBtnTxt}>
            {step === STEPS.length - 1 ? '🚀 Create Community' : `Continue → ${STEPS[step + 1]}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.nav },
  back: { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 24, color: C.cream, lineHeight: 28 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.cream },
  progressRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14, backgroundColor: C.nav, borderBottomWidth: 1, borderBottomColor: C.border, position: 'relative' },
  progressLine: { position: 'absolute', top: 28, left: 44, right: 44, height: 1, backgroundColor: C.border },
  progressItem: { alignItems: 'center', gap: 4, zIndex: 1 },
  progressDot: { width: 28, height: 28, borderRadius: 9, backgroundColor: C.card, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  progressDotActive: { borderColor: C.vivid, backgroundColor: C.vividD },
  progressDotDone: { backgroundColor: C.greenD, borderColor: C.green + '66' },
  progressNum: { fontSize: 11, fontWeight: '800', color: C.c35 },
  progressCheck: { fontSize: 11, fontWeight: '800', color: C.green },
  progressLabel: { fontSize: 9, fontWeight: '700', color: C.c35, letterSpacing: 0.5 },
  scroll: { flex: 1 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5 },
  input: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: C.cream, marginBottom: 2 },
  inputError: { borderColor: C.vivid + '88' },
  textArea: { minHeight: 110, paddingTop: 12 },
  charCount: { fontSize: 10, color: C.c35, textAlign: 'right' },
  errorTxt: { fontSize: 11, color: C.vivid },
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  flagPill: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  flagPillActive: { borderColor: C.vivid, backgroundColor: C.vividD, borderWidth: 2 },
  selectPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  selectPillActive: { backgroundColor: C.vividD, borderColor: C.vivid + '55' },
  selectPillTxt: { fontSize: 12, color: C.c35, fontWeight: '600' },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleBullet: { width: 26, height: 26, borderRadius: 8, backgroundColor: C.vividD, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  ruleBulletTxt: { fontSize: 10, fontWeight: '800', color: C.vivid },
  privacyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14 },
  privacyCardActive: { borderColor: C.vivid + '66', backgroundColor: C.vividD },
  privacyIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  privacyLabel: { fontSize: 14, fontWeight: '700', color: C.cream, marginBottom: 2 },
  privacySub: { fontSize: 11, color: C.c35 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: C.vivid },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.vivid },
  previewCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, overflow: 'hidden' },
  previewBanner: { height: 100, alignItems: 'center', justifyContent: 'center' },
  memberBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3 },
  memberTxt: { fontSize: 10, color: '#fff', fontWeight: '600' },
  previewName: { fontSize: 16, fontWeight: '800', color: C.cream, marginBottom: 4 },
  previewLoc: { fontSize: 12, color: C.c35, marginBottom: 10 },
  previewTag: { backgroundColor: C.blueD, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3 },
  previewTagTxt: { fontSize: 10, color: C.blue, fontWeight: '600' },
  previewJoinBtn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, backgroundColor: C.vividD, borderColor: C.vivid + '44' },
  previewJoinTxt: { fontSize: 13, fontWeight: '700' },
  summaryCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: 'hidden' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  summaryLabel: { fontSize: 12, color: C.c35, fontWeight: '600' },
  summaryVal: { fontSize: 13, color: C.cream, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  bottomBar: { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.nav },
  nextBtn: { backgroundColor: C.vivid, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: C.vivid, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  nextBtnDisabled: { backgroundColor: C.card, shadowOpacity: 0 },
  nextBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
  successWrap: { flex: 1, padding: 20 },
  successGrad: { flex: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 12, borderWidth: 1, borderColor: C.green + '33' },
  successTitle: { fontSize: 22, fontWeight: '900', color: C.cream },
  successName: { fontSize: 17, fontWeight: '700', color: C.cream },
  successSub: { fontSize: 13, color: C.c35, textAlign: 'center', lineHeight: 20 },
  successStats: { flexDirection: 'row', gap: 20, marginVertical: 8 },
  successStat: { alignItems: 'center', gap: 2 },
  successStatVal: { fontSize: 20, fontWeight: '800', color: C.cream },
  successStatLabel: { fontSize: 11, color: C.c35 },
  successBtn: { backgroundColor: C.vivid, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50, marginTop: 8 },
  successBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
