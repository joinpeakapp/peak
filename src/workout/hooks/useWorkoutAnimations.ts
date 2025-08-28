import { useState, useRef, useCallback } from 'react';
import { Animated, Vibration } from 'react-native';

// Interface pour le retour du hook
export interface UseWorkoutAnimationsReturn {
  // Références d'animation
  prBadgeAnim: Animated.Value;
  slideAnim: Animated.Value;
  
  // États des animations d'exercice
  exerciseProgressAnimations: { [key: string]: Animated.Value };
  exerciseBounceAnimations: { [key: string]: Animated.Value };
  
  // Actions d'animation
  animatePrBadge: () => void;
  animateSlideIn: () => void;
  animateSlideOut: () => void;
  initializeExerciseAnimations: (exercises: any[]) => void;
  animateExerciseProgress: (exerciseId: string, progress: number) => void;
  animateExerciseBounce: (exerciseId: string) => void;
  resetAllAnimations: () => void;
}

/**
 * Hook pour gérer toutes les animations du WorkoutDetailModal
 * 
 * Responsabilités :
 * - Gestion des animations du badge PR
 * - Gestion des animations de slide (modales)
 * - Gestion des animations de progression des exercices
 * - Gestion des animations de rebond des exercices
 * - Coordination et réinitialisation des animations
 */
export const useWorkoutAnimations = (): UseWorkoutAnimationsReturn => {
  console.log('[useWorkoutAnimations] Hook initialized');
  
  // Références d'animation principales
  const prBadgeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // États pour les animations des exercices
  const [exerciseProgressAnimations, setExerciseProgressAnimations] = useState<{ [key: string]: Animated.Value }>({});
  const [exerciseBounceAnimations, setExerciseBounceAnimations] = useState<{ [key: string]: Animated.Value }>({});
  
  // Animation du badge PR
  const animatePrBadge = useCallback(() => {
    console.log('[useWorkoutAnimations] Animating PR badge');
    
    // Vibration pour feedback tactile
    Vibration.vibrate(100);
    
    // Séquence d'animation du badge
    Animated.sequence([
      Animated.timing(prBadgeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(prBadgeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [prBadgeAnim]);
  
  // Animation de slide in (pour les modales)
  const animateSlideIn = useCallback(() => {
    console.log('[useWorkoutAnimations] Animating slide in');
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);
  
  // Animation de slide out (pour les modales)
  const animateSlideOut = useCallback(() => {
    console.log('[useWorkoutAnimations] Animating slide out');
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);
  
  // Initialiser les animations pour une liste d'exercices
  const initializeExerciseAnimations = useCallback((exercises: any[]) => {
    console.log(`[useWorkoutAnimations] Initializing animations for ${exercises.length} exercises`);
    
    const progressAnimations: { [key: string]: Animated.Value } = {};
    const bounceAnimations: { [key: string]: Animated.Value } = {};
    
    exercises.forEach(exercise => {
      if (exercise.id) {
        progressAnimations[exercise.id] = new Animated.Value(0);
        bounceAnimations[exercise.id] = new Animated.Value(1);
      }
    });
    
    setExerciseProgressAnimations(progressAnimations);
    setExerciseBounceAnimations(bounceAnimations);
  }, []);
  
  // Animer la progression d'un exercice
  const animateExerciseProgress = useCallback((exerciseId: string, progress: number) => {
    console.log(`[useWorkoutAnimations] Animating exercise progress: ${exerciseId} -> ${progress}%`);
    
    const animation = exerciseProgressAnimations[exerciseId];
    if (animation) {
      Animated.timing(animation, {
        toValue: progress / 100, // Convertir en valeur 0-1
        duration: 500,
        useNativeDriver: false, // Nécessaire pour les transformations de layout
      }).start();
    }
  }, [exerciseProgressAnimations]);
  
  // Animer le rebond d'un exercice
  const animateExerciseBounce = useCallback((exerciseId: string) => {
    console.log(`[useWorkoutAnimations] Animating exercise bounce: ${exerciseId}`);
    
    const animation = exerciseBounceAnimations[exerciseId];
    if (animation) {
      // Vibration légère pour feedback
      Vibration.vibrate(50);
      
      // Animation de rebond
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [exerciseBounceAnimations]);
  
  // Réinitialiser toutes les animations
  const resetAllAnimations = useCallback(() => {
    console.log('[useWorkoutAnimations] Resetting all animations');
    
    // Réinitialiser les animations principales
    prBadgeAnim.setValue(0);
    slideAnim.setValue(0);
    
    // Réinitialiser les animations d'exercice
    Object.values(exerciseProgressAnimations).forEach(animation => {
      animation.setValue(0);
    });
    
    Object.values(exerciseBounceAnimations).forEach(animation => {
      animation.setValue(1);
    });
    
    // Vider les états
    setExerciseProgressAnimations({});
    setExerciseBounceAnimations({});
  }, [prBadgeAnim, slideAnim, exerciseProgressAnimations, exerciseBounceAnimations]);
  
  return {
    // Références d'animation
    prBadgeAnim,
    slideAnim,
    
    // États des animations d'exercice
    exerciseProgressAnimations,
    exerciseBounceAnimations,
    
    // Actions d'animation
    animatePrBadge,
    animateSlideIn,
    animateSlideOut,
    initializeExerciseAnimations,
    animateExerciseProgress,
    animateExerciseBounce,
    resetAllAnimations
  };
};
