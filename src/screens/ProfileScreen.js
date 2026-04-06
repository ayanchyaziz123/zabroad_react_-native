import React, { useMemo, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, Alert, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import { useAuthStore } from '../store/authStore';

const COUNTRIES = [
  { flag: '🇧🇩', name: 'Bangladesh' },
  { flag: '🇮🇳', name: 'India' },
  { flag: '🇵🇰', name: 'Pakistan' },
  { flag: '🇳🇬', name: 'Nigeria' },
  { flag: '🇲🇽', name: 'Mexico' },
  { flag: '🇨🇳', name: 'China' },
  { flag: '🇵🇭', name: 'Philippines' },
  { flag: '🇧🇷', name: 'Brazil' },
  { flag: '🇪🇹', name: 'Ethiopia' },
  { flag: '🇻🇳', name: 'Vietnam' },
  { flag: '🇬🇭', name: 'Ghana' },
  { flag: '🇰🇷', name: 'South Korea' },
  { flag: '🇨🇴', name: 'Colombia' },
  { flag: '🇪🇬', name: 'Egypt' },
  { flag: '🇹🇷', name: 'Turkey' },
  { flag: '🇮🇩', name: 'Indonesia' },
  { flag: '🇳🇵', name: 'Nepal' },
  { flag: '🇱🇰', name: 'Sri Lanka' },
  { flag: '🌍', name: 'Other' },
];

const MY_POSTS = [
  { id: 'mp1', body: 'Best H-1B attorneys in Queens under $2K? Looking for recommendations.', likes: 28,  comments: 11, time: '2d ago'  },
  { id: 'mp2', body: 'How I passed my driving test on the first try coming from Bangladesh.', likes: 74,  comments: 19, time: '5d ago'  },
  { id: 'mp3', body: 'STEM OPT extension approved in 6 weeks! Filed 90 days before expiry.', likes: 142, comments: 34, time: '2w ago'  },
  { id: 'mp4', body: 'Can I open a Chase bank account on OPT? SSN card hasn\'t arrived yet.', likes: 41,  comments: 22, time: '3w ago'  },
];

const SAVED_ITEMS = [
  { id: 's1', icon: '💼', type: 'Job',      title: 'Frontend Engineer – Stripe',         sub: 'Manhattan, NY · H-1B sponsored',  route: 'Jobs',      color: '#3EC878' },
  { id: 's2', icon: '🏠', type: 'Housing',  title: '1BR Jackson Heights – $1,450/mo',    sub: 'Queens, NY · No credit check',    route: 'Housing',   color: '#F5A623' },
  { id: 's3', icon: '📋', type: 'Visa',     title: 'STEM OPT Extension Guide',           sub: 'F-1 students · 24-month',         route: 'Visa',      color: '#E8364A' },
  { id: 's4', icon: '⚖️', type: 'Attorney', title: 'Mehta & Associates Immigration',     sub: 'Manhattan, NY · Free consult',    route: 'Attorney',  color: '#9B72EF' },
  { id: 's5', icon: '🩺', type: 'Doctor',   title: 'Dr. Ayesha Karim – Family Medicine', sub: 'Queens, NY · Accepts Medicaid',   route: 'Healthcare',color: '#5BCFEF' },
];

const ACTIVITY = [
  { id: 'a1', icon: '❤️', text: 'Liked a post by Fatima Rahman', time: '1h ago'  },
  { id: 'a2', icon: '💬', text: 'Commented on "EAD approved after 9 months"', time: '3h ago'  },
  { id: 'a3', icon: '🔖', text: 'Saved Housing listing in Jackson Heights', time: '1d ago'  },
  { id: 'a4', icon: '📝', text: 'Posted "STEM OPT extension approved"', time: '2w ago'  },
  { id: 'a5', icon: '💬', text: 'Replied to a comment on your post', time: '3w ago'  },
];

export default function ProfileScreen({ navigation }) {
  const { colors: C, isDark } = useTheme();
  const { user, updateUser }  = useUser();
  const logout                = useAuthStore(s => s.logout);
  const s = useMemo(() => getStyles(C), [C]);

  const [activeTab,        setActiveTab]        = useState('Posts');
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [editModalOpen,    setEditModalOpen]    = useState(false);

  // Edit profile values in refs — no re-render while typing
  const nameRef    = useRef(user.name    || '');
  const handleRef  = useRef(user.handle  || '');
  const livesInRef = useRef(user.livesIn || '');

  const country = user.homeCountry || { flag: '🇧🇩', name: 'Bangladesh' };

  function handleSaveProfile() {
    const newName = nameRef.current.trim();
    if (!newName) { Alert.alert('Name required'); return; }
    updateUser({
      name:    newName,
      handle:  handleRef.current.trim() || user.handle,
      livesIn: livesInRef.current.trim() || user.livesIn,
    });
    setEditModalOpen(false);
  }

  function handleCountrySelect(c) {
    setCountryModalOpen(false);
    Alert.alert(
      'Change Community?',
      `Switching to ${c.flag} ${c.name} will change your community feed. Posts shown to you will be based on the ${c.name} community. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, change it',
          onPress: () => updateUser({ homeCountry: c }),
        },
      ]
    );
  }

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await logout();
        navigation.replace('Welcome');
      }},
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Cover */}
        <LinearGradient colors={isDark ? ['#1E1535','#120D22'] : ['#DDD6FF','#EEF0FA']} style={s.cover}>
          <Text style={s.coverZ}>Z</Text>
        </LinearGradient>

        {/* Avatar */}
        <View style={s.avWrap}>
          <LinearGradient colors={[C.vivid, '#8B1525']} style={s.av}>
            <Text style={{ fontSize: 34 }}>🧑‍💻</Text>
          </LinearGradient>
        </View>

        {/* Info */}
        <View style={s.info}>
          <Text style={s.name}>{user.name || 'Azizur Rahman'}</Text>
          <Text style={s.handle}>@{user.handle || 'azizur_r'} · {(user.livesIn || 'Queens, NY').split(',')[0]}</Text>

          {/* Origin country row */}
          <TouchableOpacity style={[s.countryRow, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => setCountryModalOpen(true)} activeOpacity={0.8}>
            <Text style={{ fontSize: 20 }}>{country.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.countryLabel, { color: C.c35 }]}>From</Text>
              <Text style={[s.countryName, { color: C.cream }]}>{country.name}</Text>
            </View>
            <Text style={[s.countryChange, { color: C.vivid }]}>Change ›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.editBtn, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => setEditModalOpen(true)}>
            <Text style={[s.editTxt, { color: C.cream }]}>✏️  Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={[s.stats, { backgroundColor: C.card, borderColor: C.border }]}>
          {[{ num: '142', label: 'Posts' }, { num: '4.9★', label: 'Reputation' }, { num: '36', label: 'Saved' }].map((st, i) => (
            <View key={i} style={[s.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: C.border }]}>
              <Text style={[s.statNum, { color: C.cream }]}>{st.num}</Text>
              <Text style={[s.statLabel, { color: C.c35 }]}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={[s.tabBar, { backgroundColor: C.card, borderColor: C.border }]}>
          {['Posts', 'Saved', 'Activity'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tabBtn, activeTab === tab && { borderBottomColor: C.vivid }]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabTxt, { color: activeTab === tab ? C.vivid : C.c35 }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Posts */}
        {activeTab === 'Posts' && (
          <View style={s.section}>
            {MY_POSTS.map(post => (
              <TouchableOpacity key={post.id} style={[s.postCard, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => navigation.navigate('PostDetail', { post })} activeOpacity={0.9}>
                <Text style={[s.postBody, { color: C.c60 }]} numberOfLines={3}>{post.body}</Text>
                <View style={[s.postFooter, { borderTopColor: C.border }]}>
                  <Text style={[s.postStat, { color: C.c35 }]}>🤍 {post.likes}</Text>
                  <Text style={[s.postStat, { color: C.c35 }]}>💬 {post.comments}</Text>
                  <Text style={[s.postStat, { color: C.c35 }]}>{post.time}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Saved */}
        {activeTab === 'Saved' && (
          <View style={s.section}>
            {SAVED_ITEMS.map(item => (
              <TouchableOpacity key={item.id} style={[s.savedCard, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => navigation.navigate(item.route)} activeOpacity={0.85}>
                <View style={[s.savedIcon, { backgroundColor: item.color + '18' }]}>
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.savedTitle, { color: C.cream }]}>{item.title}</Text>
                  <Text style={[s.savedSub, { color: C.c35 }]}>{item.sub}</Text>
                </View>
                <Text style={[s.savedType, { color: item.color }]}>{item.type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Activity */}
        {activeTab === 'Activity' && (
          <View style={s.section}>
            {ACTIVITY.map((a, i) => (
              <View key={a.id} style={[s.activityRow, { borderBottomColor: C.border }, i === ACTIVITY.length - 1 && { borderBottomWidth: 0 }, { backgroundColor: C.card }]}>
                <View style={[s.activityIcon, { backgroundColor: C.card2 }]}>
                  <Text style={{ fontSize: 16 }}>{a.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.activityTxt, { color: C.c60 }]}>{a.text}</Text>
                  <Text style={[s.activityTime, { color: C.c35 }]}>{a.time}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Settings section */}
        <View style={s.section}>
          <Text style={[s.secLabel, { color: C.c35 }]}>Settings</Text>
          <View style={[s.menuCard, { backgroundColor: C.card, borderColor: C.border }]}>
            {[
              { icon: '🔔', label: 'Notifications',    sub: 'Manage alerts and reminders',   onPress: () => navigation.navigate('Notifications') },
              { icon: '🔒', label: 'Privacy',          sub: 'Who can see your profile',       onPress: () => navigation.navigate('Settings') },
              { icon: '🌙', label: 'Appearance',       sub: 'Dark / light mode',              onPress: () => navigation.navigate('Settings') },
              { icon: '❓', label: 'Help & Support',   sub: 'FAQs, contact us',               onPress: () => {} },
            ].map((item, i, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[s.menuRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[s.menuIconWrap, { backgroundColor: C.card2 }]}>
                  <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.menuLabel, { color: C.cream }]}>{item.label}</Text>
                  <Text style={[s.menuSub, { color: C.c35 }]}>{item.sub}</Text>
                </View>
                <Text style={[{ fontSize: 18, color: C.c35 }]}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={[s.logoutBtn, { borderColor: C.border }]} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={[s.logoutTxt, { color: C.vivid }]}>Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Edit Profile modal */}
      <Modal visible={editModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[{ flex: 1 }, { backgroundColor: C.bg }]}>
          <View style={[s.modalHeader, { borderBottomColor: C.border }]}>
            <TouchableOpacity onPress={() => setEditModalOpen(false)}>
              <Text style={{ fontSize: 15, color: C.c35, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[s.modalTitle, { color: C.cream }]}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} style={[{ backgroundColor: C.vivid, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 50 }]}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: 'white' }}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
            {[
              { label: 'Full Name',   defaultValue: user.name    || '', ref: nameRef,    placeholder: 'Your full name',   autoCapitalize: 'words' },
              { label: 'Username',    defaultValue: user.handle  || '', ref: handleRef,  placeholder: '@username',        autoCapitalize: 'none'  },
              { label: 'Lives In',    defaultValue: user.livesIn || '', ref: livesInRef, placeholder: 'e.g. Queens, NY',  autoCapitalize: 'words' },
            ].map((f, i) => (
              <View key={i}>
                <Text style={[s.editFieldLabel, { color: C.c35 }]}>{f.label}</Text>
                <View style={[s.editFieldBox, { backgroundColor: C.card, borderColor: C.border }]}>
                  <TextInput
                    style={[s.editFieldInput, { color: C.cream }]}
                    defaultValue={f.defaultValue}
                    onChangeText={v => { f.ref.current = v; }}
                    placeholder={f.placeholder}
                    placeholderTextColor={C.c35}
                    autoCapitalize={f.autoCapitalize}
                    autoCorrect={false}
                    textContentType="none"
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Country picker modal */}
      <Modal visible={countryModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCountryModalOpen(false)}>
        <View style={[s.modalWrap, { backgroundColor: C.bg }]}>
          <View style={[s.modalHeader, { borderBottomColor: C.border }]}>
            <Text style={[s.modalTitle, { color: C.cream }]}>Change Origin Country</Text>
            <TouchableOpacity onPress={() => setCountryModalOpen(false)}>
              <Text style={[{ fontSize: 14, color: C.c35, fontWeight: '600' }]}>Close</Text>
            </TouchableOpacity>
          </View>
          <Text style={[s.modalWarning, { color: C.gold, backgroundColor: C.goldD }]}>
            ⚠️  Changing your country will update your community feed.
          </Text>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 8 }}>
            {COUNTRIES.map(c => {
              const active = c.name === country.name;
              return (
                <TouchableOpacity
                  key={c.name}
                  style={[s.countryOption, { backgroundColor: active ? C.vividD : C.card, borderColor: active ? C.vivid : C.border }]}
                  onPress={() => handleCountrySelect(c)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 24 }}>{c.flag}</Text>
                  <Text style={[s.countryOptionName, { color: active ? C.vivid : C.cream }]}>{c.name}</Text>
                  {active && <Text style={{ color: C.vivid, fontWeight: '800' }}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  cover:       { height: 110, overflow: 'hidden' },
  coverZ:      { position: 'absolute', fontSize: 120, fontWeight: '900', color: 'rgba(232,54,74,0.06)', bottom: -30, left: -10 },
  avWrap:      { alignItems: 'center', marginTop: -38, zIndex: 5 },
  av:          { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.bg },
  info:        { alignItems: 'center', paddingHorizontal: 22, paddingTop: 12, gap: 10 },
  name:        { fontSize: 22, fontWeight: '800', color: C.cream, letterSpacing: -0.3 },
  handle:      { fontSize: 12, color: C.c35 },
  countryRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, alignSelf: 'stretch' },
  countryLabel:{ fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
  countryName: { fontSize: 14, fontWeight: '700' },
  countryChange:{ fontSize: 13, fontWeight: '600' },
  editBtn:     { alignSelf: 'stretch', borderRadius: 14, borderWidth: 1, paddingVertical: 11, alignItems: 'center' },
  editTxt:     { fontSize: 13, fontWeight: '600' },
  stats:       { flexDirection: 'row', marginHorizontal: 22, marginTop: 16, borderRadius: 18, overflow: 'hidden', borderWidth: 1 },
  statItem:    { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statNum:     { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLabel:   { fontSize: 10, color: C.c35 },
  tabBar:      { flexDirection: 'row', marginHorizontal: 22, marginTop: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  tabBtn:      { flex: 1, paddingVertical: 11, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabTxt:      { fontSize: 13, fontWeight: '600' },
  section:     { paddingHorizontal: 22, marginTop: 16 },
  // Posts
  postCard:    { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  postBody:    { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  postFooter:  { flexDirection: 'row', gap: 16, paddingTop: 10, borderTopWidth: 1 },
  postStat:    { fontSize: 12, fontWeight: '600' },
  // Saved
  savedCard:   { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  savedIcon:   { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  savedTitle:  { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  savedSub:    { fontSize: 11 },
  savedType:   { fontSize: 11, fontWeight: '700' },
  // Activity
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderRadius: 0 },
  activityIcon:{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  activityTxt: { fontSize: 13, lineHeight: 18, marginBottom: 2 },
  activityTime:{ fontSize: 11 },
  // Settings section
  secLabel:    { fontSize: 11, fontWeight: '700', color: C.c35, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  menuCard:    { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  menuRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  menuIconWrap:{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel:   { fontSize: 14, fontWeight: '600', marginBottom: 1 },
  menuSub:     { fontSize: 11 },
  // Sign out
  logoutBtn:   { marginHorizontal: 22, marginTop: 24, borderWidth: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  logoutTxt:   { fontSize: 14, fontWeight: '600' },
  // Edit profile modal
  editFieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, color: C.c35 },
  editFieldBox:   { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  editFieldInput: { fontSize: 15 },
  // Modal
  modalWrap:   { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalTitle:  { fontSize: 17, fontWeight: '800' },
  modalWarning:{ fontSize: 13, lineHeight: 18, marginHorizontal: 20, marginVertical: 12, padding: 12, borderRadius: 12 },
  countryOption:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  countryOptionName: { flex: 1, fontSize: 15, fontWeight: '600' },
});
