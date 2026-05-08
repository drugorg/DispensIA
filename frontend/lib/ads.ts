/**
 * AdMob temporaneamente disabilitato in 1.3.1.
 *
 * Build 1.3.0 (7) crashava al boot con expo-updates ErrorRecovery.
 * Bypass: rimosso il modulo react-native-google-mobile-ads dal bundle
 * (sia config plugin in app.json che import qui) per scoprire se
 * AdMob e' davvero la causa root.
 *
 * Se 1.3.1 parte normalmente, ricostruiremo il setup AdMob con
 * configurazione corretta (SKAdNetworkItems, ATT prompt, ecc.).
 */

export async function initAds(): Promise<void> {
  // no-op
}

export async function showInterstitial(): Promise<void> {
  // no-op
}

export async function showRewarded(): Promise<{ earned: boolean }> {
  return { earned: false };
}
