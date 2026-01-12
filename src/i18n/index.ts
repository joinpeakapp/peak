import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LanguageService } from './languageService';
import enTranslations from './locales/en.json';
import frTranslations from './locales/fr.json';

// Initialiser i18next de manière asynchrone
export const initI18n = async () => {
  // Récupérer la langue sauvegardée
  const savedLanguage = await LanguageService.getLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        en: {
          translation: enTranslations,
        },
        fr: {
          translation: frTranslations,
        },
      },
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });

  return i18n;
};

export default i18n;


