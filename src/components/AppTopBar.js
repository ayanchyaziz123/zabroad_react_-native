import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import UserAvatar from './UserAvatar';

const SUGGESTED_CITIES = [
  { name: 'Queens, NY',       lat: 40.7282,  lng: -73.7949 },
  { name: 'Brooklyn, NY',     lat: 40.6782,  lng: -73.9442 },
  { name: 'Manhattan, NY',    lat: 40.7831,  lng: -73.9712 },
  { name: 'Bronx, NY',        lat: 40.8448,  lng: -73.8648 },
  { name: 'Jersey City, NJ',  lat: 40.7178,  lng: -74.0431 },
  { name: 'Newark, NJ',       lat: 40.7357,  lng: -74.1724 },
  { name: 'Hoboken, NJ',      lat: 40.7440,  lng: -74.0324 },
  { name: 'Los Angeles, CA',  lat: 34.0522,  lng: -118.2437 },
  { name: 'Chicago, IL',      lat: 41.8781,  lng: -87.6298 },
  { name: 'Houston, TX',      lat: 29.7604,  lng: -95.3698 },
  { name: 'Dallas, TX',       lat: 32.7767,  lng: -96.7970 },
  { name: 'Atlanta, GA',      lat: 33.7490,  lng: -84.3880 },
  { name: 'Boston, MA',       lat: 42.3601,  lng: -71.0589 },
  { name: 'Lawrence, MA',     lat: 42.7070,  lng: -71.1631 },
  { name: 'Lowell, MA',       lat: 42.6334,  lng: -71.3162 },
  { name: 'Worcester, MA',    lat: 42.2626,  lng: -71.8023 },
  { name: 'Seattle, WA',      lat: 47.6062,  lng: -122.3321 },
  { name: 'San Jose, CA',     lat: 37.3382,  lng: -121.8863 },
  { name: 'Washington, DC',   lat: 38.9072,  lng: -77.0369 },
  { name: 'Philadelphia, PA', lat: 39.9526,  lng: -75.1652 },
];

/**
 * Props:
 *   title         string   – shown as the main label (e.g. "Marketplace"). If omitted, shows "Hi, {firstName}"
 *   currentCity   string   – selected city name
 *   onCitySelect  fn(city) – called when user picks a city
 *   scope         string   – 'all' | 'country'
 *   onScopeAll    fn       – called when globe tapped
 *   onScopeCom    fn       – called when flag tapped
 *   accent        string   – accent colour (defaults to theme vivid)
 *   right         node     – optional extra buttons rendered after scope toggles
 *   onBack        fn       – when provided, shows a back button instead of avatar
 */
export default function AppTopBar({
  title,
  currentCity,
  onCitySelect,
  scope,
  onScopeAll,
  onScopeCom,
  accent,
  right,
  onBack,
}) {
  const { colors: C } = useTheme();
  const authUser    = useAuthStore(st => st.user);
  const forceDetect = useLocationStore(st => st.forceDetect);
  const setCity     = useLocationStore(st => st.setCity);
  const storeCity   = useLocationStore(st => st.city);

  const A           = accent || C.vivid;
  const countryFlag = authUser?.profile?.country_flag || '🌍';
  const firstName   = authUser?.name?.split(' ')[0] || '';
  const activeCity  = currentCity || storeCity;
  const cityShort   = activeCity?.split(',')[0] || 'Set location';

  const [open,     setOpen]     = useState(false);
  const [locating, setLocating] = useState(false);

  const s = getStyles(C, A);

  return (
    <View style={s.wrapper}>
      {/* ── Header row ──────────────────────────────────────── */}
      <View style={s.header}>

        {/* Back button or Avatar */}
        {onBack ? (
          <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.75}>
            <Ionicons name="chevron-back" size={20} color={C.cream} />
          </TouchableOpacity>
        ) : (
          <View style={s.av}>
            <UserAvatar
              uri={authUser?.profile?.avatar_url}
              emoji={authUser?.profile?.avatar_emoji}
              name={authUser?.name}
              size={36}
              radius={12}
              bg={C.vividD}
            />
            <View style={s.avOnline} />
          </View>
        )}

        {/* Title + city picker */}
        <TouchableOpacity style={{ flex: 1 }} onPress={() => setOpen(v => !v)} activeOpacity={0.75}>
          <Text style={s.title} numberOfLines={1}>
            {title || (firstName ? `Hi, ${firstName}` : 'Zabroad')}
          </Text>
          <View style={s.cityRow}>
            <Ionicons name="location" size={11} color={A} />
            <Text style={[s.cityTxt, { color: A }]} numberOfLines={1}>
              {cityShort !== 'Set location' ? cityShort : 'Pick your city'}
            </Text>
            <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={11} color={C.c35} />
          </View>
        </TouchableOpacity>

        {/* Scope toggles */}
        <View style={s.right}>
          {onScopeCom && (
            <TouchableOpacity
              style={[s.iconBtn, scope === 'country' && { backgroundColor: C.vividD, borderColor: A + '66' }]}
              onPress={onScopeCom}
              activeOpacity={0.75}
            >
              <Text style={s.flagEmoji}>{countryFlag}</Text>
            </TouchableOpacity>
          )}
          {onScopeAll && (
            <TouchableOpacity
              style={[s.iconBtn, scope === 'all' && { backgroundColor: C.vividD, borderColor: A + '66' }]}
              onPress={onScopeAll}
              activeOpacity={0.75}
            >
              <Ionicons name="globe-outline" size={17} color={scope === 'all' ? A : C.c35} />
            </TouchableOpacity>
          )}
          {right}
        </View>
      </View>

      {/* ── City dropdown ────────────────────────────────────── */}
      {open && (
        <>
          <TouchableOpacity
            style={s.overlay}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={[s.dropdown, { backgroundColor: C.nav, borderColor: C.border }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 300 }}
            >
              {/* Near Me */}
              <TouchableOpacity
                style={[s.cityItem, { borderBottomColor: C.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                activeOpacity={0.75}
                disabled={locating}
                onPress={async () => {
                  setLocating(true);
                  const ok = await forceDetect();
                  if (ok) {
                    const { city: freshCity } = useLocationStore.getState();
                    onCitySelect && onCitySelect(freshCity || '');
                  }
                  setLocating(false);
                  setOpen(false);
                }}
                // forceDetect already writes to store; onCitySelect is a side-effect hook
              >
                <View style={[s.cityIcon, { backgroundColor: C.vividD }]}>
                  {locating
                    ? <ActivityIndicator size="small" color={A} />
                    : <Ionicons name="navigate" size={14} color={A} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cityName, { color: C.cream }]}>
                    {locating ? 'Getting location…' : 'Near Me'}
                  </Text>
                  <Text style={[s.citySub, { color: C.c35 }]}>Use your current GPS location</Text>
                </View>
                {!currentCity && !locating && <Ionicons name="checkmark-circle" size={16} color={A} />}
              </TouchableOpacity>

              {/* City list */}
              {SUGGESTED_CITIES.map((city, idx) => {
                const active = city.name === activeCity;
                const isLast = idx === SUGGESTED_CITIES.length - 1;
                return (
                  <TouchableOpacity
                    key={city.name}
                    style={[s.cityItem, !isLast && { borderBottomColor: C.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                    activeOpacity={0.75}
                    onPress={() => {
                      setCity(city.name, city.lat, city.lng);
                      onCitySelect && onCitySelect(city.name);
                      setOpen(false);
                    }}
                  >
                    <View style={[s.cityIcon, { backgroundColor: active ? C.vividD : C.card2 }]}>
                      <Ionicons name="location-outline" size={14} color={active ? A : C.c35} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.cityName, { color: active ? A : C.cream }]}>
                        {city.name.split(',')[0]}
                      </Text>
                      <Text style={[s.citySub, { color: C.c35 }]}>
                        {city.name.split(', ')[1] || ''}
                      </Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={16} color={A} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
}

export { SUGGESTED_CITIES };

const getStyles = (C, A) => StyleSheet.create({
  wrapper: { zIndex: 100 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg, gap: 8,
  },

  av:       { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(232,54,74,0.3)' },
  avOnline: { position: 'absolute', bottom: -2, right: -2, width: 9, height: 9, backgroundColor: C.green, borderRadius: 5, borderWidth: 2, borderColor: C.bg },
  backBtn:  { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border },

  title:   { fontSize: 13, fontWeight: '700', color: C.cream },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  cityTxt: { fontSize: 11, fontWeight: '600', flex: 1 },

  right:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn:   { width: 34, height: 34, borderRadius: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  flagEmoji: { fontSize: 17 },

  overlay:  { position: 'absolute', top: 0, left: -1000, right: -1000, bottom: -2000, zIndex: 49 },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
    borderWidth: 1, borderTopWidth: 0,
    borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12,
  },

  cityItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  cityIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cityName: { fontSize: 14, fontWeight: '700' },
  citySub:  { fontSize: 11, marginTop: 1 },
});
