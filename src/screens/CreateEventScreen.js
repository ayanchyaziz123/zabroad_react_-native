import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, Image, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';

const NAVY = '#1B3266';

const CATEGORIES = [
  { key: 'legal',      emoji: '⚖️', label: 'Legal Aid'   },
  { key: 'jobs',       emoji: '💼', label: 'Jobs Fair'   },
  { key: 'community',  emoji: '🤝', label: 'Community'   },
  { key: 'health',     emoji: '🧠', label: 'Health'      },
  { key: 'cultural',   emoji: '🎉', label: 'Cultural'    },
  { key: 'networking', emoji: '🌐', label: 'Networking'  },
];

// ── Nominatim location search ─────────────────────────────────────────────────
function LocationSearchInput({ value, onChange, onSelect, C, s }) {
  const [suggestions, setSuggestions] = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [showList,    setShowList]    = useState(false);
  const debounce = useRef(null);

  const handleChange = useCallback((text) => {
    onChange(text);
    setShowList(false);
    setSuggestions([]);
    clearTimeout(debounce.current);
    if (text.trim().length < 3) return;
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text.trim())}&format=json&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'ZabroadApp/1.0' } }
        );
        const data = await res.json();
        setSuggestions(data);
        setShowList(data.length > 0);
      } catch {} finally {
        setSearching(false);
      }
    }, 500);
  }, [onChange]);

  const pick = useCallback((item) => {
    const name = item.display_name;
    onChange(name);
    onSelect({ name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setSuggestions([]);
    setShowList(false);
  }, [onChange, onSelect]);

  return (
    <View>
      <View style={[s.inputRow, showList && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}>
        <Ionicons name="location-outline" size={16} color={C.c35} />
        <TextInput
          style={s.input}
          placeholder="Search venue, city, address…"
          placeholderTextColor={C.c35}
          value={value}
          onChangeText={handleChange}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searching && <ActivityIndicator size="small" color={C.vivid} />}
        {value.length > 0 && !searching && (
          <TouchableOpacity onPress={() => { onChange(''); setSuggestions([]); setShowList(false); onSelect(null); }}>
            <Ionicons name="close-circle" size={16} color={C.c35} />
          </TouchableOpacity>
        )}
      </View>
      {showList && (
        <View style={[s.suggestionBox, { backgroundColor: C.card, borderColor: C.border }]}>
          {suggestions.map((item, idx) => {
            const parts = item.display_name.split(', ');
            const main  = parts.slice(0, 2).join(', ');
            const sub   = parts.slice(2, 5).join(', ');
            const isLast = idx === suggestions.length - 1;
            return (
              <TouchableOpacity
                key={item.place_id}
                style={[s.suggestionRow, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border }]}
                onPress={() => pick(item)}
                activeOpacity={0.75}
              >
                <View style={[s.suggestionIcon, { backgroundColor: C.card2 }]}>
                  <Ionicons name="location-outline" size={14} color={C.vivid} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.suggestionMain, { color: C.cream }]} numberOfLines={1}>{main}</Text>
                  {sub ? <Text style={[s.suggestionSub, { color: C.c35 }]} numberOfLines={1}>{sub}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ── Image picker ──────────────────────────────────────────────────────────────
function ImagePickerField({ imageUri, onPick, C, s }) {
  async function handlePick() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo access to add an event image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        onPick(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open photo library: ' + (e.message || e));
    }
  }

  return (
    <TouchableOpacity style={[s.imagePicker, !imageUri && { borderStyle: 'dashed', borderColor: C.border }]} onPress={handlePick} activeOpacity={0.85}>
      {imageUri ? (
        <>
          <Image source={{ uri: imageUri }} style={s.imagePreview} resizeMode="cover" />
          <View style={s.imageEditOverlay}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={{ fontSize: 12, color: '#fff', fontWeight: '700', marginTop: 4 }}>Change Photo</Text>
          </View>
        </>
      ) : (
        <View style={s.imagePlaceholder}>
          <Ionicons name="image-outline" size={32} color={C.c35} />
          <Text style={[s.imagePlaceholderTxt, { color: C.c35 }]}>Add Event Photo</Text>
          <Text style={[s.imagePlaceholderSub, { color: C.c35 }]}>Tap to pick from gallery</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function CreateEventScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const { api } = useAuthStore();

  const [title,       setTitle]       = useState('');
  const [category,    setCategory]    = useState('');
  const [eventDate,   setEventDate]   = useState(null);       // JS Date object
  const [pickerMode,  setPickerMode]  = useState(null);       // 'date' | 'time' | null
  const [location,    setLocation]    = useState('');
  const [locCoords,   setLocCoords]   = useState(null);
  const [description, setDescription] = useState('');
  const [isFree,      setIsFree]      = useState(true);
  const [price,       setPrice]       = useState('');
  const [link,        setLink]        = useState('');
  const [imageAsset,  setImageAsset]  = useState(null);
  const [submitting,  setSubmitting]  = useState(false);

  function formatDisplay(d) {
    if (!d) return null;
    const datePart = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return { datePart, timePart };
  }

  function handleDateChange(_, selected) {
    if (!selected) { setPickerMode(null); return; }
    const base = eventDate || new Date();
    if (pickerMode === 'date') {
      const merged = new Date(selected);
      merged.setHours(base.getHours(), base.getMinutes(), 0, 0);
      setEventDate(merged);
      if (Platform.OS === 'android') setPickerMode('time'); // chain to time on Android
    } else {
      const merged = new Date(eventDate || new Date());
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setEventDate(merged);
      setPickerMode(null);
    }
  }

  function validate() {
    if (!title.trim())       return 'Please enter a title.';
    if (!category)           return 'Please select a category.';
    if (!eventDate)          return 'Please pick a date and time.';
    if (!location.trim())    return 'Please enter a location.';
    if (!description.trim()) return 'Please enter a description.';
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { Alert.alert('Missing Info', err); return; }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('title',       title.trim());
      form.append('category',    category);
      form.append('date',        eventDate.toISOString());
      form.append('location',    location.trim());
      form.append('description', description.trim());
      form.append('is_free',     isFree ? 'true' : 'false');
      if (!isFree && price.trim()) form.append('price', price.trim());
      if (link.trim())             form.append('link',  link.trim());
      if (locCoords) {
        form.append('latitude',  String(locCoords.lat));
        form.append('longitude', String(locCoords.lng));
      }
      if (imageAsset) {
        const uri  = imageAsset.uri;
        const name = uri.split('/').pop();
        const type = imageAsset.mimeType || 'image/jpeg';
        form.append('image', { uri, name, type });
      }

      await api('/events/', { method: 'POST', body: form });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not create event.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Create Event</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={s.form}>

          {/* ── Image ── */}
          <ImagePickerField imageUri={imageAsset?.uri} onPick={setImageAsset} C={C} s={s} />

          {/* ── Title ── */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>TITLE *</Text>
            <View style={s.inputRow}>
              <Ionicons name="text-outline" size={16} color={C.c35} />
              <TextInput style={s.input} placeholder="Event title" placeholderTextColor={C.c35} value={title} onChangeText={setTitle} maxLength={200} />
            </View>
          </View>

          {/* ── Category ── */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>CATEGORY *</Text>
            <View style={s.pillsWrap}>
              {CATEGORIES.map(cat => {
                const active = category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[s.catPill, active && { backgroundColor: C.vivid + '22', borderColor: C.vivid + '66' }]}
                    onPress={() => setCategory(cat.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.catPillEmoji}>{cat.emoji}</Text>
                    <Text style={[s.catPillTxt, { color: C.c60 }, active && { color: C.vivid, fontWeight: '700' }]}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Date & Time ── */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>DATE & TIME *</Text>
            {(() => {
              const display = formatDisplay(eventDate);
              return (
                <View style={s.dateRow}>
                  <TouchableOpacity style={[s.datePill, { flex: 1, backgroundColor: C.card, borderColor: pickerMode === 'date' ? C.vivid : C.border }]} onPress={() => setPickerMode('date')} activeOpacity={0.8}>
                    <Ionicons name="calendar-outline" size={16} color={display ? C.vivid : C.c35} />
                    <Text style={[s.datePillTxt, { color: display ? C.cream : C.c35 }]}>{display?.datePart || 'Pick date'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.datePill, { flex: 0.7, backgroundColor: C.card, borderColor: pickerMode === 'time' ? C.vivid : C.border }]} onPress={() => setPickerMode('time')} activeOpacity={0.8} disabled={!eventDate}>
                    <Ionicons name="time-outline" size={16} color={display ? C.vivid : C.c35} />
                    <Text style={[s.datePillTxt, { color: display ? C.cream : C.c35 }]}>{display?.timePart || 'Pick time'}</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}

            {/* iOS: inline picker in a modal sheet */}
            {Platform.OS === 'ios' && pickerMode && (
              <Modal transparent animationType="slide" visible onRequestClose={() => setPickerMode(null)}>
                <TouchableOpacity style={s.pickerOverlay} activeOpacity={1} onPress={() => setPickerMode(null)} />
                <View style={[s.pickerSheet, { backgroundColor: C.nav }]}>
                  <View style={s.pickerHeader}>
                    <Text style={[s.pickerTitle, { color: C.cream }]}>{pickerMode === 'date' ? 'Pick Date' : 'Pick Time'}</Text>
                    <TouchableOpacity onPress={() => { if (pickerMode === 'date' && eventDate) setPickerMode('time'); else setPickerMode(null); }}>
                      <Text style={{ color: C.vivid, fontWeight: '700', fontSize: 15 }}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={eventDate || new Date()}
                    mode={pickerMode}
                    display="spinner"
                    onChange={handleDateChange}
                    textColor={C.cream}
                    minimumDate={new Date()}
                  />
                </View>
              </Modal>
            )}

            {/* Android: native dialog */}
            {Platform.OS === 'android' && pickerMode && (
              <DateTimePicker
                value={eventDate || new Date()}
                mode={pickerMode}
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* ── Location search ── */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>LOCATION *</Text>
            <LocationSearchInput
              value={location}
              onChange={(text) => { setLocation(text); if (!text) setLocCoords(null); }}
              onSelect={(coords) => setLocCoords(coords)}
              C={C} s={s}
            />
            {locCoords && (
              <View style={[s.coordConfirm, { backgroundColor: C.vivid + '12', borderColor: C.vivid + '33' }]}>
                <Ionicons name="checkmark-circle" size={14} color={C.vivid} />
                <Text style={[s.coordConfirmTxt, { color: C.vivid }]}>
                  Map pin set · {locCoords.lat.toFixed(4)}, {locCoords.lng.toFixed(4)}
                </Text>
              </View>
            )}
          </View>

          {/* ── Description ── */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>DESCRIPTION *</Text>
            <TextInput style={s.textArea} placeholder="What is this event about?" placeholderTextColor={C.c35} value={description} onChangeText={setDescription} multiline textAlignVertical="top" />
          </View>

          {/* ── Admission ── */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>ADMISSION</Text>
            <View style={s.toggleRow}>
              <TouchableOpacity style={[s.togglePill, isFree && { backgroundColor: C.green + '22', borderColor: C.green + '66' }]} onPress={() => setIsFree(true)} activeOpacity={0.8}>
                <Text style={[s.toggleTxt, { color: C.c35 }, isFree && { color: C.green, fontWeight: '700' }]}>🆓 Free</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.togglePill, !isFree && { backgroundColor: C.gold + '22', borderColor: C.gold + '66' }]} onPress={() => setIsFree(false)} activeOpacity={0.8}>
                <Text style={[s.toggleTxt, { color: C.c35 }, !isFree && { color: C.gold, fontWeight: '700' }]}>💰 Paid</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!isFree && (
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>PRICE</Text>
              <View style={s.inputRow}>
                <Ionicons name="cash-outline" size={16} color={C.c35} />
                <TextInput style={s.input} placeholder="e.g. $10" placeholderTextColor={C.c35} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
              </View>
            </View>
          )}

          {/* ── Link ── */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>REGISTRATION LINK (OPTIONAL)</Text>
            <View style={s.inputRow}>
              <Ionicons name="link-outline" size={16} color={C.c35} />
              <TextInput style={s.input} placeholder="https://eventbrite.com/…" placeholderTextColor={C.c35} value={link} onChangeText={setLink} autoCapitalize="none" keyboardType="url" />
            </View>
          </View>

          <View style={{ height: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={s.footer}>
        <TouchableOpacity style={[s.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
          {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="paper-plane" size={18} color="#fff" />}
          <Text style={s.submitBtnTxt}>{submitting ? 'Creating…' : 'Create Event'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, backgroundColor: NAVY },
  backBtn: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },

  form: { padding: 20, gap: 20, paddingBottom: 40 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5 },
  hint: { fontSize: 11, color: C.c35, fontStyle: 'italic', marginTop: -2 },

  // Image picker
  imagePicker: { borderRadius: 16, borderWidth: 1.5, overflow: 'hidden', height: 180 },
  imagePreview: { width: '100%', height: '100%' },
  imageEditOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.card },
  imagePlaceholderTxt: { fontSize: 14, fontWeight: '700' },
  imagePlaceholderSub: { fontSize: 12 },

  // Input
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  input: { flex: 1, fontSize: 14, color: C.cream },
  textArea: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: C.cream, minHeight: 130 },

  // Location suggestions
  suggestionBox: { borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, overflow: 'hidden' },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  suggestionIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  suggestionMain: { fontSize: 13, fontWeight: '600' },
  suggestionSub:  { fontSize: 11, marginTop: 1 },
  coordConfirm: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  coordConfirmTxt: { fontSize: 11, fontWeight: '600' },

  // Category pills
  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 50, paddingHorizontal: 14, paddingVertical: 9 },
  catPillEmoji: { fontSize: 16 },
  catPillTxt: { fontSize: 13, fontWeight: '500' },

  // Date picker
  dateRow:       { flexDirection: 'row', gap: 10 },
  datePill:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  datePillTxt:   { fontSize: 13, fontWeight: '600', flex: 1 },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet:   { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 },
  pickerHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  pickerTitle:   { fontSize: 16, fontWeight: '700' },

  // Toggle
  toggleRow: { flexDirection: 'row', gap: 10 },
  togglePill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 50, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  toggleTxt: { fontSize: 14, fontWeight: '500' },

  // Footer
  footer: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.vivid, borderRadius: 16, paddingVertical: 16, shadowColor: C.vivid, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  submitBtnTxt: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
