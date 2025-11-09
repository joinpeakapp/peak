import { useState, useCallback, useRef, useEffect } from 'react';
import { PersonalRecords } from '../../types/workout';
import { PersonalRecordService } from '../../services/personalRecordService';

// Types pour les résultats de Personal Records
export interface PRResult {
  setIndex: number;
  weightPR?: { isNew: boolean; weight: number } | null;
  repsPR?: { isNew: boolean; weight: number; reps: number; previousReps: number } | null;
}

export interface ExercisePRResults {
  [exerciseId: string]: PRResult;
}

// Interface pour le hook
export interface UseWorkoutSessionReturn {
  // États
  originalRecords: PersonalRecords;
  currentSessionMaxWeights: { [exerciseName: string]: number };
  prResults: PRResult | null;
  exercisePRResults: ExercisePRResults;
  
  // Actions de gestion des records
  setOriginalRecords: (records: PersonalRecords) => void;
  initializeSession: (records: PersonalRecords) => void;
  clearSession: () => void;
  
  // Fonctions de vérification des PRs
  checkOriginalWeightPR: (exerciseName: string, weight: number) => { isNew: boolean; weight: number } | null;
  checkOriginalRepsPR: (exerciseName: string, weight: number, reps: number) => { isNew: boolean; weight: number; reps: number; previousReps: number } | null;
  checkSessionWeightPR: (exerciseName: string, weight: number) => { isNew: boolean; weight: number } | null;
  
  // Actions sécurisées pour mettre à jour l'état
  safeUpdateSessionWeight: (exerciseName: string, weight: number) => void;
  safeSetPrResults: (data: PRResult | null) => void;
  safeSetExercisePRResults: (exerciseId: string, setIndex: number, data: PRResult | null) => void;
  
  // Utilitaires
  resetExercisePRResults: () => void;
  clearExercisePRs: (exerciseId: string) => void;
  resetSessionMaxWeights: () => void;
  
  // Fonctions de synchronisation des records
  updateOriginalRecordsForExercise: (exerciseName: string) => Promise<void>;
  syncOriginalRecordsWithExercises: (exerciseNames: string[]) => Promise<void>;
}

/**
 * Hook pour gérer la session d'entraînement et les Personal Records
 * 
 * Responsabilités :
 * - Gestion des records originaux (capture au début de la séance)
 * - Suivi des records maximaux atteints pendant la séance
 * - Détection et validation des nouveaux PRs
 * - Gestion sécurisée de l'état pour éviter les memory leaks
 */
export const useWorkoutSession = (): UseWorkoutSessionReturn => {
  // État pour les records originaux (capturés au début de la séance)
  const [originalRecords, setOriginalRecordsState] = useState<PersonalRecords>({});
  
  // État pour suivre les records maximaux atteints pendant la séance en cours
  // Seuls les PR de poids tiendront compte de cet état (les PR de répétitions utilisent toujours originalRecords)
  const [currentSessionMaxWeights, setCurrentSessionMaxWeights] = useState<{ [exerciseName: string]: number }>({});
  
  // État pour les PR de la série actuellement affichée
  const [prResults, setPrResults] = useState<PRResult | null>(null);
  
  // État pour stocker les PR par exercice et par série
  const [exercisePRResults, setExercisePRResults] = useState<ExercisePRResults>({});
  
  // Référence pour vérifier si le composant est toujours monté
  const isMounted = useRef(true);
  
  // Effet pour gérer le cycle de vie du hook
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Action pour définir les records originaux
  const setOriginalRecords = useCallback((records: PersonalRecords) => {
    if (isMounted.current) {
      setOriginalRecordsState(records);
    }
  }, []);
  
  // Initialiser une nouvelle session d'entraînement
  const initializeSession = useCallback((records: PersonalRecords) => {
    if (isMounted.current) {
      console.log('[useWorkoutSession] Initializing session with records:', Object.keys(records));
      setOriginalRecordsState(records);
      setCurrentSessionMaxWeights({});
      setPrResults(null);
      setExercisePRResults({});
    }
  }, []);
  
  // Nettoyer la session (appelé à la fin d'un workout ou à l'annulation)
  const clearSession = useCallback(() => {
    if (isMounted.current) {
      console.log('[useWorkoutSession] Clearing session');
      setCurrentSessionMaxWeights({});
      setPrResults(null);
      setExercisePRResults({});
    }
  }, []);
  
  // Fonction pour vérifier les PR de poids par rapport aux records originaux
  const checkOriginalWeightPR = useCallback(
    (exerciseName: string, weight: number) => {
      // 🔧 CORRECTIF ROBUSTE : Vérifier que les paramètres sont valides
      if (!exerciseName || weight <= 0) {
        return null;
      }
      
      // Utiliser le service pour vérifier les PRs
      // Le service gère déjà le cas où l'exercice n'est pas dans les records
      return PersonalRecordService.checkWeightPR(exerciseName, weight, originalRecords);
    },
    [originalRecords]
  );
  
  // Fonction pour vérifier les PR de répétitions par rapport aux records originaux
  const checkOriginalRepsPR = useCallback(
    (exerciseName: string, weight: number, reps: number) => {
      // 🔧 CORRECTIF ROBUSTE : Vérifier que les paramètres sont valides
      if (!exerciseName || weight <= 0 || reps <= 0) {
        return null;
      }
      
      // Si l'exercice n'est pas dans originalRecords, pas de PR de répétitions
      // (car il n'y a pas de record précédent pour comparer)
      if (!originalRecords[exerciseName]) {
        return null;
      }
      
      return PersonalRecordService.checkRepsPR(exerciseName, weight, reps, originalRecords);
    },
    [originalRecords]
  );
  
  // Fonction pour vérifier les PR de poids en tenant compte du poids maximum de la séance actuelle
  const checkSessionWeightPR = useCallback(
    (exerciseName: string, weight: number) => {
      // 🔧 CORRECTIF ROBUSTE : Vérifier que les paramètres sont valides
      if (!exerciseName || weight <= 0) {
        return null;
      }
      
      // Récupérer le record original et le record de séance
      const originalRecord = originalRecords[exerciseName]?.maxWeight || 0;
      const sessionRecord = currentSessionMaxWeights[exerciseName] || originalRecord;
      
      // Un PR de poids est détecté si:
      // 1. Le poids est supérieur au record original ET
      // 2. Le poids est supérieur au record de séance actuel
      if (weight > originalRecord && weight > sessionRecord) {
        console.log(`[checkSessionWeightPR] ✅ NEW PR detected for ${exerciseName}: ${weight}kg > ${Math.max(originalRecord, sessionRecord)}kg`);
        return {
          isNew: true,
          weight
        };
      }
      
      // Si l'exercice n'est pas dans originalRecords, vérifier avec le service
      // (le service gère le cas où c'est un nouvel exercice)
      if (!originalRecords[exerciseName]) {
        const weightPR = PersonalRecordService.checkWeightPR(exerciseName, weight, originalRecords);
        if (weightPR) {
          console.log(`[checkSessionWeightPR] ✅ NEW PR detected for new exercise ${exerciseName}: ${weight}kg`);
        }
        return weightPR;
      }
      
      return null;
    },
    [originalRecords, currentSessionMaxWeights]
  );
  
  // Fonction sécurisée pour mettre à jour les records de séance
  const safeUpdateSessionWeight = useCallback((exerciseName: string, weight: number) => {
    if (isMounted.current) {
      setCurrentSessionMaxWeights(prev => ({
        ...prev,
        [exerciseName]: weight
      }));
    }
  }, []);
  
  // Fonction sécurisée pour mettre à jour les PR results
  const safeSetPrResults = useCallback((data: PRResult | null) => {
    if (isMounted.current) {
      setPrResults(data);
    }
  }, []);
  
  // Fonction sécurisée pour mettre à jour les PR results par exercice
  const safeSetExercisePRResults = useCallback((exerciseId: string, setIndex: number, data: PRResult | null) => {
    if (isMounted.current) {
      const key = `${exerciseId}_set_${setIndex}`;
      setExercisePRResults(prev => {
        const newResults = { ...prev };
        if (data === null) {
          // Supprimer l'entrée si data est null
          delete newResults[key];
        } else {
          // Ajouter ou mettre à jour l'entrée
          newResults[key] = data;
        }
        return newResults;
      });
    }
  }, []);
  
  // Réinitialiser tous les PR des exercices
  const resetExercisePRResults = useCallback(() => {
    if (isMounted.current) {
      setExercisePRResults({});
    }
  }, []);
  
  // Nettoyer les PRs d'un exercice spécifique
  const clearExercisePRs = useCallback((exerciseId: string) => {
    if (isMounted.current) {
      setExercisePRResults(prev => {
        const newResults = { ...prev };
        // Supprimer toutes les entrées qui commencent par exerciseId_set_
        Object.keys(newResults).forEach(key => {
          if (key.startsWith(`${exerciseId}_set_`)) {
            delete newResults[key];
          }
        });
        return newResults;
      });
      console.log('[useWorkoutSession] Cleared PRs for exercise:', exerciseId);
    }
  }, []);
  
  // Réinitialiser les poids maximaux de la séance
  const resetSessionMaxWeights = useCallback(() => {
    if (isMounted.current) {
      setCurrentSessionMaxWeights({});
    }
  }, []);

  /**
   * Met à jour les originalRecords avec les records d'un exercice spécifique.
   * Utile lors du remplacement d'un exercice pendant une séance active.
   * Cette fonction fusionne les nouveaux records avec les records existants sans écraser les autres exercices.
   */
  const updateOriginalRecordsForExercise = useCallback(
    async (exerciseName: string) => {
      if (!isMounted.current) return;
      
      try {
        // Charger les records actuels depuis le service
        const currentRecords = await PersonalRecordService.loadRecords();
        
        // Si l'exercice a des records, les ajouter aux originalRecords
        if (currentRecords[exerciseName]) {
          setOriginalRecordsState(prev => ({
            ...prev,
            [exerciseName]: currentRecords[exerciseName]
          }));
          console.log(`[useWorkoutSession] Updated originalRecords for exercise: ${exerciseName}`);
        } else {
          // Si l'exercice n'a pas de records, initialiser une entrée vide pour éviter les faux PRs
          setOriginalRecordsState(prev => {
            if (!prev[exerciseName]) {
              return {
                ...prev,
                [exerciseName]: {
                  exerciseName,
                  maxWeight: 0,
                  maxWeightDate: '',
                  repsPerWeight: {}
                }
              };
            }
            return prev;
          });
          console.log(`[useWorkoutSession] Initialized empty records for new exercise: ${exerciseName}`);
        }
      } catch (error) {
        console.error(`[useWorkoutSession] Error updating originalRecords for ${exerciseName}:`, error);
      }
    },
    []
  );

  /**
   * Synchronise les originalRecords avec tous les exercices de la séance active.
   * S'assure que tous les exercices de la séance ont leurs records dans originalRecords.
   */
  const syncOriginalRecordsWithExercises = useCallback(
    async (exerciseNames: string[]) => {
      if (!isMounted.current) return;
      
      try {
        // Charger les records actuels depuis le service
        const currentRecords = await PersonalRecordService.loadRecords();
        
        setOriginalRecordsState(prev => {
          const updated = { ...prev };
          let hasChanges = false;
          
          // Pour chaque exercice de la séance
          exerciseNames.forEach(exerciseName => {
            if (currentRecords[exerciseName]) {
              // Si l'exercice a des records, les ajouter ou mettre à jour
              if (!updated[exerciseName] || 
                  JSON.stringify(updated[exerciseName]) !== JSON.stringify(currentRecords[exerciseName])) {
                updated[exerciseName] = currentRecords[exerciseName];
                hasChanges = true;
              }
            } else if (!updated[exerciseName]) {
              // Si l'exercice n'a pas de records et n'est pas dans originalRecords, initialiser une entrée vide
              updated[exerciseName] = {
                exerciseName,
                maxWeight: 0,
                maxWeightDate: '',
                repsPerWeight: {}
              };
              hasChanges = true;
            }
          });
          
          if (hasChanges) {
            console.log(`[useWorkoutSession] Synced originalRecords with ${exerciseNames.length} exercises`);
          }
          
          return updated;
        });
      } catch (error) {
        console.error('[useWorkoutSession] Error syncing originalRecords:', error);
      }
    },
    []
  );
  
  return {
    // États
    originalRecords,
    currentSessionMaxWeights,
    prResults,
    exercisePRResults,
    
    // Actions de gestion des records
    setOriginalRecords,
    initializeSession,
    clearSession,
    
    // Fonctions de vérification des PRs
    checkOriginalWeightPR,
    checkOriginalRepsPR,
    checkSessionWeightPR,
    
    // Actions sécurisées
    safeUpdateSessionWeight,
    safeSetPrResults,
    safeSetExercisePRResults,
    
    // Utilitaires
    resetExercisePRResults,
    clearExercisePRs,
    resetSessionMaxWeights,
    updateOriginalRecordsForExercise,
    syncOriginalRecordsWithExercises,
  };
};
