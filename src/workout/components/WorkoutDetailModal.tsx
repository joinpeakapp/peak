import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  Platform,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout, Exercise } from '../../types/workout';
import { FullScreenModal } from '../../components/common/FullScreenModal';
import { useWorkout } from '../../hooks/useWorkout';
import { ExerciseSettingsModal } from './ExerciseSettingsModal';

interface WorkoutDetailModalProps {
  visible: boolean;
  onClose: () => void;
  workout: Workout | null;
}

export const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({
  visible,
  onClose,
  workout
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExerciseSettingsVisible, setIsExerciseSettingsVisible] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const { updateWorkout } = useWorkout();

  // Synchroniser les exercices lorsque le workout change
  useEffect(() => {
    if (workout) {
      setExercises(workout.exercises);
      setHasUnsavedChanges(false);
    }
  }, [workout]);

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

  // Fonction pour ajouter un exercice
  const handleAddExercise = () => {
    // Fonction à compléter - Pour l'instant, on ajoute un exercice fictif
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: 'Nouvel exercice',
      sets: 3,
      reps: 10,
      weight: 0
    };
    
    setExercises([...exercises, newExercise]);
    setHasUnsavedChanges(true);
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
    
    // TODO: Implémenter la navigation vers l'écran de tracking
    Alert.alert("Séance commencée", "Fonctionnalité à implémenter");
  };

  // Gestion de la fermeture avec sauvegarde automatique
  const handleClose = () => {
    // Sauvegarder automatiquement les changements avant de fermer
    if (hasUnsavedChanges && workout) {
      handleSaveChanges();
    }
    
    // Fermer la modale
    onClose();
  };

  // Fonction pour obtenir l'icône en fonction du type d'exercice
  const getExerciseIcon = (exercise: Exercise) => {
    if (exercise.duration) {
      return "time-outline"; // Exercice basé sur le temps
    } else if (exercise.sets > 1) {
      return "repeat-outline"; // Exercice basé sur des séries
    } else {
      return "sync-outline"; // Circuit
    }
  };

  // Fonction pour obtenir le texte de tracking en fonction du type d'exercice
  const getTrackingText = (exercise: Exercise) => {
    if (exercise.duration) {
      return "Tracked on time";
    } else if (exercise.sets > 1) {
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

  if (!workout) return null;

  return (
    <FullScreenModal
      visible={visible}
      onClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.rightButtons}>
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.startButton}
              onPress={handleStartWorkout}
            >
              <Text style={styles.startButtonText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.workoutName}>{workout.name}</Text>
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Aucun exercice ajouté à ce workout
              </Text>
              <TouchableOpacity 
                style={styles.addExerciseButton}
                onPress={handleAddExercise}
              >
                <Ionicons name="add-outline" size={20} color="#FFFFFF" />
                <Text style={styles.addExerciseText}>Add exercise</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.exercisesList}>
              {exercises.map((exercise) => (
                <Pressable
                  key={exercise.id}
                  style={({ pressed }) => [
                    styles.exerciseItem,
                    pressed && styles.exerciseItemPressed
                  ]}
                  onPress={() => {}}
                >
                  <View style={styles.exerciseContent}>
                    <View style={styles.exerciseIconContainer}>
                      <Ionicons 
                        name={getExerciseIcon(exercise)} 
                        size={24} 
                        color="#FFFFFF" 
                      />
                    </View>
                    
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseTrackingType}>
                        {getTrackingText(exercise)}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      onPress={() => handleExerciseSettings(exercise.id)}
                      style={styles.exerciseSettingsButton}
                    >
                      <Ionicons name="ellipsis-vertical" size={24} color="#5B5B5C" />
                    </TouchableOpacity>
                  </View>
                </Pressable>
              ))}
              
              <View style={styles.addButtonContainer}>
                <TouchableOpacity 
                  style={styles.addExerciseButton}
                  onPress={handleAddExercise}
                >
                  <Ionicons name="add-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.addExerciseText}>Add exercise</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Padding de bas pour assurer le défilement complet */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
      
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
    </FullScreenModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
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
  emptyState: {
    marginHorizontal: 16,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: '#5B5B5C',
    textAlign: 'center',
    marginBottom: 16,
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
    height: 32,
  }
}); 