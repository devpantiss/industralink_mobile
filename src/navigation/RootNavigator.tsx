import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
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
import { USE_MOCKS } from '../api/client';
import type { Role } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Deep links, e.g. industrialink://job/job_1 (shared job links, notifications). */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'industrialink://'],
  config: {
    screens: {
      Auth: { screens: { Login: 'login', Signup: 'signup' } },
      Worker: {
        initialRouteName: 'WorkerTabs',
        screens: {
          WorkerTabs: {
            screens: {
              WorkerHome: 'home',
              FindJobs: 'jobs',
              Applications: 'applications',
              SavedJobs: 'saved',
              WorkerProfile: 'profile',
            },
          },
          JobDetail: 'job/:jobId',
          ApplicationDetail: 'application/:applicationId',
          CompanyDetail: 'company/:companyId',
          ChatThread: 'chat/:threadId',
          Settings: 'settings',
        },
      },
      Employer: {
        initialRouteName: 'EmployerDrawer',
        screens: {
          EmployerDrawer: {
            screens: {
              EmployerMain: {
                screens: {
                  EmployerDashboard: 'employer',
                  EmployerJobs: 'employer/jobs',
                  Candidates: 'employer/candidates',
                  FindWorkers: 'employer/workers',
                },
              },
              Settings: 'employer/settings',
            },
          },
          PostJobWizard: 'employer/post-job',
          CandidateDossier: 'employer/candidate/:candidateId',
        },
      },
      Admin: {
        screens: {
          VerificationsQueue: 'admin',
          UsersManagement: 'admin/users',
          Settings: 'admin/settings',
        },
      },
    },
  },
};

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, role, isLoading, initAuth } = useAuthStore();
  const { theme, colors, loadPrefs } = useUiStore();

  useEffect(() => {
    loadPrefs().finally(() => initAuth());
  }, []);

  // Demo links (mock data only): industrialink://demo/worker | employer | admin signs in as that role,
  // demo/logout signs out, demo/light | dark | system sets the theme.
  useEffect(() => {
    if (!USE_MOCKS) return;
    const handle = (url: string | null) => {
      const path = url ? Linking.parse(url).path ?? '' : '';
      if (path === 'demo/logout') return void useAuthStore.getState().logout();
      const th = path.match(/^demo\/(light|dark|system)$/);
      if (th) return useUiStore.getState().setThemePref(th[1] as 'light' | 'dark' | 'system');
      const m = path.match(/^demo\/(worker|employer|admin)$/);
      if (m) useAuthStore.getState().loginAsDemo(m[1] as Role);
    };
    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', (e) => handle(e.url));
    return () => sub.remove();
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
    <NavigationContainer theme={navigationTheme} linking={linking}>
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
