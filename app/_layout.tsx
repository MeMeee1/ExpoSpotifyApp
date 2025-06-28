import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import {useColorScheme} from '@/components/useColorScheme';
import { AuthProvider } from '@/components/AuthContext';
export { ErrorBoundary } from 'expo-router';

// Remove the initialRouteName setting since we're handling it dynamically
// export const unstable_settings = {
//   initialRouteName: '(auth)',
// };

const FONT_FILES = {
  'Gotham-Bold': require('@/assets/fonts/Gotham-Bold.otf'),
  'Gotham-Light': require('@/assets/fonts/Gotham-Light.otf'),
  'Gotham-LightItalic': require('@/assets/fonts/Gotham-LightItalic.otf'),
  'Gotham-Medium': require('@/assets/fonts/Gotham-Medium.otf'),
  'Gotham-Thin': require('@/assets/fonts/Gotham-Thin.otf'),
  'Gotham-Black': require('@/assets/fonts/Gotham-Black.otf'),
  'SpaceMono-Regular': require('@/assets/fonts/SpaceMono-Regular.ttf'),
  ...FontAwesome.font,
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(FONT_FILES);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootLayoutNav isAuthenticated={isAuthenticated} />
    </ThemeProvider>
  );
}

type RootLayoutNavProps = {
  isAuthenticated: boolean;
};

function RootLayoutNav({ isAuthenticated }: RootLayoutNavProps) {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right', // Consistent animation for all screens
          presentation: 'card', // Consistent presentation for all screens
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="songs" />
        <Stack.Screen name="(drawer)" />
        <Stack.Screen name="(artist)/[id]" />
        <Stack.Screen name="(album)/[id]" />
        <Stack.Screen name="(podcast)/[id]" /> 
        <Stack.Screen name="(playlist)/[id]" /> 
      </Stack>
    </AuthProvider>
  )}

