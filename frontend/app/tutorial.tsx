import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';

export const TUTORIAL_SEEN_KEY = 'tutorial_share_seen_v1';

const { width: SCREEN_W } = Dimensions.get('window');

type Step = { icon: keyof typeof Ionicons.glyphMap; titleKey: string; subKey: string };

const STEPS: Step[] = [
  { icon: 'logo-tiktok', titleKey: 'tutorial.step1Title', subKey: 'tutorial.step1Sub' },
  { icon: 'share-outline', titleKey: 'tutorial.step2Title', subKey: 'tutorial.step2Sub' },
  { icon: 'ellipsis-horizontal-circle-outline', titleKey: 'tutorial.step3Title', subKey: 'tutorial.step3Sub' },
  { icon: 'restaurant-outline', titleKey: 'tutorial.step4Title', subKey: 'tutorial.step4Sub' },
];

export default function TutorialScreen() {
  const { t } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const finish = async () => {
    try {
      await SecureStore.setItemAsync(TUTORIAL_SEEN_KEY, '1');
    } catch {}
    router.back();
  };

  const goNext = () => {
    if (page >= STEPS.length - 1) {
      finish();
      return;
    }
    const next = page + 1;
    scrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
    setPage(next);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (idx !== page) setPage(idx);
  };

  const isLast = page === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={finish} hitSlop={12}>
          <Text style={styles.skip}>{t('tutorial.skip')}</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {STEPS.map((step, i) => (
          <View key={i} style={[styles.page, { width: SCREEN_W }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={step.icon} size={64} color={colors.accent} />
            </View>
            <Text style={styles.stepNum}>{`${i + 1} / ${STEPS.length}`}</Text>
            <Text style={styles.title}>{t(step.titleKey)}</Text>
            <Text style={styles.sub}>{t(step.subKey)}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === page && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.cta} onPress={goNext}>
          <Text style={styles.ctaText}>
            {isLast ? t('tutorial.start') : t('tutorial.next')}
          </Text>
          {!isLast && <Ionicons name="arrow-forward" size={18} color="white" />}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  skip: { color: colors.text2, fontSize: 14, fontWeight: '600' },
  page: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  stepNum: { color: colors.text3, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 12 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center', marginBottom: 12 },
  sub: { color: colors.text2, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border },
  dotActive: { backgroundColor: colors.accent, borderColor: colors.accent, width: 22 },
  footer: { paddingHorizontal: 20, paddingBottom: 12 },
  cta: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
