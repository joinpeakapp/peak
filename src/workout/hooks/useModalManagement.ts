import { useState, useCallback } from 'react';
import { Exercise } from '../../types/workout';

// Interface pour le retour du hook
export interface UseModalManagementReturn {
  // États des modales
  isExerciseSettingsVisible: boolean;
  isFilterModalVisible: boolean;
  isFinishModalVisible: boolean;
  settingsModalVisible: boolean;
  isWorkoutEditModalVisible: boolean;
  
  // État de l'exercice sélectionné
  selectedExerciseId: string | null;
  
  // États temporaires
  currentExercise: Exercise | undefined;
  openTimerDirectly: boolean;
  
  // Actions pour les modales principales
  showExerciseSettings: () => void;
  hideExerciseSettings: () => void;
  showFilterModal: () => void;
  hideFilterModal: () => void;
  showFinishModal: () => void;
  hideFinishModal: () => void;
  showWorkoutEditModal: () => void;
  hideWorkoutEditModal: () => void;
  
  // Actions pour la modale de paramètres d'exercice
  showExerciseSettingsModal: (exercise: Exercise, openTimer?: boolean) => void;
  hideExerciseSettingsModal: () => void;
  
  // Actions pour la sélection d'exercice
  selectExercise: (exerciseId: string) => void;
  clearSelectedExercise: () => void;
  
  // Actions utilitaires
  closeAllModals: () => void;
  resetModalStates: () => void;
}

/**
 * Hook pour gérer l'état de toutes les modales du WorkoutDetailModal
 * 
 * Responsabilités :
 * - Gestion de l'ouverture/fermeture des modales
 * - Gestion de l'exercice sélectionné pour le tracking
 * - Gestion des états temporaires pour les modales
 * - Coordination entre les différentes modales
 */
export const useModalManagement = (): UseModalManagementReturn => {
  console.log('[useModalManagement] Hook initialized');
  
  // États des modales principales
  const [isExerciseSettingsVisible, setIsExerciseSettingsVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isFinishModalVisible, setIsFinishModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [isWorkoutEditModalVisible, setIsWorkoutEditModalVisible] = useState(false);
  
  // État de l'exercice sélectionné
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  
  // États temporaires
  const [currentExercise, setCurrentExercise] = useState<Exercise | undefined>(undefined);
  const [openTimerDirectly, setOpenTimerDirectly] = useState(false);
  
  // Actions pour les modales principales
  const showExerciseSettings = useCallback(() => {
    console.log('[useModalManagement] Showing exercise settings');
    setIsExerciseSettingsVisible(true);
  }, []);
  
  const hideExerciseSettings = useCallback(() => {
    console.log('[useModalManagement] Hiding exercise settings');
    setIsExerciseSettingsVisible(false);
  }, []);
  
  const showFilterModal = useCallback(() => {
    console.log('[useModalManagement] Showing filter modal');
    setIsFilterModalVisible(true);
  }, []);
  
  const hideFilterModal = useCallback(() => {
    console.log('[useModalManagement] Hiding filter modal');
    setIsFilterModalVisible(false);
  }, []);
  
  const showFinishModal = useCallback(() => {
    console.log('[useModalManagement] Showing finish modal');
    setIsFinishModalVisible(true);
  }, []);
  
  const hideFinishModal = useCallback(() => {
    console.log('[useModalManagement] Hiding finish modal');
    setIsFinishModalVisible(false);
  }, []);
  
  const showWorkoutEditModal = useCallback(() => {
    console.log('[useModalManagement] Showing workout edit modal');
    setIsWorkoutEditModalVisible(true);
  }, []);
  
  const hideWorkoutEditModal = useCallback(() => {
    console.log('[useModalManagement] Hiding workout edit modal');
    setIsWorkoutEditModalVisible(false);
  }, []);
  
  // Actions pour la modale de paramètres d'exercice avec exercice et timer
  const showExerciseSettingsModal = useCallback((exercise: Exercise, openTimer: boolean = false) => {
    console.log(`[useModalManagement] Showing exercise settings modal for: ${exercise?.name || 'undefined'}, openTimer: ${openTimer}`);
    setCurrentExercise(exercise);
    setOpenTimerDirectly(openTimer);
    setSettingsModalVisible(true);
  }, []);
  
  const hideExerciseSettingsModal = useCallback(() => {
    console.log('[useModalManagement] Hiding exercise settings modal');
    setSettingsModalVisible(false);
    setCurrentExercise(undefined);
    setOpenTimerDirectly(false);
  }, []);
  
  // Actions pour la sélection d'exercice
  const selectExercise = useCallback((exerciseId: string) => {
    console.log(`[useModalManagement] Selecting exercise: ${exerciseId}`);
    setSelectedExerciseId(exerciseId);
  }, []);
  
  const clearSelectedExercise = useCallback(() => {
    console.log('[useModalManagement] Clearing selected exercise');
    setSelectedExerciseId(null);
  }, []);
  
  // Fermer toutes les modales
  const closeAllModals = useCallback(() => {
    console.log('[useModalManagement] Closing all modals');
    setIsExerciseSettingsVisible(false);
    setIsFilterModalVisible(false);
    setIsFinishModalVisible(false);
    setSettingsModalVisible(false);
    setIsWorkoutEditModalVisible(false);
    setCurrentExercise(undefined);
    setOpenTimerDirectly(false);
  }, []);
  
  // Réinitialiser tous les états
  const resetModalStates = useCallback(() => {
    console.log('[useModalManagement] Resetting all modal states');
    closeAllModals();
    setSelectedExerciseId(null);
  }, [closeAllModals]);
  
  return {
    // États des modales
    isExerciseSettingsVisible,
    isFilterModalVisible,
    isFinishModalVisible,
    settingsModalVisible,
    isWorkoutEditModalVisible,
    
    // État de l'exercice sélectionné
    selectedExerciseId,
    
    // États temporaires
    currentExercise,
    openTimerDirectly,
    
    // Actions pour les modales principales
    showExerciseSettings,
    hideExerciseSettings,
    showFilterModal,
    hideFilterModal,
    showFinishModal,
    hideFinishModal,
    showWorkoutEditModal,
    hideWorkoutEditModal,
    
    // Actions pour la modale de paramètres d'exercice
    showExerciseSettingsModal,
    hideExerciseSettingsModal,
    
    // Actions pour la sélection d'exercice
    selectExercise,
    clearSelectedExercise,
    
    // Actions utilitaires
    closeAllModals,
    resetModalStates
  };
};
