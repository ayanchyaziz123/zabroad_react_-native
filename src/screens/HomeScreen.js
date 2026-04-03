import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Circle } from 'react-native-maps';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';

const NEARBY_RESOURCES = [
  {
    id: 'r1', category: 'Jobs', icon: '💼', color: '#3EC878', bg: '#0F2018',
    title: 'OPT-Friendly Jobs Near You',
    items: ['Junior Dev — TechCorp NYC', 'Data Analyst — Citibank', 'IT Support — Queens Hospital'],
    count: 14, route: 'Jobs',
  },
  {
    id: 'r2', category: 'Housing', icon: '🏠', color: '#F5A623', bg: '#1A1408',
    title: 'No Credit Check Housing',
    items: ['1BR Queens — $1,450/mo', 'Studio Flushing — $1,100/mo', 'Room Jackson Hts — $900/mo'],
    count: 8, route: 'Housing',
  },
  {
    id: 'r3', category: 'Doctors', icon: '🩺', color: '#5BCFEF', bg: '#0A1820',
    title: 'Doctors Speak Your Language',
    items: ['Dr. Karim — Primary Care, Queens', 'Dr. Hossain — Family Med, Flushing', 'Dr. Ahmed — Dentist, Bronx'],
    count: 6, route: 'Healthcare',
  },
  {
    id: 'r4', category: 'Attorneys', icon: '⚖️', color: '#9B72EF', bg: '#130F20',
    title: 'Immigration Attorneys Near You',
    items: ['Priya Mehta — OPT / H-1B', 'James Park — Asylum / Green Card', 'Aisha Law — Family Visa'],
    count: 5, route: 'Attorney',
  },
  {
    id: 'r5', category: 'Events', icon: '🗓️', color: '#F5A623', bg: '#1A1208',
    title: 'Events Near You',
    items: ['Legal Aid — Sat Apr 5, Queens', 'BD Meetup — Sun Apr 6, Flushing', 'Job Fair — Sat Apr 12, Manhattan'],
    count: 9, route: 'Events',
  },
];

const SUGGESTED_CITIES = [
  { name: 'Queens, NY',        lat: 40.7282,  lng: -73.7949 },
  { name: 'Brooklyn, NY',      lat: 40.6782,  lng: -73.9442 },
  { name: 'Manhattan, NY',     lat: 40.7831,  lng: -73.9712 },
  { name: 'Bronx, NY',         lat: 40.8448,  lng: -73.8648 },
  { name: 'Jersey City, NJ',   lat: 40.7178,  lng: -74.0431 },
  { name: 'Newark, NJ',        lat: 40.7357,  lng: -74.1724 },
  { name: 'Hoboken, NJ',       lat: 40.7440,  lng: -74.0324 },
  { name: 'Los Angeles, CA',   lat: 34.0522,  lng: -118.2437 },
  { name: 'Chicago, IL',       lat: 41.8781,  lng: -87.6298 },
  { name: 'Houston, TX',       lat: 29.7604,  lng: -95.3698 },
  { name: 'Dallas, TX',        lat: 32.7767,  lng: -96.7970 },
  { name: 'Atlanta, GA',       lat: 33.7490,  lng: -84.3880 },
  { name: 'Boston, MA',        lat: 42.3601,  lng: -71.0589 },
  { name: 'Seattle, WA',       lat: 47.6062,  lng: -122.3321 },
  { name: 'San Jose, CA',      lat: 37.3382,  lng: -121.8863 },
  { name: 'Washington, DC',    lat: 38.9072,  lng: -77.0369 },
  { name: 'Philadelphia, PA',  lat: 39.9526,  lng: -75.1652 },
];

const FEED_DATA = [
  {
    id: 'f0', type: 'featured', scope: 'bd_usa',
    avatar: '🤖', avatarBg: '#2D1B2E', name: 'Zabroad AI', handle: '@zabroad_ai',
    time: 'Pinned', location: null, tag: 'AI TIP', tagColor: '#E8364A',
    body: 'H-1B cap lottery opens April 1 — registration window is March 7–22. Make sure your employer has filed an LCA and your attorney has your docs ready.',
    likes: 312, comments: 74, route: 'AIAssistant',
    image: { emoji: '🤖', bg: ['#2D1B2E', '#1A0F1E'], label: 'H-1B Season 2026', sublabel: 'Act now · Deadline April 1' },
  },
  {
    id: 'f1', type: 'post', scope: 'local',
    avatar: '👨🏽', avatarBg: '#1A2035', name: 'Tanvir Hossain', handle: '@tanvir_h',
    time: '18 min ago', location: 'Queens, NY', tag: 'Q&A', tagColor: '#5B8DEF',
    body: 'Best OPT-friendly staffing agencies in NYC? TCS and Mastech keep ghosting me after phone screens. My EAD expires in 6 months 😟 Any leads?',
    likes: 34, comments: 14, route: 'PostDetail', image: null,
  },
  {
    id: 'f2', type: 'post', scope: 'local',
    avatar: '👩🏾', avatarBg: '#0F2018', name: 'Aisha Kamara', handle: '@aisha_k',
    time: '1h ago', location: 'Bronx, NY', tag: 'Win 🎉', tagColor: '#3EC878',
    body: 'EAD APPROVED after 9 months of waiting, endless RFEs and two attorney calls 🎉 For anyone still waiting — keep faith. Happy to share my full timeline.',
    likes: 224, comments: 61, route: 'PostDetail',
    image: { emoji: '📄', bg: ['#0F2018', '#0A1810'], label: 'EAD Card Approved ✓', sublabel: '9 months · Queens, NY' },
  },
  {
    id: 'f3', type: 'post', scope: 'local',
    avatar: '👩🏻', avatarBg: '#0F1E25', name: 'Yuna Park', handle: '@yuna_nyc',
    time: '2h ago', location: 'Flushing, NY', tag: 'Housing', tagColor: '#86EFAC',
    body: 'Found a no-credit-check 1BR in Flushing! $1,450/mo · No SSN required · 1 month deposit · Close to 7 train. Landlord is immigrant-friendly. DM me for info.',
    likes: 189, comments: 43, route: 'PostDetail',
    image: { emoji: '🏠', bg: ['#0F2018', '#0A1A14'], label: 'Flushing, Queens', sublabel: '$1,450/mo · No credit check' },
  },
  {
    id: 'f4', type: 'post', scope: 'bd_nearby',
    avatar: '👨🏿', avatarBg: '#1E1225', name: 'Marcus Tesfaye', handle: '@marcus_t',
    time: '3h ago', location: 'Manhattan, NY', tag: 'Legal', tagColor: '#C084FC',
    body: 'Asylum case approved after 2.5 years. I want to share my journey for anyone going through this alone. It\'s brutal but possible. The key was a pro bono attorney.',
    likes: 418, comments: 92, route: 'PostDetail', image: null,
  },
  {
    id: 'f5', type: 'post', scope: 'global',
    avatar: '👩🏽', avatarBg: '#201A08', name: 'Priya Sharma', handle: '@priya_s',
    time: '4h ago', location: 'Jersey City, NJ', tag: 'Jobs', tagColor: '#FDB970',
    body: 'Got my H-1B transfer approved! Moving to Google NYC 🎉 Petition filed Oct 1st, approved in 3 weeks on premium processing. The fear is worse than the process.',
    likes: 502, comments: 108, route: 'PostDetail',
    image: { emoji: '🔍', bg: ['#1A1A08', '#121208'], label: 'Google NYC · H-1B Transfer', sublabel: 'Approved in 3 weeks · Premium' },
  },
  {
    id: 'f6', type: 'post', scope: 'local',
    avatar: '👨🏽', avatarBg: '#0F1A2A', name: 'Carlos Mendez', handle: '@carlosm',
    time: '5h ago', location: 'Brooklyn, NY', tag: 'Q&A', tagColor: '#5B8DEF',
    body: 'Can I work part-time on F-1 OPT while waiting for H-1B approval? I have a full-time offer + a consulting gig. Would it affect my cap-gap extension?',
    likes: 28, comments: 19, route: 'PostDetail', image: null,
  },
  {
    id: 'f7', type: 'event', scope: 'bd_usa',
    avatar: '⚖️', avatarBg: '#1A1025', name: 'Legal Aid NYC', handle: '@legalaidnyc',
    time: 'This Saturday', location: 'Downtown Manhattan', tag: 'Event', tagColor: '#C084FC',
    body: 'Free immigration consultation this Saturday! DACA renewals, asylum, visa renewals & green card. Walk-ins welcome. 10am–4pm at 199 Water St.',
    likes: 320, comments: 88, route: 'Attorney',
    image: { emoji: '⚖️', bg: ['#1A1025', '#100A18'], label: 'Free Legal Aid Event', sublabel: 'Sat 10am–4pm · 199 Water St' },
  },
  {
    id: 'f8', type: 'post', scope: 'bd_nearby',
    avatar: '👩🏾', avatarBg: '#0F2018', name: 'Fatima Rahman', handle: '@fatima_r',
    time: '6h ago', location: 'Queens, NY', tag: 'Tip', tagColor: '#3EC878',
    body: 'How I got Medicaid in NYC as an immigrant — step by step. A lot of people don\'t know you can qualify on certain visa types. Apply at your local HRA office with your I-94.',
    likes: 276, comments: 53, route: 'PostDetail', image: null,
  },
  {
    id: 'f9', type: 'post', scope: 'global',
    avatar: '👩🏽', avatarBg: '#1A0F1E', name: 'Meera Iyer', handle: '@meera_nyc',
    time: '10h ago', location: 'Hoboken, NJ', tag: 'Q&A', tagColor: '#5B8DEF',
    body: 'Credit builder loan vs secured card for new immigrants? I moved here 4 months ago with zero credit history. Bank suggested secured card but I\'ve heard about Self. Which is better?',
    likes: 61, comments: 24, route: 'PostDetail', image: null,
  },
  {
    id: 'f10', type: 'post', scope: 'bd_usa',
    avatar: '👩🏽', avatarBg: '#1A1A08', name: 'Nadia Osei', handle: '@nadia_o',
    time: '14h ago', location: 'Queens, NY', tag: 'Housing', tagColor: '#86EFAC',
    body: 'Roommate wanted in Jackson Heights — immigrant-friendly building. $900/mo, no credit check, landlord accepts ITIN. Female preferred. Move-in April 1.',
    likes: 88, comments: 31, route: 'PostDetail',
    image: { emoji: '🏘️', bg: ['#0F1A10', '#0A1208'], label: 'Jackson Heights, Queens', sublabel: '$900/mo · ITIN accepted' },
  },
  {
    id: 'f11', type: 'post', scope: 'bd_all',
    avatar: '👨🏽', avatarBg: '#0F1A2A', name: 'Rafiq Islam', handle: '@rafiq_dhaka',
    time: '3h ago', location: 'London, UK', tag: 'Visa', tagColor: '#5B8DEF',
    body: 'Just got my UK Skilled Worker visa approved after moving from Dhaka! The process took 6 weeks. Happy to answer questions for anyone applying from Bangladesh.',
    likes: 203, comments: 47, route: 'PostDetail',
    image: { emoji: '🇬🇧', bg: ['#0F1A2A', '#080F1A'], label: 'UK Skilled Worker Visa ✓', sublabel: 'London · 6 weeks processing' },
  },
  {
    id: 'f12', type: 'post', scope: 'bd_all',
    avatar: '👩🏽', avatarBg: '#1A1008', name: 'Sumaiya Akter', handle: '@sumaiya_ca',
    time: '7h ago', location: 'Toronto, Canada', tag: 'Jobs', tagColor: '#FDB970',
    body: 'Bangladeshi tech professionals in Canada — there\'s a growing community in Toronto. Just joined a BD engineers group here with 400+ members. DM for the invite link.',
    likes: 156, comments: 62, route: 'PostDetail', image: null,
  },
];

// SCOPES built dynamically in HomeScreen from UserContext

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Good morning ☀️';
  if (h >= 12 && h < 17) return 'Good afternoon 🌤';
  if (h >= 17 && h < 21) return 'Good evening 🌆';
  return 'Good night 🌙';
}


function LikeButton({ count, s, C }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(count);
  const scale = useRef(new Animated.Value(1)).current;
  function onPress() {
    setLiked(l => !l);
    setLikeCount(c => liked ? c - 1 : c + 1);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.5, useNativeDriver: true, speed: 50, bounciness: 16 }),
      Animated.spring(scale, { toValue: 1,   useNativeDriver: true, speed: 20 }),
    ]).start();
  }
  return (
    <TouchableOpacity style={s.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <Animated.Text style={{ fontSize: 15, transform: [{ scale }] }}>{liked ? '❤️' : '🤍'}</Animated.Text>
      <Text style={[s.actionTxt, liked && { color: '#FF6B6B' }]}>{likeCount}</Text>
    </TouchableOpacity>
  );
}

function SaveButton({ s, C }) {
  const [saved, setSaved] = useState(false);
  return (
    <TouchableOpacity style={s.actionBtn} onPress={() => setSaved(v => !v)} activeOpacity={0.7}>
      <Text style={{ fontSize: 15 }}>{saved ? '🔖' : '🏷️'}</Text>
      <Text style={[s.actionTxt, saved && { color: C.gold }]}>{saved ? 'Saved' : 'Save'}</Text>
    </TouchableOpacity>
  );
}

function FeedCard({ item, navigation, C, s }) {
  function handlePress() {
    navigation.navigate(item.route, item.route === 'PostDetail' ? { post: item } : undefined);
  }

  return (
    <TouchableOpacity style={s.feedCard} onPress={handlePress} activeOpacity={0.96}>

      {/* Author row */}
      <View style={s.feedHeader}>
        <TouchableOpacity
          style={[s.feedAvatar, { backgroundColor: item.avatarBg }]}
          onPress={() => item.handle && navigation.navigate('UserProfile', { handle: item.handle })}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 19 }}>{item.avatar}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.feedName}>{item.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
            <Text style={s.feedMeta}>{item.time}</Text>
            {item.location && <Text style={s.feedMeta}>· 📍 {item.location}</Text>}
          </View>
        </View>
        <View style={[s.tagPill, { backgroundColor: item.tagColor + '18' }]}>
          <Text style={[s.tagTxt, { color: item.tagColor }]}>{item.tag}</Text>
        </View>
      </View>

      {/* Body text */}
      <Text style={s.feedBody} numberOfLines={item.image ? 2 : 4}>{item.body}</Text>

      {/* Image card */}
      {item.image && (
        <LinearGradient colors={item.image.bg} style={s.feedImage}>
          <Text style={{ fontSize: 44 }}>{item.image.emoji}</Text>
          <View>
            <Text style={s.feedImageLabel}>{item.image.label}</Text>
            <Text style={s.feedImageSub}>{item.image.sublabel}</Text>
          </View>
        </LinearGradient>
      )}

      {/* Actions */}
      <View style={s.feedActions}>
        <LikeButton count={item.likes} s={s} C={C} />
        <TouchableOpacity style={s.actionBtn} onPress={handlePress} activeOpacity={0.7}>
          <Text style={s.actionIcon}>💬</Text>
          <Text style={s.actionTxt}>{item.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
          <Text style={s.actionTxt}>Share</Text>
        </TouchableOpacity>
        <SaveButton s={s} C={C} />
      </View>
    </TouchableOpacity>
  );
}

const RADII = [
  { label: '5 mi',   value: 5   },
  { label: '10 mi',  value: 10  },
  { label: '25 mi',  value: 25  },
  { label: '50 mi',  value: 50  },
  { label: '100 mi', value: 100 },
];


function LocationSheet({ visible, current, currentRadius, onSelect, onClose, C, s }) {
  const [query,        setQuery]        = useState('');
  const [pickedCity,   setPickedCity]   = useState(null);
  const [pickedRadius, setPickedRadius] = useState(currentRadius || 25);
  const [showList,     setShowList]     = useState(false);
  const [zoomLevel,    setZoomLevel]    = useState(1);
  const mapRef = useRef(null);

  const filtered = query.trim().length > 0
    ? SUGGESTED_CITIES.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : SUGGESTED_CITIES;

  const displayCity  = pickedCity || SUGGESTED_CITIES.find(c => c.name === current) || SUGGESTED_CITIES[0];
  const radiusMeters = displayCity ? pickedRadius * 1609.34 : 40000;
  const mapDelta     = (pickedRadius / 69) * 2.2 / zoomLevel;

  function zoomIn() {
    const next = Math.min(zoomLevel * 2, 16);
    setZoomLevel(next);
    if (mapRef.current && displayCity) {
      mapRef.current.animateToRegion({
        latitude: displayCity.lat, longitude: displayCity.lng,
        latitudeDelta: mapDelta / 2, longitudeDelta: mapDelta / 2,
      }, 300);
    }
  }

  function zoomOut() {
    const next = Math.max(zoomLevel / 2, 0.125);
    setZoomLevel(next);
    if (mapRef.current && displayCity) {
      mapRef.current.animateToRegion({
        latitude: displayCity.lat, longitude: displayCity.lng,
        latitudeDelta: mapDelta * 2, longitudeDelta: mapDelta * 2,
      }, 300);
    }
  }

  function handleConfirm() {
    onSelect(displayCity.name, pickedRadius);
    onClose();
    setQuery('');
    setPickedCity(null);
    setShowList(false);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.sheetOverlay} activeOpacity={1} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>Set Your Location</Text>

        {/* Search bar */}
        <View style={s.sheetSearch}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            style={s.sheetInput}
            placeholder="Search city…"
            placeholderTextColor={C.c35}
            value={query}
            onChangeText={t => { setQuery(t); setShowList(true); }}
            onFocus={() => setShowList(true)}
          />
          {query.length > 0
            ? <TouchableOpacity onPress={() => { setQuery(''); setShowList(false); }}>
                <Text style={{ fontSize: 14, color: C.c35 }}>✕</Text>
              </TouchableOpacity>
            : <View style={s.sheetCurrentPill}>
                <Text style={s.sheetCurrentTxt}>{displayCity.name.split(',')[0]}</Text>
              </View>
          }
        </View>

        {/* City dropdown */}
        {showList && (
          <View style={s.cityDropdown}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
              {filtered.map(city => {
                const active = city.name === displayCity.name;
                return (
                  <TouchableOpacity
                    key={city.name}
                    style={[s.sheetCity, active && s.sheetCityActive]}
                    onPress={() => { setPickedCity(city); setQuery(''); setShowList(false); }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 14 }}>📍</Text>
                    <Text style={[s.sheetCityTxt, active && { color: C.vivid, fontWeight: '700' }]}>{city.name}</Text>
                    {active && <Text style={{ fontSize: 12, color: C.vivid, marginLeft: 'auto' }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Map with circle */}
        {!showList && displayCity && (
          <View style={s.mapWrap}>
            <MapView
              ref={mapRef}
              style={s.map}
              region={{
                latitude:  displayCity.lat,
                longitude: displayCity.lng,
                latitudeDelta:  mapDelta,
                longitudeDelta: mapDelta,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Circle
                center={{ latitude: displayCity.lat, longitude: displayCity.lng }}
                radius={radiusMeters}
                strokeColor="rgba(232,54,74,0.8)"
                strokeWidth={2}
                fillColor="rgba(232,54,74,0.12)"
              />
            </MapView>
            <View style={s.mapPin}>
              <Text style={{ fontSize: 20 }}>📍</Text>
            </View>
            <View style={s.mapBadge}>
              <Text style={s.mapBadgeTxt}>{pickedRadius} mi radius</Text>
            </View>
            {/* Zoom controls */}
            <View style={s.zoomControls}>
              <TouchableOpacity style={s.zoomBtn} onPress={zoomIn} activeOpacity={0.8}>
                <Text style={s.zoomTxt}>+</Text>
              </TouchableOpacity>
              <View style={s.zoomDivider} />
              <TouchableOpacity style={s.zoomBtn} onPress={zoomOut} activeOpacity={0.8}>
                <Text style={s.zoomTxt}>−</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Radius pills */}
        {!showList && (
          <View style={s.radiusPills}>
            {RADII.map(r => {
              const active = pickedRadius === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  style={[s.radiusPill, active && s.radiusPillActive]}
                  onPress={() => setPickedRadius(r.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.radiusPillTxt, active && s.radiusPillTxtActive]}>{r.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Confirm */}
        {!showList && (
          <TouchableOpacity style={s.radiusConfirm} onPress={handleConfirm} activeOpacity={0.85}>
            <Text style={s.radiusConfirmTxt}>Apply — {displayCity.name.split(',')[0]}, {pickedRadius} mi</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

export default function HomeScreen({ navigation }) {
  const { colors: C, isDark } = useTheme();
  const { user, updateUser } = useUser();
  const s = useMemo(() => getStyles(C), [C]);

  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [radius, setRadius] = useState(25);

  const country = user.homeCountry; // { flag, name }

  const SCOPES = [
    { key: 'my',  label: `${country.flag} Mine` },
    { key: 'all', label: '🌍 All' },
  ];

  const [activeScope, setActiveScope] = useState('my');

  const filteredFeed = useMemo(() => {
    if (activeScope === 'my') return FEED_DATA.filter(i => i.scope === 'bd_nearby' || i.scope === 'bd_usa' || i.scope === 'bd_all');
    return FEED_DATA;
  }, [activeScope]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <LocationSheet
        visible={locationSheetOpen}
        current={user.livesIn || 'Queens, NY'}
        currentRadius={radius}
        onSelect={(city, r) => { updateUser({ livesIn: city }); setRadius(r); }}
        onClose={() => setLocationSheetOpen(false)}
        C={C} s={s}
      />
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <View style={s.header}>
        {/* Left: avatar + name/location */}
        <View style={s.av}>
          <Text style={{ fontSize: 20 }}>🧑‍💻</Text>
          <View style={s.avOnline} />
        </View>
        <TouchableOpacity onPress={() => setLocationSheetOpen(true)} activeOpacity={0.7} style={{ marginRight: 8 }}>
          <Text style={s.uname}>{user.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 }}>
            <Text style={s.locationChipTxt}>📍 {(user.livesIn || 'Set location').split(',')[0]} · {radius} mi</Text>
            <Text style={s.locationChevron}>▾</Text>
          </View>
        </TouchableOpacity>

        {/* Right: filter pills + notif */}
        <View style={s.headerRight}>
          {SCOPES.map(sc => {
            const isActive = sc.key === activeScope;
            return (
              <TouchableOpacity
                key={sc.key}
                style={[s.scopeTab, isActive && s.scopeTabActive]}
                onPress={() => setActiveScope(sc.key)}
                activeOpacity={0.8}
              >
                <Text style={[s.scopeTabTxt, isActive && s.scopeTabTxtActive]}>{sc.label}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={s.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <Text style={{ fontSize: 17 }}>🔔</Text>
            <View style={s.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>

        {/* ── NEARBY RESOURCES ────────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>📍 Near {(user.livesIn || 'You').split(',')[0]}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 8, paddingBottom: 4 }}>
          {NEARBY_RESOURCES.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[s.resourceCard, { borderColor: r.color + '44' }]}
              onPress={() => navigation.navigate(r.route)}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <View style={[s.resourceIconWrap, { backgroundColor: r.bg }]}>
                  <Text style={{ fontSize: 18 }}>{r.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.resourceTitle} numberOfLines={1}>{r.category}</Text>
                  <Text style={[s.resourceBadgeTxt, { color: r.color }]}>{r.count} near you</Text>
                </View>
              </View>
              {r.items.slice(0, 1).map((item, i) => (
                <Text key={i} style={s.resourceItem} numberOfLines={1}>· {item}</Text>
              ))}
              <Text style={[s.resourceSeeAll, { color: r.color }]}>See all →</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>


        {/* ── FEED ───────────────────────────────────────────────── */}
        <View style={s.feedList}>
          {filteredFeed.length === 0 && (
            <View style={s.emptyState}>
              <Text style={{ fontSize: 36 }}>📭</Text>
              <Text style={s.emptyTitle}>Nothing here yet</Text>
              <Text style={s.emptySubtitle}>Be the first to post in this scope!</Text>
            </View>
          )}
          {filteredFeed.map(item => (
            <FeedCard key={item.id} item={item} navigation={navigation} C={C} s={s} />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // Header
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg, gap: 8 },
  headerRight:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  av:             { width: 36, height: 36, borderRadius: 12, backgroundColor: C.vivid, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(232,54,74,0.3)' },
  avOnline:       { position: 'absolute', bottom: -2, right: -2, width: 9, height: 9, backgroundColor: C.green, borderRadius: 5, borderWidth: 2, borderColor: C.bg },
  uname:          { fontSize: 13, fontWeight: '700', color: C.cream },
  locationChipTxt:{ fontSize: 10, color: C.c35 },
  locationChevron:{ fontSize: 9, color: C.c35 },
  aiBtn:          { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: C.vividD, borderWidth: 1, borderColor: C.vivid + '55', borderRadius: 20 },
  aiBtnTxt:       { fontSize: 10, fontWeight: '800', color: C.vivid },
  notifBtn:       { width: 34, height: 34, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  notifDot:       { position: 'absolute', top: 6, right: 6, width: 7, height: 7, backgroundColor: C.vivid, borderRadius: 4, borderWidth: 2, borderColor: C.bg },

  // Compose bar
  composeBar:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 14, marginTop: 8, marginBottom: 2, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  composeAv:      { width: 32, height: 32, borderRadius: 10, backgroundColor: C.vividD, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  composeTxt:     { flex: 1, fontSize: 13, color: C.c35 },
  composeDivider: { width: 1, height: 20, backgroundColor: C.border },

  // Section headers
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, marginTop: 16, marginBottom: 10 },
  sectionTitle:    { fontSize: 13, fontWeight: '800', color: C.cream },
  sectionSub:      { fontSize: 10, color: C.c35, marginTop: 1 },
  sectionLink:     { fontSize: 11, fontWeight: '700', color: C.vivid },

  // Nearby resources
  resourceCard:      { backgroundColor: C.card, borderWidth: 1, borderRadius: 18, padding: 14, width: 190, gap: 6 },
  resourceIconWrap:  { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  resourceBadge:     { alignSelf: 'flex-start', borderRadius: 50, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1 },
  resourceBadgeTxt:  { fontSize: 10, fontWeight: '800' },
  resourceTitle:     { fontSize: 13, fontWeight: '800', color: C.cream, lineHeight: 18 },
  resourceItem:      { fontSize: 11, color: C.c35, lineHeight: 16 },
  resourceSeeAll:    { fontSize: 11, fontWeight: '700', marginTop: 2 },

  scopeTab:          { alignItems: 'center', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  scopeTabActive:    { backgroundColor: C.vividD, borderColor: C.vivid + '66' },
  scopeTabTxt:       { fontSize: 11, fontWeight: '600', color: C.c35 },
  scopeTabTxtActive: { color: C.vivid, fontWeight: '700' },

  // Feed
  feedList:       { gap: 1, marginTop: 8 },
  feedCard:       { backgroundColor: C.card, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border, paddingBottom: 4 },
  feedHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  feedAvatar:     { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  feedName:       { fontSize: 14, fontWeight: '700', color: C.cream },
  feedMeta:       { fontSize: 11, color: C.c35 },
  tagPill:        { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 50, flexShrink: 0 },
  tagTxt:         { fontSize: 10, fontWeight: '700' },
  feedBody:       { fontSize: 14, color: C.c60, lineHeight: 21, paddingHorizontal: 14, marginBottom: 12 },
  feedImage:      { marginHorizontal: 14, marginBottom: 12, borderRadius: 16, height: 160, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, overflow: 'hidden' },
  feedImageLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  feedImageSub:   { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 },
  feedActions:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4, borderTopWidth: 1, borderTopColor: C.border },
  actionBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8 },
  actionIcon:     { fontSize: 16 },
  actionTxt:      { fontSize: 13, color: C.c35, fontWeight: '600' },

  // Location sheet
  sheetOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:            { backgroundColor: C.nav, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, borderTopWidth: 1, borderColor: C.border },
  sheetHandle:      { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:       { fontSize: 18, fontWeight: '800', color: C.cream, marginBottom: 4 },
  sheetSub:         { fontSize: 12, color: C.c35, marginBottom: 16 },
  sheetSearch:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14 },
  sheetInput:       { flex: 1, fontSize: 14, color: C.cream },
  sheetCurrentRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sheetCurrentLabel:{ fontSize: 11, fontWeight: '700', color: C.c35, letterSpacing: 1 },
  sheetCurrentPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.vividD, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.vivid + '44' },
  sheetCurrentTxt:  { fontSize: 12, color: C.vivid, fontWeight: '700' },
  sheetCity:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.border },
  sheetCityActive:  { backgroundColor: C.vividD + '55', marginHorizontal: -4, paddingHorizontal: 8, borderRadius: 10, borderBottomWidth: 0 },
  sheetCityTxt:     { fontSize: 14, color: C.c60, flex: 1 },

  // Map
  mapWrap:          { borderRadius: 16, overflow: 'hidden', height: 200, marginBottom: 12, position: 'relative' },
  map:              { width: '100%', height: '100%' },
  mapPin:           { position: 'absolute', top: '50%', left: '50%', marginLeft: -12, marginTop: -24 },
  mapBadge:         { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4 },
  mapBadgeTxt:      { fontSize: 11, fontWeight: '700', color: '#fff' },
  zoomControls:     { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 10, overflow: 'hidden' },
  zoomBtn:          { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  zoomTxt:          { fontSize: 22, fontWeight: '300', color: '#fff', lineHeight: 26 },
  zoomDivider:      { height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  cityDropdown:     { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },

  // Radius
  radiusPills:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  radiusPill:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  radiusPillActive: { backgroundColor: C.vividD, borderColor: C.vivid + '66' },
  radiusPillTxt:    { fontSize: 12, fontWeight: '600', color: C.c35 },
  radiusPillTxtActive: { color: C.vivid, fontWeight: '700' },
  radiusConfirm:    { backgroundColor: C.vivid, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  radiusConfirmTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Empty state
  emptyState:    { alignItems: 'center', paddingVertical: 50, gap: 8 },
  emptyTitle:    { fontSize: 15, fontWeight: '700', color: C.cream },
  emptySubtitle: { fontSize: 13, color: C.c35 },
});
