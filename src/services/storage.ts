import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutState, StreakData, EnhancedPersonalRecords } from '../types/workout';

const STORAGE_KEYS = {
  WORKOUTS: '@peak_workouts',
  PERSONAL_RECORDS: '@peak_personal_records',
  ENHANCED_PERSONAL_RECORDS: '@peak_enhanced_personal_records',
  STREAKS: '@peak_workout_streaks',
};

export const StorageService = {
  // Sauvegarder les workouts
  saveWorkouts: async (workouts: WorkoutState['workouts']) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des workouts:', error);
      return false;
    }
  },

  // Charger les workouts
  loadWorkouts: async () => {
    try {
      const workouts = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUTS);
      return workouts ? JSON.parse(workouts) : [];
    } catch (error) {
      console.error('Erreur lors du chargement des workouts:', error);
      return [];
    }
  },

  // Sauvegarder les records personnels
  savePersonalRecords: async (records: WorkoutState['personalRecords']) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PERSONAL_RECORDS, JSON.stringify(records));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des records:', error);
      return false;
    }
  },

  // Charger les records personnels
  loadPersonalRecords: async () => {
    try {
      const records = await AsyncStorage.getItem(STORAGE_KEYS.PERSONAL_RECORDS);
      return records ? JSON.parse(records) : {};
    } catch (error) {
      console.error('Erreur lors du chargement des records:', error);
      return {};
    }
  },
  
  // Sauvegarder les données de streak pour un workout
  saveWorkoutStreak: async (workoutId: string, streakData: StreakData) => {
    try {
      const streaksData = await StorageService.loadWorkoutStreaks();
      streaksData[workoutId] = streakData;
      await AsyncStorage.setItem(STORAGE_KEYS.STREAKS, JSON.stringify(streaksData));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données de streak:', error);
      return false;
    }
  },

  // Charger les données de streak pour tous les workouts
  loadWorkoutStreaks: async (): Promise<Record<string, StreakData>> => {
    try {
      const streaksData = await AsyncStorage.getItem(STORAGE_KEYS.STREAKS);
      return streaksData ? JSON.parse(streaksData) : {};
    } catch (error) {
      console.error('Erreur lors du chargement des données de streak:', error);
      return {};
    }
  },

  // Charger les données de streak pour un workout spécifique
  loadWorkoutStreak: async (workoutId: string): Promise<StreakData | null> => {
    try {
      const streaksData = await StorageService.loadWorkoutStreaks();
      return streaksData[workoutId] || null;
    } catch (error) {
      console.error(`Erreur lors du chargement des données de streak pour le workout ${workoutId}:`, error);
      return null;
    }
  },

  // Sauvegarder les records personnels améliorés
  saveEnhancedPersonalRecords: async (records: EnhancedPersonalRecords) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ENHANCED_PERSONAL_RECORDS, JSON.stringify(records));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des records améliorés:', error);
      return false;
    }
  },

  // Charger les records personnels améliorés
  loadEnhancedPersonalRecords: async (): Promise<EnhancedPersonalRecords> => {
    try {
      const records = await AsyncStorage.getItem(STORAGE_KEYS.ENHANCED_PERSONAL_RECORDS);
      return records ? JSON.parse(records) : {};
    } catch (error) {
      console.error('Erreur lors du chargement des records améliorés:', error);
      return {};
    }
  },

  // Effacer toutes les données
  clearAll: async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.WORKOUTS, 
        STORAGE_KEYS.PERSONAL_RECORDS,
        STORAGE_KEYS.ENHANCED_PERSONAL_RECORDS,
        STORAGE_KEYS.STREAKS
      ]);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression des données:', error);
      return false;
    }
  },
}; 