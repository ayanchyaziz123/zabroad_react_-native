import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';

const SHOP_TYPES = [
  { key: 'grocery',     label: 'Grocery',     emoji: '🛒' },
  { key: 'restaurant',  label: 'Restaurant',  emoji: '🍽️' },
  { key: 'electronics', label: 'Electronics', emoji: '📱' },
  { key: 'fashion',     label: 'Fashion',     emoji: '👗' },
  { key: 'pharmacy',    label: 'Pharmacy',    emoji: '💊' },
  { key: 'bookstore',   label: 'Bookstore',   emoji: '📚' },
  { key: 'hardware',    label: 'Hardware',    emoji: '🔧' },
  { key: 'beauty',      label: 'Beauty',      emoji: '💄' },
  { key: 'services',    label: 'Services',    emoji: '🤝' },
  { key: 'other',       label: 'Other',       emoji: '📦' },
];

function Field({ label, required, children }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}{required ? ' *' : ''}
      </Text>
      {children}
    </View>
  );
}

export default function CreateShopScreen({ navigation, route }) {
  const existing = route.params?.shop;
  const isEdit   = !!existing;

  const { colors: C } = useTheme();
  const { api }       = useAuthStore();
  const s = useMemo(() => getStyles(C), [C]);

  const [form, setForm] = useState({
    shop_name:    existing?.shop_name    || '',
    description:  existing?.description  || '',
    shop_type:    existing?.shop_type    || 'other',
    phone_number: existing?.phone_number || '',
    email:        existing?.email        || '',
    website:      existing?.website      || '',
    address:      existing?.address      || '',
    city:         existing?.city         || '',
    state:        existing?.state        || '',
    country:      existing?.country      || '',
    postal_code:  existing?.postal_code  || '',
    is_open:      existing?.is_open      ?? true,
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.shop_name.trim())  return setError('Shop name is required.');
    if (!form.address.trim())    return setError('Address is required.');
    if (!form.city.trim())       return setError('City is required.');
    if (!form.country.trim())    return setError('Country is required.');

    setError('');
    setSaving(true);
    try {
      const payload = { ...form };
      let result;
      if (isEdit) {
        result = await api(`/shops/${existing.id}/`, { method: 'PATCH', body: payload });
      } else {
        result = await api('/shops/', { method: 'POST', body: payload });
      }
      navigation.replace('LocalShopDetail', { shopId: result.id });
    } catch (e) {
      setError(e.message || 'Failed to save shop.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{isEdit ? 'Edit Shop' : 'Create Your Shop'}</Text>
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.saveBtnTxt}>Save</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
              <Text style={s.errorTxt}>{error}</Text>
            </View>
          ) : null}

          {/* Shop Type */}
          <Field label="Shop Type" required>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {SHOP_TYPES.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[s.typeChip, form.shop_type === t.key && s.typeChipActive]}
                  onPress={() => set('shop_type', t.key)}
                  activeOpacity={0.75}
                >
                  <Text style={{ fontSize: 16 }}>{t.emoji}</Text>
                  <Text style={[s.typeChipTxt, form.shop_type === t.key && s.typeChipTxtActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Field>

          {/* Basic Info */}
          <View style={[s.section, { borderColor: C.border }]}>
            <View style={s.sectionHdrRow}>
              <View style={s.sectionIcon}><Ionicons name="storefront-outline" size={16} color="#3B8BF7" /></View>
              <Text style={s.sectionTitle}>Basic Info</Text>
            </View>

            <Field label="Shop Name" required>
              <TextInput
                style={[s.input, { color: C.cream, borderColor: C.border, backgroundColor: C.card }]}
                value={form.shop_name}
                onChangeText={v => set('shop_name', v)}
                placeholder="e.g. Rahman's Grocery"
                placeholderTextColor={C.c35}
              />
            </Field>

            <Field label="Description">
              <TextInput
                style={[s.input, s.textarea, { color: C.cream, borderColor: C.border, backgroundColor: C.card }]}
                value={form.description}
                onChangeText={v => set('description', v)}
                placeholder="Tell customers what you sell..."
                placeholderTextColor={C.c35}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </Field>

            <View style={s.toggleRow}>
              <Text style={[s.toggleLabel, { color: C.cream }]}>Shop is currently open</Text>
              <TouchableOpacity
                style={[s.toggle, form.is_open && s.toggleOn]}
                onPress={() => set('is_open', !form.is_open)}
                activeOpacity={0.75}
              >
                <View style={[s.toggleThumb, form.is_open && s.toggleThumbOn]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Location */}
          <View style={[s.section, { borderColor: C.border }]}>
            <View style={s.sectionHdrRow}>
              <View style={[s.sectionIcon, { backgroundColor: '#F4A22718' }]}><Ionicons name="location-outline" size={16} color="#F4A227" /></View>
              <Text style={s.sectionTitle}>Location</Text>
            </View>

            <Field label="Address" required>
              <TextInput style={[s.input, { color: C.cream, borderColor: C.border, backgroundColor: C.card }]} value={form.address} onChangeText={v => set('address', v)} placeholder="Street address" placeholderTextColor={C.c35} />
            </Field>
            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Field label="City" required>
                  <TextInput style={[s.input, { color: C.cream, borderColor: C.border, backgroundColor: C.card }]} value={form.city} onChangeText={v => set('city', v)} placeholder="City" placeholderTextColor={C.c35} />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="State">
                  <TextInput style={[s.input, { color: C.cream, borderColor: C.border, backgroundColor: C.card }]} value={form.state} onChangeText={v => set('state', v)} placeholder="State" placeholderTextColor={C.c35} />
                </Field>
              </View>
            </View>
            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Field label="Country" required>
                  <TextInput style={[s.input, { color: C.cream, borderColor: C.border, backgroundColor: C.card }]} value={form.country} onChangeText={v => set('country', v)} placeholder="Country" placeholderTextColor={C.c35} />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Postal Code">
                  <TextInput style={[s.input, { color: C.cream, borderColor: C.border, backgroundColor: C.card }]} value={form.postal_code} onChangeText={v => set('postal_code', v)} placeholder="ZIP" placeholderTextColor={C.c35} keyboardType="numeric" />
                </Field>
              </View>
            </View>
          </View>

          {/* Contact */}
          <View style={[s.section, { borderColor: C.border }]}>
            <View style={s.sectionHdrRow}>
              <View style={[s.sectionIcon, { backgroundColor: '#28D99E18' }]}><Ionicons name="call-outline" size={16} color="#28D99E" /></View>
              <Text style={s.sectionTitle}>Contact</Text>
            </View>
            <Field label="Phone">
              <TextInput style={[s.input, { color: C.cream, borderColor: C.border, backgroundColor: C.card }]} value={form.phone_number} onChangeText={v => set('phone_number', v)} placeholder="+1 234 567 8900" placeholderTextColor={C.c35} keyboardType="phone-pad" />
            </Field>
            <Field label="Email">
              <TextInput style={[s.input, { color: C.cream, borderColor: C.border, backgroundColor: C.card }]} value={form.email} onChangeText={v => set('email', v)} placeholder="shop@email.com" placeholderTextColor={C.c35} keyboardType="email-address" autoCapitalize="none" />
            </Field>
            <Field label="Website">
              <TextInput style={[s.input, { color: C.cream, borderColor: C.border, backgroundColor: C.card }]} value={form.website} onChangeText={v => set('website', v)} placeholder="https://yourshop.com" placeholderTextColor={C.c35} autoCapitalize="none" />
            </Field>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1B3266' },

  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14 },
  backBtn:     { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: '#fff' },
  saveBtn:     { backgroundColor: '#3B8BF7', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9 },
  saveBtnTxt:  { fontSize: 14, fontWeight: '800', color: '#fff' },

  form: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, backgroundColor: C.bg },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FF3B3018', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FF3B3044' },
  errorTxt:  { fontSize: 13, color: '#FF6B6B', flex: 1 },

  section:      { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16, backgroundColor: C.card },
  sectionHdrRow:{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionIcon:  { width: 30, height: 30, borderRadius: 9, backgroundColor: '#3B8BF718', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: C.cream },

  input:   { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  textarea:{ minHeight: 80 },
  twoCol:  { flexDirection: 'row', gap: 10 },

  typeChip:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  typeChipActive: { backgroundColor: '#1B3266', borderColor: '#3B8BF7' },
  typeChipTxt:    { fontSize: 12, fontWeight: '600', color: C.c35 },
  typeChipTxtActive: { color: '#fff' },

  toggleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggle:      { width: 44, height: 26, borderRadius: 13, backgroundColor: C.border, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn:    { backgroundColor: '#28D99E' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: 'flex-start' },
  toggleThumbOn: { alignSelf: 'flex-end' },
});
