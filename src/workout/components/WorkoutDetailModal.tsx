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
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout, Exercise } from '../../types/workout';
import { FullScreenModal } from '../../components/common/FullScreenModal';
import { useWorkout } from '../../hooks/useWorkout';
import { ExerciseSettingsModal } from './ExerciseSettingsModal';
import { ExerciseFilterModal } from './ExerciseFilterModal';
import { LinearGradient } from 'expo-linear-gradient';

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
type ModalMode = 'workout' | 'exercise-selection';

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
  // État pour le mode tracking
  const [isTrackingMode, setIsTrackingMode] = useState(false);
  // État pour le timer de séance
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // États pour le tracking des exercices
  const [completedSets, setCompletedSets] = useState<Record<string, number>>({});
  
  const { updateWorkout } = useWorkout();

  // Synchroniser les exercices lorsque le workout change
  useEffect(() => {
    if (workout) {
      setExercises(workout.exercises);
      setHasUnsavedChanges(false);
    }
  }, [workout]);

  // Reset le mode et les sélections lorsque la modale est fermée
  useEffect(() => {
    if (!visible) {
      setModalMode('workout');
      setSearchQuery('');
      setSelectedExercises([]);
    }
  }, [visible]);

  // Timer de séance
  useEffect(() => {
    if (isTrackingMode) {
      // Démarrer le timer
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      // Arrêter le timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Réinitialiser le timer
      setElapsedTime(0);
    }

    // Nettoyer le timer lors du démontage
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTrackingMode]);

  // Reset le mode tracking lors de la fermeture de la modale
  useEffect(() => {
    if (!visible) {
      setIsTrackingMode(false);
      setElapsedTime(0);
      setCompletedSets({});
    }
  }, [visible]);

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

  // Fonction pour commencer une séance
  const handleStartWorkout = () => {
    // Sauvegarder automatiquement avant de commencer
    if (hasUnsavedChanges) {
      handleSaveChanges();
    }
    
    // Activer le mode tracking
    setIsTrackingMode(true);
  };

  // Fonction pour finir la séance
  const handleFinishWorkout = () => {
    // Désactiver le mode tracking
    setIsTrackingMode(false);
    
    // TODO: Sauvegarder les données de tracking
    
    // Réinitialiser les états
    setElapsedTime(0);
    setCompletedSets({});
    
    // Afficher un message de confirmation
    Alert.alert("Séance terminée", "Bravo pour votre entraînement !");
  };

  // Fonction pour formater le temps du timer (mm:ss)
  const formatElapsedTime = () => {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Fonction pour naviguer vers le tracking d'un exercice
  const handleExerciseTracking = (exerciseId: string) => {
    if (isTrackingMode) {
      setSelectedExerciseId(exerciseId);
      // TODO: Implémenter la navigation vers le tracking de l'exercice
      Alert.alert("Tracking de l'exercice", "Navigation à implémenter");
    }
  };

  // Fonction pour obtenir le texte de progression pour un exercice
  const getExerciseProgressText = (exercise: Exercise) => {
    const completed = completedSets[exercise.id] || 0;
    if (exercise.tracking === "trackedOnSets" || exercise.sets > 1) {
      return `${completed} of ${exercise.sets} sets completed`;
    } else if (exercise.tracking === "trackedOnTime" || exercise.duration) {
      return "Tracked on time";
    } else {
      return "Tracked on rounds";
    }
  };

  // Gestion de la fermeture avec sauvegarde automatique
  const handleClose = () => {
    // Si on est en mode sélection, retourner au mode workout
    if (modalMode === 'exercise-selection') {
      setModalMode('workout');
      return;
    }
    
    // Sauvegarder automatiquement les changements avant de fermer
    if (hasUnsavedChanges && workout) {
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
                    {!isTrackingMode && (
                      <TouchableOpacity style={styles.settingsButton}>
                        <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                      style={[
                        isTrackingMode ? styles.finishButton : styles.startButton
                      ]}
                      onPress={isTrackingMode ? handleFinishWorkout : handleStartWorkout}
                    >
                      <Text 
                        style={[
                          isTrackingMode ? styles.finishButtonText : styles.startButtonText
                        ]}
                      >
                        {isTrackingMode ? "Finish" : "Start"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {isTrackingMode && (
                  <Text style={styles.workoutTimer}>{formatElapsedTime()}</Text>
                )}
                
                <Text 
                  style={[
                    styles.workoutName,
                    isTrackingMode && styles.workoutNameSmall
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
                            pressed && styles.exerciseItemPressed
                          ]}
                          onPress={() => isTrackingMode ? handleExerciseTracking(exercise.id) : {}}
                        >
                          <View style={styles.exerciseContent}>
                            {isTrackingMode ? (
                              <View 
                                style={[
                                  styles.trackingCheckbox,
                                  (completedSets[exercise.id] || 0) === exercise.sets && styles.trackingCheckboxCompleted
                                ]}
                              >
                                {(completedSets[exercise.id] || 0) === exercise.sets && (
                                  <Ionicons name="checkmark" size={24} color="#000000" />
                                )}
                              </View>
                            ) : (
                              <View style={styles.exerciseIconContainer}>
                                <Ionicons 
                                  name={getExerciseIcon(exercise)} 
                                  size={24} 
                                  color="#FFFFFF" 
                                />
                              </View>
                            )}
                            
                            <View style={styles.exerciseInfo}>
                              <Text style={styles.exerciseName}>{exercise.name}</Text>
                              <Text style={styles.exerciseTrackingType}>
                                {isTrackingMode 
                                  ? getExerciseProgressText(exercise)
                                  : getTrackingText(exercise)
                                }
                              </Text>
                            </View>
                            
                            {!isTrackingMode ? (
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
                      
                      {!isTrackingMode && (
                        <View style={styles.addButtonContainer}>
                          <TouchableOpacity 
                            style={styles.addExerciseButton}
                            onPress={handleAddExercise}
                          >
                            <Ionicons name="add-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.addExerciseText}>Add exercise</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                  
                  {/* Padding de bas pour assurer le défilement complet */}
                  <View style={styles.bottomPadding} />
                </ScrollView>
              </>
            ) : (
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#242526',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24,
  },
  startButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    padding: 16,
    paddingHorizontal: 16,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    paddingHorizontal: 16,
    marginTop: 16,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingVertical: 16,
    paddingLeft: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  addExerciseText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackingCheckboxCompleted: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  finishButton: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
}); 