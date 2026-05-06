# Zabroad — React Native App

Mobile app for **Zabroad** — a community platform for immigrants to find jobs, housing, legal help, healthcare, events, and connect with people from their home country.

Built with Expo + React Native. Targets iOS and Android.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Navigation | React Navigation (Stack + Bottom Tabs) |
| State Management | Zustand |
| Auth Tokens | expo-secure-store (encrypted) |
| Location | expo-location (GPS + reverse geocode) |
| Image Picker | expo-image-picker |
| Maps | react-native-maps |
| Icons | @expo/vector-icons (Ionicons) |
| Theme | Custom ThemeContext (dark / light mode) |

---

## Project Structure

```
Zabroad/
├── App.js                          # Root — providers + session restore
├── src/
│   ├── navigation/
│   │   └── AppNavigator.js         # Stack + Tab navigator, custom tab bar
│   ├── screens/
│   │   ├── onboarding/             # Auth + registration flow
│   │   │   ├── WelcomeScreen.js
│   │   │   ├── SignUpScreen.js
│   │   │   ├── OTPScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   ├── ForgotPasswordScreen.js
│   │   │   ├── FromCountryScreen.js
│   │   │   ├── LivesInScreen.js
│   │   │   ├── InterestsScreen.js
│   │   │   └── AllDoneScreen.js
│   │   ├── HomeScreen.js           # Feed + listings dashboard
│   │   ├── JobsScreen.js           # Job board
│   │   ├── JobDetailScreen.js
│   │   ├── PostJobScreen.js
│   │   ├── EditJobScreen.js
│   │   ├── HousingScreen.js        # Housing listings
│   │   ├── HousingDetailScreen.js
│   │   ├── PostHousingScreen.js
│   │   ├── EditHousingScreen.js
│   │   ├── MarketplaceScreen.js    # Buy/sell marketplace
│   │   ├── MarketplaceDetailScreen.js
│   │   ├── PostMarketplaceScreen.js
│   │   ├── EditMarketplaceScreen.js
│   │   ├── AttorneyScreen.js       # Immigration attorney directory
│   │   ├── ListAttorneyScreen.js
│   │   ├── PostAttorneyScreen.js
│   │   ├── HealthcareScreen.js     # Doctor directory
│   │   ├── ListDoctorScreen.js
│   │   ├── EventsScreen.js         # Community events
│   │   ├── CommunityScreen.js      # Community posts feed
│   │   ├── CommunityDetailScreen.js
│   │   ├── CreateCommunityScreen.js
│   │   ├── CreatePostScreen.js
│   │   ├── PostDetailScreen.js
│   │   ├── ChatScreen.js           # Direct messaging
│   │   ├── NotificationsScreen.js
│   │   ├── ProfileScreen.js        # Own profile + posts
│   │   ├── UserProfileScreen.js    # Other user's profile
│   │   ├── SettingsScreen.js
│   │   ├── SearchScreen.js
│   │   ├── ExploreScreen.js
│   │   ├── AIAssistantScreen.js
│   │   └── VisaScreen.js
│   ├── store/
│   │   ├── authStore.js            # Auth, tokens, session restore
│   │   ├── jobsStore.js
│   │   ├── housingStore.js
│   │   ├── attorneyStore.js
│   │   ├── chatStore.js
│   │   ├── locationStore.js        # GPS + reverse geocode
│   │   └── notificationStore.js
│   ├── services/
│   │   └── api.js                  # Fetch wrapper + all API calls
│   ├── context/
│   │   └── UserContext.js
│   ├── components/
│   │   ├── AppTopBar.js
│   │   └── UserAvatar.js
│   └── theme/
│       ├── ThemeContext.js         # isDark toggle + colors provider
│       └── colors.js               # darkColors / lightColors + brand palette
```

---

## Screens

### Onboarding Flow

| Screen | Purpose |
|--------|---------|
| `WelcomeScreen` | App entry — Sign up or Log in |
| `SignUpScreen` | Name, email, password, handle |
| `OTPScreen` | 6-digit email verification |
| `LoginScreen` | Email + password login |
| `ForgotPasswordScreen` | 2-step: send OTP → reset password |
| `FromCountryScreen` | Select home country + flag |
| `LivesInScreen` | GPS-detect or manually set current city |
| `InterestsScreen` | Pick interest categories |
| `AllDoneScreen` | Registers user + lands on main app |

### Main App

| Screen | Purpose |
|--------|---------|
| `HomeScreen` | Personalized dashboard: local feed, job/housing/marketplace previews, horizontal scroll cards |
| `JobsScreen` | Browse & search jobs; filter by category, country, proximity |
| `HousingScreen` | Browse & search housing listings |
| `MarketplaceScreen` | Buy/sell items in the community |
| `AttorneyScreen` | Find immigration attorneys by specialty/language |
| `HealthcareScreen` | Find immigrant-friendly doctors |
| `EventsScreen` | Browse & RSVP to community events |
| `CommunityScreen` | Community posts feed (scope: local/country/global) |
| `ChatScreen` | 1-to-1 direct messaging |
| `NotificationsScreen` | In-app notifications |
| `ProfileScreen` | Own profile, posts, settings |
| `UserProfileScreen` | Any user's public profile + posts |
| `SearchScreen` | Global search across posts and listings |
| `VisaScreen` | Visa status guide |
| `AIAssistantScreen` | AI immigration assistant |

---

## Navigation

```
Stack.Navigator
├── Welcome / SignUp / OTP / Login / ForgotPassword   (unauthenticated)
├── FromCountry / LivesIn / Interests / AllDone        (registration steps)
└── AppMain (Bottom Tabs — authenticated)
    ├── Home tab
    ├── Chat tab  (with unread badge)
    ├── [+] FAB  → CreatePost
    └── Profile tab
    
    (All detail/create/edit screens are Stack screens pushed on top of tabs)
```

The navigator reads `isAuthenticated` from `authStore` and shows the correct initial route. A loading screen with a spinner is shown while the session is being restored from secure storage.

---

## State Management (Zustand)

### `authStore`
The central auth store. Handles everything token-related.

- `restoreSession()` — runs on app launch, reads tokens from `expo-secure-store`, refreshes if expired
- `login({ email, password })` — authenticates, saves tokens, fetches `/auth/me/`
- `register(...)` — creates account, saves tokens
- `logout()` — blacklists refresh token on server, clears local tokens
- `updateProfile(fields)` — PATCHes `/auth/me/`
- `api(endpoint, options)` — authenticated fetch with **automatic silent token refresh** on 401

Tokens are stored in `expo-secure-store` (encrypted on device).

### `locationStore`
- `detect()` — called once on app launch; requests foreground permission and resolves GPS to a city string (e.g. `"Queens, NY"`)
- `forceDetect()` — high-accuracy re-detect triggered by "Near Me" buttons
- `setCity(city, lat, lng)` — manual city override
- `coordsParam()` / `nearCityParam()` — returns query param strings ready to append to API calls

### Other Stores
- `chatStore` — conversations list, unread count badge, `inConversation` flag (hides tab bar inside a chat)
- `jobsStore` / `housingStore` / `attorneyStore` — cached listings + filters
- `notificationStore` — notification list + unread count

---

## Theme System

Two color palettes in `src/theme/colors.js`:

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `C.bg` | `#0A0E1A` | `#F5F7FF` | Screen backgrounds |
| `C.card` | `#1A2236` | `#FFFFFF` | Card backgrounds |
| `C.nav` | `#121827` | `#FFFFFF` | Bottom tab bar |
| `C.vivid` | `#3B8BF7` | `#3B8BF7` | Primary accent (blue) |
| `C.gold` | `#F4A227` | `#F4A227` | Secondary accent (orange) |
| `C.teal` | `#28D99E` | `#28D99E` | Success / teal accent |
| `C.cream` | `#EEF2FF` | `#12142A` | Primary text |
| `C.c35` | `rgba(238,242,255,0.38)` | `rgba(18,20,42,0.42)` | Secondary text |
| `C.border` | `rgba(255,255,255,0.07)` | `rgba(18,20,42,0.08)` | Borders |

**Brand palette (constant across themes):**
- Orange `#F4A227` · Blue `#3B8BF7` · Teal `#28D99E`

**Header style (all screens):**
- Navy `#1B3266` header with white text and icons
- Content area uses `C.bg` (theme-aware)

Use theme anywhere:
```js
const { colors: C, isDark, toggleTheme } = useTheme();
```

---

## API Layer

### Base URL

Set in `src/store/authStore.js`:
```js
// iOS simulator
http://localhost:8000/api

// Android emulator
http://10.0.2.2:8000/api

// Physical device — use your Mac's local IP
http://192.168.x.x:8000/api
```

Or configure via `app.json` `extra.apiUrl` for builds.

### Request Flow

All authenticated requests go through `authStore.api()` which:
1. Attaches the `Bearer` token
2. On `401` — silently calls `/auth/token/refresh/`, saves new tokens, retries the original request
3. On permanent failure — clears tokens and sets `isAuthenticated: false`

### API calls (`src/services/api.js`)

```js
// Auth
auth.login({ email, password })
auth.register(body)
auth.me()
auth.updateMe(body)

// Posts
posts.list({ scope, country, near_city, lat, lng, topic, search })
posts.get(id)
posts.create(body)
posts.delete(id)
posts.like(id)
posts.comments.list(postId)
posts.comments.create(postId, body)

// Jobs
jobs.list(params)  jobs.get(id)  jobs.create(body)  jobs.update(id, body)  jobs.delete(id)

// Housing
housing.list(params)  housing.get(id)  housing.create(body)  housing.update(id, body)  housing.delete(id)

// Doctors
doctors.list(params)  doctors.get(id)  doctors.create(body)

// Attorneys
attorneys.list(params)  attorneys.get(id)  attorneys.create(body)

// Events
events.list(params)  events.get(id)  events.create(body)  events.rsvp(id)
```

---

## Local Development

### Prerequisites
- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- iOS Simulator (Xcode) or Android Emulator (Android Studio), or the **Expo Go** app on a physical device

### Setup

```bash
cd "Zabroad"

# Install dependencies
npm install

# Start the dev server
npm start
# or
npx expo start
```

Then press:
- `i` — open iOS simulator
- `a` — open Android emulator
- `w` — open in browser
- Scan the QR code with **Expo Go** to run on a physical device

### Point to local backend

Edit `src/store/authStore.js` and set `BASE_URL` to match your setup:

```js
// iOS Simulator
const BASE_URL = 'http://localhost:8000/api';

// Android Emulator
const BASE_URL = 'http://10.0.2.2:8000/api';

// Physical device (replace with your machine's IP)
const BASE_URL = 'http://192.168.1.x:8000/api';
```

---

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Configure the project (first time)
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

Set `extra.apiUrl` in `app.json` to your production Railway API URL before building:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-app.railway.app/api"
    }
  }
}
```

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo ~54` | Expo SDK |
| `react-native 0.81` | Core framework |
| `@react-navigation/native-stack` | Screen navigation |
| `@react-navigation/bottom-tabs` | Tab bar |
| `zustand ^5` | State management |
| `expo-secure-store` | Encrypted token storage |
| `expo-location` | GPS + reverse geocoding |
| `expo-image-picker` | Profile avatar / listing images |
| `expo-linear-gradient` | Gradient backgrounds |
| `react-native-maps` | Map views |
| `@expo/vector-icons` | Ionicons icon set |
| `react-native-safe-area-context` | Safe area insets |

---

## License

Private — all rights reserved.
