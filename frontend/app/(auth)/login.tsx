import { useSignIn, useSSO } from '@clerk/clerk-expo';
import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSendCode = async () => {
    if (!isLoaded || !email.trim()) return;
    setLoading(true);
    try {
      const { supportedFirstFactors } = await signIn.create({ identifier: email });
      const factor = supportedFirstFactors?.find((f: any) => f.strategy === 'email_code');
      if (!factor) throw new Error('Email code non supportato');
      await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: (factor as any).emailAddressId });
      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert('Errore', err.errors?.[0]?.message || 'Impossibile inviare il codice');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyCode = async () => {
    if (!isLoaded || !code.trim()) return;
    setLoading(true);
    try {
      const res = await signIn.attemptFirstFactor({ strategy: 'email_code', code });
      if (res.status === 'complete') {
        await setActive({ session: res.createdSessionId });
      }
    } catch (err: any) {
      Alert.alert('Errore', err.errors?.[0]?.message || 'Codice non valido');
    } finally {
      setLoading(false);
    }
  };

  const onOAuth = async (strategy: 'oauth_google' | 'oauth_apple') => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy });
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
      }
    } catch (err: any) {
      Alert.alert('Errore', err.message || 'Login fallito');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.logo}>
            Dispens<Text style={styles.logoAccent}>IA</Text>
          </Text>
          <Text style={styles.tagline}>Video TikTok → ricette in secondi</Text>
        </View>

        {!pendingVerification ? (
          <View style={styles.form}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => onOAuth('oauth_google')}>
              <Ionicons name="logo-google" size={18} color={colors.text} />
              <Text style={styles.btnGhostText}>Continua con Google</Text>
            </Pressable>

            <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => onOAuth('oauth_apple')}>
              <Ionicons name="logo-apple" size={18} color={colors.text} />
              <Text style={styles.btnGhostText}>Continua con Apple</Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>oppure</Text>
              <View style={styles.dividerLine} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.text3}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Pressable
              style={[styles.btn, styles.btnPrimary, (!email || loading) && styles.btnDisabled]}
              onPress={onSendCode}
              disabled={!email || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.btnPrimaryText}>Continua con Email</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.verifyText}>
              Ti abbiamo inviato un codice via email a{'\n'}
              <Text style={{ fontWeight: '600', color: colors.text }}>{email}</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Codice di verifica"
              placeholderTextColor={colors.text3}
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
            />
            <Pressable
              style={[styles.btn, styles.btnPrimary, (!code || loading) && styles.btnDisabled]}
              onPress={onVerifyCode}
              disabled={!code || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.btnPrimaryText}>Verifica codice</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setPendingVerification(false)}>
              <Text style={styles.backLink}>← Cambia email</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 40 },
  header: { alignItems: 'center', gap: 8 },
  logo: { fontSize: 44, fontWeight: '800', color: colors.text, letterSpacing: -2 },
  logoAccent: { color: colors.accent },
  tagline: { color: colors.text2, fontSize: 14 },
  form: { gap: 12 },
  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  btnPrimary: { backgroundColor: colors.accent },
  btnPrimaryText: { color: 'white', fontWeight: '700', fontSize: 15 },
  btnGhost: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border },
  btnGhostText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 6 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.text3, fontSize: 12 },
  input: {
    height: 52,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 15,
  },
  verifyText: { color: colors.text2, textAlign: 'center', marginBottom: 8, lineHeight: 22 },
  backLink: { color: colors.text2, textAlign: 'center', marginTop: 12, fontSize: 14 },
});
