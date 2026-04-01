import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

const REACH_OPTIONS = [
  { icon: '🇧🇩', label: 'Bangladeshis in USA',  sub: 'My country · same country',  key: 'my_country' },
  { icon: '🌏',  label: 'All Bangladeshis',      sub: 'Worldwide countrymen',        key: 'all_country' },
  { icon: '📍',  label: 'Local — Queens, NY',    sub: 'People near me',              key: 'local'       },
  { icon: '🌍',  label: 'Global Feed',            sub: 'Everyone on Zabroad',         key: 'global'      },
];

const TOPICS = ['#OPT', '#H1B', '#Housing', '#Jobs', '#Healthcare', '#Legal', '#Community', '#Eid2026'];

const HAS_TITLE = [0, 3, 4, 5]; // Q&A, Job, Housing, Event need a title
const PLACEHOLDERS = [
  'Ask the community a question…',
  'Share your experience as an immigrant…',
  'What would you like to announce?',
  'Describe the job opportunity — role, salary, visa sponsorship…',
  'Describe the listing — rent, location, requirements…',
  'What\'s happening? Include date, time, and location…',
];

const MAX_CHARS = 500;

export default function CreatePostScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const POST_TYPES = useMemo(() => [
    { icon: '❓', label: 'Q&A',       color: C.blue,   bg: C.blueD   },
    { icon: '💬', label: 'Story',     color: C.teal,   bg: C.tealD   },
    { icon: '📢', label: 'Announce',  color: C.vivid,  bg: C.vividD  },
    { icon: '💼', label: 'Job',       color: C.green,  bg: C.greenD  },
    { icon: '🏠', label: 'Housing',   color: C.gold,   bg: C.goldD   },
    { icon: '🗓️', label: 'Event',     color: C.purple, bg: C.purpleD },
  ], [C]);

  const [postType,           setPostType]           = useState(0);
  const [title,              setTitle]              = useState('');
  const [text,               setText]               = useState('');
  const [selectedReach,  setSelectedReach]  = useState(0);
  const [selectedTopics,     setSelectedTopics]     = useState([]);
  const [isAnonymous,        setIsAnonymous]        = useState(false);
  const [posted,             setPosted]             = useState(false);
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const active       = POST_TYPES[postType];
  const needsTitle   = HAS_TITLE.includes(postType);
  const charCount    = text.length;
  const charColor    = charCount > 450 ? C.vivid : charCount > 350 ? C.gold : C.c35;
  const canPost      = text.trim().length > 0 && (!needsTitle || title.trim().length > 0);

  const toggleTopic = (topic) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handlePost = () => {
    if (!canPost) return;
    setPosted(true);
    Animated.parallel([
      Animated.spring(successScale,   { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
      Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleDone = () => {
    setText('');
    setTitle('');
    setSelectedTopics([]);
    setPosted(false);
    successScale.setValue(0);
    successOpacity.setValue(0);
    if (navigation.canGoBack()) navigation.goBack();
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (posted) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <Animated.View style={[s.successWrap, { opacity: successOpacity }]}>
          <Animated.View style={{ transform: [{ scale: successScale }], alignItems: 'center' }}>
            <LinearGradient colors={[active.color, active.color + 'AA']} style={s.successIcon}>
              <Text style={{ fontSize: 40 }}>{active.icon}</Text>
            </LinearGradient>
            <Text style={s.successTitle}>Posted!</Text>
            <Text style={s.successSub}>Your {active.label} is now live in{'\n'}{REACH_OPTIONS[selectedReach].icon} {REACH_OPTIONS[selectedReach].label}</Text>

            <View style={[s.successCard, { borderColor: active.color + '44' }]}>
              {title ? <Text style={s.previewTitle}>{title}</Text> : null}
              <Text style={s.previewBody} numberOfLines={4}>{text}</Text>
              <View style={s.previewFooter}>
                <Text style={[s.previewType, { color: active.color, backgroundColor: active.bg }]}>
                  {active.icon} {active.label}
                </Text>
                {selectedTopics.slice(0, 2).map(t => (
                  <Text key={t} style={s.previewTag}>{t}</Text>
                ))}
              </View>
            </View>

            <TouchableOpacity style={[s.doneBtn, { backgroundColor: active.color }]} onPress={handleDone}>
              <Text style={s.doneBtnTxt}>Done ✓</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.anotherBtn} onPress={() => { setText(''); setTitle(''); setPosted(false); successScale.setValue(0); successOpacity.setValue(0); }}>
              <Text style={s.anotherTxt}>Post another</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Create form ─────────────────────────────────────────────────────────────
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
              style={[s.postBtn, { backgroundColor: canPost ? active.color : C.card, borderWidth: canPost ? 0 : 1, borderColor: C.border }]}
              onPress={handlePost}
              disabled={!canPost}
            >
              <Text style={[s.postBtnTxt, { color: canPost ? 'white' : C.c35 }]}>Publish →</Text>
            </TouchableOpacity>
          </View>

          {/* Post Type */}
          <View style={s.section}>
            <Text style={s.label}>Post Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {POST_TYPES.map((type, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.typePill, i === postType && { backgroundColor: type.bg, borderColor: type.color + '55' }]}
                  onPress={() => { setPostType(i); setTitle(''); setText(''); }}
                >
                  <Text style={{ fontSize: 16 }}>{type.icon}</Text>
                  <Text style={[s.typePillTxt, i === postType && { color: type.color, fontWeight: '700' }]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Author row */}
          <View style={s.section}>
            <View style={[s.authorRow, { borderColor: active.color + '22' }]}>
              <View style={[s.authorAv, { backgroundColor: isAnonymous ? C.card3 : active.bg }]}>
                <Text style={{ fontSize: 20 }}>{isAnonymous ? '🕵️' : '🧑‍💻'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.authorName}>{isAnonymous ? 'Anonymous' : 'Azizur Rahman'}</Text>
                <Text style={s.authorSub}>Reach: {REACH_OPTIONS[selectedReach].icon} {REACH_OPTIONS[selectedReach].label}</Text>
              </View>
              <TouchableOpacity
                style={[s.anonToggle, isAnonymous && s.anonActive]}
                onPress={() => setIsAnonymous(p => !p)}
              >
                <Text style={[s.anonTxt, isAnonymous && { color: C.cream }]}>{isAnonymous ? '🕵️ Anon' : '👤 Public'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Title field (Q&A / Job / Housing / Event) */}
          {needsTitle && (
            <View style={s.section}>
              <Text style={s.label}>
                {postType === 0 ? 'Your Question' : postType === 3 ? 'Job Title' : postType === 4 ? 'Listing Title' : 'Event Name'}
              </Text>
              <View style={[s.titleBox, { borderColor: active.color + '44' }]}>
                <View style={[s.textBoxAccent, { backgroundColor: active.color }]} />
                <TextInput
                  style={s.titleInput}
                  placeholder={
                    postType === 0 ? 'e.g. OPT-friendly employers in NYC?'
                    : postType === 3 ? 'e.g. Junior Software Engineer — Citibank'
                    : postType === 4 ? 'e.g. 1BR Queens — No credit check, ITIN OK'
                    : 'e.g. Eid Celebration 2026 — Queens'
                  }
                  placeholderTextColor={C.c35}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={120}
                />
              </View>
            </View>
          )}

          {/* Text Input */}
          <View style={s.section}>
            <Text style={s.label}>{needsTitle ? 'Details' : 'Your Post'}</Text>
            <View style={[s.textBox, { borderColor: active.color + '44' }]}>
              <View style={[s.textBoxAccent, { backgroundColor: active.color }]} />
              <TextInput
                style={s.textInput}
                placeholder={PLACEHOLDERS[postType]}
                placeholderTextColor={C.c35}
                multiline
                value={text}
                onChangeText={t => t.length <= MAX_CHARS && setText(t)}
                textAlignVertical="top"
              />
              <Text style={[s.charCount, { color: charColor }]}>
                {charCount}/{MAX_CHARS}
              </Text>
            </View>
            {charCount > 450 && (
              <Text style={[s.charWarn, { color: charColor }]}>
                {MAX_CHARS - charCount} characters remaining
              </Text>
            )}
          </View>

          {/* Reach / Audience */}
          <View style={s.section}>
            <Text style={s.label}>Who Can See This</Text>
            <View style={s.reachGrid}>
              {REACH_OPTIONS.map((opt, i) => {
                const sel = i === selectedReach;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[s.reachCard, sel && { backgroundColor: active.bg, borderColor: active.color + '66' }]}
                    onPress={() => setSelectedReach(i)}
                    activeOpacity={0.8}
                  >
                    <View style={s.reachCardLeft}>
                      <Text style={s.reachIcon}>{opt.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.reachLabel, sel && { color: active.color, fontWeight: '700' }]}>{opt.label}</Text>
                        <Text style={s.reachSub}>{opt.sub}</Text>
                      </View>
                    </View>
                    <View style={[s.reachRadio, sel && { borderColor: active.color, backgroundColor: active.color }]}>
                      {sel && <View style={s.reachRadioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Topics */}
          <View style={s.section}>
            <Text style={s.label}>Topics {selectedTopics.length > 0 && <Text style={{ color: active.color }}>· {selectedTopics.length} selected</Text>}</Text>
            <View style={s.topicsWrap}>
              {TOPICS.map((topic, i) => {
                const sel = selectedTopics.includes(topic);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[s.topicPill, sel && { backgroundColor: active.bg, borderColor: active.color + '55' }]}
                    onPress={() => toggleTopic(topic)}
                  >
                    <Text style={[s.topicTxt, sel && { color: active.color, fontWeight: '700' }]}>{topic}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Attachments */}
          <View style={s.section}>
            <Text style={s.label}>Add to Post</Text>
            <View style={s.attRow}>
              {[{ icon: '📷', label: 'Photo' }, { icon: '📄', label: 'Document' }, { icon: '📍', label: 'Location' }, { icon: '🔗', label: 'Link' }].map((att, i) => (
                <TouchableOpacity key={i} style={s.attItem} activeOpacity={0.7}>
                  <View style={[s.attIcon, { borderColor: active.color + '33' }]}>
                    <Text style={{ fontSize: 20 }}>{att.icon}</Text>
                  </View>
                  <Text style={s.attLabel}>{att.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tips */}
          <View style={s.section}>
            <View style={[s.tipCard, { borderColor: active.color + '33' }]}>
              <Text style={s.tipTitle}>💡 Community Guidelines</Text>
              <Text style={s.tipTxt}>
                Be respectful and helpful. No spam or self-promotion. Share from personal experience. Sensitive legal/medical posts should note they're not professional advice.
              </Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  closeBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { fontSize: 14, color: C.c35, fontWeight: '700', lineHeight: 18 },
  title: { flex: 1, fontSize: 18, fontWeight: '800', color: C.cream, letterSpacing: -0.3 },
  postBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 50 },
  postBtnTxt: { fontSize: 13, fontWeight: '700' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: C.c35, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  typePillTxt: { fontSize: 12, fontWeight: '500', color: C.c35 },
  authorRow: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderRadius: 18, padding: 14 },
  authorAv: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  authorName: { fontSize: 14, fontWeight: '700', color: C.cream, marginBottom: 2 },
  authorSub: { fontSize: 11, color: C.c35 },
  anonToggle: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.card2 },
  anonActive: { backgroundColor: C.card3, borderColor: C.border2 },
  anonTxt: { fontSize: 11, color: C.c35, fontWeight: '600' },
  titleBox: { backgroundColor: C.card, borderWidth: 1, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', alignItems: 'center' },
  titleInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.cream },
  textBox: { backgroundColor: C.card, borderWidth: 1, borderRadius: 18, overflow: 'hidden', position: 'relative' },
  textBoxAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  textInput: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40, fontSize: 15, color: C.cream, lineHeight: 24, minHeight: 160 },
  charCount: { position: 'absolute', bottom: 12, right: 14, fontSize: 11 },
  charWarn: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  reachGrid:      { gap: 8 },
  reachCard:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  reachCardLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  reachIcon:      { fontSize: 22 },
  reachLabel:     { fontSize: 13, fontWeight: '600', color: C.cream },
  reachSub:       { fontSize: 11, color: C.c35, marginTop: 1 },
  reachRadio:     { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  reachRadioDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
  topicsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  topicTxt: { fontSize: 12, color: C.c35 },
  attRow: { flexDirection: 'row', gap: 12 },
  attItem: { flex: 1, alignItems: 'center', gap: 6 },
  attIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  attLabel: { fontSize: 10, color: C.c35, fontWeight: '500' },
  tipCard: { backgroundColor: C.card, borderWidth: 1, borderRadius: 16, padding: 14 },
  tipTitle: { fontSize: 13, fontWeight: '700', color: C.cream, marginBottom: 6 },
  tipTxt: { fontSize: 12, color: C.c35, lineHeight: 19 },
  // Success
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  successIcon: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  successTitle: { fontSize: 32, fontWeight: '900', color: C.cream, letterSpacing: -1, marginBottom: 8 },
  successSub: { fontSize: 14, color: C.c35, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  successCard: { alignSelf: 'stretch', backgroundColor: C.card, borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 24 },
  previewTitle: { fontSize: 15, fontWeight: '700', color: C.cream, marginBottom: 6 },
  previewBody: { fontSize: 13, color: C.c60, lineHeight: 20, marginBottom: 12 },
  previewFooter: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  previewType: { fontSize: 10, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  previewTag: { fontSize: 10, color: C.c35, backgroundColor: C.card2, borderRadius: 50, paddingHorizontal: 8, paddingVertical: 4 },
  doneBtn: { alignSelf: 'stretch', borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  doneBtnTxt: { fontSize: 16, fontWeight: '800', color: 'white' },
  anotherBtn: { paddingVertical: 10 },
  anotherTxt: { fontSize: 14, color: C.c35, fontWeight: '600' },
});
