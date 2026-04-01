import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

// ─── Quick questions shown before first message ──────────────────────────────
const QUICK_QUESTIONS = [
  { icon: '🎓', text: 'Can I work on OPT while applying for H-1B?' },
  { icon: '⏱️', text: 'How long does STEM OPT extension take?' },
  { icon: '💼', text: 'What happens if I lose my job on OPT?' },
  { icon: '🟢', text: 'Green Card through EB-2 NIW — am I eligible?' },
  { icon: '📋', text: 'Documents needed for H-1B transfer' },
  { icon: '🏥', text: 'Do I need health insurance on OPT?' },
];

// ─── AI responses keyed by topic ─────────────────────────────────────────────
const AI_RESPONSES = {
  opt: {
    text: "Great question about OPT! Here are the key rules:\n\n✅ 12-month OPT after graduation\n✅ 24-month STEM extension if your degree qualifies\n⚠️ 90-day unemployment limit\n📅 File I-765 at least 90 days before OPT end date\n✅ Employer must be E-Verify registered for STEM\n\nWant help calculating your specific timeline?",
    followUps: [
      { icon: '📅', text: 'How do I apply for STEM OPT extension?' },
      { icon: '⚠️', text: 'What counts as unemployment on OPT?' },
      { icon: '🏢', text: 'How do I find E-Verify registered employers?' },
    ],
  },
  h1b: {
    text: "H-1B cap registration for FY2027 opens ~March 2027. Here's the full timeline:\n\n📅 March 1–18 — USCIS registration window\n🎯 Late March — Lottery selection announced\n📝 April 1 — Earliest petition filing date\n✅ Oct 1 — Employment start date\n\nWith STEM OPT you have cap-gap protection. Need help with petition documents?",
    followUps: [
      { icon: '🎯', text: 'What are my chances of winning the H-1B lottery?' },
      { icon: '📝', text: 'What documents does my employer need to file?' },
      { icon: '🛡️', text: 'What is cap-gap protection exactly?' },
    ],
  },
  housing: {
    text: "Renting without credit history — here's what actually works:\n\n📄 Show your offer letter or employment contract\n💰 Offer 2–3 months security deposit upfront\n🤝 Find a US citizen co-signer\n🏢 Target immigrant-friendly areas (Jackson Heights, Flushing, Astoria in NYC)\n🔍 Zabroad Housing listings accept ITIN\n\nWant me to show listings near you?",
    followUps: [
      { icon: '🪪', text: 'Can I rent an apartment without an SSN?' },
      { icon: '💳', text: 'How do I build credit as a new immigrant?' },
      { icon: '🤝', text: 'How do I find a US citizen co-signer?' },
    ],
  },
  doctor: {
    text: "Healthcare options for immigrants:\n\n🆓 FQHCs — sliding-scale fees, no insurance needed\n🎓 University health centers — cheap if you're a student\n🛡️ GeoBlue / IMG — OPT-specific insurance plans\n💊 GoodRx app — huge prescription discounts\n🏥 Telehealth apps (MDLive, Teladoc) — affordable virtual visits\n\nWant me to find immigrant-friendly doctors near you?",
    followUps: [
      { icon: '🛡️', text: 'What insurance options exist for OPT students?' },
      { icon: '🧠', text: 'Are there affordable mental health options?' },
      { icon: '💊', text: 'How do I get prescriptions without insurance?' },
    ],
  },
  job: {
    text: "Job search tips for OPT/STEM holders:\n\n💼 Filter LinkedIn for 'OPT sponsorship' or 'will sponsor'\n🏢 Target E-Verify registered companies only\n📧 Cold-email recruiters directly — portals are slow\n🎓 University career centers often have OPT-friendly leads\n📋 Staffing agencies: Mastech, TCS, Infosys BPO for IT\n\nWant to see current OPT-friendly job listings?",
    followUps: [
      { icon: '📋', text: 'Which staffing agencies are best for OPT workers?' },
      { icon: '⏳', text: 'How long can I stay unemployed on OPT?' },
      { icon: '🔄', text: 'Can I change jobs on OPT?' },
    ],
  },
  green: {
    text: "Green Card paths for immigrants:\n\n🌿 EB-2 NIW — self-petition, no employer needed\n🏆 EB-1A — extraordinary ability (high bar)\n💼 EB-2/EB-3 — employer-sponsored\n🛡️ Asylum-based — if persecuted in home country\n👨‍👩‍👧 Family-based — through US citizen or PR relative\n\nEB-2 NIW is popular for researchers. Want a breakdown of your eligibility?",
    followUps: [
      { icon: '🌿', text: 'Am I eligible for EB-2 NIW?' },
      { icon: '⏳', text: 'How long does the Green Card process take?' },
      { icon: '📋', text: 'What documents do I need for EB-2 NIW?' },
    ],
  },
  default: {
    text: "Great question! Based on current immigration guidelines:\n\nThis is a complex area that depends on your specific situation. I recommend:\n\n1. Checking USCIS.gov for official updates\n2. Consulting a licensed immigration attorney for your case\n3. Asking our community — others may have the same experience\n\nWant me to find an immigration attorney near you?",
    followUps: [
      { icon: '⚖️', text: 'How do I find a free immigration attorney?' },
      { icon: '🤖', text: 'Tell me about OPT rules' },
      { icon: '🏥', text: 'Healthcare options for immigrants' },
    ],
  },
};

function getAIReply(text) {
  const t = text.toLowerCase();
  if (t.includes('opt') || t.includes('stem') || t.includes('ead'))               return 'opt';
  if (t.includes('h1b') || t.includes('h-1b') || t.includes('cap') || t.includes('lottery')) return 'h1b';
  if (t.includes('hous') || t.includes('rent') || t.includes('apartment'))        return 'housing';
  if (t.includes('doctor') || t.includes('health') || t.includes('insurance') || t.includes('medic')) return 'doctor';
  if (t.includes('job') || t.includes('work') || t.includes('employ') || t.includes('career')) return 'job';
  if (t.includes('green') || t.includes('gc') || t.includes('eb-') || t.includes('niw')) return 'green';
  return 'default';
}

// ─── Animated typing dots ─────────────────────────────────────────────────────
function TypingDots({ C }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 160),
        Animated.timing(d, { toValue: -6, duration: 280, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0,  duration: 280, useNativeDriver: true }),
        Animated.delay(500 - i * 160),
      ]))
    );
    Animated.parallel(anims).start();
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 4 }}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.c35, transform: [{ translateY: d }] }} />
      ))}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AIAssistantScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const [messages,    setMessages]    = useState([{
    id: '1', from: 'ai', topicKey: null,
    text: "Hi! I'm Zabroad AI 🤖\n\nI can help you with:\n• Visa questions (OPT, H-1B, Green Card, Asylum)\n• Immigration timelines & deadlines\n• Finding doctors, lawyers, housing\n• Job search tips for immigrants\n\nWhat do you need help with today?",
  }]);
  const [input,       setInput]       = useState('');
  const [typing,      setTyping]      = useState(false);
  const scrollRef = useRef(null);

  // last AI message's follow-up chips
  const lastAI = [...messages].reverse().find(m => m.from === 'ai' && m.topicKey);
  const followUps = lastAI ? AI_RESPONSES[lastAI.topicKey]?.followUps : null;

  const send = (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    const userMsg = { id: Date.now().toString(), from: 'user', text: msg };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);
    setTimeout(() => {
      const key = getAIReply(msg);
      setTyping(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        from: 'ai',
        topicKey: key,
        text: AI_RESPONSES[key].text,
      }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }, 1300);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={s.aiAv}>
            <Text style={{ fontSize: 18 }}>🤖</Text>
          </View>
          <View>
            <Text style={s.headerTitle}>Zabroad AI</Text>
            <View style={s.onlineRow}>
              <View style={s.onlineDot} />
              <Text style={s.onlineTxt}>Online · Answers instantly</Text>
            </View>
          </View>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={s.msgList}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Initial quick question chips */}
          {messages.length <= 1 && (
            <View style={s.quickWrap}>
              <Text style={s.quickLabel}>Quick questions</Text>
              {QUICK_QUESTIONS.map((q, i) => (
                <TouchableOpacity key={i} style={s.quickChip} onPress={() => send(q.text)} activeOpacity={0.8}>
                  <Text style={{ fontSize: 16 }}>{q.icon}</Text>
                  <Text style={s.quickTxt}>{q.text}</Text>
                  <Text style={s.quickArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <View key={msg.id} style={[s.msgRow, msg.from === 'user' && s.msgRowUser]}>
              {msg.from === 'ai' && (
                <View style={s.msgAv}><Text style={{ fontSize: 14 }}>🤖</Text></View>
              )}
              <View style={[s.bubble, msg.from === 'user' ? s.bubbleUser : s.bubbleAI]}>
                <Text style={[s.bubbleTxt, { color: msg.from === 'user' ? 'white' : C.c60 }]}>
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}

          {/* Typing indicator */}
          {typing && (
            <View style={s.msgRow}>
              <View style={s.msgAv}><Text style={{ fontSize: 14 }}>🤖</Text></View>
              <View style={[s.bubble, s.bubbleAI, { paddingVertical: 12, paddingHorizontal: 16 }]}>
                <TypingDots C={C} />
              </View>
            </View>
          )}

          {/* Follow-up suggestion chips after latest AI reply */}
          {!typing && followUps && messages.length > 1 && (
            <View style={s.followWrap}>
              <Text style={s.followLabel}>Suggested follow-ups</Text>
              {followUps.map((f, i) => (
                <TouchableOpacity key={i} style={s.followChip} onPress={() => send(f.text)} activeOpacity={0.8}>
                  <Text style={{ fontSize: 14 }}>{f.icon}</Text>
                  <Text style={s.followTxt}>{f.text}</Text>
                  <Text style={{ color: C.vivid, fontSize: 14 }}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={s.inputRow}>
          <TextInput
            style={s.msgInput}
            placeholder="Ask about visas, jobs, housing…"
            placeholderTextColor={C.c35}
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={() => send()}
          />
          <TouchableOpacity
            style={[s.sendBtn, !input.trim() && { opacity: 0.4 }]}
            onPress={() => send()}
            disabled={!input.trim()}
          >
            <LinearGradient colors={[C.vivid, '#B82838']} style={s.sendGrad}>
              <Text style={{ fontSize: 16, color: 'white' }}>↑</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={s.disclaimer}>AI responses are for guidance only — consult a licensed attorney for legal advice.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.nav },
  back: { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 24, color: C.cream, lineHeight: 28 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiAv: { width: 38, height: 38, borderRadius: 13, backgroundColor: C.vividD, borderWidth: 1, borderColor: C.vivid + '44', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: C.cream },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  onlineDot: { width: 6, height: 6, backgroundColor: C.green, borderRadius: 3 },
  onlineTxt: { fontSize: 11, color: C.green, fontWeight: '500' },
  msgList: { flex: 1 },
  quickWrap: { gap: 8, marginBottom: 8 },
  quickLabel: { fontSize: 11, fontWeight: '700', color: C.c35, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  quickChip: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 12 },
  quickTxt: { flex: 1, fontSize: 13, color: C.c60, fontWeight: '500' },
  quickArrow: { fontSize: 16, color: C.c35 },
  msgRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgAv: { width: 32, height: 32, borderRadius: 11, backgroundColor: C.vividD, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 13 },
  bubbleAI: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: C.vivid, borderBottomRightRadius: 4, shadowColor: C.vivid, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  bubbleTxt: { fontSize: 14, lineHeight: 22 },
  followWrap: { gap: 6, marginTop: 4 },
  followLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  followChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.vividD, borderWidth: 1, borderColor: C.vivid + '33', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  followTxt: { flex: 1, fontSize: 12, color: C.c60, fontWeight: '500' },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.nav },
  msgInput: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.cream, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden' },
  sendGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { fontSize: 10, color: C.c35, textAlign: 'center', paddingHorizontal: 20, paddingBottom: 8, paddingTop: 4 },
});
