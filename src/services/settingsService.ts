import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_STORAGE_KEY = '@peak_settings';

export interface AppSettings {
  defaultRestTimerSeconds: number; // Temps de repos par défaut en secondes
  workoutRemindersEnabled: boolean; // Activer les rappels pour les jours avec workout planifié
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultRestTimerSeconds: 180, // 3 minutes par défaut
  workoutRemindersEnabled: true,
};

/**
 * Service pour gérer les paramètres de l'application
 */
export class SettingsService {
  /**
   * Charger tous les paramètres
   */
  static async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (data) {
        const settings = JSON.parse(data) as AppSettings;
        // Fusionner avec les valeurs par défaut pour s'assurer que tous les champs existent
        return { ...DEFAULT_SETTINGS, ...settings };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('[SettingsService] Error loading settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Sauvegarder tous les paramètres
   */
  static async saveSettings(settings: Partial<AppSettings>): Promise<{ success: boolean; error?: string }> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
      return { success: true };
    } catch (error) {
      console.error('[SettingsService] Error saving settings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Obtenir le temps de repos par défaut
   */
  static async getDefaultRestTimer(): Promise<number> {
    const settings = await this.getSettings();
    return settings.defaultRestTimerSeconds;
  }

  /**
   * Sauvegarder le temps de repos par défaut
   */
  static async setDefaultRestTimer(seconds: number): Promise<{ success: boolean; error?: string }> {
    return this.saveSettings({ defaultRestTimerSeconds: seconds });
  }

  /**
   * Obtenir l'état des rappels de workout
   */
  static async getWorkoutRemindersEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.workoutRemindersEnabled;
  }

  /**
   * Sauvegarder l'état des rappels de workout
   */
  static async setWorkoutRemindersEnabled(enabled: boolean): Promise<{ success: boolean; error?: string }> {
    return this.saveSettings({ workoutRemindersEnabled: enabled });
  }
}

