import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image, Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';

const NAVY = '#1B3266';

const CATEGORIES = [
  { key: 'legal',      label: 'Legal Aid',   emoji: '⚖️' },
  { key: 'jobs',       label: 'Jobs Fair',   emoji: '💼' },
  { key: 'community',  label: 'Community',   emoji: '🤝' },
  { key: 'health',     label: 'Health',      emoji: '🧠' },
  { key: 'cultural',   label: 'Cultural',    emoji: '🎉' },
  { key: 'networking', label: 'Networking',  emoji: '🌐' },
];

export default function EditEventScreen({ navigation, route }) {
  const event = route.params?.event || {};
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const { api } = useAuthStore();

  const [title,       setTitle]       = useState(event.title       || '');
  const [category,    setCategory]    = useState(event.category    || '');
  const [eventDate,   setEventDate]   = useState(event.date ? new Date(event.date) : null);
  const [pickerMode,  setPickerMode]  = useState(null);
  const [location,    setLocation]    = useState(event.location    || '');
  const [locCoords,   setLocCoords]   = useState(
    event.latitude != null ? { lat: event.latitude, lng: event.longitude } : null
  );
  const [description, setDescription] = useState(event.description || '');
  const [isFree,      setIsFree]      = useState(event.is_free !== false);
  const [price,       setPrice]       = useState(event.price       || '');
  const [link,        setLink]        = useState(event.link        || '');
  const [imageAsset,  setImageAsset]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const debounce = useRef(null);

  function formatDisplay(d) {
    if (!d) return null;
    return {
      datePart: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      timePart: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  }

  function handleDateChange(_, selected) {
    if (!selected) { setPickerMode(null); return; }
    const base = eventDate || new Date();
    if (pickerMode === 'date') {
      const merged = new Date(selected);
      merged.setHours(base.getHours(), base.getMinutes(), 0, 0);
      setEventDate(merged);
      if (Platform.OS === 'android') setPickerMode('time');
    } else {
      const merged = new Date(eventDate || new Date());
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setEventDate(merged);
      setPickerMode(null);
    }
  }

  async function pickImage() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo access to change the event image.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.8 });
      if (!result.canceled && result.assets?.[0]) setImageAsset(result.assets[0]);
    } catch (e) {
      Alert.alert('Error', 'Could not open photo library: ' + (e.message || e));
    }
  }

  const handleLocationChange = useCallback((text) => {
    setLocation(text);
    if (!text) setLocCoords(null);
  }, []);

  const [suggestions, setSuggestions] = useState([]);
  const [showSug,     setShowSug]     = useState(false);
  const [searching,   setSearching]   = useState(false);

  const searchLocation = useCallback((text) => {
    handleLocationChange(text);
    setShowSug(false);
    setSuggestions([]);
    clearTimeout(debounce.current);
    if (text.trim().length < 3) return;
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text.trim())}&format=json&limit=6&addressdetails=1`, { headers: { 'Accept-Language': 'en', 'User-Agent': 'ZabroadApp/1.0' } });
        const data = await res.json();
        setSuggestions(data);
        setShowSug(data.length > 0);
      } catch {} finally { setSearching(false); }
    }, 500);
  }, [handleLocationChange]);

  async function handleSave() {
    if (!title.trim())       return Alert.alert('Required', 'Title is required.');
    if (!category)           return Alert.alert('Required', 'Please select a category.');
    if (!eventDate)          return Alert.alert('Required', 'Please pick a date and time.');
    if (!location.trim())    return Alert.alert('Required', 'Location is required.');
    if (!description.trim()) return Alert.alert('Required', 'Description is required.');

    setSaving(true);
    try {
      const form = new FormData();
      form.append('title',       title.trim());
      form.append('category',    category);
      form.append('date',        eventDate.toISOString());
      form.append('location',    location.trim());
      form.append('description', description.trim());
      form.append('is_free',     isFree ? 'true' : 'false');
      form.append('price',       isFree ? '' : price.trim());
      form.append('link',        link.trim());
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
      const updated = await api(`/events/${event.id}/`, { method: 'PATCH', body: form });
      navigation.navigate('EventDetail', { event: updated });
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  const display = formatDisplay(eventDate);
  const currentImageUri = imageAsset?.uri || event.image_url;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Event</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Image ── */}
        <TouchableOpacity style={[s.imagePicker, !currentImageUri && { borderStyle: 'dashed', borderColor: C.border }]} onPress={pickImage} activeOpacity={0.85}>
          {currentImageUri ? (
            <>
              <Image source={{ uri: currentImageUri }} style={s.imagePreview} resizeMode="cover" />
              <View style={s.imageEditOverlay}>
                <Ionicons name="camera" size={18} color="#fff" />
                <Text style={{ fontSize: 11, color: '#fff', fontWeight: '700', marginTop: 3 }}>Change Photo</Text>
              </View>
            </>
          ) : (
            <View style={[s.imagePlaceholder, { backgroundColor: C.card }]}>
              <Ionicons name="image-outline" size={28} color={C.c35} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.c35 }}>Add Event Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Title ── */}
        <Text style={[s.label, { color: C.cream }]}>Title *</Text>
        <TextInput style={[s.input, { color: C.cream, backgroundColor: C.card, borderColor: C.border }]}
          placeholder="Event title" placeholderTextColor={C.c35} value={title} onChangeText={setTitle} />

        {/* ── Category ── */}
        <Text style={[s.label, { color: C.cream }]}>Category *</Text>
        <View style={s.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[s.catPill, { backgroundColor: C.card, borderColor: C.border }, category === cat.key && { backgroundColor: C.vivid + '22', borderColor: C.vivid + '88' }]}
              onPress={() => setCategory(cat.key)}
              activeOpacity={0.8}
            >
              <Text style={[s.catPillTxt, { color: C.c35 }, category === cat.key && { color: C.vivid, fontWeight: '700' }]}>
                {cat.emoji} {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Date & Time ── */}
        <Text style={[s.label, { color: C.cream }]}>Date & Time *</Text>
        <View style={s.dateRow}>
          <TouchableOpacity style={[s.datePill, { flex: 1, backgroundColor: C.card, borderColor: pickerMode === 'date' ? C.vivid : C.border }]} onPress={() => setPickerMode('date')} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={15} color={display ? C.vivid : C.c35} />
            <Text style={[s.datePillTxt, { color: display ? C.cream : C.c35 }]}>{display?.datePart || 'Pick date'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.datePill, { flex: 0.65, backgroundColor: C.card, borderColor: pickerMode === 'time' ? C.vivid : C.border }]} onPress={() => setPickerMode('time')} activeOpacity={0.8} disabled={!eventDate}>
            <Ionicons name="time-outline" size={15} color={display ? C.vivid : C.c35} />
            <Text style={[s.datePillTxt, { color: display ? C.cream : C.c35 }]}>{display?.timePart || 'Time'}</Text>
          </TouchableOpacity>
        </View>
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
              <DateTimePicker value={eventDate || new Date()} mode={pickerMode} display="spinner" onChange={handleDateChange} textColor={C.cream} minimumDate={new Date()} />
            </View>
          </Modal>
        )}
        {Platform.OS === 'android' && pickerMode && (
          <DateTimePicker value={eventDate || new Date()} mode={pickerMode} display="default" onChange={handleDateChange} minimumDate={new Date()} />
        )}

        {/* ── Location search ── */}
        <Text style={[s.label, { color: C.cream }]}>Location *</Text>
        <View style={[s.inputWrap, showSug && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }, { backgroundColor: C.card, borderColor: C.border }]}>
          <Ionicons name="location-outline" size={15} color={C.c35} />
          <TextInput style={[s.inputInner, { color: C.cream }]} placeholder="Search venue, city…" placeholderTextColor={C.c35} value={location} onChangeText={searchLocation} returnKeyType="search" autoCorrect={false} />
          {searching && <ActivityIndicator size="small" color={C.vivid} />}
          {location.length > 0 && !searching && (
            <TouchableOpacity onPress={() => { setLocation(''); setSuggestions([]); setShowSug(false); setLocCoords(null); }}>
              <Ionicons name="close-circle" size={15} color={C.c35} />
            </TouchableOpacity>
          )}
        </View>
        {showSug && (
          <View style={[s.suggestionBox, { backgroundColor: C.card, borderColor: C.border }]}>
            {suggestions.map((item, idx) => {
              const parts = item.display_name.split(', ');
              const isLast = idx === suggestions.length - 1;
              return (
                <TouchableOpacity key={item.place_id} style={[s.suggestionRow, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border }]}
                  onPress={() => { setLocation(item.display_name); setLocCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) }); setSuggestions([]); setShowSug(false); }} activeOpacity={0.75}>
                  <View style={[s.suggestionIcon, { backgroundColor: C.card2 }]}>
                    <Ionicons name="location-outline" size={13} color={C.vivid} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontSize: 13, fontWeight: '600', color: C.cream }]} numberOfLines={1}>{parts.slice(0, 2).join(', ')}</Text>
                    {parts.length > 2 && <Text style={{ fontSize: 11, color: C.c35, marginTop: 1 }} numberOfLines={1}>{parts.slice(2, 5).join(', ')}</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {locCoords && (
          <View style={[s.coordConfirm, { backgroundColor: C.vivid + '12', borderColor: C.vivid + '33' }]}>
            <Ionicons name="checkmark-circle" size={13} color={C.vivid} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: C.vivid }}>Map pin · {locCoords.lat.toFixed(4)}, {locCoords.lng.toFixed(4)}</Text>
          </View>
        )}

        {/* ── Description ── */}
        <Text style={[s.label, { color: C.cream }]}>Description *</Text>
        <TextInput style={[s.input, s.textArea, { color: C.cream, backgroundColor: C.card, borderColor: C.border }]}
          placeholder="What is this event about?" placeholderTextColor={C.c35} value={description}
          onChangeText={setDescription} multiline numberOfLines={4} textAlignVertical="top" />

        {/* ── Admission ── */}
        <Text style={[s.label, { color: C.cream }]}>Admission</Text>
        <View style={s.toggleRow}>
          {[{ v: true, l: '🆓 Free' }, { v: false, l: '💰 Paid' }].map(opt => (
            <TouchableOpacity key={String(opt.v)} style={[s.toggleBtn, { backgroundColor: C.card, borderColor: C.border }, isFree === opt.v && { backgroundColor: C.vivid, borderColor: C.vivid }]} onPress={() => setIsFree(opt.v)} activeOpacity={0.8}>
              <Text style={[s.toggleTxt, { color: C.c35 }, isFree === opt.v && { color: '#fff' }]}>{opt.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!isFree && (
          <>
            <Text style={[s.label, { color: C.cream }]}>Price</Text>
            <TextInput style={[s.input, { color: C.cream, backgroundColor: C.card, borderColor: C.border }]}
              placeholder="$10" placeholderTextColor={C.c35} value={price} onChangeText={setPrice} />
          </>
        )}

        <Text style={[s.label, { color: C.cream }]}>Registration Link (optional)</Text>
        <TextInput style={[s.input, { color: C.cream, backgroundColor: C.card, borderColor: C.border }]}
          placeholder="https://..." placeholderTextColor={C.c35} value={link} onChangeText={setLink} keyboardType="url" autoCapitalize="none" />

        <TouchableOpacity style={[s.submitBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.submitTxt}>Save Changes</Text>}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: NAVY, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  backBtn:     { width: 36, height: 36, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  content:     { padding: 20, gap: 4 },
  label:       { fontSize: 12, fontWeight: '700', marginTop: 14, marginBottom: 6, letterSpacing: 0.3 },
  input:       { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textArea:    { height: 110, paddingTop: 12 },
  imagePicker: { borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', height: 160, marginBottom: 6 },
  imagePreview:{ width: '100%', height: '100%' },
  imageEditOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  catRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  catPill:     { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  catPillTxt:  { fontSize: 12 },
  dateRow:     { flexDirection: 'row', gap: 10 },
  datePill:    { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  datePillTxt: { fontSize: 12, fontWeight: '600', flex: 1 },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerSheet:   { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 },
  pickerHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  pickerTitle:   { fontSize: 16, fontWeight: '700' },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  inputInner:  { flex: 1, fontSize: 14 },
  suggestionBox:  { borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: 'hidden' },
  suggestionRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11 },
  suggestionIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  coordConfirm:   { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, marginTop: 4 },
  toggleRow:   { flexDirection: 'row', gap: 10 },
  toggleBtn:   { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  toggleTxt:   { fontSize: 14, fontWeight: '600' },
  submitBtn:   { marginTop: 24, backgroundColor: NAVY, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  submitTxt:   { fontSize: 15, fontWeight: '800', color: '#fff' },
});
