import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { RootNavigator } from './src/navigation/RootNavigator';
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

  React.useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  // Keep the splash screen up until the font is ready (falls back to the system font on error).
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <RootNavigator />
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
