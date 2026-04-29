import { useUser } from '@clerk/clerk-expo';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createRecipe, Ingredient } from '../lib/api';
import { colors } from '../lib/theme';

export default function AddManualScreen() {
  const { user } = useUser();
  const qc = useQueryClient();
  const { t } = useTranslation();

  const [titolo, setTitolo] = useState('');
  const [ingredienti, setIngredienti] = useState<Ingredient[]>([{ nome: '', quantita: '' }]);
  const [steps, setSteps] = useState<string[]>(['']);

  const mut = useMutation({
    mutationFn: () =>
      createRecipe(user!.id, {
        titolo: titolo.trim(),
        ingredienti: ingredienti.filter(i => i.nome.trim()),
        preparazione: steps.filter(s => s.trim()),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes', user?.id] });
      router.back();
      router.push('/(tabs)' as any);
    },
    onError: (e: Error) => {
      Alert.alert(t('common.error'), e.message);
    },
  });

  const onSave = () => {
    if (!titolo.trim()) {
      Alert.alert(t('common.error'), t('add.titleRequired'));
      return;
    }
    mut.mutate();
  };

  const updateIng = (idx: number, key: keyof Ingredient, value: string) => {
    setIngredienti(prev => prev.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  };

  const removeIng = (idx: number) => {
    setIngredienti(prev => prev.filter((_, i) => i !== idx));
  };

  const updateStep = (idx: number, value: string) => {
    setSteps(prev => prev.map((s, i) => (i === idx ? value : s)));
  };

  const removeStep = (idx: number) => {
    setSteps(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Text style={styles.topbarTitle}>{t('add.manualScreenTitle')}</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>{t('add.titleLabel')}</Text>
          <TextInput
            style={styles.input}
            value={titolo}
            onChangeText={setTitolo}
            placeholder={t('add.titlePlaceholder')}
            placeholderTextColor={colors.text3}
          />

          <Text style={styles.label}>{t('add.ingredientsLabel')}</Text>
          {ingredienti.map((ing, idx) => (
            <View key={idx} style={styles.row}>
              <TextInput
                style={[styles.input, styles.inputFlex2, { marginBottom: 0 }]}
                value={ing.nome}
                onChangeText={v => updateIng(idx, 'nome', v)}
                placeholder={t('add.ingredientPlaceholder')}
                placeholderTextColor={colors.text3}
              />
              <TextInput
                style={[styles.input, styles.inputFlex1, { marginBottom: 0 }]}
                value={ing.quantita}
                onChangeText={v => updateIng(idx, 'quantita', v)}
                placeholder={t('add.qtyPlaceholder')}
                placeholderTextColor={colors.text3}
              />
              {ingredienti.length > 1 && (
                <Pressable onPress={() => removeIng(idx)} hitSlop={8} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={22} color={colors.text3} />
                </Pressable>
              )}
            </View>
          ))}
          <Pressable
            style={styles.addRowBtn}
            onPress={() => setIngredienti(prev => [...prev, { nome: '', quantita: '' }])}
          >
            <Ionicons name="add" size={18} color={colors.accent} />
            <Text style={styles.addRowText}>{t('add.addIngredient')}</Text>
          </Pressable>

          <Text style={styles.label}>{t('add.stepsLabel')}</Text>
          {steps.map((s, idx) => (
            <View key={idx} style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={s}
                onChangeText={v => updateStep(idx, v)}
                placeholder={t('add.stepPlaceholder', { n: idx + 1 })}
                placeholderTextColor={colors.text3}
                multiline
              />
              {steps.length > 1 && (
                <Pressable onPress={() => removeStep(idx)} hitSlop={8} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={22} color={colors.text3} />
                </Pressable>
              )}
            </View>
          ))}
          <Pressable style={styles.addRowBtn} onPress={() => setSteps(prev => [...prev, ''])}>
            <Ionicons name="add" size={18} color={colors.accent} />
            <Text style={styles.addRowText}>{t('add.addStep')}</Text>
          </Pressable>

          <Pressable
            style={[styles.saveBtn, (!titolo.trim() || mut.isPending) && { opacity: 0.5 }]}
            onPress={onSave}
            disabled={!titolo.trim() || mut.isPending}
          >
            {mut.isPending ? (
              <>
                <ActivityIndicator color="white" />
                <Text style={styles.saveText}>{t('add.saving')}</Text>
              </>
            ) : (
              <Text style={styles.saveText}>{t('add.save')}</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topbarTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.text3,
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  inputFlex2: { flex: 2 },
  inputFlex1: { flex: 1 },
  removeBtn: { padding: 2 },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  addRowText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  saveBtn: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.accent,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  saveText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
