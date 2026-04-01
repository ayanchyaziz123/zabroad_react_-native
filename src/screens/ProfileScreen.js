import React, { useMemo, useState, useRef } from 'react';
import { Animated } from 'react-native';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

const JOURNEY = [
  { label: 'F-1\nStudent', key: 'done'    },
  { label: 'STEM\nOPT',    key: 'current' },
  { label: 'H-1B',         key: 'next'    },
  { label: 'Green\nCard',  key: 'next'    },
];

const BADGES = [
  { icon: '🌍', label: 'Globetrotter' },
  { icon: '💬', label: 'Helper'       },
  { icon: '⭐', label: 'Top Rated'    },
];

const MY_POSTS = [
  { id: 'mp1', tag: 'Q&A',    title: 'Best H-1B attorneys in Queens under $2K?',        body: 'Looking for recommendations for affordable immigration attorneys who handle H-1B transfers. Budget is around $2K total.',  likes: 28,  comments: 11, time: '2d ago'  },
  { id: 'mp2', tag: 'TIP',    title: 'How I passed my driving test on the first try',   body: 'Coming from Bangladesh where I never drove, passing the NY driving test felt impossible. Here\'s exactly what I did.',       likes: 74,  comments: 19, time: '5d ago'  },
  { id: 'mp3', tag: 'WIN 🎉', title: 'STEM OPT extension approved in 6 weeks!',         body: 'Filed my STEM OPT extension 90 days before expiry and got the approval in just 6 weeks. Timeline and tips inside.',         likes: 142, comments: 34, time: '2w ago'  },
  { id: 'mp4', tag: 'Q&A',    title: 'Can I open a Chase bank account on OPT?',         body: 'Just started my OPT and want to open a US bank account. Chase told me I need SSN — but my SSN card hasn\'t arrived yet.',   likes: 41,  comments: 22, time: '3w ago'  },
  { id: 'mp5', tag: 'Housing','title': 'Jackson Heights vs Flushing for Bangladeshis?', body: 'Moving out of my shared place next month. Both neighbourhoods have a big BD community. Which is better for a single guy?',  likes: 56,  comments: 30, time: '1mo ago' },
];

const SAVED_ITEMS = [
  { id: 's1', icon: '💼', type: 'Job',       title: 'Frontend Engineer – Stripe',       sub: 'Manhattan, NY · H-1B sponsored',     route: 'Jobs',      accentKey: 'green'  },
  { id: 's2', icon: '🏠', type: 'Housing',   title: '1BR in Jackson Heights – $1,450/mo',sub: 'Queens, NY · No credit check',       route: 'Housing',   accentKey: 'gold'   },
  { id: 's3', icon: '📋', type: 'Visa',      title: 'STEM OPT Extension Guide',         sub: 'F-1 students · 24-month extension',  route: 'Visa',      accentKey: 'vivid'  },
  { id: 's4', icon: '⚖️', type: 'Attorney',  title: 'Mehta & Associates Immigration',   sub: 'Manhattan, NY · Free consult',       route: 'Attorney',  accentKey: 'purple' },
  { id: 's5', icon: '🩺', type: 'Doctor',    title: 'Dr. Ayesha Karim – Family Medicine',sub: 'Queens, NY · Accepts Medicaid',     route: 'Healthcare',accentKey: 'teal'   },
];

const TAG_BG = {
  'Q&A':     { bg: '#1A2C50', text: '#6EA8FE' },
  'WIN 🎉':  { bg: '#0F2D1E', text: '#52D68A' },
  'Housing': { bg: '#1A2A1A', text: '#86EFAC' },
  'TIP':     { bg: '#0F2D1E', text: '#86EFAC' },
};

export default function ProfileScreen({ navigation }) {
  const { colors: C, isDark, toggleTheme } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const [editVisible, setEditVisible] = useState(false);
  const [editName,    setEditName]    = useState('Azizur Rahman');
  const [editHandle,  setEditHandle]  = useState('ayan');
  const [editBio,     setEditBio]     = useState('AI Researcher navigating the immigrant experience in NYC. Here to help & learn together.');
  const [editCity,    setEditCity]    = useState('Queens, New York 🇺🇸');
  const [displayName, setDisplayName] = useState('Azizur Rahman');
  const [displayHandle, setDisplayHandle] = useState('ayan · Queens, New York 🇺🇸');
  const [displayBio,  setDisplayBio]  = useState('AI Researcher navigating the immigrant experience in NYC. Here to help & learn together.');

  const [activeTab, setActiveTab] = useState('Posts');

  const saveEdit = () => {
    setDisplayName(editName);
    setDisplayHandle(`${editHandle} · ${editCity}`);
    setDisplayBio(editBio);
    setEditVisible(false);
  };

  const MENU = [
    { icon: '🤖', bg: C.vividD,  label: 'AI Visa Assistant',   sub: 'Ask anything about your visa status', badge: null, route: 'AIAssistant'   },
    { icon: '💼', bg: C.blueD,   label: 'My Job Applications', sub: '3 active · 1 interview pending',      badge: '3',  route: 'Jobs'           },
    { icon: '🏠', bg: C.goldD,   label: 'Saved Listings',      sub: 'Housing, doctors, communities',       badge: null, route: 'Housing'        },
    { icon: '🏘️', bg: C.greenD,  label: 'My Communities',      sub: 'Member of 3 communities',            badge: null, route: 'Community'      },
    { icon: '🩺', bg: C.tealD,   label: 'Healthcare Records',  sub: 'Insurance, appointments & docs',     badge: null, route: 'Healthcare'     },
    { icon: '📄', bg: C.purpleD, label: 'Visa & Documents',    sub: 'Guides, deadlines & legal resources', badge: null, route: 'Visa'           },
    { icon: '🔔', bg: C.vividD,  label: 'Notifications',       sub: '5 new alerts',                       badge: '5',  route: 'Notifications'  },
    { icon: '⚙️', bg: C.card3,   label: 'Settings',            sub: 'Privacy, language, account',         badge: null, route: 'Settings'       },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>

        {/* COVER */}
        <LinearGradient colors={isDark ? ['#1E1535','#120D22'] : ['#DDD6FF','#EEF0FA']} style={s.cover}>
          <View style={s.coverGlow} />
          <Text style={s.coverZ}>Z</Text>
        </LinearGradient>

        {/* AVATAR */}
        <View style={s.avWrap}>
          <LinearGradient colors={[C.vivid, '#8B1525']} style={s.av}>
            <Text style={{ fontSize: 34 }}>🧑‍💻</Text>
            <View style={s.verified}><Text style={{ fontSize: 10, color: 'white' }}>✓</Text></View>
          </LinearGradient>
        </View>

        {/* INFO */}
        <View style={s.info}>
          <Text style={s.name}>{displayName}</Text>
          <Text style={s.handle}>@{displayHandle}</Text>
          <Text style={s.bio}>{displayBio}</Text>
          <View style={s.tags}>
            {[
              { label: 'STEM OPT',     colorKey: 'vivid'  },
              { label: 'AI Researcher',colorKey: 'teal'   },
              { label: '3 yrs abroad', colorKey: 'gold'   },
            ].map((t, i) => (
              <View key={i} style={[s.tag, { backgroundColor: C[t.colorKey + 'D'], borderColor: C[t.colorKey] + '44' }]}>
                <Text style={[s.tagTxt, { color: C[t.colorKey] }]}>{t.label}</Text>
              </View>
            ))}
          </View>
          <View style={s.actionRow}>
            <TouchableOpacity style={s.editBtn} onPress={() => setEditVisible(true)}><Text style={s.editTxt}>✏️ Edit Profile</Text></TouchableOpacity>
            <TouchableOpacity style={s.shareBtn}><Text style={{ fontSize: 16 }}>↗️</Text></TouchableOpacity>
          </View>
        </View>

        {/* STATS */}
        <View style={s.stats}>
          {[{ num: '142', label: 'Posts' }, { num: '2.4K', label: 'Connections' }, { num: '★ 4.9', label: 'Reputation' }].map((stat, i) => (
            <View key={i} style={[s.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: C.border }]}>
              <Text style={s.statNum}>{stat.num}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── TABS ─────────────────────────────────────────────── */}
        <View style={s.tabBar}>
          {['Posts', 'Activity', 'Saved'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabTxt, activeTab === tab && s.tabTxtActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── POSTS TAB ────────────────────────────────────────── */}
        {activeTab === 'Posts' && (
          <View style={s.section}>
            {MY_POSTS.map(post => {
              const tagStyle = TAG_BG[post.tag] || TAG_BG['Q&A'];
              return (
                <TouchableOpacity
                  key={post.id}
                  style={s.postCard}
                  onPress={() => navigation.navigate('PostDetail', { post })}
                  activeOpacity={0.9}
                >
                  <View style={s.postHeader}>
                    <View style={[s.postTagPill, { backgroundColor: tagStyle.bg }]}>
                      <Text style={[s.postTagTxt, { color: tagStyle.text }]}>{post.tag}</Text>
                    </View>
                    <Text style={s.postTime}>{post.time}</Text>
                  </View>
                  <Text style={s.postTitle}>{post.title}</Text>
                  <Text style={s.postBody} numberOfLines={2}>{post.body}</Text>
                  <View style={s.postFooter}>
                    <Text style={s.postStat}>🤍 {post.likes}</Text>
                    <Text style={s.postStat}>💬 {post.comments}</Text>
                    <Text style={s.postStat}>↗️ Share</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── ACTIVITY TAB ─────────────────────────────────────── */}
        {activeTab === 'Activity' && (
          <>
            {/* Badges */}
            <View style={s.section}>
              <Text style={s.secTitle}>Badges Earned</Text>
              <View style={s.badgeRow}>
                {BADGES.map((b, i) => (
                  <View key={i} style={s.badgeItem}>
                    <View style={s.badgeIcon}><Text style={{ fontSize: 22 }}>{b.icon}</Text></View>
                    <Text style={s.badgeLabel}>{b.label}</Text>
                  </View>
                ))}
                <View style={[s.badgeItem, { opacity: 0.3 }]}>
                  <View style={s.badgeIcon}><Text style={{ fontSize: 22 }}>🔒</Text></View>
                  <Text style={s.badgeLabel}>Locked</Text>
                </View>
              </View>
            </View>

            {/* Immigration Journey */}
            <View style={s.section}>
              <View style={s.journeyCard}>
                <View style={s.jHeader}>
                  <Text style={s.jTitle}>🗺 Immigration Journey</Text>
                  <Text style={s.jPct}>40%</Text>
                </View>
                <View style={s.progressBg}>
                  <View style={[s.progressFill, { width: '40%' }]} />
                </View>
                <View style={s.stepsRow}>
                  {JOURNEY.map((step, i) => {
                    const isDone    = step.key === 'done';
                    const isCurrent = step.key === 'current';
                    return (
                      <React.Fragment key={i}>
                        <View style={s.step}>
                          <View style={[s.stepCircle, isDone ? s.stepDone : isCurrent ? s.stepCurrent : s.stepNext]}>
                            <Text style={[s.stepTxt, { color: isDone ? 'white' : isCurrent ? C.vivid : C.c35 }]}>
                              {isDone ? '✓' : isCurrent ? '→' : step.label.split('\n')[0]}
                            </Text>
                          </View>
                          <Text style={[s.stepLabel, isCurrent && { color: C.vivid, fontWeight: '700' }]}>{step.label}</Text>
                        </View>
                        {i < JOURNEY.length - 1 && (
                          <View style={[s.stepLine, isDone ? s.stepLineDone : s.stepLineNext]} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>
                <View style={s.jStatus}>
                  <Text style={s.jStatusTxt}>
                    <Text style={{ color: C.vivid, fontWeight: '700' }}>Current: </Text>
                    STEM OPT active · EAD expires May 2027 ·{' '}
                    <Text style={{ color: C.vivid, fontWeight: '700' }}>Next: </Text>
                    H-1B cap registration opens March 2027
                  </Text>
                </View>
              </View>
            </View>

            {/* Theme toggle */}
            <View style={s.section}>
              <Text style={s.secTitle}>Appearance</Text>
              <View style={s.themeCard}>
                <View style={s.themeLeft}>
                  <View style={[s.themeIcon, { backgroundColor: isDark ? C.card3 : C.goldD }]}>
                    <Text style={{ fontSize: 20 }}>{isDark ? '🌙' : '☀️'}</Text>
                  </View>
                  <View>
                    <Text style={s.themeLabel}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
                    <Text style={s.themeSub}>{isDark ? 'Switch to light' : 'Switch to dark'}</Text>
                  </View>
                </View>
                <Switch value={!isDark} onValueChange={toggleTheme} trackColor={{ false: C.card3, true: C.vivid + '88' }} thumbColor={isDark ? C.c35 : C.vivid} />
              </View>
            </View>

            {/* Menu */}
            <View style={s.section}>
              <Text style={s.secTitle}>My Account</Text>
              <View style={s.menuCard}>
                {MENU.map((item, i) => (
                  <TouchableOpacity key={i} style={[s.menuItem, i < MENU.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]} activeOpacity={0.7} onPress={() => item.route && navigation.navigate(item.route)}>
                    <View style={[s.menuIcon, { backgroundColor: item.bg }]}>
                      <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                    </View>
                    <View style={s.menuText}>
                      <Text style={s.menuLabel}>{item.label}</Text>
                      <Text style={s.menuSub}>{item.sub}</Text>
                    </View>
                    {item.badge ? (
                      <View style={s.menuBadge}><Text style={s.menuBadgeTxt}>{item.badge}</Text></View>
                    ) : (
                      <Text style={s.menuArrow}>›</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={s.logoutBtn} activeOpacity={0.8} onPress={() => navigation.replace('Welcome')}>
              <Text style={s.logoutTxt}>🚪 Sign Out</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── SAVED TAB ────────────────────────────────────────── */}
        {activeTab === 'Saved' && (
          <View style={s.section}>
            {SAVED_ITEMS.map(item => (
              <TouchableOpacity
                key={item.id}
                style={s.savedCard}
                onPress={() => navigation.navigate(item.route)}
                activeOpacity={0.85}
              >
                <View style={[s.savedIcon, { backgroundColor: C[item.accentKey + 'D'] }]}>
                  <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.savedTitle}>{item.title}</Text>
                  <Text style={s.savedSub}>{item.sub}</Text>
                </View>
                <View style={[s.savedTypePill, { backgroundColor: C[item.accentKey + 'D'] }]}>
                  <Text style={[s.savedTypeTxt, { color: C[item.accentKey] }]}>{item.type}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.bg }}>
          {/* Modal header */}
          <View style={[s.modalHeader, { borderBottomColor: C.border, backgroundColor: C.nav }]}>
            <TouchableOpacity onPress={() => setEditVisible(false)} style={s.modalCancel}>
              <Text style={[s.modalCancelTxt, { color: C.c35 }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[s.modalTitle, { color: C.cream }]}>Edit Profile</Text>
            <TouchableOpacity onPress={saveEdit} style={[s.modalSave, { backgroundColor: C.vivid }]}>
              <Text style={s.modalSaveTxt}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
            {/* Avatar picker hint */}
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              <LinearGradient colors={[C.vivid, '#8B1525']} style={[s.av, { marginBottom: 10 }]}>
                <Text style={{ fontSize: 34 }}>🧑‍💻</Text>
              </LinearGradient>
              <Text style={[s.editAvatarHint, { color: C.vivid }]}>Change photo</Text>
            </View>

            {[
              { label: 'Full Name',       value: editName,   onChange: setEditName,   placeholder: 'Your full name',      kb: 'default'        },
              { label: 'Username',        value: editHandle, onChange: setEditHandle, placeholder: 'username',            kb: 'default'        },
              { label: 'City & Country',  value: editCity,   onChange: setEditCity,   placeholder: 'e.g. Queens, NY 🇺🇸', kb: 'default'        },
            ].map((f, i) => (
              <View key={i}>
                <Text style={[s.editLabel, { color: C.c35 }]}>{f.label}</Text>
                <View style={[s.editInputWrap, { backgroundColor: C.card, borderColor: C.border }]}>
                  <TextInput
                    style={[s.editInput, { color: C.cream }]}
                    value={f.value}
                    onChangeText={f.onChange}
                    placeholder={f.placeholder}
                    placeholderTextColor={C.c35}
                    keyboardType={f.kb}
                    autoCapitalize={f.kb === 'email-address' ? 'none' : 'words'}
                  />
                </View>
              </View>
            ))}

            <View>
              <Text style={[s.editLabel, { color: C.c35 }]}>Bio</Text>
              <View style={[s.editInputWrap, { backgroundColor: C.card, borderColor: C.border, height: 100, alignItems: 'flex-start', paddingVertical: 12 }]}>
                <TextInput
                  style={[s.editInput, { color: C.cream, height: '100%' }]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Tell the community about yourself…"
                  placeholderTextColor={C.c35}
                  multiline
                  textAlignVertical="top"
                  maxLength={160}
                />
              </View>
              <Text style={[s.editCharCount, { color: C.c35 }]}>{editBio.length}/160</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  cover: { height: 130, overflow: 'hidden', position: 'relative' },
  coverGlow: { position: 'absolute', top: -40, right: -40, width: 180, height: 180, backgroundColor: 'rgba(232,54,74,0.1)', borderRadius: 90 },
  coverZ: { position: 'absolute', fontSize: 120, fontWeight: '900', color: 'rgba(232,54,74,0.06)', bottom: -30, left: -10 },
  avWrap: { alignItems: 'center', marginTop: -38, zIndex: 5 },
  av: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.bg, shadowColor: C.vivid, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
  verified: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, backgroundColor: C.green, borderRadius: 8, borderWidth: 2, borderColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  info: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 12 },
  name: { fontSize: 22, fontWeight: '800', color: C.cream, letterSpacing: -0.3, marginBottom: 4 },
  handle: { fontSize: 12, color: C.c35, marginBottom: 10 },
  bio: { fontSize: 13, color: C.c60, textAlign: 'center', lineHeight: 20, marginBottom: 14 },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 },
  tag: { borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  tagTxt: { fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  editBtn: { flex: 1, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border2, borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  editTxt: { fontSize: 13, fontWeight: '600', color: C.cream },
  shareBtn: { width: 44, height: 44, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border2, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', marginHorizontal: 22, marginTop: 18, backgroundColor: C.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  statItem: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: C.cream, marginBottom: 3 },
  statLabel: { fontSize: 10, color: C.c35 },
  section: { paddingHorizontal: 22, marginTop: 20 },
  secTitle: { fontSize: 11, fontWeight: '700', color: C.c35, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 12 },
  badgeItem: { alignItems: 'center', gap: 6 },
  badgeIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border2, alignItems: 'center', justifyContent: 'center' },
  badgeLabel: { fontSize: 10, color: C.c35, fontWeight: '600' },
  journeyCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 18 },
  jHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  jTitle: { fontSize: 14, fontWeight: '700', color: C.cream },
  jPct: { fontSize: 18, fontWeight: '800', color: C.vivid },
  progressBg: { height: 4, backgroundColor: C.card2, borderRadius: 2, marginBottom: 14 },
  progressFill: { height: 4, backgroundColor: C.vivid, borderRadius: 2 },
  stepsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  step: { alignItems: 'center', flex: 1 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  stepDone: { backgroundColor: C.vivid },
  stepCurrent: { backgroundColor: C.card2, borderWidth: 2, borderColor: C.vivid },
  stepNext: { backgroundColor: C.card2, borderWidth: 1, borderColor: C.border2 },
  stepTxt: { fontSize: 11, fontWeight: '700' },
  stepLabel: { fontSize: 9, color: C.c35, textAlign: 'center', lineHeight: 13 },
  stepLine: { flex: 1, height: 2, marginBottom: 22 },
  stepLineDone: { backgroundColor: C.vivid },
  stepLineNext: { backgroundColor: C.border2 },
  jStatus: { backgroundColor: C.vividD, borderWidth: 1, borderColor: C.vivid + '33', borderRadius: 10, padding: 10 },
  jStatusTxt: { fontSize: 12, color: C.c60, lineHeight: 18 },
  themeCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  themeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  themeIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  themeLabel: { fontSize: 14, fontWeight: '600', color: C.cream, marginBottom: 2 },
  themeSub: { fontSize: 11, color: C.c35 },
  menuCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 20, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  menuIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: C.cream, marginBottom: 2 },
  menuSub: { fontSize: 11, color: C.c35 },
  menuArrow: { fontSize: 18, color: C.c35 },
  menuBadge: { backgroundColor: C.vivid, borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3 },
  menuBadgeTxt: { fontSize: 10, fontWeight: '700', color: 'white' },
  logoutBtn: { marginHorizontal: 22, marginTop: 20, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  logoutTxt: { fontSize: 14, fontWeight: '600', color: C.c35 },
  // Tabs
  tabBar:       { flexDirection: 'row', marginHorizontal: 22, marginTop: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, overflow: 'hidden' },
  tabBtn:       { flex: 1, paddingVertical: 11, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: C.vivid },
  tabTxt:       { fontSize: 13, fontWeight: '600', color: C.c35 },
  tabTxtActive: { color: C.vivid },
  // Posts tab
  postCard:    { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, gap: 8, marginBottom: 10 },
  postHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  postTagPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  postTagTxt:  { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  postTime:    { fontSize: 11, color: C.c35 },
  postTitle:   { fontSize: 14, fontWeight: '700', color: C.cream, lineHeight: 20 },
  postBody:    { fontSize: 13, color: C.c60, lineHeight: 19 },
  postFooter:  { flexDirection: 'row', gap: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
  postStat:    { fontSize: 12, color: C.c35, fontWeight: '600' },
  // Saved tab
  savedCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginBottom: 10 },
  savedIcon:     { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  savedTitle:    { fontSize: 14, fontWeight: '700', color: C.cream, marginBottom: 2 },
  savedSub:      { fontSize: 11, color: C.c35 },
  savedTypePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50, flexShrink: 0 },
  savedTypeTxt:  { fontSize: 10, fontWeight: '700' },
  // Edit modal
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  modalCancel: { paddingHorizontal: 4 },
  modalCancelTxt: { fontSize: 15 },
  modalSave: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 50 },
  modalSaveTxt: { fontSize: 14, fontWeight: '700', color: 'white' },
  editAvatarHint: { fontSize: 13, fontWeight: '600' },
  editLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  editInputWrap: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  editInput: { fontSize: 15, flex: 1 },
  editCharCount: { fontSize: 11, textAlign: 'right', marginTop: 4 },
});
