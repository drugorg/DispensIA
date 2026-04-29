import { useSignIn, useSignUp, useSSO } from '@clerk/clerk-expo';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSendCode = async () => {
    if (!signInLoaded || !signUpLoaded || !email.trim()) return;
    setLoading(true);
    try {
      // Try sign in first
      const { supportedFirstFactors } = await signIn!.create({ identifier: email });
      const factor = supportedFirstFactors?.find((f: any) => f.strategy === 'email_code');
      if (!factor) throw new Error('Email code not supported');
      await signIn!.prepareFirstFactor({ strategy: 'email_code', emailAddressId: (factor as any).emailAddressId });
      setIsSignUp(false);
      setPendingVerification(true);
    } catch (err: any) {
      const errCode = err.errors?.[0]?.code ?? '';
      const isNotFound =
        errCode.includes('not_found') ||
        errCode.includes('identifier') ||
        errCode === 'form_password_incorrect';
      if (isNotFound) {
        // Account doesn't exist — create it
        try {
          await signUp!.create({ emailAddress: email });
          await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' });
          setIsSignUp(true);
          setPendingVerification(true);
        } catch (signUpErr: any) {
          Alert.alert(t('login.errorTitle'), signUpErr.errors?.[0]?.message || signUpErr.message);
        }
      } else {
        Alert.alert(t('login.errorTitle'), err.errors?.[0]?.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const onVerifyCode = async () => {
    if (!signInLoaded || !signUpLoaded || !code.trim()) return;
    setLoading(true);
    try {
      if (isSignUp) {
        const res = await signUp!.attemptEmailAddressVerification({ code });
        if (res.status === 'complete') {
          await setActiveSignUp!({ session: res.createdSessionId });
        }
      } else {
        const res = await signIn!.attemptFirstFactor({ strategy: 'email_code', code });
        if (res.status === 'complete') {
          await setActiveSignIn!({ session: res.createdSessionId });
        }
      }
    } catch (err: any) {
      Alert.alert(t('login.errorTitle'), err.errors?.[0]?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const onOAuth = async (strategy: 'oauth_google' | 'oauth_apple') => {
    try {
      const redirectUrl = Linking.createURL('/sso-callback');
      const { createdSessionId, setActive } = await startSSOFlow({ strategy, redirectUrl });
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
      }
    } catch (err: any) {
      Alert.alert(t('login.errorTitle'), err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.logo}>
            Dispens<Text style={styles.logoAccent}>IA</Text>
          </Text>
          <Text style={styles.tagline}>{t('login.tagline')}</Text>
        </View>

        {!pendingVerification ? (
          <View style={styles.form}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => onOAuth('oauth_google')}>
              <Ionicons name="logo-google" size={18} color={colors.text} />
              <Text style={styles.btnGhostText}>{t('login.google')}</Text>
            </Pressable>

            <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => onOAuth('oauth_apple')}>
              <Ionicons name="logo-apple" size={18} color={colors.text} />
              <Text style={styles.btnGhostText}>{t('login.apple')}</Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('login.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TextInput
              style={styles.input}
              placeholder={t('login.emailPlaceholder')}
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
                <Text style={styles.btnPrimaryText}>{t('login.continueEmail')}</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.verifyText}>
              {t('login.sentTo')}{'\n'}
              <Text style={{ fontWeight: '600', color: colors.text }}>{email}</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('login.codePlaceholder')}
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
                <Text style={styles.btnPrimaryText}>{t('login.verifyCode')}</Text>
              )}
            </Pressable>
            <Pressable onPress={() => { setPendingVerification(false); setIsSignUp(false); }}>
              <Text style={styles.backLink}>{t('login.changeEmail')}</Text>
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
