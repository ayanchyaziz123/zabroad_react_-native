import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { sanitizePrice } from '../utils/formatPrice';
import { HOUSING_CATEGORIES } from './HousingScreen';

const GOLD     = '#F5A623';
const GOLD_DIM = '#F5A62318';
const CATEGORY_OPTIONS = HOUSING_CATEGORIES.filter(c => c.key !== 'all');

const CITY_SUGGESTIONS = [
  'Queens, NY', 'Brooklyn, NY', 'Manhattan, NY', 'Bronx, NY',
  'Jersey City, NJ', 'Newark, NJ', 'Hoboken, NJ',
  'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Dallas, TX',
  'Atlanta, GA', 'Boston, MA', 'Lawrence, MA', 'Lowell, MA',
  'Worcester, MA', 'Seattle, WA', 'San Jose, CA',
  'Washington, DC', 'Philadelphia, PA',
];

export default function EditHousingScreen({ route, navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const { listing, onSave } = route.params;
  const api = useAuthStore(st => st.api);

  const [title,    setTitle]    = useState(listing.title    || '');
  const [price,    setPrice]    = useState(listing.price    || '');
  const [location,        setLocation]        = useState(listing.location || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [desc,     setDesc]     = useState(listing.desc     || '');
  const [category, setCategory] = useState(listing.category || 'other');
  const [image,    setImage]    = useState(null);
  const [saving,   setSaving]   = useState(false);

  const filteredCities = location.trim().length > 0
    ? CITY_SUGGESTIONS.filter(c => c.toLowerCase().includes(location.toLowerCase())).slice(0, 6)
    : [];

  function handleLocationChange(text) {
    setLocation(text);
    setShowSuggestions(text.trim().length > 0);
  }

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { alert('Please allow photo access.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [16, 9], quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0]);
  }

  const canSave = title.trim().length > 2 && parseFloat(price) > 0 &&
                  location.trim().length > 1 && desc.trim().length >= 10;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title',       title.trim());
      fd.append('price',       price.trim());
      fd.append('location',    location.trim());
      fd.append('description', desc.trim());
      fd.append('category',    category);
      if (image) {
        const ext  = image.uri.split('.').pop();
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        fd.append('image', { uri: image.uri, name: `housing.${ext}`, type: mime });
      }
      await api(`/housing/${listing.id}/`, { method: 'PATCH', body: fd });
      onSave && onSave({
        ...listing,
        title:     title.trim(),
        price:     price.trim(),
        location:  location.trim(),
        desc:      desc.trim(),
        category,
        image_url: image ? null : listing.image_url,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Listing</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={s.form}>

          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>LISTING TITLE *</Text>
            <View style={s.inputRow}>
              <Ionicons name="home-outline" size={16} color={C.c35} />
              <TextInput style={s.input} placeholder="e.g. 1BR in Jackson Heights" placeholderTextColor={C.c35} value={title} onChangeText={setTitle} />
            </View>
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>MONTHLY RENT *</Text>
            <View style={s.inputRow}>
              <Ionicons name="cash-outline" size={16} color={C.c35} />
              <TextInput style={s.input} placeholder="e.g. 1200" placeholderTextColor={C.c35} value={price} onChangeText={v => setPrice(sanitizePrice(v))} keyboardType="decimal-pad" />
            </View>
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>AREA / NEIGHBORHOOD</Text>
            <View style={[s.inputRow, { opacity: 0.55 }]}>
              <Ionicons name="location-outline" size={16} color={C.c35} />
              <Text style={[s.input, { color: C.c35 }]} numberOfLines={1}>{location || '—'}</Text>
              <Ionicons name="lock-closed-outline" size={14} color={C.c35} />
            </View>
            <Text style={[s.lockedHint, { color: C.c35 }]}>
              Location can't be changed. Create a new post to list a different location.
            </Text>
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>CATEGORY</Text>
            <View style={s.catGrid}>
              {CATEGORY_OPTIONS.map(cat => {
                const active = category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[s.catOption, active && { borderColor: GOLD, backgroundColor: GOLD_DIM }]}
                    onPress={() => setCategory(cat.key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={cat.icon} size={14} color={active ? GOLD : C.c35} />
                    <Text style={[s.catOptionTxt, { color: active ? GOLD : C.c35 }]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>DESCRIPTION *</Text>
            <TextInput
              style={s.textArea}
              placeholder="Describe the space, lease terms, how to contact…"
              placeholderTextColor={C.c35}
              value={desc}
              onChangeText={setDesc}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>PHOTO (OPTIONAL · leave blank to keep existing)</Text>
            <TouchableOpacity style={s.imagePicker} onPress={pickImage} activeOpacity={0.8}>
              {image ? (
                <>
                  <Image source={{ uri: image.uri }} style={s.imagePreview} resizeMode="cover" />
                  <TouchableOpacity style={s.imageRemove} onPress={() => setImage(null)} hitSlop={8}>
                    <Ionicons name="close-circle" size={22} color="white" />
                  </TouchableOpacity>
                </>
              ) : listing.image_url ? (
                <Image source={{ uri: listing.image_url }} style={s.imagePreview} resizeMode="cover" />
              ) : (
                <View style={s.imageEmpty}>
                  <Ionicons name="image-outline" size={28} color={C.c35} />
                  <Text style={s.imageEmptyTxt}>Tap to change photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.saveBtn, (!canSave || saving) && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={!canSave || saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator size="small" color="white" />
            : <Ionicons name="checkmark-circle" size={18} color="white" />
          }
          <Text style={s.saveBtnTxt}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: C.cream },

  form:       { padding: 20, gap: 20, paddingBottom: 40 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5 },
  inputRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  lockedHint: { fontSize: 11, color: C.c35, marginTop: 4, paddingHorizontal: 2 },
  input:      { flex: 1, fontSize: 14, color: C.cream },
  textArea:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: C.cream, minHeight: 120, textAlignVertical: 'top' },

  catGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catOption:    { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.card },
  catOptionTxt: { fontSize: 12, fontWeight: '600' },

  imagePicker:   { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border, backgroundColor: C.card, height: 160 },
  imagePreview:  { width: '100%', height: '100%' },
  imageEmpty:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imageEmptyTxt: { fontSize: 13, color: C.c35, fontWeight: '600' },
  imageRemove:   { position: 'absolute', top: 8, right: 8 },

  footer:     { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
  saveBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: GOLD, borderRadius: 16, paddingVertical: 15 },
  saveBtnTxt: { fontSize: 15, fontWeight: '800', color: 'white' },
});
