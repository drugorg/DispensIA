import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  InterstitialAd,
  MaxAdContentRating,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

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

const REQUEST_OPTS = { requestNonPersonalizedAdsOnly: true };

/**
 * Init lazy: chiamata SOLO quando serve mostrare un ad.
 * Se chiamata all'avvio dell'app può causare crash su alcune build/device
 * iOS quando il SDK AdMob non riesce a inizializzarsi correttamente
 * (es. SKAdNetworkItems mancanti, conflitto con altri SDK, ecc.).
 */
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
        return true;
      } catch (e) {
        if (__DEV__) console.warn('[Ads] init failed', e);
        initPromise = null; // permetti retry su prossima chiamata
        return false;
      }
    })();
  }
  return initPromise;
}

/** No-op: kept for backward compat. Init avviene lazy alla prima ad. */
export async function initAds(): Promise<void> {
  // Volutamente vuoto: niente init all'avvio (rischio crash).
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

export function showInterstitial(): void {
  if (!initialized || !interstitial || !interstitialLoaded) return;
  try {
    interstitial.show();
  } catch (e) {
    if (__DEV__) console.warn('[Ads] interstitial show failed', e);
  }
}

export function showRewarded(): Promise<{ earned: boolean }> {
  return new Promise((resolve) => {
    if (!initialized) {
      resolve({ earned: false });
      return;
    }
    let earned = false;
    let resolved = false;
    const ad = RewardedAd.createForAdRequest(REWARDED_ID, REQUEST_OPTS);
    const safeResolve = (v: { earned: boolean }) => {
      if (!resolved) {
        resolved = true;
        resolve(v);
      }
    };
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
    });
    ad.addAdEventListener(AdEventType.ERROR, (e) => {
      if (__DEV__) console.warn('[Ads] rewarded error', e);
      safeResolve({ earned: false });
    });
    ad.load();

    // Safety timeout: se l'ad non carica in 15 sec, abbandoniamo.
    setTimeout(() => safeResolve({ earned: false }), 15000);
  });
}
