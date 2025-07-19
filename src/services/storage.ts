import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutState, StreakData, EnhancedPersonalRecords, CompletedWorkout, Workout } from '../types/workout';

// Nouvelles clés optimisées (5 au total)
const STORAGE_KEYS = {
  WORKOUT_TEMPLATES: '@peak_workout_templates',    // Templates de workouts
  WORKOUT_HISTORY: '@peak_workout_history',        // Historique des workouts terminés
  PERSONAL_RECORDS: '@peak_personal_records',      // Tous les records fusionnés
  WORKOUT_STREAKS: '@peak_workout_streaks',        // Données de streak
  ACTIVE_SESSION: '@peak_active_session',          // Session active (workout + timer)
};

// Anciennes clés pour migration
const LEGACY_KEYS = {
  OLD_WORKOUTS: '@peak_workouts',
  OLD_PERSONAL_RECORDS: '@peak_personal_records',
  OLD_ENHANCED_RECORDS: '@peak_enhanced_personal_records',
  OLD_STREAKS: '@peak_workout_streaks',
  COMPLETED_WORKOUTS: 'completedWorkouts',
  ACTIVE_WORKOUT: 'activeWorkoutData',
  REST_TIMER: 'restTimerData',
};

// Types pour la session active
interface ActiveSessionData {
  activeWorkout?: any;
  restTimer?: any;
  lastUpdated: string;
}

// Interface pour les erreurs de stockage
interface StorageError {
  code: string;
  message: string;
  userMessage: string;
  originalError?: Error;
}

/**
 * Service de stockage robuste avec gestion d'erreur avancée
 * Fournit des fallbacks, migration automatique et messages user-friendly
 */
export class RobustStorageService {
  private static readonly MIGRATION_KEY = '@peak_migration_completed';

  /**
   * Vérifier si la migration a déjà été effectuée
   */
  private static async isMigrationCompleted(): Promise<boolean> {
    try {
      const migrationStatus = await AsyncStorage.getItem(this.MIGRATION_KEY);
      return migrationStatus === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Marquer la migration comme terminée
   */
  private static async markMigrationCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.MIGRATION_KEY, 'true');
    } catch (error) {
      console.warn('[RobustStorageService] Could not mark migration as completed:', error);
    }
  }

  /**
   * Créer une erreur de stockage structurée
   */
  private static createStorageError(
    code: string, 
    technicalMessage: string, 
    userMessage: string, 
    originalError?: Error
  ): StorageError {
    return {
      code,
      message: technicalMessage,
      userMessage,
      originalError
    };
  }

  /**
   * Logger les erreurs de manière cohérente
   */
  private static logError(operation: string, error: StorageError) {
    console.error(`🚨 [RobustStorageService] ${operation}:`, {
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      originalError: error.originalError?.message
    });
  }

  /**
   * Wrapper sécurisé pour les opérations AsyncStorage
   */
  private static async safeAsyncStorageOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    fallbackValue: T,
    userErrorMessage: string
  ): Promise<{ success: boolean; data: T; error?: StorageError }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (originalError) {
      const error = this.createStorageError(
        'STORAGE_OPERATION_FAILED',
        `Failed to ${operationName}`,
        userErrorMessage,
        originalError as Error
      );
      
      this.logError(operationName, error);
      
      return { 
        success: false, 
        data: fallbackValue, 
        error 
      };
    }
  }

  /**
   * Migration automatique des anciennes données vers le nouveau format
   */
  private static async migrateData(): Promise<boolean> {
    if (await this.isMigrationCompleted()) return true;

    console.log('[RobustStorageService] Starting data migration...');

    try {
      // 1. Migrer les workout templates
      const { data: oldWorkouts } = await this.safeAsyncStorageOperation(
        () => AsyncStorage.getItem(LEGACY_KEYS.OLD_WORKOUTS),
        'load old workouts for migration',
        null,
        'Could not migrate workout templates'
      );

      if (oldWorkouts && oldWorkouts !== 'null') {
        // oldWorkouts est déjà une string JSON, on peut la sauvegarder directement
        await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_TEMPLATES, oldWorkouts);
        console.log('[Migration] Workout templates migrated');
      }

      // 2. Migrer l'historique des workouts
      const { data: completedWorkouts } = await this.safeAsyncStorageOperation(
        () => AsyncStorage.getItem(LEGACY_KEYS.COMPLETED_WORKOUTS),
        'load completed workouts for migration',
        null,
        'Could not migrate workout history'
      );

      if (completedWorkouts && completedWorkouts !== 'null') {
        // completedWorkouts est déjà une string JSON
        await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_HISTORY, completedWorkouts);
        console.log('[Migration] Workout history migrated');
      }

      // 3. Fusionner les records personnels
      const { data: oldRecords } = await this.safeAsyncStorageOperation(
        () => AsyncStorage.getItem(LEGACY_KEYS.OLD_PERSONAL_RECORDS),
        'load old personal records for migration',
        null,
        'Could not migrate personal records'
      );

      const { data: enhancedRecords } = await this.safeAsyncStorageOperation(
        () => AsyncStorage.getItem(LEGACY_KEYS.OLD_ENHANCED_RECORDS),
        'load enhanced personal records for migration',
        null,
        'Could not migrate enhanced personal records'
      );

      // Charger les records existants dans la nouvelle structure pour les préserver
      const { data: existingRecords } = await this.safeAsyncStorageOperation(
        () => AsyncStorage.getItem(STORAGE_KEYS.PERSONAL_RECORDS),
        'load existing personal records',
        null,
        'Could not load existing personal records'
      );

      let existingData: any = { legacy: {}, enhanced: {} };
      if (existingRecords && existingRecords !== 'null') {
        try {
          existingData = JSON.parse(existingRecords);
          console.log('[Migration] Preserving existing enhanced records:', Object.keys(existingData.enhanced || {}));
    } catch (error) {
          console.warn('[Migration] Could not parse existing records, starting fresh');
        }
      }

      // Fusionner les deux types de records EN PRÉSERVANT les enhanced records existants
      const mergedRecords = {
        legacy: oldRecords && oldRecords !== 'null' ? JSON.parse(oldRecords) : existingData.legacy,
        enhanced: existingData.enhanced || (enhancedRecords && enhancedRecords !== 'null' ? JSON.parse(enhancedRecords) : {}),
        migratedAt: existingData.migratedAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      console.log('[Migration] Final merged data:', {
        legacyKeys: Object.keys(mergedRecords.legacy || {}),
        enhancedKeys: Object.keys(mergedRecords.enhanced || {}),
        preservedExisting: Object.keys(existingData.enhanced || {}).length > 0
      });

      // Toujours sauvegarder pour s'assurer que la structure est correcte
      await AsyncStorage.setItem(STORAGE_KEYS.PERSONAL_RECORDS, JSON.stringify(mergedRecords));
      console.log('[Migration] Personal records merged and migrated');

      // 4. Migrer les données de streak (clé identique, pas besoin de migration)
      
      // 5. Migrer la session active
      const { data: activeWorkout } = await this.safeAsyncStorageOperation(
        () => AsyncStorage.getItem(LEGACY_KEYS.ACTIVE_WORKOUT),
        'load active workout for migration',
        null,
        'Could not migrate active session'
      );

      const { data: restTimer } = await this.safeAsyncStorageOperation(
        () => AsyncStorage.getItem(LEGACY_KEYS.REST_TIMER),
        'load rest timer for migration',
        null,
        'Could not migrate rest timer'
      );

      if (activeWorkout || restTimer) {
        const sessionData: ActiveSessionData = {
          activeWorkout: activeWorkout && activeWorkout !== 'null' ? JSON.parse(activeWorkout) : undefined,
          restTimer: restTimer && restTimer !== 'null' ? JSON.parse(restTimer) : undefined,
          lastUpdated: new Date().toISOString()
        };
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(sessionData));
        console.log('[Migration] Active session migrated');
      }

      // 6. Nettoyer les anciennes clés après migration réussie
      // IMPORTANT: Ne supprimer que les clés qui ne sont PAS dans les nouvelles clés
      const currentStorageKeysValues = Object.values(STORAGE_KEYS);
      const legacyKeysToRemove = Object.values(LEGACY_KEYS).filter(
        legacyKey => !currentStorageKeysValues.includes(legacyKey)
      );
      
      console.log('[Migration] Keys to remove:', legacyKeysToRemove);
      console.log('[Migration] Keys to preserve:', currentStorageKeysValues);
      
      if (legacyKeysToRemove.length > 0) {
        await AsyncStorage.multiRemove(legacyKeysToRemove);
        console.log('[Migration] Legacy keys cleaned up');
      } else {
        console.log('[Migration] No legacy keys to remove');
      }

      await this.markMigrationCompleted();
      console.log('[RobustStorageService] Data migration completed successfully');
      return true;

    } catch (error) {
      console.error('[RobustStorageService] Migration failed:', error);
      return false;
    }
  }

  /**
   * Initialiser le service (effectue la migration si nécessaire)
   */
  static async initialize(): Promise<boolean> {
    console.log('[RobustStorageService] Initializing...');
    const migrationSuccess = await this.migrateData();
    
    if (!migrationSuccess) {
      console.warn('[RobustStorageService] Migration failed, but service will continue with fallbacks');
    }
    
    return migrationSuccess;
  }

  // ===========================================
  // MÉTHODES POUR WORKOUT TEMPLATES
  // ===========================================

  /**
   * Sauvegarder les templates de workouts
   */
  static async saveWorkoutTemplates(workouts: Workout[]): Promise<{ success: boolean; error?: StorageError }> {
    const { success, error } = await this.safeAsyncStorageOperation(
      () => AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_TEMPLATES, JSON.stringify(workouts)),
      'save workout templates',
      undefined,
      'Could not save your workout templates. Please try again.'
    );

    return { success, error };
  }

  /**
   * Charger les templates de workouts
   */
  static async loadWorkoutTemplates(): Promise<{ success: boolean; data: Workout[]; error?: StorageError }> {
    const { success, data, error } = await this.safeAsyncStorageOperation(
      async () => {
        const result = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_TEMPLATES);
        return result ? JSON.parse(result) : [];
      },
      'load workout templates',
      [],
      'Could not load your workout templates. Using default templates.'
    );

    return { success, data, error };
  }

  // ===========================================
  // MÉTHODES POUR L'HISTORIQUE DES WORKOUTS
  // ===========================================

  /**
   * Sauvegarder l'historique des workouts
   */
  static async saveWorkoutHistory(completedWorkouts: CompletedWorkout[]): Promise<{ success: boolean; error?: StorageError }> {
    // Validation des données avant sauvegarde
    if (!Array.isArray(completedWorkouts)) {
      return {
        success: false,
        error: this.createStorageError(
          'INVALID_DATA',
          'Workout history must be an array',
          'Could not save workout history: invalid data format'
        )
      };
    }

    const { success, error } = await this.safeAsyncStorageOperation(
      () => AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_HISTORY, JSON.stringify(completedWorkouts || [])),
      'save workout history',
      undefined,
      'Could not save your workout history. Your progress might not be saved.'
    );

    return { success, error };
  }

  /**
   * Charger l'historique des workouts
   */
  static async loadWorkoutHistory(): Promise<{ success: boolean; data: CompletedWorkout[]; error?: StorageError }> {
    const { success, data, error } = await this.safeAsyncStorageOperation(
      async () => {
        const result = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_HISTORY);
        return result ? JSON.parse(result) : [];
      },
      'load workout history',
      [],
      'Could not load your workout history. Your past workouts might not appear.'
    );

    return { success, data, error };
  }

  /**
   * Ajouter un workout à l'historique
   */
  static async addCompletedWorkout(newWorkout: CompletedWorkout): Promise<{ success: boolean; error?: StorageError }> {
    // Validation du workout
    if (!newWorkout || typeof newWorkout !== 'object') {
      return {
        success: false,
        error: this.createStorageError(
          'INVALID_WORKOUT',
          'Invalid workout data provided',
          'Could not save workout: invalid data'
        )
      };
    }

    const { data: currentHistory } = await this.loadWorkoutHistory();
    const updatedHistory = [...(currentHistory || []), newWorkout];
    return await this.saveWorkoutHistory(updatedHistory);
    }

  // ===========================================
  // MÉTHODES POUR LES RECORDS PERSONNELS
  // ===========================================

  /**
   * Sauvegarder les records personnels
   */
  static async savePersonalRecords(records: any): Promise<{ success: boolean; error?: StorageError }> {
    const { success, error } = await this.safeAsyncStorageOperation(
      () => AsyncStorage.setItem(STORAGE_KEYS.PERSONAL_RECORDS, JSON.stringify(records)),
      'save personal records',
      undefined,
      'Could not save your personal records. Your progress might not be tracked.'
    );

    return { success, error };
  }

  /**
   * Charger les records personnels
   */
  static async loadPersonalRecords(): Promise<{ success: boolean; data: any; error?: StorageError }> {
    const { success, data, error } = await this.safeAsyncStorageOperation(
      async () => {
        const result = await AsyncStorage.getItem(STORAGE_KEYS.PERSONAL_RECORDS);
        return result ? JSON.parse(result) : { legacy: {}, enhanced: {}, migratedAt: new Date().toISOString() };
      },
      'load personal records',
      { legacy: {}, enhanced: {}, migratedAt: new Date().toISOString() },
      'Could not load your personal records. Your achievements might not appear.'
    );

    return { success, data, error };
    }

  // ===========================================
  // MÉTHODES POUR LES STREAKS
  // ===========================================

  /**
   * Sauvegarder les données de streak
   */
  static async saveWorkoutStreaks(streaksData: Record<string, StreakData>): Promise<{ success: boolean; error?: StorageError }> {
    const { success, error } = await this.safeAsyncStorageOperation(
      () => AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_STREAKS, JSON.stringify(streaksData)),
      'save workout streaks',
      undefined,
      'Could not save your workout streaks. Your streak progress might not be tracked.'
    );

    return { success, error };
  }

  /**
   * Charger les données de streak
   */
  static async loadWorkoutStreaks(): Promise<{ success: boolean; data: Record<string, StreakData>; error?: StorageError }> {
    const { success, data, error } = await this.safeAsyncStorageOperation(
      async () => {
        const result = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_STREAKS);
        return result ? JSON.parse(result) : {};
      },
      'load workout streaks',
      {},
      'Could not load your workout streaks. Your streak information might not be accurate.'
    );

    return { success, data, error };
  }

  /**
   * Sauvegarder les données de streak pour un workout spécifique
   */
  static async saveWorkoutStreak(workoutId: string, streakData: StreakData): Promise<{ success: boolean; error?: StorageError }> {
    const { data: allStreaks } = await this.loadWorkoutStreaks();
    allStreaks[workoutId] = streakData;
    return await this.saveWorkoutStreaks(allStreaks);
  }

  /**
   * Charger les données de streak pour un workout spécifique
   */
  static async loadWorkoutStreak(workoutId: string): Promise<{ success: boolean; data: StreakData | null; error?: StorageError }> {
    const { success, data: allStreaks, error } = await this.loadWorkoutStreaks();
    const streakData = allStreaks[workoutId] || null;
    
    return { success, data: streakData, error };
    }

  // ===========================================
  // MÉTHODES POUR LA SESSION ACTIVE
  // ===========================================

  /**
   * Sauvegarder la session active (workout + timer)
   */
  static async saveActiveSession(sessionData: ActiveSessionData): Promise<{ success: boolean; error?: StorageError }> {
    const dataWithTimestamp = {
      ...sessionData,
      lastUpdated: new Date().toISOString()
    };

    const { success, error } = await this.safeAsyncStorageOperation(
      () => AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(dataWithTimestamp)),
      'save active session',
      undefined,
      'Could not save your current workout session. Your progress might be lost if you close the app.'
    );

    return { success, error };
  }

  /**
   * Charger la session active
   */
  static async loadActiveSession(): Promise<{ success: boolean; data: ActiveSessionData | null; error?: StorageError }> {
    const { success, data, error } = await this.safeAsyncStorageOperation(
      async () => {
        const result = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
        return result ? JSON.parse(result) : null;
      },
      'load active session',
      null,
      'Could not restore your previous workout session.'
    );

    return { success, data, error };
  }

  /**
   * Effacer la session active
   */
  static async clearActiveSession(): Promise<{ success: boolean; error?: StorageError }> {
    const { success, error } = await this.safeAsyncStorageOperation(
      () => AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION),
      'clear active session',
      undefined,
      'Could not clear your workout session.'
    );

    return { success, error };
  }

  // ===========================================
  // MÉTHODES UTILITAIRES
  // ===========================================

  /**
   * Effacer toutes les données (pour reset complet)
   */
  static async clearAllData(): Promise<{ success: boolean; error?: StorageError }> {
    const { success, error } = await this.safeAsyncStorageOperation(
      async () => {
        await AsyncStorage.multiRemove([...Object.values(STORAGE_KEYS), this.MIGRATION_KEY]);
      },
      'clear all data',
      undefined,
      'Could not clear your data. Please try again.'
    );

    return { success, error };
  }

  /**
   * Obtenir des informations de debug sur le stockage
   */
  static async getStorageInfo(): Promise<{
    keys: string[];
    sizes: Record<string, number>;
    totalSize: number;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const peakKeys = allKeys.filter(key => key.startsWith('@peak_'));
      
      const sizes: Record<string, number> = {};
      let totalSize = 0;

      for (const key of peakKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          const size = value ? JSON.stringify(value).length : 0;
          sizes[key] = size;
          totalSize += size;
        } catch {
          sizes[key] = 0;
        }
      }

      return { keys: peakKeys, sizes, totalSize };
    } catch {
      return { keys: [], sizes: {}, totalSize: 0 };
    }
  }
}

// Backward compatibility - keep the old interface for gradual migration
export const StorageService = {
  saveWorkouts: (workouts: Workout[]) => RobustStorageService.saveWorkoutTemplates(workouts),
  loadWorkouts: () => RobustStorageService.loadWorkoutTemplates().then(result => result.data),
  savePersonalRecords: (records: any) => RobustStorageService.savePersonalRecords(records),
  loadPersonalRecords: () => RobustStorageService.loadPersonalRecords().then(result => result.data.legacy),
  saveEnhancedPersonalRecords: (records: EnhancedPersonalRecords) => 
    RobustStorageService.loadPersonalRecords().then(result => {
      const merged = { ...result.data, enhanced: records };
      return RobustStorageService.savePersonalRecords(merged);
    }),
  loadEnhancedPersonalRecords: () => 
    RobustStorageService.loadPersonalRecords().then(result => result.data.enhanced || {}),
  saveWorkoutStreak: (workoutId: string, streakData: StreakData) => 
    RobustStorageService.saveWorkoutStreak(workoutId, streakData),
  loadWorkoutStreaks: () => RobustStorageService.loadWorkoutStreaks().then(result => result.data),
  loadWorkoutStreak: (workoutId: string) => 
    RobustStorageService.loadWorkoutStreak(workoutId).then(result => result.data),
  clearAll: () => RobustStorageService.clearAllData(),
}; 