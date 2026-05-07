import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, Animated, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import UserAvatar from '../components/UserAvatar';

const NAVY = '#1B3266';

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
  { key: 'job',      icon: 'briefcase-outline',        label: 'Post a Job',       sub: 'Hiring with visa sponsorship', color: '#3B8BF7', route: 'PostJob'      },
  { key: 'housing',  icon: 'home-outline',             label: 'List Housing',     sub: 'Room, apartment or sublet',    color: '#F4A227', route: 'PostHousing'  },
  { key: 'market',   icon: 'storefront-outline',       label: 'Marketplace',      sub: 'Sell something to community',  color: '#28D99E', route: 'PostMarketplace' },
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

  const charCount = text.length;
  const charPct   = charCount / MAX_CHARS;
  const charColor = charPct > 0.9 ? '#FF4444' : charPct > 0.7 ? '#F4A227' : C.c35;
  const canPost   = text.trim().length > 0 && !posting;

  const toggleTopic = (label) =>
    setSelectedTopics(prev =>
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    );

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
        fd.append('image', { uri: img.uri, name: img.fileName || `post_${Date.now()}.jpg`, type: img.mimeType || 'image/jpeg' });
        requestBody = fd;
      } else {
        requestBody = {
          body: text.trim(), location: city, latitude, longitude,
          country, is_anonymous: isAnonymous,
          topics: selectedTopics.map(t => t.replace('#', '')),
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
      <SafeAreaView style={[s.safe, { backgroundColor: NAVY }]} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity style={s.headerBtn} onPress={handleDone} activeOpacity={0.8}>
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>New Post</Text>
          <View style={{ width: 34 }} />
        </View>
        <View style={[s.safe, { backgroundColor: C.bg }]}>
          <Animated.View style={[s.successWrap, { opacity: successOpacity }]}>
            <Animated.View style={[{ transform: [{ scale: successScale }], alignItems: 'center', width: '100%' }]}>
              <View style={s.successCircle}>
                <Ionicons name="checkmark" size={48} color="#fff" />
              </View>
              <Text style={[s.successTitle, { color: C.cream }]}>Posted!</Text>
              <Text style={[s.successSub, { color: C.c35 }]}>
                Your post is live{postedCity ? ` · 📍 ${postedCity}` : ''}
              </Text>
              <View style={[s.successCard, { backgroundColor: C.card, borderColor: C.border }]}>
                <Text style={[s.previewBody, { color: C.cream }]} numberOfLines={4}>{text}</Text>
                {selectedTopics.length > 0 && (
                  <View style={s.previewFooter}>
                    {selectedTopics.map(t => (
                      <View key={t} style={[s.previewTag, { backgroundColor: '#3B8BF715', borderColor: '#3B8BF744' }]}>
                        <Text style={{ fontSize: 11, color: '#3B8BF7', fontWeight: '700' }}>{t}</Text>
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
                <Text style={[s.anotherTxt, { color: C.c35 }]}>Post another</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: NAVY }]} edges={['top']}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>New Post</Text>
        <TouchableOpacity
          style={[s.publishBtn, !canPost && s.publishBtnOff]}
          onPress={handlePost}
          disabled={!canPost}
          activeOpacity={0.85}
        >
          {posting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={[s.publishTxt, !canPost && s.publishTxtOff]}>Publish</Text>
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[s.safe, { backgroundColor: C.bg }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >

          {/* ── Error ───────────────────────────────────────────────── */}
          {postError ? (
            <View style={[s.errorBanner, { borderColor: '#FF444455', backgroundColor: '#FF44441A' }]}>
              <Ionicons name="warning-outline" size={16} color="#FF4444" />
              <Text style={[s.errorTxt, { color: '#FF4444' }]}>{postError}</Text>
            </View>
          ) : null}

          {/* ── Author row ──────────────────────────────────────────── */}
          <View style={s.authorRow}>
            <View style={[s.avatarRing, { borderColor: '#3B8BF7' }]}>
              <UserAvatar
                uri={isAnonymous ? null : user?.profile?.avatar_url}
                emoji={isAnonymous ? '🕵️' : user?.profile?.avatar_emoji}
                name={user?.name}
                size={38}
                bg={isAnonymous ? C.card : '#1A3266'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.authorName, { color: C.cream }]}>
                {isAnonymous ? 'Anonymous' : (user?.name || 'You')}
              </Text>
              <View style={s.locRow}>
                <Ionicons name="location-outline" size={10} color={C.c35} />
                <Text style={[s.locTxt, { color: C.c35 }]}>Auto-detected on publish</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[s.anonBtn, isAnonymous && { backgroundColor: '#3B8BF722', borderColor: '#3B8BF766' }]}
              onPress={() => setIsAnonymous(p => !p)}
              activeOpacity={0.8}
            >
              <Ionicons name={isAnonymous ? 'eye-off-outline' : 'eye-outline'} size={13} color={isAnonymous ? '#3B8BF7' : C.c35} />
              <Text style={[s.anonTxt, { color: isAnonymous ? '#3B8BF7' : C.c35 }]}>
                {isAnonymous ? 'Anon' : 'Public'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[s.divider, { backgroundColor: C.border }]} />

          {/* ── Text input ──────────────────────────────────────────── */}
          <View style={s.textWrap}>
            <TextInput
              style={[s.textInput, { color: C.cream }]}
              placeholder="What's on your mind?"
              placeholderTextColor={C.c35}
              multiline
              value={text}
              onChangeText={t => t.length <= MAX_CHARS && setText(t)}
              textAlignVertical="top"
              autoFocus
            />
            <View style={s.charRow}>
              <View style={[s.charBarBg, { backgroundColor: C.border }]}>
                <View style={[s.charBarFill, { width: `${Math.min(charPct * 100, 100)}%`, backgroundColor: charColor }]} />
              </View>
              <Text style={[s.charCount, { color: charColor }]}>{MAX_CHARS - charCount}</Text>
            </View>
          </View>

          {/* ── Toolbar ─────────────────────────────────────────────── */}
          <View style={[s.toolbar, { borderTopColor: C.border }]}>
            <TouchableOpacity style={[s.toolBtn, { backgroundColor: C.card, borderColor: C.border }]} onPress={pickImages} activeOpacity={0.75}>
              <Ionicons name="image-outline" size={18} color={images.length > 0 ? '#3B8BF7' : C.c35} />
              {images.length > 0 && (
                <View style={s.toolBadge}><Text style={s.toolBadgeTxt}>{images.length}</Text></View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[s.toolBtn, { backgroundColor: C.card, borderColor: C.border }]} activeOpacity={0.75}>
              <Ionicons name="at-outline" size={18} color={C.c35} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.toolBtn, { backgroundColor: C.card, borderColor: C.border }]} activeOpacity={0.75}>
              <Ionicons name="happy-outline" size={18} color={C.c35} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <Text style={[s.charInline, { color: charColor }]}>{charCount}/{MAX_CHARS}</Text>
          </View>

          {/* ── Image previews ──────────────────────────────────────── */}
          {images.length > 0 && (
            <View style={s.imgRow}>
              {images.map((img, index) => (
                <View key={index} style={s.imgWrap}>
                  <Image source={{ uri: img.uri }} style={[s.imgThumb, { backgroundColor: C.card }]} resizeMode="cover" />
                  <TouchableOpacity
                    style={s.imgRemove}
                    onPress={() => removeImage(index)}
                    hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                  >
                    <Ionicons name="close" size={10} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={[s.divider, { backgroundColor: C.border }]} />

          {/* ── Topics ──────────────────────────────────────────────── */}
          <View style={s.section}>
            <View style={s.sectionHdr}>
              <View style={[s.sectionIconBox, { backgroundColor: '#3B8BF715' }]}>
                <Ionicons name="pricetag-outline" size={14} color="#3B8BF7" />
              </View>
              <Text style={[s.sectionTitle, { color: C.cream }]}>Topics</Text>
              {selectedTopics.length > 0 && (
                <View style={s.countDot}>
                  <Text style={s.countDotTxt}>{selectedTopics.length}</Text>
                </View>
              )}
            </View>
            <View style={s.topicsWrap}>
              {TOPICS.map(({ label, icon }) => {
                const sel = selectedTopics.includes(label);
                return (
                  <TouchableOpacity
                    key={label}
                    style={[s.topicPill, { backgroundColor: C.card, borderColor: C.border }, sel && s.topicPillActive]}
                    onPress={() => toggleTopic(label)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={icon} size={12} color={sel ? '#3B8BF7' : C.c35} />
                    <Text style={[s.topicTxt, { color: sel ? '#3B8BF7' : C.c35 }, sel && { fontWeight: '700' }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[s.divider, { backgroundColor: C.border }]} />

          {/* ── Quick Actions ────────────────────────────────────────── */}
          <View style={s.section}>
            <View style={s.sectionHdr}>
              <View style={[s.sectionIconBox, { backgroundColor: '#F4A22715' }]}>
                <Ionicons name="flash-outline" size={14} color="#F4A227" />
              </View>
              <Text style={[s.sectionTitle, { color: C.cream }]}>Quick Actions</Text>
            </View>
            <View style={s.smartGrid}>
              {SMART_ROUTES.map(r => (
                <TouchableOpacity
                  key={r.key}
                  style={[s.smartCard, { backgroundColor: C.card, borderColor: r.color + '33' }]}
                  onPress={() => navigation.navigate(r.route)}
                  activeOpacity={0.85}
                >
                  <View style={[s.smartIconBox, { backgroundColor: r.color + '15' }]}>
                    <Ionicons name={r.icon} size={20} color={r.color} />
                  </View>
                  <Text style={[s.smartLabel, { color: r.color }]}>{r.label}</Text>
                  <Text style={[s.smartSub, { color: C.c35 }]}>{r.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[s.divider, { backgroundColor: C.border }]} />

          {/* ── Guidelines ──────────────────────────────────────────── */}
          <View style={[s.section, { paddingBottom: 8 }]}>
            <View style={[s.guideCard, { backgroundColor: C.card, borderColor: C.border }]}>
              <Ionicons name="shield-checkmark-outline" size={15} color={C.c35} />
              <Text style={[s.guideTxt, { color: C.c35 }]}>
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
  safe: { flex: 1 },

  // ── Header (navy) ──────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12,
    backgroundColor: NAVY,
  },
  headerBtn: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#fff', paddingLeft: 2 },
  publishBtn: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#3B8BF7',
  },
  publishBtnOff: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  publishTxt:    { fontSize: 13, fontWeight: '800', color: '#fff' },
  publishTxtOff: { color: 'rgba(255,255,255,0.4)' },

  // ── Error ──────────────────────────────────────────────────────────────────
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  errorTxt:    { fontSize: 13, fontWeight: '600', flex: 1 },

  // ── Author row ─────────────────────────────────────────────────────────────
  authorRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  avatarRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  authorName: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  locRow:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locTxt:     { fontSize: 11 },
  anonBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  anonTxt:    { fontSize: 11, fontWeight: '600' },

  // ── Text input ─────────────────────────────────────────────────────────────
  divider:    { height: StyleSheet.hairlineWidth },
  textWrap:   { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  textInput:  { fontSize: 16, lineHeight: 26, minHeight: 130, backgroundColor: 'transparent' },
  charRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8 },
  charBarBg:  { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  charBarFill:{ height: '100%', borderRadius: 2 },
  charCount:  { fontSize: 11, fontWeight: '600', minWidth: 32, textAlign: 'right' },

  // ── Toolbar ────────────────────────────────────────────────────────────────
  toolbar:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  toolBtn:    { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  toolBadge:  { position: 'absolute', top: 3, right: 3, width: 13, height: 13, borderRadius: 7, backgroundColor: '#3B8BF7', alignItems: 'center', justifyContent: 'center' },
  toolBadgeTxt: { fontSize: 7, fontWeight: '800', color: '#fff' },
  charInline: { fontSize: 12, fontWeight: '600' },

  // ── Images ─────────────────────────────────────────────────────────────────
  imgRow:  { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  imgWrap: { position: 'relative' },
  imgThumb:{ width: 76, height: 76, borderRadius: 14 },
  imgRemove: { position: 'absolute', top: -5, right: -5, width: 20, height: 20, borderRadius: 10, backgroundColor: '#FF4444', alignItems: 'center', justifyContent: 'center' },

  // ── Sections ───────────────────────────────────────────────────────────────
  section:       { paddingHorizontal: 16, paddingVertical: 18 },
  sectionHdr:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIconBox:{ width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:  { fontSize: 15, fontWeight: '800', flex: 1 },
  countDot:      { width: 18, height: 18, borderRadius: 9, backgroundColor: '#3B8BF7', alignItems: 'center', justifyContent: 'center' },
  countDotTxt:   { fontSize: 10, fontWeight: '800', color: '#fff' },

  // ── Topics ─────────────────────────────────────────────────────────────────
  topicsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicPill:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  topicPillActive: { backgroundColor: '#3B8BF715', borderColor: '#3B8BF755' },
  topicTxt:      { fontSize: 12, fontWeight: '600' },

  // ── Quick actions ──────────────────────────────────────────────────────────
  smartGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  smartCard:    { width: '47%', borderWidth: 1, borderRadius: 16, padding: 14, gap: 8 },
  smartIconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  smartLabel:   { fontSize: 13, fontWeight: '800' },
  smartSub:     { fontSize: 11, lineHeight: 16 },

  // ── Guidelines ─────────────────────────────────────────────────────────────
  guideCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 14, padding: 14, borderWidth: 1 },
  guideTxt:  { fontSize: 12, lineHeight: 18, flex: 1 },

  // ── Success ────────────────────────────────────────────────────────────────
  successWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  successCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#3B8BF7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle:  { fontSize: 32, fontWeight: '900', letterSpacing: -1, marginBottom: 6 },
  successSub:    { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  successCard:   { alignSelf: 'stretch', borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 24 },
  previewBody:   { fontSize: 14, lineHeight: 22, marginBottom: 10 },
  previewFooter: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  previewTag:    { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  doneBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch', borderRadius: 16, paddingVertical: 15, justifyContent: 'center', marginBottom: 12, backgroundColor: '#3B8BF7' },
  doneBtnTxt:    { fontSize: 16, fontWeight: '800', color: '#fff' },
  anotherBtn:    { paddingVertical: 12 },
  anotherTxt:    { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
