import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  RefreshControl, Image, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useJobsStore } from '../store/jobsStore';
import { useLocationStore } from '../store/locationStore';
import { SUGGESTED_CITIES } from '../components/AppTopBar';

const CARD_GAP = 10;
const H_PAD    = 16;
const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - H_PAD * 2 - CARD_GAP) / 2;

function distanceMiles(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function formatDist(mi) {
  if (mi == null) return null;
  if (mi < 0.5)  return '< 1 mi';
  if (mi < 10)   return `${mi.toFixed(1)} mi`;
  return `${Math.round(mi)} mi`;
}

function JobGridCard({ job, onPress, C, s, userLat, userLng }) {
  const dist = formatDist(distanceMiles(userLat, userLng, job.latitude, job.longitude));
  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: C.card, borderColor: job.hot ? C.green + '66' : C.border }]}
      activeOpacity={0.88}
      onPress={() => onPress(job)}
    >
      {job.image_url ? (
        <Image source={{ uri: job.image_url }} style={s.cardImg} resizeMode="cover" />
      ) : (
        <View style={[s.cardImgPlaceholder, { backgroundColor: C.card2 }]}>
          <Ionicons name="briefcase-outline" size={26} color={C.c35} />
        </View>
      )}
      {job.hot && (
        <View style={[s.hotBadge, { backgroundColor: C.vivid + '22', borderColor: C.vivid + '44' }]}>
          <Ionicons name="flame" size={10} color={C.vivid} />
        </View>
      )}
      {dist && (
        <View style={s.distBadge}>
          <Ionicons name="navigate-outline" size={9} color={C.green} />
          <Text style={[s.distTxt, { color: C.green }]}>{dist}</Text>
        </View>
      )}
      <View style={s.cardBody}>
        <Text style={[s.cardTitle, { color: C.cream }]} numberOfLines={2}>{job.title}</Text>
        <Text style={[s.cardCompany, { color: C.green }]} numberOfLines={1}>{job.company}</Text>
        {job.location ? (
          <View style={s.locRow}>
            <Ionicons name="location-outline" size={9} color={C.c35} />
            <Text style={[s.locTxt, { color: C.c35 }]} numberOfLines={1}>{job.location}</Text>
          </View>
        ) : null}
        <Text style={[s.timeTxt, { color: C.c35 }]}>{job.posted}</Text>
      </View>
    </TouchableOpacity>
  );
}

export const JOB_CATEGORIES = [
  { key: 'all',          label: 'All',           icon: 'grid-outline' },
  { key: 'tech',         label: 'Tech',           icon: 'code-slash-outline' },
  { key: 'healthcare',   label: 'Healthcare',     icon: 'medkit-outline' },
  { key: 'hospitality',  label: 'Hospitality',    icon: 'restaurant-outline' },
  { key: 'retail',       label: 'Retail',         icon: 'bag-outline' },
  { key: 'construction', label: 'Construction',   icon: 'hammer-outline' },
  { key: 'education',    label: 'Education',      icon: 'school-outline' },
  { key: 'finance',      label: 'Finance',        icon: 'cash-outline' },
  { key: 'transport',    label: 'Transport',      icon: 'car-outline' },
  { key: 'legal',        label: 'Legal',          icon: 'briefcase-outline' },
  { key: 'other',        label: 'Other',          icon: 'ellipsis-horizontal-outline' },
];

export default function JobsScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const { user: authUser } = useAuthStore();
  const homeCountry   = authUser?.profile?.home_country || '';
  const countryFlag   = authUser?.profile?.country_flag || '';
  const currentUserId = authUser?.id ?? null;

  const jobs      = useJobsStore(st => st.jobs);
  const loading   = useJobsStore(st => st.loading);
  const fetchJobs = useJobsStore(st => st.fetchJobs);
  const deleteJob = useJobsStore(st => st.deleteJob);

  const currentCity = useLocationStore(st => st.city);
  const setCity     = useLocationStore(st => st.setCity);
  const forceDetect = useLocationStore(st => st.forceDetect);
  const lat         = useLocationStore(st => st.latitude);
  const lng         = useLocationStore(st => st.longitude);
  const cityShort   = currentCity?.split(',')[0] || 'Set location';

  const [search,      setSearch]      = useState('');
  const [activeScope, setActiveScope] = useState('all');
  const [activeCat,   setActiveCat]   = useState('all');
  const [showMine,    setShowMine]    = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);
  const [cityOpen,    setCityOpen]    = useState(false);
  const [locating,    setLocating]    = useState(false);

  const doFetch = useCallback((scope = activeScope, cat = activeCat, q = search) => {
    fetchJobs({ scope, homeCountry, search: q, category: cat, lat, lng });
  }, [activeScope, activeCat, search, homeCountry, lat, lng]);

  useFocusEffect(useCallback(() => { doFetch(); }, [activeCat, activeScope, lat, lng]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs({ scope: activeScope, homeCountry, search, category: activeCat, lat, lng });
    setRefreshing(false);
  }, [activeScope, homeCountry, search, activeCat, lat, lng]);

  function handleSearch(text) {
    setSearch(text);
    fetchJobs({ scope: activeScope, homeCountry, search: text, category: activeCat, lat, lng });
  }

  function handleCat(cat) {
    setActiveCat(cat);
    setShowMine(false);
    fetchJobs({ scope: activeScope, homeCountry, search, category: cat, lat, lng });
  }

  function handleDelete(job) {
    Alert.alert('Delete Job', 'Remove this job listing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteJob(job.id).catch(() => Alert.alert('Error', 'Could not delete.')) },
    ]);
  }

  const displayed = useMemo(() => {
    if (!showMine) return jobs;
    return jobs.filter(j => String(j.poster_id) === String(currentUserId));
  }, [jobs, showMine, currentUserId]);

  const activeCatLabel = JOB_CATEGORIES.find(c => c.key === activeCat)?.label;

  function renderItem({ item, index }) {
    const isLeft = index % 2 === 0;
    return (
      <View style={[s.gridItem, isLeft ? { marginRight: CARD_GAP / 2 } : { marginLeft: CARD_GAP / 2 }]}>
        <JobGridCard
          job={item}
          onPress={job => navigation.navigate('JobDetail', { job })}
          C={C} s={s} userLat={lat} userLng={lng}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color={C.cream} />
        </TouchableOpacity>

        <TouchableOpacity style={{ flex: 1 }} onPress={() => setCityOpen(v => !v)} activeOpacity={0.75}>
          <Text style={s.title}>Jobs</Text>
          <View style={s.cityRow}>
            <Ionicons name="location" size={10} color={C.green} />
            <Text style={[s.cityTxt, { color: C.green }]} numberOfLines={1}>
              {cityShort !== 'Set location' ? cityShort : 'Pick city'}
            </Text>
            <Ionicons name={cityOpen ? 'chevron-up' : 'chevron-down'} size={10} color={C.c35} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.mineBtn, activeScope === 'all' && { backgroundColor: C.greenD, borderColor: C.green + '66' }]}
          onPress={() => { setActiveScope('all'); doFetch('all', activeCat); }}
          activeOpacity={0.75}
        >
          <Ionicons name="globe-outline" size={16} color={activeScope === 'all' ? C.green : C.c35} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.mineBtn, activeScope === 'community' && { backgroundColor: C.green + '33', borderColor: C.green + '66' }]}
          onPress={() => { setActiveScope('community'); doFetch('community', activeCat); }}
          activeOpacity={0.75}
        >
          <Text style={s.scopeFlagEmoji}>{countryFlag || '🌍'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.mineBtn, showMine && { backgroundColor: C.green + '33', borderColor: C.green + '66' }]}
          onPress={() => setShowMine(v => !v)}
          activeOpacity={0.8}
        >
          <Ionicons name="person-outline" size={15} color={showMine ? C.green : C.c35} />
        </TouchableOpacity>
        <TouchableOpacity style={s.postBtn} onPress={() => navigation.navigate('PostJob')} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color={C.cream} />
        </TouchableOpacity>
      </View>

      {/* City dropdown */}
      {cityOpen && (
        <>
          <TouchableOpacity style={s.cityOverlay} activeOpacity={1} onPress={() => setCityOpen(false)} />
          <View style={[s.cityDropdown, { backgroundColor: C.nav, borderColor: C.border }]}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ maxHeight: 280 }}>
              <TouchableOpacity
                style={[s.cityItem, { borderBottomColor: C.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                activeOpacity={0.75}
                disabled={locating}
                onPress={async () => {
                  setLocating(true);
                  await forceDetect();
                  setLocating(false);
                  setCityOpen(false);
                }}
              >
                <View style={[s.cityIcon, { backgroundColor: C.greenD }]}>
                  {locating ? <ActivityIndicator size="small" color={C.green} /> : <Ionicons name="navigate" size={14} color={C.green} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cityName, { color: C.cream }]}>{locating ? 'Getting location…' : 'Near Me'}</Text>
                  <Text style={[s.citySub, { color: C.c35 }]}>Use your current GPS location</Text>
                </View>
              </TouchableOpacity>
              {SUGGESTED_CITIES.map((city, idx) => {
                const active = city.name === currentCity;
                const isLast = idx === SUGGESTED_CITIES.length - 1;
                return (
                  <TouchableOpacity
                    key={city.name}
                    style={[s.cityItem, !isLast && { borderBottomColor: C.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                    activeOpacity={0.75}
                    onPress={() => { setCity(city.name, city.lat, city.lng); setCityOpen(false); }}
                  >
                    <View style={[s.cityIcon, { backgroundColor: active ? C.greenD : C.card2 }]}>
                      <Ionicons name="location-outline" size={14} color={active ? C.green : C.c35} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.cityName, { color: active ? C.green : C.cream }]}>{city.name.split(',')[0]}</Text>
                      <Text style={[s.citySub, { color: C.c35 }]}>{city.name.split(', ')[1] || ''}</Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={16} color={C.green} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={[s.searchBox, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="search-outline" size={16} color={C.c35} />
          <TextInput
            style={[s.searchInput, { color: C.cream }]}
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

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catBar} style={s.catScroll}>
        {JOB_CATEGORIES.map(cat => {
          const active = cat.key === activeCat && !showMine;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[s.catChip, { backgroundColor: active ? C.green : C.card, borderColor: active ? C.green : C.border }]}
              onPress={() => handleCat(cat.key)}
              activeOpacity={0.8}
            >
              <Ionicons name={cat.icon} size={13} color={active ? '#fff' : C.c35} />
              <Text style={[s.catChipTxt, { color: active ? '#fff' : C.c35 }]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* My Jobs banner */}
      {showMine && (
        <View style={[s.mineBanner, { backgroundColor: C.greenD, borderColor: C.green + '44' }]}>
          <Ionicons name="person-circle-outline" size={15} color={C.green} />
          <Text style={[s.mineTxt, { color: C.green }]}>Showing your listings</Text>
          <TouchableOpacity onPress={() => setShowMine(false)} activeOpacity={0.7}>
            <Ionicons name="close" size={15} color={C.green} />
          </TouchableOpacity>
        </View>
      )}

      {loading && jobs.length === 0 ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.green} />
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
          ListHeaderComponent={
            <Text style={s.sectionLabel}>
              {displayed.length} JOB{displayed.length !== 1 ? 'S' : ''}
              {showMine ? ' · MY LISTINGS' : activeCat !== 'all' ? ` · ${activeCatLabel?.toUpperCase()}` : ''}
            </Text>
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="briefcase-outline" size={40} color={C.c35} />
              <Text style={[s.emptyTxt, { color: C.cream }]}>No jobs found</Text>
              <Text style={[s.emptySub, { color: C.c35 }]}>
                {showMine ? "You haven't posted any jobs" : activeCat !== 'all' ? 'Try a different category' : activeScope !== 'all' ? 'No community jobs yet' : ''}
              </Text>
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity
              style={[s.postCta, { backgroundColor: C.greenD, borderColor: C.green + '33' }]}
              onPress={() => navigation.navigate('PostJob')}
              activeOpacity={0.85}
            >
              <Ionicons name="briefcase-outline" size={16} color={C.green} />
              <View style={{ flex: 1 }}>
                <Text style={[s.postCtaTitle, { color: C.cream }]}>Know a job opening?</Text>
                <Text style={[s.postCtaSub, { color: C.c35 }]}>Share it with your community</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.green} />
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, backgroundColor: C.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  backBtn:  { width: 34, height: 34, borderRadius: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:    { fontSize: 15, fontWeight: '800', color: C.cream },
  cityRow:  { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  cityTxt:  { fontSize: 11, fontWeight: '600', flex: 1 },
  mineBtn:  { width: 32, height: 32, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  postBtn:  { width: 34, height: 34, backgroundColor: C.card, borderRadius: 11, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

  scopeFlagEmoji: { fontSize: 15 },

  cityOverlay:  { position: 'absolute', top: 0, left: -1000, right: -1000, bottom: -2000, zIndex: 49 },
  cityDropdown: { position: 'absolute', top: 62, left: 16, right: 16, zIndex: 50, borderWidth: 1, borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  cityItem:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  cityIcon:     { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cityName:     { fontSize: 14, fontWeight: '700' },
  citySub:      { fontSize: 11, marginTop: 1 },

  searchWrap:  { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 42 },
  searchInput: { flex: 1, fontSize: 13, paddingVertical: 0 },

  catScroll: { flexGrow: 0, marginBottom: 8 },
  catBar:    { paddingHorizontal: 16, gap: 8, flexDirection: 'row', alignItems: 'center' },
  catChip:   { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  catChipTxt:{ fontSize: 12, fontWeight: '600' },

  mineBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  mineTxt:    { flex: 1, fontSize: 12, fontWeight: '600' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list:         { paddingHorizontal: H_PAD, paddingTop: 4, paddingBottom: 30 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 10 },

  gridItem: { flex: 1 },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTxt:   { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptySub:   { fontSize: 12 },

  card:               { borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginBottom: CARD_GAP },
  cardImg:            { width: '100%', height: CARD_W * 0.85 },
  cardImgPlaceholder: { width: '100%', height: CARD_W * 0.75, alignItems: 'center', justifyContent: 'center' },
  hotBadge:  { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  distBadge: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  distTxt:   { fontSize: 9, fontWeight: '700' },
  cardBody:    { padding: 10, gap: 3 },
  cardTitle:   { fontSize: 13, fontWeight: '700', lineHeight: 17 },
  cardCompany: { fontSize: 12, fontWeight: '600' },
  locRow:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locTxt:      { fontSize: 10, flex: 1 },
  timeTxt:     { fontSize: 10, marginTop: 1 },

  postCta:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 4 },
  postCtaTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  postCtaSub:   { fontSize: 11 },
});
