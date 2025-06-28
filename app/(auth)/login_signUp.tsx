import { View, Text, StyleSheet, Alert } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Fonts } from '@/constants/Fonts';
import Colors from '@/constants/Colors';
import CustomButton from '@/components/CustomButton';
import { ReactComponent as SvgComponent } from '@/components/svgs/SpotifySVG';
import { Images } from '@/constants/Images';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { checkTokenValidity,authenticate,logout } from '@/components/AuthLogic';


export default function AuthScreen() {
  // Theme and state setup
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { enableSignUp } = useLocalSearchParams();
  const [isLogin, setIsLogin] = useState<boolean>(enableSignUp !== 'true');
  
  useEffect(() => {
  console.log("Online chakam");
  checkTokenValidity();
}, []);





  // UI
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.upperContainer}>
        <View style={styles.iconContainer}>
          <SvgComponent width={100} height={100} fill={theme.text} />
        </View>
        <Text style={[styles.textTitle, { color: theme.text }]}>
          {isLogin ? 'Log in to Spotify' : 'Sign up to start listening'}
        </Text>
      </View>
      <View style={styles.lowerContainer}>
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Continue with Spotify"
            backgroundColor={Colors.green}
            onPress={() => {authenticate()}}
          />
          <CustomButton
            title="Continue with phone number"
            icon="mobile"
            variant="outline"
            borderColor={theme.border}
            textColor={theme.text}
            onPress={() => {logout}}
          />
          <CustomButton
            title="Continue with Google"
            image={Images.googleIcon}
            variant="outline"
            borderColor={theme.border}
            textColor={theme.text}
            onPress={() => {}}
          />
          <CustomButton
            title="Continue with Facebook"
            image={Images.facebookIcon}
            variant="outline"
            borderColor={theme.border}
            textColor={theme.text}
            onPress={() => {}}
          />
          <Text style={[styles.authDetailsText, { color: theme.text }]}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </Text>
          <CustomButton
            title={isLogin ? 'Sign Up' : 'Login'}
            variant="text"
            textColor={theme.text}
            onPress={() => setIsLogin(!isLogin)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textTitle: {
    fontFamily: Fonts.bold,
    fontSize: 24,
  },
  authDetailsText: {
    marginTop: 10,
    fontFamily: Fonts.light,
    fontSize: 14,
  },
  upperContainer: {
    flex: 0.5,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  lowerContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  buttonContainer: {
    height: '90%',
    width: '90%',
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});