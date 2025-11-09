import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useScrollToTop } from '@react-navigation/native';
import { WorkoutCard } from './WorkoutCard';
import { Workout } from '../../types/workout';
import { useWorkout } from '../../hooks/useWorkout';
import { WorkoutEditModal } from './WorkoutEditModal';

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
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Scroll vers le haut quand on clique sur le tab actif
  useScrollToTop(flatListRef);

  const handleEdit = (workout: Workout) => {
    // Force update to trigger a clean render
    setEditingWorkout(null);
    
    // Small delay to ensure previous state is cleared
    setTimeout(() => {
      setEditingWorkout(workout);
      setIsEditModalVisible(true);
    }, 10);
  };

  const handleDelete = (workoutId: string) => {
    removeWorkout(workoutId);
  };

  const handleEditClose = () => {
    setIsEditModalVisible(false);
    // Clear the editing workout after modal animation
    setTimeout(() => {
      setEditingWorkout(null);
    }, 300);
  };

  const handleEditSave = () => {
    handleEditClose();
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="barbell-outline" size={48} color="#FFFFFF" />
      
      <View style={styles.emptyStateTextContainer}>
        <Text style={styles.emptyStateTitle}>No workout yet</Text>
        <Text style={styles.emptyStateSubtitle}>Your workouts will appear here</Text>
      </View>
      
      <TouchableOpacity style={styles.createButton} onPress={onAddPress}>
        <Text style={styles.createButtonText}>Create a new workout</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWorkoutItem = ({ item }: { item: Workout }) => (
    <WorkoutCard
      key={item.id}
      workout={item}
      onPress={() => onWorkoutPress(item)}
      onEdit={() => handleEdit(item)}
      onDelete={() => handleDelete(item.id)}
    />
  );

  return (
    <>
      {/* Header always visible at the top */}
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        ref={flatListRef}
        style={styles.container}
        data={workouts}
        renderItem={renderWorkoutItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={workouts.length === 0 ? styles.emptyContainer : styles.content}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={8}
        windowSize={10}
      />
      
      {editingWorkout && (
        <WorkoutEditModal
          visible={isEditModalVisible}
          workout={editingWorkout}
          onClose={handleEditClose}
          onSave={handleEditSave}
        />
      )}
    </>
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
    paddingHorizontal: 12,
    paddingTop: 80,
    paddingBottom: 24,
    backgroundColor: '#0D0D0F',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22, // Made round: 44/2 = 22
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTextContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  createButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: '600',
  },
}); 