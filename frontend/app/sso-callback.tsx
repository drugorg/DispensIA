import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../lib/theme';

/**
 * Landing page per il callback OAuth di Clerk (Google/Apple sign-in).
 * Clerk completa la sessione internamente; questa pagina serve solo come
 * destinazione del deep link `dispensia:///sso-callback?...`. AuthGate in
 * _layout.tsx vede la sessione attiva e redirige a /(tabs).
 */
export default function SSOCallback() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.accent} />
      <Redirect href="/" />
    </View>
  );
}
