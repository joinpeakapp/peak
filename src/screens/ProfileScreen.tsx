import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { useWorkout } from '../hooks/useWorkout';
import { useWorkoutHistory } from '../workout/contexts/WorkoutHistoryContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileScreenProps } from '../types/navigation';
import { useEnhancedPersonalRecords } from '../hooks/useEnhancedPersonalRecords';

export const ProfileScreen: React.FC = () => {
  const { personalRecords } = useWorkout();
  const { completedWorkouts } = useWorkoutHistory();
  const { records: enhancedRecords } = useEnhancedPersonalRecords();
  const navigation = useNavigation<ProfileScreenProps['navigation']>();

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
    
    // Utiliser d'abord les records améliorés
    Object.entries(enhancedRecords).forEach(([exerciseName, record]) => {
      if (record.maxWeight > 0) {
        exercisesMap.set(exerciseName, {
          name: exerciseName,
          weight: record.maxWeight,
          // Chercher le reps pour ce poids maximum
          reps: Object.entries(record.repsPerWeight)
            .find(([weight]) => parseInt(weight) === record.maxWeight)?.[1]?.reps || 0,
          date: record.maxWeightDate
        });
      }
    });
    
    // Ensuite compléter avec les anciens records si nécessaire
    completedWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        // For each exercise, check if it has completed sets
        const completedSets = exercise.sets.filter(set => set.completed);
        if (completedSets.length > 0) {
          // Find the set with the highest weight
          const maxWeightSet = [...completedSets].sort((a, b) => b.weight - a.weight)[0];
          
          // If the exercise doesn't exist in the map yet or if this weight is higher, store it
          if (!exercisesMap.has(exercise.name) || maxWeightSet.weight > exercisesMap.get(exercise.name).weight) {
            exercisesMap.set(exercise.name, {
              name: exercise.name,
              weight: maxWeightSet.weight,
              reps: maxWeightSet.reps,
              date: workout.date
            });
          }
        }
      });
    });
    
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
});
