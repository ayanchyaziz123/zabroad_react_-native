import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, Alert, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import UserAvatar from '../components/UserAvatar';
import { useTheme } from '../theme/ThemeContext';
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

const VISA_OPTIONS = [
  'OPT', 'CPT', 'H1B', 'H4', 'L1', 'O1', 'GC', 'CITIZEN', 'F1', 'ASYLUM', 'OTHER',
];
const VISA_LABELS = {
  OPT: 'OPT', CPT: 'CPT', H1B: 'H-1B', H4: 'H-4 EAD',
  L1: 'L-1', O1: 'O-1', GC: 'Green Card', CITIZEN: 'Citizen',
  F1: 'F-1', ASYLUM: 'Asylum', OTHER: 'Other',
};

const SETTINGS_ITEMS = [
  { icon: 'notifications-outline', label: 'Notifications',  sub: 'Manage alerts',            route: 'Notifications' },
  { icon: 'lock-closed-outline',   label: 'Privacy',        sub: 'Who can see your profile',  route: 'Settings'      },
  { icon: 'moon-outline',          label: 'Appearance',     sub: 'Dark / light mode',          route: 'Settings'      },
  { icon: 'help-circle-outline',   label: 'Help & Support', sub: 'FAQs and contact us',        route: null            },
];

function formatTime(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Post card ─────────────────────────────────────────────────────────────────
function PostCard({ post, navigation, C, s }) {
  const [liked, setLiked] = useState(post.is_liked || false);
  const [count, setCount] = useState(post.likes_count || 0);
  const { api } = useAuthStore();
  const scale = useRef(new Animated.Value(1)).current;

  async function onLike() {
    const prev = liked;
    const prevCount = count;
    setLiked(!prev);
    setCount(c => prev ? c - 1 : c + 1);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, speed: 60, bounciness: 20 }),
      Animated.spring(scale, { toValue: 1,   useNativeDriver: true, speed: 30 }),
    ]).start();
    try {
      const res = await api(`/posts/${post.id}/like/`, { method: 'POST' });
      setLiked(res.liked);
      setCount(res.likes_count);
    } catch {
      setLiked(prev);
      setCount(prevCount);
    }
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
            <Ionicons name={liked ? 'thumbs-up' : 'thumbs-up-outline'} size={14} color={liked ? '#F4A227' : C.c35} />
          </Animated.View>
          <Text style={[s.postStatTxt, liked && { color: '#F4A227' }]}>{count}</Text>
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { colors: C } = useTheme();
  const { user: authUser, api, logout, updateProfile } = useAuthStore();
  const s = useMemo(() => getStyles(C), [C]);

  // ── Tabs & content state ───────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState('Posts');
  const [posts,        setPosts]        = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [savedPosts,   setSavedPosts]   = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // ── Photo upload state ─────────────────────────────────────────────────────
  const [avatarUri,       setAvatarUri]       = useState(null);
  const [coverUri,        setCoverUri]        = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover,  setUploadingCover]  = useState(false);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [editModal,    setEditModal]    = useState(false);
  const [countryModal, setCountryModal] = useState(false);

  // ── Edit form controlled state ─────────────────────────────────────────────
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName,  setEditLastName]  = useState('');
  const [editHandle,    setEditHandle]    = useState('');
  const [editBio,       setEditBio]       = useState('');
  const [editLivesIn,   setEditLivesIn]   = useState('');
  const [editVisa,      setEditVisa]      = useState('');
  const [saving,        setSaving]        = useState(false);
  const [saveError,     setSaveError]     = useState('');

  // Sync server photo URLs on mount / auth user change
  useEffect(() => {
    if (authUser?.profile?.avatar_url) setAvatarUri(authUser.profile.avatar_url);
    if (authUser?.profile?.cover_url)  setCoverUri(authUser.profile.cover_url);
  }, [authUser?.profile?.avatar_url, authUser?.profile?.cover_url]);

  // Seed edit form when modal opens
  function openEditModal() {
    const nameParts = (authUser?.name || '').split(' ');
    setEditFirstName(nameParts[0] || '');
    setEditLastName(nameParts.slice(1).join(' '));
    setEditHandle((authUser?.profile?.handle || '').replace(/^@/, ''));
    setEditBio(authUser?.profile?.bio || '');
    setEditLivesIn(authUser?.profile?.lives_in || '');
    setEditVisa(authUser?.profile?.visa_status || 'OPT');
    setSaveError('');
    setEditModal(true);
  }

  // ── Fetch own posts (uses author filter on the backend) ────────────────────
  const fetchMyPosts = useCallback(async () => {
    if (!authUser?.id) return;
    setLoadingPosts(true);
    try {
      const data = await api(`/posts/?author=${authUser.id}`);
      setPosts(Array.isArray(data) ? data : (data.results || []));
    } catch {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [api, authUser?.id]);

  const fetchSavedPosts = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const data = await api('/posts/saved/');
      setSavedPosts(Array.isArray(data) ? data : (data.results || []));
    } catch {
      setSavedPosts([]);
    } finally {
      setLoadingSaved(false);
    }
  }, [api]);

  useEffect(() => {
    if (activeTab === 'Posts') fetchMyPosts();
    if (activeTab === 'Saved') fetchSavedPosts();
  }, [activeTab, fetchMyPosts, fetchSavedPosts]);

  // ── Photo pickers ──────────────────────────────────────────────────────────
  async function pickAndUpload(type) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to change your photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [3, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    const ext = uri.split('.').pop().toLowerCase();
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';

    if (type === 'avatar') {
      setAvatarUri(uri);
      setUploadingAvatar(true);
    } else {
      setCoverUri(uri);
      setUploadingCover(true);
    }

    try {
      const fd = new FormData();
      fd.append(type, { uri, name: `${type}.${ext}`, type: mime });
      await api('/auth/me/', { method: 'PATCH', body: fd });
    } catch {
      Alert.alert('Upload failed', 'Could not save your photo. Please try again.');
      if (type === 'avatar') setAvatarUri(authUser?.profile?.avatar_url || null);
      else setCoverUri(authUser?.profile?.cover_url || null);
    } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingCover(false);
    }
  }

  // ── Save profile ───────────────────────────────────────────────────────────
  async function handleSaveProfile() {
    const firstName = editFirstName.trim();
    if (!firstName) { setSaveError('First name is required.'); return; }
    const handle = editHandle.trim().replace(/^@/, '');
    if (!handle) { setSaveError('Handle is required.'); return; }

    setSaving(true);
    setSaveError('');
    try {
      await updateProfile({
        first_name:  firstName,
        last_name:   editLastName.trim(),
        handle,
        bio:         editBio.trim(),
        lives_in:    editLivesIn.trim(),
        visa_status: editVisa,
      });
      setEditModal(false);
    } catch (e) {
      setSaveError(e.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  // ── Country / community change ─────────────────────────────────────────────
  async function handleCountrySelect(c) {
    setCountryModal(false);
    try {
      await updateProfile({ home_country: c.name, country_flag: c.flag });
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not update community.');
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await logout();
        navigation.replace('Welcome');
      }},
    ]);
  }

  // ── Derived display values (single source of truth: authStore) ─────────────
  const displayName   = authUser?.name || '';
  const displayHandle = authUser?.profile?.handle ? `@${authUser.profile.handle}` : '';
  const displayEmoji  = authUser?.profile?.avatar_emoji || '🧑‍💻';
  const displayCity   = authUser?.profile?.lives_in || '';
  const displayBio    = authUser?.profile?.bio || '';
  const countryFlag   = authUser?.profile?.country_flag || '🌍';
  const homeCountry   = authUser?.profile?.home_country || '';
  const visaStatus    = authUser?.profile?.visa_status || '';

  const TABS = [
    { key: 'Posts',    icon: 'grid-outline' },
    { key: 'Saved',    icon: 'bookmark-outline' },
    { key: 'Settings', icon: 'settings-outline' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── Cover ──────────────────────────────────────────── */}
        <TouchableOpacity style={s.coverWrap} onPress={() => pickAndUpload('cover')} activeOpacity={0.9}>
          {coverUri
            ? <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            : <View style={s.coverPlaceholder} />
          }
          <View style={s.coverOverlay} />
          <View style={s.coverCameraBtn}>
            {uploadingCover
              ? <ActivityIndicator size="small" color="white" />
              : <Ionicons name="camera" size={16} color="white" />
            }
          </View>
          <TouchableOpacity
            style={s.coverSettingsBtn}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="settings-outline" size={20} color="white" />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* ── Avatar ─────────────────────────────────────────── */}
        <View style={s.avatarWrap}>
          <TouchableOpacity style={s.avatarRing} onPress={() => pickAndUpload('avatar')} activeOpacity={0.85}>
            <UserAvatar uri={avatarUri} emoji={displayEmoji} name={displayName} size={80} bg={C.vividD} />
          </TouchableOpacity>
          <View style={s.editAvatarBadge}>
            {uploadingAvatar
              ? <ActivityIndicator size="small" color="white" />
              : <Ionicons name="camera" size={13} color="white" />
            }
          </View>
        </View>

        {/* ── Name / handle / meta ──────────────────────────── */}
        <View style={s.infoBlock}>
          <Text style={s.displayName}>{displayName}</Text>
          {displayHandle ? <Text style={s.displayHandle}>{displayHandle}</Text> : null}
          {displayBio ? <Text style={s.displayBio}>{displayBio}</Text> : null}

          <View style={s.metaRow}>
            {displayCity ? (
              <View style={s.metaChip}>
                <Ionicons name="location-outline" size={12} color={C.c35} />
                <Text style={s.metaChipTxt}>{displayCity}</Text>
              </View>
            ) : null}
            {homeCountry ? (
              <View style={s.metaChip}>
                <Text style={{ fontSize: 13 }}>{countryFlag}</Text>
                <Text style={s.metaChipTxt}>{homeCountry}</Text>
              </View>
            ) : null}
            {visaStatus ? (
              <View style={[s.metaChip, { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]}>
                <Ionicons name="card-outline" size={12} color={C.vivid} />
                <Text style={[s.metaChipTxt, { color: C.vivid }]}>{VISA_LABELS[visaStatus] || visaStatus}</Text>
              </View>
            ) : null}
          </View>

          {/* Action buttons */}
          <View style={s.actionRow}>
            <TouchableOpacity style={s.editBtn} onPress={openEditModal} activeOpacity={0.85}>
              <Ionicons name="create-outline" size={15} color={C.cream} />
              <Text style={s.editBtnTxt}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.communityBtn} onPress={() => setCountryModal(true)} activeOpacity={0.85}>
              <Text style={{ fontSize: 16 }}>{countryFlag}</Text>
              <Ionicons name="chevron-down" size={14} color={C.c35} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats ──────────────────────────────────────────── */}
        <View style={s.statsRow}>
          {[
            { num: posts.length,      label: 'Posts'     },
            { num: VISA_LABELS[visaStatus] || '—', label: 'Visa' },
            { num: savedPosts.length, label: 'Saved'     },
          ].map((st, i) => (
            <View key={i} style={[s.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: C.border }]}>
              <Text style={s.statNum} numberOfLines={1}>{st.num}</Text>
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
                <Ionicons
                  name={active ? tab.icon.replace('-outline', '') : tab.icon}
                  size={19}
                  color={active ? C.vivid : C.c35}
                />
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
                <View style={[s.emptyIcon, { backgroundColor: C.card }]}>
                  <Ionicons name="document-text-outline" size={28} color={C.c35} />
                </View>
                <Text style={s.emptyTxt}>No posts yet</Text>
                <Text style={s.emptySub}>Share something with your community</Text>
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
          <View style={s.section}>
            {loadingSaved ? (
              <View style={s.centerState}>
                <ActivityIndicator size="small" color={C.vivid} />
              </View>
            ) : savedPosts.length === 0 ? (
              <View style={s.centerState}>
                <View style={[s.emptyIcon, { backgroundColor: C.card }]}>
                  <Ionicons name="bookmark-outline" size={28} color={C.c35} />
                </View>
                <Text style={s.emptyTxt}>Nothing saved yet</Text>
                <Text style={s.emptySub}>Tap Save on any post to bookmark it here</Text>
              </View>
            ) : (
              savedPosts.map(post => (
                <PostCard key={post.id} post={post} navigation={navigation} C={C} s={s} />
              ))
            )}
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
                  <View style={[s.menuIconWrap, { backgroundColor: C.card2 || C.card }]}>
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

          <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled">
            {/* Avatar / cover row */}
            <View style={s.editPhotoRow}>
              <TouchableOpacity style={s.editAvatarPreview} onPress={() => pickAndUpload('avatar')} activeOpacity={0.85}>
                <UserAvatar uri={avatarUri} emoji={displayEmoji} name={displayName} size={68} bg={C.vividD} />
                <View style={[s.editPhotoOverlay, { borderRadius: 34 }]}>
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              </TouchableOpacity>
              <View style={{ flex: 1, gap: 10 }}>
                <TouchableOpacity onPress={() => pickAndUpload('avatar')} activeOpacity={0.85}>
                  <Text style={[s.editPhotoLink, { color: C.vivid }]}>Change profile picture</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => pickAndUpload('cover')} activeOpacity={0.85}>
                  <Text style={[s.editPhotoLink, { color: C.c35 }]}>Change cover photo</Text>
                </TouchableOpacity>
              </View>
            </View>

            {saveError ? (
              <View style={[s.saveErrorBox, { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]}>
                <Ionicons name="alert-circle-outline" size={15} color={C.vivid} />
                <Text style={[s.saveErrorTxt, { color: C.vivid }]}>{saveError}</Text>
              </View>
            ) : null}

            {/* Name row */}
            <View style={s.nameRow}>
              <View style={[s.fieldWrap, { flex: 1 }]}>
                <Text style={s.fieldLabel}>First Name</Text>
                <TextInput
                  style={[s.fieldInput, { backgroundColor: C.card, borderColor: C.border, color: C.cream }]}
                  value={editFirstName}
                  onChangeText={v => { setEditFirstName(v); setSaveError(''); }}
                  placeholder="First name"
                  placeholderTextColor={C.c35}
                  autoCapitalize="words"
                />
              </View>
              <View style={[s.fieldWrap, { flex: 1 }]}>
                <Text style={s.fieldLabel}>Last Name</Text>
                <TextInput
                  style={[s.fieldInput, { backgroundColor: C.card, borderColor: C.border, color: C.cream }]}
                  value={editLastName}
                  onChangeText={v => { setEditLastName(v); setSaveError(''); }}
                  placeholder="Last name"
                  placeholderTextColor={C.c35}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Handle</Text>
              <View style={[s.fieldWithPrefix, { backgroundColor: C.card, borderColor: C.border }]}>
                <Text style={[s.fieldPrefix, { color: C.c35 }]}>@</Text>
                <TextInput
                  style={[s.fieldInputInline, { color: C.cream }]}
                  value={editHandle}
                  onChangeText={v => { setEditHandle(v.replace(/^@/, '')); setSaveError(''); }}
                  placeholder="your_handle"
                  placeholderTextColor={C.c35}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Bio</Text>
              <TextInput
                style={[s.fieldInput, s.fieldMultiline, { backgroundColor: C.card, borderColor: C.border, color: C.cream }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell your community about yourself…"
                placeholderTextColor={C.c35}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>City / Location</Text>
              <TextInput
                style={[s.fieldInput, { backgroundColor: C.card, borderColor: C.border, color: C.cream }]}
                value={editLivesIn}
                onChangeText={setEditLivesIn}
                placeholder="e.g. Queens, NY"
                placeholderTextColor={C.c35}
                autoCapitalize="words"
              />
            </View>

            {/* Visa status picker */}
            <View style={s.fieldWrap}>
              <Text style={s.fieldLabel}>Visa Status</Text>
              <View style={s.visaGrid}>
                {VISA_OPTIONS.map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[s.visaChip, editVisa === v && { backgroundColor: C.vividD, borderColor: C.vivid }]}
                    onPress={() => setEditVisa(v)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.visaChipTxt, { color: editVisa === v ? C.vivid : C.c35 }]}>
                      {VISA_LABELS[v]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Community (country) picker ────────────────────────── */}
      <Modal visible={countryModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCountryModal(false)}>
        <View style={[{ flex: 1 }, { backgroundColor: C.bg }]}>
          <View style={[s.modalHeader, { borderBottomColor: C.border }]}>
            <View style={s.modalHeaderBtn} />
            <Text style={s.modalTitle}>Your Community</Text>
            <TouchableOpacity style={s.modalHeaderBtn} onPress={() => setCountryModal(false)}>
              <Ionicons name="close" size={22} color={C.c35} />
            </TouchableOpacity>
          </View>

          <View style={[s.communityNote, { backgroundColor: C.vividD, borderColor: C.vivid + '33' }]}>
            <Ionicons name="information-circle-outline" size={16} color={C.vivid} />
            <Text style={[s.communityNoteTxt, { color: C.vivid }]}>
              Changes which community posts appear on your feed
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}>
            {COUNTRIES.map(c => {
              const active = c.name === homeCountry;
              return (
                <TouchableOpacity
                  key={c.name}
                  style={[
                    s.countryOption,
                    { backgroundColor: C.card, borderColor: C.border },
                    active && { backgroundColor: C.vividD, borderColor: C.vivid + '66' },
                  ]}
                  onPress={() => handleCountrySelect(c)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 26 }}>{c.flag}</Text>
                  <Text style={[s.countryName, { color: active ? C.vivid : C.cream }]}>{c.name}</Text>
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

// ── Styles ────────────────────────────────────────────────────────────────────
const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  // Cover
  coverWrap:        { height: 130, position: 'relative' },
  coverPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: C.vividD },
  coverOverlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)' },
  coverCameraBtn:   { position: 'absolute', bottom: 10, right: 54, width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  coverSettingsBtn: { position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },

  // Avatar
  avatarWrap:      { alignItems: 'center', marginTop: -44, zIndex: 5, position: 'relative' },
  avatarRing:      { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: C.vivid, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  editAvatarBadge: { position: 'absolute', bottom: 0, right: '33%', width: 26, height: 26, borderRadius: 13, backgroundColor: C.vivid, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.bg },

  // Info
  infoBlock:    { alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, gap: 6 },
  displayName:  { fontSize: 22, fontWeight: '800', color: C.cream, letterSpacing: -0.5 },
  displayHandle:{ fontSize: 13, color: C.c35 },
  displayBio:   { fontSize: 14, color: C.c60, textAlign: 'center', lineHeight: 21, paddingHorizontal: 20 },
  metaRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 2 },
  metaChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  metaChipTxt:  { fontSize: 12, fontWeight: '600', color: C.c35 },
  actionRow:    { flexDirection: 'row', gap: 8, marginTop: 4 },
  editBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, paddingVertical: 10 },
  editBtnTxt:   { fontSize: 13, fontWeight: '700', color: C.cream },
  communityBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },

  // Stats
  statsRow:  { flexDirection: 'row', marginHorizontal: 20, marginTop: 18, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  statItem:  { flex: 1, paddingVertical: 14, alignItems: 'center', gap: 2 },
  statNum:   { fontSize: 15, fontWeight: '800', color: C.cream, textAlign: 'center', paddingHorizontal: 4 },
  statLabel: { fontSize: 10, fontWeight: '600', color: C.c35, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Tabs
  tabBar:      { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  tabBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive:{ borderBottomColor: C.vivid },
  tabTxt:      { fontSize: 12, fontWeight: '700', color: C.c35 },

  // Content sections
  section:     { paddingHorizontal: 16, marginTop: 14 },
  centerState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon:   { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTxt:    { fontSize: 15, fontWeight: '700', color: C.cream },
  emptySub:    { fontSize: 13, color: C.c35, textAlign: 'center' },
  emptyBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: C.vivid },
  emptyBtnTxt: { fontSize: 13, fontWeight: '700', color: 'white' },

  // Post cards
  postCard:      { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  postBody:      { fontSize: 14, color: C.c60, lineHeight: 21, marginBottom: 10 },
  postTopics:    { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  postTopicChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, borderWidth: 1 },
  postTopicTxt:  { fontSize: 10, fontWeight: '700' },
  postFooter:    { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  postStat:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postStatTxt:   { fontSize: 12, fontWeight: '600', color: C.c35 },
  postTime:      { marginLeft: 'auto', fontSize: 11, color: C.c35 },

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
  modalBody:      { padding: 20, gap: 16, paddingBottom: 40 },

  editPhotoRow:   { flexDirection: 'row', alignItems: 'center', gap: 16, paddingBottom: 4 },
  editAvatarPreview: { width: 70, height: 70, borderRadius: 35, overflow: 'hidden', position: 'relative' },
  editPhotoOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  editPhotoLink:  { fontSize: 14, fontWeight: '700' },

  saveErrorBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  saveErrorTxt:  { flex: 1, fontSize: 13, fontWeight: '600' },

  nameRow:    { flexDirection: 'row', gap: 10 },
  fieldWrap:  { gap: 5 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: C.c35, letterSpacing: 0.8, textTransform: 'uppercase' },
  fieldInput: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 },
  fieldMultiline: { minHeight: 90, paddingTop: 13 },
  fieldWithPrefix:{ flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  fieldPrefix:    { fontSize: 16, fontWeight: '600', marginRight: 4 },
  fieldInputInline:{ flex: 1, fontSize: 15 },

  visaGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  visaChip:    { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  visaChipTxt: { fontSize: 12, fontWeight: '700' },

  // Country modal
  communityNote:    { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, padding: 12, borderRadius: 12, borderWidth: 1 },
  communityNoteTxt: { flex: 1, fontSize: 12, fontWeight: '600' },
  countryOption:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  countryName:      { flex: 1, fontSize: 15, fontWeight: '600' },
});
