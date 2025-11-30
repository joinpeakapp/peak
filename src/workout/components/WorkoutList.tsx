import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, UIManager, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useScrollToTop } from '@react-navigation/native';
import { WorkoutCard } from './WorkoutCard';
import { Workout } from '../../types/workout';
import { useWorkout } from '../../hooks/useWorkout';
import { WorkoutEditModal } from './WorkoutEditModal';
import { WorkoutRepositionModal } from './WorkoutRepositionModal';

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
  const { removeWorkout, reorderWorkouts } = useWorkout();
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedWorkoutForReposition, setSelectedWorkoutForReposition] = useState<Workout | null>(null);
  const [isRepositionModalVisible, setIsRepositionModalVisible] = useState(false);
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

  const handleReposition = (workout: Workout) => {
    // Pattern similaire à handleEdit qui fonctionne
    // Réinitialiser d'abord pour garantir un état propre
    setSelectedWorkoutForReposition(null);
    setIsRepositionModalVisible(false);
    setTimeout(() => {
      setSelectedWorkoutForReposition(workout);
      setIsRepositionModalVisible(true);
    }, 10);
  };

  const handleRepositionClose = () => {
    setIsRepositionModalVisible(false);
    // Délai pour laisser l'animation de fermeture se terminer avant de réinitialiser le workout
    // Même pattern que hideRepositionModal dans useModalManagement
    setTimeout(() => {
      setSelectedWorkoutForReposition(null);
    }, 300);
  };

  const handleRepositionWorkout = useCallback((workoutId: string, newPosition: number) => {
    console.log('[WorkoutList] Repositioning workout:', workoutId, 'to position:', newPosition);
    
    // Activer LayoutAnimation pour Android si nécessaire
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    
    // Configurer l'animation de réorganisation
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
        springDamping: 0.7,
      },
    });
    
    // Trouver le workout à déplacer et son index actuel
    const workoutToMove = workouts.find(w => w.id === workoutId);
    if (!workoutToMove) return;
    
    const currentIndex = workouts.findIndex(w => w.id === workoutId);
    
    // Si la position est la même, ne rien faire
    if (currentIndex === newPosition) {
      console.log('[WorkoutList] Workout already at position:', newPosition);
      return;
    }
    
    // Créer une nouvelle liste sans le workout à déplacer
    const workoutsWithoutMoved = workouts.filter(w => w.id !== workoutId);
    
    // Calculer la position d'insertion dans la liste sans le workout
    let adjustedPosition: number;
    if (currentIndex < newPosition) {
      // Déplacement vers le bas : la position dans la liste sans le workout
      // est égale à newPosition (pas d'ajustement car on retire avant)
      adjustedPosition = newPosition;
    } else {
      // Déplacement vers le haut : pas d'ajustement nécessaire
      adjustedPosition = newPosition;
    }
    
    // Insérer le workout à la nouvelle position
    const updatedWorkouts = [
      ...workoutsWithoutMoved.slice(0, adjustedPosition),
      workoutToMove,
      ...workoutsWithoutMoved.slice(adjustedPosition)
    ];
    
    // Mettre à jour le store avec le nouvel ordre
    reorderWorkouts(updatedWorkouts);
    console.log('[WorkoutList] Updated workouts order');
  }, [workouts, reorderWorkouts]);

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
      onReposition={() => handleReposition(item)}
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

      {selectedWorkoutForReposition && (
        <WorkoutRepositionModal
          visible={isRepositionModalVisible}
          onClose={handleRepositionClose}
          workouts={workouts}
          selectedWorkout={selectedWorkoutForReposition}
          onPositionSelected={(newPosition) => handleRepositionWorkout(selectedWorkoutForReposition.id, newPosition)}
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