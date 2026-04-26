import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { NativeModules, Platform } from 'react-native';

import it from '../locales/it.json';
import en from '../locales/en.json';

const SUPPORTED = ['it', 'en'];

function deviceLang(): string {
  let raw = 'en';
  try {
    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings ?? {};
      raw = settings.AppleLocale || settings.AppleLanguages?.[0] || 'en';
    } else {
      raw = NativeModules.I18nManager?.localeIdentifier ?? 'en';
    }
  } catch {
    raw = 'en';
  }
  const code = raw.split(/[-_]/)[0];
  return SUPPORTED.includes(code) ? code : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    it: { translation: it },
    en: { translation: en },
  },
  lng: deviceLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
