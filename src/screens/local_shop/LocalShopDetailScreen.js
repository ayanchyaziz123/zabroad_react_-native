import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, FlatList, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useAuthStore } from '../../store/authStore';

const TYPE_COLORS = {
  grocery: '#28A745', restaurant: '#FF6B35', fashion: '#E91E8C',
  electronics: '#3B8BF7', beauty: '#9C27B0', pharmacy: '#17A2B8',
  services: '#F4A227', bookstore: '#795548', hardware: '#607D8B', other: '#6C757D',
};

function ProductCard({ product, color, C, s }) {
  return (
    <View style={s.prodCard}>
      <View style={[s.prodImg, { backgroundColor: color + '15' }]}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Ionicons name="cube-outline" size={28} color={color + '99'} />
        )}
      </View>
      <View style={s.prodBody}>
        <Text style={[s.prodTitle, { color: C.cream }]} numberOfLines={2}>{product.title}</Text>
        <Text style={[s.prodPrice, { color }]}>${Number(product.price).toFixed(2)}</Text>
        {product.stock_quantity > 0 ? (
          <Text style={s.prodStock}>{product.stock_quantity} in stock</Text>
        ) : (
          <Text style={[s.prodStock, { color: '#FF3B30' }]}>Out of stock</Text>
        )}
      </View>
    </View>
  );
}

export default function LocalShopDetailScreen({ navigation, route }) {
  const { shopId } = route.params;
  const { colors: C } = useTheme();
  const { api, user } = useAuthStore();
  const s = useMemo(() => getStyles(C), [C]);

  const [shop,     setShop]     = useState(null);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(false);

  const color = TYPE_COLORS[shop?.shop_type] || '#3B8BF7';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [shopData, prodData] = await Promise.all([
        api(`/shops/${shopId}/`),
        api(`/shops/${shopId}/products/`),
      ]);
      setShop(shopData);
      setProducts(Array.isArray(prodData) ? prodData : (prodData.results || []));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [api, shopId]);

  useEffect(() => { fetchData(); }, [shopId]);

  const isOwner = shop?.is_mine;

  const handleDelete = () => {
    Alert.alert('Delete Shop', 'Are you sure you want to delete your shop?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await api(`/shops/${shopId}/`, { method: 'DELETE' });
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e.message);
          } finally { setDeleting(false); }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { alignItems: 'center', justifyContent: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color="#3B8BF7" />
      </SafeAreaView>
    );
  }

  if (!shop) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtnPlain}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.cream, fontSize: 16 }}>Shop not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Cover image */}
        <View style={[s.cover, { backgroundColor: color + '22' }]}>
          {shop.cover_url ? (
            <Image source={{ uri: shop.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : null}
          <View style={s.coverOverlay} />

          {/* Back button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Owner actions */}
          {isOwner && (
            <View style={s.ownerActions}>
              <TouchableOpacity
                style={s.ownerBtn}
                onPress={() => navigation.navigate('CreateShop', { shop })}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[s.ownerBtn, { backgroundColor: '#FF3B3055' }]} onPress={handleDelete} activeOpacity={0.8} disabled={deleting}>
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}

          {/* Logo */}
          <View style={[s.logoWrap, { borderColor: color }]}>
            {shop.logo_url ? (
              <Image source={{ uri: shop.logo_url }} style={s.logo} resizeMode="cover" />
            ) : (
              <View style={[s.logoPlaceholder, { backgroundColor: color + '22' }]}>
                <Text style={{ fontSize: 32 }}>🏪</Text>
              </View>
            )}
          </View>
        </View>

        {/* Shop info */}
        <View style={s.infoSection}>
          <View style={s.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.shopName, { color: C.cream }]}>{shop.shop_name}</Text>
              <View style={s.badgeRow}>
                <View style={[s.typePill, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                  <Text style={[s.typePillTxt, { color }]}>{shop.shop_type}</Text>
                </View>
                {shop.is_open && (
                  <View style={s.openPill}>
                    <View style={s.openDot} />
                    <Text style={s.openPillTxt}>Open now</Text>
                  </View>
                )}
                {shop.is_verified && (
                  <View style={s.verifiedPill}>
                    <Ionicons name="checkmark-circle" size={12} color="#3B8BF7" />
                    <Text style={s.verifiedTxt}>Verified</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {shop.description ? (
            <Text style={[s.desc, { color: C.c35 }]}>{shop.description}</Text>
          ) : null}

          {/* Location */}
          <View style={[s.infoCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={s.infoRow}>
              <Ionicons name="location-outline" size={16} color={color} />
              <Text style={[s.infoTxt, { color: C.cream }]}>
                {shop.address}, {shop.city}{shop.state ? `, ${shop.state}` : ''}, {shop.country}
              </Text>
            </View>
            {shop.phone_number ? (
              <TouchableOpacity style={s.infoRow} onPress={() => Linking.openURL(`tel:${shop.phone_number}`)} activeOpacity={0.75}>
                <Ionicons name="call-outline" size={16} color={color} />
                <Text style={[s.infoTxt, { color: '#3B8BF7' }]}>{shop.phone_number}</Text>
              </TouchableOpacity>
            ) : null}
            {shop.email ? (
              <TouchableOpacity style={s.infoRow} onPress={() => Linking.openURL(`mailto:${shop.email}`)} activeOpacity={0.75}>
                <Ionicons name="mail-outline" size={16} color={color} />
                <Text style={[s.infoTxt, { color: '#3B8BF7' }]}>{shop.email}</Text>
              </TouchableOpacity>
            ) : null}
            {shop.website ? (
              <TouchableOpacity style={s.infoRow} onPress={() => Linking.openURL(shop.website)} activeOpacity={0.75}>
                <Ionicons name="globe-outline" size={16} color={color} />
                <Text style={[s.infoTxt, { color: '#3B8BF7' }]}>{shop.website}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Products */}
        <View style={s.productsSection}>
          <View style={s.sectionHdr}>
            <Text style={[s.sectionTitle, { color: C.cream }]}>
              Products ({products.length})
            </Text>
            {isOwner && (
              <TouchableOpacity
                style={[s.addProdBtn, { backgroundColor: color }]}
                onPress={() => navigation.navigate('AddProduct', { shopId })}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={15} color="#fff" />
                <Text style={s.addProdTxt}>Add Product</Text>
              </TouchableOpacity>
            )}
          </View>

          {products.length === 0 ? (
            <View style={s.emptyProds}>
              <Text style={{ fontSize: 32 }}>📦</Text>
              <Text style={[s.emptyTxt, { color: C.c35 }]}>No products yet</Text>
              {isOwner && (
                <TouchableOpacity
                  style={[s.addProdBtn, { backgroundColor: color, marginTop: 8 }]}
                  onPress={() => navigation.navigate('AddProduct', { shopId })}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={15} color="#fff" />
                  <Text style={s.addProdTxt}>Add your first product</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={s.prodGrid}>
              {products.map(p => (
                <ProductCard key={p.id} product={p} color={color} C={C} s={s} />
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  cover:        { height: 200, position: 'relative', justifyContent: 'flex-start' },
  coverOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  backBtn:      { position: 'absolute', top: 12, left: 14, width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  backBtnPlain: { margin: 14, width: 36, height: 36, borderRadius: 12, backgroundColor: '#1B3266', alignItems: 'center', justifyContent: 'center' },
  ownerActions: { position: 'absolute', top: 12, right: 14, flexDirection: 'row', gap: 8 },
  ownerBtn:     { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  logoWrap:     { position: 'absolute', bottom: -30, left: 20, width: 64, height: 64, borderRadius: 18, borderWidth: 2, overflow: 'hidden', backgroundColor: C.card },
  logo:         { width: '100%', height: '100%' },
  logoPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },

  infoSection: { paddingHorizontal: 16, paddingTop: 40, paddingBottom: 4 },
  nameRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  shopName:    { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 },
  badgeRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typePill:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  typePillTxt: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  openPill:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#28D99E18', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  openDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#28D99E' },
  openPillTxt: { fontSize: 11, fontWeight: '700', color: '#28D99E' },
  verifiedPill:{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#3B8BF718', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  verifiedTxt: { fontSize: 11, fontWeight: '700', color: '#3B8BF7' },
  desc:        { fontSize: 13, lineHeight: 20, marginTop: 4, marginBottom: 12 },

  infoCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  infoRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoTxt:  { fontSize: 13, flex: 1, lineHeight: 18 },

  productsSection: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHdr:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle:    { fontSize: 17, fontWeight: '800' },
  addProdBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  addProdTxt:      { fontSize: 12, fontWeight: '700', color: '#fff' },

  emptyProds: { alignItems: 'center', paddingVertical: 30, gap: 6 },
  emptyTxt:   { fontSize: 13 },

  prodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  prodCard: { width: '47%', backgroundColor: C.card, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  prodImg:  { width: '100%', height: 100, alignItems: 'center', justifyContent: 'center' },
  prodBody: { padding: 10, gap: 4 },
  prodTitle:{ fontSize: 13, fontWeight: '700', lineHeight: 18 },
  prodPrice:{ fontSize: 15, fontWeight: '900' },
  prodStock:{ fontSize: 10, color: '#28D99E', fontWeight: '600' },
});
