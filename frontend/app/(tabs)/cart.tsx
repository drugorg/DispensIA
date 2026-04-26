import { useUser } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchRecipes } from '../../lib/api';
import { useCartStore } from '../../lib/cartStore';
import { colors } from '../../lib/theme';

export default function CartScreen() {
  const { user } = useUser();
  const { t } = useTranslation();
  const { cartIds, toggle } = useCartStore();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const { data: all = [] } = useQuery({
    queryKey: ['recipes', user?.id],
    queryFn: () => fetchRecipes(user!.id),
    enabled: !!user?.id,
  });

  const recipes = all.filter((r) => cartIds.includes(r._id));
  const totalItems = recipes.reduce((s, r) => s + (r.ingredienti?.length || 0), 0);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const pct = totalItems ? Math.round((checkedCount / totalItems) * 100) : 0;

  const toggleItem = (key: string) => setCheckedItems((p) => ({ ...p, [key]: !p[key] }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>
          Dispens<Text style={{ color: colors.accent }}>IA</Text>
        </Text>
        {recipes.length > 0 && (
          <View style={styles.pill}>
            <Text style={styles.pillText}>
              {t('cart.counter', { checked: checkedCount, total: totalItems })}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.title}>{t('cart.title')}</Text>
        <Text style={styles.subtitle}>{t('cart.subtitle')}</Text>
      </View>

      {recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>{t('cart.empty.title')}</Text>
          <Text style={styles.emptySub}>{t('cart.empty.sub')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}>
          {totalItems > 0 && (
            <View style={[styles.card, { padding: 14 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={styles.progLabel}>{t('cart.progress')}</Text>
                <Text style={[styles.progValue, { color: pct === 100 ? colors.green : colors.accent }]}>
                  {pct === 100 ? t('cart.done') : `${pct}%`}
                </Text>
              </View>
              <View style={styles.progTrack}>
                <View style={[styles.progBar, { width: `${pct}%` }]} />
              </View>
            </View>
          )}

          {recipes.map((r) => (
            <View key={r._id} style={styles.card}>
              <View style={styles.rHeader}>
                <Pressable
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
                  onPress={() => router.push(`/recipe/${r._id}` as any)}
                >
                  {r.thumbnail && (
                    <Image source={{ uri: r.thumbnail }} style={{ width: 36, height: 36, borderRadius: 8 }} />
                  )}
                  <Text style={styles.rTitle}>{r.titolo}</Text>
                </Pressable>
                <Pressable onPress={() => toggle(r._id)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>{t('common.remove')}</Text>
                </Pressable>
              </View>

              <View style={{ padding: 12 }}>
                {r.ingredienti?.map((ing, i) => {
                  const key = `${r._id}-${i}`;
                  const done = !!checkedItems[key];
                  return (
                    <Pressable key={i} style={styles.ing} onPress={() => toggleItem(key)}>
                      <View style={styles.ingLeft}>
                        <View style={[styles.check, done && styles.checkDone]}>
                          {done && <Ionicons name="checkmark" size={12} color="white" />}
                        </View>
                        <Text style={[styles.ingName, done && styles.ingDone]}>{ing.nome}</Text>
                      </View>
                      <Text style={[styles.ingQty, done && styles.ingDone]}>{ing.quantita}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.8 },
  pill: { backgroundColor: colors.bg3, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, borderWidth: 1, borderColor: colors.border },
  pillText: { color: colors.text2, fontSize: 12, fontWeight: '600' },
  titleWrap: { paddingHorizontal: 20, paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  subtitle: { color: colors.text2, fontSize: 14, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyIcon: { fontSize: 56, opacity: 0.4 },
  emptyTitle: { color: colors.text2, fontSize: 17, fontWeight: '700' },
  emptySub: { color: colors.text3, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  card: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: 18, overflow: 'hidden' },
  progLabel: { color: colors.text2, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  progValue: { fontSize: 13, fontWeight: '700' },
  progTrack: { height: 6, backgroundColor: colors.bg3, borderRadius: 3, overflow: 'hidden' },
  progBar: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  rHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
  rTitle: { color: colors.text, fontSize: 15, fontWeight: '700', flex: 1 },
  removeBtn: { backgroundColor: 'rgba(255,59,48,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  removeText: { color: colors.red, fontSize: 11, fontWeight: '700' },
  ing: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  ingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  check: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.text3, alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  ingName: { color: colors.text, fontSize: 14, flex: 1 },
  ingQty: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  ingDone: { opacity: 0.4, textDecorationLine: 'line-through' },
});
