import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import it from '../locales/it.json';
import en from '../locales/en.json';

const SUPPORTED = ['it', 'en'];

function deviceLang(): string {
  const code = getLocales()[0]?.languageCode ?? 'en';
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
