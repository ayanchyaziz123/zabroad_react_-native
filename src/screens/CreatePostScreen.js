import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

const TOPICS = ['#OPT', '#H1B', '#Housing', '#Jobs', '#Healthcare', '#Legal', '#Community', '#Visa'];
const MAX_CHARS = 500;

const SMART_ROUTES = [
  {
    key: 'job',
    icon: '💼',
    label: 'Post a Job',
    sub: 'Hiring? List a role with visa details',
    color: '#3EC878',
    route: 'PostJob',
  },
  {
    key: 'housing',
    icon: '🏠',
    label: 'List Housing',
    sub: 'Room, apartment or sublet available',
    color: '#F5A623',
    route: 'Housing',
  },
  {
    key: 'doctor',
    icon: '🩺',
    label: 'List as Doctor',
    sub: 'Add your practice to our directory',
    color: '#5BCFEF',
    route: 'ListDoctor',
  },
  {
    key: 'attorney',
    icon: '⚖️',
    label: 'List as Attorney',
    sub: 'Help immigrants with legal needs',
    color: '#9B72EF',
    route: 'ListAttorney',
  },
];

export default function CreatePostScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const [text,           setText]           = useState('');
  const [location,       setLocation]       = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [isAnonymous,    setIsAnonymous]    = useState(false);
  const [posted,         setPosted]         = useState(false);
  const successScale   = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const charCount = text.length;
  const charColor = charCount > 450 ? C.vivid : charCount > 350 ? C.gold : C.c35;
  const canPost   = text.trim().length > 0;

  const toggleTopic = (topic) =>
    setSelectedTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]);

  const handlePost = () => {
    if (!canPost) return;
    setPosted(true);
    Animated.parallel([
      Animated.spring(successScale,   { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
      Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleDone = () => {
    setText(''); setSelectedTopics([]); setPosted(false);
    successScale.setValue(0); successOpacity.setValue(0);
    if (navigation.canGoBack()) navigation.goBack();
  };

  // ── Success ─────────────────────────────────────────────────────────────────
  if (posted) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <Animated.View style={[s.successWrap, { opacity: successOpacity }]}>
          <Animated.View style={{ transform: [{ scale: successScale }], alignItems: 'center' }}>
            <View style={s.successIcon}><Text style={{ fontSize: 40 }}>✅</Text></View>
            <Text style={s.successTitle}>Posted!</Text>
            <Text style={s.successSub}>Your post is now live{location ? `\n📍 ${location}` : ''}</Text>
            <View style={s.successCard}>
              <Text style={s.previewBody} numberOfLines={4}>{text}</Text>
              {selectedTopics.length > 0 && (
                <View style={s.previewFooter}>
                  {selectedTopics.slice(0, 3).map(t => (
                    <Text key={t} style={s.previewTag}>{t}</Text>
                  ))}
                </View>
              )}
            </View>
            <TouchableOpacity style={s.doneBtn} onPress={handleDone}>
              <Text style={s.doneBtnTxt}>Done ✓</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.anotherBtn} onPress={() => { setText(''); setPosted(false); successScale.setValue(0); successOpacity.setValue(0); }}>
              <Text style={s.anotherTxt}>Post another</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>

          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Text style={s.closeTxt}>✕</Text>
            </TouchableOpacity>
            <Text style={s.title}>Create Post</Text>
            <TouchableOpacity
              style={[s.postBtn, { backgroundColor: canPost ? C.vivid : C.card, borderWidth: canPost ? 0 : 1, borderColor: C.border }]}
              onPress={handlePost}
              disabled={!canPost}
            >
              <Text style={[s.postBtnTxt, { color: canPost ? 'white' : C.c35 }]}>Publish →</Text>
            </TouchableOpacity>
          </View>

          {/* Author row */}
          <View style={s.section}>
            <View style={s.authorRow}>
              <View style={s.authorAv}>
                <Text style={{ fontSize: 20 }}>{isAnonymous ? '🕵️' : '🧑‍💻'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.authorName}>{isAnonymous ? 'Anonymous' : 'Azizur Rahman'}</Text>
                <Text style={s.authorSub}>{location ? `📍 ${location}` : 'Queens, NY'}</Text>
              </View>
              <TouchableOpacity
                style={[s.anonToggle, isAnonymous && s.anonActive]}
                onPress={() => setIsAnonymous(p => !p)}
              >
                <Text style={[s.anonTxt, isAnonymous && { color: C.cream }]}>{isAnonymous ? '🕵️ Anon' : '👤 Public'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Text input */}
          <View style={s.section}>
            <View style={s.textBox}>
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
              <Text style={[s.charCount, { color: charColor }]}>{charCount}/{MAX_CHARS}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={s.section}>
            <View style={[s.locationBox, { borderColor: location ? C.vivid + '55' : C.border }]}>
              <Text style={{ fontSize: 16 }}>📍</Text>
              <TextInput
                style={s.locationInput}
                placeholder="Add a location (optional)"
                placeholderTextColor={C.c35}
                value={location}
                onChangeText={setLocation}
              />
              {location.length > 0 && (
                <TouchableOpacity onPress={() => setLocation('')} activeOpacity={0.7}>
                  <Text style={{ fontSize: 14, color: C.c35 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Topics */}
          <View style={s.section}>
            <Text style={s.label}>Topics {selectedTopics.length > 0 && <Text style={{ color: C.vivid }}>· {selectedTopics.length}</Text>}</Text>
            <View style={s.topicsWrap}>
              {TOPICS.map(topic => {
                const sel = selectedTopics.includes(topic);
                return (
                  <TouchableOpacity
                    key={topic}
                    style={[s.topicPill, sel && { backgroundColor: C.vividD, borderColor: C.vivid + '55' }]}
                    onPress={() => toggleTopic(topic)}
                  >
                    <Text style={[s.topicTxt, sel && { color: C.vivid, fontWeight: '700' }]}>{topic}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Smart routing */}
          <View style={s.section}>
            <Text style={s.label}>Looking to do something specific?</Text>
            <Text style={s.smartSub}>Use a dedicated form for better reach and visibility</Text>
            <View style={s.smartGrid}>
              {SMART_ROUTES.map(r => (
                <TouchableOpacity
                  key={r.key}
                  style={[s.smartCard, { borderColor: r.color + '44' }]}
                  onPress={() => navigation.navigate(r.route)}
                  activeOpacity={0.85}
                >
                  <View style={[s.smartIcon, { backgroundColor: r.color + '18' }]}>
                    <Text style={{ fontSize: 20 }}>{r.icon}</Text>
                  </View>
                  <Text style={[s.smartLabel, { color: r.color }]}>{r.label}</Text>
                  <Text style={s.smartSub2}>{r.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tips */}
          <View style={s.section}>
            <View style={s.tipCard}>
              <Text style={s.tipTitle}>💡 Community Guidelines</Text>
              <Text style={s.tipTxt}>Be respectful and helpful. No spam or self-promotion. Sensitive legal/medical posts should note they're not professional advice.</Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  closeBtn:     { width: 34, height: 34, borderRadius: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  closeTxt:     { fontSize: 14, color: C.c35, fontWeight: '700', lineHeight: 18 },
  title:        { flex: 1, fontSize: 18, fontWeight: '800', color: C.cream, letterSpacing: -0.3 },
  postBtn:      { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 50 },
  postBtnTxt:   { fontSize: 13, fontWeight: '700' },
  section:      { paddingHorizontal: 20, marginBottom: 20 },
  label:        { fontSize: 11, fontWeight: '700', color: C.c35, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  authorRow:    { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14 },
  authorAv:     { width: 44, height: 44, borderRadius: 15, backgroundColor: C.vividD, alignItems: 'center', justifyContent: 'center' },
  authorName:   { fontSize: 14, fontWeight: '700', color: C.cream, marginBottom: 2 },
  authorSub:    { fontSize: 11, color: C.c35 },
  anonToggle:   { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.card2 },
  anonActive:   { backgroundColor: C.card3, borderColor: C.border2 },
  anonTxt:      { fontSize: 11, color: C.c35, fontWeight: '600' },
  textBox:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, position: 'relative' },
  textInput:    { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40, fontSize: 15, color: C.cream, lineHeight: 24, minHeight: 140 },
  charCount:    { position: 'absolute', bottom: 12, right: 14, fontSize: 11 },
  locationBox:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  locationInput:{ flex: 1, fontSize: 14, color: C.cream },
  topicsWrap:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicPill:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  topicTxt:     { fontSize: 12, color: C.c35 },
  // Smart routing
  smartSub:     { fontSize: 11, color: C.c35, marginBottom: 12, marginTop: -6 },
  smartGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  smartCard:    { width: '47%', backgroundColor: C.card, borderWidth: 1, borderRadius: 16, padding: 14, gap: 6 },
  smartIcon:    { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  smartLabel:   { fontSize: 13, fontWeight: '800' },
  smartSub2:    { fontSize: 11, color: C.c35, lineHeight: 15 },
  tipCard:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14 },
  tipTitle:     { fontSize: 13, fontWeight: '700', color: C.cream, marginBottom: 6 },
  tipTxt:       { fontSize: 12, color: C.c35, lineHeight: 19 },
  // Success
  successWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  successIcon:  { width: 90, height: 90, borderRadius: 28, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 32, fontWeight: '900', color: C.cream, letterSpacing: -1, marginBottom: 8 },
  successSub:   { fontSize: 14, color: C.c35, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  successCard:  { alignSelf: 'stretch', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, marginBottom: 24 },
  previewBody:  { fontSize: 13, color: C.c60, lineHeight: 20, marginBottom: 12 },
  previewFooter:{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  previewTag:   { fontSize: 10, color: C.c35, backgroundColor: C.card2, borderRadius: 50, paddingHorizontal: 8, paddingVertical: 4 },
  doneBtn:      { alignSelf: 'stretch', borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginBottom: 12, backgroundColor: C.vivid },
  doneBtnTxt:   { fontSize: 16, fontWeight: '800', color: 'white' },
  anotherBtn:   { paddingVertical: 10 },
  anotherTxt:   { fontSize: 14, color: C.c35, fontWeight: '600' },
});
