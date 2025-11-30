import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Platform,
  InteractionManager,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout, Exercise, CompletedWorkout, PersonalRecords, StickerHistoricalData } from '../../types/workout';
import { FullScreenModal } from '../../components/common/FullScreenModal';
import { useWorkout } from '../../hooks/useWorkout';
import { ExerciseSettingsModal } from './ExerciseSettingsModal';
import { ExerciseFilterModal } from './ExerciseFilterModal';
import { ContextMenu, ContextMenuItem } from '../../components/common/ContextMenu';
import { useActiveWorkout, TrackingSet, TrackingData } from '../contexts/ActiveWorkoutContext';
import { useRestTimer } from '../contexts/RestTimerContext';
import RestTimer from './RestTimer';
import { ExerciseCreateNameScreen } from '../screens/ExerciseCreateNameScreen';
import { ExerciseCreateTrackingScreen } from '../screens/ExerciseCreateTrackingScreen';
import { ExerciseCreateCategoriesScreen } from '../screens/ExerciseCreateCategoriesScreen';
import { ExerciseLibraryOptionsModal } from './ExerciseLibraryOptionsModal';
import { usePersonalRecords } from '../../hooks/usePersonalRecords';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { useExerciseTracking } from '../hooks/useExerciseTracking';
import { useExerciseSelection } from '../hooks/useExerciseSelection';
import { useModalManagement } from '../hooks/useModalManagement';
import { useWorkoutAnimations } from '../hooks/useWorkoutAnimations';
import { WorkoutEditModal } from './WorkoutEditModal';
import { useWorkoutHistory } from '../contexts/WorkoutHistoryContext';
import { useStreak } from '../contexts/StreakContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList, WorkoutStackParamList } from '../../types/navigation';

// Import du type depuis le hook
import type { ExerciseSelectionMode } from '../hooks/useExerciseSelection';

// Imports des composants extraits
import { WorkoutView } from './views/WorkoutView';
import { ExerciseSelectionView } from './views/ExerciseSelectionView';
import { ExerciseTrackingView } from './views/ExerciseTrackingView';
import { ExerciseReplacementView } from './views/ExerciseReplacementView';
import { FinishWorkoutModal } from './modals/FinishWorkoutModal';
import { EmptyWorkoutState } from './common/EmptyWorkoutState';
import { styles } from './WorkoutDetailModal.styles';
import { useWorkoutHandlers } from '../hooks/useWorkoutHandlers';
import { ExerciseRepositionModal } from './ExerciseRepositionModal';

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
  
  // État pour sauvegarder le template original avant modifications en mode tracking
  const [originalWorkoutTemplate, setOriginalWorkoutTemplate] = useState<Workout | null>(null);
  
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
  
  // Référence pour suivre si on a déjà restauré les originalRecords après un redémarrage
  const recordsRestoredRef = useRef(false);
  
  const { updateWorkout, workouts } = useWorkout();
  const { 
    activeWorkout, 
    startWorkout, 
    finishWorkout, 
    updateTrackingData, 
    updateElapsedTime, 
    resumeWorkout, 
    isTrackingWorkout,
    updateExercise,
    setExercises: setActiveWorkoutExercises
  } = useActiveWorkout();
  
  // Hook unifié pour gérer le tracking des exercices et séries
  const exerciseTracking = useExerciseTracking();

  // Récupération du contexte de timer de repos
  const { startRestTimer, resetTimer, stopTimer, currentExercise: currentRestExercise } = useRestTimer();
  
  // Récupération du contexte de streak
  const { updateStreakOnCompletion, getWorkoutStreak } = useStreak();
  
  // Récupération du contexte d'historique des workouts
  const { getPersonalRecords: getHistoryPersonalRecords, addCompletedWorkout, getPreviousWorkoutData } = useWorkoutHistory();
  
  // État pour les records personnels
  const personalRecords = usePersonalRecords();
  
  // Hook unifié pour gérer la session d'entraînement et les PRs
  const workoutSession = useWorkoutSession();
  
  // Navigation
  const navigation = useNavigation<NavigationProp<RootStackParamList | WorkoutStackParamList>>();

  // Fonction pour animer le badge PR
  const animatePrBadge = animations.animatePrBadge;
  
  // Utiliser les exercices de activeWorkout quand on est en mode tracking, sinon utiliser l'état local
  const currentExercises = isTrackingWorkout && activeWorkout?.exercises 
    ? activeWorkout.exercises 
    : exercises;

  // Obtenir l'exercice sélectionné
  const selectedExercise = modalManagement.selectedExerciseId 
    ? currentExercises.find(ex => ex.id === modalManagement.selectedExerciseId) 
    : null;
  
  // Hook pour gérer tous les handlers de logique métier
  const handlers = useWorkoutHandlers({
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
  });
  
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

  // 🔧 CORRECTIF : Restaurer les originalRecords quand un workout actif est restauré après un redémarrage
  useEffect(() => {
    const restoreSessionRecords = async () => {
      // Si on est en mode tracking avec un workout actif et que les originalRecords sont vides,
      // cela signifie qu'un workout actif a été restauré après un redémarrage de l'app
      if (
        visible &&
        isTrackingWorkout && 
        activeWorkout && 
        Object.keys(workoutSession.originalRecords).length === 0 &&
        !recordsRestoredRef.current
      ) {
        console.log('[WorkoutDetailModal] 🔄 Restoring originalRecords after app restart');
        recordsRestoredRef.current = true; // Marquer comme restauré pour éviter les appels multiples
        
        try {
          // Charger les records actuels depuis le service
          await personalRecords.loadRecords();
          
          // Capturer les records actuels qui serviront de référence pour toute la séance
          const capturedRecords = JSON.parse(JSON.stringify(personalRecords.records));
          
          // Initialiser la session avec les records capturés
          workoutSession.initializeSession(capturedRecords);
          
          // Synchroniser les originalRecords avec tous les exercices de la séance
          const exerciseNames = activeWorkout.exercises
            .map(ex => ex.name)
            .filter(Boolean) as string[];
          
          if (exerciseNames.length > 0) {
            await workoutSession.syncOriginalRecordsWithExercises(exerciseNames);
            console.log(`[WorkoutDetailModal] ✅ Restored originalRecords for ${exerciseNames.length} exercises after app restart`);
          }
        } catch (error) {
          console.error('[WorkoutDetailModal] ❌ Error restoring originalRecords after app restart:', error);
          recordsRestoredRef.current = false; // Réinitialiser en cas d'erreur pour réessayer
        }
      }
    };
    
    restoreSessionRecords();
  }, [visible, isTrackingWorkout, activeWorkout, workoutSession, personalRecords]);
  
  // Réinitialiser le flag quand le workout se termine ou que le modal se ferme
  useEffect(() => {
    if (!isTrackingWorkout || !visible) {
      recordsRestoredRef.current = false;
    }
  }, [isTrackingWorkout, visible]);

  // Les handlers sont maintenant dans le hook useWorkoutHandlers

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

  // formatElapsedTime est maintenant importé depuis workoutUtils

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

  // Les fonctions utilitaires sont maintenant dans workoutUtils.ts
  
  // Configuration des items du menu contextuel d'exercice
  const exerciseMenuItems: ContextMenuItem[] = selectedExerciseForMenu ? [
    {
      key: 'reposition',
      label: 'Reposition exercise',
      icon: 'swap-vertical-outline',
      onPress: () => {
        // Le ContextMenu ferme déjà le menu et attend 350ms sur iOS avant d'appeler onPress
        // On utilise InteractionManager pour s'assurer que toutes les animations sont terminées
        // avant d'ouvrir la modale de repositionnement
        const exerciseToReposition = selectedExerciseForMenu;
        InteractionManager.runAfterInteractions(() => {
          // Petit délai supplémentaire pour iOS pour garantir que le Modal est complètement démonté
          setTimeout(() => {
            if (exerciseToReposition) {
              modalManagement.showRepositionModal(exerciseToReposition);
            }
            setSelectedExerciseForMenu(null);
          }, Platform.OS === 'ios' ? 50 : 0);
        });
      },
    },
    {
      key: 'replace',
      label: 'Replace exercise',
      icon: 'swap-horizontal-outline',
      onPress: () => {
        setIsExerciseMenuVisible(false);
        if (selectedExerciseForMenu) {
          handlers.startReplaceExercise(selectedExerciseForMenu.id);
        }
        setSelectedExerciseForMenu(null);
      },
    },
    {
      key: 'timer',
      label: 'Configure rest timer',
      icon: 'timer-outline',
      onPress: () => {
        setIsExerciseMenuVisible(false);
        if (selectedExerciseForMenu) {
          modalManagement.showExerciseSettingsModal(selectedExerciseForMenu, true);
        }
        setSelectedExerciseForMenu(null);
      },
    },
    {
      key: 'delete',
      label: 'Delete exercise',
      icon: 'trash-outline',
      onPress: () => {
        setIsExerciseMenuVisible(false);
        if (selectedExerciseForMenu) {
          handlers.handleRemoveExercise(selectedExerciseForMenu.id);
        }
        setSelectedExerciseForMenu(null);
      },
      destructive: true,
    },
  ] : [];

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
              <WorkoutView
                workout={workout}
                exercises={currentExercises}
                isTrackingWorkout={isTrackingWorkout}
                activeWorkout={activeWorkout}
                animations={animations}
                onClose={handlers.handleClose}
                onStartWorkout={handlers.handleStartWorkout}
                onFinishWorkout={handlers.handleFinishWorkout}
                onAddExercise={handlers.handleAddExercise}
                onExerciseTracking={handlers.handleExerciseTracking}
                onExerciseSettings={handlers.handleExerciseSettings}
                onWorkoutEdit={() => modalManagement.showWorkoutEditModal()}
                renderEmptyState={() => <EmptyWorkoutState onAddExercise={handlers.handleAddExercise} />}
              />
            ) : exerciseSelection.modalMode === 'exercise-selection' ? (
              <ExerciseSelectionView
                searchQuery={exerciseSelection.searchQuery}
                onSearchChange={exerciseSelection.setSearchQuery}
                selectedTags={exerciseSelection.selectedTags}
                groupedExercises={exerciseSelection.groupedExercises}
                selectedExercises={exerciseSelection.selectedExercises}
                newlyCreatedExerciseId={newlyCreatedExerciseId}
                exercises={exercises}
                exerciseToReplaceId={exerciseSelection.exerciseToReplaceId ?? undefined}
                modalMode={exerciseSelection.modalMode}
                getFilterButtonText={exerciseSelection.getFilterButtonText}
                onClose={handlers.handleClose}
                onStartExerciseCreation={() => {
                  console.log('[WorkoutDetailModal] Starting exercise creation mode...');
                  exerciseSelection.startExerciseCreation();
                }}
                onOpenFilterModal={handlers.handleOpenFilterModal}
                onResetFilters={handlers.handleResetFilters}
                onToggleExerciseSelection={exerciseSelection.toggleExerciseSelection}
                onExerciseLongPress={handlers.handleExerciseLongPress}
                onExercisesSelected={handlers.handleExercisesSelected}
              />
            ) : exerciseSelection.modalMode === 'exercise-tracking' ? (
              <ExerciseTrackingView
                exercise={selectedExercise ?? null}
                exerciseSets={exerciseTracking.exerciseSets}
                setAnimations={Object.values(exerciseTracking.setAnimations)}
                prResults={workoutSession.prResults}
                exercisePRResults={workoutSession.exercisePRResults}
                selectedExerciseId={modalManagement.selectedExerciseId}
                prBadgeAnim={animations.prBadgeAnim}
                onBack={handlers.handleBackToWorkout}
                onOpenTimerSettings={() => {
                  if (selectedExercise) {
                    modalManagement.showExerciseSettingsModal(selectedExercise, true);
                  }
                }}
                onSetToggle={handlers.handleSetToggle}
                onWeightChange={handlers.handleWeightChange}
                onRepsChange={handlers.handleRepsChange}
                onRemoveSet={handlers.handleRemoveSet}
                onAddSet={handlers.handleAddSet}
              />
            ) : exerciseSelection.modalMode === 'exercise-creation' ? (
              // Mode création d'exercice - Flow multi-étapes
              <>
                {exerciseCreationStep === 'name' && (
                  <ExerciseCreateNameScreen
                    onNext={handlers.handleExerciseNameNext}
                    onClose={handlers.handleCancelCreateExercise}
                    existingExercises={exerciseSelection.allExercises.map(ex => ex.name)}
                  />
                )}
                {exerciseCreationStep === 'tracking' && (
                  <ExerciseCreateTrackingScreen
                    onNext={handlers.handleExerciseTrackingNext}
                    onBack={handlers.handleExerciseTrackingBack}
                  />
                )}
                {exerciseCreationStep === 'categories' && (
                  <ExerciseCreateCategoriesScreen
                    onComplete={handlers.handleExerciseCategoriesComplete}
                    onBack={handlers.handleExerciseCategoriesBack}
                  />
                )}
              </>
            ) : (
              <ExerciseReplacementView
                searchQuery={exerciseSelection.searchQuery}
                onSearchChange={exerciseSelection.setSearchQuery}
                selectedTags={exerciseSelection.selectedTags}
                groupedExercises={exerciseSelection.groupedExercises}
                selectedExercises={exerciseSelection.selectedExercises}
                newlyCreatedExerciseId={newlyCreatedExerciseId}
                exercises={exercises}
                exerciseToReplaceId={exerciseSelection.exerciseToReplaceId ?? undefined}
                getFilterButtonText={exerciseSelection.getFilterButtonText}
                onClose={handlers.handleClose}
                onStartExerciseCreation={() => {
                  console.log('[WorkoutDetailModal] Starting exercise creation mode from replacement...');
                  exerciseSelection.startExerciseCreation();
                }}
                onOpenFilterModal={handlers.handleOpenFilterModal}
                onResetFilters={handlers.handleResetFilters}
                onToggleExerciseSelection={exerciseSelection.toggleExerciseSelection}
                onExerciseLongPress={handlers.handleExerciseLongPress}
                onExerciseReplaced={handlers.handleExerciseReplaced}
              />
            )}
                </View>
      
      {/* Modale des paramètres d'exercice (utilisée uniquement pour la configuration du rest timer) */}
      <ExerciseSettingsModal
        visible={modalManagement.settingsModalVisible}
        onClose={() => {
          modalManagement.hideExerciseSettingsModal();
        }}
        onReplace={handlers.handleReplaceExercise}
        onDelete={() => {
          if (modalManagement.currentExercise) {
            handlers.handleRemoveExercise(modalManagement.currentExercise.id);
            modalManagement.hideExerciseSettingsModal();
          }
        }}
        exercise={modalManagement.currentExercise}
        onRestTimeUpdate={handlers.handleRestTimeUpdate}
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
      
      {/* Afficher le timer de repos seulement en mode workout et tracking, pas en mode sélection/remplacement */}
      {(exerciseSelection.modalMode === 'workout' || modalManagement.selectedExerciseId) && 
       exerciseSelection.modalMode !== 'exercise-selection' && 
       exerciseSelection.modalMode !== 'exercise-replacement' && (
        <RestTimer 
          onOpenSettings={() => {
            // Récupérer l'exercice actuel depuis le contexte du rest timer
            if (currentRestExercise) {
              modalManagement.showExerciseSettingsModal(currentRestExercise, true);
            }
          }}
        />
      )}
      
      {/* Modale pour les filtres */}
      <ExerciseFilterModal
        visible={modalManagement.isFilterModalVisible}
        onClose={() => modalManagement.hideFilterModal()}
        availableTags={exerciseSelection.allTags}
        selectedTags={exerciseSelection.selectedTags}
        onTagsSelected={handlers.handleTagsSelected}
      />
      
      {/* Finish Workout Modal */}
      <FinishWorkoutModal
        visible={modalManagement.isFinishModalVisible}
        slideAnim={animations.slideAnim}
        onClose={() => modalManagement.hideFinishModal()}
        onDiscard={handlers.handleDiscardWorkout}
        onLogWorkout={handlers.handleLogWorkout}
      />
      
      {/* Modal pour éditer le workout */}
      {workout && (
        <WorkoutEditModal
          visible={modalManagement.isWorkoutEditModalVisible}
          workout={workout}
          onClose={handlers.handleWorkoutEditClose}
          onSave={handlers.handleWorkoutEditSave}
        />
      )}

      {/* Modale d'options pour les exercices de la bibliothèque */}
      <ExerciseLibraryOptionsModal
        visible={libraryOptionsModalVisible}
        onClose={() => {
          setLibraryOptionsModalVisible(false);
          setSelectedLibraryExercise(null);
        }}
        onDelete={handlers.handleDeleteLibraryExercise}
        exercise={selectedLibraryExercise}
        isCustomExercise={selectedLibraryExercise ? handlers.isCustomExercise(selectedLibraryExercise) : false}
      />

      {/* Modale de repositionnement d'exercice */}
      {modalManagement.exerciseToReposition && (
        <ExerciseRepositionModal
          visible={modalManagement.isRepositionModalVisible}
          onClose={modalManagement.hideRepositionModal}
          exercises={currentExercises}
          selectedExercise={modalManagement.exerciseToReposition}
          onPositionSelected={(newPosition) => {
            handlers.handleRepositionExercise(modalManagement.exerciseToReposition!.id, newPosition);
          }}
        />
      )}

    </FullScreenModal>
    </>
  );
};

// Les styles ont été déplacés dans WorkoutDetailModal.styles.ts
// et dans les composants extraits (WorkoutView, ExerciseSelectionView, etc.) 
