import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

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
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.back, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backTxt, { color: C.cream }]}>‹</Text>
        </TouchableOpacity>
        <View style={styles.progress}>
          {[1,2,3,4].map(i => (
            <View key={i} style={[styles.progressDot, { backgroundColor: C.vivid }]} />
          ))}
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.titleWrap}>
          <Text style={[styles.step, { color: C.vivid }]}>Step 4 of 4</Text>
          <Text style={[styles.title, { color: C.cream }]}>What do you{'\n'}need help with? ✨</Text>
          <Text style={[styles.sub, { color: C.c35 }]}>Pick at least 1 — we'll personalise your feed</Text>
        </View>

        {/* Interests Grid */}
        <View style={styles.grid}>
          {INTERESTS.map((item) => {
            const isSelected = selected.includes(item.key);
            const color = C[item.colorKey];
            const bg    = C[item.colorKey + 'D'];
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.interestCard,
                  { backgroundColor: C.card, borderColor: C.border },
                  isSelected && { backgroundColor: bg, borderColor: color + '66' },
                ]}
                onPress={() => toggle(item.key)}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <View style={[styles.checkMark, { backgroundColor: color }]}>
                    <Text style={{ fontSize: 9, color: 'white', fontWeight: '800' }}>✓</Text>
                  </View>
                )}
                <Text style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</Text>
                <Text style={[styles.interestLabel, { color: isSelected ? color : C.cream }]}>
                  {item.label}
                </Text>
                {isSelected && (
                  <View style={[styles.selectedDot, { backgroundColor: color }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Count indicator */}
        {selected.length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]}>
            <Text style={[styles.countTxt, { color: C.vivid }]}>
              {selected.length} topic{selected.length > 1 ? 's' : ''} selected ✓
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Finish */}
      <View style={[styles.footer, { borderTopColor: C.border, backgroundColor: C.bg }]}>
        <TouchableOpacity
          onPress={handleFinish}
          activeOpacity={selected.length > 0 ? 0.88 : 1}
          style={[styles.nextBtn, selected.length === 0 && { opacity: 0.4 }]}
        >
          <LinearGradient colors={[C.vivid, '#B82838']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextGrad}>
            <Text style={styles.nextTxt}>Finish Setup</Text>
            <Text style={{ fontSize: 18, color: 'white' }}>🚀</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('AllDone', { ...userData, interests: [] })}>
          <Text style={[styles.skip, { color: C.c35 }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  back: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 24, lineHeight: 28 },
  progress: { flexDirection: 'row', gap: 6 },
  progressDot: { width: 28, height: 4, borderRadius: 2 },
  titleWrap: { paddingHorizontal: 24, paddingBottom: 20 },
  step: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -1, lineHeight: 36, marginBottom: 6 },
  sub: { fontSize: 14, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10 },
  interestCard: { width: '30%', flexGrow: 1, borderRadius: 18, borderWidth: 1, padding: 14, alignItems: 'center', position: 'relative', minHeight: 90, justifyContent: 'center' },
  checkMark: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  interestLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 15 },
  selectedDot: { width: 4, height: 4, borderRadius: 2, marginTop: 6 },
  countBadge: { alignSelf: 'center', marginTop: 16, borderRadius: 50, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8 },
  countTxt: { fontSize: 13, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28, borderTopWidth: 1, gap: 10, alignItems: 'center' },
  nextBtn: { borderRadius: 18, overflow: 'hidden', alignSelf: 'stretch' },
  nextGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  nextTxt: { fontSize: 16, fontWeight: '800', color: 'white' },
  skip: { fontSize: 13, fontWeight: '500' },
});
