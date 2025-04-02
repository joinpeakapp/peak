import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WorkoutList } from '../components/WorkoutList';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useWorkout } from '../../hooks/useWorkout';
import { Workout } from '../../types/workout';
import { mockWorkouts } from '../../data/mockWorkouts';
import { WorkoutsScreenProps } from '../../types/navigation';

export const WorkoutsScreen: React.FC<WorkoutsScreenProps> = ({ navigation }) => {
  const { workouts, loading, error, createWorkout, removeWorkout } = useWorkout();

  // Charger les données de test au montage du composant
  useEffect(() => {
    // Supprimer tous les workouts existants
    workouts.forEach(workout => removeWorkout(workout.id));
    // Ajouter les workouts de test
    mockWorkouts.forEach(workout => createWorkout(workout));
  }, []);

  const handleWorkoutPress = (workout: Workout) => {
    // Navigation vers les détails du workout
    navigation.navigate('WorkoutDetail', { workoutId: workout.id });
  };

  const handleAddPress = () => {
    // Navigation vers l'écran de création de workout
    navigation.navigate('WorkoutCreation');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <View style={styles.container}>
      <WorkoutList
        workouts={workouts}
        onWorkoutPress={handleWorkoutPress}
        onAddPress={handleAddPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
}); 