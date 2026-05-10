import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';

const NAVY = '#1B3266';

const CAT_META = {
  all:        { label: 'All',         emoji: '🗓' },
  legal:      { label: 'Legal Aid',   emoji: '⚖️' },
  jobs:       { label: 'Jobs Fair',   emoji: '💼' },
  community:  { label: 'Community',   emoji: '🤝' },
  health:     { label: 'Health',      emoji: '🧠' },
  cultural:   { label: 'Cultural',    emoji: '🎉' },
  networking: { label: 'Networking',  emoji: '🌐' },
};

function formatEventDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function formatEventTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function EventCard({ event, onPress, onRsvp, rsvping, C, s }) {
  const meta = CAT_META[event.category] || CAT_META.all;
  const colors = { legal: C.vivid, jobs: C.gold, community: C.teal, health: C.green, cultural: C.purple, networking: C.blue };
  const color = colors[event.category] || C.vivid;

  return (
    <TouchableOpacity style={[s.card, event.is_rsvped && { borderColor: C.green + '55' }]} onPress={onPress} activeOpacity={0.88}>
      {/* Image */}
      {event.image_url ? (
        <Image source={{ uri: event.image_url }} style={s.cardImg} resizeMode="cover" />
      ) : (
        <View style={[s.cardImgPlaceholder, { backgroundColor: color + '18' }]}>
          <Text style={{ fontSize: 40 }}>{meta.emoji}</Text>
        </View>
      )}

      {/* Free/Paid badge */}
      <View style={[s.freeBadge, { backgroundColor: event.is_free ? C.green + '22' : C.gold + '22', borderColor: event.is_free ? C.green + '55' : C.gold + '55' }]}>
        <Text style={[s.freeTxt, { color: event.is_free ? C.green : C.gold }]}>
          {event.is_free ? 'FREE' : (event.price || 'PAID')}
        </Text>
      </View>

      <View style={s.cardBody}>
        {/* Category chip */}
        <View style={[s.catChip, { backgroundColor: color + '18', borderColor: color + '44' }]}>
          <Text style={[s.catChipTxt, { color }]}>{meta.emoji} {meta.label}</Text>
        </View>

        <Text style={[s.cardTitle, { color: C.cream }]} numberOfLines={2}>{event.title}</Text>
        <Text style={[s.cardOrganizer, { color: C.c35 }]} numberOfLines={1}>{event.posted_by_name}</Text>
        <Text style={[s.cardDesc, { color: C.c60 }]} numberOfLines={2}>{event.description}</Text>

        {/* Meta row */}
        <View style={s.metaRow}>
          <View style={s.metaChip}>
            <Ionicons name="calendar-outline" size={11} color={C.c35} />
            <Text style={[s.metaTxt, { color: C.c35 }]}>{formatEventDate(event.date)}</Text>
          </View>
          <View style={s.metaChip}>
            <Ionicons name="time-outline" size={11} color={C.c35} />
            <Text style={[s.metaTxt, { color: C.c35 }]}>{formatEventTime(event.date)}</Text>
          </View>
          <View style={[s.metaChip, { flex: 1 }]}>
            <Ionicons name="location-outline" size={11} color={C.c35} />
            <Text style={[s.metaTxt, { color: C.c35 }]} numberOfLines={1}>{event.location}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.cardFooter}>
          <Text style={[s.attendeesTxt, { color: C.c35 }]}>
            <Ionicons name="people-outline" size={12} color={C.c35} /> {event.rsvp_count} going
          </Text>
          <TouchableOpacity
            style={[s.rsvpBtn, { backgroundColor: event.is_rsvped ? C.green + '22' : color }, event.is_rsvped && { borderWidth: 1, borderColor: C.green + '66' }]}
            onPress={() => onRsvp(event)}
            disabled={rsvping}
            activeOpacity={0.8}
          >
            {rsvping ? (
              <ActivityIndicator size="small" color={event.is_rsvped ? C.green : '#fff'} />
            ) : (
              <Text style={[s.rsvpTxt, { color: event.is_rsvped ? C.green : '#fff' }]}>
                {event.is_rsvped ? '✓ Going' : 'RSVP'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function EventsScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const { api, user } = useAuthStore();

  const [events,      setEvents]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [activecat,   setActivecat]   = useState('all');
  const [rsvpingId,   setRsvpingId]   = useState(null);

  const fetchEvents = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ upcoming: 'true' });
      if (search.trim())            params.append('search',   search.trim());
      if (activecat !== 'all')      params.append('category', activecat);
      const data = await api(`/events/?${params}`);
      setEvents(Array.isArray(data) ? data : (data.results || []));
    } catch (e) {
      setError(e.message || 'Failed to load events.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, search, activecat]);

  useFocusEffect(useCallback(() => { fetchEvents(); }, [fetchEvents]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents(true);
  }, [fetchEvents]);

  const handleRsvp = useCallback(async (event) => {
    setRsvpingId(event.id);
    try {
      const res = await api(`/events/${event.id}/rsvp/`, { method: 'POST' });
      setEvents(prev => prev.map(e =>
        e.id === event.id
          ? { ...e, is_rsvped: res.rsvped, rsvp_count: res.rsvp_count }
          : e
      ));
    } catch {} finally {
      setRsvpingId(null);
    }
  }, [api]);

  const renderItem = useCallback(({ item }) => (
    <EventCard
      event={item}
      C={C} s={s}
      rsvping={rsvpingId === item.id}
      onPress={() => navigation.navigate('EventDetail', { event: item })}
      onRsvp={handleRsvp}
    />
  ), [C, s, rsvpingId, handleRsvp, navigation]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Events</Text>
          <Text style={s.headerSub}>Meetups, legal aid & community</Text>
        </View>
        <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate('CreateEvent')} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.createTxt}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[s.searchWrap, { backgroundColor: NAVY }]}>
        <View style={[s.searchBox, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }]}>
          <Ionicons name="search-outline" size={15} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={[s.searchInput, { color: '#fff' }]}
            placeholder="Search events, organizers…"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            onSubmitEditing={() => fetchEvents()}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={15} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filter pills */}
      <View style={[s.filterBar, { backgroundColor: NAVY, paddingBottom: 12 }]}>
        <FlatList
          data={Object.entries(CAT_META)}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={([k]) => k}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          renderItem={({ item: [key, meta] }) => {
            const active = activecat === key;
            return (
              <TouchableOpacity
                style={[s.pill, active && s.pillActive]}
                onPress={() => setActivecat(key)}
                activeOpacity={0.8}
              >
                <Text style={[s.pillTxt, active && s.pillTxtActive]}>
                  {meta.emoji} {meta.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.centerState}>
          <ActivityIndicator size="large" color={C.vivid} />
        </View>
      ) : error ? (
        <View style={s.centerState}>
          <Text style={{ fontSize: 32 }}>⚠️</Text>
          <Text style={[s.emptyTitle, { color: C.cream }]}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => fetchEvents()}>
            <Text style={s.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.vivid} />}
          ListEmptyComponent={
            <View style={s.centerState}>
              <Text style={{ fontSize: 40 }}>🗓</Text>
              <Text style={[s.emptyTitle, { color: C.cream }]}>No upcoming events</Text>
              <Text style={[s.emptyTitle, { color: C.c35, fontSize: 13, fontWeight: '500' }]}>
                Be the first to post one!
              </Text>
              <TouchableOpacity style={s.retryBtn} onPress={() => navigation.navigate('CreateEvent')}>
                <Text style={s.retryTxt}>Post an Event</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn:     { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  createBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  createTxt:   { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Search
  searchWrap:  { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 13 },

  // Filter
  filterBar: {},
  pill:        { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  pillActive:  { backgroundColor: '#fff' },
  pillTxt:     { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  pillTxtActive: { color: NAVY, fontWeight: '700' },

  // Card
  card:        { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  cardImg:     { width: '100%', height: 160 },
  cardImgPlaceholder: { width: '100%', height: 120, alignItems: 'center', justifyContent: 'center' },
  freeBadge:   { position: 'absolute', top: 12, right: 12, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  freeTxt:     { fontSize: 10, fontWeight: '800' },
  cardBody:    { padding: 14, gap: 6 },
  catChip:     { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  catChipTxt:  { fontSize: 10, fontWeight: '700' },
  cardTitle:   { fontSize: 15, fontWeight: '800', lineHeight: 21 },
  cardOrganizer: { fontSize: 12 },
  cardDesc:    { fontSize: 12, lineHeight: 18 },

  // Meta
  metaRow:  { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.card2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.border },
  metaTxt:  { fontSize: 11 },

  // Footer
  cardFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  attendeesTxt:{ fontSize: 12 },
  rsvpBtn:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 50 },
  rsvpTxt:     { fontSize: 13, fontWeight: '800' },

  // States
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30 },
  emptyTitle:  { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  retryBtn:    { marginTop: 4, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, backgroundColor: '#1B3266' },
  retryTxt:    { fontSize: 13, fontWeight: '700', color: '#fff' },
});
