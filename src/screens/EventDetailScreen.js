import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Linking, Alert, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';

const NAVY = '#1B3266';

const CATEGORY_META = {
  legal:      { emoji: '⚖️', label: 'Legal',      color: null },
  jobs:       { emoji: '💼', label: 'Jobs',        color: null },
  community:  { emoji: '🤝', label: 'Community',   color: null },
  health:     { emoji: '🧠', label: 'Health',      color: null },
  cultural:   { emoji: '🎉', label: 'Cultural',    color: null },
  networking: { emoji: '🌐', label: 'Networking',  color: null },
};

function getCatMeta(category, C) {
  const key = (category || '').toLowerCase();
  const meta = CATEGORY_META[key];
  if (meta) {
    const colorMap = {
      legal: C.vivid, jobs: C.gold, community: C.teal,
      health: C.green, cultural: C.purple, networking: C.vivid,
    };
    return { ...meta, color: colorMap[key] || C.vivid };
  }
  return { emoji: '📅', label: category || 'Event', color: C.vivid };
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function EventDetailScreen({ route, navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const { api, user } = useAuthStore();

  const [event,      setEvent]      = useState(route.params.event);
  const [rsvped,     setRsvped]     = useState(!!event.is_rsvped);
  const [rsvpCount,  setRsvpCount]  = useState(event.rsvp_count ?? 0);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const cat   = getCatMeta(event.category, C);
  const isOwn = user?.id && event.posted_by_id && String(user.id) === String(event.posted_by_id);

  const hasCoords = event.latitude != null && event.longitude != null
    && !isNaN(Number(event.latitude)) && !isNaN(Number(event.longitude));

  // ── Refresh ───────────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fresh = await api(`/events/${event.id}/`);
      setEvent(fresh);
      setRsvped(!!fresh.is_rsvped);
      setRsvpCount(fresh.rsvp_count ?? 0);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not refresh event.');
    } finally {
      setRefreshing(false);
    }
  }, [event.id]);

  // ── RSVP ──────────────────────────────────────────────────────────────────
  async function toggleRsvp() {
    if (rsvpLoading) return;
    setRsvpLoading(true);
    const wasGoing = rsvped;
    // Optimistic update
    setRsvped(!wasGoing);
    setRsvpCount(c => wasGoing ? Math.max(0, c - 1) : c + 1);
    try {
      const res = await api(`/events/${event.id}/rsvp/`, { method: 'POST' });
      if (res?.is_rsvped !== undefined) setRsvped(res.is_rsvped);
      if (res?.rsvp_count !== undefined) setRsvpCount(res.rsvp_count);
    } catch (e) {
      // Revert on error
      setRsvped(wasGoing);
      setRsvpCount(c => wasGoing ? c + 1 : Math.max(0, c - 1));
      Alert.alert('Error', e.message || 'Could not update RSVP.');
    } finally {
      setRsvpLoading(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  function onDelete() {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to permanently delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await api(`/events/${event.id}/`, { method: 'DELETE' });
              navigation.goBack();
            } catch (e) {
              Alert.alert('Error', e.message || 'Could not delete event.');
            }
          },
        },
      ],
    );
  }

  // ── Open link ─────────────────────────────────────────────────────────────
  async function openLink() {
    const url = event.link;
    if (!url) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      else Alert.alert('Error', 'Cannot open this link.');
    } catch {
      Alert.alert('Error', 'Cannot open this link.');
    }
  }

  const mapRegion = hasCoords ? {
    latitude:       Number(event.latitude),
    longitude:      Number(event.longitude),
    latitudeDelta:  0.01,
    longitudeDelta: 0.01,
  } : null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{event.title}</Text>
        <View style={[s.catBadge, { backgroundColor: cat.color + '33', borderColor: cat.color + '66' }]}>
          <Text style={[s.catBadgeTxt, { color: cat.color }]}>{cat.emoji} {cat.label}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.vivid}
            colors={[C.vivid]}
          />
        }
      >

        {/* ── Image / Placeholder ── */}
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} style={s.heroImage} resizeMode="cover" />
        ) : (
          <View style={[s.heroPlaceholder, { backgroundColor: cat.color + '22' }]}>
            <Text style={s.heroEmoji}>{cat.emoji}</Text>
          </View>
        )}

        {/* ── Main card ── */}
        <View style={s.mainCard}>

          {/* Title + organizer + free/paid */}
          <View style={s.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.eventTitle}>{event.title}</Text>
              <Text style={s.organizer}>By {event.posted_by_name || 'Community Member'}</Text>
            </View>
            {event.is_free ? (
              <View style={s.freeBadge}>
                <Text style={s.freeBadgeTxt}>FREE</Text>
              </View>
            ) : (
              <View style={s.paidBadge}>
                <Text style={s.paidBadgeTxt}>
                  {event.price ? `$${event.price}` : 'PAID'}
                </Text>
              </View>
            )}
          </View>

          {/* Date */}
          <View style={s.infoRow}>
            <View style={s.infoChip}>
              <Ionicons name="calendar-outline" size={15} color={C.vivid} />
              <Text style={s.infoChipTxt}>{formatDate(event.date)}</Text>
            </View>
          </View>

          {/* Location */}
          {event.location ? (
            <View style={s.infoRow}>
              <View style={s.infoChip}>
                <Ionicons name="location-outline" size={15} color={C.gold} />
                <Text style={s.infoChipTxt}>{event.location}</Text>
              </View>
            </View>
          ) : null}

          {/* Description */}
          {event.description ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>ABOUT THIS EVENT</Text>
              <Text style={s.descTxt}>{event.description}</Text>
            </View>
          ) : null}

          {/* Link chip */}
          {event.link ? (
            <TouchableOpacity style={s.linkChip} onPress={openLink} activeOpacity={0.8}>
              <Ionicons name="link-outline" size={16} color={C.teal} />
              <Text style={s.linkChipTxt} numberOfLines={1}>{event.link}</Text>
              <Ionicons name="open-outline" size={14} color={C.teal} />
            </TouchableOpacity>
          ) : null}

        </View>

        {/* ── Map ── */}
        {hasCoords ? (
          <View style={s.mapSection}>
            <Text style={s.sectionLabel2}>LOCATION</Text>
            <View style={s.mapCard}>
              <MapView style={s.map} region={mapRegion} scrollEnabled={false} zoomEnabled={false}>
                <Marker
                  coordinate={{ latitude: Number(event.latitude), longitude: Number(event.longitude) }}
                  title={event.title}
                  description={event.location}
                />
              </MapView>
            </View>
          </View>
        ) : null}

        {/* ── Owner actions ── */}
        {isOwn && (
          <View style={s.ownerSection}>
            <Text style={s.sectionLabel2}>MANAGE YOUR EVENT</Text>
            <View style={s.ownerRow}>
              <TouchableOpacity
                style={[s.ownerBtn, { backgroundColor: C.greenD, borderColor: C.green + '55', flex: 1 }]}
                onPress={() => navigation.navigate('EditEvent', { event })}
                activeOpacity={0.85}
              >
                <Ionicons name="pencil-outline" size={18} color={C.green} />
                <Text style={[s.ownerBtnTxt, { color: C.green }]}>Edit Event</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.ownerBtn, { backgroundColor: C.redD, borderColor: C.red + '55', flex: 1 }]}
                onPress={onDelete}
                activeOpacity={0.85}
              >
                <Ionicons name="trash-outline" size={18} color={C.red} />
                <Text style={[s.ownerBtnTxt, { color: C.red }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── RSVP Footer ── */}
      <View style={s.footer}>
        <Text style={s.rsvpCount}>
          <Ionicons name="people-outline" size={15} color={C.c35} /> {rsvpCount} going
        </Text>
        <TouchableOpacity
          style={[s.rsvpBtn, rsvped && s.rsvpBtnGoing]}
          onPress={toggleRsvp}
          activeOpacity={0.85}
          disabled={rsvpLoading}
        >
          {rsvpLoading ? (
            <ActivityIndicator size="small" color={rsvped ? C.green : '#fff'} />
          ) : (
            <>
              <Ionicons
                name={rsvped ? 'checkmark-circle' : 'calendar-outline'}
                size={18}
                color={rsvped ? C.green : '#fff'}
              />
              <Text style={[s.rsvpBtnTxt, rsvped && { color: C.green }]}>
                {rsvped ? 'Going' : 'RSVP'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12,
    backgroundColor: NAVY,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#fff' },
  catBadge: {
    borderWidth: 1, borderRadius: 50,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  catBadgeTxt: { fontSize: 11, fontWeight: '700' },

  /* Hero */
  heroImage:       { width: '100%', height: 220 },
  heroPlaceholder: {
    width: '100%', height: 180,
    alignItems: 'center', justifyContent: 'center',
  },
  heroEmoji: { fontSize: 72 },

  /* Main card */
  mainCard: {
    margin: 16, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border,
    borderRadius: 20, padding: 16, gap: 12,
  },

  titleRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  eventTitle: { fontSize: 20, fontWeight: '800', color: C.cream, letterSpacing: -0.4, marginBottom: 4 },
  organizer:  { fontSize: 13, color: C.c35 },

  freeBadge:    { backgroundColor: C.green + '18', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.green + '44', alignSelf: 'flex-start' },
  freeBadgeTxt: { fontSize: 11, fontWeight: '800', color: C.green },
  paidBadge:    { backgroundColor: C.gold + '18', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.gold + '44', alignSelf: 'flex-start' },
  paidBadgeTxt: { fontSize: 11, fontWeight: '800', color: C.gold },

  infoRow: { flexDirection: 'row' },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: C.card2, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    flexShrink: 1,
  },
  infoChipTxt: { fontSize: 13, color: C.c60, fontWeight: '500', flex: 1 },

  section:      { gap: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: C.c35, letterSpacing: 1.5, textTransform: 'uppercase' },
  descTxt:      { fontSize: 14, color: C.c60, lineHeight: 22 },

  linkChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.teal + '15', borderWidth: 1, borderColor: C.teal + '44',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  linkChipTxt: { flex: 1, fontSize: 13, color: C.teal, fontWeight: '600' },

  /* Map section */
  mapSection:    { paddingHorizontal: 16, marginBottom: 8 },
  sectionLabel2: { fontSize: 10, fontWeight: '800', color: C.c35, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  mapCard:       { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  map:           { width: '100%', height: 180 },

  /* Owner actions */
  ownerSection: { paddingHorizontal: 16, marginTop: 4, marginBottom: 8 },
  ownerRow:     { flexDirection: 'row', gap: 10 },
  ownerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 16, paddingVertical: 14,
    borderWidth: 1,
  },
  ownerBtnTxt: { fontSize: 14, fontWeight: '800' },

  /* Footer RSVP bar */
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 32, paddingTop: 14,
    backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border,
  },
  rsvpCount: { fontSize: 14, color: C.c35, fontWeight: '500' },
  rsvpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.vivid, borderRadius: 50,
    paddingHorizontal: 24, paddingVertical: 13,
    borderWidth: 1, borderColor: 'transparent',
    shadowColor: C.vivid, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8,
  },
  rsvpBtnGoing: {
    backgroundColor: C.green + '20',
    borderColor: C.green + '55',
    shadowColor: C.green,
  },
  rsvpBtnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
