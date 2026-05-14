import { useUser, useClerk } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';
import { usePurchasesStore } from '../../lib/purchases';
import { deleteAccount } from '../../lib/api';

export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { t } = useTranslation();
  const isPremium = usePurchasesStore((s) => s.isPremium);
  const [deleting, setDeleting] = useState(false);

  const handleSignOut = () => {
    Alert.alert(t('settings.logout'), t('settings.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.logout'), style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccount'),
      t('settings.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteAccount'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('settings.deleteAccountFinalTitle'),
              t('settings.deleteAccountFinalBody'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('settings.deleteAccountFinalConfirm'),
                  style: 'destructive',
                  onPress: async () => {
                    if (!user?.id) return;
                    setDeleting(true);
                    try {
                      await deleteAccount(user.id);
                      await user.delete();
                      await signOut();
                    } catch (e: any) {
                      setDeleting(false);
                      Alert.alert(t('common.error'), e?.message || t('settings.deleteAccountError'));
                    }
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const menuItems = [
    {
      icon: 'help-circle-outline',
      label: t('settings.tutorial'),
      onPress: () => router.push('/tutorial' as any),
    },
    {
      icon: 'information-circle-outline',
      label: t('settings.info'),
      onPress: () => router.push({ pathname: '/legal', params: { page: 'info' } } as any),
    },
    {
      icon: 'shield-checkmark-outline',
      label: t('settings.privacy'),
      onPress: () => router.push({ pathname: '/legal', params: { page: 'privacy' } } as any),
    },
    {
      icon: 'document-text-outline',
      label: t('settings.tos'),
      onPress: () => router.push({ pathname: '/legal', params: { page: 'tos' } } as any),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>
          Dispens<Text style={{ color: colors.accent }}>IA</Text>
        </Text>
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 14, paddingBottom: 40 }}>
        <View style={[styles.card, { padding: 18 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 20 }}>
                  {user?.firstName?.[0]?.toUpperCase() || user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user?.fullName || user?.firstName || t('common.user')}</Text>
              <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.card, styles.premiumCard, isPremium && styles.premiumCardActive]}
          onPress={() => router.push('/paywall' as any)}
        >
          <View style={styles.premiumIcon}>
            <Ionicons
              name={isPremium ? 'checkmark-circle' : 'sparkles'}
              size={24}
              color={isPremium ? colors.green : colors.accent}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitle}>
              {isPremium ? t('paywall.active') : t('paywall.title')}
            </Text>
            <Text style={styles.premiumSub}>
              {isPremium ? t('paywall.activeSub') : t('paywall.subtitle')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text3} />
        </Pressable>

        <View style={styles.card}>
          {menuItems.map((item, i) => (
            <Pressable
              key={i}
              style={[styles.row, i < menuItems.length - 1 && styles.rowBorder]}
              onPress={item.onPress}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name={item.icon as any} size={20} color={colors.text2} />
                <Text style={styles.rowLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text3} />
            </Pressable>
          ))}
        </View>

        <Pressable style={[styles.card, { padding: 16, alignItems: 'center' }]} onPress={handleSignOut}>
          <Text style={{ color: colors.red, fontWeight: '700', fontSize: 15 }}>{t('settings.logout')}</Text>
        </Pressable>

        <Pressable
          style={[styles.card, { padding: 16, alignItems: 'center', opacity: deleting ? 0.5 : 1 }]}
          onPress={handleDeleteAccount}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator color={colors.red} />
          ) : (
            <Text style={{ color: colors.red, fontWeight: '700', fontSize: 15 }}>{t('settings.deleteAccount')}</Text>
          )}
        </Pressable>

        <Text style={styles.version}>{t('settings.version')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  logo: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.8 },
  titleWrap: { paddingHorizontal: 20, paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  card: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: 18, overflow: 'hidden' },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderColor: 'rgba(255,107,53,0.4)',
  },
  premiumCardActive: { borderColor: 'rgba(48,217,104,0.4)' },
  premiumIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  premiumSub: { color: colors.text2, fontSize: 12, marginTop: 2, lineHeight: 16 },
  avatar: { width: 52, height: 52, borderRadius: 14 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  email: { color: colors.text2, fontSize: 13, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.text, fontSize: 14, fontWeight: '500' },
  version: { textAlign: 'center', fontSize: 12, color: colors.text3, marginTop: 10 },
});
