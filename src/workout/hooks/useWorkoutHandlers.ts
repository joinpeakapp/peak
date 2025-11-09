import { useState, useCallback } from 'react';
import { Alert, LayoutAnimation, UIManager, Platform } from 'react-native';
import { CommonActions, NavigationProp } from '@react-navigation/native';
import { Workout, Exercise, CompletedWorkout, TrackingSet, TrackingData } from '../../types/workout';
import { RootStackParamList, WorkoutStackParamList } from '../../types/navigation';
import CustomExerciseService from '../../services/customExerciseService';
import { StickerService } from '../../services/stickerService';
import { StreakService } from '../../services/streakService';
import { RobustStorageService } from '../../services/storage';
import { calculateStickerHistoricalData, calculatePersonalRecord } from '../utils/workoutUtils';

// Fonction pour générer un ID unique
const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 15);
};

interface UseWorkoutHandlersProps {
  // Workout data
  workout: Workout | null;
  exercises: Exercise[];
  setExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;
  
  // States
  originalWorkoutTemplate: Workout | null;
  setOriginalWorkoutTemplate: React.Dispatch<React.SetStateAction<Workout | null>>;
  exerciseCreationStep: 'name' | 'tracking' | 'categories';
  setExerciseCreationStep: React.Dispatch<React.SetStateAction<'name' | 'tracking' | 'categories'>>;
  exerciseCreationData: {
    name?: string;
    tracking?: 'trackedOnSets' | 'trackedOnTime';
    tags?: string[];
  };
  setExerciseCreationData: React.Dispatch<React.SetStateAction<{
    name?: string;
    tracking?: 'trackedOnSets' | 'trackedOnTime';
    tags?: string[];
  }>>;
  newlyCreatedExerciseId: string | null;
  setNewlyCreatedExerciseId: React.Dispatch<React.SetStateAction<string | null>>;
  libraryOptionsModalVisible: boolean;
  setLibraryOptionsModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  selectedLibraryExercise: Exercise | null;
  setSelectedLibraryExercise: React.Dispatch<React.SetStateAction<Exercise | null>>;
  isExerciseMenuVisible: boolean;
  setIsExerciseMenuVisible: React.Dispatch<React.SetStateAction<boolean>>;
  exerciseMenuAnchor: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  setExerciseMenuAnchor: React.Dispatch<React.SetStateAction<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>>;
  selectedExerciseForMenu: Exercise | null;
  setSelectedExerciseForMenu: React.Dispatch<React.SetStateAction<Exercise | null>>;
  
  // Hooks
  exerciseSelection: any;
  modalManagement: any;
  animations: any;
  exerciseTracking: any;
  workoutSession: any;
  personalRecords: any;
  
  // Contexts
  updateWorkout: (workout: Workout) => void;
  workouts: Workout[];
  activeWorkout: any;
  startWorkout: (workoutId: string, workoutName: string, exercises: Exercise[], initialTrackingData: TrackingData) => void;
  finishWorkout: (updateStreak: boolean) => Promise<void>;
  updateTrackingData: (exerciseId: string, sets: TrackingSet[], completedSets: number) => void;
  updateElapsedTime: (time: number) => void;
  isTrackingWorkout: boolean;
  setActiveWorkoutExercises: (exercises: Exercise[]) => void;
  startRestTimer: (exercise: Exercise) => void;
  stopTimer: () => void;
  getPreviousWorkoutData: (workoutId: string, exerciseName: string) => any;
  addCompletedWorkout: (completedWorkout: CompletedWorkout, workout: Workout) => Promise<void>;
  
  // Callbacks
  onClose: () => void;
  currentExercises: Exercise[];
  
  // Navigation
  navigation: NavigationProp<RootStackParamList | WorkoutStackParamList>;
}

export const useWorkoutHandlers = (props: UseWorkoutHandlersProps) => {
  const {
    workout,
    exercises,
    setExercises,
    originalWorkoutTemplate,
    setOriginalWorkoutTemplate,
    exerciseCreationStep,
    setExerciseCreationStep,
    exerciseCreationData,
    setExerciseCreationData,
    newlyCreatedExerciseId,
    setNewlyCreatedExerciseId,
    libraryOptionsModalVisible,
    setLibraryOptionsModalVisible,
    selectedLibraryExercise,
    setSelectedLibraryExercise,
    isExerciseMenuVisible,
    setIsExerciseMenuVisible,
    exerciseMenuAnchor,
    setExerciseMenuAnchor,
    selectedExerciseForMenu,
    setSelectedExerciseForMenu,
    exerciseSelection,
    modalManagement,
    animations,
    exerciseTracking,
    workoutSession,
    personalRecords,
    updateWorkout,
    workouts,
    activeWorkout,
    startWorkout,
    finishWorkout,
    updateTrackingData,
    updateElapsedTime,
    isTrackingWorkout,
    setActiveWorkoutExercises,
    startRestTimer,
    stopTimer,
    getPreviousWorkoutData,
    addCompletedWorkout,
    onClose,
    currentExercises,
    navigation,
  } = props;

  // Fonction pour sauvegarder les modifications
  const handleSaveChanges = useCallback(() => {
    if (!workout) return;
    
    const updatedWorkout = {
      ...workout,
      exercises: exercises,
      updatedAt: new Date().toISOString()
    };
    
    updateWorkout(updatedWorkout);
  }, [workout, exercises, updateWorkout]);

  // Fonction pour passer au mode de sélection d'exercices
  const handleAddExercise = useCallback(() => {
    exerciseSelection.startExerciseSelection();
  }, [exerciseSelection]);

  // Handlers pour le flow de création d'exercice
  const handleExerciseNameNext = useCallback((name: string) => {
    setExerciseCreationData(prev => ({ ...prev, name }));
    setExerciseCreationStep('tracking');
  }, [setExerciseCreationData, setExerciseCreationStep]);

  const handleExerciseTrackingNext = useCallback((tracking: 'trackedOnSets' | 'trackedOnTime') => {
    setExerciseCreationData(prev => ({ ...prev, tracking }));
    setExerciseCreationStep('categories');
  }, [setExerciseCreationData, setExerciseCreationStep]);

  const handleExerciseTrackingBack = useCallback(() => {
    setExerciseCreationStep('name');
  }, [setExerciseCreationStep]);

  const handleExerciseCategoriesComplete = useCallback(async (tags: string[]) => {
    try {
      const { name, tracking } = exerciseCreationData;
      
      if (!name || !tracking) {
        throw new Error('Missing exercise data');
      }

      const newExercise = await CustomExerciseService.createCustomExercise(
        name,
        tags,
        tracking
      );
      
      console.log('[WorkoutDetailModal] Exercise created:', newExercise.name, newExercise.id);
      
      // Recharger la liste des exercices personnalisés dans le hook
      await exerciseSelection.reloadCustomExercises();
      
      // Reset et retourner au mode sélection d'exercices AVANT de sélectionner
      setExerciseCreationStep('name');
      setExerciseCreationData({});
      exerciseSelection.startExerciseSelection();
      
      // Convertir l'exercice personnalisé en Exercise pour la sélection
      const exerciseForSelection = CustomExerciseService.convertToExercise(newExercise);
      
      // Attendre un court instant pour que le mode soit bien changé
      setTimeout(() => {
        // Sélectionner automatiquement l'exercice nouvellement créé
        console.log('[WorkoutDetailModal] Auto-selecting exercise:', exerciseForSelection.name);
        exerciseSelection.toggleExerciseSelection(exerciseForSelection);
        
        // Stocker l'ID du nouvel exercice pour le highlight
        setNewlyCreatedExerciseId(newExercise.id);
        
        // Supprimer le highlight après 3 secondes
        setTimeout(() => {
          setNewlyCreatedExerciseId(null);
        }, 3000);
      }, 100);
      
      Alert.alert('Success', `Exercise "${name}" created successfully! It has been selected for you.`);
    } catch (error: any) {
      console.error('[WorkoutDetailModal] Error creating exercise:', error);
      Alert.alert('Error', error.message || 'Failed to create exercise');
    }
  }, [exerciseCreationData, exerciseSelection, setExerciseCreationStep, setExerciseCreationData, setNewlyCreatedExerciseId]);

  const handleExerciseCategoriesBack = useCallback(() => {
    setExerciseCreationStep('tracking');
  }, [setExerciseCreationStep]);

  // Fonction pour annuler complètement la création d'exercice
  const handleCancelCreateExercise = useCallback(() => {
    setExerciseCreationStep('name');
    setExerciseCreationData({});
    exerciseSelection.startExerciseSelection();
  }, [setExerciseCreationStep, setExerciseCreationData, exerciseSelection]);

  // Fonction pour gérer le long press sur un exercice dans la bibliothèque
  const handleExerciseLongPress = useCallback((exercise: Exercise) => {
    console.log('[WorkoutDetailModal] Long press on exercise:', exercise.name);
    setSelectedLibraryExercise(exercise);
    setLibraryOptionsModalVisible(true);
  }, [setSelectedLibraryExercise, setLibraryOptionsModalVisible]);

  // Fonction pour vérifier si un exercice est personnalisé
  const isCustomExercise = useCallback((exercise: Exercise): boolean => {
    return exercise.id.startsWith('custom_');
  }, []);

  // Fonction pour supprimer un exercice de la bibliothèque
  const handleDeleteLibraryExercise = useCallback(async () => {
    if (!selectedLibraryExercise) return;

    try {
      console.log('[WorkoutDetailModal] Deleting exercise:', selectedLibraryExercise.name);
      await CustomExerciseService.deleteCustomExercise(selectedLibraryExercise.id);
      
      // Recharger la liste des exercices personnalisés
      await exerciseSelection.reloadCustomExercises();
      
      Alert.alert('Success', `Exercise "${selectedLibraryExercise.name}" deleted successfully.`);
      
      // Reset les états
      setLibraryOptionsModalVisible(false);
      setSelectedLibraryExercise(null);
    } catch (error: any) {
      console.error('[WorkoutDetailModal] Error deleting exercise:', error);
      Alert.alert('Error', error.message || 'Failed to delete exercise');
    }
  }, [selectedLibraryExercise, exerciseSelection, setLibraryOptionsModalVisible, setSelectedLibraryExercise]);

  // Fonction pour ajouter les exercices sélectionnés
  const handleExercisesSelected = useCallback(async () => {
    console.log('[WorkoutDetailModal] Adding exercises:', exerciseSelection.selectedExercises.length);
    // Ajouter seulement les exercices qui ne sont pas déjà présents dans le workout
    const newExercises = exerciseSelection.selectedExercises.filter(
      newEx => !exercises.some(existingEx => existingEx.id === newEx.id)
    );
    
    if (newExercises.length > 0) {
      const updatedExercises = [...exercises, ...newExercises];
      setExercises(updatedExercises);
      console.log('[WorkoutDetailModal] Updated exercises list with', updatedExercises.length, 'exercises');
      
      // Sauvegarder immédiatement le workout template
      if (workout) {
        const updatedWorkout = {
          ...workout,
          exercises: updatedExercises,
          updatedAt: new Date().toISOString()
        };
        updateWorkout(updatedWorkout);
        console.log('[WorkoutDetailModal] Saved workout template');
      }
      
      // Si on est en mode tracking, initialiser les trackingData avec 3 sets vides pour chaque nouvel exercice
      if (isTrackingWorkout && activeWorkout) {
        console.log('[WorkoutDetailModal] Initializing tracking data for new exercises');
        newExercises.forEach(exercise => {
          const emptySets: TrackingSet[] = [
            { completed: false, weight: '', reps: '', weightPlaceholder: '0', repsPlaceholder: '0' },
            { completed: false, weight: '', reps: '', weightPlaceholder: '0', repsPlaceholder: '0' },
            { completed: false, weight: '', reps: '', weightPlaceholder: '0', repsPlaceholder: '0' }
          ];
          updateTrackingData(exercise.id, emptySets, 0);
        });
        
        // 🔧 CORRECTIF ROBUSTE : Synchroniser les originalRecords avec les nouveaux exercices ajoutés
        const newExerciseNames = newExercises.map(ex => ex.name).filter(Boolean) as string[];
        if (newExerciseNames.length > 0) {
          await workoutSession.syncOriginalRecordsWithExercises(newExerciseNames);
          console.log(`[WorkoutDetailModal] Synced originalRecords with ${newExerciseNames.length} newly added exercises`);
        }
        // Mettre à jour la liste complète d'exercices dans activeWorkout
        setActiveWorkoutExercises(updatedExercises);
        console.log('[WorkoutDetailModal] Updated activeWorkout exercises after adding');
      }
    }
    
    // Retour au mode affichage de workout
    exerciseSelection.resetToWorkoutMode();
  }, [exercises, setExercises, workout, updateWorkout, isTrackingWorkout, activeWorkout, updateTrackingData, workoutSession, setActiveWorkoutExercises, exerciseSelection]);

  // Fonction pour effectuer la suppression réelle d'un exercice
  const performRemoveExercise = useCallback((exerciseId: string) => {
    console.log('[WorkoutDetailModal] Performing remove exercise:', exerciseId);
    const updatedExercises = exercises.filter(ex => ex.id !== exerciseId);
    setExercises(updatedExercises);
    
    // Sauvegarder immédiatement le workout template
    if (workout) {
      const updatedWorkout = {
        ...workout,
        exercises: updatedExercises,
        updatedAt: new Date().toISOString()
      };
      updateWorkout(updatedWorkout);
      console.log('[WorkoutDetailModal] Updated workout template with', updatedExercises.length, 'exercises');
    }
    
    // Si on est en mode tracking, remplacer complètement la liste d'exercices dans activeWorkout
    if (isTrackingWorkout && activeWorkout) {
      setActiveWorkoutExercises(updatedExercises);
      console.log('[WorkoutDetailModal] Updated activeWorkout exercises after deletion');
    }
  }, [exercises, setExercises, workout, updateWorkout, isTrackingWorkout, activeWorkout, setActiveWorkoutExercises]);

  // Fonction pour retirer un exercice
  const handleRemoveExercise = useCallback((exerciseId: string) => {
    // Vérifier si on est en mode tracking et si l'exercice a des sets validés ou des PR
    if (isTrackingWorkout && activeWorkout) {
      const trackingData = activeWorkout.trackingData?.[exerciseId];
      const hasCompletedSets = trackingData && trackingData.sets && trackingData.sets.some(set => set.completed);
      const prResult = workoutSession.exercisePRResults?.[exerciseId];
      const hasPR = prResult && (prResult.weightPR?.isNew || prResult.repsPR?.isNew);
      
      if (hasCompletedSets || hasPR) {
        // Demander confirmation
        let message = 'This exercise has ';
        if (hasCompletedSets && hasPR) {
          message += 'completed sets and a new PR. ';
        } else if (hasCompletedSets) {
          message += 'completed sets. ';
        } else {
          message += 'a new PR. ';
        }
        message += 'Deleting it will lose this data for this session. Continue?';
        
        Alert.alert(
          'Delete exercise',
          message,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Delete', 
              style: 'destructive',
              onPress: () => performRemoveExercise(exerciseId)
            }
          ]
        );
        return;
      }
    }
    
    // Si pas de confirmation nécessaire, supprimer directement
    performRemoveExercise(exerciseId);
  }, [isTrackingWorkout, activeWorkout, workoutSession, performRemoveExercise]);

  // Fonction pour démarrer le processus de remplacement d'un exercice
  const startReplaceExercise = useCallback((exerciseId: string) => {
    // Vérifier si on est en mode tracking et si l'exercice a des sets validés ou des PR
    if (isTrackingWorkout && activeWorkout) {
      const trackingData = activeWorkout.trackingData?.[exerciseId];
      const hasCompletedSets = trackingData && trackingData.sets && trackingData.sets.some(set => set.completed);
      const prResult = workoutSession.exercisePRResults?.[exerciseId];
      const hasPR = prResult && (prResult.weightPR?.isNew || prResult.repsPR?.isNew);
      
      if (hasCompletedSets || hasPR) {
        // Demander confirmation
        let message = 'This exercise has ';
        if (hasCompletedSets && hasPR) {
          message += 'completed sets and a new PR. ';
        } else if (hasCompletedSets) {
          message += 'completed sets. ';
        } else {
          message += 'a new PR. ';
        }
        message += 'Replacing it will lose this data for this session. Continue?';
        
        Alert.alert(
          'Replace exercise',
          message,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Replace', 
              style: 'destructive',
              onPress: () => exerciseSelection.startExerciseReplacement(exerciseId)
            }
          ]
        );
        return;
      }
    }
    
    // Si pas de confirmation nécessaire, démarrer le remplacement directement
    exerciseSelection.startExerciseReplacement(exerciseId);
  }, [isTrackingWorkout, activeWorkout, workoutSession, exerciseSelection]);

  // Fonction pour remplacer un exercice
  const handleReplaceExercise = useCallback(() => {
    // Démarrer le processus de remplacement si un exercice est sélectionné
    if (modalManagement.currentExercise) {
      startReplaceExercise(modalManagement.currentExercise.id);
      modalManagement.hideExerciseSettingsModal(); // Fermer la modale des paramètres
    }
  }, [modalManagement, startReplaceExercise]);

  // Fonction pour finaliser le remplacement d'un exercice
  const handleExerciseReplaced = useCallback(async () => {
    // Vérifier qu'on a bien un exercice à remplacer et un nouvel exercice sélectionné
    if (exerciseSelection.exerciseToReplaceId && exerciseSelection.selectedExercises.length === 1) {
      const newExercise = exerciseSelection.selectedExercises[0];
      const exerciseIdToReplace = exerciseSelection.exerciseToReplaceId;
      
      // Trouver l'ancien exercice pour récupérer son nom
      const oldExercise = exercises.find(ex => ex.id === exerciseIdToReplace);
      
      // Mettre à jour la liste des exercices en remplaçant l'ancien par le nouveau
      const updatedExercises = exercises.map(ex => 
        ex.id === exerciseIdToReplace 
          ? { ...newExercise, id: exerciseIdToReplace } // Conserve l'ID original pour maintenir les références
          : ex
      );
      setExercises(updatedExercises);
      
      // Sauvegarder immédiatement le workout template
      if (workout) {
        const updatedWorkout = {
          ...workout,
          exercises: updatedExercises,
          updatedAt: new Date().toISOString()
        };
        updateWorkout(updatedWorkout);
      }
      
      // Si on est en mode tracking, réinitialiser les trackingData avec 3 sets vides
      if (isTrackingWorkout && activeWorkout) {
        // Mettre à jour les trackingData via la fonction du contexte
        const emptySets: TrackingSet[] = [
          { completed: false, weight: '', reps: '', weightPlaceholder: '0', repsPlaceholder: '0' },
          { completed: false, weight: '', reps: '', weightPlaceholder: '0', repsPlaceholder: '0' },
          { completed: false, weight: '', reps: '', weightPlaceholder: '0', repsPlaceholder: '0' }
        ];
        updateTrackingData(exerciseIdToReplace, emptySets, 0);
        
        // Nettoyer les PRs de l'exercice remplacé (par ID)
        workoutSession.clearExercisePRs(exerciseIdToReplace);
        
        // 🔧 CORRECTIF ROBUSTE : Mettre à jour les originalRecords avec les records du nouvel exercice
        if (newExercise.name) {
          await workoutSession.updateOriginalRecordsForExercise(newExercise.name);
          console.log(`[WorkoutDetailModal] Updated originalRecords for replaced exercise: ${newExercise.name}`);
        }
        
        // Si l'ancien exercice avait un nom différent, on peut optionnellement nettoyer ses records de la session
        if (oldExercise && oldExercise.name !== newExercise.name) {
          console.log(`[WorkoutDetailModal] Exercise name changed from "${oldExercise.name}" to "${newExercise.name}"`);
        }
        
        // Mettre à jour la liste complète d'exercices dans activeWorkout
        setActiveWorkoutExercises(updatedExercises);
        console.log('[WorkoutDetailModal] Updated activeWorkout exercises and cleared PRs after replacement');
      }
    }
    
    // Réinitialiser et retourner au mode workout
    exerciseSelection.resetToWorkoutMode();
  }, [exerciseSelection, exercises, setExercises, workout, updateWorkout, isTrackingWorkout, activeWorkout, updateTrackingData, workoutSession, setActiveWorkoutExercises]);

  // Fonction pour repositionner un exercice dans la liste
  const handleRepositionExercise = useCallback((exerciseId: string, newPosition: number) => {
    console.log('[WorkoutDetailModal] Repositioning exercise:', exerciseId, 'to position:', newPosition);
    
    // Activer LayoutAnimation pour Android si nécessaire
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    
    // Configurer l'animation de réorganisation
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        springDamping: 0.7,
      },
    });
    
    // Trouver l'exercice à déplacer et son index actuel
    const exerciseToMove = exercises.find(ex => ex.id === exerciseId);
    if (!exerciseToMove) return;
    
    const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);
    
    // Si la position est la même, ne rien faire
    if (currentIndex === newPosition) {
      console.log('[WorkoutDetailModal] Exercise already at position:', newPosition);
      return;
    }
    
    // Créer une nouvelle liste sans l'exercice à déplacer
    const exercisesWithoutMoved = exercises.filter(ex => ex.id !== exerciseId);
    
    // Calculer la position d'insertion dans la liste sans l'exercice
    // On veut insérer l'exercice à la position newPosition dans la liste finale
    // 
    // Exemple : [A(0), B(1), C(2)] - déplacer A de 0 à 1
    // Liste sans A : [B(0), C(1)]
    // On veut A à l'index 1 dans la liste finale → [B, A, C]
    // Dans [B, C], l'index 1 correspond à après B, donc on insère à l'index 1
    //
    // Exemple : [A(0), B(1), C(2), D(3)] - déplacer A de 0 à 2
    // Liste sans A : [B(0), C(1), D(2)]
    // On veut A à l'index 2 dans la liste finale → [B, C, A, D]
    // Dans [B, C, D], l'index 2 correspond à après C, donc on insère à l'index 2
    //
    // La logique : après avoir retiré l'exercice, si on veut l'insérer à newPosition
    // dans la liste finale, et que newPosition > currentIndex, alors dans la liste
    // sans l'exercice, la position newPosition correspond toujours à newPosition
    // car on a retiré un élément AVANT cette position
    let adjustedPosition: number;
    if (currentIndex < newPosition) {
      // Déplacement vers le bas : la position dans la liste sans l'exercice
      // est égale à newPosition (pas d'ajustement car on retire avant)
      adjustedPosition = newPosition;
    } else {
      // Déplacement vers le haut : pas d'ajustement nécessaire
      adjustedPosition = newPosition;
    }
    
    // Insérer l'exercice à la nouvelle position
    const updatedExercises = [
      ...exercisesWithoutMoved.slice(0, adjustedPosition),
      exerciseToMove,
      ...exercisesWithoutMoved.slice(adjustedPosition)
    ];
    
    setExercises(updatedExercises);
    
    // Sauvegarder immédiatement le workout template
    if (workout) {
      const updatedWorkout = {
        ...workout,
        exercises: updatedExercises,
        updatedAt: new Date().toISOString()
      };
      updateWorkout(updatedWorkout);
      console.log('[WorkoutDetailModal] Updated workout template with repositioned exercise');
    }
    
    // Si on est en mode tracking, mettre à jour la liste d'exercices dans activeWorkout
    if (isTrackingWorkout && activeWorkout) {
      setActiveWorkoutExercises(updatedExercises);
      console.log('[WorkoutDetailModal] Updated activeWorkout exercises after repositioning');
    }
    
    // Réinitialiser les animations pour refléter le nouvel ordre
    animations.initializeExerciseAnimations(updatedExercises);
    
    // Si on est en mode tracking, restaurer les animations de progression
    if (isTrackingWorkout && activeWorkout) {
      updatedExercises.forEach(exercise => {
        const completedSets = activeWorkout.trackingData[exercise.id]?.completedSets || 0;
        const progress = (completedSets / exercise.sets) * 100;
        animations.animateExerciseProgress(exercise.id, progress);
      });
    }
  }, [exercises, setExercises, workout, updateWorkout, isTrackingWorkout, activeWorkout, setActiveWorkoutExercises, animations]);

  // Fonction pour démarrer une séance
  const handleStartWorkout = useCallback(async () => {
    if (!workout) return;
    
    // Sauvegarder le template original avant de commencer la séance
    setOriginalWorkoutTemplate(JSON.parse(JSON.stringify(workout)));
    
    // S'assurer que les records sont bien chargés avant de commencer
    await personalRecords.loadRecords();
    
    // Capturer les records actuels qui serviront de référence pour toute la séance
    const capturedRecords = JSON.parse(JSON.stringify(personalRecords.records));
    
    // Initialiser la session avec les records capturés
    workoutSession.initializeSession(capturedRecords);
    
    // 🔧 CORRECTIF ROBUSTE : Synchroniser les originalRecords avec tous les exercices de la séance
    const exerciseNames = exercises.map(ex => ex.name).filter(Boolean) as string[];
    if (exerciseNames.length > 0) {
      await workoutSession.syncOriginalRecordsWithExercises(exerciseNames);
      console.log(`[WorkoutDetailModal] Synced originalRecords with ${exerciseNames.length} exercises at session start`);
    }
    
    // Préparer les données de tracking initiales avec les placeholders
    const initialTrackingData: TrackingData = {};
    exercises.forEach(exercise => {
      // Récupérer les données du précédent workout pour cet exercice
      const previousData = getPreviousWorkoutData(workout.id, exercise.name);
      console.log(`[WorkoutDetailModal] Previous data for ${exercise.name}:`, {
        weightPlaceholder: previousData.weightPlaceholder,
        repsPlaceholder: previousData.repsPlaceholder,
        setCount: previousData.setCount
      });
      
      // Déterminer le nombre de séries à créer
      let setCount = exercise.sets || 3; // 3 par défaut
      if (previousData.setCount && previousData.setCount > 0) {
        // Utiliser le nombre de séries de la dernière fois
        setCount = previousData.setCount;
      }
      
      // Créer les sets avec les placeholders
      const sets: TrackingSet[] = Array(setCount).fill(0).map((_, index) => {
        // Si on a des sets précédents et qu'il y a un set complété à cet index
        if (previousData.sets && previousData.sets[index] && previousData.sets[index].completed) {
          const prevSet = previousData.sets[index];
          return {
            completed: false,
            weight: '',
            reps: '',
            weightPlaceholder: prevSet.weight > 0 ? prevSet.weight.toString() : '0',
            repsPlaceholder: prevSet.reps > 0 ? prevSet.reps.toString() : '0',
          };
        }
        
        // Sinon, utiliser les placeholders génériques (dernière valeur complétée)
        return {
          completed: false,
          weight: '',
          reps: '',
          weightPlaceholder: previousData.weightPlaceholder || '0',
          repsPlaceholder: previousData.repsPlaceholder || '0',
        };
      });
      
      initialTrackingData[exercise.id] = {
        completedSets: 0,
        sets,
      };
      
      console.log(`[WorkoutDetailModal] Created ${sets.length} sets for ${exercise.name} with placeholders:`, 
        sets.map(s => `${s.weightPlaceholder}kg x ${s.repsPlaceholder}reps`).join(', ')
      );
    });
    
    // Démarrer une nouvelle séance via le contexte
    startWorkout(workout.id, workout.name, exercises, initialTrackingData);
    updateElapsedTime(0);
  }, [workout, exercises, setOriginalWorkoutTemplate, personalRecords, workoutSession, getPreviousWorkoutData, startWorkout, updateElapsedTime]);

  // Fonction pour finir la séance
  const handleFinishWorkout = useCallback(() => {
    modalManagement.showFinishModal();
  }, [modalManagement]);

  const handleDiscardWorkout = useCallback(async () => {
    // Demander confirmation avant de supprimer
    Alert.alert(
      "Discard Workout",
      "Are you sure you want to discard this workout? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: async () => {
            // Restaurer le template original si des modifications ont été faites pendant le tracking
            if (originalWorkoutTemplate) {
              updateWorkout(originalWorkoutTemplate);
              setExercises(originalWorkoutTemplate.exercises || []);
              setOriginalWorkoutTemplate(null);
            }
            
            // Annuler tout record temporaire
            if (workoutSession.prResults) {
              workoutSession.safeSetPrResults(null);
            }
            
            // Nettoyer complètement la session
            workoutSession.clearSession();
            
            // Terminer la séance sans sauvegarder
            if (finishWorkout) {
              await finishWorkout(false); // Ne pas mettre à jour la streak lors d'un abandon
            }
            // Fermer la modale
            modalManagement.hideFinishModal();
            // Fermer la modale principale
            onClose();
          }
        }
      ]
    );
  }, [originalWorkoutTemplate, updateWorkout, setExercises, setOriginalWorkoutTemplate, workoutSession, finishWorkout, modalManagement, onClose]);

  const handleLogWorkout = useCallback(async () => {
    if (!activeWorkout || !workout) {
      return;
    }
    
    // Arrêter complètement le timer de repos
    if (stopTimer) {
      stopTimer();
    }
    
    // Désactiver le bouton pour éviter les double-clics
    modalManagement.hideFinishModal();
    
    try {
      // 🔧 FIX: S'assurer que toutes les données de tracking sont sauvegardées avant de terminer
      if (modalManagement.selectedExerciseId && exerciseTracking.exerciseSets.length > 0) {
        const completedCount = exerciseTracking.exerciseSets.filter(set => set.completed).length;
        updateTrackingData(modalManagement.selectedExerciseId, exerciseTracking.exerciseSets, completedCount);
      }
      
      // 🔧 FIX: Vérifier et initialiser trackingData pour tous les exercices du workout
      exercises.forEach(exercise => {
        if (!activeWorkout.trackingData[exercise.id]) {
          const initialSets = Array(exercise.sets || 1).fill(0).map(() => ({
            completed: false,
            weight: '',
            reps: '',
          }));
          updateTrackingData(exercise.id, initialSets, 0);
        }
      });
      
      // Créer un objet workout temporaire pour la mise à jour des PRs
      const tempWorkout = {
        date: new Date().toISOString(),
        exercises: exercises.map(exercise => {
          const trackingData = activeWorkout.trackingData[exercise.id];
          const sets = trackingData?.sets || [];
          
          return {
            name: exercise.name,
            sets: sets.map(set => ({
              weight: parseInt(set.weight) || 0,
              reps: parseInt(set.reps) || 0,
              completed: set.completed
            }))
          };
        })
      };
      
      // Utiliser le nouveau système pour mettre à jour et sauvegarder les PRs
      await personalRecords.updateRecordsFromCompletedWorkout(tempWorkout);
      
      // Nettoyer complètement la session après sauvegarde
      workoutSession.clearSession();
      
      // Calculer les données historiques des stickers avant la création du workout
      const stickerData = await calculateStickerHistoricalData(workout.id, workout.name);
      
      // Création de l'objet CompletedWorkout
      const newCompletedWorkout: CompletedWorkout = {
        id: generateId(),
        workoutId: workout.id,
        name: workout.name,
        date: new Date().toISOString(),
        duration: activeWorkout.elapsedTime,
        photo: activeWorkout.photoUri || 'https://via.placeholder.com/114x192/242526/FFFFFF?text=Workout',
        isFrontCamera: activeWorkout.isFrontCamera,
        exercises: exercises.map(exercise => {
          const trackingData = activeWorkout.trackingData[exercise.id];
          const sets = trackingData?.sets || [];
          
          // 🔧 FIX: S'assurer qu'il y a au moins des sets par défaut même si trackingData manque
          const finalSets = sets.length > 0 ? sets : Array(exercise.sets || 1).fill(0).map(() => ({
            completed: false,
            weight: '',
            reps: '',
          }));
          
          // Déterminer si un nouveau record a été établi
          const personalRecord = calculatePersonalRecord(exercise, finalSets, workoutSession.originalRecords);
          
          return {
            id: exercise.id,
            name: exercise.name,
            sets: finalSets.map(set => ({
              weight: parseInt(set.weight) || 0,
              reps: parseInt(set.reps) || 0,
              completed: set.completed
            })),
            tracking: exercise.tracking || 'trackedOnSets',
            duration: exercise.duration,
            personalRecord
          };
        }),
        notes: workout.notes,
        stickerData
      };
      
      // 1. Sauvegarder le workout terminé (gère automatiquement les streaks)
      await addCompletedWorkout(newCompletedWorkout, workout);
      
      // 2. Nettoyer la session active (sans mettre à jour la streak car déjà fait)
      try {
        await finishWorkout(false); // false = pas de mise à jour streak
      } catch (finishError) {
        console.error("Error cleaning workout session:", finishError);
      }
      
      // 3. Réinitialiser le template original car la séance est terminée avec succès
      setOriginalWorkoutTemplate(null);
      
      // 4. Fermer les modales
      onClose();
      
      // 5. Attendre que les opérations se terminent avant navigation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 6. Pré-calculer les stickers pour éviter les appels async dans les écrans suivants
      let preCalculatedStickers: any[] = [];
      try {
        preCalculatedStickers = await StickerService.generateWorkoutStickers(newCompletedWorkout, true);
      } catch (stickerError) {
        console.error("Error pre-calculating stickers:", stickerError);
      }
      
      // 7. Naviguer vers l'écran de récapitulatif avec les stickers pré-calculés
      try {
        navigation.dispatch(
          CommonActions.navigate('SummaryFlow', { 
            screen: 'WorkoutSummary',
            params: { 
              workout: newCompletedWorkout,
              preCalculatedStickers: preCalculatedStickers
            }
          })
        );
      } catch (navigationError) {
        console.error('Navigation error:', navigationError);
        Alert.alert(
          "Navigation Error",
          "Your workout has been saved successfully, but there was an issue opening the summary. You can view it in your journal.",
          [{ text: "OK" }]
        );
      }
      
    } catch (error) {
      console.error('Error saving completed workout:', error);
      Alert.alert(
        "Error", 
        "There was an error saving your workout. Please try again."
      );
    }
  }, [activeWorkout, workout, stopTimer, modalManagement, exerciseTracking, exercises, updateTrackingData, personalRecords, workoutSession, setOriginalWorkoutTemplate, onClose, navigation, addCompletedWorkout, finishWorkout]);

  // Fonction pour naviguer vers le tracking d'un exercice
  const handleExerciseTracking = useCallback((exerciseId: string) => {
    if (isTrackingWorkout && activeWorkout?.workoutId === workout?.id) {
      // Sauvegarder les PR actuels dans l'exercice actuel avant de changer
      if (modalManagement.selectedExerciseId && workoutSession.prResults) {
        workoutSession.safeSetExercisePRResults(modalManagement.selectedExerciseId, workoutSession.prResults.setIndex, workoutSession.prResults);
      }
      
      // Réinitialiser le PR affiché (sera mis à jour par SetRow si nécessaire)
      workoutSession.safeSetPrResults(null);
      
      modalManagement.selectExercise(exerciseId);
      
      // Utiliser les données de tracking existantes ou en créer de nouvelles
      const exercise = currentExercises.find(ex => ex.id === exerciseId);
      
      if (activeWorkout && !activeWorkout.trackingData[exerciseId] && exercise) {
        const initialSets = Array(exercise.sets || 1).fill(0).map(() => ({
          completed: false,
          weight: '',
          reps: '',
        }));
        
        updateTrackingData(exerciseId, initialSets, 0);
        exerciseTracking.initializeSets(initialSets);
      } else if (activeWorkout && activeWorkout.trackingData[exerciseId]) {
        exerciseTracking.initializeSets(activeWorkout.trackingData[exerciseId]?.sets || []);
      }
      
      exerciseSelection.setModalMode('exercise-tracking');
    }
  }, [isTrackingWorkout, activeWorkout, workout, modalManagement, workoutSession, currentExercises, updateTrackingData, exerciseTracking, exerciseSelection]);

  // Fonction pour revenir au mode workout
  const handleBackToWorkout = useCallback(() => {
    // Sauvegarder les PR de l'exercice actuel avant de retourner à la liste
    if (modalManagement.selectedExerciseId && workoutSession.prResults) {
      workoutSession.safeSetExercisePRResults(modalManagement.selectedExerciseId, workoutSession.prResults.setIndex, workoutSession.prResults);
    }
    
    // Réinitialiser les PR actuels (car on n'est plus sur un exercice spécifique)
    workoutSession.safeSetPrResults(null);
    
    // Sauvegarder les modifications de tracking actuelles avant de revenir
    if (modalManagement.selectedExerciseId) {
      const newSets = [...exerciseTracking.exerciseSets];
      const completedCount = newSets.filter(set => set.completed).length;
      
      updateTrackingData(modalManagement.selectedExerciseId, newSets, completedCount);
      
      // Préparer l'animation pour l'exercice
      const exercise = currentExercises.find(ex => ex.id === modalManagement.selectedExerciseId);
      if (exercise) {
        const isCompleted = completedCount === exercise.sets;
        const progress = completedCount / exercise.sets;
        
        // 🔧 FIX: Mise à jour de l'animation de progression avec un court délai
        if (modalManagement.selectedExerciseId) {
          setTimeout(() => {
            if (modalManagement.selectedExerciseId) {
              animations.animateExerciseProgress(modalManagement.selectedExerciseId, progress);
            }
          }, 100);
        }
        
        // Animer le rebond si l'exercice vient d'être complété
        if (modalManagement.selectedExerciseId && isCompleted) {
          animations.animateExerciseBounce(modalManagement.selectedExerciseId);
        }
        
        // 🔧 FIX: Mise à jour immédiate du checkmark pour les exercices complétés
        if (isCompleted) {
          exerciseTracking.markExerciseComplete(modalManagement.selectedExerciseId, true);
          
          const wasAlreadyCompleted = exerciseTracking.completedCheckmarks[modalManagement.selectedExerciseId];
          if (!wasAlreadyCompleted) {
            setTimeout(() => {
              if (modalManagement.selectedExerciseId) {
                animations.animateExerciseBounce(modalManagement.selectedExerciseId);
              }
            }, 50);
          }
        } else {
          exerciseTracking.markExerciseComplete(modalManagement.selectedExerciseId, false);
        }
      }
    }
    
    exerciseSelection.setModalMode('workout');
    modalManagement.clearSelectedExercise();
  }, [modalManagement, workoutSession, exerciseTracking, currentExercises, updateTrackingData, animations, exerciseSelection]);

  // Fonction pour animer le rebond d'une série
  const animateSetBounce = useCallback((index: number) => {
    exerciseTracking.animateSet(index);
  }, [exerciseTracking]);

  // Fonction pour gérer le toggle d'une série (completed/uncompleted)
  const handleSetToggle = useCallback(async (index: number) => {
    // Mettre à jour l'état des sets via le hook et récupérer les nouvelles valeurs
    const toggleResult = exerciseTracking.toggleSetCompletion(index);
    
    if (!toggleResult || !modalManagement.selectedExerciseId) return;
    
    const { newSets, isNowCompleted } = toggleResult;
    const completedCount = newSets.filter(set => set.completed).length;
    
    // Mettre à jour les données de tracking
    updateTrackingData(modalManagement.selectedExerciseId, newSets, completedCount);
    
    // On vérifie si c'est un PR seulement quand la série est complétée (pas quand on décoche)
    if (isNowCompleted) {
      // Trouver l'exercice correspondant
      const exercise = exercises.find(ex => ex.id === modalManagement.selectedExerciseId);
      
      if (exercise) {
        // Démarrer le timer de repos
        startRestTimer(exercise);
        
        // Vérifier si c'est un PR (seulement si weight et reps sont renseignés)
        const weight = parseInt(newSets[index].weight) || 0;
        const reps = parseInt(newSets[index].reps) || 0;
        
        if (weight > 0 && reps > 0) {
          // 🔧 CORRECTIF ROBUSTE : S'assurer que les originalRecords contiennent les records de cet exercice
          if (!workoutSession.originalRecords[exercise.name] && isTrackingWorkout) {
            console.log(`[WorkoutDetailModal] Exercise "${exercise.name}" not found in originalRecords, loading now...`);
            await workoutSession.updateOriginalRecordsForExercise(exercise.name);
          }
          
          // Utiliser les fonctions du hook pour vérifier les PRs
          const weightPR = workoutSession.checkSessionWeightPR(exercise.name, weight);
          const repsPR = workoutSession.checkOriginalRepsPR(exercise.name, weight, reps);
          
          // Si nous avons un nouveau PR de poids pour la session, mettre à jour et supprimer les anciens PR
          if (weightPR) {
            // 1. Mettre à jour le record maximum de poids de la séance
            workoutSession.safeUpdateSessionWeight(exercise.name, weight);
            
            // 2. Supprimer tous les stickers "NEW PR" précédents pour cet exercice
            if (modalManagement.selectedExerciseId) {
              const updatedPRResults = { ...workoutSession.exercisePRResults };
              
              Object.keys(updatedPRResults).forEach(key => {
                if (key.startsWith(modalManagement.selectedExerciseId!) && updatedPRResults[key]?.weightPR) {
                  if (updatedPRResults[key]?.repsPR) {
                    workoutSession.safeSetExercisePRResults(
                      modalManagement.selectedExerciseId!,
                      parseInt(key.split('_set_')[1]),
                      {
                        ...updatedPRResults[key],
                        weightPR: null
                      }
                    );
                  } else {
                    workoutSession.safeSetExercisePRResults(
                      modalManagement.selectedExerciseId!,
                      parseInt(key.split('_set_')[1]),
                      null
                    );
                  }
                }
              });
            }
          }
          
          // Préparer les données PR pour ce set
          const prData = {
            setIndex: index,
            weightPR: weightPR,
            repsPR: repsPR
          };
          
          // Afficher le badge PR pour le set actuel si nécessaire
          if (weightPR || repsPR) {
            workoutSession.safeSetPrResults(prData);
            animations.animatePrBadge();
            
            if (modalManagement.selectedExerciseId) {
              workoutSession.safeSetExercisePRResults(modalManagement.selectedExerciseId, index, prData);
            }
          }
        }
      }
    }
    
    // Mettre à jour l'animation de progression de l'exercice
    if (modalManagement.selectedExerciseId) {
      const exercise = currentExercises.find(ex => ex.id === modalManagement.selectedExerciseId);
      if (exercise) {
        const progress = completedCount / newSets.length;
        animations.animateExerciseProgress(modalManagement.selectedExerciseId, progress);
      }
    }
  }, [exerciseTracking, modalManagement, updateTrackingData, exercises, startRestTimer, workoutSession, isTrackingWorkout, animations, currentExercises]);

  // Fonction pour mettre à jour le temps de repos d'un exercice
  const handleRestTimeUpdate = useCallback((seconds: number) => {
    if (!modalManagement.currentExercise) return;
    
    // Mettre à jour l'exercice actuel avec le nouveau temps de repos
    const updatedExercise = {
      ...modalManagement.currentExercise,
      restTimeSeconds: seconds
    };
    
    // Mettre à jour la liste des exercices
    const updatedExercises = exercises.map(ex => ex.id === updatedExercise.id ? updatedExercise : ex);
    setExercises(updatedExercises);
    
    // Sauvegarder immédiatement le workout
    if (workout) {
      const updatedWorkout = {
        ...workout,
        exercises: updatedExercises,
        updatedAt: new Date().toISOString()
      };
      updateWorkout(updatedWorkout);
    }
  }, [modalManagement, exercises, setExercises, workout, updateWorkout]);

  // Fonction pour mettre à jour les tags sélectionnés
  const handleTagsSelected = useCallback((tags: string[]) => {
    exerciseSelection.setSelectedTags(tags);
  }, [exerciseSelection]);

  // Ouvrir la modale de filtres
  const handleOpenFilterModal = useCallback(() => {
    modalManagement.showFilterModal();
  }, [modalManagement]);

  // Fonction pour réinitialiser les filtres
  const handleResetFilters = useCallback((event: any) => {
    event.stopPropagation(); // Empêcher l'ouverture de la modale
    exerciseSelection.setSelectedTags([]);
  }, [exerciseSelection]);

  // Ajouter une fonction pour supprimer une série
  const handleRemoveSet = useCallback((index: number) => {
    // Ne pas permettre de supprimer la dernière série
    if (exerciseTracking.exerciseSets.length <= 1) return;
    
    // Vérifier si la série à supprimer avait un PR
    const hasPR = workoutSession.prResults && workoutSession.prResults.setIndex === index;
    
    // Mettre à jour l'état local des sets via le hook
    exerciseTracking.removeSet(index);
    const newSets = exerciseTracking.exerciseSets;
    
    // Si cette série avait un PR actif (affiché), le supprimer
    if (hasPR) {
      workoutSession.safeSetPrResults(null);
    }
    
    // Supprimer tous les PR associés à cette série
    if (modalManagement.selectedExerciseId) {
      // Supprimer l'entrée spécifique à cette série
      workoutSession.safeSetExercisePRResults(modalManagement.selectedExerciseId, index, null);
      
      // Décaler les indices des séries suivantes
      for (let i = index + 1; i < exerciseTracking.exerciseSets.length + 1; i++) {
        const currentPR = workoutSession.exercisePRResults[`${modalManagement.selectedExerciseId}_set_${i}`];
        if (currentPR) {
          // Déplacer les PR vers l'index précédent
          workoutSession.safeSetExercisePRResults(modalManagement.selectedExerciseId, i - 1, currentPR);
          // Et supprimer l'ancien index
          workoutSession.safeSetExercisePRResults(modalManagement.selectedExerciseId, i, null);
        }
      }
    }
    
    // Mettre à jour le nombre total de séries pour l'exercice
    if (modalManagement.selectedExerciseId) {
      const selectedExercise = exercises.find(ex => ex.id === modalManagement.selectedExerciseId);
      if (selectedExercise) {
        const updatedExercise = {
          ...selectedExercise,
          sets: Math.max(1, (selectedExercise.sets || 0) - 1)
        };
        const updatedExercises = exercises.map(ex => ex.id === modalManagement.selectedExerciseId ? updatedExercise : ex);
        setExercises(updatedExercises);
        
        // Sauvegarder immédiatement le workout
        if (workout) {
          const updatedWorkout = {
            ...workout,
            exercises: updatedExercises,
            updatedAt: new Date().toISOString()
          };
          updateWorkout(updatedWorkout);
        }
        
        // Mettre à jour les données de tracking avec les sets restants
        const completedCount = newSets.filter(set => set.completed).length;
        updateTrackingData(modalManagement.selectedExerciseId, newSets, completedCount);
      }
    }
  }, [exerciseTracking, workoutSession, modalManagement, exercises, setExercises, workout, updateWorkout, updateTrackingData]);

  // Fonction pour ouvrir la modal de paramètres d'exercice
  const handleOpenSettings = useCallback((exercise: Exercise) => {
    modalManagement.showExerciseSettingsModal(exercise, false);
  }, [modalManagement]);

  // Fonction pour ouvrir le context menu de paramètres d'exercice
  const handleExerciseSettings = useCallback((exerciseId: string, event: any) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (exercise && event?.currentTarget) {
      setSelectedExerciseForMenu(exercise);
      // Mesurer la position du bouton pour positionner le menu
      event.currentTarget.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setExerciseMenuAnchor({ x: pageX, y: pageY, width, height });
        setIsExerciseMenuVisible(true);
      });
    }
  }, [exercises, setSelectedExerciseForMenu, setExerciseMenuAnchor, setIsExerciseMenuVisible]);

  // Fonction pour mettre à jour le poids d'une série
  const handleWeightChange = useCallback((index: number, value: string) => {
    // Mettre à jour l'état via le hook
    exerciseTracking.updateSet(index, 'weight', value);
    
    // Mettre à jour immédiatement les données de tracking
    if (modalManagement.selectedExerciseId) {
      const newSets = exerciseTracking.exerciseSets;
      const completedCount = exerciseTracking.getCompletedSetsCount();
      updateTrackingData(modalManagement.selectedExerciseId, newSets, completedCount);
    }
  }, [exerciseTracking, modalManagement, updateTrackingData]);

  // Fonction pour mettre à jour les répétitions d'une série
  const handleRepsChange = useCallback((index: number, value: string) => {
    // Mettre à jour l'état via le hook
    exerciseTracking.updateSet(index, 'reps', value);
    
    // Mettre à jour immédiatement les données de tracking
    if (modalManagement.selectedExerciseId) {
      const newSets = exerciseTracking.exerciseSets;
      const completedCount = exerciseTracking.getCompletedSetsCount();
      updateTrackingData(modalManagement.selectedExerciseId, newSets, completedCount);
    }
  }, [exerciseTracking, modalManagement, updateTrackingData]);

  // Fonction pour ajouter une série
  const handleAddSet = useCallback(() => {
    // Ajouter une nouvelle série via le hook
    exerciseTracking.addSet();
    const newSets = exerciseTracking.exerciseSets;
    
    // Mettre à jour le nombre total de séries pour l'exercice
    if (modalManagement.selectedExerciseId) {
      const selectedExercise = exercises.find(ex => ex.id === modalManagement.selectedExerciseId);
      if (selectedExercise) {
        const updatedExercise = {
          ...selectedExercise,
          sets: (selectedExercise.sets || 0) + 1
        };
        const updatedExercises = exercises.map(ex => ex.id === modalManagement.selectedExerciseId ? updatedExercise : ex);
        setExercises(updatedExercises);
        
        // Sauvegarder immédiatement le workout
        if (workout) {
          const updatedWorkout = {
            ...workout,
            exercises: updatedExercises,
            updatedAt: new Date().toISOString()
          };
          updateWorkout(updatedWorkout);
        }
        
        // Mettre à jour les données de tracking
        const completedCount = exerciseTracking.getCompletedSetsCount();
        updateTrackingData(modalManagement.selectedExerciseId, newSets, completedCount);
      }
    }
  }, [exerciseTracking, modalManagement, exercises, setExercises, workout, updateWorkout, updateTrackingData]);

  // Gestion de la fermeture avec sauvegarde automatique
  const handleClose = useCallback(() => {
    // Si on est en mode sélection, remplacement ou création, retourner au mode workout
    if (exerciseSelection.modalMode === 'exercise-selection' || 
        exerciseSelection.modalMode === 'exercise-replacement' ||
        exerciseSelection.modalMode === 'exercise-creation') {
      exerciseSelection.resetToWorkoutMode();
      return;
    }
    
    // Si on est en mode tracking d'un exercice spécifique, retourner au mode workout
    if (exerciseSelection.modalMode === 'exercise-tracking') {
      handleBackToWorkout();
      return;
    }
    
    // Si on est en mode tracking, continuer en arrière-plan sans demander
    if (isTrackingWorkout) {
      onClose();
      return;
    }
    
    // Sauvegarder automatiquement les changements avant de fermer
    if (workout) {
      handleSaveChanges();
    }
    
    // Fermer la modale
    onClose();
  }, [exerciseSelection, isTrackingWorkout, workout, handleSaveChanges, handleBackToWorkout, onClose]);

  // Fonction pour gérer la fermeture du modal d'édition du workout
  const handleWorkoutEditClose = useCallback(() => {
    modalManagement.hideWorkoutEditModal();
  }, [modalManagement]);

  // Fonction pour gérer la sauvegarde après l'édition du workout
  const handleWorkoutEditSave = useCallback(() => {
    modalManagement.hideWorkoutEditModal();
    
    // Recharger le workout après les modifications depuis le store Redux
    if (workout) {
      // Récupérer le workout mis à jour depuis le store
      const updatedWorkout = workouts.find(w => w.id === workout.id);
      
      if (updatedWorkout) {
        // Rafraîchir les exercices avec les nouvelles données
        setExercises(updatedWorkout.exercises || []);
      } else {
        console.warn('Updated workout not found in store');
      }
    }
  }, [modalManagement, workout, workouts, setExercises]);

  return {
    // Workout handlers
    handleStartWorkout,
    handleFinishWorkout,
    handleDiscardWorkout,
    handleLogWorkout,
    handleSaveChanges,
    
    // Exercise handlers
    handleAddExercise,
    handleRemoveExercise,
    handleReplaceExercise,
    handleExerciseReplaced,
    handleRepositionExercise,
    handleExercisesSelected,
    handleExerciseTracking,
    handleBackToWorkout,
    
    // Exercise creation handlers
    handleExerciseNameNext,
    handleExerciseTrackingNext,
    handleExerciseTrackingBack,
    handleExerciseCategoriesComplete,
    handleExerciseCategoriesBack,
    handleCancelCreateExercise,
    
    // Library handlers
    handleExerciseLongPress,
    handleDeleteLibraryExercise,
    isCustomExercise,
    
    // Set handlers
    handleSetToggle,
    handleAddSet,
    handleRemoveSet,
    handleWeightChange,
    handleRepsChange,
    animateSetBounce,
    
    // Settings handlers
    handleOpenSettings,
    handleExerciseSettings,
    handleRestTimeUpdate,
    
    // Filter handlers
    handleTagsSelected,
    handleOpenFilterModal,
    handleResetFilters,
    
    // Modal handlers
    handleClose,
    handleWorkoutEditClose,
    handleWorkoutEditSave,
    
    // Replace exercise helper
    startReplaceExercise,
  };
};

