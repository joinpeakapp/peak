import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise } from '../types/workout';
import logger from '../utils/logger';

const CUSTOM_EXERCISES_KEY = '@peak_custom_exercises';

export interface CustomExercise {
  id: string;
  name: string;
  tags: string[];
  tracking: 'trackedOnSets' | 'trackedOnTime';
  createdAt: string;
  isCustom: true; // Marqueur pour identifier les exercices personnalisés
}

/**
 * Service pour gérer les exercices personnalisés
 * Les exercices sont stockés dans AsyncStorage et fusionnés avec les exercices par défaut
 */
class CustomExerciseService {
  /**
   * Récupérer tous les exercices personnalisés
   */
  async getCustomExercises(): Promise<CustomExercise[]> {
    try {
      const data = await AsyncStorage.getItem(CUSTOM_EXERCISES_KEY);
      if (!data) {
        return [];
      }
      const exercises = JSON.parse(data);
      console.log('[CustomExerciseService] Loaded custom exercises:', exercises.length);
      return exercises;
    } catch (error) {
      logger.error('[CustomExerciseService] Error loading custom exercises:', error);
      return [];
    }
  }

  /**
   * Sauvegarder un nouvel exercice personnalisé
   */
  async createCustomExercise(
    name: string,
    tags: string[],
    tracking: 'trackedOnSets' | 'trackedOnTime' = 'trackedOnSets'
  ): Promise<CustomExercise> {
    try {
      // Validation
      if (!name || name.trim().length === 0) {
        throw new Error('Exercise name is required');
      }
      if (name.length > 30) {
        throw new Error('Exercise name must be 30 characters or less');
      }
      if (!tags || tags.length === 0) {
        throw new Error('At least one tag is required');
      }

      // Créer le nouvel exercice
      const newExercise: CustomExercise = {
        id: `custom_${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        tags,
        tracking,
        createdAt: new Date().toISOString(),
        isCustom: true,
      };

      // Récupérer les exercices existants
      const existingExercises = await this.getCustomExercises();

      // Vérifier si un exercice avec le même nom existe déjà
      const nameExists = existingExercises.some(
        ex => ex.name.toLowerCase() === newExercise.name.toLowerCase()
      );
      if (nameExists) {
        throw new Error('An exercise with this name already exists');
      }

      // Ajouter le nouvel exercice
      const updatedExercises = [...existingExercises, newExercise];

      // Sauvegarder
      await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(updatedExercises));

      console.log('[CustomExerciseService] Created custom exercise:', newExercise.name);
      return newExercise;
    } catch (error) {
      logger.error('[CustomExerciseService] Error creating custom exercise:', error);
      throw error;
    }
  }

  /**
   * Supprimer un exercice personnalisé
   */
  async deleteCustomExercise(id: string): Promise<void> {
    try {
      const exercises = await this.getCustomExercises();
      const filteredExercises = exercises.filter(ex => ex.id !== id);
      
      await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(filteredExercises));
      console.log('[CustomExerciseService] Deleted custom exercise:', id);
    } catch (error) {
      logger.error('[CustomExerciseService] Error deleting custom exercise:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un exercice personnalisé
   */
  async updateCustomExercise(
    id: string,
    updates: Partial<Omit<CustomExercise, 'id' | 'createdAt' | 'isCustom'>>
  ): Promise<CustomExercise> {
    try {
      const exercises = await this.getCustomExercises();
      const exerciseIndex = exercises.findIndex(ex => ex.id === id);
      
      if (exerciseIndex === -1) {
        throw new Error('Exercise not found');
      }

      // Validation du nom si modifié
      if (updates.name !== undefined) {
        if (updates.name.trim().length === 0) {
          throw new Error('Exercise name is required');
        }
        if (updates.name.length > 30) {
          throw new Error('Exercise name must be 30 characters or less');
        }

        // Vérifier les doublons
        const nameExists = exercises.some(
          (ex, idx) => idx !== exerciseIndex && ex.name.toLowerCase() === updates.name!.toLowerCase()
        );
        if (nameExists) {
          throw new Error('An exercise with this name already exists');
        }
      }

      // Validation des tags si modifiés
      if (updates.tags !== undefined && updates.tags.length === 0) {
        throw new Error('At least one tag is required');
      }

      // Mettre à jour l'exercice
      const updatedExercise: CustomExercise = {
        ...exercises[exerciseIndex],
        ...updates,
      };

      exercises[exerciseIndex] = updatedExercise;

      // Sauvegarder
      await AsyncStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(exercises));

      console.log('[CustomExerciseService] Updated custom exercise:', updatedExercise.name);
      return updatedExercise;
    } catch (error) {
      logger.error('[CustomExerciseService] Error updating custom exercise:', error);
      throw error;
    }
  }

  /**
   * Convertir un CustomExercise en Exercise pour utilisation dans les workouts
   */
  convertToExercise(customExercise: CustomExercise): Exercise {
    return {
      id: customExercise.id,
      name: customExercise.name,
      sets: 3, // Valeur par défaut
      reps: 0, // L'utilisateur définira lors de l'utilisation
      weight: 0,
      tags: customExercise.tags,
      tracking: customExercise.tracking,
    };
  }

  /**
   * Nettoyer tous les exercices personnalisés (pour debug/reset)
   */
  async clearAllCustomExercises(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CUSTOM_EXERCISES_KEY);
      console.log('[CustomExerciseService] Cleared all custom exercises');
    } catch (error) {
      logger.error('[CustomExerciseService] Error clearing custom exercises:', error);
      throw error;
    }
  }
}

export default new CustomExerciseService();

