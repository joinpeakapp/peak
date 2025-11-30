import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ExerciseSectionHeader } from '../ExerciseSectionHeader';
import { ExerciseListItem } from '../ExerciseListItem';
import { Exercise } from '../../../types/workout';
import type { ExerciseSelectionMode } from '../../hooks/useExerciseSelection';

interface ExerciseSelectionViewProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  groupedExercises: Array<{ letter: string; data: Exercise[] }>;
  selectedExercises: Exercise[];
  newlyCreatedExerciseId: string | null;
  exercises: Exercise[];
  exerciseToReplaceId?: string;
  modalMode: ExerciseSelectionMode;
  getFilterButtonText: () => string;
  onClose: () => void;
  onStartExerciseCreation: () => void;
  onOpenFilterModal: () => void;
  onResetFilters: (event: any) => void;
  onToggleExerciseSelection: (exercise: Exercise) => void;
  onExerciseLongPress: (exercise: Exercise) => void;
  onExercisesSelected: () => void;
}

export const ExerciseSelectionView: React.FC<ExerciseSelectionViewProps> = ({
  searchQuery,
  onSearchChange,
  selectedTags,
  groupedExercises,
  selectedExercises,
  newlyCreatedExerciseId,
  exercises,
  exerciseToReplaceId,
  modalMode,
  getFilterButtonText,
  onClose,
  onStartExerciseCreation,
  onOpenFilterModal,
  onResetFilters,
  onToggleExerciseSelection,
  onExerciseLongPress,
  onExercisesSelected,
}) => {
  const renderSectionHeader = ({ letter }: { letter: string }) => (
    <ExerciseSectionHeader letter={letter} />
  );

  const renderExerciseItem = (exercise: Exercise) => {
    const isSelected = selectedExercises.some(ex => ex.id === exercise.id);
    const isNewlyCreated = newlyCreatedExerciseId === exercise.id;
    
    // Vérifier si l'exercice est déjà dans le workout
    const isAlreadyInWorkout = modalMode === 'exercise-selection' 
      ? exercises.some(ex => ex.id === exercise.id)
      : modalMode === 'exercise-replacement'
        ? (() => {
            // Trouver l'exercice qu'on est en train de remplacer
            const exerciseBeingReplaced = exerciseToReplaceId 
              ? exercises.find(ex => ex.id === exerciseToReplaceId)
              : null;
            
            // Vérifier si c'est le même exercice que celui qu'on remplace (même nom)
            const isSameAsReplacedExercise = exerciseBeingReplaced 
              ? exerciseBeingReplaced.name === exercise.name
              : false;
            
            // Si c'est le même exercice que celui qu'on remplace, on le marque comme déjà dans le workout pour empêcher la sélection
            if (isSameAsReplacedExercise) {
              return true;
            }
            
            // Sinon, vérifier si l'exercice est déjà dans le workout (mais pas celui qu'on remplace)
            return exercises.some(ex => {
              // Si c'est l'exercice qu'on remplace, ne pas le considérer comme déjà dans le workout
              if (ex.id === exerciseToReplaceId) {
                return false;
              }
              // Comparer par nom pour détecter si l'exercice est déjà dans le workout
              // même si l'ID a changé après un remplacement précédent
              return ex.name === exercise.name;
            });
          })()
        : false;
    
    return (
      <ExerciseListItem
        exercise={exercise}
        isSelected={isSelected}
        isAlreadyInWorkout={isAlreadyInWorkout}
        isNewlyCreated={isNewlyCreated}
        onPress={() => onToggleExerciseSelection(exercise)}
        onLongPress={() => onExerciseLongPress(exercise)}
      />
    );
  };

  return (
    <View style={styles.flexContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.arrowBackButton} 
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
            onChangeText={onSearchChange}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={onStartExerciseCreation}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* Filter Button */}
      <TouchableOpacity 
        style={[
          styles.filterButton, 
          selectedTags.length > 0 && styles.filterButtonActive
        ]} 
        onPress={onOpenFilterModal}
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
          <TouchableOpacity onPress={onResetFilters}>
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
          {groupedExercises.map((section) => (
            <View key={section.letter} pointerEvents="box-none">
              {renderSectionHeader({ letter: section.letter })}
              {section.data.map((exercise) => (
                <View key={exercise.id} pointerEvents="box-none">
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
          pointerEvents="none"
        />
      </View>
      
      {/* Bottom Add Button - Layout normal */}
      <View style={styles.bottomButtonContainerFlex}>
        <TouchableOpacity 
          style={[
            styles.addExercisesButton,
            selectedExercises.length === 0 && styles.addExercisesButtonDisabled
          ]}
          onPress={onExercisesSelected}
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
  );
};

const styles = StyleSheet.create({
  flexContainer: {
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
  arrowBackButton: {
    width: 44,
    height: 44,
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
  exerciseListContainerFlex: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollViewContent: {
    paddingBottom: 120,
  },
  fadeGradientSmall: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    zIndex: 1,
  },
  bottomButtonContainerFlex: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: '#0D0D0F',
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
});

