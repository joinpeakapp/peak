import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

const FIRST_WORKOUT_CREATED_KEY = '@peak_first_workout_created';

/**
 * Service pour tracker si l'utilisateur a créé son premier workout
 * Utilisé pour afficher le Bottom Sheet de permission notifications
 */
export class FirstWorkoutTracker {
  /**
   * Marque que le premier workout a été créé
   */
  static async markFirstWorkoutCreated(): Promise<void> {
    try {
      await AsyncStorage.setItem(FIRST_WORKOUT_CREATED_KEY, 'true');
      logger.log('[FirstWorkoutTracker] First workout marked as created');
    } catch (error) {
      logger.error('[FirstWorkoutTracker] Error marking first workout:', error);
    }
  }

  /**
   * Vérifie si le premier workout a été créé
   */
  static async hasCreatedFirstWorkout(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(FIRST_WORKOUT_CREATED_KEY);
      return value === 'true';
    } catch (error) {
      logger.error('[FirstWorkoutTracker] Error checking first workout:', error);
      return false;
    }
  }

  /**
   * Réinitialise le flag (pour les tests ou reset de l'app)
   */
  static async reset(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FIRST_WORKOUT_CREATED_KEY);
      logger.log('[FirstWorkoutTracker] Reset first workout flag');
    } catch (error) {
      logger.error('[FirstWorkoutTracker] Error resetting first workout:', error);
    }
  }
}
