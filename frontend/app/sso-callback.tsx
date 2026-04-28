import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { colors } from '../lib/theme';

export default function SSOCallback() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/(tabs)');
    } else {
      // Fallback: se dopo 4 secondi non risulta loggato, torna al login
      const timer = setTimeout(() => router.replace('/(auth)/login'), 4000);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}
