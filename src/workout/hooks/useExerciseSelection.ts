import { useState, useCallback, useMemo } from 'react';
import { Exercise } from '../../types/workout';
import { SAMPLE_EXERCISES } from '../components/ExerciseSelectionModal';

// Interface pour les modes de sélection
export type ExerciseSelectionMode = 'workout' | 'exercise-selection' | 'exercise-tracking' | 'exercise-replacement';

// Interface pour le retour du hook
export interface UseExerciseSelectionReturn {
  // États de la sélection
  searchQuery: string;
  selectedExercises: Exercise[];
  selectedTags: string[];
  exerciseToReplaceId: string | null;
  modalMode: ExerciseSelectionMode;
  
  // Exercises filtrés et groupés
  filteredExercises: Exercise[];
  groupedExercises: { letter: string; data: Exercise[] }[];
  allTags: string[];
  
  // Actions de sélection
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setModalMode: (mode: ExerciseSelectionMode) => void;
  toggleExerciseSelection: (exercise: Exercise) => void;
  clearSelection: () => void;
  
  // Actions pour les modes
  startExerciseSelection: () => void;
  startExerciseReplacement: (exerciseId: string) => void;
  resetToWorkoutMode: () => void;
  
  // Helpers
  hasSelectedExercises: boolean;
  getFilterButtonText: () => string;
  canConfirmSelection: boolean;
}

/**
 * Hook pour gérer la sélection et le filtrage d'exercices
 * 
 * Responsabilités :
 * - Gestion des modes de sélection (workout, exercise-selection, exercise-replacement)
 * - Filtrage des exercices par texte et tags
 * - Sélection multiple d'exercices
 * - Groupement alphabétique des exercices
 */
export const useExerciseSelection = (): UseExerciseSelectionReturn => {
  // États de base
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [exerciseToReplaceId, setExerciseToReplaceId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ExerciseSelectionMode>('workout');
  
  // Filtrage des exercices par recherche et tags
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim() && selectedTags.length === 0) {
      return SAMPLE_EXERCISES;
    }
    
    return SAMPLE_EXERCISES.filter(exercise => {
      // Filtre par texte de recherche
      const matchesQuery = !searchQuery.trim() || 
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtre par tags
      const matchesTags = selectedTags.length === 0 || 
        (exercise.tags && exercise.tags.some(tag => selectedTags.includes(tag)));
      
      return matchesQuery && matchesTags;
    });
  }, [searchQuery, selectedTags]);
  
  // Groupement alphabétique des exercices
  const groupedExercises = useMemo(() => {
    const sorted = [...filteredExercises].sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    
    const groups: Record<string, Exercise[]> = {};
    
    sorted.forEach(exercise => {
      const firstLetter = exercise.name.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(exercise);
    });
    
    return Object.entries(groups).map(([letter, exercises]) => ({
      letter,
      data: exercises
    }));
  }, [filteredExercises]);
  
  // Génération de tous les tags disponibles
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    
    // Ajouter les catégories de base (Upper/Lower Body)
    tagSet.add("Upper Body");
    tagSet.add("Lower Body");
    
    // Ajouter les groupes musculaires principaux
    const muscleGroups = [
      "Chest", "Back", "Shoulders", "Biceps", "Triceps", 
      "Abs", "Quads", "Hamstrings", "Glutes", "Calves"
    ];
    
    muscleGroups.forEach(muscle => tagSet.add(muscle));
    
    // Ajouter les tags des exercices échantillons
    SAMPLE_EXERCISES.forEach(exercise => {
      if (exercise.tags) {
        exercise.tags.forEach(tag => tagSet.add(tag));
      }
    });
    
    return Array.from(tagSet).sort();
  }, []);
  
  // Toggle de sélection d'exercice
  const toggleExerciseSelection = useCallback((exercise: Exercise) => {
    if (modalMode === 'exercise-replacement') {
      // En mode remplacement, on ne peut sélectionner qu'un seul exercice
      setSelectedExercises([exercise]);
    } else {
      // En mode ajout, on peut sélectionner plusieurs exercices
      setSelectedExercises(prev => {
        const alreadySelected = prev.some(ex => ex.id === exercise.id);
        
        if (alreadySelected) {
          return prev.filter(ex => ex.id !== exercise.id);
        } else {
          return [...prev, exercise];
        }
      });
    }
  }, [modalMode]);
  
  // Nettoyer la sélection
  const clearSelection = useCallback(() => {
    setSearchQuery('');
    setSelectedExercises([]);
    setSelectedTags([]);
    setExerciseToReplaceId(null);
  }, []);
  
  // Démarrer la sélection d'exercices
  const startExerciseSelection = useCallback(() => {
    setModalMode('exercise-selection');
    clearSelection();
  }, [clearSelection]);
  
  // Démarrer le remplacement d'exercice
  const startExerciseReplacement = useCallback((exerciseId: string) => {
    setExerciseToReplaceId(exerciseId);
    setModalMode('exercise-replacement');
    setSearchQuery('');
    setSelectedExercises([]);
    setSelectedTags([]);
  }, []);
  
  // Retourner au mode workout
  const resetToWorkoutMode = useCallback(() => {
    setModalMode('workout');
    setExerciseToReplaceId(null);
  }, []);
  
  // Helpers
  const hasSelectedExercises = selectedExercises.length > 0;
  const canConfirmSelection = hasSelectedExercises;
  
  // Fonction pour obtenir le texte du bouton de filtre
  const getFilterButtonText = useCallback(() => {
    if (selectedTags.length === 0) {
      return "Filter by";
    } else if (selectedTags.length === 1) {
      return selectedTags[0];
    } else {
      return `${selectedTags.length} filters`;
    }
  }, [selectedTags]);
  
  return {
    // États
    searchQuery,
    selectedExercises,
    selectedTags,
    exerciseToReplaceId,
    modalMode,
    
    // Exercices filtrés
    filteredExercises,
    groupedExercises,
    allTags,
    
    // Actions
    setSearchQuery,
    setSelectedTags,
    setModalMode,
    toggleExerciseSelection,
    clearSelection,
    
    // Actions pour les modes
    startExerciseSelection,
    startExerciseReplacement,
    resetToWorkoutMode,
    
    // Helpers
    hasSelectedExercises,
    getFilterButtonText,
    canConfirmSelection
  };
};
