'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importar traducciones
import esCommon from '@/locales/es/common.json';
import enCommon from '@/locales/en/common.json';

const resources = {
  es: {
    common: esCommon,
  },
  en: {
    common: enCommon,
  },
};

// Detectar idioma inicial
const getInitialLanguage = (): string => {
  if (typeof window === 'undefined') return 'es';

  // Primero intentar localStorage
  const stored = localStorage.getItem('smart-cookbook:preferences');
  if (stored) {
    try {
      const prefs = JSON.parse(stored);
      if (prefs.locale) return prefs.locale;
    } catch {
      // Ignorar
    }
  }

  // Luego intentar navigator
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'es' || browserLang === 'en') {
    return browserLang;
  }

  return 'es'; // Default
};

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'es',
  defaultNS: 'common',
  ns: ['common'],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
