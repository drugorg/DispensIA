import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { create } from 'zustand';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
const ENTITLEMENT_ID = 'premium';

interface PurchasesStore {
  isPremium: boolean;
  isReady: boolean;
  setPremium: (v: boolean) => void;
  setReady: (v: boolean) => void;
}

export const usePurchasesStore = create<PurchasesStore>((set) => ({
  isPremium: false,
  isReady: false,
  setPremium: (v) => set({ isPremium: v }),
  setReady: (v) => set({ isReady: v }),
}));

let configured = false;

function platformKey(): string | undefined {
  return Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
}

export async function initPurchases(userId: string): Promise<void> {
  if (configured) return;
  const apiKey = platformKey();
  if (!apiKey) {
    if (__DEV__) console.warn('[Purchases] No API key configured for', Platform.OS);
    return;
  }

  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);

  Purchases.configure({ apiKey, appUserID: userId });
  configured = true;

  Purchases.addCustomerInfoUpdateListener(applyEntitlement);

  try {
    const info = await Purchases.getCustomerInfo();
    applyEntitlement(info);
  } catch (e) {
    if (__DEV__) console.warn('[Purchases] getCustomerInfo failed', e);
  } finally {
    usePurchasesStore.getState().setReady(true);
  }
}

function applyEntitlement(info: CustomerInfo) {
  const active = info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  usePurchasesStore.getState().setPremium(active);
}

export async function fetchCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    if (__DEV__) console.warn('[Purchases] getOfferings failed', e);
    return null;
  }
}

export async function purchase(pkg: PurchasesPackage): Promise<{ ok: boolean; cancelled: boolean }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    applyEntitlement(customerInfo);
    return { ok: customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined, cancelled: false };
  } catch (e: any) {
    if (e?.userCancelled) return { ok: false, cancelled: true };
    throw e;
  }
}

export async function restore(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  applyEntitlement(info);
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export async function logoutPurchases(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch {}
  usePurchasesStore.getState().setPremium(false);
}
