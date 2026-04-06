import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { UserProvider } from './src/context/UserContext';
import { useAuthStore } from './src/store/authStore';
import AppNavigator from './src/navigation/AppNavigator';

function Root() {
  const { isDark } = useTheme();
  const restoreSession = useAuthStore(s => s.restoreSession);

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserProvider>
          <Root />
        </UserProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
