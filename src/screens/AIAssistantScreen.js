import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, Alert, Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';

const NAVY = '#1B3266';

const QUICK_QUESTIONS = [
  { icon: '🎓', text: 'Can I work on OPT while applying for H-1B?' },
  { icon: '⏱️', text: 'How long does STEM OPT extension take?' },
  { icon: '💼', text: 'What happens if I lose my job on OPT?' },
  { icon: '🟢', text: 'Am I eligible for EB-2 NIW Green Card?' },
  { icon: '🏠', text: 'How do I rent an apartment without credit history?' },
  { icon: '🏥', text: 'What health insurance options do I have on OPT?' },
  { icon: '💳', text: 'How do I build credit as a new immigrant?' },
  { icon: '⚖️', text: 'How do I find a free immigration attorney?' },
];

function TypingDots({ C }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 150),
        Animated.timing(d, { toValue: -5, duration: 250, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0,  duration: 250, useNativeDriver: true }),
        Animated.delay(450 - i * 150),
      ]))
    );
    Animated.parallel(anims).start();
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 4 }}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={{
          width: 7, height: 7, borderRadius: 4,
          backgroundColor: C.vivid,
          transform: [{ translateY: d }],
          opacity: 0.7,
        }} />
      ))}
    </View>
  );
}

function MessageBubble({ msg, C, s, onCopy }) {
  const isUser = msg.from === 'user';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[
      s.msgRow,
      isUser && s.msgRowUser,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}>
      {!isUser && (
        <View style={s.msgAv}>
          <Text style={{ fontSize: 15 }}>✦</Text>
        </View>
      )}
      <TouchableOpacity
        style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAI]}
        onLongPress={() => onCopy(msg.text)}
        activeOpacity={0.85}
      >
        <Text style={[s.bubbleTxt, { color: isUser ? '#fff' : C.cream }]}>
          {msg.text}
        </Text>
        {msg.time && (
          <Text style={[s.timeStamp, { color: isUser ? 'rgba(255,255,255,0.5)' : C.c35 }]}>
            {msg.time}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AIAssistantScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const api = useAuthStore(st => st.api);

  const [messages, setMessages] = useState([{
    id: '0',
    from: 'ai',
    text: "Hi! I'm Zabroad AI ✦\n\nI'm here to help with your immigration journey — visa questions, job search, housing, healthcare, and more.\n\nWhat can I help you with today?",
    time: now(),
  }]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const copyMessage = useCallback((text) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Message copied to clipboard.');
  }, []);

  const clearChat = useCallback(() => {
    Alert.alert('Clear chat', 'Start a new conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: () => {
          setMessages([{
            id: '0', from: 'ai',
            text: "Hi! I'm Zabroad AI ✦\n\nI'm here to help with your immigration journey — visa questions, job search, housing, healthcare, and more.\n\nWhat can I help you with today?",
            time: now(),
          }]);
        }
      },
    ]);
  }, []);

  const send = useCallback(async (overrideText) => {
    const msg = (overrideText ?? input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { id: Date.now().toString(), from: 'user', text: msg, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

    // Build conversation history for Claude (exclude the greeting)
    const history = [...messages.slice(1), userMsg].map(m => ({
      role: m.from === 'user' ? 'user' : 'assistant',
      content: m.text,
    }));

    try {
      const data = await api('/ai/chat/', {
        method: 'POST',
        body: { messages: history },
      });
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        from: 'ai',
        text: data.reply,
        time: now(),
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        from: 'ai',
        text: `Sorry, I ran into an issue: ${e.message}\n\nPlease try again.`,
        time: now(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, loading, messages, api]);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <View style={s.aiAvatar}>
            <Text style={{ fontSize: 16, color: '#fff' }}>✦</Text>
          </View>
          <View>
            <Text style={s.headerTitle}>Zabroad AI</Text>
            <View style={s.onlineRow}>
              <View style={s.onlineDot} />
              <Text style={s.onlineTxt}>Immigration Assistant</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={s.headerBtn} onPress={clearChat}>
          <Ionicons name="refresh-outline" size={18} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={s.msgList}
          contentContainerStyle={{ padding: 16, paddingBottom: 8, gap: 10 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {/* Quick questions — only before first user message */}
          {messages.length <= 1 && (
            <View style={s.quickWrap}>
              <Text style={s.sectionLabel}>Quick questions</Text>
              <View style={s.quickGrid}>
                {QUICK_QUESTIONS.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.quickChip}
                    onPress={() => send(q.text)}
                    activeOpacity={0.75}
                  >
                    <Text style={{ fontSize: 18 }}>{q.icon}</Text>
                    <Text style={s.quickTxt}>{q.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Messages */}
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} C={C} s={s} onCopy={copyMessage} />
          ))}

          {/* Typing indicator */}
          {loading && (
            <View style={s.msgRow}>
              <View style={s.msgAv}>
                <Text style={{ fontSize: 15 }}>✦</Text>
              </View>
              <View style={[s.bubble, s.bubbleAI, { paddingVertical: 13, paddingHorizontal: 16 }]}>
                <TypingDots C={C} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={s.inputWrap}>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              placeholder="Ask about visas, jobs, housing…"
              placeholderTextColor={C.c35}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
              onPress={() => send()}
              disabled={!input.trim() || loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="arrow-up" size={18} color="#fff" />
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },

  // Header
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, backgroundColor: NAVY },
  headerBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiAvatar:     { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 15, fontWeight: '800', color: '#fff' },
  onlineRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  onlineDot:    { width: 6, height: 6, backgroundColor: '#28D99E', borderRadius: 3 },
  onlineTxt:    { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },

  // Messages
  msgList:      { flex: 1 },
  msgRow:       { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  msgRowUser:   { flexDirection: 'row-reverse' },
  msgAv:        { width: 32, height: 32, borderRadius: 10, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble:       { maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11 },
  bubbleAI:     { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4 },
  bubbleUser:   { backgroundColor: NAVY, borderBottomRightRadius: 4 },
  bubbleTxt:    { fontSize: 14, lineHeight: 22 },
  timeStamp:    { fontSize: 10, marginTop: 5, textAlign: 'right' },

  // Quick questions
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.c35, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  quickWrap:    { marginBottom: 4 },
  quickGrid:    { gap: 8 },
  quickChip:    { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11 },
  quickTxt:     { flex: 1, fontSize: 13, color: C.c60, fontWeight: '500', lineHeight: 18 },

  // Input
  inputWrap:    { borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.nav, paddingTop: 10, paddingHorizontal: 14, paddingBottom: 10 },
  inputRow:     { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  input:        { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.cream, maxHeight: 110, lineHeight: 20 },
  sendBtn:      { width: 44, height: 44, borderRadius: 13, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' },
});
