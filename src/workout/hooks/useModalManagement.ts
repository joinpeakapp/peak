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
  isRepositionModalVisible: boolean;
  
  // État de l'exercice sélectionné
  selectedExerciseId: string | null;
  
  // États temporaires
  currentExercise: Exercise | undefined;
  openTimerDirectly: boolean;
  exerciseToReposition: Exercise | null;
  
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
  
  // Actions pour la modale de repositionnement
  showRepositionModal: (exercise: Exercise) => void;
  hideRepositionModal: () => void;
  
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
  // États des modales principales
  const [isExerciseSettingsVisible, setIsExerciseSettingsVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isFinishModalVisible, setIsFinishModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [isWorkoutEditModalVisible, setIsWorkoutEditModalVisible] = useState(false);
  const [isRepositionModalVisible, setIsRepositionModalVisible] = useState(false);
  
  // État de l'exercice sélectionné
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  
  // États temporaires
  const [currentExercise, setCurrentExercise] = useState<Exercise | undefined>(undefined);
  const [openTimerDirectly, setOpenTimerDirectly] = useState(false);
  const [exerciseToReposition, setExerciseToReposition] = useState<Exercise | null>(null);
  
  // Actions pour les modales principales
  const showExerciseSettings = useCallback(() => {
    setIsExerciseSettingsVisible(true);
  }, []);
  
  const hideExerciseSettings = useCallback(() => {
    setIsExerciseSettingsVisible(false);
  }, []);
  
  const showFilterModal = useCallback(() => {
    setIsFilterModalVisible(true);
  }, []);
  
  const hideFilterModal = useCallback(() => {
    setIsFilterModalVisible(false);
  }, []);
  
  const showFinishModal = useCallback(() => {
    setIsFinishModalVisible(true);
  }, []);
  
  const hideFinishModal = useCallback(() => {
    setIsFinishModalVisible(false);
  }, []);
  
  const showWorkoutEditModal = useCallback(() => {
    setIsWorkoutEditModalVisible(true);
  }, []);
  
  const hideWorkoutEditModal = useCallback(() => {
    setIsWorkoutEditModalVisible(false);
  }, []);
  
  // Actions pour la modale de paramètres d'exercice avec exercice et timer
  const showExerciseSettingsModal = useCallback((exercise: Exercise, openTimer: boolean = false) => {
    setCurrentExercise(exercise);
    setOpenTimerDirectly(openTimer);
    setSettingsModalVisible(true);
  }, []);
  
  const hideExerciseSettingsModal = useCallback(() => {
    setSettingsModalVisible(false);
    setCurrentExercise(undefined);
    setOpenTimerDirectly(false);
  }, []);
  
  // Actions pour la modale de repositionnement
  const showRepositionModal = useCallback((exercise: Exercise) => {
    setExerciseToReposition(exercise);
    setIsRepositionModalVisible(true);
  }, []);
  
  const hideRepositionModal = useCallback(() => {
    setIsRepositionModalVisible(false);
    setExerciseToReposition(null);
  }, []);
  
  // Actions pour la sélection d'exercice
  const selectExercise = useCallback((exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
  }, []);
  
  const clearSelectedExercise = useCallback(() => {
    setSelectedExerciseId(null);
  }, []);
  
  // Fermer toutes les modales
  const closeAllModals = useCallback(() => {
    setIsExerciseSettingsVisible(false);
    setIsFilterModalVisible(false);
    setIsFinishModalVisible(false);
    setSettingsModalVisible(false);
    setIsWorkoutEditModalVisible(false);
    setIsRepositionModalVisible(false);
    setCurrentExercise(undefined);
    setOpenTimerDirectly(false);
    setExerciseToReposition(null);
  }, []);
  
  // Réinitialiser tous les états
  const resetModalStates = useCallback(() => {
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
    isRepositionModalVisible,
    
    // État de l'exercice sélectionné
    selectedExerciseId,
    
    // États temporaires
    currentExercise,
    openTimerDirectly,
    exerciseToReposition,
    
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
    
    // Actions pour la modale de repositionnement
    showRepositionModal,
    hideRepositionModal,
    
    // Actions pour la sélection d'exercice
    selectExercise,
    clearSelectedExercise,
    
    // Actions utilitaires
    closeAllModals,
    resetModalStates
  };
};
