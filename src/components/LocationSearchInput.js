import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LocationSearchInput({
  value,
  onChange,
  onSelect,
  C,
  placeholder = 'Search address, city…',
}) {
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
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'ZabroadApp/1.0' } },
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

  const clear = useCallback(() => {
    onChange('');
    setSuggestions([]);
    setShowList(false);
    onSelect(null);
  }, [onChange, onSelect]);

  return (
    <View>
      <View style={[
        s.inputRow,
        { backgroundColor: C.card, borderColor: C.border },
        showList && s.inputRowOpen,
      ]}>
        <Ionicons name="location-outline" size={16} color={C.c35} />
        <TextInput
          style={[s.input, { color: C.cream }]}
          placeholder={placeholder}
          placeholderTextColor={C.c35}
          value={value}
          onChangeText={handleChange}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searching && <ActivityIndicator size="small" color={C.vivid} />}
        {value.length > 0 && !searching && (
          <TouchableOpacity onPress={clear} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={C.c35} />
          </TouchableOpacity>
        )}
      </View>

      {showList && (
        <View style={[s.suggestBox, { backgroundColor: C.card, borderColor: C.border }]}>
          {suggestions.map((item, idx) => {
            const parts = item.display_name.split(', ');
            const main  = parts.slice(0, 2).join(', ');
            const sub   = parts.slice(2, 5).join(', ');
            const isLast = idx === suggestions.length - 1;
            return (
              <TouchableOpacity
                key={item.place_id}
                style={[
                  s.suggestRow,
                  !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
                ]}
                onPress={() => pick(item)}
                activeOpacity={0.75}
              >
                <View style={[s.suggestIcon, { backgroundColor: C.card2 }]}>
                  <Ionicons name="location-outline" size={14} color={C.vivid} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.suggestMain, { color: C.cream }]} numberOfLines={1}>{main}</Text>
                  {sub ? <Text style={[s.suggestSub, { color: C.c35 }]} numberOfLines={1}>{sub}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  inputRow:     {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  inputRowOpen: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  input:        { flex: 1, fontSize: 14, fontWeight: '500' },
  suggestBox:   {
    borderWidth: 1, borderTopWidth: 0,
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  suggestRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12 },
  suggestIcon:  { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  suggestMain:  { fontSize: 13, fontWeight: '600' },
  suggestSub:   { fontSize: 11, marginTop: 1 },
});
