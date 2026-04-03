import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';

const EVENT_TIPS = [
  'Free legal aid clinics fill up fast — RSVP as early as possible',
  'Bring your visa documents to immigration events; attorneys may review on the spot',
  'Job fairs often have on-the-spot interviews — dress professionally',
];

const getStyles = (C) => StyleSheet.create({
  safe:              { flex: 1, backgroundColor: C.bg },

  /* ── Header ── */
  header:            { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  back:              { width: 38, height: 38, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  backTxt:           { fontSize: 24, color: C.cream, lineHeight: 28 },
  title:             { fontSize: 20, fontWeight: '800', color: C.cream },
  sub:               { fontSize: 12, color: C.c35, marginTop: 1 },
  headerBadge:       { marginLeft: 'auto', backgroundColor: C.purple + '22', borderRadius: 50, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.purple + '44' },
  headerBadgeTxt:    { fontSize: 11, color: C.purple, fontWeight: '700' },

  /* ── Search ── */
  searchRow:         { paddingHorizontal: 20, marginBottom: 12, flexDirection: 'row', gap: 10 },
  searchBox:         { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput:       { flex: 1, fontSize: 13, color: C.cream },

  /* ── Filter pills ── */
  filterScroll:      { marginBottom: 16, flexGrow: 0 },
  filterPill:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  filterActive:      { backgroundColor: C.purple + '22', borderColor: C.purple + '66' },
  filterTxt:         { fontSize: 12, color: C.c35, fontWeight: '500' },
  filterTxtActive:   { color: C.purple, fontWeight: '700' },

  /* ── Tips card ── */
  tipsCard:          { backgroundColor: C.card, borderWidth: 1, borderColor: C.purple + '22', borderRadius: 18, padding: 14 },
  tipsTitle:         { fontSize: 13, fontWeight: '700', color: C.cream, marginBottom: 10 },
  tipRow:            { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 6 },
  tipDot:            { width: 5, height: 5, backgroundColor: C.purple, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  tipTxt:            { fontSize: 12, color: C.c35, lineHeight: 18, flex: 1 },

  /* ── Section label ── */
  sectionLabel:      { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5 },

  /* ── Event card ── */
  eventCard:         { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14 },
  eventTop:          { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  eventIcon:         { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  eventTitleRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  eventTitle:        { fontSize: 14, fontWeight: '700', color: C.cream, flex: 1 },
  eventOrganizer:    { fontSize: 12, color: C.c35 },
  eventDesc:         { fontSize: 12, color: C.c60, lineHeight: 17, marginBottom: 10 },

  /* Meta chips */
  eventMeta:         { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  metaChip:          { backgroundColor: C.card2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: C.border },
  metaChipTxt:       { fontSize: 11, color: C.c60, fontWeight: '500' },

  /* Free / Paid badge */
  freeBadge:         { backgroundColor: C.green + '18', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: C.green + '44' },
  freeBadgeTxt:      { fontSize: 10, color: C.green, fontWeight: '700' },
  paidBadge:         { backgroundColor: C.gold + '18', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: C.gold + '44' },
  paidBadgeTxt:      { fontSize: 10, color: C.gold, fontWeight: '700' },

  /* Tags */
  tagsRow:           { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  tag:               { backgroundColor: C.purple + '18', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.purple + '33' },
  tagTxt:            { fontSize: 10, color: C.purple, fontWeight: '600' },

  /* Footer */
  eventFooter:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  attendeesTxt:      { fontSize: 11, color: C.c35 },
  rsvpBtn:           { backgroundColor: C.purple, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 50, shadowColor: C.purple, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 },
  rsvpBtnGoing:      { backgroundColor: C.green + '22', shadowColor: C.green, borderWidth: 1, borderColor: C.green + '55' },
  rsvpTxt:           { fontSize: 12, fontWeight: '700', color: '#0D0F1A' },
  rsvpTxtGoing:      { color: C.green },
});

export default function EventsScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const EVENTS = [
    {
      id: '1',
      title: 'Immigrant Job Fair — Spring 2025',
      category: 'Jobs Fair',
      emoji: '💼',
      color: C.blue,
      date: 'Sat Apr 5',
      time: '10:00 AM – 3:00 PM',
      location: 'Javits Center, NYC',
      organizer: 'NYC Workforce1',
      attendees: 342,
      free: true,
      tags: ['OPT Friendly', 'H-1B Sponsors', 'Networking'],
      description: 'Connect with 60+ employers actively hiring immigrants — résumé review booths available on-site.',
    },
    {
      id: '2',
      title: 'Free Immigration Legal Aid Clinic',
      category: 'Legal Aid',
      emoji: '⚖️',
      color: C.vivid,
      date: 'Sun Apr 6',
      time: '9:00 AM – 1:00 PM',
      location: 'Queens Public Library',
      organizer: 'NYLAG',
      attendees: 88,
      free: true,
      tags: ['Green Card', 'DACA', 'Asylum'],
      description: 'Volunteer attorneys provide free consultations on green card, DACA renewals, and asylum cases.',
    },
    {
      id: '3',
      title: 'Bangladeshi Community Eid Celebration',
      category: 'Cultural',
      emoji: '🌙',
      color: C.green,
      date: 'Wed Apr 9',
      time: '6:00 PM – 10:00 PM',
      location: 'Jackson Heights, Queens',
      organizer: 'BANA NYC Chapter',
      attendees: 215,
      free: true,
      tags: ['Cultural', 'Food', 'Family Friendly'],
      description: 'Celebrate Eid with the community — traditional food, music, and a space to feel at home.',
    },
    {
      id: '4',
      title: 'Mental Health Workshop for Immigrants',
      category: 'Health',
      emoji: '🧠',
      color: C.teal,
      date: 'Thu Apr 10',
      time: '7:00 PM – 8:30 PM',
      location: 'Zoom (Online)',
      organizer: 'Immigrant Health Initiative',
      attendees: 57,
      free: true,
      tags: ['Mental Health', 'Stress', 'Wellness'],
      description: 'A safe space to discuss the emotional challenges of immigration with licensed bilingual therapists.',
    },
    {
      id: '5',
      title: 'Tech Immigrant Professionals Networking',
      category: 'Networking',
      emoji: '🤝',
      color: C.purple,
      date: 'Fri Apr 11',
      time: '6:30 PM – 9:00 PM',
      location: 'WeWork, Midtown Manhattan',
      organizer: 'Zabroad Community',
      attendees: 134,
      free: false,
      price: '$10',
      tags: ['Tech', 'Startups', 'OPT', 'H-1B'],
      description: 'Mix with immigrant engineers, PMs, and founders — bring cards, leave with referrals.',
    },
    {
      id: '6',
      title: 'Know Your Rights: Tenant Laws for Immigrants',
      category: 'Legal Aid',
      emoji: '🏠',
      color: C.gold,
      date: 'Sat Apr 12',
      time: '11:00 AM – 1:00 PM',
      location: 'Brooklyn Community Board 9',
      organizer: 'Legal Aid Society',
      attendees: 71,
      free: true,
      tags: ['Housing', 'Tenant Rights', 'Legal'],
      description: 'Learn what NYC landlord-tenant laws protect you regardless of immigration status.',
    },
    {
      id: '7',
      title: 'South Asian Food & Culture Fest',
      category: 'Cultural',
      emoji: '🎉',
      color: C.vivid,
      date: 'Sun Apr 13',
      time: '12:00 PM – 6:00 PM',
      location: 'Flushing Meadows Park',
      organizer: 'Desi NYC Collective',
      attendees: 480,
      free: false,
      price: '$5',
      tags: ['South Asian', 'Food', 'Music', 'Family'],
      description: 'Annual multicultural festival celebrating South Asian heritage with vendors, live performances, and cuisine.',
    },
    {
      id: '8',
      title: 'Resume & Interview Bootcamp',
      category: 'Jobs Fair',
      emoji: '📄',
      color: C.teal,
      date: 'Mon Apr 14',
      time: '5:00 PM – 7:30 PM',
      location: 'Zoom (Online)',
      organizer: 'ImmigrantPro NYC',
      attendees: 96,
      free: true,
      tags: ['Resume', 'Interview Prep', 'Career'],
      description: 'HR recruiters critique your résumé and run mock interviews tailored for immigrant job seekers.',
    },
    {
      id: '9',
      title: 'DACA Renewal & TPS Info Session',
      category: 'Legal Aid',
      emoji: '📋',
      color: C.blue,
      date: 'Tue Apr 15',
      time: '6:00 PM – 8:00 PM',
      location: 'Make the Road NY, Bushwick',
      organizer: 'Make the Road NY',
      attendees: 63,
      free: true,
      tags: ['DACA', 'TPS', 'Immigration'],
      description: 'Step-by-step guidance on DACA and TPS renewal applications with staff attorneys available for questions.',
    },
  ];

  const filters = ['All', 'Jobs Fair', 'Legal Aid', 'Community', 'Health', 'Cultural', 'Networking'];

  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState(0);
  const [rsvped,       setRsvped]       = useState({});

  const filtered = useMemo(() => EVENTS.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      e.title.toLowerCase().includes(q) ||
      e.organizer.toLowerCase().includes(q) ||
      e.tags.some(t => t.toLowerCase().includes(q));
    const matchFilter =
      activeFilter === 0 ? true
      : e.category === filters[activeFilter];
    return matchSearch && matchFilter;
  }), [search, activeFilter]);

  const toggleRsvp = (id) => setRsvped(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>🗓 Events</Text>
          <Text style={s.sub}>Meetups, legal aid & community events</Text>
        </View>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeTxt}>{EVENTS.length} Events</Text>
        </View>
      </View>

      {/* ── Search bar ── */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Text>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search events, organizers, tags…"
            placeholderTextColor={C.c35}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ fontSize: 14, color: C.c35 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter pills ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroll}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingBottom: 4 }}
      >
        {filters.map((f, i) => (
          <TouchableOpacity
            key={i}
            style={[s.filterPill, i === activeFilter && s.filterActive]}
            onPress={() => setActiveFilter(i)}
          >
            <Text style={[s.filterTxt, i === activeFilter && s.filterTxtActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Main scroll ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 12 }}>

        {/* Tips */}
        <View style={s.tipsCard}>
          <Text style={s.tipsTitle}>💡 Event Tips for Immigrants</Text>
          {EVENT_TIPS.map((tip, i) => (
            <View key={i} style={s.tipRow}>
              <View style={s.tipDot} />
              <Text style={s.tipTxt}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Count label */}
        <Text style={s.sectionLabel}>{filtered.length} EVENTS · SORTED BY DATE</Text>

        {/* Empty state */}
        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 40, gap: 10 }}>
            <Text style={{ fontSize: 36 }}>🗓</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.cream }}>No events found</Text>
            <Text style={{ fontSize: 13, color: C.c35 }}>Try a different filter or search term</Text>
          </View>
        )}

        {/* Event cards */}
        {filtered.map((event) => {
          const isGoing = rsvped[event.id];
          return (
            <View
              key={event.id}
              style={[s.eventCard, isGoing && { borderColor: C.green + '55' }]}
            >
              {/* Top row: icon + title + organizer */}
              <View style={s.eventTop}>
                <View style={[s.eventIcon, { backgroundColor: event.color + '22' }]}>
                  <Text style={{ fontSize: 24 }}>{event.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.eventTitleRow}>
                    <Text style={s.eventTitle} numberOfLines={2}>{event.title}</Text>
                  </View>
                  <Text style={s.eventOrganizer}>{event.organizer}</Text>
                </View>
                {/* Free / Paid badge inline top-right */}
                {event.free ? (
                  <View style={s.freeBadge}><Text style={s.freeBadgeTxt}>FREE</Text></View>
                ) : (
                  <View style={s.paidBadge}><Text style={s.paidBadgeTxt}>{event.price}</Text></View>
                )}
              </View>

              {/* Description */}
              <Text style={s.eventDesc}>{event.description}</Text>

              {/* Meta chips */}
              <View style={s.eventMeta}>
                <View style={s.metaChip}><Text style={s.metaChipTxt}>📅 {event.date}</Text></View>
                <View style={s.metaChip}><Text style={s.metaChipTxt}>⏰ {event.time}</Text></View>
                <View style={s.metaChip}><Text style={s.metaChipTxt}>📍 {event.location}</Text></View>
              </View>

              {/* Tags */}
              <View style={s.tagsRow}>
                {event.tags.map((tag, i) => (
                  <View key={i} style={s.tag}>
                    <Text style={s.tagTxt}>{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Footer */}
              <View style={s.eventFooter}>
                <Text style={s.attendeesTxt}>
                  👥 {isGoing ? event.attendees + 1 : event.attendees} going
                </Text>
                <TouchableOpacity
                  style={[s.rsvpBtn, isGoing && s.rsvpBtnGoing]}
                  onPress={() => toggleRsvp(event.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.rsvpTxt, isGoing && s.rsvpTxtGoing]}>
                    {isGoing ? 'Going ✓' : 'RSVP →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={{ height: 10 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
