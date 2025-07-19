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
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Modal,
  Image,
  FlatList,
  Vibration,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout, Exercise, CompletedWorkout, EnhancedPersonalRecords } from '../../types/workout';
import { FullScreenModal } from '../../components/common/FullScreenModal';
import { useWorkout } from '../../hooks/useWorkout';
import { ExerciseSettingsModal } from './ExerciseSettingsModal';
import { ExerciseFilterModal } from './ExerciseFilterModal';
import { LinearGradient } from 'expo-linear-gradient';
import { useActiveWorkout, TrackingSet, TrackingData } from '../contexts/ActiveWorkoutContext';
import { useRestTimer } from '../contexts/RestTimerContext';
import RestTimer from './RestTimer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions, NavigationProp } from '@react-navigation/native';
import { StreakHistory } from './StreakHistory';
import { useStreak } from '../contexts/StreakContext';
import { SAMPLE_EXERCISES } from './ExerciseSelectionModal';
import { useEnhancedPersonalRecords } from '../../hooks/useEnhancedPersonalRecords';
import { PRBadge } from './PRBadge';
import { SetRow } from './SetRow';
import { WorkoutEditModal } from './WorkoutEditModal';
import { EnhancedPersonalRecordService } from '../../services/enhancedPersonalRecordService';
import { RootStackParamList, WorkoutStackParamList } from '../../types/navigation';
import { useWorkoutHistory } from '../contexts/WorkoutHistoryContext';

// Définition d'un type pour ModalMode
type ModalMode = 'workout' | 'exercise-selection' | 'exercise-tracking' | 'exercise-replacement';

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExerciseSettingsVisible, setIsExerciseSettingsVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  // État pour le mode d'affichage de la modale
  const [modalMode, setModalMode] = useState<ModalMode>('workout');
  // États pour la sélection d'exercices
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  // État pour les filtres de tags
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // État pour stocker l'ID de l'exercice à remplacer
  const [exerciseToReplaceId, setExerciseToReplaceId] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // États pour stocker les animations de chaque série
  const [setAnimations, setSetAnimations] = useState<{ [key: number]: Animated.Value }>({});
  
  // États pour les animations des exercices
  const [exerciseProgressAnimations, setExerciseProgressAnimations] = useState<{ [key: string]: Animated.Value }>({});
  const [exerciseBounceAnimations, setExerciseBounceAnimations] = useState<{ [key: string]: Animated.Value }>({});
  // État pour contrôler l'affichage des checkmarks
  const [completedCheckmarks, setCompletedCheckmarks] = useState<{ [key: string]: boolean }>({});
  
  const { updateWorkout } = useWorkout();
  const { 
    activeWorkout, 
    startWorkout, 
    finishWorkout, 
    updateTrackingData, 
    updateElapsedTime, 
    resumeWorkout, 
    isTrackingWorkout
  } = useActiveWorkout();
  
  // Référence aux exerciseSets basée sur le contexte et l'exercice sélectionné
  const [exerciseSets, setExerciseSets] = useState<TrackingSet[]>([]);

  // Récupération du contexte de timer de repos
  const { startRestTimer, resetTimer, stopTimer } = useRestTimer();
  
  // Pour la navigation
  const navigation = useNavigation<NavigationProp<RootStackParamList | WorkoutStackParamList>>();

  // Récupération du contexte de streak
  const { updateStreakOnCompletion, getWorkoutStreak } = useStreak();
  
  // Récupération du contexte d'historique des workouts
  const { getPersonalRecords: getHistoryPersonalRecords, addCompletedWorkout } = useWorkoutHistory();
  
  // État pour les records personnels améliorés
  const enhancedPersonalRecords = useEnhancedPersonalRecords();
  
  // Mémoriser les records originaux pour les comparaisons (avant le début de la séance)
  const [originalRecords, setOriginalRecords] = useState<EnhancedPersonalRecords>({});
  
  // Suivre les records maximaux atteints pendant la séance en cours
  // Seuls les PR de poids tiendront compte de cet état (les PR de répétitions utilisent toujours originalRecords)
  const [currentSessionMaxWeights, setCurrentSessionMaxWeights] = useState<{[exerciseName: string]: number}>({});
  
  // États pour les PR
  const [prResults, setPrResults] = useState<{
    setIndex: number;
    weightPR?: { isNew: boolean; weight: number } | null;
    repsPR?: { isNew: boolean; weight: number; reps: number; previousReps: number } | null;
    isWeightPR?: boolean;
    isRepsPR?: boolean;
  } | null>(null);
  
  // État pour stocker les PR par exercice
  const [exercisePRResults, setExercisePRResults] = useState<{
    [exerciseId: string]: {
      setIndex: number;
      weightPR?: { isNew: boolean; weight: number } | null;
      repsPR?: { isNew: boolean; weight: number; reps: number; previousReps: number } | null;
      isWeightPR?: boolean;
      isRepsPR?: boolean;
    } | null
  }>({});

  // Référence pour l'animation du badge PR
  const prBadgeAnim = useRef(new Animated.Value(0)).current;

  // Fonction pour animer le badge PR
  const animatePrBadge = () => {
    // Reset animation
    prBadgeAnim.setValue(0);
    
    Animated.sequence([
      // Scale up
      Animated.timing(prBadgeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      // Hold
      Animated.delay(1000),
      // Scale down
      Animated.timing(prBadgeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      // Reset PR results after animation completes - mais seulement si le composant est monté
      if (isMounted.current) {
        setTimeout(() => {
          if (isMounted.current) {
            setPrResults(null);
          }
        }, 300);
      }
    });
  };
  
  // Initialiser les animations pour chaque série
  useEffect(() => {
    if (modalMode === 'exercise-tracking' && exerciseSets.length > 0) {
      const animations: { [key: number]: Animated.Value } = {};
      exerciseSets.forEach((_, index) => {
        animations[index] = new Animated.Value(1);
      });
      setSetAnimations(animations);
    }
  }, [modalMode, exerciseSets.length]);

  // Chargement initial des exercices
  useEffect(() => {
    if (workout && visible) {
      setExercises(workout.exercises || []);
      
      // Si une séance est déjà en cours pour ce workout, mettre à jour le mode
      if (isTrackingWorkout && activeWorkout?.workoutId === workout.id) {
        // Ne rien faire ici, le timer est géré par le contexte global
      } else {
        // Réinitialiser les modes si aucune séance n'est en cours
        setModalMode('workout');
      }
    }
  }, [workout, visible, isTrackingWorkout, activeWorkout?.workoutId]);

  // Fonction pour sauvegarder les modifications
  const handleSaveChanges = () => {
    if (!workout) return;
    
    const updatedWorkout = {
      ...workout,
      exercises: exercises,
      updatedAt: new Date().toISOString()
    };
    
    updateWorkout(updatedWorkout);
    setHasUnsavedChanges(false);
  };

  // Fonction pour passer au mode de sélection d'exercices
  const handleAddExercise = () => {
    setModalMode('exercise-selection');
    setSearchQuery('');
    setSelectedExercises([]);
  };

  // Fonction pour ajouter les exercices sélectionnés
  const handleExercisesSelected = () => {
    // Ajouter seulement les exercices qui ne sont pas déjà présents dans le workout
    const newExercises = selectedExercises.filter(
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
        console.log(`[handleExercisesSelected] Workout saved with ${newExercises.length} new exercises`);
      }
      
      setHasUnsavedChanges(false); // Les changements sont maintenant sauvegardés
    }
    
    // Retour au mode affichage de workout
    setModalMode('workout');
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
      console.log(`[handleRemoveExercise] Workout saved after removing exercise`);
    }
    
    setHasUnsavedChanges(false); // Les changements sont maintenant sauvegardés
  };

  // Fonction pour remplacer un exercice
  const handleReplaceExercise = () => {
    // Démarrer le processus de remplacement si un exercice est sélectionné
    if (currentExercise) {
      startReplaceExercise(currentExercise.id);
      setSettingsModalVisible(false); // Fermer la modale des paramètres
    }
  };

  // Fonction pour démarrer le processus de remplacement d'un exercice
  const startReplaceExercise = (exerciseId: string) => {
    setExerciseToReplaceId(exerciseId);
    setModalMode('exercise-replacement');
    setSearchQuery('');
    setSelectedExercises([]);
    setSelectedTags([]);
  };

  // Fonction pour finaliser le remplacement d'un exercice
  const handleExerciseReplaced = () => {
    // Vérifier qu'on a bien un exercice à remplacer et un nouvel exercice sélectionné
    if (exerciseToReplaceId && selectedExercises.length === 1) {
      const newExercise = selectedExercises[0];
      
      // Mettre à jour la liste des exercices en remplaçant l'ancien par le nouveau
      const updatedExercises = exercises.map(ex => 
        ex.id === exerciseToReplaceId 
          ? { ...newExercise, id: exerciseToReplaceId } // Conserve l'ID original pour maintenir les références
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
        console.log(`[handleExerciseReplaced] Workout saved after replacing exercise`);
      }
      
      setHasUnsavedChanges(false); // Les changements sont maintenant sauvegardés
    }
    
    // Réinitialiser et retourner au mode workout
    setExerciseToReplaceId(null);
    setModalMode('workout');
  };

  // Fonction pour démarrer une séance
  const handleStartWorkout = async () => {
    if (!workout) return;
    
    // S'assurer que les records sont bien chargés avant de commencer
    await enhancedPersonalRecords.loadRecords();
    
    // Capturer les records actuels qui serviront de référence pour toute la séance
    // Utiliser une copie profonde pour éviter toute référence partagée
    const capturedRecords = JSON.parse(JSON.stringify(enhancedPersonalRecords.records));
    console.log('[handleStartWorkout] Capturing original records:', Object.keys(capturedRecords));
    Object.entries(capturedRecords).forEach(([exerciseName, record]: [string, any]) => {
      console.log(`[handleStartWorkout] ${exerciseName}: maxWeight=${record.maxWeight}kg`);
    });
    
    setOriginalRecords(capturedRecords);
    
    // Réinitialiser les records de séance
    setCurrentSessionMaxWeights({});
    
    // Démarrer une nouvelle séance via le contexte
    // Le contexte gère maintenant le timer
    // IMPORTANT: Utiliser l'état local 'exercises' et non 'workout.exercises'
    // pour inclure les exercices ajoutés récemment
    console.log('[handleStartWorkout] Starting workout with', exercises.length, 'exercises');
    startWorkout(workout.id, workout.name, exercises);
    updateElapsedTime(0);
  };

  // Fonction pour finir la séance
  const handleFinishWorkout = () => {
    setIsFinishModalVisible(true);
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
            if (prResults) {
              safeSetPrResults(null);
              
              // Pas besoin de recharger les records, il suffit de réinitialiser l'UI
              // Les records permanents n'ont jamais été sauvegardés, donc rien à annuler côté stockage
              console.log("Personal record UI display reset")
            }
            
            // Réinitialiser tous les PR stockés par exercice
            setExercisePRResults({});
            
            // Réinitialiser les records de séance
            setCurrentSessionMaxWeights({});
            
            // Terminer la séance sans sauvegarder
            // NOTE: La streak n'est pas mise à jour lors d'un abandon de workout
            // Les streaks sont uniquement mises à jour lors d'un "Log Workout" complet
            if (finishWorkout) {
              await finishWorkout(false); // Ne pas mettre à jour la streak lors d'un abandon
            }
            // Fermer la modale
            setIsFinishModalVisible(false);
            // Fermer la modale principale
            onClose();
          }
        }
      ]
    );
  };

  const handleLogWorkout = async () => {
    console.log("handleLogWorkout called", { activeWorkout, workout });
    if (!activeWorkout || !workout) {
      console.log("No activeWorkout or workout", { activeWorkout, workout });
      return;
    }
    
    // Arrêter complètement le timer de repos
    if (stopTimer) {
      stopTimer();
    }
    
    try {
      // 🔧 FIX: S'assurer que toutes les données de tracking sont sauvegardées avant de terminer
      // Sauvegarder une dernière fois les données de l'exercice actuellement sélectionné
      if (selectedExerciseId && exerciseSets.length > 0) {
        const completedCount = exerciseSets.filter(set => set.completed).length;
        if (ENABLE_DIAGNOSTIC_LOGS) console.log(`🔧 [FIX] Final save of tracking data for current exercise ${selectedExerciseId}: ${completedCount} completed sets`);
        updateTrackingData(selectedExerciseId, exerciseSets, completedCount);
      }
      
      // 🔧 FIX: Vérifier et initialiser trackingData pour tous les exercices du workout
      exercises.forEach(exercise => {
        if (!activeWorkout.trackingData[exercise.id]) {
          if (ENABLE_DIAGNOSTIC_LOGS) console.log(`🔧 [FIX] Initializing missing trackingData for exercise ${exercise.name} (${exercise.id})`);
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
      if (prResults && selectedExerciseId) {
        const exercise = exercises.find(ex => ex.id === selectedExerciseId);
        if (exercise) {
          const set = exerciseSets[prResults.setIndex];
          if (set) {
            const weight = parseInt(set.weight);
            const reps = parseInt(set.reps);
            
            // Vérifier que c'est vraiment un PR avant de sauvegarder
            if (prResults.weightPR?.isNew && weight > 0 && reps > 0) {
              console.log(`[WorkoutDetailModal] Saving current display PR: ${exercise.name} ${weight}kg x ${reps}`);
              prSavePromises.push(
                enhancedPersonalRecords.updateRecords(
                  exercise.name,
                  weight,
                  reps,
                  new Date().toISOString()
                )
              );
            }
            
            // Pour les PR de reps, vérifier aussi qu'ils sont valides
            if (prResults.repsPR?.isNew && weight > 0 && reps > 0) {
              console.log(`[WorkoutDetailModal] Saving current display reps PR: ${exercise.name} ${weight}kg x ${reps}`);
              prSavePromises.push(
                enhancedPersonalRecords.updateRecords(
                  exercise.name,
                  weight,
                  reps,
                  new Date().toISOString()
                )
              );
            }
          }
        }
      }
      
      // 2. Ensuite sauvegarder tous les PRs stockés par exercice
      console.log(`[WorkoutDetailModal] Processing ${Object.keys(exercisePRResults).length} stored PRs...`);
      Object.keys(exercisePRResults).forEach((key) => {
        const [exerciseId, setKey] = key.split('_set_');
        const exercise = exercises.find(ex => ex.id === exerciseId);
        const prResult = exercisePRResults[key];
        
        if (exercise && prResult) {
          const trackingData = activeWorkout.trackingData[exerciseId];
          
          if (trackingData && trackingData.sets) {
            const setIndex = parseInt(setKey);
            const set = trackingData.sets[setIndex];
            
            if (set && set.completed) { // S'assurer que le set est complété
              const weight = parseInt(set.weight);
              const reps = parseInt(set.reps);
              
              // Vérifier que c'est vraiment un PR avant de sauvegarder
              if ((prResult.weightPR?.isNew || prResult.repsPR?.isNew) && weight > 0 && reps > 0) {
                console.log(`[WorkoutDetailModal] Saving stored PR: ${exercise.name} ${weight}kg x ${reps} (weightPR: ${!!prResult.weightPR?.isNew}, repsPR: ${!!prResult.repsPR?.isNew})`);
                prSavePromises.push(
                  enhancedPersonalRecords.updateRecords(
                    exercise.name,
                    weight,
                    reps,
                    new Date().toISOString()
                  )
                );
              }
            }
          }
        }
      });
      
      // Attendre que toutes les mises à jour soient terminées
      if (prSavePromises.length > 0) {
        console.log(`[WorkoutDetailModal] Saving ${prSavePromises.length} personal records...`);
        await Promise.all(prSavePromises);
        console.log(`[WorkoutDetailModal] ${prSavePromises.length} personal records saved permanently`);
        
        // Recharger les records pour assurer la cohérence dans toute l'application
        await enhancedPersonalRecords.loadRecords();
      } else {
        console.log(`[WorkoutDetailModal] No personal records to save`);
      }
      
      // Réinitialiser l'état PR après sauvegarde
      safeSetPrResults(null);
      
      // Réinitialiser tous les PR stockés par exercice
      setExercisePRResults({});
      
      // Réinitialiser les records de séance
      setCurrentSessionMaxWeights({});
      
      // On supprime l'appel à updateStreakOnCompletion ici car il est déjà fait dans finishWorkout
      // via ActiveWorkoutContext
      
      // Création de l'objet CompletedWorkout
      console.log("Creating CompletedWorkout");
      
      // 🔧 DIAGNOSTIC: Vérifier l'état de trackingData avant création
      if (ENABLE_DIAGNOSTIC_LOGS) {
        console.log('🔍 [DIAGNOSTIC] activeWorkout.trackingData:', activeWorkout.trackingData);
        console.log('🔍 [DIAGNOSTIC] exercises to process:', exercises.map(ex => ({ id: ex.id, name: ex.name })));
      }
      
      const newCompletedWorkout: CompletedWorkout = {
        id: generateId(),
        workoutId: workout.id,
        name: workout.name,
        date: new Date().toISOString(),
        duration: activeWorkout.elapsedTime,
        photo: 'https://via.placeholder.com/114x192/242526/FFFFFF?text=Workout',
        exercises: exercises.map(exercise => {
          const trackingData = activeWorkout.trackingData[exercise.id];
          const sets = trackingData?.sets || [];
          
          // 🔧 DIAGNOSTIC: Logger les données de chaque exercice
          if (ENABLE_DIAGNOSTIC_LOGS) {
            console.log(`🔍 [DIAGNOSTIC] Processing exercise "${exercise.name}" (${exercise.id}):`);
            console.log(`🔍 [DIAGNOSTIC] - trackingData exists: ${!!trackingData}`);
            console.log(`🔍 [DIAGNOSTIC] - sets count: ${sets.length}`);
            console.log(`🔍 [DIAGNOSTIC] - completed sets: ${sets.filter(s => s.completed).length}`);
            console.log(`🔍 [DIAGNOSTIC] - sets data:`, sets);
          }
          
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
          
          if (ENABLE_DIAGNOSTIC_LOGS) {
            console.log(`🔍 [DIAGNOSTIC] - Final exercise result for "${exercise.name}":`, {
              setsCount: exerciseResult.sets.length,
              completedSetsCount: exerciseResult.sets.filter(s => s.completed).length,
              hasPersonalRecord: !!personalRecord
            });
          }
          
          return exerciseResult;
        }),
        notes: workout.notes
        // La streak sera récupérée et affichée directement dans WorkoutSummaryScreen
      };
      
      // 🔧 DIAGNOSTIC: Vérifier le workout final avant sauvegarde
      if (ENABLE_DIAGNOSTIC_LOGS) {
        console.log('🔍 [DIAGNOSTIC] Final CompletedWorkout before save:');
        console.log('🔍 [DIAGNOSTIC] - Total exercises:', newCompletedWorkout.exercises.length);
        console.log('🔍 [DIAGNOSTIC] - Exercises with completed sets:', 
          newCompletedWorkout.exercises.filter(ex => ex.sets.some(s => s.completed)).length);
        console.log('🔍 [DIAGNOSTIC] - Exercises details:', 
          newCompletedWorkout.exercises.map(ex => ({ 
            name: ex.name, 
            totalSets: ex.sets.length, 
            completedSets: ex.sets.filter(s => s.completed).length 
          })));
      }
      
      // Utiliser le contexte pour sauvegarder le workout terminé (cela gère automatiquement les streaks)
      console.log("Saving completed workout via WorkoutHistoryContext");
      await addCompletedWorkout(newCompletedWorkout, workout);
      console.log("Completed workout saved successfully via context");
      
      // Fermer la modale de confirmation
      setIsFinishModalVisible(false);
      
      // Fermer la modale principale
      onClose();
      
      // Terminer la séance active (sans mettre à jour la streak car c'est déjà fait dans addCompletedWorkout)
      await finishWorkout(false); // Passer false car la streak est déjà mise à jour par addCompletedWorkout
      
      // Naviguer vers l'écran de récapitulatif indépendant
      console.log('WorkoutDetailModal - handleLogWorkout - Navigating with workout:', JSON.stringify(newCompletedWorkout));
      
      // Utiliser CommonActions pour une navigation plus prévisible
      // Naviguer vers la pile indépendante SummaryFlow qui cachera la barre d'onglets
      navigation.dispatch(
        CommonActions.navigate('SummaryFlow', { 
          screen: 'WorkoutSummary',
          params: { workout: newCompletedWorkout }
        })
      );
      
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
    const originalRecord = originalRecords[exercise.name];
    
    // Si pas de record original, c'est le premier workout pour cet exercice
    if (!originalRecord) {
      // Vérifier si c'est vraiment le premier workout en consultant l'historique
      try {
        const historyRecords = getHistoryPersonalRecords(exercise.name);
        
        // S'il y a des records dans l'historique mais pas dans originalRecords,
        // cela indique un problème de synchronisation - ne pas afficher de PR
        if (historyRecords.maxWeight > 0) {
          // Il y a des records historiques, comparer avec eux
          const isNewRecord = maxWeight > historyRecords.maxWeight || 
            (maxWeight === historyRecords.maxWeight && maxReps > historyRecords.maxReps);
          
          return isNewRecord ? { maxWeight, maxReps } : undefined;
        }
        
        // Vraiment premier workout pour cet exercice - pas de PR affiché
        // (on évite de spammer l'utilisateur avec des PR pour chaque nouvel exercice)
        return undefined;
      } catch {
        // En cas d'erreur, être conservateur et ne pas afficher de PR
        return undefined;
      }
    }
    
    // Comparer avec les records originaux (début de séance)
    const isNewRecord = maxWeight > originalRecord.maxWeight;
    
    // Retourner le PR seulement si c'est vraiment un nouveau record
    return isNewRecord ? { maxWeight, maxReps } : undefined;
  };

  // Fonction pour naviguer vers le tracking d'un exercice
  const handleExerciseTracking = (exerciseId: string) => {
    if (isTrackingWorkout && activeWorkout?.workoutId === workout?.id) {
      // Sauvegarder les PR actuels dans l'exercice actuel avant de changer
      if (selectedExerciseId && prResults) {
        setExercisePRResults(prev => ({
          ...prev,
          [`${selectedExerciseId}_set_${prResults.setIndex}`]: prResults
        }));
      }
      
      // Réinitialiser le PR affiché (sera mis à jour par SetRow si nécessaire)
      setPrResults(null);
      
      setSelectedExerciseId(exerciseId);
      
      // Utiliser les données de tracking existantes ou en créer de nouvelles
      const exercise = currentExercises.find(ex => ex.id === exerciseId);
      
      if (activeWorkout && !activeWorkout.trackingData[exerciseId] && exercise) {
        const initialSets = Array(exercise.sets || 1).fill(0).map(() => ({
          completed: false,
          weight: '',
          reps: '',
        }));
        
        updateTrackingData(exerciseId, initialSets, 0);
        setExerciseSets(initialSets);
      } else if (activeWorkout && activeWorkout.trackingData[exerciseId]) {
        setExerciseSets(activeWorkout.trackingData[exerciseId]?.sets || []);
      }
      
      setModalMode('exercise-tracking');
    }
  };

  // Fonction pour revenir au mode workout
  const handleBackToWorkout = () => {
    // Sauvegarder les PR de l'exercice actuel avant de retourner à la liste
    if (selectedExerciseId && prResults) {
      safeSetExercisePRResults(selectedExerciseId, prResults.setIndex, prResults);
    }
    
    // Réinitialiser les PR actuels (car on n'est plus sur un exercice spécifique)
    safeSetPrResults(null);
    
    // Sauvegarder les modifications de tracking actuelles avant de revenir
    if (selectedExerciseId) {
      const newSets = [...exerciseSets];
      const completedCount = newSets.filter(set => set.completed).length;
      
      updateTrackingData(selectedExerciseId, newSets, completedCount);
      
      // Préparer l'animation pour l'exercice
      const exercise = currentExercises.find(ex => ex.id === selectedExerciseId);
      if (exercise) {
        const isCompleted = completedCount === exercise.sets;
        const progress = completedCount / exercise.sets;
        
        // 🔧 FIX: Mise à jour immédiate de l'état visuel sans délai
        // Créer ou mettre à jour l'animation de progression avec la valeur correcte immédiatement
        if (!exerciseProgressAnimations[selectedExerciseId]) {
          setExerciseProgressAnimations(prev => ({
            ...prev,
            [selectedExerciseId]: new Animated.Value(progress) // Valeur correcte immédiatement
          }));
        } else {
          exerciseProgressAnimations[selectedExerciseId].setValue(progress); // Valeur correcte immédiatement
        }
        
        // Créer ou réinitialiser l'animation de rebond
        if (!exerciseBounceAnimations[selectedExerciseId]) {
          setExerciseBounceAnimations(prev => ({
            ...prev,
            [selectedExerciseId]: new Animated.Value(1)
          }));
        } else {
          exerciseBounceAnimations[selectedExerciseId].setValue(1);
        }
        
        // 🔧 FIX: Mise à jour immédiate du checkmark pour les exercices complétés
        if (isCompleted) {
          setCompletedCheckmarks(prev => ({
            ...prev,
            [selectedExerciseId]: true
          }));
          
          // Animation de rebond seulement si pas déjà complété avant
          const wasAlreadyCompleted = completedCheckmarks[selectedExerciseId];
          if (!wasAlreadyCompleted) {
            setTimeout(() => {
              if (exerciseBounceAnimations[selectedExerciseId]) {
                Animated.sequence([
                  Animated.timing(exerciseBounceAnimations[selectedExerciseId], {
                    toValue: 1.1,
                    duration: 100,
                    useNativeDriver: true,
                  }),
                  Animated.timing(exerciseBounceAnimations[selectedExerciseId], {
                    toValue: 0.95,
                    duration: 100,
                    useNativeDriver: true,
                  }),
                  Animated.timing(exerciseBounceAnimations[selectedExerciseId], {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                  }),
                ]).start();
              }
            }, 50); // Délai réduit pour la célébration
          }
        } else {
          // Exercice non complété, s'assurer que le checkmark est caché
          setCompletedCheckmarks(prev => ({
            ...prev,
            [selectedExerciseId]: false
          }));
        }
      }
    }
    
    setModalMode('workout');
    setSelectedExerciseId(null);
  };

  // Fonction pour animer le rebond d'une série
  const animateSetBounce = (index: number) => {
    if (setAnimations[index]) {
      try {
        // Réinitialiser l'animation si nécessaire
        setAnimations[index].setValue(1);
        
        // Séquence d'animation de rebond
        Animated.sequence([
          // Agrandir légèrement
          Animated.timing(setAnimations[index], {
            toValue: 1.05,
            duration: 100,
            useNativeDriver: true,
          }),
          // Revenir à une taille légèrement plus petite (pour l'effet de rebond)
          Animated.timing(setAnimations[index], {
            toValue: 0.97,
            duration: 100,
            useNativeDriver: true,
          }),
          // Revenir à la taille normale
          Animated.timing(setAnimations[index], {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      } catch (error) {
        console.log('Animation error:', error);
      }
    }
  };

  // Fonction pour gérer le toggle d'une série (completed/uncompleted)
  const handleSetToggle = (index: number) => {
    // Animer la série au clic
    Animated.sequence([
      Animated.timing(setAnimations[index], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(setAnimations[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();

    // Mettre à jour l'état des sets
    const newSets = [...exerciseSets];
    const currentlyCompleted = newSets[index].completed;
    const newCompleted = !currentlyCompleted;
    
    newSets[index] = {
      ...newSets[index],
      completed: newCompleted
    };

    // Compter le nombre de sets complétés
    const completedCount = newSets.filter(set => set.completed).length;
    
    // Mettre à jour les données de tracking
    if (selectedExerciseId) {
      updateTrackingData(selectedExerciseId, newSets, completedCount);
      setExerciseSets(newSets);
      
      // On vérifie si c'est un PR seulement quand la série est complétée (pas quand on décoche)
      if (newCompleted) {
        // Trouver l'exercice correspondant
        const exercise = currentExercises.find(ex => ex.id === selectedExerciseId);
        
        if (exercise) {
          // Démarrer ou réinitialiser le timer de repos
          resetTimer(exercise);
          
          // Vérifier si c'est un PR (seulement si weight et reps sont renseignés)
          const weight = parseInt(newSets[index].weight) || 0;
          const reps = parseInt(newSets[index].reps) || 0;
          
          console.log(`🔍 [PR_DETECTION] ${exercise.name} set ${index}: weight=${weight}kg, reps=${reps}`);
          
          if (weight > 0 && reps > 0) {
            // Utiliser checkSessionWeightPR qui prend en compte le record de la session en cours
            const weightPR = checkSessionWeightPR(exercise.name, weight);
            
            // Vérifier les repetitions PR par rapport aux records originaux
            const repsPR = checkOriginalRepsPR(exercise.name, weight, reps);
            
            console.log(`🔍 [PR_DETECTION] ${exercise.name}: weightPR=${!!weightPR}, repsPR=${!!repsPR}`);
            
            // Si nous avons un nouveau PR de poids pour la session, mettre à jour et supprimer les anciens PR
            if (weightPR) {
              // 1. Mettre à jour le record maximum de poids de la séance
              safeUpdateSessionWeight(exercise.name, weight);
              
              // 2. Supprimer tous les stickers "NEW PR" précédents pour cet exercice
              // Parcourir tous les PR enregistrés et garder uniquement ceux qui n'ont pas de weightPR
              if (selectedExerciseId) {
                const updatedPRResults = { ...exercisePRResults };
                
                // Pour chaque clé de PR existante pour cet exercice
                Object.keys(updatedPRResults).forEach(key => {
                  if (key.startsWith(selectedExerciseId) && updatedPRResults[key]?.weightPR) {
                    // Créer une nouvelle entrée sans le weightPR (garder seulement repsPR s'il existe)
                    if (updatedPRResults[key]?.repsPR) {
                      updatedPRResults[key] = {
                        ...updatedPRResults[key],
                        weightPR: null
                      };
                    } else {
                      // S'il n'y a pas de repsPR, supprimer complètement l'entrée
                      delete updatedPRResults[key];
                    }
                  }
                });
                
                // Mettre à jour l'état avec les PR mis à jour
                setExercisePRResults(updatedPRResults);
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
              safeSetPrResults(prData);
              
              // Enregistrer le badge dans les résultats PR de l'exercice
              if (selectedExerciseId) {
                safeSetExercisePRResults(selectedExerciseId, index, prData);
              }
            }
          }
        }
      }
    }
  };

  // Fonction pour mettre à jour le temps de repos d'un exercice
  const handleRestTimeUpdate = (seconds: number) => {
    if (!currentExercise) return;
    
    // Mettre à jour l'exercice actuel avec le nouveau temps de repos
    const updatedExercise = {
      ...currentExercise,
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
      console.log(`[handleRestTimeUpdate] Workout saved after updating rest time`);
    }
    
    setHasUnsavedChanges(false); // Les changements sont maintenant sauvegardés
    
    // Si on est en tracking, mettre à jour le reset timer dans le contexte
    if (isTrackingWorkout) {
      resetTimer(updatedExercise);
    }
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

  // Filter exercises based on search query and selected tags
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

  // Group exercises by first letter
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

  const toggleExerciseSelection = (exercise: Exercise) => {
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
  };

  const renderSectionHeader = ({ letter }: { letter: string }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{letter}</Text>
    </View>
  );

  const renderExerciseItem = (exercise: Exercise) => {
    const isSelected = selectedExercises.some(ex => ex.id === exercise.id);
    
    return (
      <TouchableOpacity 
        style={styles.selectionExerciseItem}
        onPress={() => toggleExerciseSelection(exercise)}
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
          
          <Text style={styles.selectionExerciseName}>{exercise.name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Extraire tous les tags uniques des exercices
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

  // Fonction pour mettre à jour les tags sélectionnés
  const handleTagsSelected = (tags: string[]) => {
    setSelectedTags(tags);
  };

  // Ouvrir la modale de filtres
  const handleOpenFilterModal = () => {
    setIsFilterModalVisible(true);
  };

  // Fonction pour réinitialiser les filtres
  const handleResetFilters = (event: any) => {
    event.stopPropagation(); // Empêcher l'ouverture de la modale
    setSelectedTags([]);
  };

  // Fonction pour obtenir le texte du bouton de filtre
  const getFilterButtonText = () => {
    if (selectedTags.length === 0) {
      return "Filter by";
    } else if (selectedTags.length === 1) {
      return selectedTags[0];
    } else {
      return `${selectedTags.length} filters`;
    }
  };

  // Ajouter une fonction pour supprimer une série
  const handleRemoveSet = (index: number) => {
    // Ne pas permettre de supprimer la dernière série
    if (exerciseSets.length <= 1) return;
    
    // Vérifier si la série à supprimer avait un PR
    const hasPR = prResults && prResults.setIndex === index;
    
    // Mettre à jour l'état local des sets
    const newSets = exerciseSets.filter((_, i) => i !== index);
    setExerciseSets(newSets);
    
    // Si cette série avait un PR actif (affiché), le supprimer
    if (hasPR && isMounted.current) {
      safeSetPrResults(null);
    }
    
    // Supprimer tous les PR associés à cette série de exercisePRResults
    if (selectedExerciseId && isMounted.current) {
      setExercisePRResults(prev => {
        const newResults = { ...prev };
        // Supprimer l'entrée spécifique à cette série
        delete newResults[`${selectedExerciseId}_set_${index}`];
        
        // Décaler les indices des séries suivantes pour éviter le problème de persistance
        for (let i = index + 1; i < exerciseSets.length; i++) {
          if (newResults[`${selectedExerciseId}_set_${i}`]) {
            // Déplacer les PR vers l'index précédent
            newResults[`${selectedExerciseId}_set_${i-1}`] = newResults[`${selectedExerciseId}_set_${i}`];
            // Et supprimer l'ancien index
            delete newResults[`${selectedExerciseId}_set_${i}`];
          }
        }
        return newResults;
      });
    }
    
    // Mettre à jour le nombre total de séries pour l'exercice
    if (selectedExerciseId) {
      const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId);
      if (selectedExercise) {
        const updatedExercise = {
          ...selectedExercise,
          sets: Math.max(1, (selectedExercise.sets || 0) - 1)
        };
        const updatedExercises = exercises.map(ex => ex.id === selectedExerciseId ? updatedExercise : ex);
        setExercises(updatedExercises);
        
        // Sauvegarder immédiatement le workout
        if (workout) {
          const updatedWorkout = {
            ...workout,
            exercises: updatedExercises,
            updatedAt: new Date().toISOString()
          };
          updateWorkout(updatedWorkout);
          console.log(`[handleRemoveSet] Workout saved after removing set`);
        }
        
        // Mettre à jour les données de tracking avec les sets restants
        const completedCount = newSets.filter(set => set.completed).length;
        updateTrackingData(selectedExerciseId, newSets, completedCount);
      }
    }
  };

  useEffect(() => {
    if (modalMode === 'exercise-tracking' && selectedExerciseId && activeWorkout) {
      // Lors du passage en mode tracking d'exercice, on charge les données existantes
      setExerciseSets(activeWorkout.trackingData[selectedExerciseId]?.sets || []);
    }
  }, [modalMode, selectedExerciseId]);
  
  // Sauvegarder les données de tracking lorsqu'on change d'exercice
  useEffect(() => {
    // Sauvegarder les données du précédent exercice si nécessaire
    if (modalMode === 'exercise-tracking' && selectedExerciseId && exerciseSets.length > 0) {
      const completedCount = exerciseSets.filter(set => set.completed).length;
      
      updateTrackingData(selectedExerciseId, exerciseSets, completedCount);
    }
  }, [selectedExerciseId, exerciseSets]);

  // Ajouter un effet de nettoyage pour les animations
  useEffect(() => {
    return () => {
      // Nettoyer les animations lors du démontage du composant
      for (const key in exerciseProgressAnimations) {
        if (exerciseProgressAnimations[key]) {
          exerciseProgressAnimations[key].stopAnimation();
        }
      }
      for (const key in exerciseBounceAnimations) {
        if (exerciseBounceAnimations[key]) {
          exerciseBounceAnimations[key].stopAnimation();
        }
      }
      for (const key in setAnimations) {
        if (setAnimations[key]) {
          setAnimations[key].stopAnimation();
        }
      }
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
    if (isTrackingWorkout && exercises.length > 0 && visible) {
      // Initialiser les animations pour tous les exercices
      const progressAnimations: { [key: string]: Animated.Value } = {};
      const bounceAnimations: { [key: string]: Animated.Value } = {};
      
      exercises.forEach(exercise => {
        const completedSets = activeWorkout?.trackingData[exercise.id]?.completedSets || 0;
        const progress = completedSets / exercise.sets;
        
        // Créer une nouvelle animation à 0 pour permettre l'animation progressive
        progressAnimations[exercise.id] = new Animated.Value(0);
        bounceAnimations[exercise.id] = new Animated.Value(1);
        
        // Animer immédiatement jusqu'à la valeur actuelle
        Animated.timing(progressAnimations[exercise.id], {
          toValue: progress,
          duration: 600,
          useNativeDriver: false,
        }).start();
      });
      
      setExerciseProgressAnimations(progressAnimations);
      setExerciseBounceAnimations(bounceAnimations);
    }
  }, [isTrackingWorkout, exercises.length, visible, activeWorkout?.workoutId]);

  const [isFinishModalVisible, setIsFinishModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFinishModalVisible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [isFinishModalVisible]);

  // Fonction pour obtenir le texte de progression pour un exercice
  const getExerciseProgressText = (exercise: Exercise) => {
    if (!isTrackingWorkout) {
      return exercise.tracking === 'trackedOnSets' ? 'Tracked on sets' : 'Tracked on time';
    }
    const completedSets = activeWorkout?.trackingData[exercise.id]?.completedSets || 0;
    return `${completedSets} of ${exercise.sets} sets completed`;
  };

  // Calcule le pourcentage de complétion d'un exercice
  const getExerciseProgress = (exercise: Exercise) => {
    const completedSets = activeWorkout?.trackingData[exercise.id]?.completedSets || 0;
    return completedSets / exercise.sets;
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
    if (exercise.tracking === "trackedOnTime" || exercise.duration) {
      return "Tracked on time";
    } else if (exercise.tracking === "trackedOnSets" || exercise.sets > 1) {
      return "Tracked on sets";
    } else {
      return "Tracked on rounds";
    }
  };

  // États pour les modales d'exercice
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise | undefined>(undefined);
  const [openTimerDirectly, setOpenTimerDirectly] = useState(false);

  // Utiliser les exercices de activeWorkout quand on est en mode tracking, sinon utiliser l'état local
  const currentExercises = isTrackingWorkout && activeWorkout?.exercises 
    ? activeWorkout.exercises 
    : exercises;

  // Obtenir l'exercice sélectionné
  const selectedExercise = selectedExerciseId 
    ? currentExercises.find(ex => ex.id === selectedExerciseId) 
    : null;

  // Fonction pour ouvrir la modal de paramètres d'exercice
  const handleOpenSettings = (exercise: Exercise) => {
    setCurrentExercise(exercise);
    setSettingsModalVisible(true);
    // Réinitialiser pour ouvrir en mode normal (menu principal)
    setOpenTimerDirectly(false);
  };

  // Fonction pour ouvrir la modal de paramètres d'exercice
  const handleExerciseSettings = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (exercise) {
      handleOpenSettings(exercise);
    }
  };

  // Fonction pour mettre à jour le poids d'une série
  const handleWeightChange = (index: number, value: string) => {
    // Mettre à jour l'état local des sets
    const newSets = [...exerciseSets];
    newSets[index] = {
      ...newSets[index],
      weight: value
    };
    setExerciseSets(newSets);
    
    // Mettre à jour immédiatement les données de tracking
    if (selectedExerciseId) {
      const completedCount = newSets.filter(set => set.completed).length;
      updateTrackingData(selectedExerciseId, newSets, completedCount);
    }
  };

  // Fonction pour mettre à jour les répétitions d'une série
  const handleRepsChange = (index: number, value: string) => {
    // Mettre à jour l'état local des sets
    const newSets = [...exerciseSets];
    newSets[index] = {
      ...newSets[index],
      reps: value
    };
    setExerciseSets(newSets);
    
    // Mettre à jour immédiatement les données de tracking
    if (selectedExerciseId) {
      const completedCount = newSets.filter(set => set.completed).length;
      updateTrackingData(selectedExerciseId, newSets, completedCount);
    }
  };

  // Fonction pour ajouter une série
  const handleAddSet = () => {
    // Mettre à jour l'état local des sets
    const newSets = [
      ...exerciseSets,
      {
        completed: false,
        weight: '',
        reps: ''
      }
    ];
    setExerciseSets(newSets);
    
    // Mettre à jour le nombre total de séries pour l'exercice
    if (selectedExerciseId) {
      const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId);
      if (selectedExercise) {
        const updatedExercise = {
          ...selectedExercise,
          sets: (selectedExercise.sets || 0) + 1
        };
        const updatedExercises = exercises.map(ex => ex.id === selectedExerciseId ? updatedExercise : ex);
        setExercises(updatedExercises);
        
        // Sauvegarder immédiatement le workout
        if (workout) {
          const updatedWorkout = {
            ...workout,
            exercises: updatedExercises,
            updatedAt: new Date().toISOString()
          };
          updateWorkout(updatedWorkout);
          console.log(`[handleAddSet] Workout saved after adding set`);
        }
        
        // Mettre à jour les données de tracking
        updateTrackingData(selectedExerciseId, newSets, 0);
      }
    }
  };

  // Gestion de la fermeture avec sauvegarde automatique
  const handleClose = () => {
    // Si on est en mode sélection ou remplacement, retourner au mode workout
    if (modalMode === 'exercise-selection' || modalMode === 'exercise-replacement') {
      setModalMode('workout');
      setExerciseToReplaceId(null); // Réinitialiser l'ID de l'exercice à remplacer
      return;
    }
    
    // Si on est en mode tracking d'un exercice spécifique, retourner au mode workout
    if (modalMode === 'exercise-tracking') {
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
  const [isWorkoutEditModalVisible, setIsWorkoutEditModalVisible] = useState(false);

  // Fonction pour gérer la fermeture du modal d'édition du workout
  const handleWorkoutEditClose = () => {
    console.log('Closing workout edit modal');
    setIsWorkoutEditModalVisible(false);
  };

  // Fonction pour gérer la sauvegarde après l'édition du workout
  const handleWorkoutEditSave = () => {
    console.log('Saving workout edit changes');
    setIsWorkoutEditModalVisible(false);
    
    // Recharger le workout après les modifications
    if (workout) {
      // Rafraîchir les exercices
      setExercises(workout.exercises || []);
    }
  };

  // Fonctions pour vérifier les PR par rapport aux records ORIGINAUX (début de séance)
  const checkOriginalWeightPR = useCallback(
    (exerciseName: string, weight: number) => {
      return EnhancedPersonalRecordService.checkWeightPR(exerciseName, weight, originalRecords);
    },
    [originalRecords]
  );

  const checkOriginalRepsPR = useCallback(
    (exerciseName: string, weight: number, reps: number) => {
      return EnhancedPersonalRecordService.checkRepsPR(exerciseName, weight, reps, originalRecords);
    },
    [originalRecords]
  );

  // Fonction pour vérifier les PR de poids en tenant compte du poids maximum de la séance actuelle
  const checkSessionWeightPR = useCallback(
    (exerciseName: string, weight: number) => {
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
      
      return null;
    },
    [originalRecords, currentSessionMaxWeights]
  );

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
      if (prBadgeAnim) {
        prBadgeAnim.stopAnimation();
      }
      
      for (const key in exerciseProgressAnimations) {
        if (exerciseProgressAnimations[key]) {
          exerciseProgressAnimations[key].stopAnimation();
        }
      }
      
      for (const key in exerciseBounceAnimations) {
        if (exerciseBounceAnimations[key]) {
          exerciseBounceAnimations[key].stopAnimation();
        }
      }
      
      for (const key in setAnimations) {
        if (setAnimations[key]) {
          setAnimations[key].stopAnimation();
        }
      }
    };
  }, []);
  
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
  const safeSetPrResults = useCallback((data: {
    setIndex: number;
    weightPR?: { isNew: boolean; weight: number } | null;
    repsPR?: { isNew: boolean; weight: number; reps: number; previousReps: number } | null;
  } | null) => {
    if (isMounted.current) {
      setPrResults(data);
    }
  }, []);

  // Fonction sécurisée pour mettre à jour les PR results par exercice
  const safeSetExercisePRResults = useCallback((exerciseId: string, setIndex: number, data: {
    setIndex: number;
    weightPR?: { isNew: boolean; weight: number } | null;
    repsPR?: { isNew: boolean; weight: number; reps: number; previousReps: number } | null;
  } | null) => {
    if (isMounted.current) {
      const key = `${exerciseId}_set_${setIndex}`;
      setExercisePRResults(prev => ({
        ...prev,
        [key]: data
      }));
    }
  }, []);

  if (!workout) return null;

  return (
    <FullScreenModal
      visible={visible}
      onClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.container, { overflow: 'visible' }]}>
            {modalMode === 'workout' ? (
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
                        onPress={() => setIsWorkoutEditModalVisible(true)}
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
                                      (activeWorkout?.trackingData[exercise.id]?.completedSets || 0) === exercise.sets && completedCheckmarks[exercise.id] && styles.trackingCheckboxCompleted,
                                      { transform: [{ scale: exerciseBounceAnimations[exercise.id] || 1 }] }
                                    ]}
                                  >
                                    {(activeWorkout?.trackingData[exercise.id]?.completedSets || 0) === exercise.sets && completedCheckmarks[exercise.id] ? (
                                      <Ionicons name="checkmark" size={24} color="#000000" />
                                    ) : (
                                      <Animated.View style={[
                                        styles.progressFill, 
                                        { 
                                          height: exerciseProgressAnimations[exercise.id] 
                                            ? exerciseProgressAnimations[exercise.id].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%']
                                              })
                                            : `${(activeWorkout?.trackingData[exercise.id]?.completedSets || 0) / exercise.sets * 100}%` 
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
                                  onPress={() => handleExerciseSettings(exercise.id)}
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
            ) : modalMode === 'exercise-selection' ? (
              // Mode sélection d'exercices
              <>
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
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                  
                  <TouchableOpacity style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                {/* Filter Button */}
                <TouchableOpacity 
                  style={[
                    styles.filterButton, 
                    selectedTags.length > 0 && styles.filterButtonActive
                  ]} 
                  onPress={handleOpenFilterModal}
                >
                  <Text 
                    style={[
                      styles.filterButtonText,
                      selectedTags.length > 0 && styles.filterButtonTextActive
                    ]}
                  >
                    {getFilterButtonText()}
                  </Text>
                  {selectedTags.length === 0 ? (
                    <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
                  ) : (
                    <TouchableOpacity onPress={handleResetFilters}>
                      <Ionicons name="close" size={20} color="#000000" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                
                {/* Exercise List */}
                <View style={styles.exerciseListContainer}>
                  <ScrollView style={styles.scrollView}>
                    {groupedExercises.map((section) => (
                      <View key={section.letter}>
                        {renderSectionHeader({ letter: section.letter })}
                        {section.data.map((exercise) => (
                          <View key={exercise.id}>
                            {renderExerciseItem(exercise)}
                          </View>
                        ))}
                      </View>
                    ))}
                    <View style={styles.bottomPadding} />
                  </ScrollView>
                  
                  {/* Fade Out Gradient */}
                  <LinearGradient
                    colors={['rgba(13, 13, 15, 0)', 'rgba(13, 13, 15, 0.8)', 'rgba(13, 13, 15, 1)']}
                    style={styles.fadeGradient}
                  />
                </View>
                
                {/* Bottom Add Button */}
                <View style={styles.bottomButtonContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.addExercisesButton,
                      selectedExercises.length === 0 && styles.addExercisesButtonDisabled
                    ]}
                    onPress={handleExercisesSelected}
                    disabled={selectedExercises.length === 0}
                  >
                    <Text style={styles.addExercisesButtonText}>
                      {selectedExercises.length === 0 
                        ? 'Select exercises' 
                        : `Add ${selectedExercises.length} exercise${selectedExercises.length > 1 ? 's' : ''}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : modalMode === 'exercise-tracking' ? (
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
                          setCurrentExercise(selectedExercise);
                          setSettingsModalVisible(true);
                          // Indiquer qu'on veut ouvrir directement en mode timer
                          setOpenTimerDirectly(true);
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
                      {exerciseSets.map((set, index) => (
                        <SetRow
                          key={index}
                          set={set}
                          index={index}
                          animation={setAnimations[index] || new Animated.Value(1)}
                          onToggle={handleSetToggle}
                          onWeightChange={handleWeightChange}
                          onRepsChange={handleRepsChange}
                          onRemove={handleRemoveSet}
                          prData={
                            // Si la série affichée est celle actuellement mise en évidence, utiliser prResults
                            prResults && prResults.setIndex === index ? {
                              weightPR: prResults.weightPR,
                              repsPR: prResults.repsPR,
                              prBadgeAnim: prBadgeAnim
                            } : 
                            // Sinon, chercher dans exercisePRResults s'il y a un enregistrement pour cette série
                            selectedExerciseId && 
                            exercisePRResults[`${selectedExerciseId}_set_${index}`] ? {
                              weightPR: exercisePRResults[`${selectedExerciseId}_set_${index}`]?.weightPR,
                              repsPR: exercisePRResults[`${selectedExerciseId}_set_${index}`]?.repsPR,
                              prBadgeAnim: prBadgeAnim
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
            ) : (
              // Mode sélection d'exercices ou remplacement d'exercice
              <>
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
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                  
                  <TouchableOpacity style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                
                {/* Filter Button */}
                <TouchableOpacity 
                  style={[
                    styles.filterButton, 
                    selectedTags.length > 0 && styles.filterButtonActive
                  ]} 
                  onPress={handleOpenFilterModal}
                >
                  <Text 
                    style={[
                      styles.filterButtonText,
                      selectedTags.length > 0 && styles.filterButtonTextActive
                    ]}
                  >
                    {getFilterButtonText()}
                  </Text>
                  {selectedTags.length === 0 ? (
                    <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
                  ) : (
                    <TouchableOpacity onPress={handleResetFilters}>
                      <Ionicons name="close" size={20} color="#000000" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                
                {/* Exercise List */}
                <View style={styles.exerciseListContainer}>
                  <ScrollView style={styles.scrollView}>
                    {groupedExercises.map((section) => (
                      <View key={section.letter}>
                        {renderSectionHeader({ letter: section.letter })}
                        {section.data.map((exercise) => (
                          <View key={exercise.id}>
                            {renderExerciseItem(exercise)}
                          </View>
                        ))}
                      </View>
                    ))}
                    <View style={styles.bottomPadding} />
                  </ScrollView>
                  
                  {/* Fade Out Gradient */}
                  <LinearGradient
                    colors={['rgba(13, 13, 15, 0)', 'rgba(13, 13, 15, 0.8)', 'rgba(13, 13, 15, 1)']}
                    style={styles.fadeGradient}
                  />
                </View>
                
                {/* Bottom Add Button */}
                <View style={styles.bottomButtonContainer}>
                  <TouchableOpacity 
                    style={[
                      styles.addExercisesButton,
                      selectedExercises.length === 0 && styles.addExercisesButtonDisabled
                    ]}
                    onPress={modalMode === 'exercise-replacement' ? handleExerciseReplaced : handleExercisesSelected}
                    disabled={selectedExercises.length === 0}
                  >
                    <Text style={styles.addExercisesButtonText}>
                      {modalMode === 'exercise-replacement' 
                        ? (selectedExercises.length === 0 
                          ? 'Select an exercise' 
                          : 'Replace with selected exercise')
                        : (selectedExercises.length === 0 
                          ? 'Select exercises' 
                          : `Add ${selectedExercises.length} exercise${selectedExercises.length > 1 ? 's' : ''}`)
                      }
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      
      {/* Modale des paramètres d'exercice */}
      <ExerciseSettingsModal
        visible={settingsModalVisible}
        onClose={() => {
          setSettingsModalVisible(false);
          setOpenTimerDirectly(false);
        }}
        onReplace={handleReplaceExercise}
        onDelete={() => {
          if (currentExercise) {
            handleRemoveExercise(currentExercise.id);
            setSettingsModalVisible(false);
          }
        }}
        exercise={currentExercise}
        onRestTimeUpdate={handleRestTimeUpdate}
        openTimerDirectly={openTimerDirectly}
      />
      
      {/* Afficher le timer de repos s'il est actif */}
      <RestTimer />
      
      {/* Modale pour les filtres */}
      <ExerciseFilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        availableTags={allTags}
        selectedTags={selectedTags}
        onTagsSelected={handleTagsSelected}
      />
      
      {/* Finish Workout Modal */}
      <Modal
        visible={isFinishModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsFinishModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1}
            onPress={() => setIsFinishModalVisible(false)}
          />
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0]
                  })
                }]
              }
            ]}
          >
            <View style={styles.modalIndicator} />
            <Text style={styles.modalTitle}>Finish Workout</Text>
            <Text style={styles.modalSubtitle}>What would you like to do with this workout?</Text>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.discardButton]}
                onPress={handleDiscardWorkout}
                activeOpacity={0.7}
              >
                <Text style={styles.discardButtonText}>Discard</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.logButton]}
                onPress={handleLogWorkout}
                activeOpacity={0.7}
              >
                <Text style={styles.logButtonText}>Log Workout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
      
      {/* Modal pour éditer le workout */}
      {workout && (
        <WorkoutEditModal
          visible={isWorkoutEditModalVisible}
          workout={workout}
          onClose={handleWorkoutEditClose}
          onSave={handleWorkoutEditSave}
        />
      )}
    </FullScreenModal>
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
  selectionExerciseName: {
    marginLeft: 16,
    fontSize: 16,
    color: '#FFFFFF',
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
    backgroundColor: '#242526',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtonsContainer: {
    gap: 12,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  discardButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logButton: {
    backgroundColor: '#FFFFFF',
  },
  discardButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  logButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
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