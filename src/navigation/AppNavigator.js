import React, { useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useLocationStore } from '../store/locationStore';
import { useNotificationStore } from '../store/notificationStore';

// Onboarding
import WelcomeScreen    from '../screens/onboarding/WelcomeScreen';
import SignUpScreen     from '../screens/onboarding/SignUpScreen';
import LoginScreen      from '../screens/onboarding/LoginScreen';
import FromCountryScreen from '../screens/onboarding/FromCountryScreen';
import LivesInScreen    from '../screens/onboarding/LivesInScreen';
import InterestsScreen  from '../screens/onboarding/InterestsScreen';
import AllDoneScreen    from '../screens/onboarding/AllDoneScreen';
import OTPScreen             from '../screens/onboarding/OTPScreen';
import ForgotPasswordScreen  from '../screens/onboarding/ForgotPasswordScreen';

// Main app
import HomeScreen       from '../screens/HomeScreen';
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
import PostHousingScreen       from '../screens/PostHousingScreen';
import HousingDetailScreen     from '../screens/HousingDetailScreen';
import PostAttorneyScreen      from '../screens/PostAttorneyScreen';
import ListDoctorScreen        from '../screens/ListDoctorScreen';
import EventsScreen            from '../screens/EventsScreen';
import JobDetailScreen         from '../screens/JobDetailScreen';
import MarketplaceScreen        from '../screens/MarketplaceScreen';
import MarketplaceDetailScreen  from '../screens/MarketplaceDetailScreen';
import PostMarketplaceScreen    from '../screens/PostMarketplaceScreen';
import EditMarketplaceScreen    from '../screens/EditMarketplaceScreen';
import EditJobScreen            from '../screens/EditJobScreen';
import EditHousingScreen        from '../screens/EditHousingScreen';
import ChatScreen               from '../screens/ChatScreen';
import AllListingsScreen        from '../screens/AllListingsScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


function CustomTabBar({ state, navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);
  const inConversation  = useChatStore(s => s.inConversation);
  const conversations   = useChatStore(s => s.conversations);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  if (inConversation) return null;

  // Order: Home · Messages · [+] · Profile
  const allTabs = [
    { type: 'tab', name: 'Home',    icon: 'home-outline',        iconActive: 'home',        label: 'Home'                    },
    { type: 'tab', name: 'Chat',    icon: 'chatbubbles-outline', iconActive: 'chatbubbles', label: 'Messages', badge: totalUnread },
    { type: 'fab' },
    { type: 'tab', name: 'Profile', icon: 'person-outline',      iconActive: 'person',      label: 'Profile'                 },
  ];

  return (
    <View style={s.tabBar}>
      {allTabs.map((item) => {
        if (item.type === 'fab') {
          return (
            <TouchableOpacity
              key="fab"
              style={s.fabWrap}
              onPress={() => navigation.navigate('CreatePost')}
              activeOpacity={0.85}
            >
              <View style={s.fabCircle}>
                <Ionicons name="add" size={20} color="white" />
              </View>
              <Text style={s.fabLabel}>Post</Text>
            </TouchableOpacity>
          );
        }
        const routeIndex = state.routes.findIndex(r => r.name === item.name);
        const isActive   = state.index === routeIndex;
        return (
          <TouchableOpacity
            key={item.name}
            style={s.tabItem}
            onPress={() => navigation.navigate(item.name)}
            activeOpacity={0.7}
          >
            <View style={s.iconWrap}>
              <Ionicons
                name={isActive ? item.iconActive : item.icon}
                size={22}
                color={isActive ? C.vivid : C.c35}
              />
              {item.badge > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeTxt}>{item.badge > 99 ? '99+' : item.badge}</Text>
                </View>
              )}
            </View>
            <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  const fetchConversations   = useChatStore(s => s.fetchConversations);
  const detectLocation       = useLocationStore(s => s.detect);
  const fetchNotifications   = useNotificationStore(s => s.fetchNotifications);

  useEffect(() => {
    fetchConversations();
    detectLocation();
    fetchNotifications();
  }, []);

  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"          component={HomeScreen} />
      <Tab.Screen name="Chat"          component={ChatScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="AIAssistant"   component={AIAssistantScreen} />
      <Tab.Screen name="Profile"       component={ProfileScreen} />
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
        <Stack.Screen name="OTP"            component={OTPScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="AllDone"     component={AllDoneScreen} options={{ animation: 'fade' }} />

        {/* Main app */}
        <Stack.Screen name="AppMain"     component={MainTabs} options={{ animation: 'fade' }} />
        <Stack.Screen name="Healthcare"  component={HealthcareScreen} />
        <Stack.Screen name="Jobs"        component={JobsScreen} />
        <Stack.Screen name="Housing"       component={HousingScreen} />
        <Stack.Screen name="HousingDetail" component={HousingDetailScreen} />
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
        <Stack.Screen name="PostHousing"      component={PostHousingScreen} />
        <Stack.Screen name="PostAttorney"     component={PostAttorneyScreen} />
        <Stack.Screen name="ListDoctor"       component={ListDoctorScreen} />
        <Stack.Screen name="CreatePost"       component={CreatePostScreen} />
        <Stack.Screen name="Events"            component={EventsScreen} />
        <Stack.Screen name="JobDetail"         component={JobDetailScreen} />
        <Stack.Screen name="Marketplace"         component={MarketplaceScreen} />
        <Stack.Screen name="MarketplaceDetail"   component={MarketplaceDetailScreen} />
        <Stack.Screen name="PostMarketplace"     component={PostMarketplaceScreen} />
        <Stack.Screen name="EditMarketplace"     component={EditMarketplaceScreen} />
        <Stack.Screen name="EditJob"             component={EditJobScreen} />
        <Stack.Screen name="EditHousing"         component={EditHousingScreen} />
        <Stack.Screen name="AllListings"         component={AllListingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const getStyles = (C) => StyleSheet.create({
  tabBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: C.nav, borderTopWidth: 1, borderTopColor: C.border,
    paddingBottom: 20, paddingTop: 8, paddingHorizontal: 4, height: 70,
  },
  tabItem:       { alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 3 },
  tabLabel:      { fontSize: 11, fontWeight: '600', color: C.c35 },
  tabLabelActive:{ color: C.vivid, fontWeight: '700' },
  iconWrap: { position: 'relative' },
  badge:    { position: 'absolute', top: -4, right: -6, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  badgeTxt: { fontSize: 9, fontWeight: '800', color: 'white', lineHeight: 11 },
  fabWrap:   { alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 3 },
  fabCircle: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.vivid, alignItems: 'center', justifyContent: 'center' },
  fabLabel:  { fontSize: 11, fontWeight: '700', color: C.c35 },
});
