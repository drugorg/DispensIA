import '../lib/i18n';
import { ClerkProvider, ClerkLoaded, ClerkLoading, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../lib/theme';

const queryClient = new QueryClient();
const CLERK_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
  ?? 'pk_test_cGxlYXNhbnQtY2hpcG11bmstMzQuY2xlcmsuYWNjb3VudHMuZGV2JA';

if (__DEV__) {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const msg = args[0]?.toString?.() ?? '';
    if (msg.includes('clerk') || msg.includes('Clerk')) return;
    originalError(...args);
  };
}

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
      <ClerkLoading>
        <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </ClerkLoading>
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
            <Stack.Screen
              name="add-manual"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="tutorial"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
          </Stack>
        </QueryClientProvider>
      </ClerkLoaded>
    </ClerkProvider>
    </ShareIntentProvider>
  );
}
