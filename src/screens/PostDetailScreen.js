import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

const SEED_COMMENTS = [
  {
    id: 'c1', avatar: '🧑‍🎓', name: 'Priya S.', time: '1h ago', verified: false,
    text: 'TCS Digital is good — they placed me last year. Email the recruiter directly, don\'t apply through the portal.',
    likes: 18, liked: false,
    replies: [
      { id: 'r1', avatar: '👨‍💻', name: 'Tanvir H.', time: '45m ago', text: 'Which recruiter did you contact? Can you DM me?', likes: 4, liked: false },
      { id: 'r2', avatar: '👩‍💼', name: 'Priya S.',  time: '30m ago', text: 'Sure, DMing you now 🙂', likes: 2, liked: false },
    ],
  },
  {
    id: 'c2', avatar: '🧑‍🔬', name: 'Amit K.', time: '2h ago', verified: true,
    text: 'Mastech ghosted me 3 times but then suddenly called. Be persistent. Also try Apex Systems — they are very OPT-friendly.',
    likes: 31, liked: true,
    replies: [
      { id: 'r3', avatar: '👩‍🎓', name: 'Fatima A.', time: '1h ago', text: 'Apex Systems is great! Got placed with them in 2 weeks.', likes: 9, liked: false },
    ],
  },
  {
    id: 'c3', avatar: '👩‍💻', name: 'Wei L.', time: '3h ago', verified: false,
    text: 'Don\'t waste time on portals. LinkedIn + cold email is 10x faster. Find the recruiter\'s email using Hunter.io.',
    likes: 44, liked: false,
    replies: [],
  },
  {
    id: 'c4', avatar: '🧑‍🏫', name: 'Rahul M.', time: '4h ago', verified: false,
    text: 'Pro tip: Filter LinkedIn jobs for "OPT" or "will sponsor" then sort by date. Apply same day jobs are posted.',
    likes: 27, liked: false,
    replies: [
      { id: 'r4', avatar: '🧑‍🎓', name: 'Tanvir H.', time: '3h ago', text: 'This actually works! Got 3 interviews this week using this method.', likes: 12, liked: false },
    ],
  },
  {
    id: 'c5', avatar: '👩‍⚕️', name: 'Sara J.', time: '5h ago', verified: false,
    text: 'Also check university career portals — many post OPT-friendly roles that never make it to LinkedIn.',
    likes: 15, liked: false,
    replies: [],
  },
];

function Comment({ comment, C, s, onLike, onReplyLike, onReply }) {
  const [showReplies, setShowReplies] = useState(comment.replies.length > 0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.4, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,   duration: 100, useNativeDriver: true }),
    ]).start();
    onLike(comment.id);
  };

  return (
    <View style={s.commentBlock}>
      <View style={s.commentRow}>
        <View style={[s.commentAv, { backgroundColor: C.blueD }]}>
          <Text style={{ fontSize: 16 }}>{comment.avatar}</Text>
        </View>
        <View style={s.commentBubble}>
          <View style={s.commentMeta}>
            <Text style={s.commentName}>{comment.name}</Text>
            {comment.verified && <Text style={s.verifiedBadge}>✓</Text>}
            <Text style={s.commentTime}>{comment.time}</Text>
          </View>
          <Text style={s.commentText}>{comment.text}</Text>
          <View style={s.commentActions}>
            <TouchableOpacity style={s.commentAction} onPress={handleLike}>
              <Animated.Text style={{ transform: [{ scale: scaleAnim }] }}>
                {comment.liked ? '❤️' : '🤍'}
              </Animated.Text>
              <Text style={[s.commentActionTxt, comment.liked && { color: '#E8364A' }]}>
                {comment.liked ? comment.likes + 1 : comment.likes}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.commentAction} onPress={() => onReply(comment.name)}>
              <Text style={s.commentActionTxt}>Reply</Text>
            </TouchableOpacity>
            {comment.replies.length > 0 && (
              <TouchableOpacity style={s.commentAction} onPress={() => setShowReplies(p => !p)}>
                <Text style={[s.commentActionTxt, { color: C.blue }]}>
                  {showReplies ? 'Hide replies' : `${comment.replies.length} repl${comment.replies.length > 1 ? 'ies' : 'y'}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {showReplies && comment.replies.map(r => (
        <View key={r.id} style={s.replyRow}>
          <View style={s.replyLine} />
          <View style={[s.commentAv, s.replyAv, { backgroundColor: C.greenD }]}>
            <Text style={{ fontSize: 13 }}>{r.avatar}</Text>
          </View>
          <View style={[s.commentBubble, s.replyBubble]}>
            <View style={s.commentMeta}>
              <Text style={s.commentName}>{r.name}</Text>
              <Text style={s.commentTime}>{r.time}</Text>
            </View>
            <Text style={s.commentText}>{r.text}</Text>
            <View style={s.commentActions}>
              <TouchableOpacity style={s.commentAction} onPress={() => onReplyLike(comment.id, r.id)}>
                <Text>{r.liked ? '❤️' : '🤍'}</Text>
                <Text style={[s.commentActionTxt, r.liked && { color: '#E8364A' }]}>
                  {r.liked ? r.likes + 1 : r.likes}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function PostDetailScreen({ navigation, route }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const post = route?.params?.post || {
    id: '1', avatar: '🧑‍🎓', name: 'Tanvir H.', time: '2h ago · Queens, NY',
    badge: 'Q&A', accentKey: 'blue',
    title: 'OPT-friendly staffing agencies in NYC?',
    body: 'I\'ve been applying to TCS and Mastech for the past 3 weeks and they keep ghosting me. Does anyone have recent experience getting placed by a staffing agency on OPT? Which ones are actually responsive and have good OPT placements in NYC area?\n\nI\'m a CS grad with Java/Python skills. Any specific recruiters or contacts would be super helpful! 🙏',
    likes: 32, replies: 14,
  };

  const accent = C[post.accentKey || 'blue'];
  const accentD = C[(post.accentKey || 'blue') + 'D'];

  const [comments,   setComments]   = useState(SEED_COMMENTS);
  const [postLiked,  setPostLiked]  = useState(false);
  const [postSaved,  setPostSaved]  = useState(false);
  const [input,      setInput]      = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const scrollRef = useRef(null);
  const inputRef  = useRef(null);
  const heartAnim = useRef(new Animated.Value(1)).current;

  const likePost = () => {
    Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1.5, duration: 120, useNativeDriver: true }),
      Animated.timing(heartAnim, { toValue: 1,   duration: 120, useNativeDriver: true }),
    ]).start();
    setPostLiked(p => !p);
  };

  const likeComment = (cid) => {
    setComments(prev => prev.map(c =>
      c.id === cid ? { ...c, liked: !c.liked } : c
    ));
  };

  const likeReply = (cid, rid) => {
    setComments(prev => prev.map(c =>
      c.id === cid
        ? { ...c, replies: c.replies.map(r => r.id === rid ? { ...r, liked: !r.liked } : r) }
        : c
    ));
  };

  const handleReply = (name) => {
    setReplyingTo(name);
    setInput(`@${name} `);
    inputRef.current?.focus();
  };

  const submitComment = () => {
    const text = input.trim();
    if (!text) return;
    const newComment = {
      id: `c${Date.now()}`, avatar: '🧑‍💻', name: 'You', time: 'Just now',
      verified: false, text, likes: 0, liked: false, replies: [],
    };
    setComments(prev => [...prev, newComment]);
    setInput('');
    setReplyingTo(null);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Post</Text>
        <TouchableOpacity style={s.shareBtn}>
          <Text style={{ fontSize: 18 }}>↗️</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Post card */}
          <View style={[s.postCard, { borderLeftColor: accent }]}>
            {/* Author */}
            <View style={s.postAuthor}>
              <TouchableOpacity
                style={[s.postAv, { backgroundColor: accentD }]}
                onPress={() => post.handle && navigation.navigate('UserProfile', { handle: post.handle })}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 18 }}>{post.avatar}</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={s.postAuthorName}>{post.name}</Text>
                <Text style={s.postTime}>{post.time}</Text>
              </View>
              <View style={[s.badgePill, { backgroundColor: accentD, borderColor: accent + '55' }]}>
                <Text style={[s.badgeTxt, { color: accent }]}>{post.badge}</Text>
              </View>
            </View>

            {/* Title + body */}
            <Text style={s.postTitle}>{post.title}</Text>
            <Text style={s.postBody}>{post.body}</Text>

            {/* Tags */}
            <View style={s.tagRow}>
              {['#OPT', '#Jobs', '#NYC'].map(t => (
                <View key={t} style={s.tag}><Text style={[s.tagTxt, { color: accent }]}>{t}</Text></View>
              ))}
            </View>

            {/* Actions */}
            <View style={s.postActions}>
              <TouchableOpacity style={s.actionBtn} onPress={likePost}>
                <Animated.Text style={{ fontSize: 18, transform: [{ scale: heartAnim }] }}>
                  {postLiked ? '❤️' : '🤍'}
                </Animated.Text>
                <Text style={[s.actionTxt, postLiked && { color: '#E8364A' }]}>
                  {postLiked ? post.likes + 1 : post.likes}
                </Text>
              </TouchableOpacity>
              <View style={s.actionBtn}>
                <Text style={{ fontSize: 18 }}>💬</Text>
                <Text style={s.actionTxt}>{comments.length + comments.reduce((a, c) => a + c.replies.length, 0)}</Text>
              </View>
              <TouchableOpacity style={s.actionBtn} onPress={() => setPostSaved(p => !p)}>
                <Text style={{ fontSize: 18 }}>{postSaved ? '🔖' : '🏷️'}</Text>
                <Text style={s.actionTxt}>{postSaved ? 'Saved' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtn}>
                <Text style={{ fontSize: 18 }}>↗️</Text>
                <Text style={s.actionTxt}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ask AI */}
          <TouchableOpacity
            style={[s.aiSuggestion, { borderColor: C.vivid + '33', backgroundColor: C.vividD }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AIAssistant')}
          >
            <Text style={{ fontSize: 20 }}>🤖</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.aiSugTitle, { color: C.cream }]}>Ask Zabroad AI about this</Text>
              <Text style={[s.aiSugSub, { color: C.c35 }]}>Get personalized OPT & job guidance</Text>
            </View>
            <Text style={{ color: C.vivid, fontSize: 16 }}>›</Text>
          </TouchableOpacity>

          {/* Comments header */}
          <View style={s.commentsHeader}>
            <Text style={s.commentsLabel}>
              COMMENTS · {comments.length + comments.reduce((a, c) => a + c.replies.length, 0)}
            </Text>
          </View>

          {/* Comments */}
          {comments.map(comment => (
            <Comment
              key={comment.id}
              comment={comment}
              C={C} s={s}
              onLike={likeComment}
              onReplyLike={likeReply}
              onReply={handleReply}
            />
          ))}
        </ScrollView>

        {/* Comment input */}
        <View style={s.inputArea}>
          {replyingTo && (
            <View style={[s.replyingBanner, { backgroundColor: C.blueD, borderColor: C.blue + '44' }]}>
              <Text style={[s.replyingTxt, { color: C.blue }]}>Replying to @{replyingTo}</Text>
              <TouchableOpacity onPress={() => { setReplyingTo(null); setInput(''); }}>
                <Text style={{ color: C.c35, fontSize: 14 }}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={s.inputRow}>
            <View style={[s.commentAvSmall, { backgroundColor: C.vividD }]}>
              <Text style={{ fontSize: 14 }}>🧑‍💻</Text>
            </View>
            <TextInput
              ref={inputRef}
              style={s.input}
              placeholder={replyingTo ? `Reply to @${replyingTo}…` : 'Add a comment…'}
              placeholderTextColor={C.c35}
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity
              style={[s.sendBtn, !input.trim() && { opacity: 0.35 }]}
              onPress={submitComment}
              disabled={!input.trim()}
            >
              <LinearGradient colors={[C.vivid, '#B82838']} style={s.sendGrad}>
                <Text style={{ color: 'white', fontSize: 15 }}>↑</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.nav },
  backBtn: { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 24, color: C.cream, lineHeight: 28 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.cream },
  shareBtn: { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  postCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderRadius: 18, padding: 16 },
  postAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  postAv: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  postAuthorName: { fontSize: 14, fontWeight: '700', color: C.cream },
  postTime: { fontSize: 11, color: C.c35, marginTop: 2 },
  badgePill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 50, borderWidth: 1 },
  badgeTxt: { fontSize: 10, fontWeight: '700' },
  postTitle: { fontSize: 17, fontWeight: '800', color: C.cream, letterSpacing: -0.3, marginBottom: 10, lineHeight: 24 },
  postBody: { fontSize: 14, color: C.c60, lineHeight: 22, marginBottom: 14 },
  tagRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  tag: { backgroundColor: C.blueD, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4 },
  tagTxt: { fontSize: 11, fontWeight: '700' },
  postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12, gap: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  actionTxt: { fontSize: 12, color: C.c35, fontWeight: '500' },
  aiSuggestion: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  aiSugTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  aiSugSub: { fontSize: 11 },
  commentsHeader: { borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 10 },
  commentsLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5 },
  commentBlock: { gap: 6 },
  commentRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  commentAv: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  commentBubble: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, borderTopLeftRadius: 4, padding: 12 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  commentName: { fontSize: 13, fontWeight: '700', color: C.cream },
  verifiedBadge: { fontSize: 9, color: C.green, backgroundColor: C.greenD, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  commentTime: { fontSize: 10, color: C.c35 },
  commentText: { fontSize: 13, color: C.c60, lineHeight: 20 },
  commentActions: { flexDirection: 'row', gap: 14, marginTop: 8 },
  commentAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentActionTxt: { fontSize: 11, color: C.c35, fontWeight: '500' },
  replyRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingLeft: 46 },
  replyLine: { position: 'absolute', left: 62, top: -6, bottom: 0, width: 1.5, backgroundColor: C.border },
  replyAv: { width: 28, height: 28, borderRadius: 9 },
  replyBubble: { backgroundColor: C.card2 },
  inputArea: { borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.nav },
  replyingBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  replyingTxt: { fontSize: 12, fontWeight: '600' },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', padding: 10 },
  commentAvSmall: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  input: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.cream, maxHeight: 100 },
  sendBtn: { width: 38, height: 38, borderRadius: 12, overflow: 'hidden' },
  sendGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
