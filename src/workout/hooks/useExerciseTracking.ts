import { useState, useCallback, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { TrackingSet } from '../contexts/ActiveWorkoutContext';
import { Exercise } from '../../types/workout';

// Interface pour les animations des sets
export interface SetAnimations {
  [index: number]: Animated.Value;
}

// Interface pour les checkmarks complétés
export interface CompletedCheckmarks {
  [exerciseId: string]: boolean;
}

// Interface pour le retour du hook
export interface UseExerciseTrackingReturn {
  // États des sets
  exerciseSets: TrackingSet[];
  hasUnsavedChanges: boolean;
  completedCheckmarks: CompletedCheckmarks;
  setAnimations: SetAnimations;
  
  // Actions de gestion des sets
  initializeSets: (sets: TrackingSet[]) => void;
  updateSet: (index: number, field: 'weight' | 'reps', value: string) => void;
  toggleSetCompletion: (index: number) => { newSets: TrackingSet[], wasCompleted: boolean, isNowCompleted: boolean } | null;
  addSet: () => void;
  removeSet: (index: number) => void;
  
  // Actions de gestion des exercices
  markExerciseComplete: (exerciseId: string, isCompleted: boolean) => void;
  clearTracking: () => void;
  
  // Getters
  getCompletedSetsCount: () => number;
  getTotalSetsCount: () => number;
  getSetByIndex: (index: number) => TrackingSet | undefined;
  isSetCompleted: (index: number) => boolean;
  
  // Animations
  initializeSetAnimations: (setCount: number) => void;
  animateSet: (index: number) => void;
  getSetAnimation: (index: number) => Animated.Value;
}

/**
 * Hook pour gérer le tracking des exercices et des sets
 * 
 * Responsabilités :
 * - Gestion des sets d'un exercice (ajout, suppression, modification)
 * - Tracking de la complétion des sets et exercices
 * - Gestion des animations des sets
 * - Détection des changements non sauvegardés
 */
export const useExerciseTracking = (): UseExerciseTrackingReturn => {
  // États pour les sets de l'exercice en cours
  const [exerciseSets, setExerciseSets] = useState<TrackingSet[]>([]);
  
  // État pour les changements non sauvegardés
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // État pour les checkmarks d'exercices complétés
  const [completedCheckmarks, setCompletedCheckmarks] = useState<CompletedCheckmarks>({});
  
  // États pour les animations des sets
  const [setAnimations, setSetAnimations] = useState<SetAnimations>({});
  
  // Référence pour vérifier si le composant est toujours monté
  const isMounted = useRef(true);
  
  // Effet pour gérer le cycle de vie du hook
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      
      // Nettoyer les animations lors du démontage
      Object.values(setAnimations).forEach(animation => {
        if (animation) {
          animation.stopAnimation();
        }
      });
    };
  }, [setAnimations]);
  
  // Initialiser les sets d'un exercice
  const initializeSets = useCallback((sets: TrackingSet[]) => {
    if (isMounted.current) {
      console.log('[useExerciseTracking] Initializing sets:', sets.length);
      setExerciseSets(sets);
      setHasUnsavedChanges(false);
      
      // Initialiser les animations pour chaque set
      const animations: SetAnimations = {};
      sets.forEach((_, index) => {
        animations[index] = new Animated.Value(1);
      });
      setSetAnimations(animations);
    }
  }, []);
  
  // Mettre à jour un champ spécifique d'un set
  const updateSet = useCallback((index: number, field: 'weight' | 'reps', value: string) => {
    if (isMounted.current && index >= 0 && index < exerciseSets.length) {
      console.log(`[useExerciseTracking] Updating set ${index} ${field}:`, value);
      
      const newSets = [...exerciseSets];
      newSets[index] = {
        ...newSets[index],
        [field]: value
      };
      
      setExerciseSets(newSets);
      setHasUnsavedChanges(true);
    }
  }, [exerciseSets]);
  
  // Fonction pour animer un set
  const animateSet = useCallback((index: number) => {
    const animation = setAnimations[index];
    if (animation && isMounted.current) {
      try {
        // Réinitialiser l'animation si nécessaire
        animation.setValue(1);
        
        // Séquence d'animation de rebond
        Animated.sequence([
          // Réduire légèrement
          Animated.timing(animation, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: true,
          }),
          // Revenir à la taille normale
          Animated.timing(animation, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      } catch (error) {
        console.log('[useExerciseTracking] Animation error:', error);
      }
    }
  }, [setAnimations]);
  
  // Basculer la complétion d'un set
  const toggleSetCompletion = useCallback((index: number) => {
    if (isMounted.current && index >= 0 && index < exerciseSets.length) {
      console.log(`[useExerciseTracking] Toggling set ${index} completion`);
      
      // Animer le set
      animateSet(index);
      
      const newSets = [...exerciseSets];
      const wasCompleted = newSets[index].completed;
      const isNowCompleted = !wasCompleted;
      
      newSets[index] = {
        ...newSets[index],
        completed: isNowCompleted
      };
      
      setExerciseSets(newSets);
      setHasUnsavedChanges(true);
      
      console.log(`[useExerciseTracking] Set ${index} marked as ${isNowCompleted ? 'completed' : 'incomplete'}`);
      
      return { newSets, wasCompleted, isNowCompleted };
    }
    return null;
  }, [exerciseSets, animateSet]);
  
  // Ajouter un nouveau set
  const addSet = useCallback(() => {
    if (isMounted.current) {
      console.log('[useExerciseTracking] Adding new set');
      
      const newSet: TrackingSet = {
        completed: false,
        weight: '',
        reps: ''
      };
      
      const newSets = [...exerciseSets, newSet];
      const newIndex = newSets.length - 1;
      
      setExerciseSets(newSets);
      setHasUnsavedChanges(true);
      
      // Ajouter l'animation pour le nouveau set
      setSetAnimations(prev => ({
        ...prev,
        [newIndex]: new Animated.Value(1)
      }));
    }
  }, [exerciseSets]);
  
  // Supprimer un set
  const removeSet = useCallback((index: number) => {
    if (isMounted.current && index >= 0 && index < exerciseSets.length && exerciseSets.length > 1) {
      console.log(`[useExerciseTracking] Removing set ${index}`);
      
      const newSets = exerciseSets.filter((_, i) => i !== index);
      setExerciseSets(newSets);
      setHasUnsavedChanges(true);
      
      // Réorganiser les animations
      setSetAnimations(prev => {
        const newAnimations: SetAnimations = {};
        
        // Recréer les animations avec des indices corrects
        newSets.forEach((_, newIndex) => {
          if (newIndex < index) {
            // Les sets avant l'index supprimé gardent leur animation
            newAnimations[newIndex] = prev[newIndex] || new Animated.Value(1);
          } else {
            // Les sets après l'index supprimé sont décalés
            newAnimations[newIndex] = prev[newIndex + 1] || new Animated.Value(1);
          }
        });
        
        // Nettoyer l'animation supprimée
        if (prev[index]) {
          prev[index].stopAnimation();
        }
        
        return newAnimations;
      });
    }
  }, [exerciseSets]);
  
  // Marquer un exercice comme complété ou non
  const markExerciseComplete = useCallback((exerciseId: string, isCompleted: boolean) => {
    if (isMounted.current) {
      console.log(`[useExerciseTracking] Marking exercise ${exerciseId} as ${isCompleted ? 'completed' : 'incomplete'}`);
      
      setCompletedCheckmarks(prev => ({
        ...prev,
        [exerciseId]: isCompleted
      }));
    }
  }, []);
  
  // Nettoyer le tracking
  const clearTracking = useCallback(() => {
    if (isMounted.current) {
      console.log('[useExerciseTracking] Clearing tracking data');
      
      setExerciseSets([]);
      setHasUnsavedChanges(false);
      setCompletedCheckmarks({});
      
      // Nettoyer les animations
      Object.values(setAnimations).forEach(animation => {
        if (animation) {
          animation.stopAnimation();
        }
      });
      setSetAnimations({});
    }
  }, [setAnimations]);
  
  // Obtenir le nombre de sets complétés
  const getCompletedSetsCount = useCallback(() => {
    return exerciseSets.filter(set => set.completed).length;
  }, [exerciseSets]);
  
  // Obtenir le nombre total de sets
  const getTotalSetsCount = useCallback(() => {
    return exerciseSets.length;
  }, [exerciseSets]);
  
  // Obtenir un set par index
  const getSetByIndex = useCallback((index: number): TrackingSet | undefined => {
    return exerciseSets[index];
  }, [exerciseSets]);
  
  // Vérifier si un set est complété
  const isSetCompleted = useCallback((index: number): boolean => {
    const set = exerciseSets[index];
    return set?.completed || false;
  }, [exerciseSets]);
  
  // Initialiser les animations des sets
  const initializeSetAnimations = useCallback((setCount: number) => {
    if (isMounted.current) {
      const animations: SetAnimations = {};
      for (let i = 0; i < setCount; i++) {
        animations[i] = new Animated.Value(1);
      }
      setSetAnimations(animations);
    }
  }, []);
  
  // Obtenir une animation de set
  const getSetAnimation = useCallback((index: number): Animated.Value => {
    return setAnimations[index] || new Animated.Value(1);
  }, [setAnimations]);
  
  return {
    // États
    exerciseSets,
    hasUnsavedChanges,
    completedCheckmarks,
    setAnimations,
    
    // Actions de gestion des sets
    initializeSets,
    updateSet,
    toggleSetCompletion,
    addSet,
    removeSet,
    
    // Actions de gestion des exercices
    markExerciseComplete,
    clearTracking,
    
    // Getters
    getCompletedSetsCount,
    getTotalSetsCount,
    getSetByIndex,
    isSetCompleted,
    
    // Animations
    initializeSetAnimations,
    animateSet,
    getSetAnimation,
  };
};
