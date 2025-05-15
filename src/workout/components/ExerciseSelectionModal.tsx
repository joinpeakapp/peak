import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Pressable,
  StatusBar,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '../../types/workout';
import { FullScreenModal } from '../../components/common/FullScreenModal';
import { LinearGradient } from 'expo-linear-gradient';
import { ExerciseFilterModal } from './ExerciseFilterModal';

// Exemple de données d'exercices
export const SAMPLE_EXERCISES: Exercise[] = [
  // Chest exercises
  { id: '1', name: 'Flat Bench Press', sets: 3, reps: 10, weight: 60, tags: ['Chest', 'Upper Body'] },
  { id: '2', name: 'Incline Bench Press', sets: 3, reps: 10, weight: 50, tags: ['Chest', 'Upper Body'] },
  { id: '3', name: 'Decline Bench Press', sets: 3, reps: 10, weight: 55, tags: ['Chest', 'Upper Body'] },
  { id: '4', name: 'Dumbbell Bench Press', sets: 3, reps: 10, weight: 25, tags: ['Chest', 'Upper Body'] },
  { id: '5', name: 'Dumbbell Fly', sets: 3, reps: 12, weight: 12, tags: ['Chest', 'Upper Body'] },
  { id: '6', name: 'Cable Crossover', sets: 3, reps: 12, weight: 15, tags: ['Chest', 'Upper Body'] },
  { id: '7', name: 'Chest Dips', sets: 3, reps: 10, weight: 0, tags: ['Chest', 'Triceps', 'Upper Body'] },
  { id: '8', name: 'Machine Chest Press', sets: 3, reps: 10, weight: 50, tags: ['Chest', 'Upper Body'] },
  { id: '9', name: 'Push-up', sets: 3, reps: 15, weight: 0, tags: ['Chest', 'Triceps', 'Upper Body'] },
  { id: '10', name: 'Wide Push-up', sets: 3, reps: 12, weight: 0, tags: ['Chest', 'Upper Body'] },
  { id: '11', name: 'Diamond Push-up', sets: 3, reps: 10, weight: 0, tags: ['Chest', 'Triceps', 'Upper Body'] },
  
  // Leg exercises
  { id: '12', name: 'Back Squat', sets: 3, reps: 12, weight: 80, tags: ['Quads', 'Glutes', 'Lower Body'] },
  { id: '13', name: 'Front Squat', sets: 3, reps: 10, weight: 70, tags: ['Quads', 'Glutes', 'Lower Body'] },
  { id: '14', name: 'Bulgarian Split Squat', sets: 3, reps: 10, weight: 20, tags: ['Quads', 'Glutes', 'Lower Body'] },
  { id: '15', name: 'Leg Press', sets: 3, reps: 12, weight: 120, tags: ['Quads', 'Glutes', 'Lower Body'] },
  { id: '16', name: 'Hack Squat', sets: 3, reps: 10, weight: 90, tags: ['Quads', 'Lower Body'] },
  { id: '17', name: 'Walking Lunge', sets: 3, reps: 10, weight: 20, tags: ['Quads', 'Glutes', 'Lower Body'] },
  { id: '18', name: 'Step-up', sets: 3, reps: 12, weight: 15, tags: ['Quads', 'Glutes', 'Lower Body'] },
  { id: '19', name: 'Leg Extension', sets: 3, reps: 12, weight: 40, tags: ['Quads', 'Lower Body'] },
  { id: '20', name: 'Leg Curl', sets: 3, reps: 12, weight: 35, tags: ['Hamstrings', 'Lower Body'] },
  { id: '21', name: 'Deadlift', sets: 3, reps: 8, weight: 100, tags: ['Back', 'Glutes', 'Hamstrings', 'Lower Body'] },
  { id: '22', name: 'Sumo Deadlift', sets: 3, reps: 8, weight: 90, tags: ['Glutes', 'Hamstrings', 'Lower Body'] },
  { id: '23', name: 'Romanian Deadlift', sets: 3, reps: 10, weight: 80, tags: ['Hamstrings', 'Glutes', 'Lower Body'] },
  { id: '24', name: 'Glute Bridge', sets: 3, reps: 15, weight: 0, tags: ['Glutes', 'Lower Body'] },
  { id: '25', name: 'Hip Thrust', sets: 3, reps: 12, weight: 60, tags: ['Glutes', 'Lower Body'] },
  { id: '26', name: 'Standing Calf Raise', sets: 3, reps: 15, weight: 30, tags: ['Calves', 'Lower Body'] },
  { id: '27', name: 'Seated Calf Raise', sets: 3, reps: 15, weight: 25, tags: ['Calves', 'Lower Body'] },
  { id: '28', name: 'Box Jump', sets: 3, reps: 10, weight: 0, tags: ['Quads', 'Calves', 'Lower Body'] },
  { id: '29', name: 'Jump Squat', sets: 3, reps: 12, weight: 0, tags: ['Quads', 'Glutes', 'Lower Body'] },
  
  // Arm exercises
  { id: '30', name: 'Barbell Curl', sets: 3, reps: 12, weight: 20, tags: ['Biceps', 'Upper Body'] },
  { id: '31', name: 'Dumbbell Curl', sets: 3, reps: 12, weight: 15, tags: ['Biceps', 'Upper Body'] },
  { id: '32', name: 'Hammer Curl', sets: 3, reps: 12, weight: 15, tags: ['Biceps', 'Upper Body'] },
  { id: '33', name: 'Preacher Curl', sets: 3, reps: 10, weight: 15, tags: ['Biceps', 'Upper Body'] },
  { id: '34', name: 'Concentration Curl', sets: 3, reps: 10, weight: 10, tags: ['Biceps', 'Upper Body'] },
  { id: '35', name: 'Tricep Pushdown', sets: 3, reps: 12, weight: 20, tags: ['Triceps', 'Upper Body'] },
  { id: '36', name: 'Overhead Tricep Extension', sets: 3, reps: 12, weight: 15, tags: ['Triceps', 'Upper Body'] },
  { id: '37', name: 'Skullcrusher', sets: 3, reps: 10, weight: 15, tags: ['Triceps', 'Upper Body'] },
  { id: '38', name: 'Close-grip Bench Press', sets: 3, reps: 10, weight: 50, tags: ['Chest', 'Triceps', 'Upper Body'] },
  { id: '39', name: 'Tricep Dips', sets: 3, reps: 12, weight: 0, tags: ['Triceps', 'Chest', 'Upper Body'] },
  
  // Back exercises
  { id: '40', name: 'Pull-up', sets: 3, reps: 8, weight: 0, tags: ['Back', 'Biceps', 'Upper Body'] },
  { id: '41', name: 'Chin-up', sets: 3, reps: 8, weight: 0, tags: ['Back', 'Biceps', 'Upper Body'] },
  { id: '42', name: 'Lat Pulldown', sets: 3, reps: 10, weight: 50, tags: ['Back', 'Biceps', 'Upper Body'] },
  { id: '43', name: 'Bent Over Row', sets: 3, reps: 10, weight: 40, tags: ['Back', 'Upper Body'] },
  { id: '44', name: 'Seated Cable Row', sets: 3, reps: 10, weight: 45, tags: ['Back', 'Upper Body'] },
  { id: '45', name: 'T-bar Row', sets: 3, reps: 10, weight: 40, tags: ['Back', 'Upper Body'] },
  { id: '46', name: 'Face Pull', sets: 3, reps: 15, weight: 15, tags: ['Shoulders', 'Upper Body'] },
  { id: '47', name: 'Single-arm Dumbbell Row', sets: 3, reps: 10, weight: 20, tags: ['Back', 'Upper Body'] },
  
  // Shoulder exercises
  { id: '48', name: 'Overhead Press', sets: 3, reps: 10, weight: 40, tags: ['Shoulders', 'Upper Body'] },
  { id: '49', name: 'Dumbbell Shoulder Press', sets: 3, reps: 10, weight: 20, tags: ['Shoulders', 'Upper Body'] },
  { id: '50', name: 'Lateral Raise', sets: 3, reps: 12, weight: 8, tags: ['Shoulders', 'Upper Body'] },
  { id: '51', name: 'Front Raise', sets: 3, reps: 12, weight: 8, tags: ['Shoulders', 'Upper Body'] },
  { id: '52', name: 'Rear Delt Fly', sets: 3, reps: 12, weight: 8, tags: ['Shoulders', 'Upper Body'] },
  { id: '53', name: 'Reverse Pec Deck', sets: 3, reps: 12, weight: 25, tags: ['Shoulders', 'Upper Body'] },
  { id: '54', name: 'Arnold Press', sets: 3, reps: 10, weight: 15, tags: ['Shoulders', 'Upper Body'] },
  { id: '55', name: 'Upright Row', sets: 3, reps: 10, weight: 25, tags: ['Shoulders', 'Upper Body'] },
  
  // Ab exercises
  { id: '56', name: 'Crunch', sets: 3, reps: 20, weight: 0, tags: ['Abs'] },
  { id: '57', name: 'Cable Crunch', sets: 3, reps: 15, weight: 25, tags: ['Abs'] },
  { id: '58', name: 'Plank', sets: 3, reps: 0, duration: 60, weight: 0, tags: ['Abs'] },
  { id: '59', name: 'Side Plank', sets: 3, reps: 0, duration: 30, weight: 0, tags: ['Abs'] },
  { id: '60', name: 'Russian Twist', sets: 3, reps: 20, weight: 5, tags: ['Abs'] },
  { id: '61', name: 'Hanging Leg Raise', sets: 3, reps: 12, weight: 0, tags: ['Abs'] },
  { id: '62', name: 'Toes to Bar', sets: 3, reps: 10, weight: 0, tags: ['Abs'] },
  { id: '63', name: 'Mountain Climber', sets: 3, reps: 0, duration: 45, weight: 0, tags: ['Abs'] },
  { id: '64', name: 'Ab Wheel Rollout', sets: 3, reps: 10, weight: 0, tags: ['Abs'] },
  { id: '65', name: 'Leg Raise', sets: 3, reps: 15, weight: 0, tags: ['Abs'] },
  { id: '66', name: 'V-up', sets: 3, reps: 15, weight: 0, tags: ['Abs'] },
  { id: '67', name: 'Sit-up', sets: 3, reps: 20, weight: 0, tags: ['Abs'] },
  
  // Cardio
  { id: '68', name: 'Jumping Jack', sets: 3, reps: 0, duration: 60, weight: 0, tags: ['Cardio'] },
];

interface ExerciseSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onExercisesSelected: (selectedExercises: Exercise[]) => void;
  workoutId?: string;
}

interface AlphabeticalSection {
  letter: string;
  data: Exercise[];
}

export const ExerciseSelectionModal: React.FC<ExerciseSelectionModalProps> = ({
  visible,
  onClose,
  onExercisesSelected,
  workoutId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Reset selections when modal is opened
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setSelectedExercises([]);
    }
  }, [visible]);

  // Ouvrir la modale de filtres
  const handleOpenFilterModal = () => {
    setIsFilterModalVisible(true);
  };

  // Fonction pour mettre à jour les tags sélectionnés
  const handleTagsSelected = (tags: string[]) => {
    setSelectedTags(tags);
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

  // Filter exercises based on search query and tags
  const filteredExercises = useMemo(() => {
    let filtered = SAMPLE_EXERCISES;
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(exercise => 
        exercise.tags?.some(tag => selectedTags.includes(tag))
      );
    }
    
    return filtered;
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

  const handleAddSelectedExercises = () => {
    onExercisesSelected(selectedExercises);
    onClose();
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
        style={styles.exerciseItem}
        onPress={() => toggleExerciseSelection(exercise)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.checkbox, 
          isSelected && styles.checkboxSelected
        ]}>
          {isSelected && (
            <Ionicons name="checkmark" size={24} color="#000000" />
          )}
        </View>
        
        <Text style={styles.exerciseName}>{exercise.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <FullScreenModal
      visible={visible}
      onClose={onClose}
    >
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.innerContainer}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity 
                  style={styles.backButton} 
                  onPress={onClose}
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
                style={styles.filterButton}
                onPress={handleOpenFilterModal}
              >
                <Text style={styles.filterButtonText}>{getFilterButtonText()}</Text>
                <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
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
                  onPress={handleAddSelectedExercises}
                  disabled={selectedExercises.length === 0}
                >
                  <Text style={styles.addExercisesButtonText}>
                    {selectedExercises.length === 0 
                      ? 'Select exercises' 
                      : `Add ${selectedExercises.length} exercise${selectedExercises.length > 1 ? 's' : ''}`}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Filter Modal */}
              <ExerciseFilterModal
                visible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                availableTags={useMemo(() => {
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
                  
                  // Ajouter les tags des exercices
                  SAMPLE_EXERCISES.forEach(exercise => {
                    if (exercise.tags) {
                      exercise.tags.forEach(tag => tagSet.add(tag));
                    }
                  });
                  
                  return Array.from(tagSet).sort();
                }, [])}
                selectedTags={selectedTags}
                onTagsSelected={handleTagsSelected}
              />
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
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
  innerContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#242526',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
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
  },
  sectionHeaderText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  checkbox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  exerciseName: {
    marginLeft: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  fadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
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
  bottomPadding: {
    height: 116, // Space for bottom button + extra padding
  },
}); 