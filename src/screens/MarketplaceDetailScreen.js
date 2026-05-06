import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Image, Share, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { MARKET_CATEGORIES } from './MarketplaceScreen';

const ACCENT     = '#00B4D8';
const ACCENT_DIM = '#00B4D81A';
const RED        = '#FF4D4D';
const RED_DIM    = '#FF4D4D18';

function formatTime(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)    return 'Just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function MarketplaceDetailScreen({ route, navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const [item, setItem] = useState(route.params.item);
  const { user: authUser, api } = useAuthStore();

  const [saved,    setSaved]    = useState(false);
  const [messaged, setMessaged] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const saveScale = useRef(new Animated.Value(1)).current;

  const isOwn = authUser?.id && item.poster_id && String(authUser.id) === String(item.poster_id);

  const catInfo = MARKET_CATEGORIES.find(c => c.key === (item.category || 'other')) || MARKET_CATEGORIES[MARKET_CATEGORIES.length - 1];

  function onSave() {
    setSaved(v => !v);
    Animated.sequence([
      Animated.spring(saveScale, { toValue: 1.35, useNativeDriver: true, speed: 60, bounciness: 20 }),
      Animated.spring(saveScale, { toValue: 1,    useNativeDriver: true, speed: 30 }),
    ]).start();
  }

  async function onShare() {
    await Share.share({
      message: `${item.title}${item.price ? ` — ${item.price}` : ''} · Found on Zabroad Marketplace`,
    });
  }

  function onMessage() {
    setMessaged(true);
    if (item.poster_id) {
      navigation.navigate('AppMain', { screen: 'Chat', params: { userId: item.poster_id } });
    }
  }

  function onEdit() {
    navigation.navigate('EditMarketplace', { item, onSave: setItem });
  }

  function onDelete() {
    Alert.alert(
      'Delete listing',
      'This will permanently remove your listing. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api(`/marketplace/${item.id}/`, { method: 'DELETE' });
              navigation.navigate('Marketplace');
            } catch (e) {
              Alert.alert('Error', e.message || 'Could not delete listing.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  const posterInitials = (item.poster || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color={C.cream} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{item.title}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={s.iconBtn} onPress={onShare} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={19} color={C.cream} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={onSave} activeOpacity={0.8}>
            <Animated.View style={{ transform: [{ scale: saveScale }] }}>
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={19} color={saved ? ACCENT : C.cream} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* Image */}
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={s.heroImg} resizeMode="cover" />
        ) : (
          <View style={[s.heroImgEmpty, { backgroundColor: C.card }]}>
            <Ionicons name="storefront-outline" size={52} color={C.c35} />
          </View>
        )}

        {/* Hot badge */}
        {item.is_hot && (
          <View style={s.hotBadgeWrap}>
            <View style={[s.hotBadge, { backgroundColor: ACCENT_DIM, borderColor: ACCENT + '55' }]}>
              <Ionicons name="flame" size={12} color={ACCENT} />
              <Text style={[s.hotTxt, { color: ACCENT }]}>Hot listing</Text>
            </View>
          </View>
        )}

        {/* Main card */}
        <View style={[s.mainCard, { backgroundColor: C.card, borderColor: C.border }]}>

          <Text style={s.itemTitle}>{item.title}</Text>
          {item.price ? (
            <Text style={s.itemPrice}>{item.price}</Text>
          ) : (
            <Text style={[s.itemPrice, { color: C.c35 }]}>Price on request</Text>
          )}

          {/* Chips row */}
          <View style={s.chipsRow}>
            {/* Category chip */}
            <View style={[s.chip, { backgroundColor: ACCENT_DIM, borderColor: ACCENT + '44' }]}>
              <Ionicons name={catInfo.icon} size={11} color={ACCENT} />
              <Text style={[s.chipTxt, { color: ACCENT }]}>{catInfo.label}</Text>
            </View>

            {item.location ? (
              <View style={[s.chip, { backgroundColor: C.card2, borderColor: C.border }]}>
                <Ionicons name="location-outline" size={11} color={C.c35} />
                <Text style={[s.chipTxt, { color: C.c35 }]}>{item.location}</Text>
              </View>
            ) : null}

            {(item.home_country || item.community) ? (
              <View style={[s.chip, { backgroundColor: C.card2, borderColor: C.border }]}>
                <Text style={{ fontSize: 12 }}>{item.country_flag || '🌍'}</Text>
                <Text style={[s.chipTxt, { color: C.c35 }]}>{item.home_country || item.community}</Text>
              </View>
            ) : null}
          </View>

          <View style={[s.divider, { backgroundColor: C.border }]} />

          {/* Description */}
          <Text style={s.sectionLabel}>DESCRIPTION</Text>
          <Text style={[s.description, { color: C.c60 }]}>
            {item.description || 'No description provided.'}
          </Text>

          <View style={[s.divider, { backgroundColor: C.border }]} />

          {/* Seller info */}
          <Text style={s.sectionLabel}>SELLER</Text>
          <View style={s.sellerRow}>
            <View style={[s.sellerAv, { backgroundColor: ACCENT_DIM }]}>
              <Text style={[s.sellerInitials, { color: ACCENT }]}>{posterInitials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.sellerName, { color: C.cream }]}>{item.poster || 'Unknown'}</Text>
              <Text style={[s.sellerMeta, { color: C.c35 }]}>
                Listed {formatTime(item.created_at)}
                {item.country_flag ? `  ${item.country_flag}` : ''}
              </Text>
            </View>
          </View>

          {/* Safety notice */}
          <View style={[s.notice, { backgroundColor: C.card2, borderColor: C.border }]}>
            <Ionicons name="shield-checkmark-outline" size={14} color={C.c35} />
            <Text style={[s.noticeTxt, { color: C.c35 }]}>
              Meet in a safe public place. Never send payment before inspecting the item.
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.bottomBar, { backgroundColor: C.nav, borderTopColor: C.border }]}>
        {isOwn ? (
          <>
            <TouchableOpacity
              style={[s.ownDeleteBtn, { borderColor: RED + '55', backgroundColor: RED_DIM }]}
              onPress={onDelete}
              disabled={deleting}
              activeOpacity={0.85}
            >
              {deleting
                ? <Ionicons name="hourglass-outline" size={17} color={RED} />
                : <Ionicons name="trash-outline" size={17} color={RED} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.editBtn, { backgroundColor: C.card, borderColor: C.border }]}
              onPress={onEdit}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={17} color={C.cream} />
              <Text style={[s.editTxt, { color: C.cream }]}>Edit Listing</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={[s.msgSecondary, { borderColor: C.border, backgroundColor: C.card }]} onPress={onMessage} activeOpacity={0.85}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={C.cream} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.msgBtn, { backgroundColor: messaged ? C.greenD : ACCENT }]}
              onPress={onMessage}
              activeOpacity={0.85}
            >
              <Ionicons name={messaged ? 'checkmark-circle-outline' : 'chatbubble-outline'} size={18} color={messaged ? C.green : '#fff'} />
              <Text style={[s.msgTxt, { color: messaged ? C.green : '#fff' }]}>
                {messaged ? 'Message sent' : 'Message Seller'}
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
  heroImgEmpty: { width: '100%', height: 180, alignItems: 'center', justifyContent: 'center' },

  hotBadgeWrap: { paddingHorizontal: 16, paddingTop: 12 },
  hotBadge:     { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50, borderWidth: 1 },
  hotTxt:       { fontSize: 11, fontWeight: '700' },

  mainCard:  { margin: 16, borderRadius: 18, borderWidth: 1, padding: 18 },

  itemTitle: { fontSize: 20, fontWeight: '800', color: C.cream, letterSpacing: -0.4, marginBottom: 6 },
  itemPrice: { fontSize: 22, fontWeight: '800', color: ACCENT, marginBottom: 14 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip:     { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  chipTxt:  { fontSize: 12, fontWeight: '500' },

  divider:      { height: 1, marginVertical: 16 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.c35, letterSpacing: 1.5, marginBottom: 10 },
  description:  { fontSize: 14, lineHeight: 22 },

  sellerRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sellerAv:       { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sellerInitials: { fontSize: 16, fontWeight: '800' },
  sellerName:     { fontSize: 14, fontWeight: '700' },
  sellerMeta:     { fontSize: 12, marginTop: 2 },

  notice:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 16 },
  noticeTxt: { flex: 1, fontSize: 11, lineHeight: 17 },

  bottomBar:    { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, borderTopWidth: 1 },
  msgSecondary: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14 },
  msgTxt:       { fontSize: 15, fontWeight: '800' },

  // Own listing controls
  ownDeleteBtn: { width: 50, height: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  editBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14, borderWidth: 1 },
  editTxt:      { fontSize: 15, fontWeight: '700' },
});
