import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, Animated, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { G_PRIMARY } from '../theme/colors';
import UserAvatar from '../components/UserAvatar';

const TOPICS = [
  { label: '#OPT',        icon: 'card-outline' },
  { label: '#H1B',        icon: 'briefcase-outline' },
  { label: '#Housing',    icon: 'home-outline' },
  { label: '#Jobs',       icon: 'search-outline' },
  { label: '#Healthcare', icon: 'medkit-outline' },
  { label: '#Legal',      icon: 'shield-checkmark-outline' },
  { label: '#Community',  icon: 'people-outline' },
  { label: '#Visa',       icon: 'document-text-outline' },
];

const SMART_ROUTES = [
  { key: 'job',      icon: 'briefcase-outline',        label: 'Post a Job',       sub: 'Hiring with visa sponsorship', color: '#3EC878', route: 'PostJob'      },
  { key: 'housing',  icon: 'home-outline',             label: 'List Housing',     sub: 'Room, apartment or sublet',    color: '#F5A623', route: 'Housing'      },
  { key: 'doctor',   icon: 'medkit-outline',           label: 'List as Doctor',   sub: 'Add your practice',            color: '#5BCFEF', route: 'ListDoctor'   },
  { key: 'attorney', icon: 'shield-checkmark-outline', label: 'List as Attorney', sub: 'Help immigrants legally',      color: '#9B72EF', route: 'ListAttorney' },
];

const MAX_CHARS  = 500;
const MAX_IMAGES = 4;

export default function CreatePostScreen({ navigation }) {
  const { colors: C }  = useTheme();
  const s              = useMemo(() => getStyles(C), [C]);
  const { user, api }  = useAuthStore();

  const [text,           setText]           = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [isAnonymous,    setIsAnonymous]    = useState(false);
  const [images,         setImages]         = useState([]);
  const [posting,        setPosting]        = useState(false);
  const [posted,         setPosted]         = useState(false);
  const [postError,      setPostError]      = useState('');
  const [postedCity,     setPostedCity]     = useState('');

  const successScale   = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const charCount  = text.length;
  const charPct    = charCount / MAX_CHARS;
  const charColor  = charPct > 0.9 ? C.vivid : charPct > 0.7 ? '#F5A623' : C.c35;
  const canPost    = text.trim().length > 0 && !posting;

  const toggleTopic = (label) =>
    setSelectedTopics(prev =>
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    );

  // ── Image picking ─────────────────────────────────────────────────────────
  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert('Limit reached', `You can attach up to ${MAX_IMAGES} images.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to attach images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.85,
    });
    if (!result.canceled) {
      setImages(prev => [...prev, ...result.assets].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (index) => setImages(prev => prev.filter((_, i) => i !== index));

  // ── Auto-detect GPS city + coords ─────────────────────────────────────────
  const getGpsData = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return { city: '', latitude: null, longitude: null };
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const lat6 = parseFloat(latitude.toFixed(6));
      const lng6 = parseFloat(longitude.toFixed(6));
      if (!place) return { city: '', latitude: lat6, longitude: lng6 };
      const city   = place.city || place.subregion || place.district || '';
      const region = place.region || place.country || '';
      return { city: city ? `${city}, ${region}` : region, latitude: lat6, longitude: lng6 };
    } catch {
      return { city: '', latitude: null, longitude: null };
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);
    setPostError('');
    try {
      const { city, latitude, longitude } = await getGpsData();
      const country = user?.profile?.home_country || '';

      let requestBody;
      if (images.length > 0) {
        const fd = new FormData();
        fd.append('body',         text.trim());
        fd.append('location',     city || '');
        fd.append('country',      country);
        fd.append('is_anonymous', isAnonymous ? 'true' : 'false');
        if (latitude  != null) fd.append('latitude',  String(latitude));
        if (longitude != null) fd.append('longitude', String(longitude));
        selectedTopics.forEach(t => fd.append('topics', t.replace('#', '')));
        const img = images[0];
        fd.append('image', {
          uri:  img.uri,
          name: img.fileName || `post_${Date.now()}.jpg`,
          type: img.mimeType || 'image/jpeg',
        });
        requestBody = fd;
      } else {
        requestBody = {
          body:         text.trim(),
          location:     city,
          latitude,
          longitude,
          country,
          is_anonymous: isAnonymous,
          topics:       selectedTopics.map(t => t.replace('#', '')),
        };
      }

      await api('/posts/', { method: 'POST', body: requestBody });
      setPostedCity(city);
      setPosted(true);
      Animated.parallel([
        Animated.spring(successScale,   { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } catch (e) {
      setPostError(e.message || 'Failed to post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const resetForm = () => {
    setText(''); setSelectedTopics([]); setPosted(false);
    setImages([]); setPostError(''); setPostedCity('');
    successScale.setValue(0); successOpacity.setValue(0);
  };

  const handleDone = () => { resetForm(); navigation.goBack(); };

  // ── Success screen ────────────────────────────────────────────────────────
  if (posted) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <Animated.View style={[s.successWrap, { opacity: successOpacity }]}>
          <Animated.View style={{ transform: [{ scale: successScale }], alignItems: 'center', width: '100%' }}>
            <View style={s.successIconWrap}>
              <Ionicons name="checkmark-circle" size={72} color={C.vivid} />
            </View>
            <Text style={s.successTitle}>Posted!</Text>
            <Text style={s.successSub}>
              Your post is live{postedCity ? ` · 📍 ${postedCity}` : ''}
            </Text>
            <View style={s.successCard}>
              <Text style={s.previewBody} numberOfLines={4}>{text}</Text>
              {selectedTopics.length > 0 && (
                <View style={s.previewFooter}>
                  {selectedTopics.map(t => (
                    <View key={t} style={[s.previewTag, { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]}>
                      <Text style={{ fontSize: 11, color: C.vivid, fontWeight: '700' }}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <TouchableOpacity style={s.doneBtn} onPress={handleDone} activeOpacity={0.85}>
              <Ionicons name="checkmark" size={18} color="white" />
              <Text style={s.doneBtnTxt}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.anotherBtn} onPress={resetForm} activeOpacity={0.7}>
              <Text style={s.anotherTxt}>Post another</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={C.c35} />
          </TouchableOpacity>
          <Text style={s.title}>New Post</Text>
          {canPost ? (
            <TouchableOpacity style={s.publishBtnWrap} onPress={handlePost} disabled={posting} activeOpacity={0.85}>
              <LinearGradient colors={G_PRIMARY} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.publishGrad}>
                {posting
                  ? <ActivityIndicator size="small" color="white" />
                  : <>
                      <Text style={s.publishTxt}>Publish</Text>
                      <Ionicons name="arrow-up-circle" size={16} color="white" />
                    </>
                }
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={s.publishBtnOff}>
              <Text style={s.publishTxtOff}>Publish</Text>
            </View>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >

          {/* ── Error ──────────────────────────────────────────── */}
          {postError ? (
            <View style={s.errorBanner}>
              <Ionicons name="warning-outline" size={16} color={C.vivid} />
              <Text style={[s.errorTxt, { color: C.vivid }]}>{postError}</Text>
            </View>
          ) : null}

          {/* ── Author row ─────────────────────────────────────── */}
          <View style={s.authorRow}>
            <View style={s.avatarRing}>
              <UserAvatar
                uri={isAnonymous ? null : user?.profile?.avatar_url}
                emoji={isAnonymous ? '🕵️' : user?.profile?.avatar_emoji}
                name={user?.name}
                size={38}
                bg={isAnonymous ? C.card2 : C.vividD}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.authorName}>
                {isAnonymous ? 'Anonymous' : (user?.name || 'You')}
              </Text>
              <View style={s.locationPill}>
                <Ionicons name="location-outline" size={11} color={C.c35} />
                <Text style={s.locationPillTxt}>Auto-detected on publish</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[s.anonToggle, isAnonymous && s.anonToggleActive]}
              onPress={() => setIsAnonymous(p => !p)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isAnonymous ? 'eye-off-outline' : 'eye-outline'}
                size={14}
                color={isAnonymous ? C.cream : C.c35}
              />
              <Text style={[s.anonTxt, isAnonymous && { color: C.cream }]}>
                {isAnonymous ? 'Anon' : 'Public'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Divider ────────────────────────────────────────── */}
          <View style={s.divider} />

          {/* ── Text input ─────────────────────────────────────── */}
          <View style={s.textWrap}>
            <TextInput
              style={s.textInput}
              placeholder="What's on your mind?"
              placeholderTextColor={C.c35}
              multiline
              value={text}
              onChangeText={t => t.length <= MAX_CHARS && setText(t)}
              textAlignVertical="top"
              autoFocus
            />
            {/* Char counter arc */}
            <View style={s.charRow}>
              <View style={[s.charBar, { backgroundColor: C.border }]}>
                <View style={[s.charFill, { width: `${Math.min(charPct * 100, 100)}%`, backgroundColor: charColor }]} />
              </View>
              <Text style={[s.charCount, { color: charColor }]}>{MAX_CHARS - charCount}</Text>
            </View>
          </View>

          {/* ── Bottom toolbar ─────────────────────────────────── */}
          <View style={s.toolbar}>
            <TouchableOpacity style={s.toolBtn} onPress={pickImages} activeOpacity={0.7}>
              <Ionicons name="image-outline" size={22} color={C.c35} />
              {images.length > 0 && (
                <View style={s.toolBadge}><Text style={s.toolBadgeTxt}>{images.length}</Text></View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.toolBtn} activeOpacity={0.7}>
              <Ionicons name="at-outline" size={22} color={C.c35} />
            </TouchableOpacity>
            <TouchableOpacity style={s.toolBtn} activeOpacity={0.7}>
              <Ionicons name="happy-outline" size={22} color={C.c35} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <Text style={[s.charCountInline, { color: charColor }]}>{charCount}/{MAX_CHARS}</Text>
          </View>

          {/* ── Image previews ─────────────────────────────────── */}
          {images.length > 0 && (
            <View style={s.imgRow}>
              {images.map((_img, index) => (
                <View key={index} style={s.imgThumbWrap}>
                  <View style={[s.imgThumb, { backgroundColor: C.card2 }]}>
                    <Ionicons name="image" size={28} color={C.c35} />
                  </View>
                  <TouchableOpacity
                    style={s.imgRemoveBtn}
                    onPress={() => removeImage(index)}
                    hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                  >
                    <Ionicons name="close" size={10} color={C.cream} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={s.divider} />

          {/* ── Topics ─────────────────────────────────────────── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Ionicons name="pricetag-outline" size={14} color={C.c35} />
              <Text style={s.sectionLabel}>Topics</Text>
              {selectedTopics.length > 0 && (
                <View style={s.countBadge}>
                  <Text style={s.countBadgeTxt}>{selectedTopics.length}</Text>
                </View>
              )}
            </View>
            <View style={s.topicsWrap}>
              {TOPICS.map(({ label, icon }) => {
                const sel = selectedTopics.includes(label);
                return (
                  <TouchableOpacity
                    key={label}
                    style={[s.topicPill, sel && s.topicPillActive]}
                    onPress={() => toggleTopic(label)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={icon} size={12} color={sel ? C.vivid : C.c35} />
                    <Text style={[s.topicTxt, sel && s.topicTxtActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={s.divider} />

          {/* ── Smart routes ───────────────────────────────────── */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Ionicons name="flash-outline" size={14} color={C.c35} />
              <Text style={s.sectionLabel}>Quick Actions</Text>
            </View>
            <View style={s.smartGrid}>
              {SMART_ROUTES.map(r => (
                <TouchableOpacity
                  key={r.key}
                  style={[s.smartCard, { borderColor: r.color + '33' }]}
                  onPress={() => navigation.navigate(r.route)}
                  activeOpacity={0.85}
                >
                  <View style={[s.smartIcon, { backgroundColor: r.color + '15' }]}>
                    <Ionicons name={r.icon} size={20} color={r.color} />
                  </View>
                  <Text style={[s.smartLabel, { color: r.color }]}>{r.label}</Text>
                  <Text style={s.smartSub}>{r.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.divider} />

          {/* ── Guidelines ─────────────────────────────────────── */}
          <View style={[s.section, { paddingBottom: 4 }]}>
            <View style={s.guideCard}>
              <Ionicons name="information-circle-outline" size={16} color={C.c35} />
              <Text style={s.guideTxt}>
                Be respectful · No spam · Sensitive advice should note it's not professional
              </Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },

  // Header
  header:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  closeBtn:      { width: 36, height: 36, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  title:         { flex: 1, fontSize: 17, fontWeight: '800', color: C.cream, letterSpacing: -0.3 },
  publishBtnWrap: { borderRadius: 50, overflow: 'hidden' },
  publishGrad:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9 },
  publishBtnOff:  { borderRadius: 50, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  publishTxt:     { fontSize: 13, fontWeight: '700', color: 'white' },
  publishTxtOff:  { fontSize: 13, fontWeight: '700', color: C.c35 },

  // Error
  errorBanner:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: C.vivid + '55', backgroundColor: C.vividD, padding: 12 },
  errorTxt:      { fontSize: 13, fontWeight: '600', flex: 1 },

  // Author
  authorRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  avatarRing:    { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: C.vivid, alignItems: 'center', justifyContent: 'center' },
  authorAv:      { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  authorName:    { fontSize: 14, fontWeight: '700', color: C.cream, marginBottom: 4 },
  locationPill:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locationPillTxt: { fontSize: 11, color: C.c35 },
  anonToggle:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  anonToggleActive: { backgroundColor: C.card2, borderColor: C.border2 },
  anonTxt:       { fontSize: 11, color: C.c35, fontWeight: '600' },

  // Text input
  divider:       { height: 1, backgroundColor: C.border, marginVertical: 0 },
  textWrap:      { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  textInput:     { fontSize: 16, color: C.cream, lineHeight: 26, minHeight: 130, backgroundColor: 'transparent' },
  charRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8, paddingBottom: 4 },
  charBar:       { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  charFill:      { height: '100%', borderRadius: 2 },
  charCount:     { fontSize: 11, fontWeight: '600', minWidth: 32, textAlign: 'right' },

  // Toolbar
  toolbar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
  toolBtn:       { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  toolBadge:     { position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: C.vivid, alignItems: 'center', justifyContent: 'center' },
  toolBadgeTxt:  { fontSize: 8, fontWeight: '800', color: 'white' },
  charCountInline: { fontSize: 12, fontWeight: '600', paddingRight: 6 },

  // Images
  imgRow:        { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  imgThumbWrap:  { position: 'relative' },
  imgThumb:      { width: 76, height: 76, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  imgRemoveBtn:  { position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderRadius: 10, backgroundColor: C.vivid, alignItems: 'center', justifyContent: 'center' },

  // Sections
  section:       { paddingHorizontal: 16, paddingVertical: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionLabel:  { fontSize: 12, fontWeight: '700', color: C.c35, letterSpacing: 0.8, textTransform: 'uppercase', flex: 1 },
  countBadge:    { width: 18, height: 18, borderRadius: 9, backgroundColor: C.vivid, alignItems: 'center', justifyContent: 'center' },
  countBadgeTxt: { fontSize: 10, fontWeight: '800', color: 'white' },

  // Topics
  topicsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicPill:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  topicPillActive: { backgroundColor: C.vividD, borderColor: C.vivid + '66' },
  topicTxt:      { fontSize: 12, color: C.c35, fontWeight: '600' },
  topicTxtActive: { color: C.vivid, fontWeight: '700' },

  // Smart routes
  smartGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  smartCard:     { width: '47%', borderWidth: 1, borderRadius: 16, padding: 14, gap: 8, backgroundColor: C.card },
  smartIcon:     { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  smartLabel:    { fontSize: 13, fontWeight: '800' },
  smartSub:      { fontSize: 11, color: C.c35, lineHeight: 15 },

  // Guidelines
  guideCard:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border },
  guideTxt:      { fontSize: 12, color: C.c35, lineHeight: 18, flex: 1 },

  // Success
  successWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  successIconWrap: { marginBottom: 16 },
  successTitle:  { fontSize: 34, fontWeight: '900', color: C.cream, letterSpacing: -1, marginBottom: 6 },
  successSub:    { fontSize: 14, color: C.c35, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  successCard:   { alignSelf: 'stretch', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, marginBottom: 24 },
  previewBody:   { fontSize: 14, color: C.c60, lineHeight: 22, marginBottom: 10 },
  previewFooter: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  previewTag:    { borderWidth: 1, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4 },
  doneBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch', borderRadius: 16, paddingVertical: 15, justifyContent: 'center', marginBottom: 12, backgroundColor: C.vivid },
  doneBtnTxt:    { fontSize: 16, fontWeight: '800', color: 'white' },
  anotherBtn:    { paddingVertical: 12 },
  anotherTxt:    { fontSize: 14, color: C.c35, fontWeight: '600', textAlign: 'center' },
});
