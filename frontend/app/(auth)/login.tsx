import { useSignIn, useSignUp, useSSO } from '@clerk/clerk-expo';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  const showError = (err: any) => {
    Alert.alert(t('login.errorTitle'), err?.errors?.[0]?.message || err?.message || 'Unknown error');
  };

  const resetVerification = () => {
    setPendingVerification(false);
    setCode('');
  };

  const switchMode = () => {
    setMode(m => (m === 'signIn' ? 'signUp' : 'signIn'));
    setPassword('');
    resetVerification();
  };

  const onSignIn = async () => {
    if (!signInLoaded || !email.trim() || !password) return;
    setLoading(true);
    try {
      const res = await signIn!.create({ identifier: email, password });
      if (res.status === 'complete') {
        await setActiveSignIn!({ session: res.createdSessionId });
      } else {
        // Edge case: 2FA or other extra steps required
        Alert.alert(t('login.errorTitle'), 'Additional verification required');
      }
    } catch (err: any) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async () => {
    if (!signUpLoaded || !email.trim() || !password) return;
    setLoading(true);
    try {
      await signUp!.create({ emailAddress: email, password });
      await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyCode = async () => {
    if (!signUpLoaded || !code.trim()) return;
    setLoading(true);
    try {
      const res = await signUp!.attemptEmailAddressVerification({ code });
      if (res.status === 'complete') {
        await setActiveSignUp!({ session: res.createdSessionId });
      }
    } catch (err: any) {
      showError(err);
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
      showError(err);
    }
  };

  const isSignUp = mode === 'signUp';
  const submitHandler = isSignUp ? onSignUp : onSignIn;
  const submitLabel = isSignUp ? t('login.createAccount') : t('login.signIn');
  const submitDisabled = !email || !password || loading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.inner}>
            <View style={styles.header}>
              <Text style={styles.logo}>
                Dispens<Text style={styles.logoAccent}>IA</Text>
              </Text>
              <Text style={styles.tagline}>
                {pendingVerification ? t('login.tagline') : (isSignUp ? t('login.signUpTitle') : t('login.signInTitle'))}
              </Text>
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
                  autoComplete="email"
                  textContentType="emailAddress"
                  value={email}
                  onChangeText={setEmail}
                />

                <TextInput
                  style={styles.input}
                  placeholder={t('login.passwordPlaceholder')}
                  placeholderTextColor={colors.text3}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  textContentType={isSignUp ? 'newPassword' : 'password'}
                  value={password}
                  onChangeText={setPassword}
                />

                <Pressable
                  style={[styles.btn, styles.btnPrimary, submitDisabled && styles.btnDisabled]}
                  onPress={submitHandler}
                  disabled={submitDisabled}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>{submitLabel}</Text>
                  )}
                </Pressable>

                <Pressable onPress={switchMode}>
                  <Text style={styles.switchText}>
                    {isSignUp ? t('login.hasAccount') : t('login.noAccount')}
                  </Text>
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
                  textContentType="oneTimeCode"
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
                <Pressable onPress={resetVerification}>
                  <Text style={styles.backLink}>{t('login.changeEmail')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  inner: { paddingHorizontal: 24, gap: 40, paddingVertical: 32 },
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
  switchText: { color: colors.accent, textAlign: 'center', marginTop: 4, fontSize: 14 },
});
