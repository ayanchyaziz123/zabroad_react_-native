import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';

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
      <TouchableOpacity
        style={[s.commentAv, { backgroundColor: avatarBg }]}
        onPress={() => comment.author_handle && onReply && null}
        activeOpacity={0.8}
      >
        <Text style={{ fontSize: 17 }}>{comment.author_avatar || '🧑‍💻'}</Text>
      </TouchableOpacity>

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
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={14} color={liked ? '#FF3B5C' : C.c35} />
            </Animated.View>
            {likeCount > 0 && <Text style={[s.commentActionTxt, liked && { color: '#FF3B5C' }]}>{likeCount}</Text>}
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
  const post = route?.params?.post || {};

  const [liked,       setLiked]       = useState(post.is_liked || false);
  const [likeCount,   setLikeCount]   = useState(post.likes_count || 0);
  const [saved,       setSaved]       = useState(false);
  const [comments,    setComments]    = useState([]);
  const [loadingCmts, setLoadingCmts] = useState(true);
  const [input,       setInput]       = useState('');
  const [replyingTo,  setReplyingTo]  = useState(null);
  const [sending,     setSending]     = useState(false);

  const heartScale = useRef(new Animated.Value(1)).current;
  const scrollRef  = useRef(null);
  const inputRef   = useRef(null);

  // ── Fetch comments ──────────────────────────────────────────────────────
  const fetchComments = useCallback(async () => {
    if (!post.id) return;
    setLoadingCmts(true);
    try {
      const data = await api(`/posts/${post.id}/comments/`);
      setComments(Array.isArray(data) ? data : (data.results || []));
    } catch {
      // silently fail — comments not critical
    } finally {
      setLoadingCmts(false);
    }
  }, [api, post.id]);

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
      await api(`/posts/${post.id}/like/`, { method: 'POST' });
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
      const newCmt = await api(`/posts/${post.id}/comments/`, {
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

  const totalComments = comments.length;

  // ── Author info ─────────────────────────────────────────────────────────
  const authorName   = post.author_name   || post.name   || 'User';
  const authorHandle = post.author_handle || post.handle || '';
  const authorAvatar = post.author_avatar || post.avatar || '🧑‍💻';
  const authorFlag   = post.author_country_flag || '';
  const postTime     = post.created_at ? formatTime(post.created_at) : (post.time || '');
  const postLocation = post.location || '';
  const topics       = post.topics_list || [];
  const postBody     = post.body || '';

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Post</Text>
        <TouchableOpacity style={s.headerBtn} activeOpacity={0.7}>
          <Ionicons name="paper-plane-outline" size={20} color={C.cream} />
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
              <View style={s.avatarRing}>
                <View style={[s.postAvatar, { backgroundColor: '#1A2035' }]}>
                  <Text style={{ fontSize: 20 }}>{authorAvatar}</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.postAuthorName}>{authorName}</Text>
                  {authorFlag ? <Text style={{ fontSize: 14 }}>{authorFlag}</Text> : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Text style={s.postMeta}>{postTime}</Text>
                  {postLocation ? <Text style={s.postMeta}>· 📍 {postLocation}</Text> : null}
                </View>
              </View>
              <TouchableOpacity style={s.moreBtn} activeOpacity={0.7}>
                <Ionicons name="ellipsis-horizontal" size={20} color={C.c35} />
              </TouchableOpacity>
            </View>

            {/* Body */}
            <Text style={s.postBody}>{postBody}</Text>

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

            {/* ── Instagram action bar ───────────────────────── */}
            <View style={s.igActions}>
              <View style={s.igLeft}>
                <TouchableOpacity onPress={onLikePost} activeOpacity={0.7} style={s.igBtn}>
                  <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                    <Ionicons name={liked ? 'heart' : 'heart-outline'} size={26} color={liked ? '#FF3B5C' : C.c60} />
                  </Animated.View>
                </TouchableOpacity>
                <TouchableOpacity style={s.igBtn} onPress={() => inputRef.current?.focus()} activeOpacity={0.7}>
                  <Ionicons name="chatbubble-outline" size={24} color={C.c60} />
                </TouchableOpacity>
                <TouchableOpacity style={s.igBtn} activeOpacity={0.7}>
                  <Ionicons name="paper-plane-outline" size={24} color={C.c60} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setSaved(v => !v)} activeOpacity={0.7} style={s.igBtn}>
                <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={24} color={saved ? C.vivid : C.c60} />
              </TouchableOpacity>
            </View>

            {/* Counts */}
            <View style={s.countsRow}>
              {likeCount > 0 && (
                <Text style={s.countTxt}>{likeCount.toLocaleString()} like{likeCount !== 1 ? 's' : ''}</Text>
              )}
              {totalComments > 0 && (
                <Text style={[s.countTxt, { color: C.c35 }]}>
                  {likeCount > 0 ? '  ·  ' : ''}{totalComments} comment{totalComments !== 1 ? 's' : ''}
                </Text>
              )}
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
            <View style={[s.inputAvatar, { backgroundColor: C.vividD }]}>
              <Text style={{ fontSize: 15 }}>{user?.profile?.avatar_emoji || '🧑‍💻'}</Text>
            </View>
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
  postBody:       { fontSize: 15, color: C.c60, lineHeight: 24, paddingHorizontal: 14, paddingBottom: 12 },
  topicsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingBottom: 12 },
  topicChip:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50, borderWidth: 1 },
  topicTxt:       { fontSize: 11, fontWeight: '700' },

  // IG actions
  igActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingTop: 2 },
  igLeft:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
  igBtn:     { padding: 8 },
  countsRow: { flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 12 },
  countTxt:  { fontSize: 13, fontWeight: '700', color: C.cream },

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
