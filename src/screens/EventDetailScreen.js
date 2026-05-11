import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Linking, Alert, Share, Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { formatPrice } from '../utils/formatPrice';

const CATEGORY_META = {
  legal:      { emoji: '⚖️', label: 'Legal' },
  jobs:       { emoji: '💼', label: 'Jobs' },
  community:  { emoji: '🤝', label: 'Community' },
  health:     { emoji: '🧠', label: 'Health' },
  cultural:   { emoji: '🎉', label: 'Cultural' },
  networking: { emoji: '🌐', label: 'Networking' },
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

  const [event,       setEvent]       = useState(route.params.event);
  const [rsvped,      setRsvped]      = useState(!!event.is_rsvped);
  const [rsvpCount,   setRsvpCount]   = useState(event.rsvp_count ?? 0);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [messaged,    setMessaged]    = useState(false);
  const saveScale = useRef(new Animated.Value(1)).current;

  const cat   = getCatMeta(event.category, C);
  const isOwn = user?.id && event.posted_by_id && String(user.id) === String(event.posted_by_id);

  const hasCoords = event.latitude != null && event.longitude != null
    && !isNaN(Number(event.latitude)) && !isNaN(Number(event.longitude));

  const organizerInitial = (event.posted_by_name || '?')[0].toUpperCase();

  // ── Save / Bookmark ───────────────────────────────────────────────────────
  function onSave() {
    setSaved(v => !v);
    Animated.sequence([
      Animated.spring(saveScale, { toValue: 1.35, useNativeDriver: true, speed: 60, bounciness: 20 }),
      Animated.spring(saveScale, { toValue: 1,    useNativeDriver: true, speed: 30 }),
    ]).start();
  }

  // ── Share ─────────────────────────────────────────────────────────────────
  async function onShare() {
    const parts = [event.title];
    if (event.date) parts.push(formatDate(event.date));
    if (event.location) parts.push(event.location);
    await Share.share({ message: parts.join(' · ') + ' — shared via Zabroad' });
  }

  // ── Message Organizer ─────────────────────────────────────────────────────
  function onMessage() {
    setMessaged(true);
    if (event.posted_by_id) {
      navigation.navigate('AppMain', { screen: 'Chat', params: { userId: event.posted_by_id } });
    }
  }

  // ── RSVP ──────────────────────────────────────────────────────────────────
  async function toggleRsvp() {
    if (rsvpLoading) return;
    setRsvpLoading(true);
    const wasGoing = rsvped;
    setRsvped(!wasGoing);
    setRsvpCount(c => wasGoing ? Math.max(0, c - 1) : c + 1);
    try {
      const res = await api(`/events/${event.id}/rsvp/`, { method: 'POST' });
      if (res?.is_rsvped !== undefined) setRsvped(res.is_rsvped);
      if (res?.rsvp_count !== undefined) setRsvpCount(res.rsvp_count);
    } catch (e) {
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
              navigation.navigate('Events');
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
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{event.title}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.iconBtn} onPress={onShare} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={19} color={C.cream} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={onSave} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ scale: saveScale }] }}>
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={19}
                color={saved ? C.gold : C.cream}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
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
        <View style={[s.mainCard, { backgroundColor: C.card, borderColor: C.border }]}>

          {/* Category + free/paid badges */}
          <View style={s.badgeRow}>
            <View style={[s.catBadge, { backgroundColor: cat.color + '22', borderColor: cat.color + '55' }]}>
              <Text style={[s.catBadgeTxt, { color: cat.color }]}>{cat.emoji} {cat.label}</Text>
            </View>
            {event.is_free ? (
              <View style={[s.freeBadge, { backgroundColor: C.green + '18', borderColor: C.green + '44' }]}>
                <Text style={[s.freeBadgeTxt, { color: C.green }]}>FREE</Text>
              </View>
            ) : (
              <View style={[s.paidBadge, { backgroundColor: C.gold + '18', borderColor: C.gold + '44' }]}>
                <Text style={[s.paidBadgeTxt, { color: C.gold }]}>
                  {formatPrice(event.price, event.currency) || 'PAID'}
                </Text>
              </View>
            )}
          </View>

          <Text style={s.eventTitle}>{event.title}</Text>

          {/* RSVP count */}
          <View style={s.rsvpCountRow}>
            <Ionicons name="people-outline" size={14} color={C.c35} />
            <Text style={[s.rsvpCountTxt, { color: C.c35 }]}>{rsvpCount} going</Text>
          </View>

          {/* Date chip */}
          <View style={s.infoRow}>
            <View style={[s.infoChip, { backgroundColor: C.card2, borderColor: C.border }]}>
              <Ionicons name="calendar-outline" size={15} color={C.vivid} />
              <Text style={[s.infoChipTxt, { color: C.c60 }]}>{formatDate(event.date)}</Text>
            </View>
          </View>

          {/* Location chip */}
          {event.location ? (
            <View style={s.infoRow}>
              <View style={[s.infoChip, { backgroundColor: C.card2, borderColor: C.border }]}>
                <Ionicons name="location-outline" size={15} color={C.gold} />
                <Text style={[s.infoChipTxt, { color: C.c60 }]}>{event.location}</Text>
              </View>
            </View>
          ) : null}

          {/* Description */}
          {event.description ? (
            <View style={s.section}>
              <Text style={[s.sectionLabel, { color: C.c35 }]}>ABOUT THIS EVENT</Text>
              <Text style={[s.descTxt, { color: C.c60 }]}>{event.description}</Text>
            </View>
          ) : null}

          {/* Link chip */}
          {event.link ? (
            <TouchableOpacity
              style={[s.linkChip, { backgroundColor: C.teal + '15', borderColor: C.teal + '44' }]}
              onPress={openLink}
              activeOpacity={0.8}
            >
              <Ionicons name="link-outline" size={16} color={C.teal} />
              <Text style={[s.linkChipTxt, { color: C.teal }]} numberOfLines={1}>{event.link}</Text>
              <Ionicons name="open-outline" size={14} color={C.teal} />
            </TouchableOpacity>
          ) : null}

        </View>

        {/* ── Map ── */}
        {hasCoords ? (
          <View style={s.mapSection}>
            <Text style={[s.sectionLabel2, { color: C.c35 }]}>LOCATION</Text>
            <MapView
              style={s.map}
              region={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker
                coordinate={{ latitude: Number(event.latitude), longitude: Number(event.longitude) }}
                title={event.title}
                description={event.location}
              />
            </MapView>
            {event.location ? (
              <View style={s.mapLocRow}>
                <Ionicons name="location-outline" size={13} color={C.c35} />
                <Text style={[s.mapLocTxt, { color: C.c35 }]} numberOfLines={2}>{event.location}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ── Organizer card ── */}
        <View style={s.organizerSection}>
          <Text style={[s.sectionLabel2, { color: C.c35 }]}>ORGANIZER</Text>
          <View style={[s.organizerCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={[s.organizerAv, { backgroundColor: cat.color + '22' }]}>
              <Text style={[s.organizerInitial, { color: cat.color }]}>{organizerInitial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.organizerName, { color: C.cream }]}>
                {event.posted_by_name || 'Community Member'}
              </Text>
              <Text style={[s.organizerSub, { color: C.c35 }]}>Event organizer</Text>
            </View>
            {!isOwn && (
              <TouchableOpacity
                style={[s.msgSmallBtn, { borderColor: C.vivid + '55', backgroundColor: C.vividD }]}
                onPress={onMessage}
                activeOpacity={0.8}
              >
                <Text style={[s.msgSmallTxt, { color: C.vivid }]}>Message</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ height: 8 }} />
      </ScrollView>

      {/* ── Footer ── */}
      <View style={[s.footer, { backgroundColor: C.bg, borderTopColor: C.border }]}>
        {isOwn ? (
          <>
            <TouchableOpacity
              style={[s.editBtn, { backgroundColor: C.greenD, borderColor: C.green + '55' }]}
              onPress={() => navigation.navigate('EditEvent', { event })}
              activeOpacity={0.85}
            >
              <Ionicons name="pencil-outline" size={18} color={C.green} />
              <Text style={[s.editBtnTxt, { color: C.green }]}>Edit Event</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.deleteBtn, { backgroundColor: '#FF4D4D18', borderColor: '#FF4D4D44' }]}
              onPress={onDelete}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={18} color="#FF4D4D" />
              <Text style={[s.deleteBtnTxt, { color: '#FF4D4D' }]}>Delete</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[s.msgIconBtn, { borderColor: C.border, backgroundColor: C.card }]}
              onPress={onMessage}
              activeOpacity={0.85}
            >
              <Ionicons
                name={messaged ? 'checkmark-circle-outline' : 'chatbubble-ellipses-outline'}
                size={20}
                color={messaged ? C.green : C.cream}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.rsvpBtn, rsvped
                ? { backgroundColor: C.green + '20', borderColor: C.green + '55' }
                : { backgroundColor: C.vivid, borderColor: 'transparent' }
              ]}
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
                  <Text style={[s.rsvpBtnTxt, { color: rsvped ? C.green : '#fff' }]}>
                    {rsvped ? 'Going' : 'RSVP'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.cream },
  iconBtn:     { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

  heroImage:       { width: '100%', height: 240, backgroundColor: C.card2 },
  heroPlaceholder: { width: '100%', height: 180, alignItems: 'center', justifyContent: 'center' },
  heroEmoji:       { fontSize: 72 },

  mainCard: { margin: 16, borderRadius: 20, borderWidth: 1, padding: 16, gap: 12 },

  badgeRow:    { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  catBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4 },
  catBadgeTxt: { fontSize: 11, fontWeight: '700' },
  freeBadge:   { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  freeBadgeTxt:{ fontSize: 11, fontWeight: '800' },
  paidBadge:   { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  paidBadgeTxt:{ fontSize: 11, fontWeight: '800' },

  eventTitle:  { fontSize: 20, fontWeight: '800', color: C.cream, letterSpacing: -0.4 },

  rsvpCountRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rsvpCountTxt: { fontSize: 13, fontWeight: '500' },

  infoRow:    { flexDirection: 'row' },
  infoChip:   { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flexShrink: 1 },
  infoChipTxt:{ fontSize: 13, fontWeight: '500', flex: 1 },

  section:      { gap: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  descTxt:      { fontSize: 14, lineHeight: 22 },

  linkChip:    { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  linkChipTxt: { flex: 1, fontSize: 13, fontWeight: '600' },

  mapSection:   { paddingHorizontal: 16, marginBottom: 16 },
  sectionLabel2:{ fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  map:          { width: '100%', height: 180, borderRadius: 14, overflow: 'hidden', marginBottom: 8 },
  mapLocRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 5 },
  mapLocTxt:    { fontSize: 12, flex: 1, lineHeight: 17 },

  organizerSection: { paddingHorizontal: 16, marginBottom: 8 },
  organizerCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  organizerAv:      { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  organizerInitial: { fontSize: 18, fontWeight: '800' },
  organizerName:    { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  organizerSub:     { fontSize: 11 },
  msgSmallBtn:      { borderWidth: 1, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6 },
  msgSmallTxt:      { fontSize: 12, fontWeight: '700' },

  footer:     { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12, borderTopWidth: 1 },

  msgIconBtn: { width: 50, height: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  rsvpBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, borderWidth: 1 },
  rsvpBtnTxt: { fontSize: 15, fontWeight: '800' },

  editBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, borderWidth: 1 },
  editBtnTxt:  { fontSize: 15, fontWeight: '800' },
  deleteBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, borderWidth: 1 },
  deleteBtnTxt:{ fontSize: 15, fontWeight: '800' },
});
