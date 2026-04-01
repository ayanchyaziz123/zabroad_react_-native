import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, KeyboardAvoidingView, Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

// ─── Seed data per community (keyed by name) ───────────────────────────
const COMMUNITY_POSTS = {
  default: [
    {
      id: 'p1', author: 'Aisha K.', avatar: '👩🏾', role: 'Moderator', time: '2h ago',
      text: 'Welcome to the community! Drop a quick intro — where are you from and what brought you here? 🌍',
      likes: 34, comments: 12, liked: false, tag: 'Intro',
    },
    {
      id: 'p2', author: 'Marcus T.', avatar: '👨🏿', role: 'Member', time: '5h ago',
      text: 'Just got my EAD approved after 8 months!! 🎉 Happy to answer questions if anyone is waiting on theirs.',
      likes: 88, comments: 21, liked: false, tag: 'Visa Win',
    },
    {
      id: 'p3', author: 'Priya S.', avatar: '👩🏽', role: 'Member', time: '1d ago',
      text: 'Anyone know a good immigration attorney in Queens who speaks Hindi? My renewal is coming up in 3 months.',
      likes: 15, comments: 8, liked: false, tag: 'Help',
    },
    {
      id: 'p4', author: 'James L.', avatar: '👨🏻', role: 'Member', time: '2d ago',
      text: 'Heads up: there\'s a free USCIS workshop this Saturday at 10am at the Queens library. Free legal Q&A!',
      likes: 102, comments: 44, liked: false, tag: 'Event',
    },
    {
      id: 'p5', author: 'Fatima R.', avatar: '👩🏻', role: 'Member', time: '3d ago',
      text: 'Finally found a no-credit-check apartment in the Bronx! DM me for the landlord contact — he works with immigrants.',
      likes: 67, comments: 19, liked: false, tag: 'Housing',
    },
  ],
};

const COMMUNITY_MEMBERS = {
  default: [
    { name: 'Aisha K.',   avatar: '👩🏾', role: 'Moderator', flag: '🇳🇬', since: 'Since 2022' },
    { name: 'Marcus T.',  avatar: '👨🏿', role: 'Member',    flag: '🇪🇹', since: 'Since 2023' },
    { name: 'Priya S.',   avatar: '👩🏽', role: 'Member',    flag: '🇮🇳', since: 'Since 2023' },
    { name: 'James L.',   avatar: '👨🏻', role: 'Member',    flag: '🇨🇳', since: 'Since 2024' },
    { name: 'Fatima R.',  avatar: '👩🏻', role: 'Member',    flag: '🇸🇦', since: 'Since 2024' },
    { name: 'Carlos M.',  avatar: '👨🏽', role: 'Member',    flag: '🇲🇽', since: 'Since 2023' },
    { name: 'Yuna P.',    avatar: '👩🏻', role: 'Member',    flag: '🇰🇷', since: 'Since 2024' },
    { name: 'Ahmed Z.',   avatar: '👨🏽', role: 'Member',    flag: '🇧🇩', since: 'Since 2022' },
  ],
};

const TAG_COLORS = {
  Intro:     { bg: '#1A2C50', text: '#6EA8FE' },
  'Visa Win':{ bg: '#0F2D1E', text: '#52D68A' },
  Help:      { bg: '#2A1F36', text: '#C084FC' },
  Event:     { bg: '#2C1F0E', text: '#FDB970' },
  Housing:   { bg: '#1A2A1A', text: '#86EFAC' },
};

const TABS = ['Posts', 'Members', 'About'];

export default function CommunityDetailScreen({ navigation, route }) {
  const community = route.params?.community || {
    flag: '🌍', name: 'Community', loc: 'Worldwide', members: '1K',
    tags: ['Community'], joined: false,
    description: 'A welcoming community for immigrants worldwide.',
  };

  const { colors: C, isDark } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  // privacy: 'public' | 'approval' | 'invite'
  const privacy = community.privacy ?? 'public';
  const isPrivate = privacy === 'approval' || privacy === 'invite';

  const [activeTab,    setActiveTab]    = useState('Posts');
  const [isJoined,     setIsJoined]     = useState(community.joined ?? false);
  const [requestSent,  setRequestSent]  = useState(false);
  const [memberCount,  setMemberCount]  = useState(community.members);
  const [postText,     setPostText]     = useState('');
  const [posting,      setPosting]      = useState(false);

  // Pending requests list (moderator view simulation)
  const [pendingRequests, setPendingRequests] = useState([
    { id: 'r1', name: 'Tanvir H.', avatar: '👨🏽', flag: '🇧🇩', time: '10 min ago' },
    { id: 'r2', name: 'Sofia D.',  avatar: '👩🏻', flag: '🇲🇽', time: '1h ago' },
  ]);

  const posts = COMMUNITY_POSTS.default;
  const members = COMMUNITY_MEMBERS.default;

  const [likes, setLikes] = useState(
    posts.reduce((a, p) => ({ ...a, [p.id]: { count: p.likes, liked: p.liked } }), {})
  );

  const heartScales = useRef(
    posts.reduce((a, p) => ({ ...a, [p.id]: new Animated.Value(1) }), {})
  ).current;

  function toggleLike(id) {
    const prev = likes[id];
    const scale = heartScales[id];
    setLikes(l => ({
      ...l,
      [id]: { count: prev.liked ? prev.count - 1 : prev.count + 1, liked: !prev.liked },
    }));
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, speed: 40, bounciness: 12 }),
      Animated.spring(scale, { toValue: 1,   useNativeDriver: true, speed: 20 }),
    ]).start();
  }

  function handlePost() {
    if (!postText.trim()) return;
    setPosting(true);
    setTimeout(() => { setPostText(''); setPosting(false); }, 800);
  }

  function handleJoin() {
    if (isJoined) {
      // Leave
      setIsJoined(false);
      setRequestSent(false);
      return;
    }
    if (isPrivate) {
      // Send join request instead of joining instantly
      setRequestSent(true);
    } else {
      setIsJoined(true);
    }
  }

  function approveRequest(id) {
    setPendingRequests(prev => prev.filter(r => r.id !== id));
  }

  function denyRequest(id) {
    setPendingRequests(prev => prev.filter(r => r.id !== id));
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{community.name}</Text>
        <TouchableOpacity
          style={[s.joinBtn, isJoined ? s.joinedStyle : requestSent ? s.pendingStyle : s.openStyle]}
          onPress={handleJoin}
          activeOpacity={0.8}
          disabled={requestSent && !isJoined}
        >
          <Text style={[s.joinBtnTxt, { color: isJoined ? C.green : requestSent ? C.gold : C.vivid }]}>
            {isJoined ? '✓ Joined' : requestSent ? '⏳ Pending' : isPrivate ? '🔒 Request' : '+ Join'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Community hero */}
      <LinearGradient
        colors={isDark ? ['#1E2438', '#0D0F1A'] : ['#EEF0FA', '#E4E7F5']}
        style={s.hero}
      >
        <Text style={s.heroFlag}>{community.flag}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.heroName}>{community.name}</Text>
          <Text style={s.heroMeta}>📍 {community.loc}  ·  👥 {memberCount} members</Text>
          {isPrivate && (
            <View style={s.privacyBadge}>
              <Text style={s.privacyBadgeTxt}>
                {privacy === 'approval' ? '🔒 Approval required' : '✉️ Invite only'}
              </Text>
            </View>
          )}
          <View style={s.tagRow}>
            {(community.tags || []).slice(0, 3).map(t => (
              <View key={t} style={s.tag}>
                <Text style={s.tagTxt}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={s.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[s.tabBtn, activeTab === t && s.tabBtnActive]}
            onPress={() => setActiveTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabTxt, activeTab === t && s.tabTxtActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* POSTS tab */}
      {activeTab === 'Posts' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
            {/* Compose box */}
            {isJoined && (
              <View style={s.composeCard}>
                <Text style={{ fontSize: 28 }}>👤</Text>
                <View style={{ flex: 1, gap: 8 }}>
                  <TextInput
                    style={s.composeInput}
                    placeholder="Share something with the community…"
                    placeholderTextColor={C.c35}
                    value={postText}
                    onChangeText={setPostText}
                    multiline
                    maxLength={500}
                  />
                  {postText.length > 0 && (
                    <TouchableOpacity
                      style={[s.postBtn, { opacity: posting ? 0.6 : 1 }]}
                      onPress={handlePost}
                      activeOpacity={0.8}
                      disabled={posting}
                    >
                      <Text style={s.postBtnTxt}>{posting ? 'Posting…' : 'Post'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {!isJoined && !requestSent && (
              <TouchableOpacity style={s.joinPrompt} onPress={handleJoin} activeOpacity={0.8}>
                <Text style={{ fontSize: 20 }}>{isPrivate ? '🔒' : '🏘️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.joinPromptTitle}>{isPrivate ? 'Private community' : 'Join to participate'}</Text>
                  <Text style={s.joinPromptSub}>
                    {isPrivate
                      ? privacy === 'approval' ? 'Request to join — a moderator will review' : 'This community is invite-only'
                      : 'Post, reply, and connect with members'}
                  </Text>
                </View>
                {privacy !== 'invite' && (
                  <Text style={[s.joinBtnTxt, { color: C.vivid, fontSize: 13 }]}>
                    {isPrivate ? 'Request →' : 'Join →'}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {!isJoined && requestSent && (
              <View style={s.pendingBanner}>
                <Text style={{ fontSize: 22 }}>⏳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.pendingTitle}>Request sent!</Text>
                  <Text style={s.pendingSub}>A moderator will review your request. You'll be notified when approved.</Text>
                </View>
              </View>
            )}

            {posts.map((post, index) => {
              const likeState = likes[post.id];
              const tagStyle = TAG_COLORS[post.tag] || TAG_COLORS.Help;
              // Blur posts for private communities when not joined
              const isBlurred = isPrivate && !isJoined && index > 0;
              return (
                <View key={post.id} style={[s.postCard, isBlurred && s.postCardBlurred]}
                  pointerEvents={isBlurred ? 'none' : 'auto'}
                >
                  <View style={s.postHeader}>
                    <View style={s.avatarCircle}>
                      <Text style={{ fontSize: 20 }}>{post.avatar}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={s.postAuthor}>{post.author}</Text>
                        {post.role === 'Moderator' && (
                          <View style={s.modBadge}>
                            <Text style={s.modTxt}>MOD</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.postTime}>{post.time}</Text>
                    </View>
                    <View style={[s.postTag, { backgroundColor: tagStyle.bg }]}>
                      <Text style={[s.postTagTxt, { color: tagStyle.text }]}>{post.tag}</Text>
                    </View>
                  </View>
                  <Text style={s.postText}>{post.text}</Text>
                  <View style={s.postActions}>
                    <TouchableOpacity style={s.actionBtn} onPress={() => toggleLike(post.id)} activeOpacity={0.7}>
                      <Animated.Text style={{ fontSize: 16, transform: [{ scale: heartScales[post.id] }] }}>
                        {likeState.liked ? '❤️' : '🤍'}
                      </Animated.Text>
                      <Text style={[s.actionTxt, likeState.liked && { color: '#FF6B6B' }]}>{likeState.count}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.actionBtn}
                      onPress={() => navigation.navigate('PostDetail', { post })}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 16 }}>💬</Text>
                      <Text style={s.actionTxt}>{post.comments}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.actionBtn} activeOpacity={0.7}>
                      <Text style={{ fontSize: 16 }}>🔗</Text>
                      <Text style={s.actionTxt}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* MEMBERS tab */}
      {activeTab === 'Members' && (
        <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, gap: 10 }} showsVerticalScrollIndicator={false}>

          {/* Pending requests — shown to moderators when community is private */}
          {isPrivate && pendingRequests.length > 0 && (
            <View style={{ gap: 8, marginBottom: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.sectionLabel}>PENDING REQUESTS</Text>
                <View style={s.pendingCountBadge}>
                  <Text style={s.pendingCountTxt}>{pendingRequests.length}</Text>
                </View>
              </View>
              {pendingRequests.map(req => (
                <View key={req.id} style={s.requestRow}>
                  <View style={s.memberAvatar}>
                    <Text style={{ fontSize: 22 }}>{req.avatar}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.memberName}>{req.name}</Text>
                    <Text style={s.memberMeta}>{req.flag} · Requested {req.time}</Text>
                  </View>
                  <TouchableOpacity style={s.approveBtn} onPress={() => approveRequest(req.id)} activeOpacity={0.8}>
                    <Text style={s.approveTxt}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.denyBtn} onPress={() => denyRequest(req.id)} activeOpacity={0.8}>
                    <Text style={s.denyTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <Text style={s.sectionLabel}>{memberCount} MEMBERS</Text>
          {members.map(m => (
            <View key={m.name} style={s.memberRow}>
              <View style={s.memberAvatar}>
                <Text style={{ fontSize: 24 }}>{m.avatar}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={s.memberName}>{m.name}</Text>
                  {m.role === 'Moderator' && (
                    <View style={s.modBadge}>
                      <Text style={s.modTxt}>MOD</Text>
                    </View>
                  )}
                </View>
                <Text style={s.memberMeta}>{m.flag} · {m.since}</Text>
              </View>
              <TouchableOpacity style={s.msgBtn} activeOpacity={0.7}>
                <Text style={{ fontSize: 14 }}>💬</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ABOUT tab */}
      {activeTab === 'About' && (
        <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
          {/* Description */}
          <View style={s.aboutCard}>
            <Text style={s.aboutLabel}>About This Community</Text>
            <Text style={s.aboutBody}>
              {community.description ||
                `${community.name} is a welcoming space for immigrants in ${community.loc}. We share resources, support each other through visa processes, housing searches, and job hunting. Everyone is welcome regardless of status.`}
            </Text>
          </View>

          {/* Stats */}
          <View style={s.statsRow}>
            {[
              { icon: '👥', val: memberCount, label: 'Members' },
              { icon: '📝', val: `${posts.length * 12}`, label: 'Posts' },
              { icon: '🗓️', val: '2022', label: 'Founded' },
            ].map(stat => (
              <View key={stat.label} style={s.statBox}>
                <Text style={{ fontSize: 22 }}>{stat.icon}</Text>
                <Text style={s.statVal}>{stat.val}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Rules */}
          <View style={s.aboutCard}>
            <Text style={s.aboutLabel}>Community Rules</Text>
            {[
              'Be respectful — no hate speech or discrimination',
              'No spam or self-promotion without approval',
              'Keep immigration advice general, not legal advice',
              'Verify housing/job listings before sharing',
              'Protect personal info — never share others\' docs',
            ].map((rule, i) => (
              <View key={i} style={s.ruleRow}>
                <View style={s.ruleBullet}>
                  <Text style={s.ruleBulletTxt}>{i + 1}</Text>
                </View>
                <Text style={s.ruleTxt}>{rule}</Text>
              </View>
            ))}
          </View>

          {/* Moderators */}
          <View style={s.aboutCard}>
            <Text style={s.aboutLabel}>Moderators</Text>
            {members.filter(m => m.role === 'Moderator').map(m => (
              <View key={m.name} style={[s.memberRow, { paddingHorizontal: 0, paddingVertical: 8 }]}>
                <View style={s.memberAvatar}>
                  <Text style={{ fontSize: 22 }}>{m.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.memberName}>{m.name}</Text>
                  <Text style={s.memberMeta}>{m.flag} · {m.since}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.nav },
  back: { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  backTxt: { fontSize: 24, color: C.cream, lineHeight: 28 },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.cream },
  joinBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, flexShrink: 0 },
  joinedStyle: { backgroundColor: C.greenD, borderColor: C.green + '44' },
  openStyle: { backgroundColor: C.vividD, borderColor: C.vivid + '44' },
  joinBtnTxt: { fontSize: 12, fontWeight: '700' },
  hero: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  heroFlag: { fontSize: 46, marginTop: 2 },
  heroName: { fontSize: 16, fontWeight: '800', color: C.cream, marginBottom: 4 },
  heroMeta: { fontSize: 12, color: C.c35, marginBottom: 8 },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { backgroundColor: C.blueD, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3 },
  tagTxt: { fontSize: 10, color: C.blue, fontWeight: '600' },
  tabBar: { flexDirection: 'row', backgroundColor: C.nav, borderBottomWidth: 1, borderBottomColor: C.border },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: C.vivid },
  tabTxt: { fontSize: 13, fontWeight: '600', color: C.c35 },
  tabTxtActive: { color: C.vivid },
  scroll: { flex: 1 },
  composeCard: { flexDirection: 'row', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14 },
  composeInput: { fontSize: 14, color: C.cream, minHeight: 40 },
  postBtn: { alignSelf: 'flex-end', backgroundColor: C.vivid, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 50 },
  postBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  joinPrompt: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.vividD, borderWidth: 1, borderColor: C.vivid + '33', borderRadius: 16, padding: 14 },
  joinPromptTitle: { fontSize: 13, fontWeight: '700', color: C.cream },
  joinPromptSub: { fontSize: 11, color: C.c35, marginTop: 2 },
  postCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, gap: 10 },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatarCircle: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  postAuthor: { fontSize: 13, fontWeight: '700', color: C.cream },
  postTime: { fontSize: 11, color: C.c35, marginTop: 1 },
  modBadge: { backgroundColor: C.goldD, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  modTxt: { fontSize: 8, fontWeight: '800', color: C.gold, letterSpacing: 0.8 },
  postTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, marginLeft: 'auto' },
  postTagTxt: { fontSize: 10, fontWeight: '700' },
  postText: { fontSize: 14, color: C.cream, lineHeight: 21 },
  postActions: { flexDirection: 'row', gap: 16, paddingTop: 4, borderTopWidth: 1, borderTopColor: C.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionTxt: { fontSize: 12, color: C.c35, fontWeight: '600' },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 4 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 12 },
  memberAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  memberName: { fontSize: 14, fontWeight: '700', color: C.cream },
  memberMeta: { fontSize: 11, color: C.c35, marginTop: 1 },
  msgBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  pendingStyle: { backgroundColor: C.goldD, borderColor: C.gold + '44' },
  privacyBadge: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: C.goldD, borderRadius: 50, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: C.gold + '44' },
  privacyBadgeTxt: { fontSize: 10, color: C.gold, fontWeight: '700' },
  pendingBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: C.goldD, borderWidth: 1, borderColor: C.gold + '44', borderRadius: 16, padding: 14 },
  pendingTitle: { fontSize: 13, fontWeight: '700', color: C.cream, marginBottom: 2 },
  pendingSub: { fontSize: 11, color: C.c35, lineHeight: 16 },
  postCardBlurred: { opacity: 0.25 },
  pendingCountBadge: { backgroundColor: C.vivid, borderRadius: 50, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  pendingCountTxt: { fontSize: 9, fontWeight: '800', color: '#fff' },
  requestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.goldD, borderWidth: 1, borderColor: C.gold + '33', borderRadius: 14, padding: 12 },
  approveBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.greenD, borderWidth: 1, borderColor: C.green + '44', alignItems: 'center', justifyContent: 'center' },
  approveTxt: { fontSize: 14, color: C.green, fontWeight: '800' },
  denyBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.vividD, borderWidth: 1, borderColor: C.vivid + '44', alignItems: 'center', justifyContent: 'center' },
  denyTxt: { fontSize: 12, color: C.vivid, fontWeight: '800' },
  aboutCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16, gap: 10 },
  aboutLabel: { fontSize: 11, fontWeight: '700', color: C.c35, letterSpacing: 1 },
  aboutBody: { fontSize: 14, color: C.cream, lineHeight: 21 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 18, fontWeight: '800', color: C.cream },
  statLabel: { fontSize: 10, color: C.c35, fontWeight: '600' },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ruleBullet: { width: 22, height: 22, borderRadius: 7, backgroundColor: C.vividD, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  ruleBulletTxt: { fontSize: 10, fontWeight: '800', color: C.vivid },
  ruleTxt: { flex: 1, fontSize: 13, color: C.cream, lineHeight: 19 },
});
