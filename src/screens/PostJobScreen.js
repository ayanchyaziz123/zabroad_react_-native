import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

const STEPS = ['Company', 'Role', 'Requirements', 'Preview'];

const JOB_TYPES    = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
const WORK_MODES   = ['Onsite', 'Hybrid', 'Remote'];
const VISA_SUPPORT = ['H-1B Sponsor', 'OPT / CPT', 'STEM OPT', 'TN Visa', 'Green Card Sponsor', 'No Sponsorship'];
const INDUSTRIES   = ['Technology', 'Healthcare', 'Finance', 'Education', 'Legal', 'Engineering', 'Marketing', 'Design', 'Operations', 'Other'];
const EXP_LEVELS   = ['Entry (0-1 yr)', 'Junior (1-3 yrs)', 'Mid (3-5 yrs)', 'Senior (5+ yrs)', 'Lead / Manager'];

export default function PostJobScreen({ navigation }) {
  const { colors: C, isDark } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const [step, setStep] = useState(0);

  // Step 0 – Company
  const [company,   setCompany]   = useState('');
  const [companyUrl,setCompanyUrl]= useState('');
  const [industry,  setIndustry]  = useState('');
  const [companySize,setCompanySize]=useState('');
  const [location,  setLocation]  = useState('');
  const [contactEmail,setContactEmail]=useState('');
  const [eVerify,   setEVerify]   = useState(null); // true/false

  // Step 1 – Role
  const [jobTitle,  setJobTitle]  = useState('');
  const [jobType,   setJobType]   = useState('');
  const [workMode,  setWorkMode]  = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryVisible, setSalaryVisible] = useState(true);
  const [description,setDescription]=useState('');
  const [applyUrl,  setApplyUrl]  = useState('');

  // Step 2 – Requirements
  const [visaSupport, setVisaSupport] = useState([]);
  const [expLevel,  setExpLevel]  = useState('');
  const [skills,    setSkills]    = useState('');
  const [deadline,  setDeadline]  = useState('');
  const [benefits,  setBenefits]  = useState([]);

  const BENEFITS_LIST = ['Health Insurance', 'Dental & Vision', '401(k)', 'Remote Stipend', 'Equity / Stock', 'Paid Leave', 'Visa Sponsorship Cost', 'Relocation Assistance'];

  // Submit
  const [submitted, setSubmitted] = useState(false);
  const successScale   = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const canNext = [
    company.trim().length >= 2 && industry !== '' && location.trim().length >= 2 && contactEmail.includes('@') && eVerify !== null,
    jobTitle.trim().length >= 2 && jobType !== '' && workMode !== '' && description.trim().length >= 30,
    visaSupport.length >= 1 && expLevel !== '',
    true,
  ][step];

  function toggleVisa(v)    { setVisaSupport(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]); }
  function toggleBenefit(b) { setBenefits(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b]); }

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
          <LinearGradient colors={isDark ? ['#0F2D1E', '#0D0F1A'] : ['#D1FAE5', '#F0FDF4']} style={s.successCard}>
            <Text style={{ fontSize: 56 }}>💼</Text>
            <Text style={s.successTitle}>Job Posted! 🎉</Text>
            <Text style={s.successName}>{jobTitle || 'Your Role'}</Text>
            <Text style={s.successFirm}>{company || 'Your Company'} · {location}</Text>
            <Text style={s.successSub}>Your listing is live and visible to {'\n'}50,000+ immigrant job seekers on Zabroad.</Text>
            <View style={s.successStats}>
              {[
                { icon: '💼', val: jobType,       label: 'Type'    },
                { icon: '🏢', val: workMode,      label: 'Mode'    },
                { icon: '📋', val: `${visaSupport.length}`, label: 'Visa opts' },
              ].map(st => (
                <View key={st.label} style={s.successStat}>
                  <Text style={{ fontSize: 18 }}>{st.icon}</Text>
                  <Text style={s.successStatVal}>{st.val}</Text>
                  <Text style={s.successStatLabel}>{st.label}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={s.successBtn} onPress={() => navigation.navigate('Jobs')} activeOpacity={0.85}>
              <Text style={s.successBtnTxt}>View Job Listings →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 13, color: C.c35, fontWeight: '600' }}>Post another job</Text>
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
          <Text style={s.headerTitle}>Post a Job</Text>
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

          {/* ── STEP 0: COMPANY ── */}
          {step === 0 && (
            <>
              <Field label="Company Name *"     value={company}      onChange={setCompany}      placeholder="e.g. Acme Corp" C={C} s={s} />
              <Field label="Company Website"    value={companyUrl}   onChange={setCompanyUrl}   placeholder="www.yourcompany.com" C={C} s={s} />
              <Field label="Office Location *"  value={location}     onChange={setLocation}     placeholder="e.g. Manhattan, NY" C={C} s={s} />
              <Field label="Contact Email *"    value={contactEmail} onChange={setContactEmail} placeholder="hr@yourcompany.com" keyboard="email-address" C={C} s={s} />

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>INDUSTRY *</Text>
                <View style={s.pillGrid}>
                  {INDUSTRIES.map(ind => (
                    <TouchableOpacity
                      key={ind}
                      style={[s.pill, industry === ind && s.pillActive]}
                      onPress={() => setIndustry(ind)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.pillTxt, industry === ind && { color: C.green, fontWeight: '700' }]}>{ind}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>COMPANY SIZE</Text>
                <View style={s.pillGrid}>
                  {['1-10', '11-50', '51-200', '201-500', '500+'].map(sz => (
                    <TouchableOpacity
                      key={sz}
                      style={[s.pill, companySize === sz && s.pillActive]}
                      onPress={() => setCompanySize(sz)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.pillTxt, companySize === sz && { color: C.green, fontWeight: '700' }]}>{sz} employees</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>E-VERIFY REGISTERED? *</Text>
                <Text style={s.fieldHint}>Required to hire OPT/STEM workers legally.</Text>
                <View style={s.pillGrid}>
                  {[{ label: '✅ Yes, we are E-Verify', val: true }, { label: '❌ No', val: false }].map(opt => (
                    <TouchableOpacity
                      key={String(opt.val)}
                      style={[s.pill, eVerify === opt.val && (opt.val ? s.pillActive : s.pillDanger)]}
                      onPress={() => setEVerify(opt.val)}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.pillTxt, eVerify === opt.val && { color: opt.val ? C.green : C.vivid, fontWeight: '700' }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {eVerify === false && (
                  <View style={s.warningBox}>
                    <Text style={{ fontSize: 14 }}>⚠️</Text>
                    <Text style={s.warningTxt}>Without E-Verify, you cannot legally hire F-1 OPT workers. Your listing will still be shown but marked as non-OPT-eligible.</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* ── STEP 1: ROLE ── */}
          {step === 1 && (
            <>
              <Field label="Job Title *"        value={jobTitle}     onChange={setJobTitle}     placeholder="e.g. Software Engineer" C={C} s={s} />

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>JOB TYPE *</Text>
                <View style={s.pillGrid}>
                  {JOB_TYPES.map(t => (
                    <TouchableOpacity key={t} style={[s.pill, jobType === t && s.pillActive]} onPress={() => setJobType(t)} activeOpacity={0.8}>
                      <Text style={[s.pillTxt, jobType === t && { color: C.green, fontWeight: '700' }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>WORK MODE *</Text>
                <View style={s.pillGrid}>
                  {WORK_MODES.map(m => (
                    <TouchableOpacity key={m} style={[s.pill, workMode === m && s.pillActive]} onPress={() => setWorkMode(m)} activeOpacity={0.8}>
                      <Text style={[s.pillTxt, workMode === m && { color: C.green, fontWeight: '700' }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Salary */}
              <View style={s.fieldGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={s.fieldLabel}>SALARY RANGE</Text>
                  <TouchableOpacity onPress={() => setSalaryVisible(v => !v)}>
                    <Text style={{ fontSize: 11, color: C.vivid, fontWeight: '700' }}>{salaryVisible ? 'Hide salary' : 'Show salary'}</Text>
                  </TouchableOpacity>
                </View>
                {salaryVisible && (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput style={[s.input, { flex: 1 }]} placeholder="Min ($)" placeholderTextColor={C.c35} value={salaryMin} onChangeText={setSalaryMin} keyboardType="numeric" />
                    <TextInput style={[s.input, { flex: 1 }]} placeholder="Max ($)" placeholderTextColor={C.c35} value={salaryMax} onChangeText={setSalaryMax} keyboardType="numeric" />
                  </View>
                )}
                {!salaryVisible && (
                  <View style={s.hiddenSalaryNote}>
                    <Text style={s.hiddenSalaryTxt}>💡 Jobs that show salary get 3× more applications</Text>
                  </View>
                )}
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>JOB DESCRIPTION * (min 30 chars)</Text>
                <TextInput
                  style={[s.input, s.textArea]}
                  placeholder="Describe the role, team, day-to-day responsibilities, and what you're looking for in a candidate…"
                  placeholderTextColor={C.c35}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  maxLength={2000}
                  textAlignVertical="top"
                />
                <Text style={[s.charCount, description.length < 30 && description.length > 0 && { color: C.vivid }]}>
                  {description.length}/2000{description.length < 30 && description.length > 0 ? ` · ${30 - description.length} more` : ''}
                </Text>
              </View>

              <Field label="Application Link" value={applyUrl} onChange={setApplyUrl} placeholder="careers.yourcompany.com/job (optional)" C={C} s={s} />
            </>
          )}

          {/* ── STEP 2: REQUIREMENTS ── */}
          {step === 2 && (
            <>
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>VISA / WORK AUTH SUPPORT * (pick all that apply)</Text>
                <View style={s.pillGrid}>
                  {VISA_SUPPORT.map(v => (
                    <TouchableOpacity key={v} style={[s.pill, visaSupport.includes(v) && s.pillActive]} onPress={() => toggleVisa(v)} activeOpacity={0.8}>
                      <Text style={[s.pillTxt, visaSupport.includes(v) && { color: C.green, fontWeight: '700' }]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>EXPERIENCE LEVEL *</Text>
                <View style={s.pillGrid}>
                  {EXP_LEVELS.map(e => (
                    <TouchableOpacity key={e} style={[s.pill, expLevel === e && s.pillActive]} onPress={() => setExpLevel(e)} activeOpacity={0.8}>
                      <Text style={[s.pillTxt, expLevel === e && { color: C.green, fontWeight: '700' }]}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Field label="Required Skills" value={skills} onChange={setSkills} placeholder="e.g. React, Node.js, SQL (comma separated)" C={C} s={s} />

              <Field label="Application Deadline" value={deadline} onChange={setDeadline} placeholder="e.g. April 30, 2026 (optional)" C={C} s={s} />

              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>BENEFITS OFFERED</Text>
                <View style={s.pillGrid}>
                  {BENEFITS_LIST.map(b => (
                    <TouchableOpacity key={b} style={[s.pill, benefits.includes(b) && s.pillActive]} onPress={() => toggleBenefit(b)} activeOpacity={0.8}>
                      <Text style={[s.pillTxt, benefits.includes(b) && { color: C.green, fontWeight: '700' }]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* ── STEP 3: PREVIEW ── */}
          {step === 3 && (
            <>
              <Text style={s.fieldLabel}>HOW YOUR LISTING WILL LOOK</Text>
              <View style={s.previewCard}>
                <View style={s.previewTop}>
                  <View style={s.previewLogo}>
                    <Text style={{ fontSize: 24 }}>🏢</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.previewTitle}>{jobTitle || 'Job Title'}</Text>
                    <Text style={s.previewCompany}>{company || 'Company Name'} · {location}</Text>
                  </View>
                  {eVerify && (
                    <View style={s.eVerifyBadge}><Text style={s.eVerifyTxt}>E-Verify ✓</Text></View>
                  )}
                </View>

                <View style={s.previewTags}>
                  {[jobType, workMode].filter(Boolean).map(t => (
                    <View key={t} style={s.tagPill}><Text style={s.tagPillTxt}>{t}</Text></View>
                  ))}
                  {salaryVisible && salaryMin && (
                    <View style={[s.tagPill, s.salaryPill]}>
                      <Text style={[s.tagPillTxt, { color: C.green }]}>
                        ${Number(salaryMin).toLocaleString()}{salaryMax ? `–$${Number(salaryMax).toLocaleString()}` : '+'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={s.previewVisa}>
                  {visaSupport.map(v => (
                    <View key={v} style={s.visaPill}><Text style={s.visaPillTxt}>{v}</Text></View>
                  ))}
                </View>

                <Text style={s.previewDesc} numberOfLines={3}>{description || 'Job description will appear here…'}</Text>

                {deadline ? <Text style={s.previewDeadline}>📅 Apply by {deadline}</Text> : null}
              </View>

              {/* Summary */}
              <View style={s.summaryCard}>
                {[
                  { label: 'Company',        val: company },
                  { label: 'Industry',       val: industry },
                  { label: 'Visa support',   val: visaSupport.join(', ') || '—' },
                  { label: 'Experience',     val: expLevel || '—' },
                  { label: 'Benefits',       val: benefits.length > 0 ? benefits.join(', ') : 'Not specified' },
                  { label: 'E-Verify',       val: eVerify ? '✅ Yes' : '❌ No' },
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
            {step === STEPS.length - 1 ? '🚀 Post Job Listing' : `Continue → ${STEPS[step + 1]}`}
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
  safe:         { flex: 1, backgroundColor: C.bg },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.nav },
  back:         { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  backTxt:      { fontSize: 24, color: C.cream, lineHeight: 28 },
  headerTitle:  { fontSize: 15, fontWeight: '700', color: C.cream },
  headerSub:    { fontSize: 11, color: C.c35, marginTop: 1 },
  stepBadge:    { backgroundColor: C.greenD, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.green + '44' },
  stepBadgeTxt: { fontSize: 12, fontWeight: '700', color: C.green },
  progressBg:   { height: 3, backgroundColor: C.border },
  progressFill: { height: 3, backgroundColor: C.green },
  scroll:       { flex: 1 },
  scrollContent:{ padding: 20, gap: 18 },
  fieldGroup:   { gap: 8 },
  fieldLabel:   { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5 },
  fieldHint:    { fontSize: 11, color: C.c35, marginTop: -4 },
  input:        { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: C.cream },
  textArea:     { minHeight: 130, paddingTop: 12, textAlignVertical: 'top' },
  charCount:    { fontSize: 10, color: C.c35, textAlign: 'right' },
  pillGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  pillActive:   { backgroundColor: C.greenD, borderColor: C.green + '55' },
  pillDanger:   { backgroundColor: C.vividD, borderColor: C.vivid + '55' },
  pillTxt:      { fontSize: 12, color: C.c35, fontWeight: '600' },
  warningBox:   { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: C.vividD, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.vivid + '33' },
  warningTxt:   { flex: 1, fontSize: 12, color: C.c60, lineHeight: 18 },
  hiddenSalaryNote: { backgroundColor: C.goldD, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: C.gold + '33' },
  hiddenSalaryTxt:  { fontSize: 12, color: C.gold, fontWeight: '600' },
  previewCard:  { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 16, gap: 10 },
  previewTop:   { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  previewLogo:  { width: 48, height: 48, borderRadius: 14, backgroundColor: C.greenD, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  previewTitle: { fontSize: 15, fontWeight: '800', color: C.cream },
  previewCompany:{ fontSize: 12, color: C.c35, marginTop: 2 },
  eVerifyBadge: { backgroundColor: C.greenD, borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.green + '44', flexShrink: 0 },
  eVerifyTxt:   { fontSize: 9, color: C.green, fontWeight: '700' },
  previewTags:  { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tagPill:      { backgroundColor: C.card2, borderRadius: 50, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1, borderColor: C.border },
  tagPillTxt:   { fontSize: 10, color: C.c35, fontWeight: '600' },
  salaryPill:   { backgroundColor: C.greenD, borderColor: C.green + '44' },
  previewVisa:  { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  visaPill:     { backgroundColor: C.blueD, borderRadius: 50, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1, borderColor: C.blue + '44' },
  visaPillTxt:  { fontSize: 10, color: C.blue, fontWeight: '600' },
  previewDesc:  { fontSize: 13, color: C.c60, lineHeight: 19 },
  previewDeadline: { fontSize: 11, color: C.gold, fontWeight: '600' },
  summaryCard:  { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: 'hidden' },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  summaryLabel: { fontSize: 12, color: C.c35, fontWeight: '600' },
  summaryVal:   { fontSize: 13, color: C.cream, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  bottomBar:    { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.nav },
  nextBtn:      { backgroundColor: C.green, borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: C.green, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  nextBtnDisabled: { backgroundColor: C.card, shadowOpacity: 0 },
  nextBtnTxt:   { fontSize: 15, fontWeight: '800', color: '#fff' },
  successWrap:  { flex: 1, padding: 20 },
  successCard:  { flex: 1, borderRadius: 24, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 10, borderWidth: 1, borderColor: C.green + '33' },
  successTitle: { fontSize: 22, fontWeight: '900', color: C.cream },
  successName:  { fontSize: 17, fontWeight: '700', color: C.cream },
  successFirm:  { fontSize: 13, color: C.c35 },
  successSub:   { fontSize: 13, color: C.c60, textAlign: 'center', lineHeight: 20, marginVertical: 4 },
  successStats: { flexDirection: 'row', gap: 20, marginVertical: 6 },
  successStat:  { alignItems: 'center', gap: 2 },
  successStatVal:   { fontSize: 16, fontWeight: '800', color: C.cream },
  successStatLabel: { fontSize: 10, color: C.c35 },
  successBtn:   { backgroundColor: C.green, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50, marginTop: 6 },
  successBtnTxt:{ fontSize: 14, fontWeight: '800', color: '#fff' },
});
