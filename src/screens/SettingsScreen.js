import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

const APP_VERSION = '1.0.0';

export default function SettingsScreen({ navigation }) {
  const { colors: C, isDark, toggleTheme } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color={C.cream} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Appearance</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* Dark / Light toggle */}
      <View style={[s.card, { backgroundColor: C.card, borderColor: C.border }]}>
        <View style={s.row}>
          <View style={[s.iconWrap, { backgroundColor: isDark ? '#1A1A2E' : '#FFF3E0' }]}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? '#7B8FFF' : '#F5A623'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.rowLabel, { color: C.cream }]}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
            <Text style={[s.rowSub, { color: C.c35 }]}>
              {isDark ? 'Switch to light background' : 'Switch to dark background'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: C.border, true: C.vivid + '88' }}
            thumbColor={isDark ? C.vivid : C.c35}
          />
        </View>
      </View>

      {/* Version */}
      <Text style={[s.version, { color: C.c35 }]}>Zabroad v{APP_VERSION}</Text>

    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { width: 34, height: 34, borderRadius: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: C.cream },
  card:        { margin: 16, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  iconWrap:    { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowLabel:    { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  rowSub:      { fontSize: 11 },
  version:     { textAlign: 'center', fontSize: 11, marginTop: 8 },
});
