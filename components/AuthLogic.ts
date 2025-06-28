import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import { router } from 'expo-router';

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

const checkTokenValidity = async (): Promise<boolean> => {
  try {
    const [accessToken, expirationDate, refreshToken] = await Promise.all([
      AsyncStorage.getItem('token'),
      AsyncStorage.getItem('expirationDate'),
      AsyncStorage.getItem('refreshToken'),
    ]);

    if (!accessToken || !expirationDate) return false;

    if (Date.now() < parseInt(expirationDate, 10)) {
      router.replace('/(drawer)/(tabs)');
      return true;
    }

    if (refreshToken) {
      return await refreshAccessToken(refreshToken);
    }

    await clearTokens();
    return false;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

const refreshAccessToken = async (refreshToken: string): Promise<boolean> => {
  try {
    const response = await AuthSession.refreshAsync(
      {
        clientId: 'f2c6ebf244f443ed86318a8df1dddd76',
        refreshToken,
      },
      discovery
    );

    if (response.accessToken) {
      const expiresIn = (response.expiresIn || 3600) * 1000;
      await AsyncStorage.multiSet([
        ['token', response.accessToken],
        ['expirationDate', (Date.now() + expiresIn).toString()],
        ['refreshToken', response.refreshToken || refreshToken],
      ]);
      router.replace('/(drawer)/(tabs)');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token refresh error:', error);
    await clearTokens();
    return false;
  }
};

const clearTokens = async (): Promise<void> => {
  await AsyncStorage.multiRemove(['token', 'expirationDate', 'refreshToken']);
};

const authenticate = async (): Promise<void> => {
  const redirectUri = AuthSession.makeRedirectUri({
    native: 'myapp://oauth',
  });
  console.log("Redirect URI:", redirectUri);

  const config: AuthSession.AuthRequestConfig = {
    clientId: 'f2c6ebf244f443ed86318a8df1dddd76',
    scopes: [
      'user-read-email',
      'user-library-read',
      'user-read-recently-played',
      'user-top-read',
      'playlist-read-private',
      'playlist-read-collaborative',
      'playlist-modify-public',
    ],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  };

  const request = new AuthSession.AuthRequest(config);

  try {
    await request.makeAuthUrlAsync(discovery);
    const result = await request.promptAsync(discovery);
    console.log("Auth result:", result);

    if (result.type === 'success' && result.params.code) {
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId: config.clientId,
          code: result.params.code,
          redirectUri: config.redirectUri,
          extraParams: {
            code_verifier: request.codeVerifier || '',
          },
        },
        discovery
      );

      const expiresIn = (tokenResponse.expiresIn || 3600) * 1000;
      await AsyncStorage.multiSet([
        ['token', tokenResponse.accessToken],
        ['expirationDate', (Date.now() + expiresIn).toString()],
        ['refreshToken', tokenResponse.refreshToken || ''],
      ]);

      router.replace('/(drawer)/(tabs)');
    } else {
      console.error("Authentication was not successful:", result);
    }
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
};

const logout = async (): Promise<void> => {
  console.log('Logging out...');
  await clearTokens();
  router.replace('/');
};

export { checkTokenValidity, authenticate, logout, refreshAccessToken };
