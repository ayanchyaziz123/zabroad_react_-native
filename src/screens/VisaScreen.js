import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

const VISA_TYPES = [
  { icon: '🎓', code: 'F-1',      name: 'Student Visa',          color: 'blue'   },
  { icon: '💼', code: 'OPT/STEM', name: 'Work Authorization',    color: 'green'  },
  { icon: '🏢', code: 'H-1B',     name: 'Specialty Occupation',  color: 'vivid'  },
  { icon: '🌿', code: 'EB-2 NIW', name: 'National Interest',     color: 'teal'   },
  { icon: '🛡️', code: 'Asylum',   name: 'Protection Status',     color: 'purple' },
  { icon: '💚', code: 'Green Card',name: 'Permanent Resident',   color: 'green'  },
];

const GUIDES = [
  {
    id: '1', colorKey: 'vivid', icon: '🔥',
    title: 'OPT → H-1B Cap Season 2026',
    sub: 'Visa & Legal · 1.4K posts',
    body: 'Everything you need to know about the H-1B cap registration window opening in March 2026 — eligibility, timeline, and what to do if you\'re not selected.',
    steps: ['Check employer sponsorship eligibility', 'File H-1B registration March 1–18', 'Wait for lottery results (late March)', 'Submit full petition by April 1 if selected', 'Start employment October 1'],
  },
  {
    id: '2', colorKey: 'green', icon: '📋',
    title: 'STEM OPT Extension Guide 2026',
    sub: 'Visa & Legal · 520 posts',
    body: 'Step-by-step guide to extending your OPT from 12 months to 36 months if you hold a STEM degree.',
    steps: ['Confirm degree is on STEM OPT list', 'Get employer to sign Form I-983', 'File I-765 90 days before OPT expiry', 'Maintain 20+ hrs/week employment', 'Report updates every 6 months via SEVP portal'],
  },
  {
    id: '3', colorKey: 'teal', icon: '🌿',
    title: 'EB-2 NIW vs EB-1A Strategy',
    sub: 'Legal · 640 posts',
    body: 'Comparing self-petition green card paths for researchers, scientists, and skilled professionals.',
    steps: ['Document exceptional ability or national interest', 'Prepare evidence package (publications, citations)', 'File I-140 petition self-sponsored', 'Wait for priority date (check Visa Bulletin monthly)', 'File I-485 when date becomes current'],
  },
  {
    id: '4', colorKey: 'blue', icon: '🛡️',
    title: 'Asylum Application Guide',
    sub: 'Visa & Legal · 380 posts',
    body: 'Understanding the affirmative and defensive asylum processes in the United States.',
    steps: ['File Form I-589 within 1 year of arrival', 'Attend asylum interview (affirmative) or hearing (defensive)', 'Gather evidence of persecution or fear', 'Get legal representation if possible', 'Work authorization available after 180 days pending'],
  },
];

const DEADLINES = [
  { date: 'Mar 1–18', label: 'H-1B Cap Registration',   urgency: 'high',   daysLeft: 18 },
  { date: 'Apr 10',   label: 'Java Dev Job Application', urgency: 'medium', daysLeft: 10 },
  { date: 'May 2027', label: 'STEM OPT EAD Expiry',      urgency: 'low',    daysLeft: 398 },
];

export default function VisaScreen({ navigation }) {
  const { colors: C, isDark } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const [expanded, setExpanded] = useState(null);

  const urgencyColor = (u) => u === 'high' ? C.vivid : u === 'medium' ? C.gold : C.green;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Visa & Legal</Text>
        <TouchableOpacity style={s.aiBtn} onPress={() => navigation.navigate('AIAssistant')}>
          <Text style={{ fontSize: 16 }}>🤖</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient
          colors={isDark ? ['#1A0A14', '#0D0F1A'] : ['#FFE8EC', '#F5F7FF']}
          style={s.hero}
        >
          <Text style={s.heroTitle}>Your Immigration{'\n'}Command Center</Text>
          <Text style={s.heroSub}>Deadlines, guides & AI-powered answers</Text>
          <TouchableOpacity style={s.heroCta} onPress={() => navigation.navigate('AIAssistant')}>
            <Text style={s.heroCtaTxt}>Ask Zabroad AI →</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Visa Types */}
        <Text style={s.sectionLabel}>YOUR VISA PATH</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {VISA_TYPES.map((v, i) => (
            <TouchableOpacity
              key={i}
              style={[s.visaChip, i === 1 && { borderColor: C[v.color], backgroundColor: C[v.color + 'D'] }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AIAssistant')}
            >
              <Text style={{ fontSize: 18 }}>{v.icon}</Text>
              <View>
                <Text style={[s.visaCode, i === 1 && { color: C[v.color] }]}>{v.code}</Text>
                <Text style={s.visaName}>{v.name}</Text>
              </View>
              {i === 1 && <View style={s.activeDot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Deadlines */}
        <Text style={s.sectionLabel}>UPCOMING DEADLINES</Text>
        <View style={s.deadlineCard}>
          {DEADLINES.map((d, i) => (
            <View key={i} style={[s.deadlineRow, i < DEADLINES.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
              <View style={[s.urgencyBar, { backgroundColor: urgencyColor(d.urgency) }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.deadlineLabel}>{d.label}</Text>
                <Text style={s.deadlineDate}>📅 {d.date}</Text>
              </View>
              <View style={[s.daysLeft, { backgroundColor: urgencyColor(d.urgency) + '22', borderColor: urgencyColor(d.urgency) + '44' }]}>
                <Text style={[s.daysNum, { color: urgencyColor(d.urgency) }]}>{d.daysLeft}</Text>
                <Text style={[s.daysTxt, { color: urgencyColor(d.urgency) }]}>days</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Guides */}
        <Text style={s.sectionLabel}>TRENDING GUIDES</Text>
        {GUIDES.map((g) => {
          const isOpen = expanded === g.id;
          const color  = C[g.colorKey];
          return (
            <TouchableOpacity
              key={g.id}
              style={[s.guideCard, isOpen && { borderColor: color + '55' }]}
              activeOpacity={0.85}
              onPress={() => setExpanded(isOpen ? null : g.id)}
            >
              <View style={s.guideTop}>
                <View style={[s.guideIconWrap, { backgroundColor: C[g.colorKey + 'D'] }]}>
                  <Text style={{ fontSize: 20 }}>{g.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.guideTitle}>{g.title}</Text>
                  <Text style={s.guideSub}>{g.sub}</Text>
                </View>
                <Text style={[s.chevron, isOpen && { transform: [{ rotate: '90deg' }] }]}>›</Text>
              </View>
              {isOpen && (
                <View style={s.guideBody}>
                  <Text style={s.guideDesc}>{g.body}</Text>
                  <Text style={[s.stepsTitle, { color }]}>Step-by-Step:</Text>
                  {g.steps.map((step, i) => (
                    <View key={i} style={s.stepRow}>
                      <View style={[s.stepNum, { backgroundColor: color }]}>
                        <Text style={s.stepNumTxt}>{i + 1}</Text>
                      </View>
                      <Text style={s.stepText}>{step}</Text>
                    </View>
                  ))}
                  <TouchableOpacity style={[s.askBtn, { backgroundColor: C[g.colorKey + 'D'], borderColor: color + '44' }]} onPress={() => navigation.navigate('AIAssistant')}>
                    <Text style={[s.askBtnTxt, { color }]}>🤖 Ask AI about this →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Free consultation CTA */}
        <TouchableOpacity onPress={() => navigation.navigate('Attorney')} activeOpacity={0.9} style={s.ctaBanner}>
          <LinearGradient colors={isDark ? ['#1A0E2A', '#0D0F1A'] : ['#F0E8FF', '#F5F7FF']} style={s.ctaGrad}>
            <Text style={{ fontSize: 28 }}>⚖️</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.ctaTitle}>Free Immigration Consultation</Text>
              <Text style={s.ctaSub}>Talk to a licensed attorney · 15 min sessions</Text>
            </View>
            <Text style={s.ctaArrow}>›</Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.nav },
  back: { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 24, color: C.cream, lineHeight: 28 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.cream },
  aiBtn: { width: 38, height: 38, backgroundColor: C.vividD, borderRadius: 13, borderWidth: 1, borderColor: C.vivid + '44', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  hero: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.vivid + '22' },
  heroTitle: { fontSize: 22, fontWeight: '900', color: C.cream, letterSpacing: -0.5, lineHeight: 28, marginBottom: 6 },
  heroSub: { fontSize: 13, color: C.c35, marginBottom: 14 },
  heroCta: { backgroundColor: C.vivid, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 50, alignSelf: 'flex-start', shadowColor: C.vivid, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10 },
  heroCtaTxt: { fontSize: 13, fontWeight: '700', color: 'white' },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5 },
  visaChip: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  visaCode: { fontSize: 13, fontWeight: '800', color: C.cream },
  visaName: { fontSize: 10, color: C.c35, marginTop: 1 },
  activeDot: { width: 7, height: 7, backgroundColor: C.green, borderRadius: 4 },
  deadlineCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, overflow: 'hidden' },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  urgencyBar: { width: 3, height: 36, borderRadius: 2 },
  deadlineLabel: { fontSize: 13, fontWeight: '600', color: C.cream, marginBottom: 3 },
  deadlineDate: { fontSize: 11, color: C.c35 },
  daysLeft: { alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 },
  daysNum: { fontSize: 16, fontWeight: '800', lineHeight: 18 },
  daysTxt: { fontSize: 9, fontWeight: '600' },
  guideCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16 },
  guideTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  guideIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  guideTitle: { fontSize: 13, fontWeight: '700', color: C.cream, marginBottom: 3 },
  guideSub: { fontSize: 11, color: C.c35 },
  chevron: { fontSize: 20, color: C.c35 },
  guideBody: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border },
  guideDesc: { fontSize: 13, color: C.c60, lineHeight: 20, marginBottom: 14 },
  stepsTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  stepRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  stepNum: { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumTxt: { fontSize: 10, fontWeight: '700', color: 'white' },
  stepText: { fontSize: 13, color: C.c60, lineHeight: 19, flex: 1 },
  askBtn: { borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, marginTop: 4 },
  askBtnTxt: { fontSize: 13, fontWeight: '700' },
  ctaBanner: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.purple + '44' },
  ctaGrad: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  ctaTitle: { fontSize: 14, fontWeight: '700', color: C.cream, marginBottom: 3 },
  ctaSub: { fontSize: 11, color: C.c35 },
  ctaArrow: { fontSize: 22, color: C.c35 },
});
