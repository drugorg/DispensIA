import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  InterstitialAd,
  MaxAdContentRating,
  TestIds,
} from 'react-native-google-mobile-ads';

export const ADS_ENABLED = true;

const INTERSTITIAL_ID =
  (Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS
    : process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID) || TestIds.INTERSTITIAL;

// Cooldown minimo tra interstiziali, in ms. Evita di mostrare due ad ravvicinati
// quando l'utente naviga rapidamente tra estrazione / ricetta / spesa.
const INTERSTITIAL_COOLDOWN_MS = 120_000;

let initialized = false;
let initPromise: Promise<boolean> | null = null;
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;
let lastInterstitialAt = 0;

const REQUEST_OPTS = { requestNonPersonalizedAdsOnly: true };

// Init lazy: NON al boot dell'app (causa crash iOS in passato). Parte alla
// prima chiamata di showInterstitial.
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

export async function showInterstitial(): Promise<void> {
  const ok = await ensureInitialized();
  if (!ok || !interstitial || !interstitialLoaded) return;
  try {
    interstitial.show();
    lastInterstitialAt = Date.now();
  } catch (e) {
    if (__DEV__) console.warn('[Ads] interstitial show failed', e);
  }
}

// Wrapper con frequency cap. Usalo per tutti i trigger non immediati.
// Ritorna true se l'ad è stato (probabilmente) mostrato, false se rimbalzato.
export async function maybeShowInterstitial(): Promise<boolean> {
  if (Date.now() - lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS) return false;
  const ok = await ensureInitialized();
  if (!ok || !interstitial || !interstitialLoaded) return false;
  try {
    interstitial.show();
    lastInterstitialAt = Date.now();
    return true;
  } catch (e) {
    if (__DEV__) console.warn('[Ads] interstitial show failed', e);
    return false;
  }
}
