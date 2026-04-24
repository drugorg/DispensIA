import { useUser } from '@clerk/clerk-expo';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
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

const steps = [
  { icon: '📱', label: 'Apri TikTok', sub: 'Trova il video ricetta che ti interessa' },
  { icon: '🔗', label: 'Copia il link', sub: 'Tocca "Condividi" → "Copia link"' },
  { icon: '📋', label: 'Incolla qui', sub: 'Premi Estrai e lascia fare all\'AI' },
];

export default function AddScreen() {
  const { user } = useUser();
  const qc = useQueryClient();
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const mut = useMutation({
    mutationFn: () => extractRecipe(url, user!.id),
    onSuccess: () => {
      setStatus('success');
      setUrl('');
      qc.invalidateQueries({ queryKey: ['recipes', user?.id] });
      setTimeout(() => {
        setStatus('idle');
        router.push('/(tabs)');
      }, 1500);
    },
    onError: () => {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    },
  });

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) setUrl(text);
    } catch {}
  };

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
            <Text style={styles.title}>Aggiungi ricetta</Text>
            <Text style={styles.subtitle}>Incolla un link TikTok e l'AI farà il resto</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>LINK TIKTOK</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="link" size={18} color={colors.text3} />
              <TextInput
                style={styles.input}
                placeholder="Link TikTok o Instagram..."
                placeholderTextColor={colors.text3}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
              <Pressable onPress={handlePaste} style={styles.pasteBtn}>
                <Ionicons name="clipboard-outline" size={14} color={colors.text2} />
                <Text style={styles.pasteText}>Incolla</Text>
              </Pressable>
            </View>

            <Pressable
              style={[styles.extractBtn, (!url.trim() || mut.isPending) && { opacity: 0.5 }]}
              onPress={() => mut.mutate()}
              disabled={!url.trim() || mut.isPending}
            >
              {mut.isPending ? (
                <>
                  <ActivityIndicator color="white" />
                  <Text style={styles.extractText}>Analisi in corso...</Text>
                </>
              ) : (
                <Text style={styles.extractText}>Estrai ricetta</Text>
              )}
            </Pressable>

            {status === 'success' && (
              <View style={[styles.toast, { backgroundColor: 'rgba(48,217,104,0.1)', borderColor: 'rgba(48,217,104,0.3)' }]}>
                <Text style={[styles.toastText, { color: colors.green }]}>✓ Ricetta salvata nel tuo Vault!</Text>
              </View>
            )}
            {status === 'error' && (
              <View style={[styles.toast, { backgroundColor: 'rgba(255,59,48,0.1)', borderColor: 'rgba(255,59,48,0.3)' }]}>
                <Text style={[styles.toastText, { color: colors.red }]}>✗ Impossibile estrarre. Riprova.</Text>
              </View>
            )}
            {mut.isPending && (
              <View style={[styles.toast, { backgroundColor: 'rgba(255,107,53,0.08)', borderColor: 'rgba(255,107,53,0.2)' }]}>
                <Text style={[styles.toastText, { color: colors.accent2 }]}>🤖 Può richiedere 10-30 secondi</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionLabel}>COME FUNZIONA</Text>
          <View style={{ gap: 10, paddingHorizontal: 16 }}>
            {steps.map((s, i) => (
              <View key={i} style={styles.stepCard}>
                <Text style={{ fontSize: 22 }}>{s.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepLabel}>{s.label}</Text>
                  <Text style={styles.stepSub}>{s.sub}</Text>
                </View>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
              </View>
            ))}
          </View>
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
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.text3,
    marginBottom: 10,
  },
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
  stepLabel: { color: colors.text, fontWeight: '600', fontSize: 14 },
  stepSub: { color: colors.text2, fontSize: 12, marginTop: 2 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
});
