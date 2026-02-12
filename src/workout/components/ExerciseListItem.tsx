import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '../../types/workout';

interface ExerciseListItemProps {
  exercise: Exercise;
  isSelected: boolean;
  isAlreadyInWorkout: boolean;
  isNewlyCreated: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

/**
 * Composant pour afficher un exercice dans la liste de sélection
 * 
 * Gère les états :
 * - Sélectionné (checkbox cochée)
 * - Déjà ajouté au workout (désactivé avec badge "ADDED")
 * - Nouvellement créé (highlight vert avec badge "NEW")
 */
export const ExerciseListItem: React.FC<ExerciseListItemProps> = ({
  exercise,
  isSelected,
  isAlreadyInWorkout,
  isNewlyCreated,
  onPress,
  onLongPress
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.selectionExerciseItem,
        isNewlyCreated && styles.selectionExerciseItemHighlight,
        isAlreadyInWorkout && styles.selectionExerciseItemDisabled
      ]}
      onPress={() => {
        if (!isAlreadyInWorkout) {
          onPress();
        }
      }}
      onLongPress={() => {
        if (!isAlreadyInWorkout) {
          onLongPress();
        }
      }}
      activeOpacity={isAlreadyInWorkout ? 1 : 0.7}
      disabled={isAlreadyInWorkout}
      pointerEvents={isAlreadyInWorkout ? 'none' : 'auto'}
    >
      <View style={styles.exerciseSelectionRow}>
        <View style={[
          styles.checkbox, 
          isSelected && styles.checkboxSelected,
          isAlreadyInWorkout && styles.checkboxDisabled
        ]}>
          {isSelected && !isAlreadyInWorkout && (
            <Ionicons name="checkmark" size={24} color="#000000" />
          )}
          {isAlreadyInWorkout && (
            <Ionicons name="checkmark" size={24} color="rgba(255, 255, 255, 0.3)" />
          )}
        </View>
        
        <View style={styles.exerciseNameContainer}>
          <Text style={[
            styles.selectionExerciseName,
            isAlreadyInWorkout && styles.selectionExerciseNameDisabled
          ]}>
            {exercise.name}
          </Text>
          {isNewlyCreated && !isAlreadyInWorkout && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          {isAlreadyInWorkout && (
            <View style={styles.alreadyAddedBadge}>
              <Text style={styles.alreadyAddedBadgeText}>ADDED</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  selectionExerciseItem: {
    paddingVertical: 16,
  },
  selectionExerciseItemHighlight: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  selectionExerciseItemDisabled: {
    opacity: 0.4,
  },
  exerciseSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  checkboxDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
  selectionExerciseNameDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
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
  alreadyAddedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  alreadyAddedBadgeText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

