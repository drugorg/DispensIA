import { useUser } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchRecipes } from '../../lib/api';
import { useCartStore } from '../../lib/cartStore';
import { colors } from '../../lib/theme';

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const { toggle, isInCart } = useCartStore();
  const [checked, setChecked] = useState<number[]>([]);

  const { data: all = [] } = useQuery({
    queryKey: ['recipes', user?.id],
    queryFn: () => fetchRecipes(user!.id),
    enabled: !!user?.id,
  });

  const recipe = all.find((r) => r._id === id);

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
  const pct = recipe.ingredienti?.length
    ? Math.round((checked.length / recipe.ingredienti.length) * 100)
    : 0;

  const toggleIng = (i: number) => {
    setChecked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.sheet} bounces={false}>
        <View style={styles.handle} />

        {recipe.thumbnail && (
          <View style={styles.hero}>
            <Image source={{ uri: recipe.thumbnail }} style={styles.heroImg} contentFit="cover" />
            <View style={styles.heroGrad} />
            <Text style={styles.heroTitle}>{recipe.titolo}</Text>
          </View>
        )}

        {!recipe.thumbnail && (
          <View style={{ paddingHorizontal: 22, paddingTop: 10 }}>
            <Text style={styles.titleNoImg}>{recipe.titolo}</Text>
          </View>
        )}

        <View style={styles.inner}>
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

          <Text style={styles.sectionLabel}>INGREDIENTI</Text>
          <View style={{ marginBottom: 24 }}>
            {recipe.ingredienti?.map((ing, i) => (
              <Pressable
                key={i}
                style={[styles.ing, i < recipe.ingredienti.length - 1 && styles.ingBorder]}
                onPress={() => toggleIng(i)}
              >
                <Text style={[styles.ingName, checked.includes(i) && styles.ingDone]}>{ing.nome}</Text>
                <Text style={[styles.ingQty, checked.includes(i) && styles.ingDone]}>{ing.quantita}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionLabel}>PREPARAZIONE</Text>
          <View style={{ marginBottom: 24 }}>
            {recipe.preparazione?.map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={[styles.mainBtn, inCart ? styles.mainBtnGhost : styles.mainBtnFilled]}
            onPress={() => toggle(recipe._id)}
          >
            <Text style={[styles.mainBtnText, inCart && { color: colors.text }]}>
              {inCart ? '− Rimuovi dalla spesa' : '+ Aggiungi alla spesa'}
            </Text>
          </Pressable>

          {recipe.source_url && (
            <Pressable
              style={styles.videoBtn}
              onPress={() => Linking.openURL(recipe.source_url!)}
            >
              <Ionicons name="play" size={14} color={colors.text2} />
              <Text style={styles.videoBtnText}>Guarda il video originale</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <SafeAreaView edges={['top']} style={styles.closeWrap} pointerEvents="box-none">
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={20} color={colors.text} />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { flex: 1, backgroundColor: colors.bg, marginTop: 40, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  hero: { height: 220, position: 'relative', marginBottom: 16 },
  heroImg: { width: '100%', height: '100%' },
  heroGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%', backgroundColor: 'rgba(0,0,0,0.4)' },
  heroTitle: { position: 'absolute', bottom: 16, left: 20, right: 20, color: 'white', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  titleNoImg: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -1, marginBottom: 16 },
  inner: { paddingHorizontal: 22, paddingBottom: 40 },
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
  sectionLabel: { color: colors.text3, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8 },
  ing: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  ingBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  ingName: { color: colors.text, fontSize: 14, flex: 1 },
  ingQty: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  ingDone: { opacity: 0.4, textDecorationLine: 'line-through' },
  step: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  stepText: { color: colors.text2, fontSize: 14, lineHeight: 22, flex: 1 },
  mainBtn: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  mainBtnFilled: { backgroundColor: colors.accent },
  mainBtnGhost: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border },
  mainBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  videoBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    height: 48, backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: 14,
  },
  videoBtnText: { color: colors.text2, fontSize: 13, fontWeight: '600' },
  closeWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  closeBtn: {
    position: 'absolute', top: 10, right: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(28,28,32,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: 20 },
  closeFloat: { backgroundColor: colors.bg2, padding: 12, borderRadius: 10 },
});
