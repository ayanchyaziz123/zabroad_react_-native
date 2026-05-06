import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

const NAVY = '#1B3266';

const INTERESTS = [
  { icon: '💼', label: 'Jobs & Careers',      key: 'jobs',      colorKey: 'green'  },
  { icon: '🏠', label: 'Housing',             key: 'housing',   colorKey: 'gold'   },
  { icon: '⚖️', label: 'Visa & Immigration',  key: 'visa',      colorKey: 'vivid'  },
  { icon: '🩺', label: 'Healthcare',          key: 'health',    colorKey: 'teal'   },
  { icon: '🤖', label: 'AI Visa Assistant',   key: 'ai',        colorKey: 'purple' },
  { icon: '🏘️', label: 'Community',           key: 'community', colorKey: 'blue'   },
  { icon: '💳', label: 'Banking & Finance',   key: 'banking',   colorKey: 'teal'   },
  { icon: '🎓', label: 'Education',           key: 'education', colorKey: 'blue'   },
  { icon: '🧠', label: 'Mental Health',       key: 'mental',    colorKey: 'purple' },
  { icon: '🚗', label: 'Transportation',      key: 'transport', colorKey: 'green'  },
  { icon: '📱', label: 'SIM & Phone Plans',   key: 'sim',       colorKey: 'vivid'  },
  { icon: '🍽️', label: 'Food & Halal/Vegan',  key: 'food',      colorKey: 'gold'   },
];

export default function InterestsScreen({ navigation, route }) {
  const { colors: C } = useTheme();
  const userData = route.params || {};
  const [selected, setSelected] = useState(['visa', 'community']);

  const toggle = (key) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleFinish = () => {
    if (selected.length >= 1) {
      navigation.navigate('AllDone', { ...userData, interests: selected });
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

      {/* ── Navy header ─────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerTopRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={s.progress}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={[s.progressDot, { backgroundColor: '#F4A227' }]} />
            ))}
          </View>
          <View style={{ width: 34 }} />
        </View>
        <Text style={s.headerLogo}>Zabroad ✈</Text>
        <Text style={s.headerTitle}>What do you{'\n'}need help with? ✨</Text>
        <Text style={s.headerSub}>Pick at least 1 — we'll personalise your feed</Text>
      </View>

      {/* ── Body ────────────────────────────────────────────── */}
      <ScrollView
        style={{ backgroundColor: C.bg }}
        contentContainerStyle={[s.body, { backgroundColor: C.bg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.grid}>
          {INTERESTS.map((item) => {
            const isSelected = selected.includes(item.key);
            const color = C[item.colorKey];
            const bg    = C[item.colorKey + 'D'];
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  s.interestCard,
                  { backgroundColor: C.card, borderColor: C.border },
                  isSelected && { backgroundColor: bg, borderColor: (color || '#3B8BF7') + '66' },
                ]}
                onPress={() => toggle(item.key)}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <View style={[s.checkMark, { backgroundColor: color || '#3B8BF7' }]}>
                    <Text style={{ fontSize: 9, color: 'white', fontWeight: '800' }}>✓</Text>
                  </View>
                )}
                <Text style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</Text>
                <Text style={[s.interestLabel, { color: isSelected ? (color || '#3B8BF7') : C.cream }]}>
                  {item.label}
                </Text>
                {isSelected && (
                  <View style={[s.selectedDot, { backgroundColor: color || '#3B8BF7' }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selected.length > 0 && (
          <View style={[s.countBadge, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[s.countTxt, { color: C.cream }]}>
              {selected.length} topic{selected.length > 1 ? 's' : ''} selected ✓
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Footer ──────────────────────────────────────────── */}
      <View style={[s.footer, { borderTopColor: C.border, backgroundColor: C.bg }]}>
        <TouchableOpacity
          onPress={handleFinish}
          activeOpacity={selected.length > 0 ? 0.88 : 1}
          style={[s.btn, selected.length === 0 && { opacity: 0.4 }]}
        >
          <Text style={s.btnTxt}>Finish Setup  🚀</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('AllDone', { ...userData, interests: [] })}>
          <Text style={[s.skip, { color: C.c35 }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: NAVY },

  // ── Navy header ────────────────────────────────────────────────────────────
  header:       { backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backBtn:      { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  progress:     { flexDirection: 'row', gap: 6 },
  progressDot:  { width: 24, height: 4, borderRadius: 2 },
  headerLogo:   { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.4, marginBottom: 10 },
  headerTitle:  { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5, lineHeight: 32, marginBottom: 6 },
  headerSub:    { fontSize: 13, color: 'rgba(255,255,255,0.60)', lineHeight: 19 },

  // ── Body ──────────────────────────────────────────────────────────────────
  body:          { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  interestCard:  { width: '30%', flexGrow: 1, borderRadius: 18, borderWidth: 1, padding: 14, alignItems: 'center', position: 'relative', minHeight: 90, justifyContent: 'center' },
  checkMark:     { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  interestLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 15 },
  selectedDot:   { width: 4, height: 4, borderRadius: 2, marginTop: 6 },
  countBadge:    { alignSelf: 'center', marginTop: 16, borderRadius: 50, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8 },
  countTxt:      { fontSize: 13, fontWeight: '700' },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, borderTopWidth: 1, gap: 10, alignItems: 'center' },
  btn:    { backgroundColor: NAVY, borderRadius: 13, paddingVertical: 15, alignItems: 'center', alignSelf: 'stretch' },
  btnTxt: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  skip:   { fontSize: 13, fontWeight: '500' },
});
