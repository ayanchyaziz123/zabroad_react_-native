import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';

// Onboarding
import WelcomeScreen    from '../screens/onboarding/WelcomeScreen';
import SignUpScreen     from '../screens/onboarding/SignUpScreen';
import LoginScreen      from '../screens/onboarding/LoginScreen';
import FromCountryScreen from '../screens/onboarding/FromCountryScreen';
import LivesInScreen    from '../screens/onboarding/LivesInScreen';
import InterestsScreen  from '../screens/onboarding/InterestsScreen';
import AllDoneScreen    from '../screens/onboarding/AllDoneScreen';
import OTPScreen        from '../screens/onboarding/OTPScreen';

// Main app
import HomeScreen       from '../screens/HomeScreen';
import ChatScreen       from '../screens/ChatScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import ProfileScreen    from '../screens/ProfileScreen';
import HealthcareScreen from '../screens/HealthcareScreen';
import JobsScreen       from '../screens/JobsScreen';
import HousingScreen    from '../screens/HousingScreen';
import AttorneyScreen       from '../screens/AttorneyScreen';
import AIAssistantScreen   from '../screens/AIAssistantScreen';
import CommunityScreen     from '../screens/CommunityScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import VisaScreen          from '../screens/VisaScreen';
import PostDetailScreen    from '../screens/PostDetailScreen';
import SettingsScreen           from '../screens/SettingsScreen';
import CommunityDetailScreen   from '../screens/CommunityDetailScreen';
import SearchScreen            from '../screens/SearchScreen';
import CreateCommunityScreen   from '../screens/CreateCommunityScreen';
import UserProfileScreen       from '../screens/UserProfileScreen';
import ListAttorneyScreen      from '../screens/ListAttorneyScreen';
import PostJobScreen           from '../screens/PostJobScreen';
import ListDoctorScreen        from '../screens/ListDoctorScreen';
import EventsScreen            from '../screens/EventsScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


function CustomTabBar({ state, navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  // Order: Home · AI · [+] · Chat · Profile
  const allTabs = [
    { type: 'tab', name: 'Home',        icon: '🏠', label: 'Home'    },
    { type: 'tab', name: 'AIAssistant', icon: '🤖', label: 'AI'      },
    { type: 'fab' },
    { type: 'tab', name: 'Chat',        icon: '💬', label: 'Chat'    },
    { type: 'tab', name: 'Profile',     icon: '👤', label: 'Profile' },
  ];

  return (
    <View style={s.tabBar}>
      {allTabs.map((item) => {
        if (item.type === 'fab') {
          return (
            <TouchableOpacity key="fab" style={s.fab} onPress={() => navigation.navigate('CreatePost')} activeOpacity={0.85}>
              <Text style={s.fabIcon}>+</Text>
            </TouchableOpacity>
          );
        }
        if (item.type === 'nav') {
          return (
            <TouchableOpacity
              key={item.name}
              style={s.tabItem}
              onPress={() => navigation.navigate(item.name)}
              activeOpacity={0.7}
            >
              <Text style={s.tabIcon}>{item.icon}</Text>
              <Text style={s.tabLabel}>{item.label}</Text>
            </TouchableOpacity>
          );
        }
        const routeIndex = state.routes.findIndex(r => r.name === item.name);
        const isActive   = state.index === routeIndex;
        return (
          <TouchableOpacity
            key={item.name}
            style={[s.tabItem, isActive && s.tabItemActive]}
            onPress={() => navigation.navigate(item.name)}
            activeOpacity={0.7}
          >
            <Text style={s.tabIcon}>{item.icon}</Text>
            <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"        component={HomeScreen} />
      <Tab.Screen name="AIAssistant" component={AIAssistantScreen} />
      <Tab.Screen name="Chat"        component={ChatScreen} />
      <Tab.Screen name="Profile"     component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isLoading       = useAuthStore(s => s.isLoading);
  const { colors: C }   = useTheme();

  // Show a blank loading screen while the session is being restored so there's
  // no flash of the wrong screen.
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.vivid} />
      </View>
    );
  }

  const initialRoute = isAuthenticated ? 'AppMain' : 'Welcome';

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {/* Onboarding flow */}
        <Stack.Screen name="Welcome"     component={WelcomeScreen} />
        <Stack.Screen name="SignUp"      component={SignUpScreen} />
        <Stack.Screen name="Login"       component={LoginScreen} />
        <Stack.Screen name="FromCountry" component={FromCountryScreen} />
        <Stack.Screen name="LivesIn"     component={LivesInScreen} />
        <Stack.Screen name="Interests"   component={InterestsScreen} />
        <Stack.Screen name="OTP"         component={OTPScreen} />
        <Stack.Screen name="AllDone"     component={AllDoneScreen} options={{ animation: 'fade' }} />

        {/* Main app */}
        <Stack.Screen name="AppMain"     component={MainTabs} options={{ animation: 'fade' }} />
        <Stack.Screen name="Healthcare"  component={HealthcareScreen} />
        <Stack.Screen name="Jobs"        component={JobsScreen} />
        <Stack.Screen name="Housing"     component={HousingScreen} />
        <Stack.Screen name="Attorney"      component={AttorneyScreen} />
        <Stack.Screen name="AIAssistant"   component={AIAssistantScreen} />
        <Stack.Screen name="Community"     component={CommunityScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Visa"          component={VisaScreen} />
        <Stack.Screen name="PostDetail"    component={PostDetailScreen} />
        <Stack.Screen name="Settings"         component={SettingsScreen} />
        <Stack.Screen name="CommunityDetail"   component={CommunityDetailScreen} />
        <Stack.Screen name="Search"            component={SearchScreen} />
        <Stack.Screen name="CreateCommunity"   component={CreateCommunityScreen} />
        <Stack.Screen name="UserProfile"       component={UserProfileScreen} />
        <Stack.Screen name="ListAttorney"     component={ListAttorneyScreen} />
        <Stack.Screen name="PostJob"          component={PostJobScreen} />
        <Stack.Screen name="ListDoctor"       component={ListDoctorScreen} />
        <Stack.Screen name="CreatePost"       component={CreatePostScreen} />
        <Stack.Screen name="Events"           component={EventsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const getStyles = (C) => StyleSheet.create({
  tabBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: C.nav, borderTopWidth: 1, borderTopColor: C.border,
    paddingBottom: 24, paddingTop: 10, paddingHorizontal: 8, height: 82,
  },
  tabItem: { alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 6, borderRadius: 14 },
  tabItemActive: { backgroundColor: C.vividD },
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: C.c35 },
  tabLabelActive: { color: C.vivid },
  fab: {
    width: 50, height: 50, borderRadius: 17, backgroundColor: C.vivid,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: C.vivid, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  fabIcon: { color: 'white', fontSize: 24, fontWeight: '300', lineHeight: 28 },
});
