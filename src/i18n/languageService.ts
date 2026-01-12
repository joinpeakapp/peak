import { SettingsService } from '../services/settingsService';

export type Language = 'en' | 'fr';

/**
 * Service pour gérer la langue de l'application
 */
export class LanguageService {
  /**
   * Obtenir la langue actuelle
   */
  static async getLanguage(): Promise<Language> {
    return SettingsService.getLanguage();
  }

  /**
   * Sauvegarder la langue
   */
  static async setLanguage(language: Language): Promise<{ success: boolean; error?: string }> {
    return SettingsService.setLanguage(language);
  }
}

