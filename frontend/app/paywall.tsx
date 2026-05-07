import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { fetchCurrentOffering, purchase, restore, usePurchasesStore } from '../lib/purchases';
import { colors } from '../lib/theme';

const TERMS_URL = 'https://dispensia.app/terms';
const PRIVACY_URL = 'https://dispensia.app/privacy';

export default function PaywallScreen() {
  const { t } = useTranslation();
  const isPremium = usePurchasesStore((s) => s.isPremium);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const o = await fetchCurrentOffering();
      if (!cancelled) {
        setOffering(o);
        setLoading(false);
        if (!o) setError(t('paywall.errorOffering'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const monthlyPackage: PurchasesPackage | null = offering?.monthly ?? offering?.availablePackages?.[0] ?? null;
  const priceString = monthlyPackage?.product.priceString ?? '';
  const trialDays = extractTrialDays(monthlyPackage);

  const handlePurchase = async () => {
    if (!monthlyPackage) return;
    setBusy(true);
    setError(null);
    try {
      const { ok, cancelled } = await purchase(monthlyPackage);
      if (cancelled) return;
      if (ok) {
        Alert.alert(t('paywall.successTitle'), t('paywall.successSub'), [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        setError(t('paywall.errorPurchase'));
      }
    } catch {
      setError(t('paywall.errorPurchase'));
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    try {
      const ok = await restore();
      Alert.alert(
        ok ? t('paywall.restoreSuccess') : t('paywall.restoreNone'),
        '',
        [{ text: 'OK', onPress: ok ? () => router.back() : undefined }]
      );
    } catch {
      Alert.alert(t('paywall.errorPurchase'));
    } finally {
      setBusy(false);
    }
  };

  const handleManage = () => {
    const url =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
    Linking.openURL(url);
  };

  const benefits = [
    { icon: 'mic-outline', title: t('paywall.benefit1Title'), sub: t('paywall.benefit1Sub') },
    { icon: 'shield-checkmark-outline', title: t('paywall.benefit2Title'), sub: t('paywall.benefit2Sub') },
    { icon: 'flash-outline', title: t('paywall.benefit3Title'), sub: t('paywall.benefit3Sub') },
  ] as const;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={10}>
          <Ionicons name="close" size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="sparkles" size={48} color={colors.accent} />
        </View>
        <Text style={styles.title}>{t('paywall.title')}</Text>
        <Text style={styles.subtitle}>{t('paywall.subtitle')}</Text>

        {isPremium ? (
          <View style={styles.activeCard}>
            <Ionicons name="checkmark-circle" size={32} color={colors.green} />
            <Text style={styles.activeTitle}>{t('paywall.active')}</Text>
            <Text style={styles.activeSub}>{t('paywall.activeSub')}</Text>
            <Pressable style={styles.manageBtn} onPress={handleManage}>
              <Text style={styles.manageBtnText}>{t('paywall.manage')}</Text>
              <Ionicons name="open-outline" size={14} color={colors.text2} />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.benefits}>
              {benefits.map((b, i) => (
                <View key={i} style={styles.benefitRow}>
                  <View style={styles.benefitIcon}>
                    <Ionicons name={b.icon} size={20} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.benefitTitle}>{b.title}</Text>
                    <Text style={styles.benefitSub}>{b.sub}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.priceCard}>
              {trialDays > 0 && (
                <View style={styles.trialBadge}>
                  <Text style={styles.trialBadgeText}>
                    {t('paywall.trialBadge', { days: trialDays })}
                  </Text>
                </View>
              )}
              {loading ? (
                <ActivityIndicator color={colors.accent} style={{ marginVertical: 12 }} />
              ) : priceString ? (
                <Text style={styles.priceText}>{t('paywall.priceMonth', { price: priceString })}</Text>
              ) : (
                <Text style={styles.priceText}>—</Text>
              )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              style={[styles.cta, (!monthlyPackage || busy) && styles.ctaDisabled]}
              onPress={handlePurchase}
              disabled={!monthlyPackage || busy}
            >
              {busy ? (
                <>
                  <ActivityIndicator color="white" />
                  <Text style={styles.ctaText}>{t('paywall.purchasing')}</Text>
                </>
              ) : (
                <Text style={styles.ctaText}>
                  {trialDays > 0
                    ? t('paywall.ctaTrial')
                    : t('paywall.ctaPurchase', { price: priceString })}
                </Text>
              )}
            </Pressable>

            <Pressable onPress={handleRestore} style={styles.restoreBtn} disabled={busy}>
              <Text style={styles.restoreText}>{t('paywall.restoreCta')}</Text>
            </Pressable>

            <Text style={styles.footer}>{t('paywall.footer')}</Text>

            <View style={styles.legalRow}>
              <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
                <Text style={styles.legalLink}>{t('paywall.terms')}</Text>
              </Pressable>
              <Text style={styles.legalSep}>·</Text>
              <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
                <Text style={styles.legalLink}>{t('paywall.privacy')}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function extractTrialDays(pkg: PurchasesPackage | null): number {
  if (!pkg) return 0;
  const period = pkg.product.introPrice?.period;
  if (!period) return 0;
  const match = /^P(\d+)([DWM])$/.exec(period);
  if (!match) return 0;
  const n = parseInt(match[1], 10);
  switch (match[2]) {
    case 'D':
      return n;
    case 'W':
      return n * 7;
    case 'M':
      return n * 30;
    default:
      return 0;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: 24, paddingBottom: 32, alignItems: 'center' },
  heroIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.text2,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
    lineHeight: 21,
  },
  benefits: { width: '100%', gap: 14, marginBottom: 24 },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },
  benefitIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  benefitSub: { color: colors.text2, fontSize: 13, marginTop: 2, lineHeight: 18 },
  priceCard: {
    width: '100%',
    backgroundColor: colors.bg2,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 18,
  },
  trialBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  trialBadgeText: { color: 'white', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  priceText: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  errorText: {
    color: colors.red,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  cta: {
    width: '100%',
    height: 54,
    backgroundColor: colors.accent,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: 'white', fontSize: 16, fontWeight: '700' },
  restoreBtn: { paddingVertical: 8, marginBottom: 18 },
  restoreText: { color: colors.text2, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  footer: {
    color: colors.text3,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  legalLink: { color: colors.text2, fontSize: 12, textDecorationLine: 'underline' },
  legalSep: { color: colors.text3, fontSize: 12 },
  activeCard: {
    width: '100%',
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: 'rgba(48,217,104,0.4)',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  activeTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  activeSub: { color: colors.text2, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  manageBtn: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.bg3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  manageBtnText: { color: colors.text2, fontSize: 13, fontWeight: '600' },
});
