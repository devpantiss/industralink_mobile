import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { WorkerNavigator } from './WorkerNavigator';
import { EmployerNavigator } from './EmployerNavigator';
import { AdminNavigator } from './AdminNavigator';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { ToastContainer } from '../components/ui/Toast';
import { OfflineBanner } from '../components/layout/OfflineBanner';
import '../lib/i18n';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, role, isLoading, initAuth } = useAuthStore();
  const { theme, colors } = useUiStore();

  useEffect(() => {
    initAuth();
  }, []);

  const navigationTheme = theme === 'dark' ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.canvas,
      card: colors.surface,
      text: colors.ink,
      border: colors.border,
      primary: colors.primary,
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.canvas,
      card: colors.surface,
      text: colors.ink,
      border: colors.border,
      primary: colors.primary,
    },
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor: colors.canvas }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <OfflineBanner />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : role === 'worker' ? (
          <Stack.Screen name="Worker" component={WorkerNavigator} />
        ) : role === 'employer' ? (
          <Stack.Screen name="Employer" component={EmployerNavigator} />
        ) : (
          <Stack.Screen name="Admin" component={AdminNavigator} />
        )}
      </Stack.Navigator>
      <ToastContainer />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
