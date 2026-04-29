import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import { useJobsStore } from '../store/jobsStore';

export default function JobsScreen({ navigation }) {
  const { colors: C } = useTheme();
  const { user }      = useUser();
  const s = useMemo(() => getStyles(C), [C]);

  const jobs       = useJobsStore(s => s.jobs);
  const loading    = useJobsStore(s => s.loading);
  const fetchJobs  = useJobsStore(s => s.fetchJobs);

  const [search,      setSearch]      = useState('');
  const [activeScope, setActiveScope] = useState('all');
  const [saved,       setSaved]       = useState([]);
  const [messaged,    setMessaged]    = useState({});
  const [refreshing,  setRefreshing]  = useState(false);

  const country = user.homeCountry || { flag: '🌍', name: '' };

  const SCOPES = [
    { key: 'community', label: `${country.flag} Community` },
    { key: 'all',       label: '🌍 All' },
  ];

  useEffect(() => { fetchJobs(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, []);

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q);
    const matchScope = activeScope === 'all' ||
      j.communities.some(c => c.toLowerCase() === (country.name || '').toLowerCase());
    return matchSearch && matchScope;
  });

  const toggleSave    = (id) => setSaved(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleMessage = (id) => { setMessaged(prev => ({ ...prev, [id]: true })); navigation.navigate('Chat'); };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Jobs</Text>
          <Text style={s.sub}>Shared by your community</Text>
        </View>
        <View style={s.scopeRow}>
          {SCOPES.map(sc => {
            const active = sc.key === activeScope;
            return (
              <TouchableOpacity
                key={sc.key}
                style={[s.scopeTab, active && s.scopeTabActive]}
                onPress={() => setActiveScope(sc.key)}
                activeOpacity={0.8}
              >
                <Text style={[s.scopeTabTxt, active && s.scopeTabTxtActive]}>{sc.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={C.c35} />
          <TextInput
            style={s.searchInput}
            placeholder="Role, company…"
            placeholderTextColor={C.c35}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color={C.c35} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.postBtn} onPress={() => navigation.navigate('PostJob')} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={C.green} />
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loading && jobs.length === 0 ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.green} />
          <Text style={s.loadingTxt}>Loading jobs…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
        >
          <Text style={s.sectionLabel}>
            {filtered.length} JOB{filtered.length !== 1 ? 'S' : ''}
            {activeScope === 'community' ? ` · ${(country.name || '').toUpperCase()} COMMUNITY` : ''}
          </Text>

          {filtered.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="briefcase-outline" size={40} color={C.c35} />
              <Text style={s.emptyTxt}>
                {activeScope === 'community' ? `No jobs in ${country.name} community yet` : 'No jobs found'}
              </Text>
              {activeScope === 'community' && (
                <TouchableOpacity
                  style={[s.switchBtn, { backgroundColor: C.greenD, borderColor: C.green + '44' }]}
                  onPress={() => setActiveScope('all')}
                  activeOpacity={0.8}
                >
                  <Text style={[s.switchBtnTxt, { color: C.green }]}>View all jobs</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filtered.map(job => {
              const isSaved    = saved.includes(job.id);
              const isMessaged = messaged[job.id];
              return (
                <TouchableOpacity key={job.id} style={s.jobCard} onPress={() => navigation.navigate('JobDetail', { job })} activeOpacity={0.92}>

                  {/* Top row */}
                  <View style={s.jobTop}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={s.jobTitle}>{job.title}</Text>
                        {job.hot && (
                          <View style={[s.hotBadge, { backgroundColor: C.vivid + '22', borderColor: C.vivid + '44' }]}>
                            <Ionicons name="flame" size={10} color={C.vivid} />
                          </View>
                        )}
                      </View>
                      <Text style={s.jobCompany}>{job.company}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleSave(job.id)} activeOpacity={0.7} style={s.saveIconBtn}>
                      <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={18} color={isSaved ? C.vivid : C.c35} />
                    </TouchableOpacity>
                  </View>

                  {/* Description */}
                  <Text style={s.jobDesc} numberOfLines={2}>{job.desc}</Text>

                  {/* Chips row */}
                  <View style={s.chipsRow}>
                    <View style={s.chip}>
                      <Ionicons name="location-outline" size={11} color={C.c35} />
                      <Text style={s.chipTxt}>{job.location}</Text>
                    </View>
                    {job.countryFlag ? (
                      <View style={s.chip}>
                        <Text style={{ fontSize: 11 }}>{job.countryFlag}</Text>
                        <Text style={s.chipTxt}>{job.communities[0] || ''}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Footer */}
                  <View style={s.jobFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name="person-circle-outline" size={15} color={C.c35} />
                      <Text style={s.posterTxt}>{job.poster} · {job.posted}</Text>
                    </View>
                    <TouchableOpacity
                      style={[s.msgBtn, isMessaged && { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]}
                      onPress={() => handleMessage(job.id)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name={isMessaged ? 'checkmark' : 'chatbubble-outline'} size={13} color={isMessaged ? C.vivid : C.cream} />
                      <Text style={[s.msgTxt, isMessaged && { color: C.vivid }]}>
                        {isMessaged ? 'Sent' : 'Message'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Post CTA */}
          <TouchableOpacity
            style={[s.postCta, { backgroundColor: C.greenD, borderColor: C.green + '33' }]}
            onPress={() => navigation.navigate('PostJob')}
            activeOpacity={0.85}
          >
            <Ionicons name="briefcase-outline" size={16} color={C.green} />
            <View style={{ flex: 1 }}>
              <Text style={[s.postCtaTitle, { color: C.cream }]}>Know a job opening?</Text>
              <Text style={s.postCtaSub}>Share it with your community</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.green} />
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  backBtn:  { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:    { fontSize: 16, fontWeight: '800', color: C.cream, letterSpacing: -0.3 },
  sub:      { fontSize: 11, color: C.c35, marginTop: 1 },

  scopeRow:          { flexDirection: 'row', gap: 5, flexShrink: 0 },
  scopeTab:          { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  scopeTabActive:    { backgroundColor: C.vividD, borderColor: C.vivid + '66' },
  scopeTabTxt:       { fontSize: 10, fontWeight: '600', color: C.c35 },
  scopeTabTxtActive: { color: C.vivid, fontWeight: '700' },

  searchWrap:  { paddingHorizontal: 16, marginBottom: 10, flexDirection: 'row', gap: 10 },
  searchBox:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 13, color: C.cream },
  postBtn:     { width: 46, height: 46, backgroundColor: C.greenD, borderRadius: 14, borderWidth: 1, borderColor: C.green + '55', alignItems: 'center', justifyContent: 'center' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:  { fontSize: 13, color: C.c35, fontWeight: '600' },

  list:         { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30, gap: 10 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 2 },

  emptyState:   { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt:     { fontSize: 15, fontWeight: '700', color: C.cream, textAlign: 'center' },
  switchBtn:    { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, borderWidth: 1 },
  switchBtnTxt: { fontSize: 13, fontWeight: '700' },

  jobCard:     { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14 },
  jobTop:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  jobTitle:    { fontSize: 14, fontWeight: '700', color: C.cream, flex: 1 },
  jobCompany:  { fontSize: 12, color: C.c35, marginTop: 2 },
  hotBadge:    { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  saveIconBtn: { padding: 4 },

  jobDesc:     { fontSize: 12, color: C.c35, lineHeight: 18, marginBottom: 10 },
  chipsRow:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  chip:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  chipTxt:     { fontSize: 11, color: C.c35, fontWeight: '500' },

  jobFooter:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  posterTxt:   { fontSize: 11, color: C.c35 },
  msgBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50 },
  msgTxt:      { fontSize: 12, fontWeight: '600', color: C.cream },

  postCta:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  postCtaTitle:{ fontSize: 13, fontWeight: '700', marginBottom: 2 },
  postCtaSub:  { fontSize: 11, color: C.c35 },
});
