import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout, Exercise } from '../../types/workout';
import { FullScreenModal } from '../../components/common/FullScreenModal';
import { useWorkout } from '../../hooks/useWorkout';
import { ExerciseSettingsModal } from './ExerciseSettingsModal';
import { ExerciseFilterModal } from './ExerciseFilterModal';
import { LinearGradient } from 'expo-linear-gradient';
import { useActiveWorkout, TrackingSet, TrackingData } from '../contexts/ActiveWorkoutContext';

// Définition des types de tracking
type TrackingType = 'trackedOnSets' | 'trackedOnTime';

// Exemple de données d'exercices
const SAMPLE_EXERCISES: (Exercise & { tags: string[], tracking: TrackingType })[] = [
  { 
    id: '1', 
    name: 'Bench Press', 
    sets: 3, 
    reps: 8, 
    weight: 60,
    tags: ["chest", "triceps", "shoulders", "upper body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '2', 
    name: 'Push-Ups', 
    sets: 3, 
    reps: 12, 
    weight: 0,
    tags: ["chest", "triceps", "shoulders", "upper body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '3', 
    name: 'Incline Bench Press', 
    sets: 3, 
    reps: 8, 
    weight: 40,
    tags: ["chest", "shoulders", "upper body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '4', 
    name: 'Pull-Ups', 
    sets: 3, 
    reps: 8, 
    weight: 0,
    tags: ["back", "biceps", "upper body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '5', 
    name: 'Chin-Ups', 
    sets: 3, 
    reps: 8, 
    weight: 0,
    tags: ["back", "biceps", "upper body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '6', 
    name: 'Barbell Row', 
    sets: 3, 
    reps: 8, 
    weight: 50,
    tags: ["back", "biceps", "upper body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '7', 
    name: 'Overhead Press', 
    sets: 3, 
    reps: 8, 
    weight: 30,
    tags: ["shoulders", "triceps", "upper body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '8', 
    name: 'Lateral Raise', 
    sets: 3, 
    reps: 12, 
    weight: 10,
    tags: ["shoulders", "upper body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '9', 
    name: 'Barbell Curl', 
    sets: 3, 
    reps: 10, 
    weight: 20,
    tags: ["biceps", "upper body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '10', 
    name: 'Tricep Pushdown', 
    sets: 3, 
    reps: 12, 
    weight: 20,
    tags: ["triceps", "upper body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '11', 
    name: 'Squat', 
    sets: 3, 
    reps: 8, 
    weight: 80,
    tags: ["legs", "glutes", "lower body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '12', 
    name: 'Front Squat', 
    sets: 3, 
    reps: 8, 
    weight: 60,
    tags: ["legs", "glutes", "lower body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '13', 
    name: 'Bulgarian Split Squat', 
    sets: 3, 
    reps: 10, 
    weight: 20,
    tags: ["legs", "glutes", "lower body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '14', 
    name: 'Leg Press', 
    sets: 3, 
    reps: 10, 
    weight: 120,
    tags: ["legs", "glutes", "lower body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '15', 
    name: 'Leg Curl', 
    sets: 3, 
    reps: 12, 
    weight: 40,
    tags: ["hamstrings", "lower body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '16', 
    name: 'Deadlift', 
    sets: 3, 
    reps: 6, 
    weight: 100,
    tags: ["back", "legs", "glutes", "full body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '17', 
    name: 'Romanian Deadlift', 
    sets: 3, 
    reps: 8, 
    weight: 60,
    tags: ["hamstrings", "glutes", "lower body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '18', 
    name: 'Lunges', 
    sets: 3, 
    reps: 10, 
    weight: 30,
    tags: ["legs", "glutes", "lower body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '19', 
    name: 'Hip Thrust', 
    sets: 3, 
    reps: 12, 
    weight: 50,
    tags: ["glutes", "lower body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '20', 
    name: 'Calf Raises', 
    sets: 3, 
    reps: 15, 
    weight: 40,
    tags: ["calves", "lower body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '21', 
    name: 'Plank', 
    sets: 3, 
    reps: 0, 
    duration: 60, 
    weight: 0,
    tags: ["core", "full body"],
    tracking: "trackedOnTime"
  },
  { 
    id: '22', 
    name: 'Side Plank', 
    sets: 3, 
    reps: 0, 
    duration: 30, 
    weight: 0,
    tags: ["core", "full body"],
    tracking: "trackedOnTime"
  },
  { 
    id: '23', 
    name: 'Crunches', 
    sets: 3, 
    reps: 15, 
    weight: 0,
    tags: ["core", "upper body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '24', 
    name: 'Russian Twists', 
    sets: 3, 
    reps: 20, 
    weight: 5,
    tags: ["core", "upper body"],
    tracking: "trackedOnSets"
  },
  { 
    id: '25', 
    name: 'Mountain Climbers', 
    sets: 3, 
    reps: 0, 
    duration: 45, 
    weight: 0,
    tags: ["core", "full body"],
    tracking: "trackedOnTime"
  },
  { 
    id: '26', 
    name: 'Burpees', 
    sets: 3, 
    reps: 15, 
    weight: 0,
    tags: ["full body", "cardio"],
    tracking: "trackedOnSets"
  },
  { 
    id: '27', 
    name: 'Kettlebell Swings', 
    sets: 3, 
    reps: 15, 
    weight: 16,
    tags: ["glutes", "hamstrings", "shoulders", "full body"],
    tracking: "trackedOnSets"
  }
];

interface WorkoutDetailModalProps {
  visible: boolean;
  onClose: () => void;
  workout: Workout | null;
}

// Modes d'affichage de la modale
type ModalMode = 'workout' | 'exercise-selection' | 'exercise-tracking';

export const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
  visible,
  onClose,
  workout
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
      setExercises(prev => [...prev, ...newExercises]);
      setHasUnsavedChanges(true);
    }
    
    // Retour au mode affichage de workout
    setModalMode('workout');
  };

  // Fonction pour retirer un exercice
  const handleRemoveExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
    setHasUnsavedChanges(true);
  };

  // Fonction pour remplacer un exercice
  const handleReplaceExercise = () => {
    // TODO: Implémenter la fonctionnalité de remplacement
    Alert.alert("Remplacer l'exercice", "Fonctionnalité à implémenter");
  };

  // Fonction pour démarrer une séance
  const handleStartWorkout = () => {
    if (!workout) return;
    
    // Démarrer une nouvelle séance via le contexte
    // Le contexte gère maintenant le timer
    startWorkout(workout.id, workout.name, exercises);
    updateElapsedTime(0);
  };

  // Fonction pour finir la séance
  const handleFinishWorkout = () => {
    Alert.alert(
      "Terminer la séance",
      "Êtes-vous sûr de vouloir terminer cette séance ?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Terminer",
          onPress: async () => {
            // Le contexte gère maintenant le timer
            await finishWorkout();
            
            // Afficher un message de confirmation
            Alert.alert("Séance terminée", "Bravo pour votre entraînement !");
            onClose();
          }
        }
      ]
    );
  };

  // Fonction pour naviguer vers le tracking d'un exercice
  const handleExerciseTracking = (exerciseId: string) => {
    if (isTrackingWorkout && activeWorkout?.workoutId === workout?.id) {
      setSelectedExerciseId(exerciseId);
      
      // Utiliser les données de tracking existantes ou en créer de nouvelles
      const exercise = exercises.find(ex => ex.id === exerciseId);
      
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
    // Sauvegarder les modifications de tracking actuelles avant de revenir
    if (selectedExerciseId) {
      const newSets = [...exerciseSets];
      const completedCount = newSets.filter(set => set.completed).length;
      
      updateTrackingData(selectedExerciseId, newSets, completedCount);
      
      // Préparer l'animation pour l'exercice
      const exercise = exercises.find(ex => ex.id === selectedExerciseId);
      if (exercise) {
        const isCompleted = completedCount === exercise.sets;
        
        // Pour un exercice complété, masquer d'abord le checkmark
        if (isCompleted) {
          setCompletedCheckmarks(prev => ({
            ...prev,
            [selectedExerciseId]: false
          }));
        }
        
        // Créer ou réinitialiser l'animation de progression
        if (!exerciseProgressAnimations[selectedExerciseId]) {
          setExerciseProgressAnimations(prev => ({
            ...prev,
            [selectedExerciseId]: new Animated.Value(0)
          }));
        } else {
          exerciseProgressAnimations[selectedExerciseId].setValue(0);
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
        
        // Déclencher les animations après le retour à la liste principale
        setTimeout(() => {
          // Vérifier que les animations existent avant de les utiliser
          if (exerciseProgressAnimations[selectedExerciseId]) {
            if (isCompleted) {
              // 1. Animer la jauge jusqu'à 100%
              Animated.timing(exerciseProgressAnimations[selectedExerciseId], {
                toValue: 1,
                duration: 600,
                useNativeDriver: false,
              }).start(() => {
                // 2. Afficher le checkmark après remplissage de la jauge
                setTimeout(() => {
                  setCompletedCheckmarks(prev => ({
                    ...prev,
                    [selectedExerciseId]: true
                  }));
                  
                  // 3. Déclencher l'animation de rebond après l'apparition du checkmark
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
                  }, 150);
                }, 200);
              });
            } else {
              // Pour un exercice partiellement complété, juste animer la jauge
              Animated.timing(exerciseProgressAnimations[selectedExerciseId], {
                toValue: completedCount / exercise.sets,
                duration: 600,
                useNativeDriver: false,
              }).start();
            }
          }
        }, 100);
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

  // Fonction pour cocher/décocher une série avec animation
  const handleToggleSet = (index: number) => {
    // Mettre à jour l'état local des sets
    const newSets = [...exerciseSets];
    newSets[index] = {
      ...newSets[index],
      completed: !newSets[index].completed
    };
    setExerciseSets(newSets);
    
    // Déclencher l'animation de rebond
    animateSetBounce(index);
    
    // Mettre à jour immédiatement les données de tracking
    if (selectedExerciseId) {
      const completedCount = newSets.filter(set => set.completed).length;
      
      // Mettre à jour via le contexte
      updateTrackingData(selectedExerciseId, newSets, completedCount);
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
        setExercises(prev => prev.map(ex => ex.id === selectedExerciseId ? updatedExercise : ex));
        
        // Mettre à jour les données de tracking
        updateTrackingData(selectedExerciseId, newSets, 0);
      }
    }
  };
  
  // Obtenir l'exercice sélectionné
  const selectedExercise = selectedExerciseId 
    ? exercises.find(ex => ex.id === selectedExerciseId) 
    : null;

  // Fonction pour obtenir le texte de progression pour un exercice
  const getExerciseProgressText = (exercise: Exercise) => {
    const completed = activeWorkout?.trackingData[exercise.id]?.completedSets || 0;
    if (exercise.tracking === "trackedOnSets" || exercise.sets > 1) {
      return `${completed} of ${exercise.sets} sets completed`;
    } else if (exercise.tracking === "trackedOnTime") {
      return exercise.duration !== undefined && exercise.duration > 0 ? `${exercise.duration} min` : "";
    }
    return "";
  };

  // Calcule le pourcentage de complétion d'un exercice
  const getExerciseProgress = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return 0;
    
    const completed = activeWorkout?.trackingData[exerciseId]?.completedSets || 0;
    return (completed / exercise.sets) * 100;
  };

  // Gestion de la fermeture avec sauvegarde automatique
  const handleClose = () => {
    // Si on est en mode sélection, retourner au mode workout
    if (modalMode === 'exercise-selection') {
      setModalMode('workout');
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

  // Fonction pour ouvrir la modal de paramètres d'exercice
  const handleExerciseSettings = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setIsExerciseSettingsVisible(true);
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
        (exercise.tags && selectedTags.every(tag => exercise.tags.includes(tag)));
      
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
    setSelectedExercises(prev => {
      const alreadySelected = prev.some(ex => ex.id === exercise.id);
      
      if (alreadySelected) {
        return prev.filter(ex => ex.id !== exercise.id);
      } else {
        return [...prev, exercise];
      }
    });
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
    
    // Mettre à jour l'état local des sets
    const newSets = exerciseSets.filter((_, i) => i !== index);
    setExerciseSets(newSets);
    
    // Mettre à jour le nombre total de séries pour l'exercice
    if (selectedExerciseId) {
      const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId);
      if (selectedExercise) {
        const updatedExercise = {
          ...selectedExercise,
          sets: Math.max(1, (selectedExercise.sets || 0) - 1)
        };
        setExercises(prev => prev.map(ex => ex.id === selectedExerciseId ? updatedExercise : ex));
        
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
          <View style={styles.container}>
            {modalMode === 'workout' ? (
              // Mode affichage du workout
              <>
                <View style={styles.header}>
                  <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                    <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <View style={styles.rightButtons}>
                    {!isTrackingWorkout && (
                      <TouchableOpacity style={styles.settingsButton}>
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
                
                <Text 
                  style={[
                    styles.workoutName,
                    isTrackingWorkout && styles.workoutNameSmall
                  ]}
                >
                  {workout.name}
                </Text>
                
                <ScrollView 
                  style={styles.content}
                  showsVerticalScrollIndicator={false}
                >
                  {exercises.length === 0 ? (
                    renderEmptyState()
                  ) : (
                    <View style={styles.exercisesList}>
                      {exercises.map((exercise) => (
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
                        <View style={styles.addButtonContainer}>
                          <TouchableOpacity 
                            style={styles.addRoundButton}
                            onPress={handleAddExercise}
                          >
                            <Ionicons name="add" size={24} color="#FFFFFF" />
                          </TouchableOpacity>
                          <Text style={styles.addButtonText}>Add exercise</Text>
                        </View>
                      )}
                    </View>
                  )}
                  
                  {/* Padding de bas pour assurer le défilement complet */}
                  <View style={styles.bottomPadding} />
                </ScrollView>
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
            ) : (
              // Mode tracking d'un exercice spécifique
              <>
                <View style={styles.header}>
                  <TouchableOpacity onPress={handleBackToWorkout} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <View style={styles.rightButtons}>
                    <TouchableOpacity style={styles.settingsButton}>
                      <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={styles.exerciseTrackingTitle}>
                  {selectedExercise?.name || 'Exercise'}
                </Text>
                
                <Text style={styles.exerciseTrackingSubtitle}>
                  Tick checkboxes as you complete the sets
                </Text>
                
                <ScrollView 
                  style={styles.content}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.setsContainer}>
                    {exerciseSets.map((set, index) => (
                      <Animated.View 
                        key={index} 
                        style={[
                          styles.setRow,
                          { transform: [{ scale: setAnimations[index] || 1 }] }
                        ]}
                      >
                        <TouchableOpacity 
                          style={[
                            styles.trackingCheckbox,
                            set.completed && styles.trackingCheckboxCompleted,
                            styles.setTrackingCheckbox
                          ]}
                          onPress={() => handleToggleSet(index)}
                        >
                          {set.completed ? (
                            <Ionicons name="checkmark" size={24} color="#000000" />
                          ) : (
                            <View style={[styles.progressFill, { height: '0%' }]} />
                          )}
                        </TouchableOpacity>
                        
                        <View style={styles.setInputsContainer}>
                          <View style={styles.inputWrapper}>
                            <TextInput
                              style={styles.setInput}
                              placeholder="0"
                              placeholderTextColor="rgba(255, 255, 255, 0.5)"
                              keyboardType="numeric"
                              value={set.weight}
                              onChangeText={(value) => {
                                // Limiter à 3 chiffres maximum
                                if (value.length <= 3) {
                                  handleWeightChange(index, value.replace(/[^0-9]/g, ''))
                                }
                              }}
                              maxLength={3}
                              textAlign="right"
                            />
                            <Text style={[styles.inputSuffix, { right: 16 }]}>kg</Text>
                          </View>
                          
                          <View style={styles.inputWrapper}>
                            <TextInput
                              style={styles.setInput}
                              placeholder="0"
                              placeholderTextColor="rgba(255, 255, 255, 0.5)"
                              keyboardType="numeric"
                              value={set.reps}
                              onChangeText={(value) => {
                                // Limiter à 3 chiffres maximum
                                if (value.length <= 3) {
                                  handleRepsChange(index, value.replace(/[^0-9]/g, ''))
                                }
                              }}
                              maxLength={3}
                              textAlign="right"
                            />
                            <Text style={[styles.inputSuffix, { right: 12 }]}>reps</Text>
                          </View>
                        </View>
                        
                        <TouchableOpacity 
                          style={styles.setSettingsButton}
                          onPress={() => handleRemoveSet(index)}
                        >
                          <Ionicons name="close" size={24} color="#5B5B5C" />
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                  
                  <View style={styles.addSetContainer}>
                    <TouchableOpacity 
                      style={styles.addSetButton}
                      onPress={handleAddSet}
                    >
                      <Ionicons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.addSetText}>Add a set</Text>
                  </View>
                  
                  {/* Padding de bas pour assurer le défilement complet */}
                  <View style={styles.bottomPadding} />
                </ScrollView>
              </>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      
      {/* Modale pour les paramètres d'exercice */}
      <ExerciseSettingsModal
        visible={isExerciseSettingsVisible}
        onClose={() => setIsExerciseSettingsVisible(false)}
        onReplace={handleReplaceExercise}
        onDelete={() => {
          if (selectedExerciseId) {
            handleRemoveExercise(selectedExerciseId);
          }
          setSelectedExerciseId(null);
        }}
      />
      
      {/* Modale pour les filtres */}
      <ExerciseFilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        availableTags={allTags}
        selectedTags={selectedTags}
        onTagsSelected={handleTagsSelected}
      />
    </FullScreenModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  keyboardAvoidingView: {
    flex: 1,
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
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
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
    backgroundColor: 'transparent',
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
    gap: 8,
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
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
}); 