import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, LinkingOptions, NavigationState } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { WorkerNavigator } from './WorkerNavigator';
import { EmployerNavigator } from './EmployerNavigator';
import { AdminNavigator } from './AdminNavigator';
import { useAuthStore } from '../store/authStore';
import { setLangScope } from '../lib/i18n';
import { useUiStore } from '../store/uiStore';
import { ToastContainer } from '../components/ui/Toast';
import { OfflineBanner } from '../components/layout/OfflineBanner';
import { setUnauthorizedHandler } from '../api/client';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Deep links, e.g. industrialink://job/job_1 (shared job links, notifications). */
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'industrialink://'],
  config: {
    screens: {
      Auth: { screens: { Login: 'login', Signup: 'signup', ForgotPassword: 'forgot-password', ResetPassword: 'reset-password' } },
      Worker: {
        initialRouteName: 'WorkerTabs',
        screens: {
          WorkerTabs: {
            screens: {
              WorkerHome: 'home',
              FindJobs: 'jobs',
              Applications: 'applications',
              Messages: 'messages',
              WorkerProfile: 'profile',
            },
          },
          JobDetail: 'job/:jobId',
          SavedJobs: 'saved',
          ApplicationDetail: 'application/:applicationId',
          Companies: 'companies',
          CompanyDetail: 'company/:companyId',
          ChatThread: 'chat/:threadId',
          Inbox: 'inbox',
          Help: 'help',
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
                  Messages: 'employer/messages',
                  FindWorkers: 'employer/workers',
                },
              },
              Company: 'employer/company',
              Analytics: 'employer/analytics',
              Settings: 'employer/settings',
            },
          },
          PostJobWizard: 'employer/post-job/:jobId?',
          CandidateDossier: 'employer/candidate/:candidateId',
          JobApplicants: 'employer/job/:jobId',
          Inbox: 'employer/inbox',
          Help: 'employer/help',
        },
      },
      Admin: {
        screens: {
          AdminHome: 'admin',
          VerificationsQueue: 'admin/verifications',
          Reports: 'admin/reports',
          UsersManagement: 'admin/users',
          JobsModeration: 'admin/jobs',
          ActivityLog: 'admin/activity',
          Settings: 'admin/settings',
        },
      },
    },
  },
};

/** Last navigation state, so a language change (which remounts navigation) keeps the current screen. */
let savedNavState: NavigationState | undefined;

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, role, isLoading, initAuth, user } = useAuthStore();
  const { theme, colors, loadPrefs, language } = useUiStore();

  useEffect(() => {
    loadPrefs().finally(() => initAuth());
  // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on app start
  }, []);

  // An expired or revoked session (401 from the server) sends the user back to Login once.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!useAuthStore.getState().isAuthenticated) return;
      useAuthStore.getState().logout();
      useUiStore.getState().showToast('Your session ended. Please log in again.', 'warning');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Development builds only: industrialink://dev/worker | employer | admin logs in with the
  // backend's test login, dev/logout signs out. Handy for checking screens from a script.
  useEffect(() => {
    if (!__DEV__) return;
    const handle = (url: string | null) => {
      const path = url ? (Linking.parse(url).path ?? '') : '';
      if (path === 'dev/logout') return void useAuthStore.getState().logout();
      const match = path.match(/^dev\/(worker|employer|admin)$/);
      if (match) {
        useAuthStore
          .getState()
          .loginAsDemo(match[1] as 'worker' | 'employer' | 'admin')
          .catch(() => useUiStore.getState().showToast('Test login failed. Is the backend running?', 'error'));
      }
    };
    void Linking.getInitialURL().then(handle);
    const subscription = Linking.addEventListener('url', ({ url }) => handle(url));
    return () => subscription.remove();
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

  // Translations cover worker and logged-out screens only; HR and admin always see English.
  setLangScope(!isAuthenticated || role === 'worker');

  return (
    // A new language redraws every screen; the saved navigation state keeps the user where they were.
    <NavigationContainer
      key={language}
      theme={navigationTheme}
      linking={linking}
      initialState={savedNavState}
      onStateChange={(s) => {
        savedNavState = s;
      }}
    >
      <OfflineBanner>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          ) : user && !user.onboarded && role !== 'admin' ? (
            // New account: finish the short setup first, then the app opens.
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : role === 'worker' ? (
            <Stack.Screen name="Worker" component={WorkerNavigator} />
          ) : role === 'employer' ? (
            <Stack.Screen name="Employer" component={EmployerNavigator} />
          ) : (
            <Stack.Screen name="Admin" component={AdminNavigator} />
          )}
        </Stack.Navigator>
      </OfflineBanner>
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
