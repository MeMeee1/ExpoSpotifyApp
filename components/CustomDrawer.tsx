import { View, Text, Image, StyleSheet } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from './CustomButton';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '@/constants/Fonts';
import { logout } from '@/components/AuthLogic'; // <-- Make sure this import is correct
import { useRouter } from 'expo-router';
export default function CustomDrawer({ navigation }: { navigation: any }) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const [userProfile, setUserProfile] = useState<any>(null);
    const router = useRouter();
  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Call logout and close drawer
  const handleLogout = async () => {
    logout();
    router.replace('/');
    
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Profile Section */}
      <View style={styles.profileContainer}>
        {userProfile?.images?.[0]?.url ? (
          <Image 
            source={{ uri: userProfile.images[0].url }} 
            style={styles.profileImage}
          />
        ) : (
          <Ionicons 
            name="person-circle" 
            size={60} 
            color={theme.text}
            style={styles.profileImage}
          />
        )}
        
        <View style={styles.profileText}>
          <Text style={[styles.displayName, { color: theme.text }]}>
            {userProfile?.display_name || 'User'}
          </Text>
          <Text style={[styles.email, { color: theme.text }]}>
            {userProfile?.email || ''}
          </Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuItemsContainer}>
        <CustomButton
          title="Logout"
          onPress={handleLogout}
          backgroundColor={Colors.green}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    width: '100%',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 3,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  profileText: {
    flex: 1,
  },
  displayName: {
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  email: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  menuItemsContainer: {
    marginTop: 5,
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 3,
  },
  menuText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
});