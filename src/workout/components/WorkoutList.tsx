import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutCard } from './WorkoutCard';
import { Workout } from '../../types/workout';
import { useWorkout } from '../../hooks/useWorkout';

interface WorkoutListProps {
  /** Array of workouts to display */
  workouts: Workout[];
  /** Callback function when a workout is pressed */
  onWorkoutPress: (workout: Workout) => void;
  /** Callback function when add button is pressed */
  onAddPress: () => void;
}

/**
 * A list component that displays workout cards.
 * 
 * @component
 * @example
 * ```tsx
 * <WorkoutList workouts={[
 *   {
 *     id: '1',
 *     name: 'Morning Workout',
 *     date: '2024-03-20',
 *     duration: 60,
 *     exercises: [],
 *     frequency: 'Monday',
 *     streak: 5
 *   }
 * ]} />
 * ```
 */
export const WorkoutList: React.FC<WorkoutListProps> = ({ 
  workouts, 
  onWorkoutPress,
  onAddPress 
}) => {
  const { removeWorkout } = useWorkout();

  const handleEdit = (workoutId: string) => {
    // TODO: Implement edit functionality
    console.log('Edit workout:', workoutId);
  };

  const handleDelete = (workoutId: string) => {
    removeWorkout(workoutId);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {workouts.map(workout => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            onPress={() => onWorkoutPress(workout)}
            onEdit={() => handleEdit(workout.id)}
            onDelete={() => handleDelete(workout.id)}
          />
        ))}
      </View>
    </ScrollView>
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
    paddingTop: 80,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 100,
    backgroundColor: '#242526',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
}); 