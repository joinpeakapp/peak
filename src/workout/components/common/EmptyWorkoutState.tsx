import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyWorkoutStateProps {
  onAddExercise: () => void;
}

export const EmptyWorkoutState: React.FC<EmptyWorkoutStateProps> = ({
  onAddExercise,
}) => {
  return (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateSubtitle}>No exercise added yet</Text>
      
      <TouchableOpacity 
        style={styles.createButton}
        onPress={onAddExercise}
      >
        <Ionicons name="add-outline" size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Add exercise</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

