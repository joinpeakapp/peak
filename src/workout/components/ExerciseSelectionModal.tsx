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

// Exemple de données d'exercices
const SAMPLE_EXERCISES: Exercise[] = [
  { id: '1', name: 'Bench Press', sets: 3, reps: 10, weight: 60 },
  { id: '2', name: 'Squats', sets: 3, reps: 12, weight: 80 },
  { id: '3', name: 'Deadlift', sets: 3, reps: 8, weight: 100 },
  { id: '4', name: 'Pull-up', sets: 3, reps: 8, weight: 0 },
  { id: '5', name: 'Push-up', sets: 3, reps: 15, weight: 0 },
  { id: '6', name: 'Leg Press', sets: 3, reps: 12, weight: 120 },
  { id: '7', name: 'Lat Pulldown', sets: 3, reps: 10, weight: 50 },
  { id: '8', name: 'Shoulder Press', sets: 3, reps: 10, weight: 40 },
  { id: '9', name: 'Bicep Curl', sets: 3, reps: 12, weight: 15 },
  { id: '10', name: 'Tricep Extension', sets: 3, reps: 12, weight: 15 },
  { id: '11', name: 'Calf Raise', sets: 3, reps: 15, weight: 30 },
  { id: '12', name: 'Dumbbell Fly', sets: 3, reps: 12, weight: 12 },
  { id: '13', name: 'Bent Over Row', sets: 3, reps: 10, weight: 40 },
  { id: '14', name: 'Ab Crunch', sets: 3, reps: 20, weight: 0 },
  { id: '15', name: 'Plank', sets: 3, reps: 0, duration: 60, weight: 0 },
  { id: '16', name: 'Lunges', sets: 3, reps: 10, weight: 20 },
  { id: '17', name: 'Glute Bridge', sets: 3, reps: 15, weight: 0 },
  { id: '18', name: 'Side Plank', sets: 3, reps: 0, duration: 30, weight: 0 },
  { id: '19', name: 'Mountain Climber', sets: 3, reps: 0, duration: 45, weight: 0 },
  { id: '20', name: 'Box Jump', sets: 3, reps: 10, weight: 0 },
  { id: '21', name: 'Jumping Jack', sets: 3, reps: 0, duration: 60, weight: 0 },
  { id: '22', name: 'Russian Twist', sets: 3, reps: 20, weight: 5 },
  { id: '23', name: 'Face Pull', sets: 3, reps: 15, weight: 15 },
  { id: '24', name: 'Cable Crunch', sets: 3, reps: 15, weight: 25 },
  { id: '25', name: 'Hanging Leg Raise', sets: 3, reps: 12, weight: 0 },
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
  
  // Reset selections when modal is opened
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setSelectedExercises([]);
    }
  }, [visible]);

  // Filter exercises based on search query
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return SAMPLE_EXERCISES;
    }
    
    return SAMPLE_EXERCISES.filter(exercise => 
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

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
              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterButtonText}>Filter by</Text>
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