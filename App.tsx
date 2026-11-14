import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AnimatedSplash } from './src/components/layout/AnimatedSplash';
import { useAuthStore } from './src/store/authStore';
import { ErrorBoundary } from './src/components/layout/ErrorBoundary';
import { fontFamilies } from './src/theme/fonts';
import { USE_MOCKS } from './src/api/client';
import { loadDemoData, saveDemoData } from './src/mocks/persist';

// Demo mode: bring back what was done last time (applications, approvals, ...).
if (USE_MOCKS) loadDemoData();

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  // Every change goes through a mutation, so saving after each one keeps the demo data.
  mutationCache: new MutationCache({ onSettled: () => (USE_MOCKS ? saveDemoData() : undefined) }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
    },
  },
});

export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontFamilies);
  const authLoading = useAuthStore((s) => s.isLoading);
  const [showIntro, setShowIntro] = React.useState(true);

  // Keep the native splash up until the font is ready (falls back to the system font on error).
  // Then the animated intro takes over (it hides the native splash once it is drawn) and plays
  // while the app loads underneath.
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <RootNavigator />
          </QueryClientProvider>
        </ErrorBoundary>
        {showIntro && (
          <AnimatedSplash
            ready={!authLoading}
            onShown={() => SplashScreen.hideAsync().catch(() => {})}
            onDone={() => setShowIntro(false)}
          />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
