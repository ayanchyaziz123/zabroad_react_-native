import { create } from 'zustand';
import * as Location from 'expo-location';

export const useLocationStore = create((set, get) => ({
  city:       '',   // resolved city string, e.g. "Queens, NY"
  latitude:   null,
  longitude:  null,
  status:     'idle', // 'idle' | 'detecting' | 'ready' | 'denied' | 'failed'

  // Called once on app launch (from AppNavigator MainTabs useEffect).
  // Silently resolves GPS → reverse-geocode → city string.
  detect: async () => {
    if (get().status === 'detecting') return;
    set({ status: 'detecting' });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        set({ status: 'denied' });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;

      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      const city   = place?.city || place?.subregion || place?.district || '';
      const region = place?.region || place?.isoCountryCode || '';
      const label  = city ? `${city}, ${region}` : region;

      set({
        latitude:  parseFloat(latitude.toFixed(6)),
        longitude: parseFloat(longitude.toFixed(6)),
        city: label,
        status: 'ready',
      });
    } catch {
      set({ status: 'failed' });
    }
  },

  // Override with a user-picked city (from the location sheet)
  setCity: (city) => set({ city, status: 'ready' }),

  // Returns the near_city query param string, or '' if not detected
  nearCityParam: () => {
    const city = get().city;
    return city ? `near_city=${encodeURIComponent(city)}` : '';
  },

  // Returns lat=X&lng=Y string when GPS coords are available, otherwise ''
  coordsParam: () => {
    const { latitude, longitude } = get();
    return (latitude != null && longitude != null)
      ? `lat=${latitude}&lng=${longitude}`
      : '';
  },
}));
