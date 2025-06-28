import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { checkTokenValidity as checkValidity, authenticate as doAuth, logout as doLogout } from './AuthLogic';

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  authenticate: () => Promise<void>;
  logout: () => Promise<void>;
  checkTokenValidity: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkTokenValidity = async () => {
    const valid = await checkValidity();
    setIsAuthenticated(valid);
    setLoading(false);
  };

  const authenticate = async () => {
    await doAuth();
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await doLogout();
    setIsAuthenticated(false);
  };

  useEffect(() => {
    checkTokenValidity();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, authenticate, logout, checkTokenValidity }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
