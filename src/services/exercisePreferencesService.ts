import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

const EXERCISE_PREFERENCES_KEY = '@peak_exercise_preferences';

export interface ExercisePreferences {
  [exerciseId: string]: {
    restTimeSeconds: number;
    lastUpdated: string;
  };
}

/**
 * Service pour gérer les préférences des exercices (rest timers, etc.)
 * Permet de sauvegarder et charger les préférences personnalisées par exercice
 */
export class ExercisePreferencesService {
  /**
   * Sauvegarder les préférences d'un exercice
   */
  static async saveExercisePreferences(
    exerciseId: string, 
    preferences: { restTimeSeconds: number }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Charger les préférences existantes
      const existingData = await AsyncStorage.getItem(EXERCISE_PREFERENCES_KEY);
      const allPreferences: ExercisePreferences = existingData ? JSON.parse(existingData) : {};

      // Mettre à jour les préférences pour cet exercice
      allPreferences[exerciseId] = {
        restTimeSeconds: preferences.restTimeSeconds,
        lastUpdated: new Date().toISOString()
      };

      // Sauvegarder
      await AsyncStorage.setItem(EXERCISE_PREFERENCES_KEY, JSON.stringify(allPreferences));
      
      console.log(`[ExercisePreferences] Saved preferences for exercise ${exerciseId}:`, preferences);
      return { success: true };
    } catch (error) {
      logger.error('[ExercisePreferences] Error saving preferences:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Charger les préférences d'un exercice
   */
  static async getExercisePreferences(
    exerciseId: string
  ): Promise<{ success: boolean; preferences?: { restTimeSeconds: number }; error?: string }> {
    try {
      const data = await AsyncStorage.getItem(EXERCISE_PREFERENCES_KEY);
      if (!data) {
        return { success: true, preferences: undefined };
      }

      const allPreferences: ExercisePreferences = JSON.parse(data);
      const exercisePreferences = allPreferences[exerciseId];

      if (!exercisePreferences) {
        return { success: true, preferences: undefined };
      }

      return { 
        success: true, 
        preferences: { restTimeSeconds: exercisePreferences.restTimeSeconds } 
      };
    } catch (error) {
      logger.error('[ExercisePreferences] Error loading preferences:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Charger toutes les préférences
   */
  static async getAllPreferences(): Promise<{ success: boolean; preferences?: ExercisePreferences; error?: string }> {
    try {
      const data = await AsyncStorage.getItem(EXERCISE_PREFERENCES_KEY);
      if (!data) {
        return { success: true, preferences: {} };
      }

      const allPreferences: ExercisePreferences = JSON.parse(data);
      return { success: true, preferences: allPreferences };
    } catch (error) {
      logger.error('[ExercisePreferences] Error loading all preferences:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Supprimer les préférences d'un exercice
   */
  static async removeExercisePreferences(exerciseId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const data = await AsyncStorage.getItem(EXERCISE_PREFERENCES_KEY);
      if (!data) {
        return { success: true };
      }

      const allPreferences: ExercisePreferences = JSON.parse(data);
      delete allPreferences[exerciseId];

      await AsyncStorage.setItem(EXERCISE_PREFERENCES_KEY, JSON.stringify(allPreferences));
      
      console.log(`[ExercisePreferences] Removed preferences for exercise ${exerciseId}`);
      return { success: true };
    } catch (error) {
      logger.error('[ExercisePreferences] Error removing preferences:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Appliquer les préférences à une liste d'exercices
   */
  static async applyPreferencesToExercises(exercises: any[]): Promise<any[]> {
    try {
      const { success, preferences } = await this.getAllPreferences();
      if (!success || !preferences) {
        return exercises;
      }

      return exercises.map(exercise => {
        const exercisePreferences = preferences[exercise.id];
        if (exercisePreferences) {
          return {
            ...exercise,
            restTimeSeconds: exercisePreferences.restTimeSeconds
          };
        }
        return exercise;
      });
    } catch (error) {
      logger.error('[ExercisePreferences] Error applying preferences:', error);
      return exercises;
    }
  }
}
