import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Share, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useHousingStore } from '../store/housingStore';
import { HOUSING_CATEGORIES } from './HousingScreen';

const GOLD     = '#F5A623';
const GOLD_DIM = '#F5A6231A';

function planColor(plan) {
  if (plan === 'premium')  return '#9B72EF';
  if (plan === 'standard') return GOLD;
  return GOLD;
}

const RENTER_TIPS = [
  { icon: 'document-text-outline',    text: 'Ask for a written lease before paying any deposit.' },
  { icon: 'shield-checkmark-outline', text: 'Verify the landlord owns or manages the property.' },
  { icon: 'cash-outline',             text: 'Never send payment via wire transfer or gift cards.' },
  { icon: 'walk-outline',             text: 'Tour the unit in person before signing anything.' },
];

export default function HousingDetailScreen({ route, navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  const [listing, setListing] = useState(route.params.listing);
  const { user: authUser } = useAuthStore();
  const deleteListing = useHousingStore(st => st.deleteListing);

  const accent  = planColor(listing.plan);
  const isOwn   = authUser?.id && listing.poster_id && String(authUser.id) === String(listing.poster_id);
  const catInfo = HOUSING_CATEGORIES.find(c => c.key === listing.category);

  const [saved,      setSaved]      = useState(false);
  const [contacted,  setContacted]  = useState(false);
  const saveScale = useRef(new Animated.Value(1)).current;

  function onSave() {
    setSaved(v => !v);
    Animated.sequence([
      Animated.spring(saveScale, { toValue: 1.35, useNativeDriver: true, speed: 60, bounciness: 20 }),
      Animated.spring(saveScale, { toValue: 1,    useNativeDriver: true, speed: 30 }),
    ]).start();
  }

  async function onShare() {
    await Share.share({
      message: `${listing.title}${listing.price ? ` — ${listing.price}` : ''} · Found on Zabroad Housing`,
    });
  }

  function onContact() {
    setContacted(true);
    if (listing.poster_id) {
      navigation.navigate('AppMain', { screen: 'Chat', params: { userId: listing.poster_id } });
    }
  }

  function onDelete() {
    Alert.alert('Delete listing', 'Remove this listing permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteListing(listing.id);
            navigation.navigate('Housing');
          } catch {
            Alert.alert('Error', 'Could not delete. Please try again.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{listing.title}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.iconBtn} onPress={onShare} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={19} color={C.cream} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={onSave} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ scale: saveScale }] }}>
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={19} color={saved ? accent : C.cream} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* Image */}
        {listing.image_url ? (
          <Image source={{ uri: listing.image_url }} style={s.heroImg} resizeMode="cover" />
        ) : (
          <View style={[s.heroImgEmpty, { backgroundColor: C.card }]}>
            <Ionicons name="home-outline" size={56} color={C.c35} />
          </View>
        )}

        {/* Featured badge */}
        {listing.featured && (
          <View style={s.featuredWrap}>
            <View style={[s.featuredBadge, { backgroundColor: '#9B72EF22', borderColor: '#9B72EF55' }]}>
              <Ionicons name="star" size={11} color="#9B72EF" />
              <Text style={[s.featuredTxt, { color: '#9B72EF' }]}>Featured Listing</Text>
            </View>
          </View>
        )}

        {/* Main card */}
        <View style={[s.mainCard, { backgroundColor: C.card, borderColor: C.border }]}>

          <Text style={s.itemTitle}>{listing.title}</Text>
          <Text style={[s.itemPrice, { color: accent }]}>{listing.price || 'Price on request'}</Text>

          {/* Chips */}
          <View style={s.chipsRow}>
            {listing.location ? (
              <View style={[s.chip, { backgroundColor: C.card2, borderColor: C.border }]}>
                <Ionicons name="location-outline" size={11} color={C.c35} />
                <Text style={[s.chipTxt, { color: C.c35 }]}>{listing.location}</Text>
              </View>
            ) : null}
            {catInfo && catInfo.key !== 'all' && (
              <View style={[s.chip, { backgroundColor: GOLD_DIM, borderColor: GOLD + '44' }]}>
                <Ionicons name={catInfo.icon} size={11} color={GOLD} />
                <Text style={[s.chipTxt, { color: GOLD, fontWeight: '700' }]}>{catInfo.label}</Text>
              </View>
            )}
            {listing.communities?.[0] ? (
              <View style={[s.chip, { backgroundColor: C.card2, borderColor: C.border }]}>
                <Text style={{ fontSize: 12 }}>{listing.countryFlag || '🌍'}</Text>
                <Text style={[s.chipTxt, { color: C.c35 }]}>{listing.communities[0]}</Text>
              </View>
            ) : null}
            {listing.postedFrom ? (
              <View style={[s.chip, { backgroundColor: C.card2, borderColor: C.border }]}>
                <Ionicons name="navigate-outline" size={11} color={C.c35} />
                <Text style={[s.chipTxt, { color: C.c35 }]}>{listing.postedFrom}</Text>
              </View>
            ) : null}
            <View style={[s.chip, { backgroundColor: accent + '18', borderColor: accent + '44' }]}>
              <Ionicons name="ribbon-outline" size={11} color={accent} />
              <Text style={[s.chipTxt, { color: accent, fontWeight: '700' }]}>
                {listing.plan ? listing.plan.charAt(0).toUpperCase() + listing.plan.slice(1) : 'Basic'}
              </Text>
            </View>
          </View>

          <View style={[s.divider, { backgroundColor: C.border }]} />

          <Text style={s.sectionLabel}>DESCRIPTION</Text>
          <Text style={[s.description, { color: C.c60 }]}>
            {listing.desc || 'No description provided.'}
          </Text>

          <View style={[s.divider, { backgroundColor: C.border }]} />

          <Text style={s.sectionLabel}>POSTED BY</Text>
          <View style={s.posterRow}>
            <View style={[s.posterAv, { backgroundColor: accent + '22' }]}>
              <Text style={[s.posterInitials, { color: accent }]}>{listing.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.posterName, { color: C.cream }]}>{listing.poster || 'Unknown'}</Text>
              <Text style={[s.posterMeta, { color: C.c35 }]}>Listed {listing.time}</Text>
            </View>
          </View>

          <View style={[s.divider, { backgroundColor: C.border }]} />

          <Text style={s.sectionLabel}>RENTING TIPS</Text>
          <View style={[s.tipsBox, { backgroundColor: C.card2, borderColor: C.border }]}>
            {RENTER_TIPS.map((tip, i) => (
              <View
                key={i}
                style={[s.tipRow, i < RENTER_TIPS.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}
              >
                <Ionicons name={tip.icon} size={14} color={accent} />
                <Text style={[s.tipTxt, { color: C.c35 }]}>{tip.text}</Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.bottomBar, { backgroundColor: C.nav, borderTopColor: C.border }]}>
        {isOwn ? (
          <>
            <TouchableOpacity
              style={[s.editBtn, { backgroundColor: GOLD_DIM, borderColor: GOLD + '55' }]}
              onPress={() => navigation.navigate('EditHousing', { listing, onSave: setListing })}
              activeOpacity={0.85}
            >
              <Ionicons name="pencil-outline" size={18} color={GOLD} />
              <Text style={[s.editBtnTxt, { color: GOLD }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.deleteBtn, { backgroundColor: '#FF4D4D18', borderColor: '#FF4D4D44' }]}
              onPress={onDelete}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={18} color="#FF4D4D" />
              <Text style={[s.deleteBtnTxt, { color: '#FF4D4D' }]}>Delete</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={[s.shareBtn, { borderColor: C.border, backgroundColor: C.card }]} onPress={onShare} activeOpacity={0.85}>
              <Ionicons name="share-outline" size={18} color={C.cream} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.contactBtn, { backgroundColor: contacted ? C.greenD : accent, borderColor: contacted ? C.green + '44' : 'transparent' }]}
              onPress={onContact}
              activeOpacity={0.85}
            >
              <Ionicons name={contacted ? 'checkmark-circle-outline' : 'chatbubble-outline'} size={18} color={contacted ? C.green : '#fff'} />
              <Text style={[s.contactTxt, { color: contacted ? C.green : '#fff' }]}>
                {contacted ? 'Message sent' : 'Contact Landlord'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:     { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: C.cream },
  iconBtn:     { width: 38, height: 38, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },

  heroImg:      { width: '100%', height: 260, backgroundColor: C.card2 },
  heroImgEmpty: { width: '100%', height: 200, alignItems: 'center', justifyContent: 'center' },

  featuredWrap:  { paddingHorizontal: 16, paddingTop: 12 },
  featuredBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50, borderWidth: 1 },
  featuredTxt:   { fontSize: 11, fontWeight: '700' },

  mainCard:  { margin: 16, borderRadius: 18, borderWidth: 1, padding: 18 },

  itemTitle: { fontSize: 20, fontWeight: '800', color: C.cream, letterSpacing: -0.4, marginBottom: 6 },
  itemPrice: { fontSize: 22, fontWeight: '800', marginBottom: 14 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  chipTxt:  { fontSize: 12, fontWeight: '500' },

  divider:      { height: 1, marginVertical: 16 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 10 },
  description:  { fontSize: 14, lineHeight: 22 },

  posterRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  posterAv:       { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  posterInitials: { fontSize: 16, fontWeight: '800' },
  posterName:     { fontSize: 14, fontWeight: '700' },
  posterMeta:     { fontSize: 12, marginTop: 2 },

  tipsBox: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  tipRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12 },
  tipTxt:  { flex: 1, fontSize: 12, lineHeight: 18 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, borderTopWidth: 1 },
  shareBtn:  { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  contactBtn:{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, borderWidth: 1 },
  contactTxt:{ fontSize: 15, fontWeight: '800' },
  editBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, borderWidth: 1 },
  editBtnTxt:{ fontSize: 15, fontWeight: '800' },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, borderWidth: 1 },
  deleteBtnTxt:{ fontSize: 15, fontWeight: '800' },
});
