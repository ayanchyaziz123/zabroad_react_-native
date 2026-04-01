import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

const OPT_TIPS = [
  'Apply only to roles that explicitly mention OPT/STEM sponsorship',
  'Staffing agencies (Mastech, Infosys BPO, HCL) place OPT workers',
  'Your OPT clock starts from I-20 end date, not employment start',
];

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  back: { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 24, color: C.cream, lineHeight: 28 },
  postJobBtn: { backgroundColor: C.greenD, borderWidth: 1, borderColor: C.green + '55', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 7 },
  postJobBtnTxt: { fontSize: 12, fontWeight: '700', color: C.green },
  title: { fontSize: 20, fontWeight: '800', color: C.cream },
  sub: { fontSize: 12, color: C.c35, marginTop: 1 },
  headerBadge: { marginLeft: 'auto', backgroundColor: C.greenD, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(62,200,120,0.2)' },
  headerBadgeTxt: { fontSize: 11, color: C.green, fontWeight: '700' },
  searchRow: { paddingHorizontal: 20, marginBottom: 12, flexDirection: 'row', gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 13, color: C.cream },
  filterBtn: { width: 46, height: 46, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  filterScroll: { marginBottom: 16, flexGrow: 0 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  filterActive: { backgroundColor: C.green + '22', borderColor: C.green + '66' },
  filterTxt: { fontSize: 12, color: C.c35, fontWeight: '500' },
  filterTxtActive: { color: C.green, fontWeight: '700' },
  tipsCard: { backgroundColor: C.card, borderWidth: 1, borderColor: 'rgba(62,200,120,0.15)', borderRadius: 18, padding: 14 },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: C.cream, marginBottom: 10 },
  tipRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 6 },
  tipDot: { width: 5, height: 5, backgroundColor: C.green, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  tipTxt: { fontSize: 12, color: C.c35, lineHeight: 18, flex: 1 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5 },
  jobCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14 },
  jobTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  jobLogo: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  jobTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  jobTitle: { fontSize: 14, fontWeight: '700', color: C.cream, flex: 1 },
  hotBadge: { backgroundColor: 'rgba(232,54,74,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  hotTxt: { fontSize: 10, color: C.vivid, fontWeight: '700' },
  jobCompany: { fontSize: 12, color: C.c35 },
  jobMeta: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  metaChip: { backgroundColor: C.card2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.border },
  visaChip: { backgroundColor: C.greenD, borderColor: 'rgba(62,200,120,0.2)' },
  metaChipTxt: { fontSize: 11, color: C.c60, fontWeight: '500' },
  tagsRow: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  tag: { backgroundColor: C.blueD, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(91,141,239,0.2)' },
  tagTxt: { fontSize: 10, color: C.blue, fontWeight: '600' },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  jobMisc: { fontSize: 11, color: C.c35 },
  applyBtn: { backgroundColor: C.green, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, shadowColor: C.green, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
  applyTxt: { fontSize: 12, fontWeight: '700', color: '#0D0F1A' },
});

export default function JobsScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const JOBS = [
    {
      id: '1', title: 'Junior Java Developer', company: 'Citibank', salary: '$75K–$90K',
      type: 'Hybrid', location: 'Midtown, NY', visa: 'OPT · STEM · H-1B Sponsor',
      posted: '2h ago', applicants: 42, emoji: '🏦', color: C.blue, hot: true,
      tags: ['Java', 'Spring Boot', 'SQL'],
    },
    {
      id: '2', title: 'Data Analyst', company: 'Amazon', salary: '$85K–$105K',
      type: 'Remote', location: 'New York, NY', visa: 'OPT · STEM · H-1B Sponsor',
      posted: '5h ago', applicants: 128, emoji: '📦', color: C.gold, hot: true,
      tags: ['Python', 'SQL', 'Tableau'],
    },
    {
      id: '3', title: 'Software Engineer I', company: 'JP Morgan', salary: '$100K–$120K',
      type: 'Onsite', location: 'Downtown, NY', visa: 'OPT · STEM · H-1B Sponsor',
      posted: '1d ago', applicants: 89, emoji: '🏢', color: C.vivid, hot: false,
      tags: ['Python', 'React', 'AWS'],
    },
    {
      id: '4', title: 'UX/UI Designer', company: 'Spotify', salary: '$80K–$95K',
      type: 'Hybrid', location: 'Manhattan, NY', visa: 'OPT · CPT accepted',
      posted: '1d ago', applicants: 56, emoji: '🎵', color: C.green, hot: false,
      tags: ['Figma', 'Prototyping', 'Research'],
    },
    {
      id: '5', title: 'Machine Learning Engineer', company: 'Google NYC', salary: '$130K–$160K',
      type: 'Hybrid', location: 'NYC', visa: 'OPT · STEM · H-1B Sponsor · GC',
      posted: '2d ago', applicants: 312, emoji: '🔍', color: C.teal, hot: false,
      tags: ['Python', 'TensorFlow', 'GCP'],
    },
    {
      id: '6', title: 'Registered Nurse', company: 'NYU Langone', salary: '$75K–$95K',
      type: 'Onsite', location: 'Manhattan, NY', visa: 'H-1B Sponsor · TN Visa',
      posted: '3d ago', applicants: 28, emoji: '🏥', color: C.purple, hot: false,
      tags: ['RN License', 'ICU', 'Bilingual'],
    },
  ];

  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState(0);
  const [saved,        setSaved]        = useState([]);
  const [applied,      setApplied]      = useState({});
  const filters = ['All', 'Remote', 'Hybrid', 'Onsite', 'OPT Only', 'H-1B Sponsor'];

  const FILTER_MAP = { 1: 'Remote', 2: 'Hybrid', 3: 'Onsite' };

  const filtered = JOBS.filter(j => {
    const matchSearch = !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchFilter =
      activeFilter === 0 ? true
      : activeFilter === 4 ? j.visa.includes('OPT')
      : activeFilter === 5 ? j.visa.includes('H-1B')
      : j.type === FILTER_MAP[activeFilter];
    return matchSearch && matchFilter;
  });

  const toggleSave  = (id) => setSaved(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleApply = (id) => setApplied(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>💼 Jobs</Text>
          <Text style={s.sub}>OPT & visa-friendly listings</Text>
        </View>
        <TouchableOpacity
          style={s.postJobBtn}
          onPress={() => navigation.navigate('PostJob')}
          activeOpacity={0.85}
        >
          <Text style={s.postJobBtnTxt}>+ Post Job</Text>
        </TouchableOpacity>
      </View>

      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Text>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Job title, company, skill…"
            placeholderTextColor={C.c35}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={s.filterBtn}>
          <Text style={{ fontSize: 16 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingBottom: 4 }}>
        {filters.map((f, i) => (
          <TouchableOpacity key={i} style={[s.filterPill, i === activeFilter && s.filterActive]} onPress={() => setActiveFilter(i)}>
            <Text style={[s.filterTxt, i === activeFilter && s.filterTxtActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 12 }}>

        {/* OPT Tips */}
        <View style={s.tipsCard}>
          <Text style={s.tipsTitle}>⚡ OPT Job Search Tips</Text>
          {OPT_TIPS.map((tip, i) => (
            <View key={i} style={s.tipRow}>
              <View style={s.tipDot} />
              <Text style={s.tipTxt}>{tip}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>{filtered.length} LISTINGS · SORTED BY RELEVANCE</Text>

        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 40, gap: 10 }}>
            <Text style={{ fontSize: 36 }}>💼</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.cream }}>No jobs match</Text>
            <Text style={{ fontSize: 13, color: C.c35 }}>Try removing a filter or searching differently</Text>
          </View>
        )}

        {filtered.map((job) => {
          const isSaved   = saved.includes(job.id);
          const isApplied = applied[job.id];
          return (
            <View key={job.id} style={[s.jobCard, isApplied && { borderColor: C.green + '55' }]}>
              <View style={s.jobTop}>
                <View style={[s.jobLogo, { backgroundColor: job.color + '22' }]}>
                  <Text style={{ fontSize: 24 }}>{job.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.jobTitleRow}>
                    <Text style={s.jobTitle} numberOfLines={1}>{job.title}</Text>
                    {job.hot && <View style={s.hotBadge}><Text style={s.hotTxt}>🔥 Hot</Text></View>}
                  </View>
                  <Text style={s.jobCompany}>{job.company} · {job.location}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleSave(job.id)}>
                  <Text style={{ fontSize: 20 }}>{isSaved ? '🔖' : '🏷️'}</Text>
                </TouchableOpacity>
              </View>

              <View style={s.jobMeta}>
                <View style={s.metaChip}><Text style={s.metaChipTxt}>💰 {job.salary}</Text></View>
                <View style={s.metaChip}><Text style={s.metaChipTxt}>🏢 {job.type}</Text></View>
                <View style={[s.metaChip, s.visaChip]}><Text style={[s.metaChipTxt, { color: C.green }]}>✓ {job.visa.split('·')[0].trim()}</Text></View>
              </View>

              <View style={s.tagsRow}>
                {job.tags.map((tag, i) => (
                  <View key={i} style={s.tag}><Text style={s.tagTxt}>{tag}</Text></View>
                ))}
              </View>

              <View style={s.jobFooter}>
                <Text style={s.jobMisc}>
                  👥 {isApplied ? job.applicants + 1 : job.applicants} applied · {job.posted}
                </Text>
                <TouchableOpacity
                  style={[s.applyBtn, isApplied && { backgroundColor: C.greenD, shadowColor: C.green }]}
                  onPress={() => toggleApply(job.id)}
                >
                  <Text style={[s.applyTxt, isApplied && { color: C.green }]}>
                    {isApplied ? '✓ Applied' : 'Apply Now →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={{ height: 10 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
