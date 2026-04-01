import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';

// Onboarding
import WelcomeScreen    from '../screens/onboarding/WelcomeScreen';
import SignUpScreen     from '../screens/onboarding/SignUpScreen';
import LoginScreen      from '../screens/onboarding/LoginScreen';
import FromCountryScreen from '../screens/onboarding/FromCountryScreen';
import LivesInScreen    from '../screens/onboarding/LivesInScreen';
import InterestsScreen  from '../screens/onboarding/InterestsScreen';
import AllDoneScreen    from '../screens/onboarding/AllDoneScreen';

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

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TABS = [
  { name: 'Home',       icon: '🏠',  label: 'Home'      },
  { name: 'Chat',       icon: '💬',  label: 'Chat'      },
  { name: 'Healthcare', icon: '🩺',  label: 'Health'    },
  { name: 'Attorney',   icon: '⚖️',  label: 'Attorney'  },
  { name: 'Profile',    icon: '👤',  label: 'Profile'   },
];

function CustomTabBar({ state, navigation }) {
  const { colors: C } = useTheme();
  const s = useMemo(() => getStyles(C), [C]);

  return (
    <View style={s.tabBar}>
      {TABS.map((tab) => {
        const routeIndex = state.routes.findIndex(r => r.name === tab.name);
        const isActive   = state.index === routeIndex;
        return (
          <TouchableOpacity
            key={tab.name}
            style={[s.tabItem, isActive && s.tabItemActive]}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.7}
          >
            <Text style={s.tabIcon}>{tab.icon}</Text>
            <Text style={[s.tabLabel, isActive && s.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home"       component={HomeScreen} />
      <Tab.Screen name="Chat"       component={ChatScreen} />
      <Tab.Screen name="Healthcare" component={HealthcareScreen} />
      <Tab.Screen name="Attorney"   component={AttorneyScreen} />
      <Tab.Screen name="Profile"    component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {/* Onboarding flow */}
        <Stack.Screen name="Welcome"     component={WelcomeScreen} />
        <Stack.Screen name="SignUp"      component={SignUpScreen} />
        <Stack.Screen name="Login"       component={LoginScreen} />
        <Stack.Screen name="FromCountry" component={FromCountryScreen} />
        <Stack.Screen name="LivesIn"     component={LivesInScreen} />
        <Stack.Screen name="Interests"   component={InterestsScreen} />
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
  tabItem: { alignItems: 'center', gap: 3, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 },
  tabItemActive: { backgroundColor: C.vividD },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: C.c35 },
  tabLabelActive: { color: C.vivid },
  fab: {
    width: 50, height: 50, borderRadius: 17, backgroundColor: C.vivid,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: C.vivid, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  fabIcon: { color: 'white', fontSize: 24, fontWeight: '300', lineHeight: 28 },
});
