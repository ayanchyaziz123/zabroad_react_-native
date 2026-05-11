import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, Animated, ActivityIndicator, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeContext';
import { G_PRIMARY, G_SUCCESS } from '../theme/colors';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { MARKET_CATEGORIES } from './MarketplaceScreen';
import { sanitizePrice } from '../utils/formatPrice';
import LocationSearchInput from '../components/LocationSearchInput';

const ACCENT     = '#00B4D8';
const ACCENT_DIM = '#00B4D81A';

const CATEGORY_OPTIONS = MARKET_CATEGORIES.filter(c => c.key !== 'all');

const PLANS = [
  {
    key: 'free', label: 'Basic', price: 'Free', color: null,
    features: ['Active for 7 days', 'Community visibility', 'No credit card'],
  },
  {
    key: 'standard', label: 'Standard', price: '$2.99', color: '#F5A623', badge: 'Popular',
    features: ['Active for 30 days', 'Priority placement', 'Hot badge'],
  },
  {
    key: 'premium', label: 'Premium', price: '$5.99', color: '#9B72EF',
    features: ['Active for 60 days', 'Featured top listing', 'Hot badge + highlight'],
  },
];

export default function PostMarketplaceScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const api        = useAuthStore(st => st.api);
  const user       = useAuthStore(st => st.user);
  const locCity    = useLocationStore(st => st.city);
  const locLat     = useLocationStore(st => st.latitude);
  const locLng     = useLocationStore(st => st.longitude);
  const locStatus  = useLocationStore(st => st.status);
  const detect     = useLocationStore(st => st.detect);

  const [title,     setTitle]     = useState('');
  const [desc,      setDesc]      = useState('');
  const [price,     setPrice]     = useState('');
  const [location,    setLocation]    = useState('');
  const [selectedLat, setSelectedLat] = useState(null);
  const [selectedLng, setSelectedLng] = useState(null);
  const [category,    setCategory]    = useState('other');
  const [image,     setImage]     = useState(null);
  const [plan,      setPlan]      = useState('free');
  const [posting,   setPosting]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const successScale   = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (locCity) {
      if (!location) setLocation(locCity);
    } else if (locStatus === 'idle') {
      detect();
    }
  }, [locCity, locStatus]);

  const canPost = title.trim().length > 2 && desc.trim().length >= 10;

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to add an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setImage(result.assets[0]);
    }
  }

  async function handlePost() {
    if (!canPost || posting) return;
    setPosting(true);
    try {
      const fd = new FormData();
      fd.append('title',        title.trim());
      fd.append('description',  desc.trim());
      fd.append('price',        price.trim());
      fd.append('location',     location.trim());
      fd.append('category',     category);
      fd.append('plan',         plan);
      fd.append('home_country', user?.profile?.home_country || '');
      fd.append('country_flag', user?.profile?.country_flag || '');
      const useLat = selectedLat ?? locLat;
      const useLng = selectedLng ?? locLng;
      if (useLat != null) fd.append('latitude',  parseFloat(Number(useLat).toFixed(6)));
      if (useLng != null) fd.append('longitude', parseFloat(Number(useLng).toFixed(6)));
      if (image) {
        const ext  = image.uri.split('.').pop();
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        fd.append('image', { uri: image.uri, name: `marketplace.${ext}`, type: mime });
      }

      await api('/marketplace/', { method: 'POST', body: fd });

      setSubmitted(true);
      Animated.parallel([
        Animated.spring(successScale,   { toValue: 1, useNativeDriver: true, bounciness: 14, speed: 8 }),
        Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not post listing. Please try again.');
    } finally {
      setPosting(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    const activePlan = PLANS.find(p => p.key === plan);
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <Animated.View style={[s.successWrap, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
          <View style={[s.successCard, { backgroundColor: C.card, borderColor: ACCENT + '44' }]}>
            <View style={[s.successIcon, { backgroundColor: ACCENT_DIM }]}>
              <Ionicons name="storefront" size={36} color={ACCENT} />
            </View>
            <Text style={[s.successTitle, { color: C.cream }]}>Listed!</Text>
            <Text style={[s.successItemTitle, { color: C.cream }]}>{title}</Text>
            {price ? <Text style={[s.successPrice, { color: ACCENT }]}>{price}</Text> : null}
            <View style={[s.successPlanBadge, { backgroundColor: (activePlan.color || ACCENT) + '22', borderColor: (activePlan.color || ACCENT) + '55' }]}>
              <Ionicons name="checkmark-circle" size={13} color={activePlan.color || ACCENT} />
              <Text style={[s.successPlanTxt, { color: activePlan.color || ACCENT }]}>{activePlan.label} Plan · {activePlan.price}</Text>
            </View>
            <Text style={[s.successNote, { color: C.c35 }]}>Your listing is now visible to the community.</Text>
            <TouchableOpacity style={s.doneBtnWrap} onPress={() => navigation.navigate('Marketplace')} activeOpacity={0.85}>
              <LinearGradient colors={G_SUCCESS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.doneBtnInner}>
                <Ionicons name="storefront-outline" size={18} color="white" />
                <Text style={s.doneBtnTxt}>View Marketplace</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSubmitted(false); setTitle(''); setDesc(''); setPrice(''); setImage(null); setCategory('other'); setPlan('free'); }} style={{ marginTop: 12 }}>
              <Text style={[s.postAnotherTxt, { color: C.c35 }]}>Post another listing</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Post a Listing</Text>
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
                placeholder="e.g. 50 (leave blank if free)"
                placeholderTextColor={C.c35}
                value={price}
                onChangeText={v => setPrice(sanitizePrice(v))}
                keyboardType="decimal-pad"
                maxLength={12}
              />
            </View>
          </View>

          {/* Location */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>LOCATION</Text>
            <LocationSearchInput
              value={location}
              onChange={setLocation}
              onSelect={(sel) => { setSelectedLat(sel?.lat ?? null); setSelectedLng(sel?.lng ?? null); }}
              C={C}
              placeholder="Search city, neighbourhood, address…"
            />
          </View>

          {/* Description */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>DESCRIPTION *</Text>
            <View style={[s.textAreaRow, { backgroundColor: C.card, borderColor: C.border }]}>
              <TextInput
                style={[s.textArea, { color: C.cream }]}
                placeholder="Describe your item — condition, size, colour…"
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

          {/* Image */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>PHOTO (optional)</Text>
            <TouchableOpacity
              style={[s.imgPicker, { backgroundColor: C.card, borderColor: C.border }, image && s.imgPickerFilled]}
              onPress={pickImage}
              activeOpacity={0.85}
            >
              {image ? (
                <>
                  <Image source={{ uri: image.uri }} style={s.imgPreview} resizeMode="cover" />
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

          {/* Plans */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>LISTING PLAN</Text>
            <View style={s.plansCol}>
              {PLANS.map(p => {
                const active = p.key === plan;
                const accent = p.color || ACCENT;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[s.planCard, { backgroundColor: C.card, borderColor: C.border }, active && { borderColor: accent + '88', backgroundColor: accent + '11' }]}
                    onPress={() => setPlan(p.key)}
                    activeOpacity={0.85}
                  >
                    <View style={s.planTop}>
                      <View style={[s.planRadio, { borderColor: active ? accent : C.c35 }]}>
                        {active && <View style={[s.planRadioDot, { backgroundColor: accent }]} />}
                      </View>
                      <Text style={[s.planLabel, { color: C.cream }]}>{p.label}</Text>
                      {p.badge && (
                        <View style={[s.planBadge, { backgroundColor: accent + '22', borderColor: accent + '55' }]}>
                          <Text style={[s.planBadgeTxt, { color: accent }]}>{p.badge}</Text>
                        </View>
                      )}
                      <Text style={[s.planPrice, { color: active ? accent : C.c35 }]}>{p.price}</Text>
                    </View>
                    <View style={s.planFeatures}>
                      {p.features.map(f => (
                        <View key={f} style={s.planFeatureRow}>
                          <Ionicons name="checkmark-circle" size={13} color={active ? accent : C.c35} />
                          <Text style={[s.planFeatureTxt, { color: C.c35 }]}>{f}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        </ScrollView>

        {/* Footer */}
        <View style={[s.footer, { backgroundColor: C.nav, borderTopColor: C.border }]}>
          <View style={s.postBtnShadow}>
            <TouchableOpacity style={s.postBtnTap} onPress={handlePost} disabled={!canPost || posting} activeOpacity={0.85}>
              {canPost ? (
                <LinearGradient colors={G_PRIMARY} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.postBtnInner}>
                  {posting
                    ? <ActivityIndicator size="small" color="white" />
                    : <>
                        <Ionicons name="storefront-outline" size={18} color="white" />
                        <Text style={s.postBtnTxt}>Post Listing</Text>
                      </>
                  }
                </LinearGradient>
              ) : (
                <View style={[s.postBtnInner, s.postBtnOff]}>
                  <Ionicons name="storefront-outline" size={18} color={C.c35} />
                  <Text style={[s.postBtnTxt, { color: C.c35 }]}>Post Listing</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
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

  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  input:      { flex: 1, fontSize: 14, fontWeight: '500' },

  locationBadge:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  locationBadgeTxt: { flex: 1, fontSize: 14, fontWeight: '500' },

  textAreaRow: { borderWidth: 1, borderRadius: 14, padding: 14 },
  textArea:    { fontSize: 14, lineHeight: 22, minHeight: 100 },
  charCount:   { fontSize: 11, textAlign: 'right', marginTop: 6 },

  imgPicker:       { height: 140, borderWidth: 1, borderRadius: 14, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden' },
  imgPickerFilled: { borderStyle: 'solid', padding: 0 },
  imgPickerTxt:    { fontSize: 13, fontWeight: '600' },
  imgPreview:      { width: '100%', height: '100%' },
  imgOverlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', gap: 4 },
  imgOverlayTxt:   { fontSize: 13, fontWeight: '700', color: 'white' },

  plansCol: { gap: 10 },
  planCard: { borderWidth: 1, borderRadius: 16, padding: 14 },
  planTop:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  planRadio:    { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  planRadioDot: { width: 8, height: 8, borderRadius: 4 },
  planLabel:    { flex: 1, fontSize: 14, fontWeight: '700' },
  planPrice:    { fontSize: 14, fontWeight: '800' },
  planBadge:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 50, borderWidth: 1 },
  planBadgeTxt: { fontSize: 10, fontWeight: '700' },
  planFeatures:    { gap: 6 },
  planFeatureRow:  { flexDirection: 'row', alignItems: 'center', gap: 7 },
  planFeatureTxt:  { fontSize: 12 },

  footer:       { padding: 12, paddingBottom: 4, borderTopWidth: 1 },
  postBtnShadow:{ borderRadius: 16, shadowColor: '#F4A227', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  postBtnTap:   { borderRadius: 16, overflow: 'hidden' },
  postBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  postBtnOff:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  postBtnTxt:   { fontSize: 15, fontWeight: '800', color: 'white' },

  // Success
  successWrap:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successCard:      { width: '100%', borderRadius: 24, borderWidth: 1, padding: 28, alignItems: 'center', gap: 10 },
  successIcon:      { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  successTitle:     { fontSize: 26, fontWeight: '900' },
  successItemTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  successPrice:     { fontSize: 18, fontWeight: '800' },
  successPlanBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50, borderWidth: 1 },
  successPlanTxt:   { fontSize: 12, fontWeight: '700' },
  successNote:      { fontSize: 13, textAlign: 'center', marginTop: 4 },
  doneBtnWrap:      { width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 8 },
  doneBtnInner:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  doneBtnTxt:       { fontSize: 15, fontWeight: '800', color: 'white' },
  postAnotherTxt:   { fontSize: 13, fontWeight: '600' },

  catGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catOption:   { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  catOptionTxt:{ fontSize: 12, fontWeight: '600' },
});
