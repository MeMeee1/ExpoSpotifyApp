import { Redirect } from 'expo-router';
import { View, Text } from 'react-native';
import { useAuth } from '@/components/AuthContext';
import SpotifyHomeScreen from '@/app/(drawer)/(tabs)';
export default function Index() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Text>Loading...</Text>;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }

   return <Redirect href="/(drawer)/(tabs)" />;
}


