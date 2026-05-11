import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { sanitizePrice } from '../utils/formatPrice';
import { MARKET_CATEGORIES } from './MarketplaceScreen';

const ACCENT     = '#00B4D8';
const ACCENT_DIM = '#00B4D81A';

const CATEGORY_OPTIONS = MARKET_CATEGORIES.filter(c => c.key !== 'all');

const CITY_SUGGESTIONS = [
  'Queens, NY', 'Brooklyn, NY', 'Manhattan, NY', 'Bronx, NY',
  'Jersey City, NJ', 'Newark, NJ', 'Hoboken, NJ',
  'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Dallas, TX',
  'Atlanta, GA', 'Boston, MA', 'Lawrence, MA', 'Lowell, MA',
  'Worcester, MA', 'Seattle, WA', 'San Jose, CA',
  'Washington, DC', 'Philadelphia, PA',
];

export default function EditMarketplaceScreen({ route, navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const api = useAuthStore(st => st.api);

  const { item, onSave } = route.params;

  const [title,    setTitle]    = useState(item.title    || '');
  const [desc,     setDesc]     = useState(item.description || item.desc || '');
  const [price,    setPrice]    = useState(item.price    || '');
  const [location,        setLocation]        = useState(item.location || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [category, setCategory] = useState(item.category || 'other');
  const [image,    setImage]    = useState(null); // null = keep existing
  const [saving,   setSaving]   = useState(false);

  const canSave = title.trim().length > 2 && desc.trim().length >= 10;

  const filteredCities = location.trim().length > 0
    ? CITY_SUGGESTIONS.filter(c => c.toLowerCase().includes(location.toLowerCase())).slice(0, 6)
    : [];

  function handleLocationChange(text) {
    setLocation(text);
    setShowSuggestions(text.trim().length > 0);
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to change the image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) setImage(result.assets[0]);
  }

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title',       title.trim());
      fd.append('description', desc.trim());
      fd.append('price',       price.trim());
      fd.append('location',    location.trim());
      fd.append('category',    category);
      if (image) {
        const ext  = image.uri.split('.').pop();
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        fd.append('image', { uri: image.uri, name: `marketplace.${ext}`, type: mime });
      }
      const updated = await api(`/marketplace/${item.id}/`, { method: 'PATCH', body: fd });
      if (onSave) onSave(updated);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not update listing.');
    } finally {
      setSaving(false);
    }
  }

  const previewUri = image?.uri || item.image_url;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Listing</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={s.form}>

          {/* Title */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>TITLE *</Text>
            <View style={[s.inputRow, { backgroundColor: C.card, borderColor: C.border }]}>
              <Ionicons name="storefront-outline" size={16} color={C.c35} />
              <TextInput
                style={[s.input, { color: C.cream }]}
                placeholder="What are you selling?"
                placeholderTextColor={C.c35}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>
          </View>

          {/* Price */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>PRICE</Text>
            <View style={[s.inputRow, { backgroundColor: C.card, borderColor: C.border }]}>
              <Ionicons name="pricetag-outline" size={16} color={C.c35} />
              <TextInput
                style={[s.input, { color: C.cream }]}
                placeholder="e.g. 50"
                placeholderTextColor={C.c35}
                value={price}
                onChangeText={v => setPrice(sanitizePrice(v))}
                keyboardType="decimal-pad"
                maxLength={12}
              />
            </View>
          </View>

          {/* Description */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>DESCRIPTION *</Text>
            <View style={[s.textAreaRow, { backgroundColor: C.card, borderColor: C.border }]}>
              <TextInput
                style={[s.textArea, { color: C.cream }]}
                placeholder="Describe your item…"
                placeholderTextColor={C.c35}
                value={desc}
                onChangeText={setDesc}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={[s.charCount, { color: C.c35 }]}>{desc.length}/500</Text>
            </View>
          </View>

          {/* Location */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>LOCATION</Text>
            <View style={[s.inputRow, { backgroundColor: C.card, borderColor: C.border, opacity: 0.55 }]}>
              <Ionicons name="location-outline" size={16} color={C.c35} />
              <Text style={[s.input, { color: C.c35 }]} numberOfLines={1}>{location || '—'}</Text>
              <Ionicons name="lock-closed-outline" size={14} color={C.c35} />
            </View>
            <Text style={[s.lockedHint, { color: C.c35 }]}>
              Location can't be changed. Create a new post to list a different location.
            </Text>
          </View>

          {/* Category */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>CATEGORY</Text>
            <View style={s.catGrid}>
              {CATEGORY_OPTIONS.map(cat => {
                const active = category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[s.catOption, { backgroundColor: active ? ACCENT + '18' : C.card, borderColor: active ? ACCENT : C.border }]}
                    onPress={() => setCategory(cat.key)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={cat.icon} size={16} color={active ? ACCENT : C.c35} />
                    <Text style={[s.catOptionTxt, { color: active ? ACCENT : C.c35 }]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Photo */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>PHOTO</Text>
            <TouchableOpacity
              style={[s.imgPicker, { backgroundColor: C.card, borderColor: C.border }, previewUri && s.imgPickerFilled]}
              onPress={pickImage}
              activeOpacity={0.85}
            >
              {previewUri ? (
                <>
                  <Image source={{ uri: previewUri }} style={s.imgPreview} resizeMode="cover" />
                  <View style={s.imgOverlay}>
                    <Ionicons name="camera" size={22} color="white" />
                    <Text style={s.imgOverlayTxt}>Change photo</Text>
                  </View>
                </>
              ) : (
                <>
                  <Ionicons name="camera-outline" size={28} color={C.c35} />
                  <Text style={[s.imgPickerTxt, { color: C.c35 }]}>Add a photo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* Footer */}
        <View style={[s.footer, { backgroundColor: C.nav, borderTopColor: C.border }]}>
          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: canSave ? ACCENT : C.card, borderColor: canSave ? ACCENT : C.border }]}
            onPress={handleSave}
            disabled={!canSave || saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator size="small" color={canSave ? 'white' : C.c35} />
              : <Ionicons name="checkmark-circle-outline" size={20} color={canSave ? 'white' : C.c35} />}
            <Text style={[s.saveTxt, { color: canSave ? 'white' : C.c35 }]}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: C.cream },

  form: { padding: 16, paddingBottom: 24, gap: 20 },

  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, color: C.c35 },

  inputRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  input:      { flex: 1, fontSize: 14, fontWeight: '500' },
  lockedHint: { fontSize: 11, marginTop: 4, paddingHorizontal: 2 },

  textAreaRow: { borderWidth: 1, borderRadius: 14, padding: 14 },
  textArea:    { fontSize: 14, lineHeight: 22, minHeight: 100 },
  charCount:   { fontSize: 11, textAlign: 'right', marginTop: 6 },

  catGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catOption:   { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  catOptionTxt:{ fontSize: 12, fontWeight: '600' },

  imgPicker:       { height: 140, borderWidth: 1, borderRadius: 14, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden' },
  imgPickerFilled: { borderStyle: 'solid', padding: 0 },
  imgPickerTxt:    { fontSize: 13, fontWeight: '600' },
  imgPreview:      { width: '100%', height: '100%' },
  imgOverlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', gap: 4 },
  imgOverlayTxt:   { fontSize: 13, fontWeight: '700', color: 'white' },

  footer:  { padding: 14, paddingBottom: 4, borderTopWidth: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 16, borderWidth: 1 },
  saveTxt: { fontSize: 15, fontWeight: '800' },
});
