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
import { resetDemoData } from '../mocks/persist';
import { setLangScope } from '../lib/i18n';
import { useUiStore } from '../store/uiStore';
import { ToastContainer } from '../components/ui/Toast';
import { OfflineBanner } from '../components/layout/OfflineBanner';
import { USE_MOCKS, setUnauthorizedHandler } from '../api/client';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import type { Role } from '../types';

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
              SavedJobs: 'saved',
              WorkerProfile: 'profile',
            },
          },
          JobDetail: 'job/:jobId',
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

  // Demo links (mock data only): industrialink://demo/worker | employer | admin signs in as that role,
  // demo/logout signs out, demo/light | dark | system sets the theme, demo/reset clears saved demo data, demo/en | hi | or sets the language.
  useEffect(() => {
    if (!USE_MOCKS) return;
    const handle = (url: string | null) => {
      const path = url ? Linking.parse(url).path ?? '' : '';
      if (path === 'demo/reset') {
        resetDemoData();
        return useUiStore.getState().showToast('Demo data reset. Close and reopen the app to start fresh.', 'info');
      }
      if (path === 'demo/logout') return void useAuthStore.getState().logout();
      const lg = path.match(/^demo\/(en|hi|or)$/);
      if (lg) return useUiStore.getState().setLanguage(lg[1] as 'en' | 'hi' | 'or');
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
      <OfflineBanner />
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
