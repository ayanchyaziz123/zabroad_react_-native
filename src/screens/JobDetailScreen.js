import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useJobsStore } from '../store/jobsStore';
import { JOB_CATEGORIES } from './JobsScreen';

export default function JobDetailScreen({ route, navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const [job, setJob] = useState(route.params.job);
  const { user: authUser } = useAuthStore();
  const deleteJob = useJobsStore(st => st.deleteJob);

  const isOwn = authUser?.id && job.poster_id && String(authUser.id) === String(job.poster_id);
  const catInfo = JOB_CATEGORIES.find(c => c.key === job.category);

  const [saved,    setSaved]    = useState(false);
  const [messaged, setMessaged] = useState(false);
  const saveScale = useRef(new Animated.Value(1)).current;

  function onSave() {
    setSaved(v => !v);
    Animated.sequence([
      Animated.spring(saveScale, { toValue: 1.3, useNativeDriver: true, speed: 60, bounciness: 20 }),
      Animated.spring(saveScale, { toValue: 1,   useNativeDriver: true, speed: 30 }),
    ]).start();
  }

  function onMessage() {
    setMessaged(true);
    if (job.poster_id) {
      navigation.navigate('AppMain', { screen: 'Chat', params: { userId: job.poster_id } });
    }
  }

  async function onShare() {
    await Share.share({ message: `${job.title} at ${job.company} — shared via Zabroad` });
  }

  function onDelete() {
    Alert.alert('Delete job', 'Remove this job listing permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteJob(job.id);
            navigation.navigate('Jobs');
          } catch {
            Alert.alert('Error', 'Could not delete. Please try again.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{job.title}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.iconBtn} onPress={onShare} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={19} color={C.cream} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={onSave} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ scale: saveScale }] }}>
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={19} color={saved ? C.vivid : C.cream} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Hero card */}
        <View style={s.heroCard}>
          <View style={s.heroTop}>
            <View style={[s.companyLogo, { backgroundColor: C.greenD }]}>
              <Ionicons name="briefcase" size={28} color={C.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.jobTitle}>{job.title}</Text>
              <Text style={s.jobCompany}>{job.company}</Text>
            </View>
            {job.hot && (
              <View style={[s.hotBadge, { backgroundColor: C.vivid + '22', borderColor: C.vivid + '44' }]}>
                <Ionicons name="flame" size={12} color={C.vivid} />
                <Text style={[s.hotTxt, { color: C.vivid }]}>Hot</Text>
              </View>
            )}
          </View>

          {/* Quick info row */}
          <View style={s.infoRow}>
            <View style={s.infoItem}>
              <Ionicons name="location-outline" size={15} color={C.c35} />
              <Text style={s.infoTxt}>{job.location}</Text>
            </View>
            <View style={s.infoItem}>
              <Ionicons name="time-outline" size={15} color={C.c35} />
              <Text style={s.infoTxt}>{job.posted}</Text>
            </View>
            {catInfo && catInfo.key !== 'all' && (
              <View style={[s.infoItem, { backgroundColor: C.greenD, borderColor: C.green + '44' }]}>
                <Ionicons name={catInfo.icon} size={14} color={C.green} />
                <Text style={[s.infoTxt, { color: C.green }]}>{catInfo.label}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>About this job</Text>
          <Text style={s.descTxt}>{job.desc}</Text>
        </View>

        {/* Location map */}
        {(job.lat != null && job.lng != null) && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Location</Text>
            <MapView
              style={s.map}
              region={{
                latitude:       Number(job.lat),
                longitude:      Number(job.lng),
                latitudeDelta:  0.008,
                longitudeDelta: 0.008,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker coordinate={{ latitude: Number(job.lat), longitude: Number(job.lng) }} />
            </MapView>
            {job.location ? (
              <View style={s.mapLocRow}>
                <Ionicons name="location-outline" size={13} color={C.c35} />
                <Text style={[s.mapLocTxt, { color: C.c35 }]} numberOfLines={2}>{job.location}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Posted by */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Posted by</Text>
          <View style={s.posterCard}>
            <View style={[s.posterAv, { backgroundColor: C.vividD }]}>
              <Text style={[s.posterInitial, { color: C.vivid }]}>{(job.poster || '?')[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.posterName}>{job.poster}</Text>
              <Text style={s.posterSub}>Community member · {job.posted}</Text>
            </View>
            <TouchableOpacity
              style={[s.followBtn, { borderColor: C.vivid + '55', backgroundColor: C.vividD }]}
              activeOpacity={0.8}
            >
              <Text style={[s.followTxt, { color: C.vivid }]}>View Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Community */}
        {job.communities?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Communities sharing this</Text>
            <View style={s.communityRow}>
              {job.communities.map(c => (
                <View key={c} style={[s.communityChip, { backgroundColor: C.card2, borderColor: C.border }]}>
                  <Text style={s.communityTxt}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={[s.tipCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={C.c35} />
          <Text style={s.tipTxt}>
            Message the poster directly to ask about the role, hours, or how to apply.
          </Text>
        </View>

      </ScrollView>

      {/* Bottom CTA */}
      <View style={s.footer}>
        {isOwn ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[s.editBtn, { backgroundColor: C.greenD, borderColor: C.green + '55' }]}
              onPress={() => navigation.navigate('EditJob', { job, onSave: setJob })}
              activeOpacity={0.85}
            >
              <Ionicons name="pencil-outline" size={18} color={C.green} />
              <Text style={[s.editBtnTxt, { color: C.green }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.deleteBtn, { backgroundColor: '#FF4D4D18', borderColor: '#FF4D4D44' }]}
              onPress={onDelete}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={18} color="#FF4D4D" />
              <Text style={[s.deleteBtnTxt, { color: '#FF4D4D' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[s.msgBtn, messaged && { backgroundColor: C.vividD, borderColor: C.vivid + '55' }]}
            onPress={onMessage}
            activeOpacity={0.85}
          >
            <Ionicons name={messaged ? 'checkmark-circle' : 'chatbubble'} size={18} color={messaged ? C.vivid : 'white'} />
            <Text style={[s.msgTxt, messaged && { color: C.vivid }]}>
              {messaged ? 'Message Sent' : `Message ${(job.poster || 'Poster').split(' ')[0]}`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10 },
  backBtn:     { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.cream },
  iconBtn:     { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

  heroCard:    { margin: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 16 },
  heroTop:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  companyLogo: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  jobTitle:    { fontSize: 18, fontWeight: '800', color: C.cream, letterSpacing: -0.4, marginBottom: 3 },
  jobCompany:  { fontSize: 13, color: C.c35 },
  hotBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  hotTxt:      { fontSize: 11, fontWeight: '700' },

  infoRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  infoTxt:  { fontSize: 12, color: C.c35, fontWeight: '500' },

  section:      { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: C.c35, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  descTxt:      { fontSize: 14, color: C.c60, lineHeight: 22 },
  map:          { width: '100%', height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  mapLocRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 4 },
  mapLocTxt:    { fontSize: 12, flex: 1, lineHeight: 17 },

  posterCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14 },
  posterAv:     { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  posterInitial:{ fontSize: 18, fontWeight: '800' },
  posterName:   { fontSize: 14, fontWeight: '700', color: C.cream, marginBottom: 2 },
  posterSub:    { fontSize: 11, color: C.c35 },
  followBtn:    { borderWidth: 1, borderRadius: 50, paddingHorizontal: 12, paddingVertical: 6 },
  followTxt:    { fontSize: 12, fontWeight: '700' },

  communityRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  communityChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, borderWidth: 1 },
  communityTxt:  { fontSize: 12, color: C.c35, fontWeight: '600' },

  tipCard:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderRadius: 14, padding: 14 },
  tipTxt:   { flex: 1, fontSize: 12, color: C.c35, lineHeight: 18 },

  footer:      { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border },
  msgBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.vivid, borderRadius: 16, paddingVertical: 15, borderWidth: 1, borderColor: 'transparent' },
  msgTxt:      { fontSize: 15, fontWeight: '800', color: 'white' },
  editBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 15, borderWidth: 1 },
  editBtnTxt:  { fontSize: 15, fontWeight: '800' },
  deleteBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 15, borderWidth: 1 },
  deleteBtnTxt:{ fontSize: 15, fontWeight: '800' },
});
