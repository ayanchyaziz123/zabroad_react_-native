import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES = [
  { key: 'electronics', label: 'Electronics', emoji: '📱' },
  { key: 'furniture',   label: 'Furniture',   emoji: '🪑' },
  { key: 'clothing',    label: 'Clothing',    emoji: '👕' },
  { key: 'food',        label: 'Food',        emoji: '🍱' },
  { key: 'beauty',      label: 'Beauty',      emoji: '💄' },
  { key: 'books',       label: 'Books',       emoji: '📚' },
  { key: 'services',    label: 'Services',    emoji: '🤝' },
  { key: 'other',       label: 'Other',       emoji: '📦' },
];

export default function AddProductScreen({ navigation, route }) {
  const { shopId } = route.params;
  const { colors: C } = useTheme();
  const { api }       = useAuthStore();
  const s = useMemo(() => getStyles(C), [C]);

  const [form, setForm] = useState({
    title: '', description: '', price: '', category: 'other', stock_quantity: '1',
  });
  const [imageUri,  setImageUri]  = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!form.title.trim())        return setError('Title is required.');
    if (!form.description.trim())  return setError('Description is required.');
    if (!form.price || isNaN(Number(form.price))) return setError('Enter a valid price.');

    setError('');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title',          form.title.trim());
      fd.append('description',    form.description.trim());
      fd.append('price',          form.price);
      fd.append('category',       form.category);
      fd.append('stock_quantity', form.stock_quantity || '0');
      if (imageUri) {
        fd.append('image', { uri: imageUri, name: 'product.jpg', type: 'image/jpeg' });
      }
      await api(`/shops/${shopId}/products/`, { method: 'POST', body: fd });
      navigation.goBack();
    } catch (e) {
      setError(e.message || 'Failed to add product.');
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
          <Text style={s.headerTitle}>Add Product</Text>
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.saveBtnTxt}>Publish</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#FF6B6B" />
              <Text style={s.errorTxt}>{error}</Text>
            </View>
          ) : null}

          {/* Image picker */}
          <TouchableOpacity style={[s.imgPicker, { backgroundColor: C.card, borderColor: C.border }]} onPress={pickImage} activeOpacity={0.8}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={s.imgPreview} resizeMode="cover" />
            ) : (
              <View style={s.imgPlaceholder}>
                <Ionicons name="camera-outline" size={28} color={C.c35} />
                <Text style={[s.imgPlaceholderTxt, { color: C.c35 }]}>Add Product Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Category */}
          <Text style={s.fieldLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[s.catChip, form.category === cat.key && s.catChipActive]}
                onPress={() => set('category', cat.key)}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
                <Text style={[s.catChipTxt, form.category === cat.key && s.catChipTxtActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Fields */}
          <View style={[s.section, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={s.fieldLabel}>Product Title *</Text>
            <TextInput
              style={[s.input, { color: C.cream, borderColor: C.border, backgroundColor: C.bg }]}
              value={form.title}
              onChangeText={v => set('title', v)}
              placeholder="e.g. Fresh Basmati Rice 5kg"
              placeholderTextColor={C.c35}
            />

            <Text style={[s.fieldLabel, { marginTop: 12 }]}>Description *</Text>
            <TextInput
              style={[s.input, s.textarea, { color: C.cream, borderColor: C.border, backgroundColor: C.bg }]}
              value={form.description}
              onChangeText={v => set('description', v)}
              placeholder="Describe the product..."
              placeholderTextColor={C.c35}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={s.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLabel, { marginTop: 12 }]}>Price ($) *</Text>
                <TextInput
                  style={[s.input, { color: C.cream, borderColor: C.border, backgroundColor: C.bg }]}
                  value={form.price}
                  onChangeText={v => set('price', v)}
                  placeholder="0.00"
                  placeholderTextColor={C.c35}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.fieldLabel, { marginTop: 12 }]}>Stock Qty</Text>
                <TextInput
                  style={[s.input, { color: C.cream, borderColor: C.border, backgroundColor: C.bg }]}
                  value={form.stock_quantity}
                  onChangeText={v => set('stock_quantity', v)}
                  placeholder="1"
                  placeholderTextColor={C.c35}
                  keyboardType="number-pad"
                />
              </View>
            </View>
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

  form:       { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  errorBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FF3B3018', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FF3B3044' },
  errorTxt:   { fontSize: 13, color: '#FF6B6B', flex: 1 },

  imgPicker:     { height: 160, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', overflow: 'hidden', marginBottom: 20 },
  imgPreview:    { width: '100%', height: '100%' },
  imgPlaceholder:{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imgPlaceholderTxt: { fontSize: 13, fontWeight: '600' },

  section:    { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: C.c35, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:      { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  textarea:   { minHeight: 90 },
  twoCol:     { flexDirection: 'row', gap: 10 },

  catChip:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  catChipActive:  { backgroundColor: '#1B3266', borderColor: '#3B8BF7' },
  catChipTxt:     { fontSize: 12, fontWeight: '600', color: C.c35 },
  catChipTxtActive: { color: '#fff' },
});
