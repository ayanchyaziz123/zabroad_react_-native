import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, Alert, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated, Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import UserAvatar from '../components/UserAvatar';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';

const GOLD = '#F5A623';

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
  { flag: '🇺🇦', name: 'Ukraine' },    { flag: '🇲🇦', name: 'Morocco' },
  { flag: '🇸🇳', name: 'Senegal' },    { flag: '🇵🇪', name: 'Peru' },
  { flag: '🇵🇸', name: 'Palestine' },  { flag: '🇸🇴', name: 'Somalia' },
  { flag: '🌍', name: 'Other' },
];


const TABS = [
  { key: 'Posts',    icon: 'grid-outline',      iconActive: 'grid'      },
  { key: 'Saved',    icon: 'bookmark-outline',  iconActive: 'bookmark'  },
  { key: 'Listings', icon: 'pricetag-outline',  iconActive: 'pricetag'  },
  { key: 'Settings', icon: 'settings-outline',  iconActive: 'settings'  },
];

const LISTING_TYPE_META = {
  job:         { icon: 'briefcase-outline',  color: '#3B8BF7', label: 'Job'     },
  housing:     { icon: 'home-outline',        color: '#F4A227', label: 'Housing' },
  marketplace: { icon: 'storefront-outline', color: '#28D99E', label: 'Market'  },
  event:       { icon: 'calendar-outline',   color: '#A855F7', label: 'Event'   },
};

function formatTime(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, isOwn, onDelete, navigation, C, s }) {
  const [liked, setLiked] = useState(post.is_liked || false);
  const [count, setCount] = useState(post.likes_count || 0);
  const { api } = useAuthStore();
  const scale = useRef(new Animated.Value(1)).current;

  async function onLike() {
    const prev = liked, prevCount = count;
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

  function confirmDelete() {
    Alert.alert('Delete Post', 'Remove this post permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(post.id) },
    ]);
  }

  return (
    <TouchableOpacity
      style={[s.postCard, { backgroundColor: C.card, borderColor: C.border }]}
      onPress={() => navigation.navigate('PostDetail', { post })}
      activeOpacity={0.92}
    >
      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={s.postImage} resizeMode="cover" />
      ) : null}
      <View style={s.postBody}>
        <Text style={[s.postBodyTxt, { color: C.c60 }]} numberOfLines={post.image_url ? 2 : 3}>
          {post.body}
        </Text>
      </View>
      {post.topics_list?.length > 0 && (
        <View style={s.postTopics}>
          {post.topics_list.slice(0, 3).map(t => (
            <View key={t} style={[s.postTopicChip, { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]}>
              <Text style={[s.postTopicTxt, { color: C.vivid }]}>#{t}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={[s.postFooter, { borderTopColor: C.border }]}>
        <TouchableOpacity style={s.postStat} onPress={onLike} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name={liked ? 'thumbs-up' : 'thumbs-up-outline'} size={14} color={liked ? GOLD : C.c35} />
          </Animated.View>
          <Text style={[s.postStatTxt, { color: liked ? GOLD : C.c35 }]}>{count}</Text>
        </TouchableOpacity>
        <View style={s.postStat}>
          <Ionicons name="chatbubble-outline" size={13} color={C.c35} />
          <Text style={[s.postStatTxt, { color: C.c35 }]}>{post.comments_count || 0}</Text>
        </View>
        <Text style={[s.postTime, { color: C.c35 }]}>{formatTime(post.created_at)}</Text>
        {isOwn && (
          <TouchableOpacity onPress={confirmDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={15} color="#FF4D4D" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Saved Listing Card ────────────────────────────────────────────────────────
function SavedListingCard({ item, navigation, C, s }) {
  const meta = LISTING_TYPE_META[item.listing_type] || LISTING_TYPE_META.job;

  function handlePress() {
    if (item.listing_type === 'job')         navigation.navigate('JobDetail',         { job: item });
    else if (item.listing_type === 'housing') navigation.navigate('HousingDetail',     { listing: item });
    else if (item.listing_type === 'marketplace') navigation.navigate('MarketplaceDetail', { item });
    else if (item.listing_type === 'event')  navigation.navigate('EventDetail',        { event: item });
  }

  const subText = item.company || item.price || '';

  return (
    <TouchableOpacity
      style={[s.listingCard, { backgroundColor: C.card, borderColor: C.border }]}
      onPress={handlePress}
      activeOpacity={0.88}
    >
      <View style={[s.listingIconWrap, { backgroundColor: meta.color + '18' }]}>
        <Ionicons name={meta.icon} size={22} color={meta.color} />
      </View>
      <View style={s.listingInfo}>
        <View style={s.listingTopRow}>
          <View style={[s.listingBadge, { backgroundColor: meta.color + '18' }]}>
            <Text style={[s.listingBadgeTxt, { color: meta.color }]}>{meta.label}</Text>
          </View>
          {item.is_boosted ? <Text style={{ fontSize: 12 }}>🔥</Text> : null}
        </View>
        <Text style={[s.listingTitle, { color: C.cream }]} numberOfLines={1}>{item.title}</Text>
        {subText ? (
          <Text style={[s.listingSub, { color: C.c35 }]} numberOfLines={1}>{subText}</Text>
        ) : null}
        {item.location ? (
          <View style={s.listingLocRow}>
            <Ionicons name="location-outline" size={11} color={C.c35} />
            <Text style={[s.listingLoc, { color: C.c35 }]} numberOfLines={1}>{item.location}</Text>
          </View>
        ) : null}
      </View>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={s.listingThumb} />
      ) : null}
    </TouchableOpacity>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const { user: authUser, api, logout, updateProfile } = useAuthStore();

  // ── Tab & content state ───────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState('Posts');
  const [posts,        setPosts]        = useState([]);
  const [savedPosts,          setSavedPosts]          = useState([]);
  const [savedListings,       setSavedListings]       = useState([]);
  const [loadingPosts,        setLoadingPosts]        = useState(false);
  const [loadingSaved,        setLoadingSaved]        = useState(false);
  const [loadingSavedListings, setLoadingSavedListings] = useState(false);
  const [errorPosts,          setErrorPosts]          = useState(null);
  const [errorSaved,          setErrorSaved]          = useState(null);
  const [errorSavedListings,  setErrorSavedListings]  = useState(null);
  const [refreshing,          setRefreshing]          = useState(false);

  // Track which tabs have been fetched so we don't refetch on tab switch
  const hasFetchedSaved     = useRef(false);
  const hasFetchedListings  = useRef(false);

  // ── Photo state ───────────────────────────────────────────────────────────
  const [avatarUri,       setAvatarUri]       = useState(null);
  const [coverUri,        setCoverUri]        = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover,  setUploadingCover]  = useState(false);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [editModal,    setEditModal]    = useState(false);
  const [countryModal, setCountryModal] = useState(false);
  const [pwModal,      setPwModal]      = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // ── Edit form ─────────────────────────────────────────────────────────────
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName,  setEditLastName]  = useState('');
  const [editHandle,    setEditHandle]    = useState('');
  const [editBio,       setEditBio]       = useState('');
  const [editLivesIn,   setEditLivesIn]   = useState('');
  const [saving,        setSaving]        = useState(false);
  const [saveError,     setSaveError]     = useState('');

  // ── Change password ───────────────────────────────────────────────────────
  const [oldPw,      setOldPw]      = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwError,    setPwError]    = useState('');
  const [pwSuccess,  setPwSuccess]  = useState(false);

  // ── Sync server photo URLs ────────────────────────────────────────────────
  useEffect(() => {
    if (authUser?.profile?.avatar_url) setAvatarUri(authUser.profile.avatar_url);
    if (authUser?.profile?.cover_url)  setCoverUri(authUser.profile.cover_url);
  }, [authUser?.profile?.avatar_url, authUser?.profile?.cover_url]);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchMyPosts = useCallback(async () => {
    if (!authUser?.id) return;
    setLoadingPosts(true);
    setErrorPosts(null);
    try {
      const data = await api(`/posts/?author=${authUser.id}`);
      setPosts(Array.isArray(data) ? data : (data.results ?? []));
    } catch (e) {
      setErrorPosts(e.message || 'Could not load posts.');
    } finally {
      setLoadingPosts(false);
    }
  }, [api, authUser?.id]);

  const fetchSavedPosts = useCallback(async () => {
    setLoadingSaved(true);
    setErrorSaved(null);
    try {
      const data = await api('/posts/saved/');
      setSavedPosts(Array.isArray(data) ? data : (data.results ?? []));
    } catch (e) {
      setErrorSaved(e.message || 'Could not load saved posts.');
    } finally {
      setLoadingSaved(false);
    }
  }, [api]);

  const fetchSavedListings = useCallback(async () => {
    setLoadingSavedListings(true);
    setErrorSavedListings(null);
    try {
      const data = await api('/listings/saved/');
      setSavedListings(Array.isArray(data) ? data : (data.results ?? []));
    } catch (e) {
      setErrorSavedListings(e.message || 'Could not load saved listings.');
    } finally {
      setLoadingSavedListings(false);
    }
  }, [api]);

  // Refresh posts whenever the profile screen gains focus
  useFocusEffect(useCallback(() => {
    fetchMyPosts();
  }, [fetchMyPosts]));

  // Lazy-load tabs on first visit
  useEffect(() => {
    if (activeTab === 'Saved' && !hasFetchedSaved.current) {
      hasFetchedSaved.current = true;
      fetchSavedPosts();
    }
    if (activeTab === 'Listings' && !hasFetchedListings.current) {
      hasFetchedListings.current = true;
      fetchSavedListings();
    }
  }, [activeTab, fetchSavedPosts, fetchSavedListings]);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'Posts')    await fetchMyPosts();
    if (activeTab === 'Saved')    await fetchSavedPosts();
    if (activeTab === 'Listings') await fetchSavedListings();
    setRefreshing(false);
  }, [activeTab, fetchMyPosts, fetchSavedPosts, fetchSavedListings]);

  // ── Delete post (optimistic) ──────────────────────────────────────────────
  const handleDeletePost = useCallback(async (postId) => {
    const snapshot = posts;
    setPosts(prev => prev.filter(p => String(p.id) !== String(postId)));
    try {
      await api(`/posts/${postId}/`, { method: 'DELETE' });
    } catch {
      setPosts(snapshot);
      Alert.alert('Error', 'Could not delete post. Please try again.');
    }
  }, [api, posts]);

  // ── Photo pickers ─────────────────────────────────────────────────────────
  async function pickAndUpload(type) {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to change your photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [3, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const ext   = asset.uri.split('.').pop().toLowerCase();
    const mime  = ext === 'png' ? 'image/png' : 'image/jpeg';

    if (type === 'avatar') { setAvatarUri(asset.uri); setUploadingAvatar(true); }
    else                   { setCoverUri(asset.uri);  setUploadingCover(true);  }

    try {
      const fd = new FormData();
      fd.append(type, { uri: asset.uri, name: `${type}.${ext}`, type: mime });
      await api('/auth/me/', { method: 'PATCH', body: fd });
    } catch {
      Alert.alert('Upload failed', 'Could not save your photo. Please try again.');
      if (type === 'avatar') setAvatarUri(authUser?.profile?.avatar_url || null);
      else                   setCoverUri(authUser?.profile?.cover_url   || null);
    } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      else                   setUploadingCover(false);
    }
  }

  // ── Edit profile ──────────────────────────────────────────────────────────
  function openEditModal() {
    // Use first_name/last_name directly (now returned by backend) with name-split fallback
    const nameParts = (authUser?.name || '').split(' ');
    setEditFirstName(authUser?.first_name || nameParts[0] || '');
    setEditLastName(authUser?.last_name   || nameParts.slice(1).join(' ') || '');
    setEditHandle((authUser?.profile?.handle || '').replace(/^@/, ''));
    setEditBio(authUser?.profile?.bio     || '');
    setEditLivesIn(authUser?.profile?.lives_in    || '');
    setSaveError('');
    setEditModal(true);
  }

  async function handleSaveProfile() {
    const firstName = editFirstName.trim();
    if (!firstName) { setSaveError('First name is required.'); return; }
    const handle = editHandle.trim().replace(/^@/, '');
    if (!handle)    { setSaveError('Handle is required.');     return; }
    if (handle.length < 3) { setSaveError('Handle must be at least 3 characters.'); return; }

    setSaving(true);
    setSaveError('');
    try {
      await updateProfile({
        first_name:  firstName,
        last_name:   editLastName.trim(),
        handle,
        bio:         editBio.trim(),
        lives_in:    editLivesIn.trim(),
      });
      setEditModal(false);
    } catch (e) {
      setSaveError(e.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  // ── Change password ───────────────────────────────────────────────────────
  function openPwModal() {
    setOldPw(''); setNewPw(''); setConfirmPw('');
    setPwError(''); setPwSuccess(false);
    setPwModal(true);
  }

  async function handleChangePassword() {
    if (!oldPw || !newPw || !confirmPw) { setPwError('All fields are required.'); return; }
    if (newPw.length < 8)               { setPwError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw)            { setPwError('New passwords do not match.'); return; }

    setChangingPw(true);
    setPwError('');
    try {
      await api('/auth/change-password/', { method: 'POST', body: { old_password: oldPw, new_password: newPw } });
      setPwSuccess(true);
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (e) {
      setPwError(e.message || 'Could not change password.');
    } finally {
      setChangingPw(false);
    }
  }

  // ── Community picker ──────────────────────────────────────────────────────
  async function handleCountrySelect(c) {
    setCountryModal(false);
    setCountrySearch('');
    try {
      await updateProfile({ home_country: c.name, country_flag: c.flag });
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not update community.');
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await logout();
        navigation.replace('Welcome');
      }},
    ]);
  }

  // ── Derived display values ────────────────────────────────────────────────
  const displayName   = authUser?.name || '';
  const displayHandle = authUser?.profile?.handle ? `@${authUser.profile.handle}` : '';
  const displayEmoji  = authUser?.profile?.avatar_emoji || '🧑‍💻';
  const displayCity   = authUser?.profile?.lives_in || '';
  const displayBio    = authUser?.profile?.bio || '';
  const countryFlag   = authUser?.profile?.country_flag || '🌍';
  const homeCountry   = authUser?.profile?.home_country || '';
  const displayEmail  = authUser?.email || '';

  const filteredCountries = useMemo(() =>
    COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())),
    [countrySearch],
  );

  // ── Tab content renderer ──────────────────────────────────────────────────
  function renderPosts(list, loading, error, onRetry, isOwn) {
    if (loading) {
      return (
        <View style={s.centerState}>
          <ActivityIndicator size="small" color={C.vivid} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={s.centerState}>
          <Ionicons name="cloud-offline-outline" size={36} color={C.c35} />
          <Text style={[s.emptyTxt, { color: C.cream }]}>Failed to load</Text>
          <Text style={[s.emptySub, { color: C.c35 }]}>{error}</Text>
          <TouchableOpacity style={[s.retryBtn, { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]} onPress={onRetry} activeOpacity={0.85}>
            <Ionicons name="refresh" size={14} color={C.vivid} />
            <Text style={[s.retryBtnTxt, { color: C.vivid }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (list.length === 0) {
      return (
        <View style={s.centerState}>
          <View style={[s.emptyIcon, { backgroundColor: C.card }]}>
            <Ionicons name={isOwn ? 'document-text-outline' : 'bookmark-outline'} size={28} color={C.c35} />
          </View>
          <Text style={[s.emptyTxt, { color: C.cream }]}>{isOwn ? 'No posts yet' : 'Nothing saved yet'}</Text>
          <Text style={[s.emptySub, { color: C.c35 }]}>
            {isOwn ? 'Share something with your community' : 'Tap Save on any post to bookmark it here'}
          </Text>
          {isOwn && (
            <TouchableOpacity style={[s.emptyBtn, { backgroundColor: C.vivid }]} onPress={() => navigation.navigate('CreatePost')} activeOpacity={0.85}>
              <Ionicons name="add" size={16} color="white" />
              <Text style={s.emptyBtnTxt}>Create a post</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    return list.map(post => (
      <PostCard
        key={post.id}
        post={post}
        isOwn={isOwn}
        onDelete={handleDeletePost}
        navigation={navigation}
        C={C}
        s={s}
      />
    ));
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.vivid} />}
      >

        {/* ── Cover ──────────────────────────────────────────────── */}
        <TouchableOpacity style={s.coverWrap} onPress={() => pickAndUpload('cover')} activeOpacity={0.9}>
          {coverUri
            ? <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            : <View style={[s.coverPlaceholder, { backgroundColor: C.vividD }]} />
          }
          <View style={s.coverOverlay} />
          <View style={s.coverCameraBtn}>
            {uploadingCover
              ? <ActivityIndicator size="small" color="white" />
              : <Ionicons name="camera" size={16} color="white" />
            }
          </View>
        </TouchableOpacity>

        {/* ── Avatar ─────────────────────────────────────────────── */}
        <View style={s.avatarWrap}>
          <TouchableOpacity style={[s.avatarRing, { borderColor: C.vivid, backgroundColor: C.bg }]} onPress={() => pickAndUpload('avatar')} activeOpacity={0.85}>
            <UserAvatar uri={avatarUri} emoji={displayEmoji} name={displayName} size={80} bg={C.vividD} />
          </TouchableOpacity>
          <View style={[s.editAvatarBadge, { backgroundColor: C.vivid, borderColor: C.bg }]}>
            {uploadingAvatar
              ? <ActivityIndicator size="small" color="white" />
              : <Ionicons name="camera" size={13} color="white" />
            }
          </View>
        </View>

        {/* ── Name / handle / meta ───────────────────────────────── */}
        <View style={s.infoBlock}>
          <Text style={[s.displayName, { color: C.cream }]}>{displayName}</Text>
          {displayHandle ? <Text style={[s.displayHandle, { color: C.c35 }]}>{displayHandle}</Text> : null}
          {displayBio ? (
            <Text style={[s.displayBio, { color: C.c60 }]}>{displayBio}</Text>
          ) : null}

          <View style={s.metaRow}>
            {displayCity ? (
              <View style={[s.metaChip, { backgroundColor: C.card, borderColor: C.border }]}>
                <Ionicons name="location-outline" size={12} color={C.c35} />
                <Text style={[s.metaChipTxt, { color: C.c35 }]}>{displayCity}</Text>
              </View>
            ) : null}
            {homeCountry ? (
              <View style={[s.metaChip, { backgroundColor: C.card, borderColor: C.border }]}>
                <Text style={{ fontSize: 13 }}>{countryFlag}</Text>
                <Text style={[s.metaChipTxt, { color: C.c35 }]}>{homeCountry}</Text>
              </View>
            ) : null}
          </View>

          <View style={s.actionRow}>
            <TouchableOpacity style={[s.editBtn, { backgroundColor: C.card, borderColor: C.border }]} onPress={openEditModal} activeOpacity={0.85}>
              <Ionicons name="create-outline" size={15} color={C.cream} />
              <Text style={[s.editBtnTxt, { color: C.cream }]}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.communityBtn, { backgroundColor: C.card, borderColor: C.border }]} onPress={() => setCountryModal(true)} activeOpacity={0.85}>
              <Text style={{ fontSize: 16 }}>{countryFlag}</Text>
              <Ionicons name="chevron-down" size={14} color={C.c35} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Stats ──────────────────────────────────────────────── */}
        <View style={[s.statsRow, { backgroundColor: C.card, borderColor: C.border }]}>
          <TouchableOpacity style={[s.statItem, { borderRightWidth: 1, borderRightColor: C.border }]} onPress={() => setActiveTab('Posts')} activeOpacity={0.8}>
            <Text style={[s.statNum, { color: C.cream }]}>{loadingPosts ? '—' : posts.length}</Text>
            <Text style={[s.statLabel, { color: C.c35 }]}>Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.statItem, { borderRightWidth: 1, borderRightColor: C.border }]} onPress={() => setActiveTab('Saved')} activeOpacity={0.8}>
            <Text style={[s.statNum, { color: C.cream }]}>{loadingSaved ? '—' : savedPosts.length}</Text>
            <Text style={[s.statLabel, { color: C.c35 }]}>Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.statItem} onPress={() => setActiveTab('Listings')} activeOpacity={0.8}>
            <Text style={[s.statNum, { color: C.cream }]}>{loadingSavedListings ? '—' : savedListings.length}</Text>
            <Text style={[s.statLabel, { color: C.c35 }]}>Listings</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <View style={[s.tabBar, { backgroundColor: C.card, borderColor: C.border }]}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[s.tabBtn, active && { borderBottomColor: C.vivid }]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Ionicons name={active ? tab.iconActive : tab.icon} size={18} color={active ? C.vivid : C.c35} />
                <Text style={[s.tabTxt, { color: active ? C.vivid : C.c35 }]}>{tab.key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Posts tab ──────────────────────────────────────────── */}
        {activeTab === 'Posts' && (
          <View style={s.section}>
            {renderPosts(posts, loadingPosts, errorPosts, fetchMyPosts, true)}
          </View>
        )}

        {/* ── Saved tab ──────────────────────────────────────────── */}
        {activeTab === 'Saved' && (
          <View style={s.section}>
            {renderPosts(savedPosts, loadingSaved, errorSaved, fetchSavedPosts, false)}
          </View>
        )}

        {/* ── Listings tab ───────────────────────────────────────── */}
        {activeTab === 'Listings' && (
          <View style={s.section}>
            {loadingSavedListings && (
              <View style={s.centerState}>
                <ActivityIndicator size="small" color={C.vivid} />
              </View>
            )}
            {!loadingSavedListings && errorSavedListings && (
              <View style={s.centerState}>
                <Ionicons name="cloud-offline-outline" size={36} color={C.c35} />
                <Text style={[s.emptyTxt, { color: C.cream }]}>Failed to load</Text>
                <Text style={[s.emptySub, { color: C.c35 }]}>{errorSavedListings}</Text>
                <TouchableOpacity style={[s.retryBtn, { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]} onPress={fetchSavedListings} activeOpacity={0.85}>
                  <Ionicons name="refresh" size={14} color={C.vivid} />
                  <Text style={[s.retryBtnTxt, { color: C.vivid }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            {!loadingSavedListings && !errorSavedListings && savedListings.length === 0 && (
              <View style={s.centerState}>
                <View style={[s.emptyIcon, { backgroundColor: C.card }]}>
                  <Ionicons name="pricetag-outline" size={28} color={C.c35} />
                </View>
                <Text style={[s.emptyTxt, { color: C.cream }]}>No saved listings</Text>
                <Text style={[s.emptySub, { color: C.c35 }]}>Save jobs, housing, or marketplace items to find them here</Text>
              </View>
            )}
            {!loadingSavedListings && savedListings.map(item => (
              <SavedListingCard key={item.id} item={item} navigation={navigation} C={C} s={s} />
            ))}
          </View>
        )}

        {/* ── Settings tab ───────────────────────────────────────── */}
        {activeTab === 'Settings' && (
          <View style={s.section}>

            <View style={[s.menuCard, { backgroundColor: C.card, borderColor: C.border }]}>
              {/* Email */}
              <View style={[s.menuRow, { borderBottomWidth: 1, borderBottomColor: C.border }]}>
                <View style={[s.menuIconWrap, { backgroundColor: C.card2 || C.bg }]}>
                  <Ionicons name="mail-outline" size={18} color={C.c35} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.menuLabel, { color: C.cream }]}>Email</Text>
                  <Text style={[s.menuSub, { color: C.c35 }]}>{displayEmail || 'Not set'}</Text>
                </View>
              </View>

              {/* Change Password */}
              <TouchableOpacity
                style={[s.menuRow, { borderBottomWidth: 1, borderBottomColor: C.border }]}
                onPress={openPwModal}
                activeOpacity={0.75}
              >
                <View style={[s.menuIconWrap, { backgroundColor: C.card2 || C.bg }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={C.c35} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.menuLabel, { color: C.cream }]}>Change Password</Text>
                  <Text style={[s.menuSub, { color: C.c35 }]}>Update your account password</Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={C.c35} />
              </TouchableOpacity>

              {/* Appearance */}
              <TouchableOpacity
                style={s.menuRow}
                onPress={() => navigation.navigate('Settings')}
                activeOpacity={0.75}
              >
                <View style={[s.menuIconWrap, { backgroundColor: C.card2 || C.bg }]}>
                  <Ionicons name="moon-outline" size={18} color={C.c35} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.menuLabel, { color: C.cream }]}>Appearance</Text>
                  <Text style={[s.menuSub, { color: C.c35 }]}>Dark / light mode</Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={C.c35} />
              </TouchableOpacity>
            </View>

            {/* Sign out */}
            <TouchableOpacity
              style={[s.logoutBtn, { backgroundColor: '#FF4D4D18', borderColor: '#FF4D4D44' }]}
              onPress={handleLogout}
              activeOpacity={0.85}
            >
              <Ionicons name="log-out-outline" size={18} color="#FF4D4D" />
              <Text style={[s.logoutTxt, { color: '#FF4D4D' }]}>Sign Out</Text>
            </TouchableOpacity>

          </View>
        )}

      </ScrollView>

      {/* ── Edit Profile Modal ─────────────────────────────────────────────── */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[{ flex: 1, backgroundColor: C.bg }]}>
          <View style={[s.modalHeader, { borderBottomColor: C.border }]}>
            <TouchableOpacity onPress={() => setEditModal(false)} style={s.modalHeaderBtn}>
              <Ionicons name="close" size={22} color={C.c35} />
            </TouchableOpacity>
            <Text style={[s.modalTitle, { color: C.cream }]}>Edit Profile</Text>
            <TouchableOpacity style={[s.modalSaveBtn, { backgroundColor: C.vivid }, saving && { opacity: 0.6 }]} onPress={handleSaveProfile} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="white" /> : <Text style={s.modalSaveTxt}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled">
            {/* Photo row */}
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
              <View style={[s.alertBox, { backgroundColor: '#FF4D4D18', borderColor: '#FF4D4D44' }]}>
                <Ionicons name="alert-circle-outline" size={15} color="#FF4D4D" />
                <Text style={[s.alertTxt, { color: '#FF4D4D' }]}>{saveError}</Text>
              </View>
            ) : null}

            {/* Name */}
            <View style={s.nameRow}>
              <View style={[s.fieldWrap, { flex: 1 }]}>
                <Text style={[s.fieldLabel, { color: C.c35 }]}>FIRST NAME</Text>
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
                <Text style={[s.fieldLabel, { color: C.c35 }]}>LAST NAME</Text>
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

            {/* Handle */}
            <View style={s.fieldWrap}>
              <Text style={[s.fieldLabel, { color: C.c35 }]}>HANDLE</Text>
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

            {/* Bio */}
            <View style={s.fieldWrap}>
              <Text style={[s.fieldLabel, { color: C.c35 }]}>BIO</Text>
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

            {/* City */}
            <View style={s.fieldWrap}>
              <Text style={[s.fieldLabel, { color: C.c35 }]}>CITY / LOCATION</Text>
              <TextInput
                style={[s.fieldInput, { backgroundColor: C.card, borderColor: C.border, color: C.cream }]}
                value={editLivesIn}
                onChangeText={setEditLivesIn}
                placeholder="e.g. Queens, NY"
                placeholderTextColor={C.c35}
                autoCapitalize="words"
              />
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Change Password Modal ─────────────────────────────────────────── */}
      <Modal visible={pwModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPwModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[{ flex: 1, backgroundColor: C.bg }]}>
          <View style={[s.modalHeader, { borderBottomColor: C.border }]}>
            <TouchableOpacity onPress={() => setPwModal(false)} style={s.modalHeaderBtn}>
              <Ionicons name="close" size={22} color={C.c35} />
            </TouchableOpacity>
            <Text style={[s.modalTitle, { color: C.cream }]}>Change Password</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled">
            {pwSuccess ? (
              <View style={[s.alertBox, { backgroundColor: C.greenD, borderColor: C.green + '44' }]}>
                <Ionicons name="checkmark-circle-outline" size={16} color={C.green} />
                <Text style={[s.alertTxt, { color: C.green }]}>Password changed successfully!</Text>
              </View>
            ) : null}

            {pwError ? (
              <View style={[s.alertBox, { backgroundColor: '#FF4D4D18', borderColor: '#FF4D4D44' }]}>
                <Ionicons name="alert-circle-outline" size={15} color="#FF4D4D" />
                <Text style={[s.alertTxt, { color: '#FF4D4D' }]}>{pwError}</Text>
              </View>
            ) : null}

            <View style={s.fieldWrap}>
              <Text style={[s.fieldLabel, { color: C.c35 }]}>CURRENT PASSWORD</Text>
              <TextInput
                style={[s.fieldInput, { backgroundColor: C.card, borderColor: C.border, color: C.cream }]}
                value={oldPw}
                onChangeText={v => { setOldPw(v); setPwError(''); }}
                placeholder="Enter current password"
                placeholderTextColor={C.c35}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={s.fieldWrap}>
              <Text style={[s.fieldLabel, { color: C.c35 }]}>NEW PASSWORD</Text>
              <TextInput
                style={[s.fieldInput, { backgroundColor: C.card, borderColor: C.border, color: C.cream }]}
                value={newPw}
                onChangeText={v => { setNewPw(v); setPwError(''); }}
                placeholder="Min. 8 characters"
                placeholderTextColor={C.c35}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={s.fieldWrap}>
              <Text style={[s.fieldLabel, { color: C.c35 }]}>CONFIRM NEW PASSWORD</Text>
              <TextInput
                style={[s.fieldInput, { backgroundColor: C.card, borderColor: C.border, color: C.cream }]}
                value={confirmPw}
                onChangeText={v => { setConfirmPw(v); setPwError(''); }}
                placeholder="Repeat new password"
                placeholderTextColor={C.c35}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[s.savePwBtn, { backgroundColor: C.vivid }, changingPw && { opacity: 0.6 }]}
              onPress={handleChangePassword}
              disabled={changingPw || pwSuccess}
              activeOpacity={0.85}
            >
              {changingPw
                ? <ActivityIndicator size="small" color="white" />
                : <Ionicons name="lock-closed" size={16} color="white" />
              }
              <Text style={s.savePwBtnTxt}>{changingPw ? 'Saving…' : 'Change Password'}</Text>
            </TouchableOpacity>

            {pwSuccess && (
              <TouchableOpacity onPress={() => setPwModal(false)} style={{ alignItems: 'center', marginTop: 8 }}>
                <Text style={[s.editPhotoLink, { color: C.c35 }]}>Close</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Community picker ──────────────────────────────────────────────── */}
      <Modal visible={countryModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCountryModal(false)}>
        <View style={[{ flex: 1, backgroundColor: C.bg }]}>
          <View style={[s.modalHeader, { borderBottomColor: C.border }]}>
            <View style={s.modalHeaderBtn} />
            <Text style={[s.modalTitle, { color: C.cream }]}>Your Community</Text>
            <TouchableOpacity style={s.modalHeaderBtn} onPress={() => { setCountryModal(false); setCountrySearch(''); }}>
              <Ionicons name="close" size={22} color={C.c35} />
            </TouchableOpacity>
          </View>

          <View style={[s.communityNote, { backgroundColor: C.vividD, borderColor: C.vivid + '33' }]}>
            <Ionicons name="information-circle-outline" size={16} color={C.vivid} />
            <Text style={[s.communityNoteTxt, { color: C.vivid }]}>
              Changes which community posts appear on your feed
            </Text>
          </View>

          {/* Search */}
          <View style={[s.countrySearch, { backgroundColor: C.card, borderColor: C.border }]}>
            <Ionicons name="search-outline" size={16} color={C.c35} />
            <TextInput
              style={[s.countrySearchInput, { color: C.cream }]}
              placeholder="Search countries…"
              placeholderTextColor={C.c35}
              value={countrySearch}
              onChangeText={setCountrySearch}
              autoCapitalize="words"
            />
            {countrySearch.length > 0 && (
              <TouchableOpacity onPress={() => setCountrySearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={15} color={C.c35} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}>
            {filteredCountries.length === 0 ? (
              <Text style={[{ textAlign: 'center', paddingTop: 20, color: C.c35, fontSize: 14 }]}>
                No results for "{countrySearch}"
              </Text>
            ) : filteredCountries.map(c => {
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
  coverWrap:        { height: 140, position: 'relative' },
  coverPlaceholder: { ...StyleSheet.absoluteFillObject },
  coverOverlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  coverCameraBtn:   { position: 'absolute', bottom: 12, right: 16, width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },

  // Avatar
  avatarWrap:      { alignItems: 'center', marginTop: -46, zIndex: 5 },
  avatarRing:      { width: 92, height: 92, borderRadius: 46, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  editAvatarBadge: { position: 'absolute', bottom: 0, marginLeft: 46, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },

  // Info block
  infoBlock:    { alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, gap: 6 },
  displayName:  { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  displayHandle:{ fontSize: 13 },
  displayBio:   { fontSize: 14, textAlign: 'center', lineHeight: 21, paddingHorizontal: 16 },
  metaRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 2 },
  metaChip:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50, borderWidth: 1 },
  metaChipTxt:  { fontSize: 12, fontWeight: '600' },
  actionRow:    { flexDirection: 'row', gap: 8, marginTop: 6 },
  editBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1, paddingVertical: 10 },
  editBtnTxt:   { fontSize: 13, fontWeight: '700' },
  communityBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },

  // Stats
  statsRow:  { flexDirection: 'row', marginHorizontal: 20, marginTop: 18, borderRadius: 18, overflow: 'hidden', borderWidth: 1 },
  statItem:  { flex: 1, paddingVertical: 14, alignItems: 'center', gap: 2 },
  statNum:   { fontSize: 14, fontWeight: '800', textAlign: 'center', paddingHorizontal: 2 },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Tabs
  tabBar:      { flexDirection: 'row', marginHorizontal: 20, marginTop: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  tabBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabTxt:      { fontSize: 12, fontWeight: '700' },

  // Section
  section:      { paddingHorizontal: 16, marginTop: 14 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  centerState:  { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyIcon:    { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTxt:     { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptySub:     { fontSize: 13, textAlign: 'center' },
  emptyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyBtnTxt:  { fontSize: 13, fontWeight: '700', color: 'white' },
  retryBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 50, borderWidth: 1 },
  retryBtnTxt:  { fontSize: 13, fontWeight: '700' },

  // Post cards
  postCard:     { borderWidth: 1, borderRadius: 16, marginBottom: 10, overflow: 'hidden' },
  postImage:    { width: '100%', height: 160 },
  postBody:     { padding: 14, paddingBottom: 0 },
  postBodyTxt:  { fontSize: 14, lineHeight: 21, marginBottom: 10 },
  postTopics:   { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap', paddingHorizontal: 14 },
  postTopicChip:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, borderWidth: 1 },
  postTopicTxt: { fontSize: 10, fontWeight: '700' },
  postFooter:   { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, paddingTop: 10, borderTopWidth: 1 },
  postStat:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postStatTxt:  { fontSize: 12, fontWeight: '600' },
  postTime:     { marginLeft: 'auto', fontSize: 11 },

  // Saved listing cards
  listingCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  listingIconWrap:{ width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  listingInfo:    { flex: 1, gap: 4 },
  listingTopRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  listingBadge:   { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  listingBadgeTxt:{ fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  listingTitle:   { fontSize: 14, fontWeight: '700' },
  listingSub:     { fontSize: 12, fontWeight: '600' },
  listingLocRow:  { flexDirection: 'row', alignItems: 'center', gap: 3 },
  listingLoc:     { fontSize: 11 },
  listingThumb:   { width: 54, height: 54, borderRadius: 10, flexShrink: 0 },

  // Settings
  menuCard:    { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  menuRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  menuIconWrap:{ width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel:   { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  menuSub:     { fontSize: 11 },
  logoutBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, borderWidth: 1, borderRadius: 14, paddingVertical: 14 },
  logoutTxt:   { fontSize: 14, fontWeight: '700' },

  // Modals
  modalHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  modalHeaderBtn: { width: 60, alignItems: 'center' },
  modalTitle:     { fontSize: 17, fontWeight: '800' },
  modalSaveBtn:   { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 50, minWidth: 60, alignItems: 'center' },
  modalSaveTxt:   { fontSize: 13, fontWeight: '700', color: 'white' },
  modalBody:      { padding: 20, gap: 16, paddingBottom: 40 },

  alertBox:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  alertTxt:   { flex: 1, fontSize: 13, fontWeight: '600' },

  editPhotoRow:     { flexDirection: 'row', alignItems: 'center', gap: 16, paddingBottom: 4 },
  editAvatarPreview:{ width: 70, height: 70, borderRadius: 35, overflow: 'hidden', position: 'relative' },
  editPhotoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  editPhotoLink:    { fontSize: 14, fontWeight: '700' },

  nameRow:         { flexDirection: 'row', gap: 10 },
  fieldWrap:       { gap: 5 },
  fieldLabel:      { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  fieldInput:      { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15 },
  fieldMultiline:  { minHeight: 90, paddingTop: 13 },
  fieldWithPrefix: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13 },
  fieldPrefix:     { fontSize: 16, fontWeight: '600', marginRight: 4 },
  fieldInputInline:{ flex: 1, fontSize: 15 },


  savePwBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 15, marginTop: 8 },
  savePwBtnTxt: { fontSize: 15, fontWeight: '800', color: 'white' },

  // Country modal
  communityNote:    { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, marginBottom: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  communityNoteTxt: { flex: 1, fontSize: 12, fontWeight: '600' },
  countrySearch:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 42 },
  countrySearchInput:{ flex: 1, fontSize: 13, paddingVertical: 0 },
  countryOption:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  countryName:      { flex: 1, fontSize: 15, fontWeight: '600' },
});
