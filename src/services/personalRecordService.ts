import { StorageService } from './storage';
import { WorkoutState } from '../types/workout';
import { Exercise } from '../types/exercise';

/**
 * Service de gestion des records personnels.
 * Fournit des méthodes pour vérifier, récupérer et sauvegarder les records personnels.
 */
export const PersonalRecordService = {
  /**
   * Vérifie si un ensemble de poids et de répétitions est un nouveau record.
   * @param exerciseName - Le nom de l'exercice
   * @param weight - Le poids utilisé
   * @param reps - Le nombre de répétitions
   * @param personalRecords - L'état actuel des records personnels
   * @returns Un booléen indiquant s'il s'agit d'un nouveau record
   */
  isNewRecord: (
    exerciseName: string,
    weight: number,
    reps: number,
    personalRecords: WorkoutState['personalRecords']
  ): boolean => {
    const key = `${exerciseName}_${reps}`;
    const currentRecord = personalRecords[key];
    
    // Si aucun record n'existe pour cette combinaison exercice/reps, c'est un nouveau record
    if (!currentRecord) {
      return true;
    }
    
    // Sinon, vérifier si le poids est plus élevé que le record actuel
    return weight > currentRecord.weight;
  },

  /**
   * Récupère le record personnel pour un exercice spécifique et un nombre de répétitions.
   * @param exerciseName - Le nom de l'exercice
   * @param reps - Le nombre de répétitions (optionnel)
   * @param personalRecords - L'état actuel des records personnels
   * @returns Le record personnel ou null s'il n'existe pas
   */
  getRecordForExercise: (
    exerciseName: string,
    reps: number | undefined,
    personalRecords: WorkoutState['personalRecords']
  ) => {
    // Si les répétitions sont spécifiées, chercher le record spécifique
    if (reps !== undefined) {
      const key = `${exerciseName}_${reps}`;
      return personalRecords[key] || null;
    }
    
    // Sinon, trouver le record avec le poids le plus élevé parmi toutes les répétitions
    const records = Object.entries(personalRecords)
      .filter(([key]) => key.startsWith(`${exerciseName}_`))
      .map(([_, record]) => record);
    
    if (records.length === 0) {
      return null;
    }
    
    // Trier par poids (du plus lourd au plus léger)
    return records.sort((a, b) => b.weight - a.weight)[0];
  },

  /**
   * Récupère tous les records personnels pour un exercice donné.
   * @param exerciseName - Le nom de l'exercice
   * @param personalRecords - L'état actuel des records personnels
   * @returns Un tableau de tous les records personnels pour cet exercice
   */
  getAllRecordsForExercise: (
    exerciseName: string,
    personalRecords: WorkoutState['personalRecords']
  ) => {
    return Object.entries(personalRecords)
      .filter(([key]) => key.startsWith(`${exerciseName}_`))
      .map(([key, record]) => ({
        ...record,
        reps: parseInt(key.split('_')[1]),
      }))
      .sort((a, b) => b.weight - a.weight);
  },

  /**
   * Met à jour les records personnels lors de la complétion d'un exercise.
   * @param exercise - L'exercice complété
   * @param personalRecords - L'état actuel des records personnels
   * @param date - La date de l'entraînement
   * @returns Les records personnels mis à jour
   */
  updateRecords: (
    exercise: {
      id: string;
      name: string;
      sets: Array<{ weight: number; reps: number; completed: boolean }>;
    },
    personalRecords: WorkoutState['personalRecords'],
    date: string
  ): WorkoutState['personalRecords'] => {
    const newRecords = { ...personalRecords };
    
    // Parcourir tous les sets complétés
    exercise.sets.forEach(set => {
      if (set.completed && set.weight > 0 && set.reps > 0) {
        const key = `${exercise.name}_${set.reps}`;
        const currentRecord = newRecords[key];
        
        // Vérifier si c'est un nouveau record
        if (!currentRecord || set.weight > currentRecord.weight) {
          newRecords[key] = {
            weight: set.weight,
            reps: set.reps,
            date,
          };
        }
      }
    });
    
    // Sauvegarder les records mis à jour
    StorageService.savePersonalRecords(newRecords);
    
    return newRecords;
  },

  /**
   * Récupère les records personnels pour chaque catégorie d'exercice.
   * @param personalRecords - L'état actuel des records personnels
   * @returns Un objet contenant les records regroupés par catégorie
   */
  getRecordsByCategory: (personalRecords: WorkoutState['personalRecords']) => {
    const categories: {
      [category: string]: Array<{
        exerciseName: string;
        weight: number;
        reps: number;
        date: string;
      }>;
    } = {
      'Poitrine': [],
      'Dos': [],
      'Jambes': [],
      'Épaules': [],
      'Bras': [],
      'Autre': []
    };

    // Fonction pour déterminer la catégorie de l'exercice en fonction de son nom
    const getCategoryForExerciseName = (name: string): string => {
      const nameLower = name.toLowerCase();
      
      if (nameLower.includes('bench') || nameLower.includes('chest') || nameLower.includes('pec') || nameLower.includes('poitrine')) {
        return 'Poitrine';
      } else if (nameLower.includes('back') || nameLower.includes('row') || nameLower.includes('pull') || nameLower.includes('dos')) {
        return 'Dos';
      } else if (nameLower.includes('leg') || nameLower.includes('squat') || nameLower.includes('jambe') || nameLower.includes('cuisse')) {
        return 'Jambes';
      } else if (nameLower.includes('shoulder') || nameLower.includes('press') || nameLower.includes('épaule') || nameLower.includes('delto')) {
        return 'Épaules';
      } else if (nameLower.includes('arm') || nameLower.includes('curl') || nameLower.includes('tricep') || nameLower.includes('bicep')) {
        return 'Bras';
      } else {
        return 'Autre';
      }
    };

    // Remplir les catégories avec les records correspondants
    Object.entries(personalRecords).forEach(([key, record]) => {
      // Extraire le nom de l'exercice à partir de la clé (format "exercice_reps")
      const exerciseName = key.split('_')[0];
      
      const category = getCategoryForExerciseName(exerciseName);
      
      categories[category].push({
        exerciseName,
        weight: record.weight,
        reps: record.reps,
        date: record.date
      });
    });

    // Trier les records par poids dans chaque catégorie (du plus lourd au plus léger)
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => b.weight - a.weight);
    });

    return categories;
  }
}; 