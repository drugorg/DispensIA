import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchRecipes, deleteRecipe, toggleFavorite, Recipe } from '../../lib/api';
import { useCartStore } from '../../lib/cartStore';
import { colors } from '../../lib/theme';
import { TUTORIAL_SEEN_KEY } from '../tutorial';

function SkeletonCard() {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 750 }), -1, true);
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.card, animStyle, { flex: 1 }]}>
      <View style={[styles.cardImage, { backgroundColor: colors.bg3 }]} />
      <View style={{ padding: 10, gap: 6 }}>
        <View style={{ height: 12, backgroundColor: colors.bg3, borderRadius: 6, width: '80%' }} />
        <View style={{ height: 10, backgroundColor: colors.bg3, borderRadius: 5, width: '45%' }} />
      </View>
    </Animated.View>
  );
}

export default function VaultScreen() {
  const { user } = useUser();
  const qc = useQueryClient();
  const { t } = useTranslation();
  const { remove, isInCart } = useCartStore();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    SecureStore.getItemAsync(TUTORIAL_SEEN_KEY).then((v) => {
      if (!v) router.push('/tutorial' as any);
    });
  }, []);

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes', user?.id],
    queryFn: () => fetchRecipes(user!.id),
    enabled: !!user?.id,
    select: (d) => [...d].reverse(),
  });

  const filteredRecipes = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = recipes;
    if (favOnly) list = list.filter(r => r.favorite);
    if (q) {
      list = list.filter(r => {
        if (r.titolo?.toLowerCase().includes(q)) return true;
        return r.ingredienti?.some(i => i.nome?.toLowerCase().includes(q));
      });
    }
    // Preferiti in cima
    return [...list].sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite));
  }, [recipes, search, favOnly]);

  const delMut = useMutation({
    mutationFn: ({ id }: { id: string }) => deleteRecipe(id, user!.id),
    onSuccess: (_, { id }) => {
      remove(id);
      qc.invalidateQueries({ queryKey: ['recipes', user?.id] });
    },
  });

  const favMut = useMutation({
    mutationFn: ({ id, favorite }: { id: string; favorite: boolean }) =>
      toggleFavorite(id, user!.id, favorite),
    onMutate: async ({ id, favorite }) => {
      await qc.cancelQueries({ queryKey: ['recipes', user?.id] });
      const prev = qc.getQueryData<Recipe[]>(['recipes', user?.id]);
      qc.setQueryData<Recipe[]>(['recipes', user?.id], (old) =>
        old?.map(r => (r._id === id ? { ...r, favorite } : r)) ?? []
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['recipes', user?.id], ctx.prev);
    },
  });

  const handleDelete = (id: string, title: string) => {
    Alert.alert(t('common.deleteConfirm'), title, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => delMut.mutate({ id }) },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ['recipes', user?.id] });
    setRefreshing(false);
  };

  const renderCard = ({ item }: { item: Recipe }) => {
    if (item._id === '__placeholder__') {
      return <View style={[styles.card, { backgroundColor: 'transparent', borderColor: 'transparent' }]} />;
    }
    const inCart = isInCart(item._id);
    const isFav = !!item.favorite;
    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/recipe/${item._id}` as any)}
        onLongPress={() => handleDelete(item._id, item.titolo)}
      >
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.cardImage} contentFit="cover" />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: colors.bg3, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 32 }}>🍽️</Text>
          </View>
        )}
        <Pressable
          style={styles.favBadge}
          onPress={(e) => { e.stopPropagation?.(); favMut.mutate({ id: item._id, favorite: !isFav }); }}
          hitSlop={10}
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={16}
            color={isFav ? colors.red : 'white'}
          />
        </Pressable>
        {inCart && (
          <View style={styles.cartBadge}>
            <Ionicons name="bag-check" size={12} color="white" />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.titolo}</Text>
          {(item.ingredienti?.length ?? 0) > 0 && (
            <Text style={styles.cardMeta}>
              {t('recipe.ingredients', { count: item.ingredienti.length })}
            </Text>
          )}
        </View>
        <Pressable
          style={styles.deleteBadge}
          onPress={(e) => { e.stopPropagation?.(); handleDelete(item._id, item.titolo); }}
          hitSlop={10}
        >
          <Ionicons name="close" size={14} color={colors.text2} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>
          Dispens<Text style={{ color: colors.accent }}>IA</Text>
        </Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {t('vault.recipes', { count: recipes.length })}
          </Text>
        </View>
      </View>

      {!isLoading && recipes.length > 0 && (
        <View style={styles.toolbar}>
          {searchOpen || search.length > 0 ? (
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color={colors.accent} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder={t('vault.searchPlaceholder')}
                placeholderTextColor={colors.text3}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                returnKeyType="search"
                autoFocus
              />
              <Pressable
                onPress={() => { setSearch(''); setSearchOpen(false); }}
                hitSlop={8}
                style={styles.searchClose}
              >
                <Ionicons name="close" size={16} color={colors.text2} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.searchIconBtn}
              onPress={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
            >
              <Ionicons name="search" size={18} color={colors.text2} />
            </Pressable>
          )}
          <Pressable
            onPress={() => setFavOnly(v => !v)}
            style={[styles.chip, favOnly && styles.chipActive]}
          >
            <Ionicons
              name={favOnly ? 'heart' : 'heart-outline'}
              size={14}
              color={favOnly ? 'white' : colors.text2}
            />
            <Text style={[styles.chipText, favOnly && { color: 'white' }]}>
              {t('vault.filterFavorites')}
            </Text>
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          renderItem={() => <SkeletonCard />}
          keyExtractor={(item) => String(item)}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
          scrollEnabled={false}
        />
      ) : recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🍲</Text>
          <Text style={styles.emptyTitle}>{t('vault.empty.title')}</Text>
          <Text style={styles.emptySub}>{t('vault.empty.sub')}</Text>
        </View>
      ) : filteredRecipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>{t('vault.noResults')}</Text>
        </View>
      ) : (
        <FlatList
          data={
            filteredRecipes.length % 2 === 1
              ? [...filteredRecipes, { _id: '__placeholder__' } as Recipe]
              : filteredRecipes
          }
          renderItem={renderCard}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
        />
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
  pill: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  pillText: { color: colors.text2, fontSize: 12, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyIcon: { fontSize: 56, opacity: 0.4 },
  emptyTitle: { color: colors.text2, fontSize: 17, fontWeight: '700' },
  emptySub: { color: colors.text3, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  card: {
    flex: 1,
    backgroundColor: colors.bg2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', aspectRatio: 9 / 16 },
  cardBody: { padding: 10, gap: 3 },
  cardTitle: { color: colors.text, fontSize: 13, fontWeight: '600', lineHeight: 17 },
  cardMeta: { color: colors.text3, fontSize: 11 },
  cartBadge: {
    position: 'absolute',
    bottom: 54,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.4)',
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  searchIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text2, fontSize: 12, fontWeight: '600' },
});
