import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  Animated,
  Modal,
  Image,
  FlatList,
  Vibration,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout, Exercise, CompletedWorkout, PersonalRecords, StickerHistoricalData } from '../../types/workout';
import { FullScreenModal } from '../../components/common/FullScreenModal';
import { useWorkout } from '../../hooks/useWorkout';
import { ExerciseSettingsModal } from './ExerciseSettingsModal';
import { ExerciseFilterModal } from './ExerciseFilterModal';
import { ContextMenu, ContextMenuItem } from '../../components/common/ContextMenu';
import { LinearGradient } from 'expo-linear-gradient';
import { useActiveWorkout, TrackingSet, TrackingData } from '../contexts/ActiveWorkoutContext';
import { useRestTimer } from '../contexts/RestTimerContext';
import RestTimer from './RestTimer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions, NavigationProp } from '@react-navigation/native';
import { StreakHistory } from './StreakHistory';
import { useStreak } from '../contexts/StreakContext';
import { SAMPLE_EXERCISES } from './ExerciseSelectionModal';
import { ExerciseCreateNameScreen } from '../screens/ExerciseCreateNameScreen';
import { ExerciseCreateTrackingScreen } from '../screens/ExerciseCreateTrackingScreen';
import { ExerciseCreateCategoriesScreen } from '../screens/ExerciseCreateCategoriesScreen';
import { ExerciseLibraryOptionsModal } from './ExerciseLibraryOptionsModal';
import CustomExerciseService from '../../services/customExerciseService';
import { usePersonalRecords } from '../../hooks/usePersonalRecords';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { useExerciseTracking } from '../hooks/useExerciseTracking';
import { useExerciseSelection } from '../hooks/useExerciseSelection';
import { useModalManagement } from '../hooks/useModalManagement';
import { useWorkoutAnimations } from '../hooks/useWorkoutAnimations';
import { PRBadge } from './PRBadge';
import { SetRow } from './SetRow';
import { WorkoutEditModal } from './WorkoutEditModal';
import { PersonalRecordService } from '../../services/personalRecordService';
import { RobustStorageService } from '../../services/storage';
import { RootStackParamList, WorkoutStackParamList } from '../../types/navigation';
import { useWorkoutHistory } from '../contexts/WorkoutHistoryContext';

// Import du type depuis le hook
import type { ExerciseSelectionMode } from '../hooks/useExerciseSelection';

// Fonction pour générer un ID unique
const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 15);
};

// Types pour la séance active
interface ActiveSessionData {
  activeWorkout?: any;
  restTimer?: any;
  lastUpdated: string;
}

// Constante pour activer/désactiver les logs de diagnostic
const ENABLE_DIAGNOSTIC_LOGS = true; // 🔧 Mettre à false pour désactiver les logs

interface WorkoutDetailModalProps {
  visible: boolean;
  onClose: () => void;
  workout: Workout | null;
  onStartWorkout?: () => void;
}

export const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
  visible,
  onClose,
  workout,
  onStartWorkout
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  // États pour le flow de création d'exercice
  const [exerciseCreationStep, setExerciseCreationStep] = useState<'name' | 'tracking' | 'categories'>('name');
  const [exerciseCreationData, setExerciseCreationData] = useState<{
    name?: string;
    tracking?: 'trackedOnSets' | 'trackedOnTime';
    tags?: string[];
  }>({});
  
  // État pour le nouvel exercice créé (pour scroll + highlight)
  const [newlyCreatedExerciseId, setNewlyCreatedExerciseId] = useState<string | null>(null);
  
  // Refs pour les ScrollViews de sélection d'exercices
  const exerciseListScrollRef = React.useRef<ScrollView>(null);
  const exerciseReplaceScrollRef = React.useRef<ScrollView>(null);
  
  // État pour la modale d'options de la bibliothèque
  const [libraryOptionsModalVisible, setLibraryOptionsModalVisible] = useState(false);
  const [selectedLibraryExercise, setSelectedLibraryExercise] = useState<Exercise | null>(null);
  
  // États pour le ContextMenu des exercices
  const [isExerciseMenuVisible, setIsExerciseMenuVisible] = useState(false);
  const [exerciseMenuAnchor, setExerciseMenuAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [selectedExerciseForMenu, setSelectedExerciseForMenu] = useState<Exercise | null>(null);
  
  // Hook unifié pour gérer la sélection d'exercices
  const exerciseSelection = useExerciseSelection();
  
  // Hook unifié pour gérer toutes les modales
  const modalManagement = useModalManagement();
  
  // Hook unifié pour gérer toutes les animations
  const animations = useWorkoutAnimations();
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { updateWorkout, workouts } = useWorkout();
  const { 
    activeWorkout, 
    startWorkout, 
    finishWorkout, 
    updateTrackingData, 
    updateElapsedTime, 
    resumeWorkout, 
    isTrackingWorkout
  } = useActiveWorkout();
  
  // Hook unifié pour gérer le tracking des exercices et séries
  const exerciseTracking = useExerciseTracking();

  // Récupération du contexte de timer de repos
  const { startRestTimer, resetTimer, stopTimer, currentExercise: currentRestExercise } = useRestTimer();
  
  // Pour la navigation
  const navigation = useNavigation<NavigationProp<RootStackParamList | WorkoutStackParamList>>();

  // Récupération du contexte de streak
  const { updateStreakOnCompletion, getWorkoutStreak } = useStreak();
  
  // Récupération du contexte d'historique des workouts
  const { getPersonalRecords: getHistoryPersonalRecords, addCompletedWorkout, getPreviousWorkoutData } = useWorkoutHistory();
  
  // État pour les records personnels
  const personalRecords = usePersonalRecords();
  
  // Hook unifié pour gérer la session d'entraînement et les PRs
  const workoutSession = useWorkoutSession();

  // Fonction pour animer le badge PR
  const animatePrBadge = animations.animatePrBadge;
  
  // Initialiser les animations pour chaque série
  useEffect(() => {
    if (exerciseSelection.modalMode === 'exercise-tracking' && exerciseTracking.exerciseSets.length > 0) {
      exerciseTracking.initializeSetAnimations(exerciseTracking.exerciseSets.length);
    }
  }, [exerciseSelection.modalMode, exerciseTracking.exerciseSets.length]);

  // Chargement initial des exercices
  useEffect(() => {
    if (workout && visible) {
      setExercises(workout.exercises || []);
      
      // Si une séance est déjà en cours pour ce workout, mettre à jour le mode
      if (isTrackingWorkout && activeWorkout?.workoutId === workout.id) {
        // Ne rien faire ici, le timer est géré par le contexte global
      } else {
        // Réinitialiser les modes si aucune séance n'est en cours
        exerciseSelection.setModalMode('workout');
      }
    }
  }, [workout, visible, isTrackingWorkout, activeWorkout?.workoutId]);

  // Synchroniser le state local avec le workout global quand il change
  useEffect(() => {
    if (workout && workout.exercises) {
      setExercises(workout.exercises);
    }
  }, [workout?.exercises, workout?.updatedAt]);

  // Fonction pour sauvegarder les modifications
  const handleSaveChanges = () => {
    if (!workout) return;
    
    const updatedWorkout = {
      ...workout,
      exercises: exercises,
      updatedAt: new Date().toISOString()
    };
    
    updateWorkout(updatedWorkout);
    // Les changements sont maintenant sauvegardés (gérés automatiquement par le hook)
  };

  // Fonction pour passer au mode de sélection d'exercices
  const handleAddExercise = () => {
    exerciseSelection.startExerciseSelection();
  };

  // Handlers pour le flow de création d'exercice
  const handleExerciseNameNext = (name: string) => {
    setExerciseCreationData(prev => ({ ...prev, name }));
    setExerciseCreationStep('tracking');
  };

  const handleExerciseTrackingNext = (tracking: 'trackedOnSets' | 'trackedOnTime') => {
    setExerciseCreationData(prev => ({ ...prev, tracking }));
    setExerciseCreationStep('categories');
  };

  const handleExerciseTrackingBack = () => {
    setExerciseCreationStep('name');
  };

  const handleExerciseCategoriesComplete = async (tags: string[]) => {
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
  };

  const handleExerciseCategoriesBack = () => {
    setExerciseCreationStep('tracking');
  };
  
  // Fonction pour scroller vers l'exercice nouvellement créé
  const scrollToNewExercise = (exerciseId: string) => {
    // Note: Comme on utilise map() et non FlatList, on ne peut pas vraiment scroller
    // vers un élément spécifique facilement. Le highlight visuel sera suffisant.
    // Si nécessaire, on pourrait convertir en FlatList plus tard pour un meilleur scroll
    console.log('[WorkoutDetailModal] Newly created exercise highlighted:', exerciseId);
  };
  
  // Fonction pour annuler complètement la création d'exercice
  const handleCancelCreateExercise = () => {
    // Reset et retourner au mode sélection d'exercices
    setExerciseCreationStep('name');
    setExerciseCreationData({});
    exerciseSelection.startExerciseSelection();
  };

  // Fonction pour gérer le long press sur un exercice dans la bibliothèque
  const handleExerciseLongPress = (exercise: Exercise) => {
    console.log('[WorkoutDetailModal] Long press on exercise:', exercise.name);
    setSelectedLibraryExercise(exercise);
    setLibraryOptionsModalVisible(true);
  };

  // Fonction pour vérifier si un exercice est personnalisé
  const isCustomExercise = (exercise: Exercise): boolean => {
    return exercise.id.startsWith('custom_');
  };

  // Fonction pour supprimer un exercice de la bibliothèque
  const handleDeleteLibraryExercise = async () => {
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
  };

  // Fonction pour ajouter les exercices sélectionnés
  const handleExercisesSelected = () => {
    // Ajouter seulement les exercices qui ne sont pas déjà présents dans le workout
    const newExercises = exerciseSelection.selectedExercises.filter(
      newEx => !exercises.some(existingEx => existingEx.id === newEx.id)
    );
    
    if (newExercises.length > 0) {
      const updatedExercises = [...exercises, ...newExercises];
      setExercises(updatedExercises);
      
      // Sauvegarder immédiatement le workout avec les nouveaux exercices
      if (workout) {
        const updatedWorkout = {
          ...workout,
          exercises: updatedExercises,
          updatedAt: new Date().toISOString()
        };
        updateWorkout(updatedWorkout);
      }
      
      // Les changements sont maintenant sauvegardés (gérés automatiquement par le hook) // Les changements sont maintenant sauvegardés
    }
    
    // Retour au mode affichage de workout
    exerciseSelection.resetToWorkoutMode();
  };

  // Fonction pour retirer un exercice
  const handleRemoveExercise = (exerciseId: string) => {
    const updatedExercises = exercises.filter(ex => ex.id !== exerciseId);
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
    
    // Les changements sont maintenant sauvegardés (gérés automatiquement par le hook) // Les changements sont maintenant sauvegardés
  };

  // Fonction pour remplacer un exercice
  const handleReplaceExercise = () => {
    // Démarrer le processus de remplacement si un exercice est sélectionné
    if (modalManagement.currentExercise) {
      startReplaceExercise(modalManagement.currentExercise.id);
      modalManagement.hideExerciseSettingsModal(); // Fermer la modale des paramètres
    }
  };

  // Fonction pour démarrer le processus de remplacement d'un exercice
  const startReplaceExercise = (exerciseId: string) => {
    exerciseSelection.startExerciseReplacement(exerciseId);
  };

  // Fonction pour finaliser le remplacement d'un exercice
  const handleExerciseReplaced = () => {
    // Vérifier qu'on a bien un exercice à remplacer et un nouvel exercice sélectionné
    if (exerciseSelection.exerciseToReplaceId && exerciseSelection.selectedExercises.length === 1) {
      const newExercise = exerciseSelection.selectedExercises[0];
      
      // Mettre à jour la liste des exercices en remplaçant l'ancien par le nouveau
      const updatedExercises = exercises.map(ex => 
        ex.id === exerciseSelection.exerciseToReplaceId 
          ? { ...newExercise, id: exerciseSelection.exerciseToReplaceId } // Conserve l'ID original pour maintenir les références
          : ex
      );
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
      
      // Les changements sont maintenant sauvegardés (gérés automatiquement par le hook) // Les changements sont maintenant sauvegardés
    }
    
    // Réinitialiser et retourner au mode workout
    exerciseSelection.resetToWorkoutMode();
  };

  // Fonction pour démarrer une séance
  const handleStartWorkout = async () => {
    if (!workout) return;
    
    // S'assurer que les records sont bien chargés avant de commencer
    await personalRecords.loadRecords();
    
    // Capturer les records actuels qui serviront de référence pour toute la séance
    // Utiliser une copie profonde pour éviter toute référence partagée
    const capturedRecords = JSON.parse(JSON.stringify(personalRecords.records));
    // Capturer les records originaux pour comparaison
    // Records capturés pour la session
    
    // Initialiser la session avec les records capturés
    workoutSession.initializeSession(capturedRecords);
    
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
    // Le contexte gère maintenant le timer
    // IMPORTANT: Utiliser l'état local 'exercises' et non 'workout.exercises'
    // pour inclure les exercices ajoutés récemment
    // Démarrer le workout avec les exercices sélectionnés et les données initiales
    startWorkout(workout.id, workout.name, exercises, initialTrackingData);
    updateElapsedTime(0);
  };

  // Fonction pour finir la séance
  const handleFinishWorkout = () => {
    modalManagement.showFinishModal();
  };

  const handleDiscardWorkout = async () => {
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
            // Annuler tout record temporaire
            if (workoutSession.prResults) {
              workoutSession.safeSetPrResults(null);
              
              // Pas besoin de recharger les records, il suffit de réinitialiser l'UI
              // Les records permanents n'ont jamais été sauvegardés, donc rien à annuler côté stockage
              // Reset PR display
            }
            
            // Nettoyer complètement la session
            workoutSession.clearSession();
            
            // Terminer la séance sans sauvegarder
            // NOTE: La streak n'est pas mise à jour lors d'un abandon de workout
            // Les streaks sont uniquement mises à jour lors d'un "Log Workout" complet
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
  };

  const handleLogWorkout = async () => {
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
      // Sauvegarder une dernière fois les données de l'exercice actuellement sélectionné
      if (modalManagement.selectedExerciseId && exerciseTracking.exerciseSets.length > 0) {
        const completedCount = exerciseTracking.exerciseSets.filter(set => set.completed).length;
        // Final save of tracking data
        updateTrackingData(modalManagement.selectedExerciseId, exerciseTracking.exerciseSets, completedCount);
      }
      
      // 🔧 FIX: Vérifier et initialiser trackingData pour tous les exercices du workout
      exercises.forEach(exercise => {
        if (!activeWorkout.trackingData[exercise.id]) {
          // Initialize missing trackingData
          const initialSets = Array(exercise.sets || 1).fill(0).map(() => ({
            completed: false,
            weight: '',
            reps: '',
          }));
          updateTrackingData(exercise.id, initialSets, 0);
        }
      });
      
      // Sauvegarder définitivement TOUS les records personnels détectés pendant la séance
      const prSavePromises = [];
      
      // 1. D'abord sauvegarder le PR actuellement affiché (s'il existe)
      if (workoutSession.prResults && modalManagement.selectedExerciseId) {
        const exercise = exercises.find(ex => ex.id === modalManagement.selectedExerciseId);
        if (exercise) {
          const set = exerciseTracking.exerciseSets[workoutSession.prResults.setIndex];
          if (set) {
            const weight = parseInt(set.weight);
            const reps = parseInt(set.reps);
            
            // Ne plus traiter les PRs individuellement ici
            // Tous les PRs seront sauvegardés via updateRecordsFromCompletedWorkout
          }
        }
      }
      
      // Maintenant utiliser le nouveau système unifié pour sauvegarder tous les PRs
      // Le nouveau système traite automatiquement tous les PRs du workout complété
      // Using unified PR system to save all records
      
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
      const prUpdateResult = await personalRecords.updateRecordsFromCompletedWorkout(tempWorkout);
      
      // Personal records updated via unified system
      
      // Nettoyer complètement la session après sauvegarde
      workoutSession.clearSession();
      
      // On supprime l'appel à updateStreakOnCompletion ici car il est déjà fait dans finishWorkout
      // via ActiveWorkoutContext
      
      // Calculer les données historiques des stickers avant la création du workout
      const stickerData = await calculateStickerHistoricalData(workout.id, workout.name);
      
      // Création de l'objet CompletedWorkout
      // Creating CompletedWorkout
      
      // Verify trackingData state before creation
      
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
          
          // Process exercise data
          
          // 🔧 FIX: S'assurer qu'il y a au moins des sets par défaut même si trackingData manque
          const finalSets = sets.length > 0 ? sets : Array(exercise.sets || 1).fill(0).map(() => ({
            completed: false,
            weight: '',
            reps: '',
          }));
          
          // Déterminer si un nouveau record a été établi
          const personalRecord = calculatePersonalRecord(exercise, finalSets);
          
          const exerciseResult = {
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
          
          // Exercise result processed
          
          return exerciseResult;
        }),
        notes: workout.notes,
        stickerData // Données historiques des stickers au moment de la séance
        // La streak sera récupérée et affichée directement dans WorkoutSummaryScreen
      };
      
      // Final workout verification before save
      
      // Sauvegarder le workout et nettoyer la session en séquence sécurisée
      
      // 1. Sauvegarder le workout terminé (gère automatiquement les streaks)
      await addCompletedWorkout(newCompletedWorkout, workout);
      
      // 2. Nettoyer la session active (sans mettre à jour la streak car déjà fait)
      try {
        await finishWorkout(false); // false = pas de mise à jour streak
        // Active workout session cleaned successfully
      } catch (finishError) {
        console.error("Error cleaning workout session:", finishError);
        // Continuer malgré l'erreur de nettoyage - le workout est sauvé
      }
      
      // 3. Fermer les modales
      onClose();
      
      // 4. Attendre que les opérations se terminent avant navigation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 5. Pré-calculer les stickers pour éviter les appels async dans les écrans suivants
      let preCalculatedStickers: any[] = [];
      try {
        const { StickerService } = await import('../../services/stickerService');
        preCalculatedStickers = await StickerService.generateWorkoutStickers(newCompletedWorkout, true);
      } catch (stickerError) {
        console.error("Error pre-calculating stickers:", stickerError);
        // Continuer sans stickers si erreur
      }
      
      // 6. Naviguer vers l'écran de récapitulatif avec les stickers pré-calculés
      try {
        // Utiliser CommonActions pour une navigation plus prévisible
        navigation.dispatch(
          CommonActions.navigate('SummaryFlow', { 
            screen: 'WorkoutSummary',
            params: { 
              workout: newCompletedWorkout,
              preCalculatedStickers: preCalculatedStickers // Passer les stickers pré-calculés
            }
          })
        );
      } catch (navigationError) {
        console.error('Navigation error:', navigationError);
        // En cas d'erreur de navigation, au moins le workout est sauvé
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
  };

  // Fonction pour calculer si un record personnel a été atteint
  const calculatePersonalRecord = (exercise: Exercise, sets: TrackingSet[]) => {
    if (!exercise || !sets || sets.length === 0) return undefined;
    
    let maxWeight = 0;
    let maxReps = 0;
    
    // Chercher le poids max et les reps max parmi tous les sets complétés
    sets.forEach(set => {
      if (set.completed) {
        const weight = parseInt(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;
        
        if (weight > maxWeight) {
          maxWeight = weight;
          maxReps = reps;
        } else if (weight === maxWeight && reps > maxReps) {
          maxReps = reps;
        }
      }
    });
    
    // Si aucun set complété ou aucun poids, pas de PR
    if (maxWeight <= 0) return undefined;
    
    // Utiliser les mêmes données que pendant la séance (originalRecords)
    // pour assurer la cohérence
    const originalRecord = workoutSession.originalRecords[exercise.name];
    
    // Si pas de record original, c'est le premier workout pour cet exercice
    if (!originalRecord) {
      // Premier exercice fait = toujours un PR
      return { maxWeight, maxReps };
    }
    
    // Comparer avec les records originaux (début de séance)
    const isNewRecord = maxWeight > originalRecord.maxWeight;
    
    // Retourner le PR seulement si c'est vraiment un nouveau record
    return isNewRecord ? { maxWeight, maxReps } : undefined;
  };

  // Fonction pour calculer les données historiques des stickers
  const calculateStickerHistoricalData = async (workoutId: string, workoutName: string) => {
    try {
      // Charger l'historique des workouts
      const historyResult = await RobustStorageService.loadWorkoutHistory();
      if (!historyResult.success) {
        console.warn('[WorkoutDetailModal] Failed to load workout history');
        return { starCount: 1, streakCount: 1, completionCount: 1 };
      }

      const workoutHistory = historyResult.data;
      
      // 1. Calculer starCount : nombre de fois que ce workout spécifique a été complété
      const starCount = workoutHistory.filter(w => 
        w.workoutId === workoutId || w.name === workoutName
      ).length + 1; // +1 pour inclure la séance actuelle
      
      // 2. Calculer streakCount : streak APRÈS completion du workout
      const { StreakService } = await import('../../services/streakService');
      const currentStreakData = await StreakService.getWorkoutStreak(workoutId);
      const currentStreak = currentStreakData?.current || 0;
      // La streak après completion sera current + 1 (car on vient de compléter une séance)
      const streakCount = currentStreak + 1;
      
      // 3. Calculer completionCount : nombre total de séances complétées
      const completionCount = workoutHistory.length + 1; // +1 pour inclure la séance actuelle
      
      return {
        starCount,
        streakCount,
        completionCount
      };
    } catch (error) {
      console.error('[WorkoutDetailModal] Error calculating sticker historical data:', error);
      // Valeurs par défaut en cas d'erreur
      return {
        starCount: 1,
        streakCount: 1,
        completionCount: 1
      };
    }
  };

  // Fonction pour naviguer vers le tracking d'un exercice
  const handleExerciseTracking = (exerciseId: string) => {
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
  };

  // Fonction pour revenir au mode workout
  const handleBackToWorkout = () => {
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
        
        // 🔧 FIX: Mise à jour de l'animation de progression avec un court délai pour s'assurer que les animations sont initialisées
        if (modalManagement.selectedExerciseId) {
          // Délai court pour s'assurer que les animations sont bien initialisées
          setTimeout(() => {
            if (modalManagement.selectedExerciseId) {
              // Animating progress
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
          
          // Animation de rebond seulement si pas déjà complété avant
          const wasAlreadyCompleted = exerciseTracking.completedCheckmarks[modalManagement.selectedExerciseId];
          if (!wasAlreadyCompleted) {
            setTimeout(() => {
              if (modalManagement.selectedExerciseId) {
                animations.animateExerciseBounce(modalManagement.selectedExerciseId);
              }
            }, 50); // Délai réduit pour la célébration
          }
        } else {
          // Exercice non complété, s'assurer que le checkmark est caché
          exerciseTracking.markExerciseComplete(modalManagement.selectedExerciseId, false);
        }
      }
    }
    
    exerciseSelection.setModalMode('workout');
    modalManagement.clearSelectedExercise();
  };

  // Fonction pour animer le rebond d'une série
  const animateSetBounce = (index: number) => {
    exerciseTracking.animateSet(index);
  };

  // Fonction pour gérer le toggle d'une série (completed/uncompleted)
  const handleSetToggle = (index: number) => {
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
        
        // PR detection check
        
        if (weight > 0 && reps > 0) {
          // Utiliser les fonctions du hook pour vérifier les PRs
          const weightPR = workoutSession.checkSessionWeightPR(exercise.name, weight);
          
          // Vérifier les repetitions PR par rapport aux records originaux
          const repsPR = workoutSession.checkOriginalRepsPR(exercise.name, weight, reps);
          
          // PR detection result
          
          // Si nous avons un nouveau PR de poids pour la session, mettre à jour et supprimer les anciens PR
          if (weightPR) {
            // 1. Mettre à jour le record maximum de poids de la séance
            workoutSession.safeUpdateSessionWeight(exercise.name, weight);
            
            // 2. Supprimer tous les stickers "NEW PR" précédents pour cet exercice
            // Parcourir tous les PR enregistrés et garder uniquement ceux qui n'ont pas de weightPR
            if (modalManagement.selectedExerciseId) {
              const updatedPRResults = { ...workoutSession.exercisePRResults };
              
              // Pour chaque clé de PR existante pour cet exercice
              if (modalManagement.selectedExerciseId) {
                Object.keys(updatedPRResults).forEach(key => {
                  if (key.startsWith(modalManagement.selectedExerciseId!) && updatedPRResults[key]?.weightPR) {
                    // Créer une nouvelle entrée sans le weightPR (garder seulement repsPR s'il existe)
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
                      // S'il n'y a pas de repsPR, supprimer complètement l'entrée
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
          }
          
          // Préparer les données PR pour ce set
          const prData = {
            setIndex: index,
            weightPR: weightPR,
            repsPR: repsPR
          };
          
          // Afficher le badge PR pour le set actuel si nécessaire
          if (weightPR || repsPR) {
            // Pour le set courant, activer l'affichage du badge
            workoutSession.safeSetPrResults(prData);
            
            // Animer le badge PR
            animatePrBadge();
            
            // Enregistrer le badge dans les résultats PR de l'exercice
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
        // Update progress animation
        animations.animateExerciseProgress(modalManagement.selectedExerciseId, progress);
      }
    }
  };

  // Fonction pour mettre à jour le temps de repos d'un exercice
  const handleRestTimeUpdate = (seconds: number) => {
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
    
    // NE PAS déclencher le timer ici - c'est juste un setting qui s'appliquera
    // au prochain démarrage du timer (lors de la validation de la prochaine série)
  };

  // Rendu de l'état vide avec le même style que la page d'accueil
  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateSubtitle}>No exercise added yet</Text>
      
      <TouchableOpacity 
        style={styles.createButton}
        onPress={handleAddExercise}
      >
        <Ionicons name="add-outline" size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Add exercise</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSectionHeader = ({ letter }: { letter: string }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{letter}</Text>
    </View>
  );

  const renderExerciseItem = (exercise: Exercise) => {
    const isSelected = exerciseSelection.selectedExercises.some(ex => ex.id === exercise.id);
    const isNewlyCreated = newlyCreatedExerciseId === exercise.id;
    
    return (
      <TouchableOpacity 
        style={[
          styles.selectionExerciseItem,
          isNewlyCreated && styles.selectionExerciseItemHighlight
        ]}
        onPress={() => exerciseSelection.toggleExerciseSelection(exercise)}
        onLongPress={() => handleExerciseLongPress(exercise)}
        activeOpacity={0.7}
      >
        <View style={styles.exerciseSelectionRow}>
          <View style={[
            styles.checkbox, 
            isSelected && styles.checkboxSelected
          ]}>
            {isSelected && (
              <Ionicons name="checkmark" size={24} color="#000000" />
            )}
          </View>
          
          <View style={styles.exerciseNameContainer}>
            <Text style={styles.selectionExerciseName}>{exercise.name}</Text>
            {isNewlyCreated && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Fonction pour mettre à jour les tags sélectionnés
  const handleTagsSelected = (tags: string[]) => {
    exerciseSelection.setSelectedTags(tags);
  };

  // Ouvrir la modale de filtres
  const handleOpenFilterModal = () => {
    modalManagement.showFilterModal();
  };

  // Fonction pour réinitialiser les filtres
  const handleResetFilters = (event: any) => {
    event.stopPropagation(); // Empêcher l'ouverture de la modale
    exerciseSelection.setSelectedTags([]);
  };

  // Ajouter une fonction pour supprimer une série
  const handleRemoveSet = (index: number) => {
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
          // Workout saved after removing set
        }
        
        // Mettre à jour les données de tracking avec les sets restants
        const completedCount = newSets.filter(set => set.completed).length;
        updateTrackingData(modalManagement.selectedExerciseId, newSets, completedCount);
      }
    }
  };

  useEffect(() => {
    if (exerciseSelection.modalMode === 'exercise-tracking' && modalManagement.selectedExerciseId && activeWorkout) {
      // Lors du passage en mode tracking d'exercice, on charge les données existantes
      exerciseTracking.initializeSets(activeWorkout.trackingData[modalManagement.selectedExerciseId]?.sets || []);
    }
  }, [exerciseSelection.modalMode, modalManagement.selectedExerciseId]);
  
  // Sauvegarder les données de tracking lorsqu'on change d'exercice
  useEffect(() => {
    // Sauvegarder les données du précédent exercice si nécessaire
    if (exerciseSelection.modalMode === 'exercise-tracking' && modalManagement.selectedExerciseId && exerciseTracking.exerciseSets.length > 0) {
      const completedCount = exerciseTracking.exerciseSets.filter(set => set.completed).length;
      
      updateTrackingData(modalManagement.selectedExerciseId, exerciseTracking.exerciseSets, completedCount);
    }
  }, [modalManagement.selectedExerciseId, exerciseTracking.exerciseSets]);

  // Ajouter un effet de nettoyage pour les animations
  useEffect(() => {
    return () => {
      // Nettoyer les animations lors du démontage du composant
      // Les animations sont maintenant gérées par le hook useWorkoutAnimations
      animations.resetAllAnimations();
      // Arrêter les animations des sets (pas de méthode stopAllAnimations disponible)
    };
  }, []);

  // Fonction pour formater le temps du timer (mm:ss)
  const formatElapsedTime = () => {
    if (!activeWorkout) return "00:00";
    const minutes = Math.floor(activeWorkout.elapsedTime / 60);
    const seconds = activeWorkout.elapsedTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Initialiser les animations des exercices une seule fois au chargement
  useEffect(() => {
    if (exercises.length > 0 && visible) {
      // Initialiser les animations pour tous les exercices (toujours, pas seulement en mode tracking)
      animations.initializeExerciseAnimations(exercises);
      
      // Si on est en mode tracking, animer immédiatement jusqu'aux valeurs actuelles
      if (isTrackingWorkout && activeWorkout) {
        exercises.forEach(exercise => {
          const completedSets = activeWorkout.trackingData[exercise.id]?.completedSets || 0;
          const progress = (completedSets / exercise.sets) * 100;
          animations.animateExerciseProgress(exercise.id, progress);
        });
      }
    }
  }, [exercises.length, visible, isTrackingWorkout, activeWorkout?.workoutId]);

  useEffect(() => {
    if (modalManagement.isFinishModalVisible) {
      animations.animateSlideIn();
    } else {
      // Le hook d'animations gère déjà la réinitialisation
    }
  }, [modalManagement.isFinishModalVisible]);

  // Fonction pour obtenir le texte de progression pour un exercice
  const getExerciseProgressText = (exercise: Exercise) => {
    if (!isTrackingWorkout) {
      // Logique améliorée pour déterminer le type de tracking
      if (exercise.tracking === 'trackedOnSets') {
        return 'Tracked on sets';
      } else if (exercise.tracking === 'trackedOnTime') {
        return 'Tracked on time';
      } else {
        // Fallback basé sur les propriétés de l'exercice
        if (exercise.sets > 0 && (exercise.reps > 0 || exercise.weight)) {
          return 'Tracked on sets';
        } else if (exercise.duration && exercise.duration > 0) {
          return 'Tracked on time';
        } else {
          return 'Tracked on sets'; // Défaut pour les exercices avec sets/reps
        }
      }
    }
    const trackingData = activeWorkout?.trackingData[exercise.id];
    const completedSets = trackingData?.completedSets || 0;
    const totalSets = trackingData?.sets.length || exercise.sets; // Utiliser le nombre actuel de sets
    return `${completedSets} of ${totalSets} sets completed`;
  };

  // Calcule le pourcentage de complétion d'un exercice
  const getExerciseProgress = (exercise: Exercise) => {
    const trackingData = activeWorkout?.trackingData[exercise.id];
    const completedSets = trackingData?.completedSets || 0;
    const totalSets = trackingData?.sets.length || exercise.sets; // Utiliser le nombre actuel de sets
    return completedSets / totalSets;
  };

  // Helper pour obtenir les données de complétion d'un exercice
  const getExerciseCompletionData = (exercise: Exercise) => {
    const trackingData = activeWorkout?.trackingData[exercise.id];
    const completedSets = trackingData?.completedSets || 0;
    const totalSets = trackingData?.sets.length || exercise.sets;
    const isCompleted = completedSets === totalSets && totalSets > 0; // Simplifié : juste basé sur les sets
    const progressPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
    
    // Debug check for exercise consistency
    if (__DEV__ && exercise.name === "Push-ups") {
      console.log(`Exercise ${exercise.name}: ${completedSets}/${totalSets} sets completed`);
    }
    
    return {
      completedSets,
      totalSets,
      isCompleted,
      progressPercentage
    };
  };

  // Fonction pour obtenir l'icône en fonction du type d'exercice
  const getExerciseIcon = (exercise: Exercise) => {
    if (exercise.tracking === "trackedOnTime" || exercise.duration) {
      return "time-outline"; // Exercice basé sur le temps
    } else if (exercise.tracking === "trackedOnSets" || exercise.sets > 1) {
      return "repeat-outline"; // Exercice basé sur des séries
    } else {
      return "sync-outline"; // Circuit
    }
  };

  // Fonction pour obtenir le texte de tracking en fonction du type d'exercice
  const getTrackingText = (exercise: Exercise) => {
    if (exercise.tracking === "trackedOnTime") {
      return "Tracked on time";
    } else if (exercise.tracking === "trackedOnSets") {
      return "Tracked on sets";
    } else {
      // Fallback basé sur les propriétés de l'exercice
      if (exercise.sets > 0 && (exercise.reps > 0 || exercise.weight)) {
        return "Tracked on sets";
      } else if (exercise.duration && exercise.duration > 0) {
        return "Tracked on time";
      } else {
        return "Tracked on sets"; // Défaut pour les exercices avec sets/reps
      }
    }
  };

  // États pour les modales d'exercice

  // Utiliser les exercices de activeWorkout quand on est en mode tracking, sinon utiliser l'état local
  const currentExercises = isTrackingWorkout && activeWorkout?.exercises 
    ? activeWorkout.exercises 
    : exercises;

  // Obtenir l'exercice sélectionné
  const selectedExercise = modalManagement.selectedExerciseId 
    ? currentExercises.find(ex => ex.id === modalManagement.selectedExerciseId) 
    : null;

  // Fonction pour ouvrir la modal de paramètres d'exercice
  const handleOpenSettings = (exercise: Exercise) => {
    modalManagement.showExerciseSettingsModal(exercise, false);
  };

  // Fonction pour ouvrir le context menu de paramètres d'exercice
  const handleExerciseSettings = (exerciseId: string, event: any) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (exercise && event?.currentTarget) {
      setSelectedExerciseForMenu(exercise);
      // Mesurer la position du bouton pour positionner le menu
      event.currentTarget.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setExerciseMenuAnchor({ x: pageX, y: pageY, width, height });
        setIsExerciseMenuVisible(true);
      });
    }
  };
  
  // Configuration des items du menu contextuel d'exercice
  const exerciseMenuItems: ContextMenuItem[] = selectedExerciseForMenu ? [
    {
      key: 'replace',
      label: 'Replace exercise',
      icon: 'swap-horizontal-outline',
      onPress: () => {
        if (selectedExerciseForMenu) {
          startReplaceExercise(selectedExerciseForMenu.id);
        }
      },
    },
    {
      key: 'timer',
      label: 'Configure rest timer',
      icon: 'timer-outline',
      onPress: () => {
        if (selectedExerciseForMenu) {
          modalManagement.showExerciseSettingsModal(selectedExerciseForMenu, true);
        }
      },
    },
    {
      key: 'delete',
      label: 'Delete exercise',
      icon: 'trash-outline',
      onPress: () => {
        if (selectedExerciseForMenu) {
          handleRemoveExercise(selectedExerciseForMenu.id);
        }
      },
      destructive: true,
    },
  ] : [];

  // Fonction pour mettre à jour le poids d'une série
  const handleWeightChange = (index: number, value: string) => {
    // Mettre à jour l'état via le hook
    exerciseTracking.updateSet(index, 'weight', value);
    
    // Mettre à jour immédiatement les données de tracking
    if (modalManagement.selectedExerciseId) {
      const newSets = exerciseTracking.exerciseSets;
      const completedCount = exerciseTracking.getCompletedSetsCount();
      updateTrackingData(modalManagement.selectedExerciseId, newSets, completedCount);
    }
  };

  // Fonction pour mettre à jour les répétitions d'une série
  const handleRepsChange = (index: number, value: string) => {
    // Mettre à jour l'état via le hook
    exerciseTracking.updateSet(index, 'reps', value);
    
    // Mettre à jour immédiatement les données de tracking
    if (modalManagement.selectedExerciseId) {
      const newSets = exerciseTracking.exerciseSets;
      const completedCount = exerciseTracking.getCompletedSetsCount();
      updateTrackingData(modalManagement.selectedExerciseId, newSets, completedCount);
    }
  };

  // Fonction pour ajouter une série
  const handleAddSet = () => {
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
          // Workout saved after adding set
        }
        
        // Mettre à jour les données de tracking
        const completedCount = exerciseTracking.getCompletedSetsCount();
        updateTrackingData(modalManagement.selectedExerciseId, newSets, completedCount);
      }
    }
  };

  // Gestion de la fermeture avec sauvegarde automatique
  const handleClose = () => {
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
      // Le timer continue en arrière-plan via le contexte global
      // Pas besoin de gérer le timer ici
      onClose();
      return;
    }
    
    // Sauvegarder automatiquement les changements avant de fermer
    if (workout) {
      handleSaveChanges();
    }
    
    // Fermer la modale
    onClose();
  };

  // État pour la modal d'édition du workout

  // Fonction pour gérer la fermeture du modal d'édition du workout
  const handleWorkoutEditClose = () => {
    // Closing workout edit modal
    modalManagement.hideWorkoutEditModal();
  };

  // Fonction pour gérer la sauvegarde après l'édition du workout
  const handleWorkoutEditSave = () => {
    // Saving workout edit changes
    modalManagement.hideWorkoutEditModal();
    
    // Recharger le workout après les modifications depuis le store Redux
    if (workout) {
      // Récupérer le workout mis à jour depuis le store
      const updatedWorkout = workouts.find(w => w.id === workout.id);
      
      if (updatedWorkout) {
        // Rafraîchir les exercices avec les nouvelles données
        setExercises(updatedWorkout.exercises || []);
        
        // Mettre à jour les données locales pour refléter les changements
        // Updated workout found
      } else {
        console.warn('Updated workout not found in store');
      }
    }
  };

  // Les fonctions de vérification des PRs sont maintenant dans le hook useWorkoutSession

  // Référence pour indiquer si le composant est monté
  const isMounted = useRef(true);
  
  // Effet pour gérer le montage/démontage du composant
  useEffect(() => {
    // Marquer le composant comme monté au chargement
    isMounted.current = true;
    
    // Fonction de nettoyage pour marquer le composant comme démonté
    return () => {
      isMounted.current = false;
      
      // Arrêter toutes les animations en cours pour éviter les mises à jour après démontage
      animations.resetAllAnimations();
      
      // Arrêter les animations des sets (pas de méthode stopAllAnimations disponible)
    };
  }, []);
  
  // Les fonctions sécurisées de gestion des PRs sont maintenant dans le hook useWorkoutSession

  if (!workout) return null;

  return (
    <>
      <FullScreenModal
        visible={visible}
        onClose={onClose}
      >
      <View style={[styles.container, { overflow: 'visible' }]}>
        {exerciseSelection.modalMode === 'workout' ? (
              // Mode affichage du workout
              <>
                <View style={styles.header}>
                  <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                    <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <View style={styles.rightButtons}>
                    {!isTrackingWorkout && (
                      <TouchableOpacity 
                        style={styles.settingsButton}
                        onPress={() => modalManagement.showWorkoutEditModal()}
                      >
                        <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                      style={[
                        isTrackingWorkout ? styles.finishButton : styles.startButton
                      ]}
                      onPress={isTrackingWorkout ? handleFinishWorkout : handleStartWorkout}
                    >
                      <Text 
                        style={[
                          isTrackingWorkout ? styles.finishButtonText : styles.startButtonText
                        ]}
                      >
                        {isTrackingWorkout ? "Finish" : "Start"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {isTrackingWorkout && (
                  <Text style={styles.workoutTimer}>{formatElapsedTime()}</Text>
                )}
                
                <View style={styles.workoutHeaderContainer}>
                  <Text 
                    style={[
                      styles.workoutName,
                      isTrackingWorkout && styles.workoutNameSmall
                    ]}
                  >
                    {workout.name}
                  </Text>
                </View>
                
                <View style={styles.scrollableContainer}>
                  <ScrollView 
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                  >
                    {currentExercises.length === 0 ? (
                      renderEmptyState()
                    ) : (
                      <View style={styles.exercisesList}>
                        {currentExercises.map((exercise) => (
                          <Pressable
                            key={exercise.id}
                            style={({ pressed }) => [
                              styles.exerciseItem,
                              isTrackingWorkout && styles.exerciseItemTracking,
                              pressed && styles.exerciseItemPressed
                            ]}
                            onPress={() => isTrackingWorkout ? handleExerciseTracking(exercise.id) : {}}
                          >
                            <View style={styles.exerciseContent}>
                              {isTrackingWorkout && (
                                <View style={{position: 'relative'}}>
                                  <TouchableOpacity
                                    onPress={() => handleExerciseTracking(exercise.id)}
                                    style={[
                                      styles.trackingCheckbox,
                                      // Toujours ajouter la bordure en mode tracking
                                      { 
                                        borderWidth: 1,
                                        borderColor: 'rgba(255, 255, 255, 0.2)' // 20% d'opacité en mode tracking
                                      },
                                      getExerciseCompletionData(exercise).isCompleted && styles.trackingCheckboxCompleted,
                                      { transform: [{ scale: animations.exerciseBounceAnimations[exercise.id] || 1 }] }
                                    ]}
                                  >
                                    {getExerciseCompletionData(exercise).isCompleted ? (
                                      <Ionicons name="checkmark" size={24} color="#000000" />
                                    ) : (
                                      <Animated.View style={[
                                        styles.progressFill, 
                                        { 
                                          height: animations.exerciseProgressAnimations[exercise.id] 
                                            ? animations.exerciseProgressAnimations[exercise.id].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%']
                                              })
                                            : `${getExerciseCompletionData(exercise).progressPercentage}%` 
                                        }
                                      ]} />
                                    )}
                                  </TouchableOpacity>
                                  <View style={styles.dashedBorder} />
                                </View>
                              )}
                              
                              <View style={[
                                styles.exerciseInfo,
                                !isTrackingWorkout && { marginLeft: 0 }
                              ]}>
                                <Text style={styles.exerciseName}>{exercise.name}</Text>
                                <Text style={styles.exerciseTrackingType}>
                                  {getExerciseProgressText(exercise)}
                                </Text>
                              </View>
                              
                              {!isTrackingWorkout ? (
                                <TouchableOpacity 
                                  onPress={(event) => handleExerciseSettings(exercise.id, event)}
                                  style={styles.exerciseSettingsButton}
                                >
                                  <Ionicons name="ellipsis-vertical" size={24} color="#5B5B5C" />
                                </TouchableOpacity>
                              ) : (
                                <View style={styles.exerciseChevronContainer}>
                                  <Ionicons name="chevron-forward" size={24} color="#5B5B5C" />
                                </View>
                              )}
                            </View>
                          </Pressable>
                        ))}
                        
                        {!isTrackingWorkout && (
                          <TouchableOpacity 
                            style={styles.addButtonContainer}
                            onPress={handleAddExercise}
                          >
                            <View 
                              style={styles.addRoundButton}
                            >
                              <Ionicons name="add" size={24} color="#FFFFFF" />
                            </View>
                            <Text style={styles.addButtonText}>Add exercise</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    
                    {/* Padding de bas pour assurer le défilement complet */}
                    <View style={styles.bottomPadding} />
                  </ScrollView>
                </View>
              </>
            ) : exerciseSelection.modalMode === 'exercise-selection' ? (
              // Mode sélection d'exercices avec layout flex
              <View style={styles.flexContainer}>
                {/* Header */}
                <View style={styles.header}>
                  <TouchableOpacity 
                    style={styles.arrowBackButton} 
                    onPress={handleClose}
                  >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.5)" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search exercises..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={exerciseSelection.searchQuery}
                      onChangeText={exerciseSelection.setSearchQuery}
                    />
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => {
                      console.log('[WorkoutDetailModal] Starting exercise creation mode...');
                      exerciseSelection.startExerciseCreation();
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                {/* Filter Button */}
                <TouchableOpacity 
                  style={[
                    styles.filterButton, 
                    exerciseSelection.selectedTags.length > 0 && styles.filterButtonActive
                  ]} 
                  onPress={handleOpenFilterModal}
                >
                  <Text 
                    style={[
                      styles.filterButtonText,
                      exerciseSelection.selectedTags.length > 0 && styles.filterButtonTextActive
                    ]}
                  >
                    {exerciseSelection.getFilterButtonText()}
                  </Text>
                  {exerciseSelection.selectedTags.length === 0 ? (
                    <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
                  ) : (
                    <TouchableOpacity onPress={handleResetFilters}>
                      <Ionicons name="close" size={20} color="#000000" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                
                {/* Exercise List - Flex Layout */}
                <View style={styles.exerciseListContainerFlex}>
                  <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollViewContent}
                  >
                    {exerciseSelection.groupedExercises.map((section) => (
                      <View key={section.letter}>
                        {renderSectionHeader({ letter: section.letter })}
                        {section.data.map((exercise) => (
                          <View key={exercise.id}>
                            {renderExerciseItem(exercise)}
                          </View>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                  
                  {/* Fade Out Gradient - Réduit */}
                  <LinearGradient
                    colors={['rgba(13, 13, 15, 0)', 'rgba(13, 13, 15, 0.8)', 'rgba(13, 13, 15, 1)']}
                    style={styles.fadeGradientSmall}
                  />
                </View>
                
                {/* Bottom Add Button - Layout normal */}
                <View style={styles.bottomButtonContainerFlex}>
                  <TouchableOpacity 
                    style={[
                      styles.addExercisesButton,
                      exerciseSelection.selectedExercises.length === 0 && styles.addExercisesButtonDisabled
                    ]}
                    onPress={handleExercisesSelected}
                    disabled={exerciseSelection.selectedExercises.length === 0}
                  >
                    <Text style={styles.addExercisesButtonText}>
                      {exerciseSelection.selectedExercises.length === 0 
                        ? 'Select exercises' 
                        : `Add ${exerciseSelection.selectedExercises.length} exercise${exerciseSelection.selectedExercises.length > 1 ? 's' : ''}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : exerciseSelection.modalMode === 'exercise-tracking' ? (
              // Mode tracking d'un exercice spécifique
              <>
                <View style={styles.header}>
                  <TouchableOpacity onPress={handleBackToWorkout} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <View style={styles.rightButtons}>
                    <TouchableOpacity 
                      style={[styles.settingsButton, { marginRight: 16 }]}
                      onPress={() => {
                        if (selectedExercise) {
                          // Ouvrir directement en mode configuration du timer
                          modalManagement.showExerciseSettingsModal(selectedExercise, true);
                        }
                      }}
                    >
                      <Ionicons name="timer-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={styles.exerciseTrackingTitle}>
                  {selectedExercise?.name || 'Exercise'}
                </Text>
                
                <Text style={styles.exerciseTrackingSubtitle}>
                  Tick checkboxes as you complete the sets
                </Text>
                
                <View style={styles.scrollableContainer}>
                  <ScrollView 
                    style={[styles.content, { overflow: 'visible' }]}
                    contentContainerStyle={{ overflow: 'visible' }}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={[styles.setsContainer, { overflow: 'visible' }]}>
                      {exerciseTracking.exerciseSets.map((set, index) => (
                        <SetRow
                          key={index}
                          set={set}
                          index={index}
                          animation={exerciseTracking.setAnimations[index] || new Animated.Value(1)}
                          onToggle={handleSetToggle}
                          onWeightChange={handleWeightChange}
                          onRepsChange={handleRepsChange}
                          onRemove={handleRemoveSet}
                          prData={
                            // Si la série affichée est celle actuellement mise en évidence, utiliser prResults
                            workoutSession.prResults && workoutSession.prResults.setIndex === index ? {
                              weightPR: workoutSession.prResults.weightPR,
                              repsPR: workoutSession.prResults.repsPR,
                              prBadgeAnim: animations.prBadgeAnim
                            } : 
                            // Sinon, chercher dans exercisePRResults s'il y a un enregistrement pour cette série
                            modalManagement.selectedExerciseId && 
                            workoutSession.exercisePRResults[`${modalManagement.selectedExerciseId}_set_${index}`] ? {
                              weightPR: workoutSession.exercisePRResults[`${modalManagement.selectedExerciseId}_set_${index}`]?.weightPR,
                              repsPR: workoutSession.exercisePRResults[`${modalManagement.selectedExerciseId}_set_${index}`]?.repsPR,
                              prBadgeAnim: animations.prBadgeAnim
                            } : undefined
                          }
                        />
                      ))}
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.addSetContainer}
                      onPress={handleAddSet}
                    >
                      <View 
                        style={styles.addSetButton}
                      >
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                      </View>
                      <Text style={styles.addSetText}>Add a set</Text>
                    </TouchableOpacity>
                    
                    {/* Padding de bas pour assurer le défilement complet */}
                    <View style={styles.bottomPadding} />
                  </ScrollView>
                </View>
              </>
            ) : exerciseSelection.modalMode === 'exercise-creation' ? (
              // Mode création d'exercice - Flow multi-étapes
              <>
                {exerciseCreationStep === 'name' && (
                  <ExerciseCreateNameScreen
                    onNext={handleExerciseNameNext}
                    onClose={handleCancelCreateExercise}
                    existingExercises={exerciseSelection.allExercises.map(ex => ex.name)}
                  />
                )}
                {exerciseCreationStep === 'tracking' && (
                  <ExerciseCreateTrackingScreen
                    onNext={handleExerciseTrackingNext}
                    onBack={handleExerciseTrackingBack}
                  />
                )}
                {exerciseCreationStep === 'categories' && (
                  <ExerciseCreateCategoriesScreen
                    onComplete={handleExerciseCategoriesComplete}
                    onBack={handleExerciseCategoriesBack}
                  />
                )}
              </>
            ) : (
              // Mode remplacement d'exercice avec layout flex
              <View style={styles.flexContainer}>
                {/* Header */}
                <View style={styles.header}>
                  <TouchableOpacity 
                    style={styles.arrowBackButton} 
                    onPress={handleClose}
                  >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.5)" style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search exercises..."
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={exerciseSelection.searchQuery}
                      onChangeText={exerciseSelection.setSearchQuery}
                    />
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => {
                      console.log('[WorkoutDetailModal] Starting exercise creation mode from replacement...');
                      exerciseSelection.startExerciseCreation();
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                {/* Filter Button */}
                <TouchableOpacity 
                  style={[
                    styles.filterButton, 
                    exerciseSelection.selectedTags.length > 0 && styles.filterButtonActive
                  ]} 
                  onPress={handleOpenFilterModal}
                >
                  <Text 
                    style={[
                      styles.filterButtonText,
                      exerciseSelection.selectedTags.length > 0 && styles.filterButtonTextActive
                    ]}
                  >
                    {exerciseSelection.getFilterButtonText()}
                  </Text>
                  {exerciseSelection.selectedTags.length === 0 ? (
                    <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
                  ) : (
                    <TouchableOpacity onPress={handleResetFilters}>
                      <Ionicons name="close" size={20} color="#000000" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                
                {/* Exercise List - Flex Layout */}
                <View style={styles.exerciseListContainerFlex}>
                  <ScrollView 
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollViewContent}
                  >
                    {exerciseSelection.groupedExercises.map((section) => (
                      <View key={section.letter}>
                        {renderSectionHeader({ letter: section.letter })}
                        {section.data.map((exercise) => (
                          <View key={exercise.id}>
                            {renderExerciseItem(exercise)}
                          </View>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                  
                  {/* Fade Out Gradient - Réduit */}
                  <LinearGradient
                    colors={['rgba(13, 13, 15, 0)', 'rgba(13, 13, 15, 0.8)', 'rgba(13, 13, 15, 1)']}
                    style={styles.fadeGradientSmall}
                  />
                </View>
                
                {/* Bottom Add Button - Layout normal */}
                <View style={styles.bottomButtonContainerFlex}>
                  <TouchableOpacity 
                    style={[
                      styles.addExercisesButton,
                      exerciseSelection.selectedExercises.length === 0 && styles.addExercisesButtonDisabled
                    ]}
                    onPress={exerciseSelection.modalMode === 'exercise-replacement' ? handleExerciseReplaced : handleExercisesSelected}
                    disabled={exerciseSelection.selectedExercises.length === 0}
                  >
                    <Text style={styles.addExercisesButtonText}>
                      {exerciseSelection.modalMode === 'exercise-replacement' 
                        ? (exerciseSelection.selectedExercises.length === 0 
                          ? 'Select an exercise' 
                          : 'Replace with selected exercise')
                        : (exerciseSelection.selectedExercises.length === 0 
                          ? 'Select exercises' 
                          : `Add ${exerciseSelection.selectedExercises.length} exercise${exerciseSelection.selectedExercises.length > 1 ? 's' : ''}`)
                      }
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
                </View>
      
      {/* Modale des paramètres d'exercice (utilisée uniquement pour la configuration du rest timer) */}
      <ExerciseSettingsModal
        visible={modalManagement.settingsModalVisible}
        onClose={() => {
          modalManagement.hideExerciseSettingsModal();
        }}
        onReplace={handleReplaceExercise}
        onDelete={() => {
          if (modalManagement.currentExercise) {
            handleRemoveExercise(modalManagement.currentExercise.id);
            modalManagement.hideExerciseSettingsModal();
          }
        }}
        exercise={modalManagement.currentExercise}
        onRestTimeUpdate={handleRestTimeUpdate}
        openTimerDirectly={modalManagement.openTimerDirectly}
      />
      
      {/* Context menu pour les paramètres d'exercice */}
      <ContextMenu
        visible={isExerciseMenuVisible}
        onClose={() => {
          setIsExerciseMenuVisible(false);
          setSelectedExerciseForMenu(null);
        }}
        items={exerciseMenuItems}
        anchorPosition={exerciseMenuAnchor || undefined}
      />
      
      {/* Afficher le timer de repos s'il est actif */}
      <RestTimer 
        onOpenSettings={() => {
          // Récupérer l'exercice actuel depuis le contexte du rest timer
          if (currentRestExercise) {
            modalManagement.showExerciseSettingsModal(currentRestExercise, true);
          }
        }}
      />
      
      {/* Modale pour les filtres */}
      <ExerciseFilterModal
        visible={modalManagement.isFilterModalVisible}
        onClose={() => modalManagement.hideFilterModal()}
        availableTags={exerciseSelection.allTags}
        selectedTags={exerciseSelection.selectedTags}
        onTagsSelected={handleTagsSelected}
      />
      
      {/* Finish Workout Modal */}
      <Modal
        visible={modalManagement.isFinishModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => modalManagement.hideFinishModal()}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1}
            onPress={() => modalManagement.hideFinishModal()}
          />
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                transform: [{
                  translateY: animations.slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0]
                  })
                }]
              }
            ]}
          >
            <View style={styles.modalIndicator} />
            
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Finish workout</Text>
              
              <View style={styles.modalOptionsContainer}>
                <TouchableOpacity 
                  style={[styles.modalOption, styles.discardOption]}
                  onPress={handleDiscardWorkout}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalOptionText}>Discard</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalOption, styles.logOption]}
                  onPress={handleLogWorkout}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalOptionText, styles.logOptionText]}>Log workout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
      
      {/* Modal pour éditer le workout */}
      {workout && (
        <WorkoutEditModal
          visible={modalManagement.isWorkoutEditModalVisible}
          workout={workout}
          onClose={handleWorkoutEditClose}
          onSave={handleWorkoutEditSave}
        />
      )}

      {/* Modale d'options pour les exercices de la bibliothèque */}
      <ExerciseLibraryOptionsModal
        visible={libraryOptionsModalVisible}
        onClose={() => {
          setLibraryOptionsModalVisible(false);
          setSelectedLibraryExercise(null);
        }}
        onDelete={handleDeleteLibraryExercise}
        exercise={selectedLibraryExercise}
        isCustomExercise={selectedLibraryExercise ? isCustomExercise(selectedLibraryExercise) : false}
      />

    </FullScreenModal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
    overflow: 'visible', // Pour permettre aux badges PR de dépasser
  },
  keyboardAvoidingView: {
    flex: 1,
    overflow: 'visible', // Pour permettre aux badges PR de dépasser
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 44,
  },
  backButton: {
    padding: 8,
  },
  arrowBackButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#242526',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24,
  },
  startButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 16,
  },
  workoutName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 32,
    marginBottom: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    overflow: 'visible',
  },
  scrollableContainer: {
    // Container qui empêche le contenu scrollable de passer visuellement au-dessus du workoutHeaderContainer
    flex: 1,
    overflow: 'hidden', // Masque tout ce qui dépasse ce container
  },
  emptyStateContainer: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(36, 37, 38, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 16,
    marginLeft: 8,
  },
  exercisesList: {
    paddingTop: 24, // Espace tampon pour les badges PR en haut (cohérent avec setsContainer)
    marginBottom: 24,
  },
  exerciseItem: {
    borderRadius: 0,
    marginBottom: 8,
  },
  exerciseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  exerciseItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 16,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exerciseTrackingType: {
    fontSize: 14,
    color: '#5B5B5C',
  },
  exerciseSettingsButton: {
    padding: 8,
  },
  addButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  addRoundButton: {
    width: 48,
    height: 48,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    marginLeft: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
  bottomPadding: {
    height: 80,
  },
  
  // Styles pour la sélection d'exercices
  searchContainer: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#242526',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 100,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    height: 44,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  filterButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#000000',
  },
  exerciseListContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    height: 64,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 0,
    marginBottom: 0,
  },
  sectionHeaderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingLeft: 4,
  },
  exerciseSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  fadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 1,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 2,
  },
  // Nouveaux styles pour layout flex (sans position absolute)
  flexContainer: {
    flex: 1,
  },
  exerciseListContainerFlex: {
    flex: 1,
    position: 'relative',
  },
  bottomButtonContainerFlex: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32, // Espace supplémentaire pour la safe area
    backgroundColor: '#0D0D0F',
  },
  scrollViewContent: {
    paddingBottom: 120, // Espace pour éviter que le contenu soit coupé par le gradient et le bouton
  },
  fadeGradientSmall: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80, // Réduit car on n'a plus le bouton absolu qui nécessitait plus d'espace
    zIndex: 1,
  },
  addExercisesButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExercisesButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  addExercisesButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  selectionExerciseItem: {
    marginBottom: 32,
    paddingVertical: 0,
  },
  selectionExerciseItemHighlight: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  exerciseNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
  },
  selectionExerciseName: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  newBadge: {
    backgroundColor: '#34C759',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagScrollView: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  tagScrollViewContent: {
    alignItems: 'center',
  },
  tagFilterButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 4,
  },
  tagFilterButtonSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagFilterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  tagFilterButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Styles pour le mode tracking
  workoutNameSmall: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 8,
    marginBottom: 24,
  },
  workoutTimer: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 32,
    paddingHorizontal: 16,
  },
  trackingCheckboxContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackingCheckbox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Fond blanc 10% opacité
    // Pas de bordure ici car elle est gérée par dashedBorder en mode non-tracking
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
  },
  trackingCheckboxCompleted: {
    backgroundColor: '#FFFFFF',
  },
  finishButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  exerciseChevronContainer: {
    padding: 8,
  },
  // Styles pour le tracking d'un exercice spécifique
  exerciseTrackingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 32,
    paddingHorizontal: 16,
  },
  exerciseTrackingSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#5B5B5C',
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  setsContainer: {
    paddingHorizontal: 16,
    paddingTop: 24, // Espace tampon pour les badges PR en haut
    gap: 8,
    overflow: 'visible', // Pour permettre aux badges PR de dépasser
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  setInputsContainer: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: 16,
    justifyContent: 'flex-start',
    gap: 16,
  },
  inputWrapper: {
    position: 'relative',
    height: 48,
    minWidth: 70,
  },
  setInput: {
    height: 48,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
    color: '#FFFFFF',
    textAlign: 'right',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingRight: 52,
    minWidth: 70,
    width: 'auto',
  },
  inputSuffix: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 12,
    left: undefined,
    textAlignVertical: 'center',
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
    height: '100%',
    lineHeight: 48,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setSettingsButton: {
    padding: 8,
    marginLeft: 16,
  },
  addSetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  addSetButton: {
    width: 48,
    height: 48,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSetText: {
    marginLeft: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
  exerciseItemTracking: {
    marginBottom: 8,
  },
  dashedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.2)', // 20% d'opacité en mode non-tracking
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  setTrackingCheckbox: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'solid',
  },
  trackingCheckboxText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area
    minHeight: 280,
  },
  modalIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  modalContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 32,
    textAlign: 'center',
  },
  modalOptionsContainer: {
    width: '100%',
    gap: 12,
  },
  modalOption: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  discardOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logOption: {
    backgroundColor: '#FFFFFF',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  logOptionText: {
    color: '#000000',
  },
  workoutHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -8, // Ajusté pour l'espace tampon de 24px
    paddingHorizontal: 16,
  },
  streakContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  completedInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  prBadgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    minWidth: 70,
  },
  prBadgeOverlay: {
    position: 'absolute',
    top: -10,
    right: -5,
    zIndex: 9999, // Valeur très élevée pour être au-dessus de tout
    elevation: 20,
  },
}); 