import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  RefreshControl, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useJobsStore } from '../store/jobsStore';

export default function JobsScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const { user: authUser } = useAuthStore();
  const homeCountry        = authUser?.profile?.home_country || '';
  const countryFlag        = authUser?.profile?.country_flag || '';
  const currentUserId      = authUser?.id ?? null;

  const jobs       = useJobsStore(s => s.jobs);
  const loading    = useJobsStore(s => s.loading);
  const fetchJobs  = useJobsStore(s => s.fetchJobs);
  const deleteJob  = useJobsStore(s => s.deleteJob);

  const [search,      setSearch]      = useState('');
  const [activeScope, setActiveScope] = useState('all');
  const [saved,       setSaved]       = useState([]);
  const [refreshing,  setRefreshing]  = useState(false);

  const SCOPES = [
    { key: 'all',       label: '🌍 All' },
    { key: 'community', label: `${countryFlag || '🌍'} Community` },
  ];

  useEffect(() => {
    fetchJobs({ scope: activeScope, homeCountry });
  }, [activeScope]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs({ scope: activeScope, homeCountry });
    setRefreshing(false);
  }, [activeScope, homeCountry]);

  function handleSearch(text) {
    setSearch(text);
    fetchJobs({ scope: activeScope, search: text, homeCountry });
  }

  function handleDelete(job) {
    Alert.alert('Delete Job', 'Remove this job listing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteJob(job.id).catch(() => Alert.alert('Error', 'Could not delete.')) },
    ]);
  }

  const toggleSave = (id) => setSaved(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

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
        <TouchableOpacity style={s.postBtn} onPress={() => navigation.navigate('PostJob')} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={C.green} />
        </TouchableOpacity>
      </View>

      {/* Scope tabs */}
      <View style={s.scopeBar}>
        {SCOPES.map(sc => {
          const active = sc.key === activeScope;
          return (
            <TouchableOpacity
              key={sc.key}
              style={s.scopeTabWrap}
              onPress={() => setActiveScope(sc.key)}
              activeOpacity={0.8}
            >
              <Text style={[s.scopeTabTxt, active && { color: C.green, fontWeight: '700' }]}>{sc.label}</Text>
              {active && <View style={[s.scopeUnderline, { backgroundColor: C.green }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={C.c35} />
          <TextInput
            style={s.searchInput}
            placeholder="Role, company, location…"
            placeholderTextColor={C.c35}
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color={C.c35} />
            </TouchableOpacity>
          )}
        </View>
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
            {jobs.length} JOB{jobs.length !== 1 ? 'S' : ''}
          </Text>

          {jobs.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="briefcase-outline" size={40} color={C.c35} />
              <Text style={s.emptyTxt}>No jobs found</Text>
              {activeScope !== 'all' && (
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
            jobs.map(job => {
              const isSaved = saved.includes(job.id);
              const isOwn   = currentUserId && job.poster_id === currentUserId;
              return (
                <TouchableOpacity key={job.id} style={s.jobCard} onPress={() => navigation.navigate('JobDetail', { job })} activeOpacity={0.92}>

                  {/* Image */}
                  {job.image_url ? (
                    <Image source={{ uri: job.image_url }} style={s.jobImage} resizeMode="cover" />
                  ) : null}

                  {/* Hot badge */}
                  {job.hot && (
                    <View style={[s.hotBadge, { backgroundColor: C.vivid + '22', borderColor: C.vivid + '44' }]}>
                      <Ionicons name="flame" size={10} color={C.vivid} />
                      <Text style={[s.hotTxt, { color: C.vivid }]}>Hot</Text>
                    </View>
                  )}

                  {/* Top row */}
                  <View style={s.jobTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.jobTitle}>{job.title}</Text>
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
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {isOwn ? (
                        <TouchableOpacity
                          style={[s.actionBtn, { backgroundColor: '#FF000022', borderColor: '#FF000044' }]}
                          onPress={() => handleDelete(job)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="trash-outline" size={13} color="#FF4444" />
                          <Text style={[s.actionBtnTxt, { color: '#FF4444' }]}>Delete</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={s.actionBtn}
                          onPress={() => navigation.navigate('AppMain', { screen: 'Chat', params: { userId: job.poster_id } })}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="chatbubble-outline" size={13} color={C.cream} />
                          <Text style={s.actionBtnTxt}>Message</Text>
                        </TouchableOpacity>
                      )}
                    </View>
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
  postBtn:  { width: 38, height: 38, backgroundColor: C.greenD, borderRadius: 13, borderWidth: 1, borderColor: C.green + '55', alignItems: 'center', justifyContent: 'center' },

  scopeBar:      { flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 2 },
  scopeTabWrap:  { paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', position: 'relative' },
  scopeTabTxt:   { fontSize: 13, fontWeight: '500', color: C.c35 },
  scopeUnderline:{ position: 'absolute', bottom: 0, left: 14, right: 14, height: 2, borderRadius: 2 },

  searchWrap:  { paddingHorizontal: 16, paddingVertical: 10 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, height: 42 },
  searchInput: { flex: 1, fontSize: 13, color: C.cream, paddingVertical: 0 },


  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:  { fontSize: 13, color: C.c35, fontWeight: '600' },

  list:         { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30, gap: 10 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 2 },

  emptyState:   { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt:     { fontSize: 15, fontWeight: '700', color: C.cream, textAlign: 'center' },
  switchBtn:    { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, borderWidth: 1 },
  switchBtnTxt: { fontSize: 13, fontWeight: '700' },

  jobCard:    { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: 'hidden' },
  jobImage:   { width: '100%', height: 160 },
  hotBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', margin: 12, marginBottom: 0, borderWidth: 1, borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3 },
  hotTxt:     { fontSize: 10, fontWeight: '700' },
  jobTop:     { flexDirection: 'row', alignItems: 'flex-start', padding: 14, paddingBottom: 0 },
  jobTitle:   { fontSize: 14, fontWeight: '700', color: C.cream },
  jobCompany: { fontSize: 12, color: C.c35, marginTop: 2 },
  saveIconBtn:{ padding: 4 },

  jobDesc:    { fontSize: 12, color: C.c35, lineHeight: 18, paddingHorizontal: 14, paddingVertical: 8 },
  chipsRow:   { flexDirection: 'row', gap: 6, flexWrap: 'wrap', paddingHorizontal: 14, marginBottom: 10 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  chipTxt:    { fontSize: 11, color: C.c35, fontWeight: '500' },

  jobFooter:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  posterTxt:    { fontSize: 11, color: C.c35 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50 },
  actionBtnTxt: { fontSize: 12, fontWeight: '600', color: C.cream },

  postCta:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  postCtaTitle:{ fontSize: 13, fontWeight: '700', marginBottom: 2 },
  postCtaSub:  { fontSize: 11, color: C.c35 },
});
