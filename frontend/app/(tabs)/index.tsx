import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchRecipes, deleteRecipe, Recipe } from '../../lib/api';
import { useCartStore } from '../../lib/cartStore';
import { colors } from '../../lib/theme';

export default function VaultScreen() {
  const { user } = useUser();
  const qc = useQueryClient();
  const { remove } = useCartStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes', user?.id],
    queryFn: () => fetchRecipes(user!.id),
    enabled: !!user?.id,
    select: (d) => [...d].reverse(),
  });

  const delMut = useMutation({
    mutationFn: ({ id }: { id: string }) => deleteRecipe(id, user!.id),
    onSuccess: (_, { id }) => {
      remove(id);
      qc.invalidateQueries({ queryKey: ['recipes', user?.id] });
    },
  });

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Eliminare ricetta?', title, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => delMut.mutate({ id }) },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ['recipes', user?.id] });
    setRefreshing(false);
  };

  const renderCard = ({ item }: { item: Recipe }) => (
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
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.titolo}
        </Text>
      </View>
      <Pressable
        style={styles.deleteBadge}
        onPress={(e) => {
          e.stopPropagation?.();
          handleDelete(item._id, item.titolo);
        }}
        hitSlop={10}
      >
        <Ionicons name="close" size={14} color={colors.text2} />
      </Pressable>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>
          Dispens<Text style={{ color: colors.accent }}>IA</Text>
        </Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{recipes.length} ricette</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🍲</Text>
          <Text style={styles.emptyTitle}>Il tuo Vault è vuoto</Text>
          <Text style={styles.emptySub}>Premi il pulsante + per aggiungere la prima ricetta TikTok</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          renderItem={renderCard}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  cardBody: { padding: 10 },
  cardTitle: { color: colors.text, fontSize: 13, fontWeight: '600', lineHeight: 17 },
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
});
