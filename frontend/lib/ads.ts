import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  InterstitialAd,
  MaxAdContentRating,
  RewardedAd,
  RewardedAdEventType,
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

let initialized = false;
let initPromise: Promise<boolean> | null = null;
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;
let rewardedInstance: RewardedAd | null = null;
let rewardedReady = false;
let rewardedLoading = false;

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
        return true;
      } catch (e) {
        if (__DEV__) console.warn('[Ads] init failed', e);
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
  ad: RewardedAd,
  onEarned: () => void,
  onClosed: () => void,
  onError: () => void,
): void {
  ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, onEarned);
  ad.addAdEventListener(AdEventType.CLOSED, () => {
    onClosed();
    setTimeout(() => preloadRewarded(), 500);
  });
  ad.addAdEventListener(AdEventType.ERROR, (e) => {
    if (__DEV__) console.warn('[Ads] rewarded show error', e);
    onError();
    setTimeout(() => preloadRewarded(), 500);
  });
  try {
    ad.show();
  } catch (e) {
    if (__DEV__) console.warn('[Ads] rewarded show failed', e);
    onError();
    setTimeout(() => preloadRewarded(), 500);
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
    const timeoutId = setTimeout(() => safeResolve({ earned: false }), 10000);

    (async () => {
      try {
        const ok = await ensureInitialized();
        if (!ok) {
          safeResolve({ earned: false });
          return;
        }

        // Fast path: usa l'istanza precaricata se pronta.
        if (rewardedReady && rewardedInstance) {
          const ad = rewardedInstance;
          rewardedInstance = null;
          rewardedReady = false;
          attachAndShowRewarded(ad, () => { earned = true; }, () => safeResolve({ earned }), () => safeResolve({ earned: false }));
          return;
        }

        // Slow path: carica on-demand.
        const ad = RewardedAd.createForAdRequest(REWARDED_ID, REQUEST_OPTS);
        ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          earned = true;
        });
        ad.addAdEventListener(AdEventType.LOADED, () => {
          try {
            ad.show();
          } catch (e) {
            if (__DEV__) console.warn('[Ads] rewarded show failed', e);
            safeResolve({ earned: false });
          }
        });
        ad.addAdEventListener(AdEventType.CLOSED, () => {
          safeResolve({ earned });
          setTimeout(() => preloadRewarded(), 500);
        });
        ad.addAdEventListener(AdEventType.ERROR, (e) => {
          if (__DEV__) console.warn('[Ads] rewarded error', e);
          safeResolve({ earned: false });
          setTimeout(() => preloadRewarded(), 500);
        });
        ad.load();
      } catch (e) {
        if (__DEV__) console.warn('[Ads] rewarded flow failed', e);
        safeResolve({ earned: false });
      }
    })();
  });
}
