import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Fonts } from '@/constants/Fonts';
import Colors from '@/constants/Colors';
import CustomButton from '@/components/CustomButton';
import { ReactComponent as SvgComponent } from '@/components/svgs/SpotifySVG';
import { router } from 'expo-router';

export default function HomeAuthScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const handleAuthNavigation = (enableSignUp: boolean) => {
    router.push({
      pathname: '/(auth)/login_signUp',
      params: { enableSignUp: String(enableSignUp) }, // use string to pass boolean through route
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.upperContainer}>
        <View style={styles.iconContainer}>
          <SvgComponent width={100} height={100} fill={theme.text} />
        </View>
        <Text style={[styles.textTitle, { color: theme.text }]}>Millions of songs</Text>
        <Text style={[styles.textTitle, { color: theme.text }]}>Free on Spotify</Text>
      </View>
      <View style={styles.lowerContainer}>
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Sign up free"
            onPress={() => handleAuthNavigation(true)}
            backgroundColor={Colors.green}
          />
          <CustomButton
            title="Log in"
            onPress={() => handleAuthNavigation(false)}
            variant="outline"
            borderColor={theme.border}
            textColor={theme.text}
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
    fontSize: 30,
  },
  upperContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  lowerContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
