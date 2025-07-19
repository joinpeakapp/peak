import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  SectionList,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Exercise } from '../../types/workout';
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

const ExerciseSelectionModal: React.FC<ExerciseSelectionModalProps> = ({
  visible,
  onClose,
  onExercisesSelected
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Filter exercises based on search query and selected tags
  const filteredExercises = useMemo(() => {
    return SAMPLE_EXERCISES.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => exercise.tags?.includes(tag));
      return matchesSearch && matchesTags;
    });
  }, [searchQuery, selectedTags]);

  // Group exercises by first letter for SectionList
  const sectionedExercises = useMemo(() => {
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
      title: letter,
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

  const renderSectionHeader = ({ section }: { section: { title: string, data: Exercise[] } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  const renderExerciseItem = ({ item: exercise }: { item: Exercise }) => {
    const isSelected = selectedExercises.some(ex => ex.id === exercise.id);
    
    return (
      <TouchableOpacity
        style={[styles.exerciseItem, isSelected && styles.exerciseItemSelected]}
        onPress={() => toggleExerciseSelection(exercise)}
      >
        <View style={styles.exerciseItemContent}>
          <View style={styles.exerciseInfo}>
            <Text style={[styles.exerciseName, isSelected && styles.exerciseNameSelected]}>
              {exercise.name}
            </Text>
            <View style={styles.exerciseDetails}>
              <Text style={[styles.exerciseDetailText, isSelected && styles.exerciseDetailTextSelected]}>
                {exercise.sets} sets × {exercise.reps} reps
              </Text>
              {exercise.weight && exercise.weight > 0 && (
                <Text style={[styles.exerciseDetailText, isSelected && styles.exerciseDetailTextSelected]}>
                  {exercise.weight}kg
                </Text>
              )}
            </View>
            
            {/* Tags */}
            <View style={styles.exerciseTags}>
              {exercise.tags?.slice(0, 2).map((tag, index) => (
                <View key={index} style={[styles.exerciseTag, isSelected && styles.exerciseTagSelected]}>
                  <Text style={[styles.exerciseTagText, isSelected && styles.exerciseTagTextSelected]}>
                    {tag}
                  </Text>
                </View>
              ))}
              {exercise.tags && exercise.tags.length > 2 && (
                <Text style={[styles.exerciseMoreTags, isSelected && styles.exerciseMoreTagsSelected]}>
                  +{exercise.tags.length - 2}
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.selectionIndicator, isSelected && styles.selectionIndicatorSelected]}>
            {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Exercises</Text>
          <TouchableOpacity 
            onPress={() => setIsFilterModalVisible(true)}
            style={styles.filterButton}
          >
            <Ionicons name="filter" size={22} color="#FFFFFF" />
            {selectedTags.length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{selectedTags.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#AAAAAA" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor="#AAAAAA"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#AAAAAA" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Exercise List */}
        <View style={styles.exerciseListContainer}>
          <SectionList
            sections={sectionedExercises}
            renderItem={renderExerciseItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.id}
            style={styles.sectionList}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={15}
            initialNumToRender={12}
            windowSize={10}
            contentContainerStyle={styles.sectionListContent}
          />
          
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
            SAMPLE_EXERCISES.forEach(exercise => {
              exercise.tags?.forEach(tag => tagSet.add(tag));
            });
            
            return Array.from(tagSet).sort();
          }, [])}
          selectedTags={selectedTags}
          onTagsSelected={setSelectedTags}
        />
      </View>
    </Modal>
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
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  exerciseItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
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
  // New styles for SectionList rendering
  exerciseItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  exerciseInfo: {
    flex: 1,
    marginRight: 10,
  },
  exerciseNameSelected: {
    color: '#FFFFFF',
  },
  exerciseDetails: {
    flexDirection: 'row',
    marginTop: 4,
  },
  exerciseDetailText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  exerciseDetailTextSelected: {
    color: '#FFFFFF',
  },
  exerciseTags: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  exerciseTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  exerciseTagSelected: {
    backgroundColor: '#FFFFFF',
  },
  exerciseTagText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  exerciseTagTextSelected: {
    color: '#000000',
  },
  exerciseMoreTags: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  exerciseMoreTagsSelected: {
    color: '#000000',
  },
  selectionIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIndicatorSelected: {
    backgroundColor: '#FFFFFF',
  },
  // New styles for Modal header
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  filterBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  clearButton: {
    padding: 8,
  },
  sectionList: {
    flex: 1,
  },
  sectionListContent: {
    paddingBottom: 116, // Space for bottom button + extra padding
  },
}); 