import { create } from 'zustand';
import * as Location from 'expo-location';

async function resolveAndSet(set, coords) {
  const { latitude, longitude } = coords;
  const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
  const city   = place?.city || place?.subregion || place?.district || '';
  const region = place?.region || place?.isoCountryCode || '';
  const label  = city ? `${city}, ${region}` : region;
  set({
    latitude:  parseFloat(latitude.toFixed(6)),
    longitude: parseFloat(longitude.toFixed(6)),
    city:      label,
    status:    'ready',
  });
}

export const useLocationStore = create((set, get) => ({
  city:       '',   // resolved city string, e.g. "Queens, NY"
  latitude:   null,
  longitude:  null,
  status:     'idle', // 'idle' | 'detecting' | 'ready' | 'denied' | 'failed'

  // Called once on app launch — balanced accuracy, won't re-run if already detecting.
  detect: async () => {
    if (get().status === 'detecting') return;
    set({ status: 'detecting' });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { set({ status: 'denied' }); return; }
      const loc = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('GPS timeout')), 10_000)),
      ]);
      await resolveAndSet(set, loc.coords);
    } catch {
      set({ status: 'failed' });
    }
  },

  // Called when user taps "Near Me" — forces a fresh high-accuracy fix every time.
  forceDetect: async () => {
    set({ status: 'detecting' });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { set({ status: 'denied' }); return false; }
      const loc = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('GPS timeout')), 15_000)),
      ]);
      await resolveAndSet(set, loc.coords);
      return true;
    } catch {
      set({ status: 'failed' });
      return false;
    }
  },

  // Override with a user-picked city (from the location sheet)
  // Pass lat/lng when picking from a known list so distance calcs work everywhere
  setCity: (city, lat = null, lng = null) => set({
    city,
    status: 'ready',
    ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
  }),

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
