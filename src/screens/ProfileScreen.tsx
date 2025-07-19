import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Modal
} from 'react-native';
import { useWorkout } from '../hooks/useWorkout';
import { useWorkoutHistory } from '../workout/contexts/WorkoutHistoryContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileScreenProps } from '../types/navigation';
import { useEnhancedPersonalRecords } from '../hooks/useEnhancedPersonalRecords';
import { ErrorTestComponent } from '../components/common/ErrorTestComponent';
import { StorageTestComponent } from '../components/common/StorageTestComponent';
import { ImageCacheTestComponent } from '../components/common/ImageCacheTestComponent';

export const ProfileScreen: React.FC = () => {
  const { personalRecords } = useWorkout();
  const { completedWorkouts, refreshWorkoutHistory } = useWorkoutHistory();
  const { records: enhancedRecords, loadRecords } = useEnhancedPersonalRecords();
  const navigation = useNavigation<ProfileScreenProps['navigation']>();
  const [showErrorTest, setShowErrorTest] = useState(false);
  const [showStorageTest, setShowStorageTest] = useState(false);
  const [showImageCacheTest, setShowImageCacheTest] = useState(false);

  // Recharger les records et l'historique lorsque l'écran Profile est focalisé
  useFocusEffect(
    useCallback(() => {
      const refreshData = async () => {
        try {
          // Rafraîchir l'historique des workouts
          await refreshWorkoutHistory();
          
          // Recharger les records personnels
          await loadRecords();
          
        } catch (error) {
          console.error('[ProfileScreen] Error refreshing data:', error);
        }
      };
      
      refreshData();
    }, [refreshWorkoutHistory, loadRecords])
  );

  // Calculate workout statistics
  const workoutStats = useMemo(() => {
    // Total workouts completed
    const totalWorkouts = completedWorkouts.length;
    
    // Total exercises performed (counting each exercise in a workout)
    const totalExercises = completedWorkouts.reduce(
      (total, workout) => total + workout.exercises.length, 
      0
    );
    
    // Total sets completed
    const totalSets = completedWorkouts.reduce(
      (total, workout) => total + workout.exercises.reduce(
        (subTotal, exercise) => subTotal + exercise.sets.filter(set => set.completed).length, 
        0
      ), 
      0
    );
    
    // Total weight lifted (kg)
    const totalWeight = completedWorkouts.reduce(
      (total, workout) => total + workout.exercises.reduce(
        (subTotal, exercise) => subTotal + exercise.sets.reduce(
          (setTotal, set) => set.completed ? setTotal + (set.weight * set.reps) : setTotal,
          0
        ),
        0
      ),
      0
    );
    
    // Find unique workout types
    const workoutTypes = new Set(completedWorkouts.map(workout => workout.name));
    
    // Extract all unique exercises with their records (max weight)
    const exercisesMap = new Map();
    
    // Utiliser uniquement les records améliorés pour garantir la cohérence
    // Si un exercice n'est pas dans enhancedRecords, il ne sera pas affiché
    // Cela évite le problème de cards affichées mais avec des détails vides
    console.log('[ProfileScreen] Processing enhanced records:', Object.keys(enhancedRecords));
    Object.entries(enhancedRecords).forEach(([exerciseName, record]) => {
      // Validation stricte : s'assurer que l'exercice a des données complètes et valides
      if (record.maxWeight > 0 && record.maxWeightDate && record.repsPerWeight && Object.keys(record.repsPerWeight).length > 0) {
        console.log(`[ProfileScreen] ✅ Enhanced record valid for ${exerciseName}: ${record.maxWeight}kg`);
        exercisesMap.set(exerciseName, {
          name: exerciseName,
          weight: record.maxWeight,
          reps: 0, // On n'affiche plus les reps sur la card
          date: record.maxWeightDate
        });
      } else {
        console.log(`[ProfileScreen] ❌ Enhanced record invalid for ${exerciseName}:`, {
          maxWeight: record.maxWeight,
          hasDate: !!record.maxWeightDate,
          hasRepsPerWeight: !!record.repsPerWeight,
          repsCount: Object.keys(record.repsPerWeight || {}).length
        });
      }
    });
    
    console.log('[ProfileScreen] Final exercises to display:', Array.from(exercisesMap.keys()));
    
    // Convert the map to array and sort by weight (highest to lowest)
    const exercisesList = Array.from(exercisesMap.values()).sort((a, b) => b.weight - a.weight);
    
    return {
      totalWorkouts,
      totalExercises,
      totalSets,
      totalWeight,
      uniqueWorkoutTypes: workoutTypes.size,
      exercisesList
    };
  }, [completedWorkouts, enhancedRecords]);
  
  const navigateToExerciseDetail = (exerciseName: string) => {
    navigation.navigate('ExerciseDetail', { exerciseName });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          {/* Development-only test buttons */}
          {__DEV__ && (
            <View style={styles.testButtonsContainer}>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => setShowStorageTest(true)}
              >
                <Ionicons name="server" size={18} color="#10B981" />
                <Text style={[styles.testButtonText, { color: '#10B981' }]}>Storage</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => setShowImageCacheTest(true)}
              >
                <Ionicons name="image" size={18} color="#3B82F6" />
                <Text style={[styles.testButtonText, { color: '#3B82F6' }]}>Images</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => setShowErrorTest(true)}
              >
                <Ionicons name="bug" size={18} color="#FF6B6B" />
                <Text style={[styles.testButtonText, { color: '#FF6B6B' }]}>Errors</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={styles.statsCard}>
              <Text style={styles.statsNumber}>{workoutStats.totalWorkouts}</Text>
              <Text style={styles.statsLabel}>Workouts</Text>
            </View>
            
            <View style={styles.statsCard}>
              <Text style={styles.statsNumber}>{workoutStats.totalExercises}</Text>
              <Text style={styles.statsLabel}>Exercises</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statsCard}>
              <Text style={styles.statsNumber}>{workoutStats.totalSets}</Text>
              <Text style={styles.statsLabel}>Sets</Text>
            </View>
            
            <View style={styles.statsCard}>
              <Text style={styles.statsNumber}>{(workoutStats.totalWeight / 1000).toFixed(1)}k</Text>
              <Text style={styles.statsLabel}>Kg lifted</Text>
            </View>
          </View>
        </View>
        
        {/* List of exercises with their personal records */}
        <View style={styles.exercisesContainer}>
          <Text style={styles.sectionTitle}>My Exercises</Text>
          
          {workoutStats.exercisesList.length === 0 ? (
            <View style={styles.emptyExercisesMessage}>
              <Text style={styles.emptyText}>No recorded exercises</Text>
            </View>
          ) : (
            workoutStats.exercisesList.map((exercise, index) => (
              <TouchableOpacity 
                key={`exercise-${index}`}
                style={styles.exerciseCard}
                onPress={() => navigateToExerciseDetail(exercise.name)}
                activeOpacity={0.7}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDate}>
                    Personal record: {exercise.weight} kg
                  </Text>
                </View>
                <View style={styles.chevronContainer}>
                  <Ionicons name="chevron-forward" size={24} color="#5B5B5C" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
      
      {/* Storage Test Modal (Development only) */}
      {__DEV__ && (
        <Modal
          visible={showStorageTest}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <StorageTestComponent onClose={() => setShowStorageTest(false)} />
        </Modal>
      )}
      
      {/* Error Boundary Test Modal (Development only) */}
      {__DEV__ && (
        <Modal
          visible={showErrorTest}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <ErrorTestComponent onClose={() => setShowErrorTest(false)} />
        </Modal>
      )}
      
      {/* Image Cache Test Modal (Development only) */}
      {__DEV__ && (
        <Modal
          visible={showImageCacheTest}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <ImageCacheTestComponent onClose={() => setShowImageCacheTest(false)} />
        </Modal>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  scrollView: {
    flex: 1,
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
  statsGrid: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#1A1A1D',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statsLabel: {
    fontSize: 14,
    color: '#888888',
  },
  exercisesContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  exerciseCard: {
    backgroundColor: '#1A1A1D',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  exerciseDate: {
    fontSize: 12,
    color: '#888',
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  emptyExercisesMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  testButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2D',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
