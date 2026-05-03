import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, Image, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import UserAvatar from '../components/UserAvatar';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Comment row ───────────────────────────────────────────────────────────────
function CommentRow({ comment, C, s, onReply, api }) {
  const [liked,     setLiked]     = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes_count || 0);
  const scale = useRef(new Animated.Value(1)).current;

  function onLike() {
    setLiked(p => !p);
    setLikeCount(c => liked ? c - 1 : c + 1);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.5, useNativeDriver: true, speed: 60, bounciness: 20 }),
      Animated.spring(scale, { toValue: 1,   useNativeDriver: true, speed: 30 }),
    ]).start();
  }

  const avatarBg = comment.author_avatar ? '#1A2035' : '#1A2035';

  return (
    <View style={s.commentRow}>
      {/* Avatar */}
      <UserAvatar
        uri={comment.author_avatar_url}
        emoji={comment.author_avatar}
        name={comment.author_name}
        size={36}
        bg={avatarBg}
      />

      {/* Content */}
      <View style={s.commentContent}>
        <View style={s.commentHeader}>
          <Text style={s.commentName}>{comment.author_name || 'User'}</Text>
          <Text style={s.commentTime}>{formatTime(comment.created_at)}</Text>
        </View>
        <Text style={s.commentText}>{comment.body}</Text>
        <View style={s.commentActions}>
          <TouchableOpacity style={s.commentActionBtn} onPress={onLike} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ scale }] }}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={14} color={liked ? '#F4A227' : C.c35} />
            </Animated.View>
            {likeCount > 0 && <Text style={[s.commentActionTxt, liked && { color: '#F4A227' }]}>{likeCount}</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={s.commentActionBtn}
            onPress={() => onReply(comment.author_name)}
            activeOpacity={0.7}
          >
            <Text style={s.commentActionTxt}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function PostDetailScreen({ navigation, route }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const { user, api } = useAuthStore();

  // The post object passed from HomeScreen (full API shape)
  const initialPost = route?.params?.post || {};

  const [post,        setPost]        = useState(initialPost);
  const [liked,       setLiked]       = useState(initialPost.is_liked || false);
  const [likeCount,   setLikeCount]   = useState(initialPost.likes_count || 0);
  const [saved,       setSaved]       = useState(initialPost.is_saved || false);
  const [comments,    setComments]    = useState([]);
  const [loadingCmts, setLoadingCmts] = useState(true);
  const [input,       setInput]       = useState('');
  const [replyingTo,  setReplyingTo]  = useState(null);
  const [sending,     setSending]     = useState(false);
  const [sheetMode,   setSheetMode]   = useState(null); // null | 'menu' | 'edit'
  const [editBody,    setEditBody]    = useState('');
  const [saving,      setSaving]      = useState(false);

  const heartScale = useRef(new Animated.Value(1)).current;
  const scrollRef  = useRef(null);
  const inputRef   = useRef(null);

  // ── Fetch fresh post (gets up-to-date is_liked, is_saved, counts) ───────
  useEffect(() => {
    if (!initialPost.id) return;
    api(`/posts/${initialPost.id}/`).then(fresh => {
      setPost(fresh);
      setLiked(fresh.is_liked || false);
      setLikeCount(fresh.likes_count || 0);
      setSaved(fresh.is_saved || false);
    }).catch(() => {});
  }, [initialPost.id]);

  // ── Fetch comments ──────────────────────────────────────────────────────
  const fetchComments = useCallback(async () => {
    if (!initialPost.id) return;
    setLoadingCmts(true);
    try {
      const data = await api(`/posts/${initialPost.id}/comments/`);
      setComments(Array.isArray(data) ? data : (data.results || []));
    } catch {
      // silently fail — comments not critical
    } finally {
      setLoadingCmts(false);
    }
  }, [api, initialPost.id]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // ── Like post ───────────────────────────────────────────────────────────
  const onLikePost = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount(c => next ? c + 1 : c - 1);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, speed: 60, bounciness: 20 }),
      Animated.spring(heartScale, { toValue: 1,   useNativeDriver: true, speed: 30 }),
    ]).start();
    try {
      const res = await api(`/posts/${initialPost.id}/like/`, { method: 'POST' });
      setLiked(res.liked);
      setLikeCount(res.likes_count);
    } catch {
      setLiked(liked);
      setLikeCount(c => next ? c - 1 : c + 1);
    }
  };

  // ── Submit comment ──────────────────────────────────────────────────────
  const submitComment = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const newCmt = await api(`/posts/${initialPost.id}/comments/`, {
        method: 'POST',
        body: { body: text },
      });
      setComments(prev => [...prev, newCmt]);
      setInput('');
      setReplyingTo(null);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    } catch {
      // keep input so user can retry
    } finally {
      setSending(false);
    }
  };

  const handleReply = (name) => {
    setReplyingTo(name);
    setInput(`@${name} `);
    inputRef.current?.focus();
  };

  const openMenu = () => setSheetMode('menu');

  const openEdit = () => {
    setEditBody(post.body || '');
    setSheetMode('edit');
  };

  const closeSheet = () => setSheetMode(null);

  const handleEditSave = async () => {
    const body = editBody.trim();
    if (!body || saving) return;
    setSaving(true);
    try {
      const updated = await api(`/posts/${initialPost.id}/`, { method: 'PATCH', body: { body } });
      setPost(prev => ({ ...prev, body: updated.body }));
      setSheetMode(null);
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSheetMode(null);
    try {
      await api(`/posts/${initialPost.id}/`, { method: 'DELETE' });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not delete post. Please try again.');
    }
  };

  const totalComments = comments.length;

  // ── Author info (read from refreshed post state) ────────────────────────
  const authorName   = post.author_name   || 'User';
  const authorAvatar = post.author_avatar || '🧑‍💻';
  const authorFlag   = post.author_country_flag || '';
  const authorId     = post.author_id || null;
  const postTime     = post.created_at ? formatTime(post.created_at) : '';
  const postLocation = post.location || '';
  const topics       = post.topics_list || [];
  const postBody     = post.body || '';
  const isOwnPost    = authorId && user?.id && authorId === user.id;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Post</Text>
        <TouchableOpacity style={s.headerBtn} activeOpacity={0.7} onPress={isOwnPost ? openMenu : undefined}>
          <Ionicons name="ellipsis-horizontal" size={20} color={isOwnPost ? C.cream : C.c35} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
        >

          {/* ── Post ───────────────────────────────────────────── */}
          <View style={s.postCard}>

            {/* Author */}
            <View style={s.postAuthorRow}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
                onPress={() => authorId && navigation.navigate('UserProfile', { userId: authorId })}
                activeOpacity={authorId ? 0.75 : 1}
                disabled={!authorId}
              >
                <View style={s.avatarRing}>
                  <UserAvatar
                    uri={post.author_avatar_url}
                    emoji={authorAvatar}
                    name={authorName}
                    size={38}
                    bg="#1A2035"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.postAuthorName} numberOfLines={1}>{authorName}{authorFlag ? `  ${authorFlag}` : ''}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Text style={s.postMeta}>{postTime}</Text>
                    {postLocation ? <Text style={s.postMeta}>· 📍 {postLocation}</Text> : null}
                  </View>
                </View>
              </TouchableOpacity>
              {authorId && !isOwnPost && (
                <TouchableOpacity
                  style={s.msgBtn}
                  onPress={() => navigation.navigate('AppMain', { screen: 'Chat', params: { userId: authorId } })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={17} color={C.vivid} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.moreBtn} activeOpacity={0.7} onPress={isOwnPost ? openMenu : undefined}>
                <Ionicons name="ellipsis-horizontal" size={20} color={C.c35} />
              </TouchableOpacity>
            </View>

            {/* Body */}
            <Text style={s.postBody}>{postBody}</Text>

            {/* Image */}
            {post.image_url ? (
              <Image source={{ uri: post.image_url }} style={s.postImage} resizeMode="cover" />
            ) : null}

            {/* Topics */}
            {topics.length > 0 && (
              <View style={s.topicsRow}>
                {topics.map(t => (
                  <View key={t} style={[s.topicChip, { backgroundColor: C.vividD, borderColor: C.vivid + '44' }]}>
                    <Text style={[s.topicTxt, { color: C.vivid }]}>#{t}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* ── Action bar ─────────────────────────────────── */}
            <View style={s.actionBar}>
              <TouchableOpacity onPress={onLikePost} activeOpacity={0.75} style={s.actionBtn}>
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <Ionicons name={liked ? 'thumbs-up' : 'thumbs-up-outline'} size={16} color={liked ? '#F4A227' : C.c35} />
                </Animated.View>
                <Text style={[s.actionTxt, liked && { color: '#F4A227' }]}>
                  {likeCount > 0 ? `${likeCount.toLocaleString()} ` : ''}Helpful
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => inputRef.current?.focus()} activeOpacity={0.75} style={s.actionBtn}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={C.c35} />
                <Text style={s.actionTxt}>
                  {totalComments > 0 ? `${totalComments} ` : ''}Comment
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={async () => {
                const next = !saved;
                setSaved(next);
                try { await api(`/posts/${initialPost.id}/save/`, { method: 'POST' }); }
                catch { setSaved(!next); }
              }} activeOpacity={0.75} style={s.actionBtn}>
                <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color={saved ? C.vivid : C.c35} />
                <Text style={[s.actionTxt, saved && { color: C.vivid }]}>{saved ? 'Saved' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Ask AI ─────────────────────────────────────────── */}
          <TouchableOpacity
            style={s.aiCard}
            onPress={() => navigation.navigate('AIAssistant')}
            activeOpacity={0.85}
          >
            <View style={[s.aiIconWrap, { backgroundColor: C.vividD }]}>
              <Ionicons name="sparkles" size={18} color={C.vivid} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.aiTitle}>Ask Zabroad AI</Text>
              <Text style={s.aiSub}>Get personalised visa & immigration guidance</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.c35} />
          </TouchableOpacity>

          {/* ── Comments ───────────────────────────────────────── */}
          <View style={s.commentsDivider}>
            <View style={s.commentsDividerLine} />
            <Text style={s.commentsDividerTxt}>
              {totalComments > 0 ? `${totalComments} Comment${totalComments !== 1 ? 's' : ''}` : 'Comments'}
            </Text>
            <View style={s.commentsDividerLine} />
          </View>

          {loadingCmts ? (
            <View style={s.centerState}>
              <ActivityIndicator size="small" color={C.vivid} />
            </View>
          ) : comments.length === 0 ? (
            <View style={s.centerState}>
              <Ionicons name="chatbubble-outline" size={32} color={C.c35} />
              <Text style={s.emptyCmtTxt}>Be the first to comment</Text>
            </View>
          ) : (
            <View style={s.commentsList}>
              {comments.map(c => (
                <CommentRow
                  key={c.id}
                  comment={c}
                  C={C} s={s}
                  onReply={handleReply}
                  api={api}
                />
              ))}
            </View>
          )}

        </ScrollView>

        {/* ── Comment input ───────────────────────────────────── */}
        <View style={s.inputArea}>
          {replyingTo && (
            <View style={s.replyBanner}>
              <Ionicons name="return-down-forward-outline" size={13} color={C.c35} />
              <Text style={s.replyBannerTxt}>Replying to <Text style={{ color: C.cream, fontWeight: '700' }}>@{replyingTo}</Text></Text>
              <TouchableOpacity
                onPress={() => { setReplyingTo(null); setInput(''); }}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons name="close" size={15} color={C.c35} />
              </TouchableOpacity>
            </View>
          )}
          <View style={s.inputRow}>
            <UserAvatar
              uri={user?.profile?.avatar_url}
              emoji={user?.profile?.avatar_emoji}
              name={user?.name}
              size={34}
              bg={C.vividD}
            />
            <TextInput
              ref={inputRef}
              style={s.textInput}
              placeholder={replyingTo ? `Reply to @${replyingTo}…` : 'Add a comment…'}
              placeholderTextColor={C.c35}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnDisabled]}
              onPress={submitComment}
              disabled={!input.trim() || sending}
              activeOpacity={0.85}
            >
              {sending
                ? <ActivityIndicator size="small" color="white" />
                : <Ionicons name="arrow-up" size={18} color="white" />
              }
            </TouchableOpacity>
          </View>
        </View>

      </KeyboardAvoidingView>

      {/* ── Single bottom sheet (menu OR edit) ────────────────── */}
      <Modal
        visible={sheetMode !== null}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        {sheetMode === 'menu' ? (
          <TouchableOpacity style={s.menuOverlay} activeOpacity={1} onPress={closeSheet}>
            <View style={[s.menuSheet, { backgroundColor: C.card }]}>
              <TouchableOpacity style={s.menuItem} onPress={openEdit} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={20} color={C.cream} />
                <Text style={s.menuItemTxt}>Edit post</Text>
              </TouchableOpacity>
              <View style={[s.menuDivider, { backgroundColor: C.border }]} />
              <TouchableOpacity style={s.menuItem} onPress={handleDelete} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={20} color={C.red} />
                <Text style={[s.menuItemTxt, { color: C.red }]}>Delete post</Text>
              </TouchableOpacity>
              <View style={[s.menuDivider, { backgroundColor: C.border }]} />
              <TouchableOpacity style={s.menuItem} onPress={closeSheet} activeOpacity={0.7}>
                <Text style={[s.menuItemTxt, { color: C.c35 }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ) : (
          <KeyboardAvoidingView
            style={s.editOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={[s.editSheet, { backgroundColor: C.nav }]}>
              <View style={s.editHeader}>
                <Text style={[s.editTitle, { color: C.cream }]}>Edit post</Text>
                <TouchableOpacity style={s.editClose} onPress={closeSheet} activeOpacity={0.7}>
                  <Ionicons name="close" size={20} color={C.c35} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[s.editInput, { color: C.cream, borderColor: C.border, backgroundColor: C.card }]}
                value={editBody}
                onChangeText={setEditBody}
                multiline
                autoFocus
                maxLength={500}
                placeholderTextColor={C.c35}
                placeholder="What's on your mind?"
              />
              <Text style={[s.editCharCount, { color: C.c35 }]}>{editBody.length}/500</Text>
              <TouchableOpacity
                style={[s.editSaveBtn, { backgroundColor: C.vivid }, (!editBody.trim() || saving) && { opacity: 0.5 }]}
                onPress={handleEditSave}
                disabled={!editBody.trim() || saving}
                activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator size="small" color="white" />
                  : <Text style={s.editSaveTxt}>Save changes</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg },
  headerBtn:   { width: 36, height: 36, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: C.cream },

  // Post card
  postCard:       { backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 4 },
  postAuthorRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 10 },
  avatarRing:     { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: C.vivid, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  postAvatar:     { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  postAuthorName: { fontSize: 14, fontWeight: '700', color: C.cream },
  postMeta:       { fontSize: 11, color: C.c35 },
  moreBtn:        { padding: 6 },
  msgBtn:         { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: C.vividD, borderWidth: 1, borderColor: C.vivid + '44' },
  postBody:       { fontSize: 15, color: C.c60, lineHeight: 24, paddingHorizontal: 14, paddingBottom: 12 },
  postImage:      { width: '100%', height: 260, marginBottom: 12, backgroundColor: C.card2 },
  topicsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingBottom: 12 },
  topicChip:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50, borderWidth: 1 },
  topicTxt:       { fontSize: 11, fontWeight: '700' },

  // Action bar
  actionBar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, marginTop: 6 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  actionTxt: { fontSize: 12, fontWeight: '600', color: C.c35 },

  // AI card
  aiCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 14, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: C.vivid + '33', backgroundColor: C.vividD },
  aiIconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  aiTitle:    { fontSize: 13, fontWeight: '700', color: C.cream, marginBottom: 2 },
  aiSub:      { fontSize: 11, color: C.c35 },

  // Comments divider
  commentsDivider:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginBottom: 6 },
  commentsDividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  commentsDividerTxt:  { fontSize: 11, fontWeight: '700', color: C.c35, letterSpacing: 0.8 },

  // Comments list
  commentsList:  { paddingHorizontal: 14, gap: 0 },
  commentRow:    { flexDirection: 'row', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  commentAv:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  commentContent:{ flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  commentName:   { fontSize: 13, fontWeight: '700', color: C.cream },
  commentTime:   { fontSize: 11, color: C.c35 },
  commentText:   { fontSize: 14, color: C.c60, lineHeight: 21 },
  commentActions:{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  commentActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentActionTxt: { fontSize: 12, color: C.c35, fontWeight: '600' },

  // Empty / loading
  centerState:  { alignItems: 'center', paddingVertical: 36, gap: 10 },
  emptyCmtTxt:  { fontSize: 13, color: C.c35, fontWeight: '600' },

  // Action menu
  menuOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  menuSheet:    { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 28 },
  menuItem:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 17 },
  menuItemTxt:  { fontSize: 15, fontWeight: '600', color: C.cream },
  menuDivider:  { height: 1, marginHorizontal: 0 },

  // Edit modal
  editOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  editSheet:     { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  editHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  editTitle:     { fontSize: 17, fontWeight: '800' },
  editClose:     { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  editInput:     { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, lineHeight: 22, minHeight: 120, textAlignVertical: 'top', marginBottom: 6 },
  editCharCount: { fontSize: 11, textAlign: 'right', marginBottom: 14 },
  editSaveBtn:   { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  editSaveTxt:   { fontSize: 15, fontWeight: '800', color: 'white' },

  // Input bar
  inputArea:    { borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.nav },
  replyBanner:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  replyBannerTxt: { flex: 1, fontSize: 12, color: C.c35 },
  inputRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, paddingHorizontal: 12 },
  inputAvatar:  { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  textInput:    { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.cream, maxHeight: 100 },
  sendBtn:      { width: 38, height: 38, borderRadius: 19, backgroundColor: C.vivid, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendBtnDisabled: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
});
