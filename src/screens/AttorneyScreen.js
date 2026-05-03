import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useAttorneyStore } from '../store/attorneyStore';

export default function AttorneyScreen({ navigation }) {
  const { colors: C } = useTheme();
  const { user: authUser } = useAuthStore();
  const s = useMemo(() => getStyles(C), [C]);

  const attorneys       = useAttorneyStore(s => s.attorneys);
  const loading         = useAttorneyStore(s => s.loading);
  const fetchAttorneys  = useAttorneyStore(s => s.fetchAttorneys);

  const [search,      setSearch]      = useState('');
  const [activeScope, setActiveScope] = useState('all');
  const [contacted,   setContacted]   = useState({});
  const [refreshing,  setRefreshing]  = useState(false);

  const countryName = authUser?.profile?.home_country || '';
  const countryFlag = authUser?.profile?.country_flag || '🌍';

  const SCOPES = [
    { key: 'community', label: `${countryFlag} Community` },
    { key: 'all',       label: '🌍 All' },
  ];

  useEffect(() => { fetchAttorneys(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAttorneys();
    setRefreshing(false);
  }, []);

  const filtered = attorneys.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.name.toLowerCase().includes(q) ||
      a.specialty.toLowerCase().includes(q) ||
      a.languages.toLowerCase().includes(q);
    const matchScope = activeScope === 'all' ||
      a.communities.some(c => c.toLowerCase() === countryName.toLowerCase());
    return matchSearch && matchScope;
  });

  const toggleContact = (id) => setContacted(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Attorneys</Text>
          <Text style={s.sub}>Immigration · multilingual</Text>
        </View>
        <View style={s.scopeRow}>
          {SCOPES.map(sc => {
            const active = sc.key === activeScope;
            return (
              <TouchableOpacity key={sc.key} style={[s.scopeTab, active && s.scopeTabActive]} onPress={() => setActiveScope(sc.key)} activeOpacity={0.8}>
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
          <TextInput style={s.searchInput} placeholder="Name, specialty, language…" placeholderTextColor={C.c35} value={search} onChangeText={setSearch} />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color={C.c35} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.postBtn} onPress={() => navigation.navigate('PostAttorney')} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={C.purple} />
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loading && attorneys.length === 0 ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={C.purple} />
          <Text style={s.loadingTxt}>Loading attorneys…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.purple} />}
        >
          <Text style={s.sectionLabel}>
            {filtered.length} ATTORNEY{filtered.length !== 1 ? 'S' : ''}
            {activeScope === 'community' ? ` · ${countryName.toUpperCase()} COMMUNITY` : ''}
          </Text>

          {filtered.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="scale-outline" size={40} color={C.c35} />
              <Text style={s.emptyTxt}>
                {activeScope === 'community' ? `No attorneys in ${countryName} community yet` : 'No attorneys found'}
              </Text>
              {activeScope === 'community' && (
                <TouchableOpacity style={[s.switchBtn, { backgroundColor: C.purpleD, borderColor: C.purple + '44' }]} onPress={() => setActiveScope('all')} activeOpacity={0.8}>
                  <Text style={[s.switchBtnTxt, { color: C.purple }]}>View all attorneys</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filtered.map(att => {
              const isContacted = contacted[att.id];
              const planColor   = att.plan === 'premium' ? '#F5A623' : att.plan === 'standard' ? '#9B72EF' : C.purple;
              return (
                <View key={att.id} style={[s.attCard, att.featured && { borderColor: '#F5A62355' }]}>

                  {/* Top */}
                  <View style={s.attTop}>
                    <View style={[s.attAv, { backgroundColor: planColor + '22' }]}>
                      <Text style={[s.attInitials, { color: planColor }]}>{att.initials}</Text>
                      {att.featured && (
                        <View style={[s.featuredDot, { backgroundColor: '#F5A623' }]}>
                          <Ionicons name="star" size={8} color="white" />
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.attName} numberOfLines={1}>{att.name}</Text>
                      {att.firm ? <Text style={s.attFirm} numberOfLines={1}>{att.firm}</Text> : null}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Ionicons name="location-outline" size={11} color={C.c35} />
                        <Text style={s.attLocation}>{att.location}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Meta */}
                  <View style={s.metaCol}>
                    {att.specialty ? (
                      <View style={s.metaRow}>
                        <Ionicons name="scale-outline" size={13} color={planColor} />
                        <Text style={[s.metaSpec, { color: planColor }]} numberOfLines={1}>{att.specialty}</Text>
                      </View>
                    ) : null}
                    {att.languages ? (
                      <View style={s.metaRow}>
                        <Ionicons name="chatbubble-ellipses-outline" size={13} color={C.c35} />
                        <Text style={s.metaTxt} numberOfLines={1}>{att.languages}</Text>
                      </View>
                    ) : null}
                    {att.price ? (
                      <View style={s.metaRow}>
                        <Ionicons name="cash-outline" size={13} color={C.c35} />
                        <Text style={s.metaTxt} numberOfLines={1}>{att.price}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Description */}
                  {att.desc ? <Text style={s.attDesc} numberOfLines={2}>{att.desc}</Text> : null}

                  {/* Footer */}
                  <View style={s.attFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text style={{ fontSize: 12 }}>{att.countryFlag}</Text>
                      <Text style={s.posterTxt}>{att.poster} · {att.time}</Text>
                    </View>
                    <TouchableOpacity
                      style={[s.contactBtn,
                        isContacted
                          ? { backgroundColor: C.greenD, borderColor: C.green + '44', borderWidth: 1 }
                          : { backgroundColor: planColor }
                      ]}
                      onPress={() => toggleContact(att.id)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name={isContacted ? 'checkmark-circle' : 'chatbubble-outline'} size={13} color={isContacted ? C.green : 'white'} />
                      <Text style={[s.contactTxt, isContacted && { color: C.green }]}>
                        {isContacted ? 'Contacted' : 'Message'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* Post CTA */}
          <TouchableOpacity style={[s.postCta, { backgroundColor: C.purpleD, borderColor: C.purple + '33' }]} onPress={() => navigation.navigate('PostAttorney')} activeOpacity={0.85}>
            <Ionicons name="scale-outline" size={16} color={C.purple} />
            <View style={{ flex: 1 }}>
              <Text style={[s.postCtaTitle, { color: C.cream }]}>Are you an attorney?</Text>
              <Text style={s.postCtaSub}>List your services with your community</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.purple} />
          </TouchableOpacity>

          {/* Disclaimer */}
          <View style={[s.disclaimer, { backgroundColor: C.card, borderColor: C.border }]}>
            <Ionicons name="information-circle-outline" size={14} color={C.c35} />
            <Text style={s.disclaimerTxt}>
              Zabroad connects you with attorneys for informational purposes. Always verify credentials independently. This is not legal advice.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header:            { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  backBtn:           { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:             { fontSize: 16, fontWeight: '800', color: C.cream, letterSpacing: -0.3 },
  sub:               { fontSize: 11, color: C.c35, marginTop: 1 },
  scopeRow:          { flexDirection: 'row', gap: 5, flexShrink: 0 },
  scopeTab:          { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  scopeTabActive:    { backgroundColor: C.purpleD, borderColor: C.purple + '66' },
  scopeTabTxt:       { fontSize: 10, fontWeight: '600', color: C.c35 },
  scopeTabTxtActive: { color: C.purple, fontWeight: '700' },

  searchWrap:  { paddingHorizontal: 16, marginBottom: 10, flexDirection: 'row', gap: 10 },
  searchBox:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 13, color: C.cream },
  postBtn:     { width: 46, height: 46, backgroundColor: C.purpleD, borderRadius: 14, borderWidth: 1, borderColor: C.purple + '55', alignItems: 'center', justifyContent: 'center' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:  { fontSize: 13, color: C.c35, fontWeight: '600' },

  list:         { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30, gap: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 2 },

  emptyState:   { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTxt:     { fontSize: 15, fontWeight: '700', color: C.cream, textAlign: 'center' },
  switchBtn:    { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, borderWidth: 1 },
  switchBtnTxt: { fontSize: 13, fontWeight: '700' },

  attCard:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14 },
  attTop:       { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  attAv:        { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  attInitials:  { fontSize: 18, fontWeight: '800' },
  featuredDot:  { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: C.bg },
  attName:      { fontSize: 14, fontWeight: '700', color: C.cream },
  attFirm:      { fontSize: 12, color: C.c35, marginTop: 1 },
  attLocation:  { fontSize: 11, color: C.c35 },

  metaCol:   { gap: 5, marginBottom: 8 },
  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  metaSpec:  { fontSize: 12, fontWeight: '700', flex: 1 },
  metaTxt:   { fontSize: 12, color: C.c35, flex: 1 },

  attDesc:   { fontSize: 12, color: C.c35, lineHeight: 18, marginBottom: 10 },

  attFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  posterTxt:  { fontSize: 11, color: C.c35 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50 },
  contactTxt: { fontSize: 12, fontWeight: '700', color: 'white' },

  postCta:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  postCtaTitle:{ fontSize: 13, fontWeight: '700', marginBottom: 2 },
  postCtaSub:  { fontSize: 11, color: C.c35 },

  disclaimer:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 14, padding: 12 },
  disclaimerTxt: { flex: 1, fontSize: 11, color: C.c35, lineHeight: 17 },
});
