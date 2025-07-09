import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './i18n/locales/en.json';
import es from './i18n/locales/es.json';
import de from './i18n/locales/de.json';

import pl from './i18n/locales/pl.json';
import sq from './i18n/locales/sq.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      de: { translation: de },
      pl: { translation: pl },
      sq: { translation: sq },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
