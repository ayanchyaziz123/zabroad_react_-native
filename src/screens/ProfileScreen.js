import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, Alert, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../context/UserContext';
import { useAuthStore } from '../store/authStore';

const COUNTRIES = [
  { flag: '🇧🇩', name: 'Bangladesh' }, { flag: '🇮🇳', name: 'India' },
  { flag: '🇵🇰', name: 'Pakistan' },   { flag: '🇳🇬', name: 'Nigeria' },
  { flag: '🇲🇽', name: 'Mexico' },     { flag: '🇨🇳', name: 'China' },
  { flag: '🇵🇭', name: 'Philippines' },{ flag: '🇧🇷', name: 'Brazil' },
  { flag: '🇪🇹', name: 'Ethiopia' },   { flag: '🇻🇳', name: 'Vietnam' },
  { flag: '🇬🇭', name: 'Ghana' },      { flag: '🇰🇷', name: 'South Korea' },
  { flag: '🇨🇴', name: 'Colombia' },   { flag: '🇪🇬', name: 'Egypt' },
  { flag: '🇹🇷', name: 'Turkey' },     { flag: '🇮🇩', name: 'Indonesia' },
  { flag: '🇳🇵', name: 'Nepal' },      { flag: '🇱🇰', name: 'Sri Lanka' },
  { flag: '🌍', name: 'Other' },
];

const SETTINGS_ITEMS = [
  { icon: 'notifications-outline', label: 'Notifications',  sub: 'Manage alerts',           route: 'Notifications' },
  { icon: 'lock-closed-outline',   label: 'Privacy',        sub: 'Who can see your profile', route: 'Settings'      },
  { icon: 'moon-outline',          label: 'Appearance',     sub: 'Dark / light mode',        route: 'Settings'      },
  { icon: 'help-circle-outline',   label: 'Help & Support', sub: 'FAQs and contact',         route: null            },
];

function formatTime(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Mini post card ────────────────────────────────────────────────────────────
function PostCard({ post, navigation, C, s }) {
  const [liked, setLiked] = useState(post.is_liked || false);
  const [count, setCount] = useState(post.likes_count || 0);
  const scale = useRef(new Animated.Value(1)).current;

  function onLike() {
    setLiked(p => !p);
    setCount(c => liked ? c - 1 : c + 1);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, speed: 60, bounciness: 20 }),
      Animated.spring(scale, { toValue: 1,   useNativeDriver: true, speed: 30 }),
    ]).start();
  }

  return (
    <TouchableOpacity
      style={s.postCard}
      onPress={() => navigation.navigate('PostDetail', { post })}
      activeOpacity={0.92}
    >
      <Text style={s.postBody} numberOfLines={3}>{post.body}</Text>
      {post.topics_list?.length > 0 && (
        <View style={s.postTopics}>
          {post.topics_list.slice(0, 3).map(t => (
            <View key={t} style={[s.postTopicChip, { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]}>
              <Text style={[s.postTopicTxt, { color: C.vivid }]}>#{t}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={s.postFooter}>
        <TouchableOpacity style={s.postStat} onPress={onLike} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={14} color={liked ? '#FF3B5C' : C.c35} />
          </Animated.View>
          <Text style={[s.postStatTxt, liked && { color: '#FF3B5C' }]}>{count}</Text>
        </TouchableOpacity>
        <View style={s.postStat}>
          <Ionicons name="chatbubble-outline" size={13} color={C.c35} />
          <Text style={s.postStatTxt}>{post.comments_count || 0}</Text>
        </View>
        <Text style={s.postTime}>{formatTime(post.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { colors: C } = useTheme();
  const { user, updateUser } = useUser();
  const { user: authUser, api, logout } = useAuthStore();
  const s = useMemo(() => getStyles(C), [C]);

  const [activeTab,     setActiveTab]     = useState('Posts');
  const [countryModal,  setCountryModal]  = useState(false);
  const [editModal,     setEditModal]     = useState(false);
  const [posts,         setPosts]         = useState([]);
  const [loadingPosts,  setLoadingPosts]  = useState(true);
  const [saving,        setSaving]        = useState(false);

  const nameRef   = useRef('');
  const handleRef = useRef('');
  const bioRef    = useRef('');

  const country = user.homeCountry || { flag: '🇧🇩', name: 'Bangladesh' };

  // ── Fetch user's posts ────────────────────────────────────────────────────
  const fetchMyPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const data = await api('/posts/');
      const all  = Array.isArray(data) ? data : (data.results || []);
      // filter to only current user's posts
      const mine = all.filter(p =>
        p.author_handle === (authUser?.profile?.handle || user.handle)
      );
      setPosts(mine);
    } catch {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [api, authUser, user.handle]);

  useEffect(() => {
    if (activeTab === 'Posts') fetchMyPosts();
  }, [activeTab, fetchMyPosts]);

  // ── Save profile ──────────────────────────────────────────────────────────
  async function handleSaveProfile() {
    const newName = nameRef.current.trim();
    if (!newName) { Alert.alert('Name required'); return; }
    setSaving(true);
    try {
      updateUser({
        name:    newName,
        handle:  handleRef.current.trim() || user.handle,
      });
      setEditModal(false);
    } finally {
      setSaving(false);
    }
  }

  // ── Change country ────────────────────────────────────────────────────────
  function handleCountrySelect(c) {
    setCountryModal(false);
    Alert.alert(
      'Change Community?',
      `Switch to the ${c.flag} ${c.name} community feed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Change', onPress: () => updateUser({ homeCountry: c }) },
      ]
    );
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await logout();
        navigation.replace('Welcome');
      }},
    ]);
  }

  const displayName   = authUser?.name   || user.name   || 'User';
  const displayHandle = authUser?.profile?.handle || user.handle || '';
  const displayAvatar = authUser?.profile?.avatar_emoji || '🧑‍💻';
  const displayCity   = authUser?.profile?.lives_in || user.livesIn || '';
  const visaStatus    = authUser?.profile?.visa_status || '';

  const TABS = [
    { key: 'Posts',    icon: 'grid-outline' },
    { key: 'Saved',    icon: 'bookmark-outline' },
    { key: 'Settings', icon: 'settings-outline' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── Cover + avatar ─────────────────────────────────── */}
        <View style={s.coverWrap}>
          <View style={s.cover} />
          <View style={s.coverOverlay} />
          {/* Settings shortcut */}
          <TouchableOpacity style={s.coverSettingsBtn} onPress={() => navigation.navigate('Settings')} activeOpacity={0.8}>
            <Ionicons name="settings-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View style={s.avatarWrap}>
          <View style={s.avatarRing}>
            <View style={s.avatarInner}>
              <Text style={{ fontSize: 36 }}>{displayAvatar}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.editAvatarBtn} activeOpacity={0.85}>
            <Ionicons name="camera" size={14} color="white" />
          </TouchableOpacity>
        </View>

        {/* ── Name / handle / meta ───────────────────────────── */}
        <View style={s.infoBlock}>
          <Text style={s.displayName}>{displayName}</Text>
          {displayHandle ? <Text style={s.displayHandle}>{displayHandle}</Text> : null}

          <View style={s.metaRow}>
            {displayCity ? (
              <View style={s.metaChip}>
                <Ionicons name="location-outline" size={12} color={C.c35} />
                <Text style={s.metaChipTxt}>{displayCity.split(',')[0]}</Text>
              </View>
            ) : null}
            <View style={s.metaChip}>
              <Text style={{ fontSize: 13 }}>{country.flag}</Text>
              <Text style={s.metaChipTxt}>{country.name}</Text>
            </View>
            {visaStatus ? (
              <View style={[s.metaChip, { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]}>
                <Ionicons name="card-outline" size={12} color={C.vivid} />
                <Text style={[s.metaChipTxt, { color: C.vivid }]}>{visaStatus}</Text>
              </View>
            ) : null}
          </View>

          {/* Action buttons */}
          <View style={s.actionRow}>
            <TouchableOpacity style={s.editBtn} onPress={() => setEditModal(true)} activeOpacity={0.85}>
              <Ionicons name="create-outline" size={15} color={C.cream} />
              <Text style={s.editBtnTxt}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.countryBtn} onPress={() => setCountryModal(true)} activeOpacity={0.85}>
              <Text style={{ fontSize: 16 }}>{country.flag}</Text>
              <Ionicons name="chevron-down" size={14} color={C.c35} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats ──────────────────────────────────────────── */}
        <View style={s.statsRow}>
          {[
            { num: posts.length, label: 'Posts' },
            { num: '—',          label: 'Reputation' },
            { num: '—',          label: 'Saved' },
          ].map((st, i) => (
            <View key={i} style={[s.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: C.border }]}>
              <Text style={s.statNum}>{st.num}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Tabs ───────────────────────────────────────────── */}
        <View style={s.tabBar}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[s.tabBtn, active && s.tabBtnActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Ionicons name={active ? tab.icon.replace('-outline', '') : tab.icon} size={20} color={active ? C.vivid : C.c35} />
                <Text style={[s.tabTxt, active && { color: C.vivid }]}>{tab.key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Posts tab ──────────────────────────────────────── */}
        {activeTab === 'Posts' && (
          <View style={s.section}>
            {loadingPosts ? (
              <View style={s.centerState}>
                <ActivityIndicator size="small" color={C.vivid} />
              </View>
            ) : posts.length === 0 ? (
              <View style={s.centerState}>
                <Ionicons name="document-text-outline" size={36} color={C.c35} />
                <Text style={s.emptyTxt}>No posts yet</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('CreatePost')} activeOpacity={0.85}>
                  <Ionicons name="add" size={16} color="white" />
                  <Text style={s.emptyBtnTxt}>Create a post</Text>
                </TouchableOpacity>
              </View>
            ) : (
              posts.map(post => (
                <PostCard key={post.id} post={post} navigation={navigation} C={C} s={s} />
              ))
            )}
          </View>
        )}

        {/* ── Saved tab ──────────────────────────────────────── */}
        {activeTab === 'Saved' && (
          <View style={s.centerState}>
            <Ionicons name="bookmark-outline" size={36} color={C.c35} />
            <Text style={s.emptyTxt}>Nothing saved yet</Text>
            <Text style={s.emptySub}>Tap 🔖 on any post to save it</Text>
          </View>
        )}

        {/* ── Settings tab ───────────────────────────────────── */}
        {activeTab === 'Settings' && (
          <View style={s.section}>
            <View style={s.menuCard}>
              {SETTINGS_ITEMS.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[s.menuRow, i < SETTINGS_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}
                  onPress={() => item.route && navigation.navigate(item.route)}
                  activeOpacity={0.75}
                >
                  <View style={[s.menuIconWrap, { backgroundColor: C.card2 }]}>
                    <Ionicons name={item.icon} size={18} color={C.c35} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.menuLabel}>{item.label}</Text>
                    <Text style={s.menuSub}>{item.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color={C.c35} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
              <Ionicons name="log-out-outline" size={18} color={C.vivid} />
              <Text style={s.logoutTxt}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* ── Edit Profile Modal ────────────────────────────────── */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[{ flex: 1 }, { backgroundColor: C.bg }]}>
          <View style={[s.modalHeader, { borderBottomColor: C.border }]}>
            <TouchableOpacity onPress={() => setEditModal(false)} style={s.modalHeaderBtn}>
              <Ionicons name="close" size={22} color={C.c35} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Edit Profile</Text>
            <TouchableOpacity
              style={[s.modalSaveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="white" />
                : <Text style={s.modalSaveTxt}>Save</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
            {/* Avatar row */}
            <View style={s.editAvatarRow}>
              <View style={s.editAvatarPreview}>
                <Text style={{ fontSize: 40 }}>{displayAvatar}</Text>
              </View>
              <TouchableOpacity style={s.changeAvatarBtn} activeOpacity={0.85}>
                <Text style={[s.changeAvatarTxt, { color: C.vivid }]}>Change avatar emoji</Text>
              </TouchableOpacity>
            </View>

            {[
              { label: 'Full Name',  placeholder: 'Your full name',    default: displayName,   ref: nameRef,   capitalize: 'words' },
              { label: 'Handle',     placeholder: '@username',          default: displayHandle, ref: handleRef, capitalize: 'none'  },
            ].map((f, i) => (
              <View key={i} style={s.fieldWrap}>
                <Text style={s.fieldLabel}>{f.label}</Text>
                <View style={[s.fieldBox, { backgroundColor: C.card, borderColor: C.border }]}>
                  <TextInput
                    style={[s.fieldInput, { color: C.cream }]}
                    defaultValue={f.default}
                    onChangeText={v => { f.ref.current = v; }}
                    placeholder={f.placeholder}
                    placeholderTextColor={C.c35}
                    autoCapitalize={f.capitalize}
                    autoCorrect={false}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Country Picker Modal ──────────────────────────────── */}
      <Modal visible={countryModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCountryModal(false)}>
        <View style={[{ flex: 1 }, { backgroundColor: C.bg }]}>
          <View style={[s.modalHeader, { borderBottomColor: C.border }]}>
            <View style={s.modalHeaderBtn} />
            <Text style={s.modalTitle}>Your Community</Text>
            <TouchableOpacity style={s.modalHeaderBtn} onPress={() => setCountryModal(false)}>
              <Ionicons name="close" size={22} color={C.c35} />
            </TouchableOpacity>
          </View>

          <View style={[s.countryWarning, { backgroundColor: C.vividD, borderColor: C.vivid + '33' }]}>
            <Ionicons name="information-circle-outline" size={16} color={C.vivid} />
            <Text style={[s.countryWarningTxt, { color: C.vivid }]}>
              This changes which community posts appear on your feed
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}>
            {COUNTRIES.map(c => {
              const active = c.name === country.name;
              return (
                <TouchableOpacity
                  key={c.name}
                  style={[s.countryOption, active && s.countryOptionActive]}
                  onPress={() => handleCountrySelect(c)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 26 }}>{c.flag}</Text>
                  <Text style={[s.countryOptionName, active && { color: C.vivid }]}>{c.name}</Text>
                  {active && <Ionicons name="checkmark-circle" size={20} color={C.vivid} />}
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
  safe: { flex: 1, backgroundColor: C.bg },

  // Cover
  coverWrap:       { height: 130, position: 'relative' },
  cover:           { ...StyleSheet.absoluteFillObject, backgroundColor: C.vividD },
  coverOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  coverSettingsBtn:{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },

  // Avatar
  avatarWrap:   { alignItems: 'center', marginTop: -44, zIndex: 5, position: 'relative' },
  avatarRing:   { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: C.vivid, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  avatarInner:  { width: 80, height: 80, borderRadius: 40, backgroundColor: C.vividD, alignItems: 'center', justifyContent: 'center' },
  editAvatarBtn:{ position: 'absolute', bottom: 0, right: '33%', width: 26, height: 26, borderRadius: 13, backgroundColor: C.vivid, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg },

  // Info
  infoBlock:   { alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, gap: 8 },
  displayName: { fontSize: 22, fontWeight: '800', color: C.cream, letterSpacing: -0.5 },
  displayHandle:{ fontSize: 13, color: C.c35 },
  metaRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  metaChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  metaChipTxt: { fontSize: 12, fontWeight: '600', color: C.c35 },
  actionRow:   { flexDirection: 'row', gap: 8, marginTop: 2 },
  editBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, paddingVertical: 10 },
  editBtnTxt:  { fontSize: 13, fontWeight: '700', color: C.cream },
  countryBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },

  // Stats
  statsRow:    { flexDirection: 'row', marginHorizontal: 20, marginTop: 18, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  statItem:    { flex: 1, paddingVertical: 14, alignItems: 'center', gap: 2 },
  statNum:     { fontSize: 18, fontWeight: '800', color: C.cream },
  statLabel:   { fontSize: 10, fontWeight: '600', color: C.c35, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Tabs
  tabBar:      { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  tabBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive:{ borderBottomColor: C.vivid },
  tabTxt:      { fontSize: 12, fontWeight: '700', color: C.c35 },

  // Section / empty
  section:     { paddingHorizontal: 16, marginTop: 14 },
  centerState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTxt:    { fontSize: 15, fontWeight: '700', color: C.cream },
  emptySub:    { fontSize: 13, color: C.c35 },
  emptyBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: C.vivid },
  emptyBtnTxt: { fontSize: 13, fontWeight: '700', color: 'white' },

  // Post cards
  postCard:     { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  postBody:     { fontSize: 14, color: C.c60, lineHeight: 21, marginBottom: 10 },
  postTopics:   { flexDirection: 'row', gap: 6, marginBottom: 10 },
  postTopicChip:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, borderWidth: 1 },
  postTopicTxt: { fontSize: 10, fontWeight: '700' },
  postFooter:   { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  postStat:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postStatTxt:  { fontSize: 12, fontWeight: '600', color: C.c35 },
  postTime:     { marginLeft: 'auto', fontSize: 11, color: C.c35 },

  // Settings menu
  menuCard:    { borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden', backgroundColor: C.card },
  menuRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  menuIconWrap:{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel:   { fontSize: 14, fontWeight: '600', color: C.cream, marginBottom: 2 },
  menuSub:     { fontSize: 11, color: C.c35 },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, borderWidth: 1, borderColor: C.vivid + '44', borderRadius: 14, paddingVertical: 14, backgroundColor: C.vividD },
  logoutTxt:   { fontSize: 14, fontWeight: '700', color: C.vivid },

  // Edit modal
  modalHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  modalHeaderBtn: { width: 36, alignItems: 'center' },
  modalTitle:     { fontSize: 17, fontWeight: '800', color: C.cream },
  modalSaveBtn:   { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 50, backgroundColor: C.vivid, minWidth: 60, alignItems: 'center' },
  modalSaveTxt:   { fontSize: 13, fontWeight: '700', color: 'white' },
  editAvatarRow:  { flexDirection: 'row', alignItems: 'center', gap: 16, paddingBottom: 4 },
  editAvatarPreview: { width: 70, height: 70, borderRadius: 35, backgroundColor: C.vividD, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.vivid },
  changeAvatarBtn:{ flex: 1 },
  changeAvatarTxt:{ fontSize: 14, fontWeight: '700' },
  fieldWrap:      { gap: 6 },
  fieldLabel:     { fontSize: 11, fontWeight: '700', color: C.c35, letterSpacing: 0.8, textTransform: 'uppercase' },
  fieldBox:       { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  fieldInput:     { fontSize: 15 },

  // Country modal
  countryWarning:    { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, padding: 12, borderRadius: 12, borderWidth: 1 },
  countryWarningTxt: { flex: 1, fontSize: 12, fontWeight: '600' },
  countryOption:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  countryOptionActive:{ backgroundColor: C.vividD, borderColor: C.vivid + '66' },
  countryOptionName: { flex: 1, fontSize: 15, fontWeight: '600', color: C.cream },
});
