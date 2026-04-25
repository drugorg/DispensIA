import { useUser } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Linking,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withSpring,
  withSequence,
  useAnimatedRef,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchRecipes, updateRecipe } from '../../lib/api';
import { useCartStore } from '../../lib/cartStore';
import { colors } from '../../lib/theme';

const MULTIPLIERS = [0.5, 1, 1.5, 2, 3];
const MULTIPLIER_LABELS = ['½×', '1×', '1.5×', '2×', '3×'];

function scaleQty(quantita: string, mult: number): string {
  if (mult === 1) return quantita;
  return quantita.replace(/(\d+(?:[.,]\d+)?)/g, (match) => {
    const num = parseFloat(match.replace(',', '.')) * mult;
    const rounded = Math.round(num * 4) / 4;
    if (rounded <= 0) return match;
    const whole = Math.floor(rounded);
    const frac = Math.round((rounded - whole) * 4) / 4;
    const FRACS: Record<number, string> = { 0.25: '¼', 0.5: '½', 0.75: '¾' };
    const fracStr = FRACS[frac] ?? '';
    if (whole === 0) return fracStr || String(Math.round(num));
    return fracStr ? `${whole}${fracStr}` : String(whole);
  });
}

type DraftIngredient = { nome: string; quantita: string };

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const { toggle, isInCart } = useCartStore();
  const qc = useQueryClient();

  const [checked, setChecked] = useState<number[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<{
    titolo: string;
    ingredienti: DraftIngredient[];
    preparazione: string[];
  }>({ titolo: '', ingredienti: [], preparazione: [] });

  const [multiplierIdx, setMultiplierIdx] = useState(1);
  const [persone, setPersone] = useState(2);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const heroParallax = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(0, scrollY.value) * 0.35 }],
  }));

  const cartScale = useSharedValue(1);
  const cartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartScale.value }],
  }));

  const { data: all = [] } = useQuery({
    queryKey: ['recipes', user?.id],
    queryFn: () => fetchRecipes(user!.id),
    enabled: !!user?.id,
  });

  const recipe = all.find((r) => r._id === id);

  useEffect(() => {
    if (recipe?.porzioni) setPersone(recipe.porzioni);
  }, [recipe?._id]);

  const updateMut = useMutation({
    mutationFn: (d: typeof draft) => updateRecipe(recipe!._id, user!.id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes', user?.id] });
      setEditMode(false);
      router.back();
    },
  });

  if (!recipe) {
    return (
      <SafeAreaView style={styles.empty}>
        <Text style={{ color: colors.text2 }}>Ricetta non trovata</Text>
        <Pressable onPress={() => router.back()} style={styles.closeFloat}>
          <Text style={{ color: colors.text }}>Chiudi</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const inCart = isInCart(recipe._id);
  const usePortions = (recipe.porzioni ?? 0) > 0;
  const mult = usePortions ? persone / recipe.porzioni! : MULTIPLIERS[multiplierIdx];

  const pct = recipe.ingredienti?.length
    ? Math.round((checked.length / recipe.ingredienti.length) * 100)
    : 0;

  const toggleIng = (i: number) =>
    setChecked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));

  const handleCartToggle = async () => {
    cartScale.value = withSequence(
      withSpring(0.92, { damping: 15 }),
      withSpring(1, { damping: 12 })
    );
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggle(recipe._id);
  };

  const enterEdit = () => {
    setDraft({
      titolo: recipe.titolo,
      ingredienti: recipe.ingredienti.map((i) => ({ nome: i.nome, quantita: i.quantita })),
      preparazione: [...recipe.preparazione],
    });
    setEditMode(true);
  };

  const cancelEdit = () => setEditMode(false);

  const updateDraftIng = (idx: number, field: 'nome' | 'quantita', val: string) =>
    setDraft((d) => {
      const ings = [...d.ingredienti];
      ings[idx] = { ...ings[idx], [field]: val };
      return { ...d, ingredienti: ings };
    });

  const removeIng = (idx: number) =>
    setDraft((d) => ({ ...d, ingredienti: d.ingredienti.filter((_, i) => i !== idx) }));

  const addIng = () =>
    setDraft((d) => ({ ...d, ingredienti: [...d.ingredienti, { nome: '', quantita: '' }] }));

  const updateDraftStep = (idx: number, val: string) =>
    setDraft((d) => {
      const steps = [...d.preparazione];
      steps[idx] = val;
      return { ...d, preparazione: steps };
    });

  const removeStep = (idx: number) =>
    setDraft((d) => ({ ...d, preparazione: d.preparazione.filter((_, i) => i !== idx) }));

  const addStep = () =>
    setDraft((d) => ({ ...d, preparazione: [...d.preparazione, ''] }));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Animated.ScrollView
          style={styles.sheet}
          bounces={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.handle} />

          {recipe.thumbnail && (
            <View style={styles.hero}>
              <Animated.View style={[StyleSheet.absoluteFill, { top: -30, bottom: -30 }, heroParallax]}>
                <Image source={{ uri: recipe.thumbnail }} style={{ flex: 1 }} contentFit="cover" />
              </Animated.View>
              <View style={styles.heroGrad} />
              {!editMode && <Text style={styles.heroTitle}>{recipe.titolo}</Text>}
            </View>
          )}

          <View style={styles.inner}>
            {editMode ? (
              <>
                <Text style={styles.sectionLabel}>TITOLO</Text>
                <TextInput
                  style={styles.editInput}
                  value={draft.titolo}
                  onChangeText={(v) => setDraft((d) => ({ ...d, titolo: v }))}
                  placeholderTextColor={colors.text3}
                  placeholder="Titolo ricetta"
                />
              </>
            ) : (
              !recipe.thumbnail && (
                <Text style={styles.titleNoImg}>{recipe.titolo}</Text>
              )
            )}

            {/* ── Stepper dosi ── */}
            {!editMode && (
              <View style={styles.servingsCard}>
                <Text style={styles.servingsLabel}>
                  {usePortions ? 'PORZIONI' : 'DOSI'}
                </Text>
                {usePortions ? (
                  <View style={styles.stepperRow}>
                    <Pressable
                      style={styles.stepperBtn}
                      onPress={() => setPersone((p) => Math.max(1, p - 1))}
                    >
                      <Ionicons name="remove" size={16} color={colors.text} />
                    </Pressable>
                    <Text style={styles.stepperValue}>{persone}</Text>
                    <Pressable
                      style={styles.stepperBtn}
                      onPress={() => setPersone((p) => Math.min(20, p + 1))}
                    >
                      <Ionicons name="add" size={16} color={colors.text} />
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.multRow}>
                    {MULTIPLIERS.map((m, i) => (
                      <Pressable
                        key={m}
                        style={[styles.multChip, multiplierIdx === i && styles.multChipActive]}
                        onPress={() => setMultiplierIdx(i)}
                      >
                        <Text style={[styles.multChipText, multiplierIdx === i && styles.multChipTextActive]}>
                          {MULTIPLIER_LABELS[i]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ── Progresso dispensa ── */}
            {!editMode && (
              <>
                <View style={{ marginBottom: 18 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={styles.progLabel}>IN DISPENSA</Text>
                    <Text style={[styles.progValue, { color: pct === 100 ? colors.green : colors.accent }]}>
                      {pct === 100 ? '✓ Tutto pronto!' : `${pct}%`}
                    </Text>
                  </View>
                  <View style={styles.progTrack}>
                    <View style={[styles.progBar, { width: `${pct}%` }]} />
                  </View>
                </View>
                <View style={styles.hint}>
                  <Text style={styles.hintText}>💡 Tocca gli ingredienti che hai già in dispensa per depennarli.</Text>
                </View>
              </>
            )}

            {/* ── Ingredienti ── */}
            <Text style={styles.sectionLabel}>INGREDIENTI</Text>
            <View style={{ marginBottom: 24 }}>
              {editMode ? (
                <>
                  {draft.ingredienti.map((ing, i) => (
                    <View key={i} style={styles.editIngRow}>
                      <TextInput
                        style={[styles.editInput, { flex: 2 }]}
                        value={ing.nome}
                        onChangeText={(v) => updateDraftIng(i, 'nome', v)}
                        placeholder="Ingrediente"
                        placeholderTextColor={colors.text3}
                      />
                      <TextInput
                        style={[styles.editInput, { flex: 1 }]}
                        value={ing.quantita}
                        onChangeText={(v) => updateDraftIng(i, 'quantita', v)}
                        placeholder="Qtà"
                        placeholderTextColor={colors.text3}
                      />
                      <Pressable onPress={() => removeIng(i)} style={styles.editRemoveBtn} hitSlop={8}>
                        <Ionicons name="close-circle" size={20} color={colors.text3} />
                      </Pressable>
                    </View>
                  ))}
                  <Pressable style={styles.addRowBtn} onPress={addIng}>
                    <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
                    <Text style={styles.addRowText}>Aggiungi ingrediente</Text>
                  </Pressable>
                </>
              ) : (
                recipe.ingredienti?.map((ing, i) => (
                  <Pressable
                    key={i}
                    style={[styles.ing, i < recipe.ingredienti.length - 1 && styles.ingBorder]}
                    onPress={() => toggleIng(i)}
                  >
                    <Text style={[styles.ingName, checked.includes(i) && styles.ingDone]}>
                      {ing.nome}
                    </Text>
                    <Text style={[styles.ingQty, checked.includes(i) && styles.ingDone]}>
                      {scaleQty(ing.quantita, mult)}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>

            {/* ── Preparazione ── */}
            <Text style={styles.sectionLabel}>PREPARAZIONE</Text>
            <View style={{ marginBottom: 32 }}>
              {editMode ? (
                <>
                  {draft.preparazione.map((step, i) => (
                    <View key={i} style={styles.editStepRow}>
                      <View style={styles.stepNum}>
                        <Text style={styles.stepNumText}>{i + 1}</Text>
                      </View>
                      <TextInput
                        style={[styles.editInput, { flex: 1 }]}
                        value={step}
                        onChangeText={(v) => updateDraftStep(i, v)}
                        placeholder={`Passo ${i + 1}`}
                        placeholderTextColor={colors.text3}
                        multiline
                      />
                      <Pressable onPress={() => removeStep(i)} style={styles.editRemoveBtn} hitSlop={8}>
                        <Ionicons name="close-circle" size={20} color={colors.text3} />
                      </Pressable>
                    </View>
                  ))}
                  <Pressable style={styles.addRowBtn} onPress={addStep}>
                    <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
                    <Text style={styles.addRowText}>Aggiungi passo</Text>
                  </Pressable>
                </>
              ) : (
                recipe.preparazione?.map((step, i) => (
                  <View key={i} style={styles.step}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))
              )}
            </View>

            {recipe.source_url && !editMode && (
              <Pressable
                style={styles.videoBtn}
                onPress={() => Linking.openURL(recipe.source_url!)}
              >
                <Ionicons name="play" size={14} color={colors.text2} />
                <Text style={styles.videoBtnText}>Guarda il video originale</Text>
              </Pressable>
            )}
          </View>
        </Animated.ScrollView>

        {/* ── Sticky bottom bar ── */}
        <View style={styles.stickyBar}>
          <SafeAreaView edges={['bottom']}>
            {editMode ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  style={[styles.stickyBtn, { flex: 1, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border }]}
                  onPress={cancelEdit}
                >
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>Annulla</Text>
                </Pressable>
                <Pressable
                  style={[styles.stickyBtn, { flex: 2, backgroundColor: colors.accent }]}
                  onPress={() => updateMut.mutate(draft)}
                  disabled={updateMut.isPending}
                >
                  {updateMut.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Salva modifiche</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <Animated.View style={cartAnimStyle}>
                <Pressable
                  style={[styles.stickyBtn, { backgroundColor: inCart ? colors.green : colors.accent }]}
                  onPress={handleCartToggle}
                >
                  <Ionicons
                    name={inCart ? 'checkmark-circle' : 'bag-add-outline'}
                    size={20}
                    color="white"
                  />
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
                    {inCart ? 'Nella lista spesa ✓' : 'Aggiungi alla spesa'}
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          </SafeAreaView>
        </View>

        {/* ── Close + Edit buttons ── */}
        <SafeAreaView edges={['top']} style={styles.closeWrap} pointerEvents="box-none">
          <Pressable
            style={styles.closeBtn}
            onPress={editMode ? cancelEdit : () => router.back()}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
          {!editMode && (
            <Pressable style={styles.editBtn} onPress={enterEdit}>
              <Ionicons name="create-outline" size={18} color={colors.text} />
            </Pressable>
          )}
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
    marginTop: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  hero: { height: 220, position: 'relative', marginBottom: 16, overflow: 'hidden' },
  heroGrad: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroTitle: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titleNoImg: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 16,
  },
  inner: { paddingHorizontal: 22, paddingBottom: 16 },

  // Serving stepper
  servingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  servingsLabel: { color: colors.text2, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: { color: colors.text, fontSize: 18, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  multRow: { flexDirection: 'row', gap: 6 },
  multChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  multChipText: { color: colors.text2, fontSize: 12, fontWeight: '700' },
  multChipTextActive: { color: 'white' },

  // Progress
  progLabel: { color: colors.text2, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  progValue: { fontSize: 12, fontWeight: '700' },
  progTrack: { height: 6, backgroundColor: colors.bg3, borderRadius: 3 },
  progBar: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  hint: {
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.15)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  hintText: { color: colors.accent2, fontSize: 13, lineHeight: 18 },
  sectionLabel: {
    color: colors.text3,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  // Ingredients view
  ing: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  ingBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  ingName: { color: colors.text, fontSize: 14, flex: 1 },
  ingQty: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  ingDone: { opacity: 0.4, textDecorationLine: 'line-through' },

  // Preparation view
  step: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  stepText: { color: colors.text2, fontSize: 14, lineHeight: 22, flex: 1 },

  // Edit mode
  editInput: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    marginBottom: 8,
  },
  editIngRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 6 },
  editStepRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  editRemoveBtn: { padding: 4 },
  addRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    opacity: 0.8,
  },
  addRowText: { color: colors.accent, fontSize: 13, fontWeight: '600' },

  // Video button
  videoBtn: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginBottom: 8,
  },
  videoBtnText: { color: colors.text2, fontSize: 13, fontWeight: '600' },

  // Sticky bar
  stickyBar: {
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stickyBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  // Top buttons
  closeWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  closeBtn: {
    position: 'absolute',
    top: 10,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(28,28,32,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    position: 'absolute',
    top: 10,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(28,28,32,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: 20 },
  closeFloat: { backgroundColor: colors.bg2, padding: 12, borderRadius: 10 },
});
