import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

// ─── AI brain ────────────────────────────────────────────────────────────────
const AI_REPLIES = {
  opt:     "Great question about OPT! Key points:\n\n✅ 12-month OPT after graduation\n✅ 24-month STEM extension if eligible\n⚠️ 90-day unemployment limit applies\n📅 File I-765 90 days before OPT end\n\nNeed help calculating your specific timeline?",
  h1b:     "H-1B cap for FY2027 opens ~March 2027. Timeline:\n\n📅 March — USCIS registration window\n🎯 Late March — Lottery results\n📝 April 1 — Earliest filing\n✅ Oct 1 — Employment begins\n\nWith STEM OPT you have cap-gap protection. Want me to help with your documents?",
  housing: "Renting without credit history:\n\n📄 Show your offer letter / employment contract\n💰 Offer 2–3 months deposit upfront\n🤝 Find a US citizen co-signer\n🏢 Jackson Heights, Flushing, Astoria accept ITIN\n📱 Check Zabroad Housing — no-credit listings\n\nWant me to find listings near you?",
  doctor:  "Healthcare options without full insurance:\n\n🆓 FQHCs — sliding-scale fees\n🎓 University health centers — cheap for students\n🛡️ GeoBlue / IMG — OPT-specific plans\n💊 GoodRx — big prescription discounts\n\nWant me to find doctors near you who speak your language?",
  job:     "Job search tips for OPT/STEM:\n\n💼 Use LinkedIn with 'OPT sponsorship' filter\n🏢 Target E-Verify registered companies\n📧 Reach out directly to hiring managers\n🎓 University career centers often have OPT-friendly leads\n📋 Staffing: Mastech, TCS, Infosys for IT roles\n\nWant to see current OPT-friendly listings?",
  green:   "Green Card paths for immigrants:\n\n🌿 EB-2 NIW — self-petition, no employer needed\n🏆 EB-1A — extraordinary ability\n💼 EB-2/EB-3 — employer-sponsored\n🛡️ Asylum-based — if persecuted\n\nEB-2 NIW is popular for researchers. Want a breakdown of your eligibility?",
  default: "Great question! Here's what I know:\n\nThis is a complex immigration topic that depends on your specific situation. I recommend:\n\n1. Checking USCIS.gov for official updates\n2. Consulting a licensed immigration attorney\n3. Asking our community — others may have been through the same\n\nWant me to find an immigration attorney near you?",
};

function getAIReply(text) {
  const t = text.toLowerCase();
  if (t.includes('opt') || t.includes('stem') || t.includes('ead')) return AI_REPLIES.opt;
  if (t.includes('h1b') || t.includes('h-1b') || t.includes('cap') || t.includes('lottery')) return AI_REPLIES.h1b;
  if (t.includes('hous') || t.includes('rent') || t.includes('apartment')) return AI_REPLIES.housing;
  if (t.includes('doctor') || t.includes('health') || t.includes('insurance') || t.includes('medical')) return AI_REPLIES.doctor;
  if (t.includes('job') || t.includes('work') || t.includes('employ') || t.includes('career')) return AI_REPLIES.job;
  if (t.includes('green') || t.includes('gc') || t.includes('eb-') || t.includes('niw')) return AI_REPLIES.green;
  return AI_REPLIES.default;
}

// ─── Per-convo seed messages ──────────────────────────────────────────────────
const CONVO_MSGS = {
  '1': [
    { id: '1', from: 'ai',   text: "Hi! I'm Zabroad AI 🤖\n\nI can help with visa questions, immigration timelines, finding doctors, jobs, housing, and more.\n\nWhat do you need help with today?", time: '2:00 PM' },
    { id: '2', from: 'user', text: 'When does H-1B cap registration open in 2027?', time: '2:01 PM' },
    { id: '3', from: 'ai',   text: "H-1B cap for FY2027 opens ~March 2027. Timeline:\n\n📅 March — USCIS registration window\n🎯 Late March — Lottery results\n📝 April 1 — Earliest filing date\n✅ Oct 1 — Employment begins\n\nWith STEM OPT you have cap-gap protection. Want me to help with your documents?", time: '2:01 PM' },
  ],
  '2': [
    { id: '1', from: 'ai',   text: 'Thanks for the OPT agency recommendations! Those were really helpful 🙏', time: 'Yesterday' },
    { id: '2', from: 'user', text: 'No problem! Have you tried Mastech yet?', time: 'Yesterday' },
    { id: '3', from: 'ai',   text: 'Not yet but will reach out this week. Did they ask for your full SSN or just the last 4?', time: 'Yesterday' },
  ],
  '3': [
    { id: '1', from: 'ai',   text: '🎉 New event: Eid gathering this Saturday at Queens Community Center! Come join us — food, games, and community. RSVP in the comments.', time: '5h ago' },
    { id: '2', from: 'user', text: 'Will there be Biryani? 🍛', time: '4h ago' },
    { id: '3', from: 'ai',   text: 'Of course! Multiple food stalls from Bangladesh, Pakistan and India 🎊', time: '4h ago' },
  ],
  '4': [
    { id: '1', from: 'ai',   text: 'Your H-1B documents look complete. We can file next week — Monday or Tuesday work for you?', time: '1d ago' },
    { id: '2', from: 'user', text: 'Tuesday works great. What time should I come in?', time: '1d ago' },
    { id: '3', from: 'ai',   text: '10:00 AM at our downtown office. Bring your original I-20, passport, and employment offer letter.', time: '1d ago' },
  ],
  '5': [
    { id: '1', from: 'ai',   text: 'Your appointment is confirmed for Tuesday at 3:00 PM. Please bring your insurance card and a list of any current medications.', time: '1d ago' },
    { id: '2', from: 'user', text: 'I\'m on OPT so my insurance might be different — is GeoBlue accepted?', time: '1d ago' },
    { id: '3', from: 'ai',   text: 'Yes, GeoBlue is accepted at our clinic. No issues at all 🙂', time: '1d ago' },
  ],
  '6': [
    { id: '1', from: 'ai',   text: 'The no-credit apartment in Jackson Heights is still available! $1,400/mo — they accept ITIN and OPT letters. Want me to forward your details?', time: '2d ago' },
    { id: '2', from: 'user', text: 'Yes please! Is it close to the 7 train?', time: '2d ago' },
    { id: '3', from: 'ai',   text: 'Just 5 min walk from 74th St–Roosevelt Ave 🚇', time: '2d ago' },
  ],
  '7': [
    { id: '1', from: 'ai',   text: '🏠 3 new listings posted near Queens — all no credit check required. ITIN & OPT letters accepted. Check the Housing tab for details!', time: '3d ago' },
  ],
};

// ─── Typing dots ─────────────────────────────────────────────────────────────
function TypingDots({ C }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - i * 150),
        ])
      )
    );
    Animated.parallel(anims).start();
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 6, paddingHorizontal: 4 }}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.c35, transform: [{ translateY: dot }] }} />
      ))}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const CONVOS = useMemo(() => [
    { id: '1', isAI: true,  avatar: '🤖', avatarBg: C.vividD,  name: 'Zabroad AI',           preview: 'Your STEM OPT application looks good! Here are the next steps...',           time: 'Now', unread: 2, online: true  },
    { id: '2',              avatar: '🧑‍🎓', avatarBg: C.blueD,   name: 'Tanvir Hassan',         preview: 'Thanks for the OPT agency recommendations!',                                time: '2h',  unread: 0, online: true  },
    { id: '3',              avatar: '🏘️', avatarBg: C.greenD,  name: 'NYC BD Network',        preview: 'New event: Eid gathering this Saturday at Queens...',                        time: '5h',  unread: 7, online: false, isGroup: true, members: 2413 },
    { id: '4',              avatar: '⚖️', avatarBg: C.purpleD, name: 'Immigration Attorney',  preview: 'Your H-1B documents look complete. We can file next week.',                 time: '1d',  unread: 0, online: false, verified: true },
    { id: '5',              avatar: '🩺', avatarBg: C.tealD,   name: 'Dr. Ayesha Karim',      preview: 'Your appointment is confirmed for Tuesday 3pm.',                            time: '1d',  unread: 0, online: false, verified: true },
    { id: '6',              avatar: '👩‍💼', avatarBg: C.goldD,   name: 'Sara M.',               preview: 'The no-credit apartment in Jackson Heights is still...',                    time: '2d',  unread: 1, online: false },
    { id: '7',              avatar: '🏠', avatarBg: C.blueD,   name: 'Housing Group NYC',      preview: '3 new listings posted near Queens — no credit check required',               time: '3d',  unread: 0, online: false, isGroup: true, members: 890 },
  ], [C]);

  const [activeConvo, setActiveConvo]   = useState(null);
  const [allMessages, setAllMessages]   = useState(CONVO_MSGS);
  const [input, setInput]               = useState('');
  const [search, setSearch]             = useState('');
  const [typing, setTyping]             = useState(false);
  const scrollRef = useRef(null);

  const convo    = CONVOS.find(c => c.id === activeConvo);
  const messages = allMessages[activeConvo] || [];

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput('');
    const userMsg = { id: Date.now().toString(), from: 'user', text: msg, time: 'Now' };
    setAllMessages(prev => ({ ...prev, [activeConvo]: [...(prev[activeConvo] || []), userMsg] }));

    // Only AI convo replies automatically
    if (convo?.isAI || activeConvo === '1') {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        const aiMsg = { id: (Date.now() + 1).toString(), from: 'ai', text: getAIReply(msg), time: 'Now' };
        setAllMessages(prev => ({ ...prev, [activeConvo]: [...(prev[activeConvo] || []), aiMsg] }));
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
      }, 1400);
    }
  };

  const openConvo = (id) => {
    setActiveConvo(id);
    setTyping(false);
    setInput('');
  };

  // ── Chat view ────────────────────────────────────────────────────────────────
  if (activeConvo) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={s.chatHeader}>
          <TouchableOpacity onPress={() => setActiveConvo(null)} style={s.backBtn}>
            <Text style={{ fontSize: 22, color: C.cream }}>‹</Text>
          </TouchableOpacity>
          <View style={[s.chatAv, { backgroundColor: convo.avatarBg }]}>
            <Text style={{ fontSize: 18 }}>{convo.avatar}</Text>
            {convo.online && <View style={s.chatOnline} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.chatName}>{convo.name}</Text>
            <Text style={s.chatStatus}>
              {convo.isGroup
                ? `${convo.members?.toLocaleString()} members`
                : convo.verified
                  ? '✓ Verified professional'
                  : convo.online ? '🟢 Online now' : 'Tap to view profile'}
            </Text>
          </View>
          <TouchableOpacity style={s.chatMore}>
            <Text style={{ color: C.c35, fontSize: 16 }}>•••</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={s.msgList}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg, idx) => {
              const isUser = msg.from === 'user';
              const showTime = idx === 0 || messages[idx - 1]?.time !== msg.time;
              return (
                <View key={msg.id}>
                  {showTime && idx !== 0 && (
                    <Text style={s.timeLabel}>{msg.time}</Text>
                  )}
                  <View style={[s.msgRow, isUser && s.msgRowUser]}>
                    {!isUser && (
                      <View style={[s.msgAv, { backgroundColor: convo.avatarBg }]}>
                        <Text style={{ fontSize: 13 }}>{convo.avatar}</Text>
                      </View>
                    )}
                    <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAI]}>
                      <Text style={[s.bubbleTxt, { color: isUser ? 'white' : C.c60 }]}>
                        {msg.text}
                      </Text>
                    </View>
                  </View>
                  {isUser && idx === messages.length - 1 && (
                    <Text style={s.delivered}>Delivered ✓</Text>
                  )}
                </View>
              );
            })}

            {typing && (
              <View style={s.msgRow}>
                <View style={[s.msgAv, { backgroundColor: convo.avatarBg }]}>
                  <Text style={{ fontSize: 13 }}>{convo.avatar}</Text>
                </View>
                <View style={[s.bubble, s.bubbleAI]}>
                  <TypingDots C={C} />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={s.inputRow}>
            <TouchableOpacity style={s.attachBtn}>
              <Text style={{ fontSize: 18 }}>📎</Text>
            </TouchableOpacity>
            <TextInput
              style={s.msgInput}
              placeholder={convo?.isAI ? 'Ask anything about your visa…' : 'Type a message…'}
              placeholderTextColor={C.c35}
              value={input}
              onChangeText={setInput}
              multiline
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[s.sendBtn, !input.trim() && { opacity: 0.35 }]}
              onPress={sendMessage}
              disabled={!input.trim()}
            >
              <Text style={{ fontSize: 16, color: 'white' }}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Conversation list ────────────────────────────────────────────────────────
  const filtered = CONVOS.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Messages</Text>
        <TouchableOpacity style={s.newBtn}>
          <Text style={{ fontSize: 20, color: C.vivid }}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Text style={{ fontSize: 15 }}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search conversations…"
            placeholderTextColor={C.c35}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ fontSize: 14, color: C.c35 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* AI Quick-Start Banner */}
      <TouchableOpacity style={s.aiBar} onPress={() => openConvo('1')} activeOpacity={0.9}>
        <View style={s.aiBarLeft}>
          <View style={s.aiBarAv}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
          </View>
          <View>
            <Text style={s.aiBarTitle}>Ask Zabroad AI</Text>
            <Text style={s.aiBarSub}>Visa help, job tips, community — 24/7</Text>
          </View>
        </View>
        <View style={s.aiBarCta}><Text style={s.aiBarCtaTxt}>Chat →</Text></View>
      </TouchableOpacity>

      {/* Conversation list */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 10 }}>
            <Text style={{ fontSize: 36 }}>💬</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.cream }}>No conversations found</Text>
            <Text style={{ fontSize: 13, color: C.c35 }}>Try a different search</Text>
          </View>
        ) : filtered.map((convo) => (
          <TouchableOpacity
            key={convo.id}
            style={[s.convoItem, convo.unread > 0 && s.convoUnread]}
            onPress={() => openConvo(convo.id)}
            activeOpacity={0.8}
          >
            <View style={s.convoAvWrap}>
              <View style={[s.convoAv, { backgroundColor: convo.avatarBg }]}>
                <Text style={{ fontSize: 20 }}>{convo.avatar}</Text>
              </View>
              {convo.online && <View style={s.onlineDot} />}
            </View>
            <View style={s.convoBody}>
              <View style={s.convoTop}>
                <View style={s.convoNameRow}>
                  <Text style={[s.convoName, convo.unread > 0 && { color: C.cream }]}>{convo.name}</Text>
                  {convo.verified && <Text style={s.verifiedBadge}>✓</Text>}
                  {convo.isGroup && <Text style={s.groupBadge}>Group · {convo.members?.toLocaleString()}</Text>}
                </View>
                <Text style={s.convoTime}>{convo.time}</Text>
              </View>
              <View style={s.convoBottom}>
                <Text style={[s.convoPreview, convo.unread > 0 && s.convoPreviewUnread]} numberOfLines={1}>
                  {convo.preview}
                </Text>
                {convo.unread > 0 && (
                  <View style={s.unreadBadge}><Text style={s.unreadTxt}>{convo.unread}</Text></View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 26, fontWeight: '800', color: C.cream, letterSpacing: -0.5 },
  newBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { paddingHorizontal: 20, marginBottom: 14 },
  searchBox: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 14, color: C.cream },
  aiBar: { marginHorizontal: 20, marginBottom: 16, backgroundColor: C.vividD, borderWidth: 1, borderColor: 'rgba(232,54,74,0.2)', borderRadius: 18, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiBarLeft: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  aiBarAv: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(232,54,74,0.2)', alignItems: 'center', justifyContent: 'center' },
  aiBarTitle: { fontSize: 14, fontWeight: '700', color: C.cream, marginBottom: 2 },
  aiBarSub: { fontSize: 11, color: C.c35 },
  aiBarCta: { backgroundColor: C.vivid, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, shadowColor: C.vivid, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  aiBarCtaTxt: { fontSize: 12, fontWeight: '700', color: 'white' },
  convoItem: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.border },
  convoUnread: { backgroundColor: C.card + '55' },
  convoAvWrap: { position: 'relative' },
  convoAv: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, backgroundColor: C.green, borderRadius: 6, borderWidth: 2, borderColor: C.bg },
  convoBody: { flex: 1, justifyContent: 'center' },
  convoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convoNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  convoName: { fontSize: 14, fontWeight: '600', color: C.c60 },
  verifiedBadge: { fontSize: 10, color: C.green, backgroundColor: C.greenD, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  groupBadge: { fontSize: 9, color: C.c35 },
  convoTime: { fontSize: 11, color: C.c35 },
  convoBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convoPreview: { flex: 1, fontSize: 12, color: C.c35, marginRight: 8 },
  convoPreviewUnread: { color: C.c60, fontWeight: '500' },
  unreadBadge: { backgroundColor: C.vivid, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
  unreadTxt: { fontSize: 10, fontWeight: '700', color: 'white' },
  // Chat view
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.nav },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  chatAv: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  chatOnline: { position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, backgroundColor: C.green, borderRadius: 5, borderWidth: 2, borderColor: C.nav },
  chatName: { fontSize: 15, fontWeight: '700', color: C.cream },
  chatStatus: { fontSize: 11, color: C.c35, marginTop: 1 },
  chatMore: { padding: 8 },
  msgList: { flex: 1 },
  msgRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgAv: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { maxWidth: '76%', borderRadius: 18, padding: 12 },
  bubbleAI: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: C.vivid, borderBottomRightRadius: 4, shadowColor: C.vivid, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  bubbleTxt: { fontSize: 14, lineHeight: 21 },
  timeLabel: { textAlign: 'center', fontSize: 10, color: C.c35, fontWeight: '500', marginVertical: 6 },
  delivered: { fontSize: 10, color: C.c35, textAlign: 'right', marginTop: 3, marginRight: 4 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.nav },
  attachBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  msgInput: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.cream, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, backgroundColor: C.vivid, borderRadius: 13, alignItems: 'center', justifyContent: 'center', shadowColor: C.vivid, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
});
