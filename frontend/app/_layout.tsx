import '../lib/i18n';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../lib/theme';

const queryClient = new QueryClient();
const CLERK_KEY = 'pk_test_cGxlYXNhbnQtY2hpcG11bmstMzQuY2xlcmsuYWNjb3VudHMuZGV2JA';

function AuthGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { hasShareIntent } = useShareIntentContext();

  useEffect(() => {
    if (!isLoaded) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (isSignedIn && hasShareIntent) {
      router.push('/(tabs)/add');
    }
  }, [isLoaded, isSignedIn, segments, hasShareIntent]);

  return null;
}

export default function RootLayout() {
  return (
    <ShareIntentProvider>
    <ClerkProvider tokenCache={tokenCache} publishableKey={CLERK_KEY}>
      <ClerkLoaded>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <AuthGate />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="recipe/[id]"
              options={{
                presentation: 'modal',
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
          </Stack>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
    </ShareIntentProvider>
  );
}
