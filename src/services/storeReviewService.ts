import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

/**
 * Service pour gérer les demandes de note sur l'App Store
 * 
 * Stratégie :
 * - Demander une note après le premier workout complété
 * - Ne demander qu'une seule fois (Apple limite à ~3 fois par an de toute façon)
 */
class StoreReviewService {
  private static readonly HAS_REQUESTED_REVIEW_KEY = '@peak_has_requested_review';
  private static readonly COMPLETED_WORKOUTS_COUNT_KEY = '@peak_completed_workouts_count';

  /**
   * Vérifie si on doit demander une note après un workout complété
   * Appelé après chaque workout validé
   */
  static async checkAndRequestReview(): Promise<void> {
    try {
      // Vérifier si on a déjà demandé une note
      const hasRequested = await AsyncStorage.getItem(this.HAS_REQUESTED_REVIEW_KEY);
      if (hasRequested === 'true') {
        logger.log('[StoreReviewService] Review already requested, skipping');
        return; // Ne pas demander plusieurs fois
      }

      // Récupérer le nombre de workouts complétés
      const countStr = await AsyncStorage.getItem(this.COMPLETED_WORKOUTS_COUNT_KEY);
      const count = countStr ? parseInt(countStr, 10) : 0;
      
      logger.log(`[StoreReviewService] Completed workouts count: ${count}`);
      
      // Demander une note après le premier workout complété
      if (count === 1) {
        const isAvailable = await StoreReview.isAvailableAsync();
        
        if (isAvailable) {
          logger.log('[StoreReviewService] Requesting review after first workout');
          await StoreReview.requestReview();
          
          // Marquer comme demandé pour ne pas redemander
          await AsyncStorage.setItem(this.HAS_REQUESTED_REVIEW_KEY, 'true');
          logger.log('[StoreReviewService] Review requested successfully');
        } else {
          logger.log('[StoreReviewService] Store review not available on this device');
        }
      }
    } catch (error) {
      logger.error('[StoreReviewService] Error requesting review:', error);
    }
  }

  /**
   * Incrémenter le compteur de workouts complétés
   * Appelé après chaque workout validé
   */
  static async incrementCompletedWorkouts(): Promise<void> {
    try {
      const countStr = await AsyncStorage.getItem(this.COMPLETED_WORKOUTS_COUNT_KEY);
      const count = countStr ? parseInt(countStr, 10) : 0;
      const newCount = count + 1;
      
      await AsyncStorage.setItem(this.COMPLETED_WORKOUTS_COUNT_KEY, String(newCount));
      logger.log(`[StoreReviewService] Incremented completed workouts count to ${newCount}`);
    } catch (error) {
      logger.error('[StoreReviewService] Error incrementing count:', error);
    }
  }

  /**
   * Réinitialiser le compteur (pour les tests uniquement)
   */
  static async resetForTesting(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.HAS_REQUESTED_REVIEW_KEY);
      await AsyncStorage.removeItem(this.COMPLETED_WORKOUTS_COUNT_KEY);
      logger.log('[StoreReviewService] Reset completed for testing');
    } catch (error) {
      logger.error('[StoreReviewService] Error resetting:', error);
    }
  }

  /**
   * Obtenir le nombre de workouts complétés (pour debug)
   */
  static async getCompletedWorkoutsCount(): Promise<number> {
    try {
      const countStr = await AsyncStorage.getItem(this.COMPLETED_WORKOUTS_COUNT_KEY);
      return countStr ? parseInt(countStr, 10) : 0;
    } catch (error) {
      logger.error('[StoreReviewService] Error getting count:', error);
      return 0;
    }
  }
}

export default StoreReviewService;
