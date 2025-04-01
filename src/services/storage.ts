import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutState } from '../types/workout';

const STORAGE_KEYS = {
  WORKOUTS: '@peak_workouts',
  PERSONAL_RECORDS: '@peak_personal_records',
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

  // Effacer toutes les données
  clearAll: async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.WORKOUTS, STORAGE_KEYS.PERSONAL_RECORDS]);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression des données:', error);
      return false;
    }
  },
}; 