import { useUser } from '@clerk/clerk-expo';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
import { useShareIntentContext } from 'expo-share-intent';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { extractRecipe } from '../../lib/api';
import { colors } from '../../lib/theme';

function detectPlatform(url: string): 'tiktok' | 'instagram' | null {
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  return null;
}

export default function AddScreen() {
  const { user } = useUser();
  const qc = useQueryClient();
  const { t, i18n } = useTranslation();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const platform = detectPlatform(url);

  const mut = useMutation({
    mutationFn: (urlToExtract: string) => extractRecipe(urlToExtract, user!.id, i18n.language),
    onSuccess: () => {
      setStatus('success');
      setUrl('');
      qc.invalidateQueries({ queryKey: ['recipes', user?.id] });
      setTimeout(() => {
        setStatus('idle');
        router.push('/(tabs)');
      }, 1500);
    },
    onError: (e: Error) => {
      setErrorMsg(e.message || t('add.error'));
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    },
  });

  useEffect(() => {
    if (hasShareIntent && shareIntent?.webUrl && user?.id && !mut.isPending) {
      const sharedUrl = shareIntent.webUrl;
      setUrl(sharedUrl);
      resetShareIntent();
      mut.mutate(sharedUrl);
    }
  }, [hasShareIntent, shareIntent, user?.id]);

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) setUrl(text);
    } catch {}
  };

  const methods = [
    { icon: 'share-social-outline' as const, label: t('add.method1Label'), sub: t('add.method1Sub') },
    { icon: 'link-outline' as const, label: t('add.method2Label'), sub: t('add.method2Sub') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>
              Dispens<Text style={{ color: colors.accent }}>IA</Text>
            </Text>
          </View>

          <View style={styles.titleWrap}>
            <Text style={styles.title}>{t('add.title')}</Text>
            <Text style={styles.subtitle}>{t('add.subtitle')}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{t('add.label')}</Text>
              {platform === 'tiktok' && (
                <View style={styles.platformBadge}>
                  <Text style={styles.platformText}>TikTok</Text>
                </View>
              )}
              {platform === 'instagram' && (
                <View style={[styles.platformBadge, { backgroundColor: 'rgba(225,48,108,0.12)', borderColor: 'rgba(225,48,108,0.25)' }]}>
                  <Text style={[styles.platformText, { color: '#e1306c' }]}>Instagram</Text>
                </View>
              )}
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="link" size={18} color={colors.text3} />
              <TextInput
                style={styles.input}
                placeholder={t('add.placeholder')}
                placeholderTextColor={colors.text3}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Pressable onPress={handlePaste} style={styles.pasteBtn}>
                <Ionicons name="clipboard-outline" size={14} color={colors.text2} />
                <Text style={styles.pasteText}>{t('add.paste')}</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.extractBtn, (!url.trim() || mut.isPending) && { opacity: 0.5 }]}
              onPress={() => mut.mutate(url.trim())}
              disabled={!url.trim() || mut.isPending}
            >
              {mut.isPending ? (
                <>
                  <ActivityIndicator color="white" />
                  <Text style={styles.extractText}>{t('add.extracting')}</Text>
                </>
              ) : (
                <Text style={styles.extractText}>{t('add.extract')}</Text>
              )}
            </Pressable>

            {status === 'success' && (
              <View style={[styles.toast, { backgroundColor: 'rgba(48,217,104,0.1)', borderColor: 'rgba(48,217,104,0.3)' }]}>
                <Text style={[styles.toastText, { color: colors.green }]}>{t('add.success')}</Text>
              </View>
            )}
            {status === 'error' && (
              <View style={[styles.toast, { backgroundColor: 'rgba(255,59,48,0.1)', borderColor: 'rgba(255,59,48,0.3)' }]}>
                <Text style={[styles.toastText, { color: colors.red }]}>{errorMsg}</Text>
              </View>
            )}
            {mut.isPending && (
              <View style={[styles.toast, { backgroundColor: 'rgba(255,107,53,0.08)', borderColor: 'rgba(255,107,53,0.2)' }]}>
                <Text style={[styles.toastText, { color: colors.accent2 }]}>{t('add.wait')}</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionLabel}>{t('add.howTitle')}</Text>
          <View style={{ gap: 10, paddingHorizontal: 16, marginBottom: 24 }}>
            {methods.map((m, i) => (
              <View key={i} style={styles.stepCard}>
                <View style={styles.stepIconWrap}>
                  <Ionicons name={m.icon} size={20} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepLabel}>{m.label}</Text>
                  <Text style={styles.stepSub}>{m.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.sectionLabel}>{t('add.manualTitle')}</Text>
          <Pressable
            style={styles.manualCard}
            onPress={() => router.push('/add-manual' as any)}
          >
            <View style={styles.stepIconWrap}>
              <Ionicons name="create-outline" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepLabel}>{t('add.manualLabel')}</Text>
              <Text style={styles.stepSub}>{t('add.manualSub')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text3} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  logo: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.8 },
  titleWrap: { paddingHorizontal: 20, paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  subtitle: { color: colors.text2, fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: colors.text3 },
  platformBadge: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  platformText: { color: colors.accent, fontSize: 10, fontWeight: '700' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 10 },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bg2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pasteText: { color: colors.text2, fontSize: 12, fontWeight: '600' },
  extractBtn: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.accent,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extractText: { color: 'white', fontWeight: '700', fontSize: 15 },
  toast: { marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
  toastText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  sectionLabel: {
    paddingHorizontal: 20,
    marginBottom: 12,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.text3,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },
  stepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: { color: colors.text, fontWeight: '600', fontSize: 14 },
  stepSub: { color: colors.text2, fontSize: 12, marginTop: 2 },
  manualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
  },
});
