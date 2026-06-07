import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  InterstitialAd,
  MaxAdContentRating,
  RewardedAd,
  RewardedAdEventType,
  RewardedInterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';

export const ADS_ENABLED = true;

const INTERSTITIAL_ID =
  (Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS
    : process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID) || TestIds.INTERSTITIAL;

const REWARDED_ID =
  (Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS
    : process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID) || TestIds.REWARDED;

const REWARDED_INTERSTITIAL_ID =
  (Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_ADMOB_REWARDED_INTERSTITIAL_IOS
    : process.env.EXPO_PUBLIC_ADMOB_REWARDED_INTERSTITIAL_ANDROID) ||
  TestIds.REWARDED_INTERSTITIAL;

let initialized = false;
let initPromise: Promise<boolean> | null = null;
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;
let rewardedInstance: RewardedAd | null = null;
let rewardedReady = false;
let rewardedLoading = false;
let rewardedIntInstance: RewardedInterstitialAd | null = null;
let rewardedIntReady = false;
let rewardedIntLoading = false;

type AdErrorSource =
  | 'init'
  | 'rewarded-preload'
  | 'rewarded-show'
  | 'rewarded-int-preload'
  | 'rewarded-int-show'
  | 'rewarded-int-on-demand';

let lastAdError: { source: AdErrorSource; code?: string; message?: string } | null = null;

function captureAdError(source: AdErrorSource, e: unknown): void {
  const err = e as { code?: string | number; message?: string } | undefined;
  lastAdError = {
    source,
    code: err?.code != null ? String(err.code) : undefined,
    message: err?.message ?? (typeof e === 'string' ? e : undefined),
  };
}

export function getAdsDiagnostics() {
  const isTestRewarded = REWARDED_ID === TestIds.REWARDED;
  const isTestRewardedInt = REWARDED_INTERSTITIAL_ID === TestIds.REWARDED_INTERSTITIAL;
  return {
    rewardedId: REWARDED_ID,
    rewardedIntId: REWARDED_INTERSTITIAL_ID,
    usingTestIds: isTestRewarded || isTestRewardedInt,
    rewardedReady,
    rewardedIntReady,
    initialized,
    lastError: lastAdError,
  };
}

const REQUEST_OPTS = { requestNonPersonalizedAdsOnly: true };

// Init lazy: NON al boot dell'app (causa crash iOS in passato). Parte alla
// prima chiamata di showInterstitial/showRewarded.
async function ensureInitialized(): Promise<boolean> {
  if (initialized) return true;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await mobileAds().setRequestConfiguration({
          maxAdContentRating: MaxAdContentRating.G,
          tagForChildDirectedTreatment: false,
          tagForUnderAgeOfConsent: false,
        });
        await mobileAds().initialize();
        initialized = true;
        try {
          preloadInterstitial();
        } catch (e) {
          if (__DEV__) console.warn('[Ads] preload failed', e);
        }
        try {
          preloadRewarded();
        } catch (e) {
          if (__DEV__) console.warn('[Ads] rewarded preload failed', e);
        }
        try {
          preloadRewardedInterstitial();
        } catch (e) {
          if (__DEV__) console.warn('[Ads] rewarded-int preload failed', e);
        }
        return true;
      } catch (e) {
        if (__DEV__) console.warn('[Ads] init failed', e);
        captureAdError('init', e);
        initPromise = null;
        return false;
      }
    })();
  }
  return initPromise;
}

export async function initAds(): Promise<void> {
  // No-op deliberato: init avviene lazy alla prima ad.
}

function preloadInterstitial(): void {
  try {
    interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, REQUEST_OPTS);
    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoaded = true;
    });
    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialLoaded = false;
      preloadInterstitial();
    });
    interstitial.addAdEventListener(AdEventType.ERROR, () => {
      interstitialLoaded = false;
    });
    interstitial.load();
  } catch (e) {
    if (__DEV__) console.warn('[Ads] interstitial preload failed', e);
  }
}

function attachAndShowRewarded(
  ad: RewardedAd | RewardedInterstitialAd,
  onEarned: () => void,
  onClosed: () => void,
  onError: () => void,
  reloadAfter: () => void,
): void {
  ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, onEarned);
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    onClosed();
    setTimeout(reloadAfter, 500);
  });
  ad.addAdEventListener(AdEventType.ERROR, (e) => {
    if (__DEV__) console.warn('[Ads] rewarded show error', e);
    captureAdError('rewarded-show', e);
    onError();
    setTimeout(reloadAfter, 500);
  });
  try {
    ad.show();
  } catch (e) {
    if (__DEV__) console.warn('[Ads] rewarded show failed', e);
    captureAdError('rewarded-show', e);
    onError();
    setTimeout(reloadAfter, 500);
  }
}

function preloadRewarded(): void {
  if (rewardedLoading || rewardedReady) return;
  rewardedLoading = true;
  try {
    const ad = RewardedAd.createForAdRequest(REWARDED_ID, REQUEST_OPTS);
    rewardedInstance = ad;
    ad.addAdEventListener(AdEventType.LOADED, () => {
      rewardedReady = true;
      rewardedLoading = false;
    });
    ad.addAdEventListener(AdEventType.ERROR, (e) => {
      if (__DEV__) console.warn('[Ads] rewarded preload error', e);
      captureAdError('rewarded-preload', e);
      rewardedReady = false;
      rewardedLoading = false;
      rewardedInstance = null;
      // Backoff: ritenta tra 60s. Senza backoff il no-fill iniziale brucerebbe richieste.
      setTimeout(() => preloadRewarded(), 60_000);
    });
    ad.load();
  } catch (e) {
    if (__DEV__) console.warn('[Ads] rewarded preload failed', e);
    rewardedLoading = false;
    rewardedReady = false;
    rewardedInstance = null;
  }
}

function preloadRewardedInterstitial(): void {
  if (rewardedIntLoading || rewardedIntReady) return;
  rewardedIntLoading = true;
  try {
    const ad = RewardedInterstitialAd.createForAdRequest(REWARDED_INTERSTITIAL_ID, REQUEST_OPTS);
    rewardedIntInstance = ad;
    ad.addAdEventListener(AdEventType.LOADED, () => {
      rewardedIntReady = true;
      rewardedIntLoading = false;
    });
    ad.addAdEventListener(AdEventType.ERROR, (e) => {
      if (__DEV__) console.warn('[Ads] rewarded-int preload error', e);
      captureAdError('rewarded-int-preload', e);
      rewardedIntReady = false;
      rewardedIntLoading = false;
      rewardedIntInstance = null;
      setTimeout(() => preloadRewardedInterstitial(), 60_000);
    });
    ad.load();
  } catch (e) {
    if (__DEV__) console.warn('[Ads] rewarded-int preload failed', e);
    rewardedIntLoading = false;
    rewardedIntReady = false;
    rewardedIntInstance = null;
  }
}

export async function showInterstitial(): Promise<void> {
  const ok = await ensureInitialized();
  if (!ok || !interstitial || !interstitialLoaded) return;
  try {
    interstitial.show();
  } catch (e) {
    if (__DEV__) console.warn('[Ads] interstitial show failed', e);
  }
}

export function showRewarded(): Promise<{ earned: boolean }> {
  return new Promise((resolve) => {
    let resolved = false;
    let earned = false;

    const safeResolve = (v: { earned: boolean }) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve(v);
      }
    };

    // Safety net schedulato PRIMA di qualsiasi await/throw: garantisce che la
    // promise risolva sempre, anche se ensureInitialized() o ad.load() lanciano.
    const timeoutId = setTimeout(() => safeResolve({ earned: false }), 12000);

    (async () => {
      try {
        const ok = await ensureInitialized();
        if (!ok) {
          safeResolve({ earned: false });
          return;
        }

        // Priorità 1: Rewarded precaricato (eCPM più alto, ma fill basso su app nuove).
        if (rewardedReady && rewardedInstance) {
          const ad = rewardedInstance;
          rewardedInstance = null;
          rewardedReady = false;
          attachAndShowRewarded(
            ad,
            () => { earned = true; },
            () => safeResolve({ earned }),
            () => safeResolve({ earned: false }),
            preloadRewarded,
          );
          return;
        }

        // Priorità 2: Rewarded Interstitial precaricato (fill rate più alto).
        if (rewardedIntReady && rewardedIntInstance) {
          const ad = rewardedIntInstance;
          rewardedIntInstance = null;
          rewardedIntReady = false;
          attachAndShowRewarded(
            ad,
            () => { earned = true; },
            () => safeResolve({ earned }),
            () => safeResolve({ earned: false }),
            preloadRewardedInterstitial,
          );
          return;
        }

        // Fallback: carica Rewarded Interstitial on-demand (preferito per fill).
        const ad = RewardedInterstitialAd.createForAdRequest(REWARDED_INTERSTITIAL_ID, REQUEST_OPTS);
        ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          earned = true;
        });
        ad.addAdEventListener(AdEventType.LOADED, () => {
          try {
            ad.show();
          } catch (e) {
            if (__DEV__) console.warn('[Ads] rewarded-int show failed', e);
            captureAdError('rewarded-int-show', e);
            safeResolve({ earned: false });
          }
        });
        ad.addAdEventListener(AdEventType.CLOSED, () => {
          safeResolve({ earned });
          setTimeout(() => preloadRewardedInterstitial(), 500);
        });
        ad.addAdEventListener(AdEventType.ERROR, (e) => {
          if (__DEV__) console.warn('[Ads] rewarded-int on-demand error', e);
          captureAdError('rewarded-int-on-demand', e);
          safeResolve({ earned: false });
          setTimeout(() => preloadRewardedInterstitial(), 500);
        });
        ad.load();
      } catch (e) {
        if (__DEV__) console.warn('[Ads] rewarded flow failed', e);
        captureAdError('rewarded-int-on-demand', e);
        safeResolve({ earned: false });
      }
    })();
  });
}
