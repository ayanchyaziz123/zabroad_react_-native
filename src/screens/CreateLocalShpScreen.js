import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';

const SHOP_TYPES = [
  { key: 'grocery', label: 'Grocery', icon: 'cart-outline' },
  { key: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline' },
  { key: 'electronics', label: 'Electronics', icon: 'hardware-chip-outline' },
  { key: 'fashion', label: 'Fashion', icon: 'shirt-outline' },
  { key: 'pharmacy', label: 'Pharmacy', icon: 'medkit-outline' },
  { key: 'bookstore', label: 'Books', icon: 'book-outline' },
  { key: 'hardware', label: 'Hardware', icon: 'construct-outline' },
  { key: 'beauty', label: 'Beauty', icon: 'color-palette-outline' },
  { key: 'services', label: 'Services', icon: 'build-outline' },
  { key: 'other', label: 'Other', icon: 'grid-outline' },
];

export default function CreateLocalShopScreen({ navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const api = useAuthStore(s => s.api);

  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [shopType, setShopType] = useState('other');

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  const [logo, setLogo] = useState(null);
  const [cover, setCover] = useState(null);

  const [loading, setLoading] = useState(false);

  const canSubmit =
    shopName.trim().length > 2 &&
    address.trim().length > 3 &&
    city.trim().length > 1 &&
    country.trim().length > 1;

  async function pickImage(setter) {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return alert('Permission required');

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!res.canceled) setter(res.assets[0]);
  }

  async function submit() {
    setLoading(true);
    try {
      const form = new FormData();

      form.append('shop_name', shopName);
      form.append('description', description);
      form.append('shop_type', shopType);

      form.append('phone_number', phone);
      form.append('email', email);
      form.append('website', website);

      form.append('address', address);
      form.append('city', city);
      form.append('country', country);

      if (logo) {
        form.append('logo', {
          uri: logo.uri,
          name: 'logo.jpg',
          type: 'image/jpeg',
        });
      }

      if (cover) {
        form.append('cover_image', {
          uri: cover.uri,
          name: 'cover.jpg',
          type: 'image/jpeg',
        });
      }

      await api('/shops/', {
        method: 'POST',
        body: form,
        isForm: true,
      });

      navigation.goBack();
    } catch (e) {
      alert(e.message || 'Failed to create shop');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={s.container}>

          <Text style={s.title}>Create Local Shop</Text>

          {/* Shop Name */}
          <TextInput style={s.input} placeholder="Shop Name"
            value={shopName} onChangeText={setShopName} />

          {/* Description */}
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Description"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          {/* Shop Type */}
          <View style={s.grid}>
            {SHOP_TYPES.map(t => {
              const active = shopType === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[s.typeCard, active && s.activeCard]}
                  onPress={() => setShopType(t.key)}
                >
                  <Ionicons
                    name={t.icon}
                    size={18}
                    color={active ? 'white' : C.text}
                  />
                  <Text style={[s.typeText, active && { color: 'white' }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Contact */}
          <TextInput style={s.input} placeholder="Phone"
            value={phone} onChangeText={setPhone} />
          <TextInput style={s.input} placeholder="Email"
            value={email} onChangeText={setEmail} />
          <TextInput style={s.input} placeholder="Website"
            value={website} onChangeText={setWebsite} />

          {/* Location */}
          <TextInput style={s.input} placeholder="Address"
            value={address} onChangeText={setAddress} />
          <TextInput style={s.input} placeholder="City"
            value={city} onChangeText={setCity} />
          <TextInput style={s.input} placeholder="Country"
            value={country} onChangeText={setCountry} />

          {/* Logo */}
          <TouchableOpacity
            style={s.imageBox}
            onPress={() => pickImage(setLogo)}
          >
            {logo ? (
              <Image source={{ uri: logo.uri }} style={s.image} />
            ) : (
              <Text style={s.imageText}>Upload Logo</Text>
            )}
          </TouchableOpacity>

          {/* Cover */}
          <TouchableOpacity
            style={s.imageBox}
            onPress={() => pickImage(setCover)}
          >
            {cover ? (
              <Image source={{ uri: cover.uri }} style={s.image} />
            ) : (
              <Text style={s.imageText}>Upload Cover</Text>
            )}
          </TouchableOpacity>

          {/* Submit */}
          <TouchableOpacity
            style={[s.btn, !canSubmit && { opacity: 0.5 }]}
            disabled={!canSubmit || loading}
            onPress={submit}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={s.btnText}>Create Shop</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (C) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.bg },
    container: { padding: 20, gap: 12 },

    title: { fontSize: 20, fontWeight: '800', color: C.text },

    input: {
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 12,
      padding: 12,
      color: C.text,
    },

    textArea: { height: 100, textAlignVertical: 'top' },

    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    typeCard: {
      flexDirection: 'row',
      gap: 6,
      padding: 10,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 10,
      alignItems: 'center',
    },

    activeCard: {
      backgroundColor: '#2ecc71',
      borderColor: '#2ecc71',
    },

    typeText: { fontSize: 12, color: C.text },

    imageBox: {
      height: 120,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },

    image: { width: '100%', height: '100%', borderRadius: 12 },

    imageText: { color: C.text },

    btn: {
      marginTop: 10,
      backgroundColor: '#2ecc71',
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
    },

    btnText: { color: 'white', fontWeight: '700' },
  });