import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WorkoutList } from '../components/WorkoutList';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useWorkout } from '../../hooks/useWorkout';
import { Workout } from '../../types/workout';
import { mockWorkouts } from '../../data/mockWorkouts';

export const WorkoutsScreen: React.FC = () => {
  const { workouts, loading, error, createWorkout, removeWorkout } = useWorkout();

  // Charger les données de test au montage du composant
  useEffect(() => {
    // Supprimer tous les workouts existants
    workouts.forEach(workout => removeWorkout(workout.id));
    // Ajouter les workouts de test
    mockWorkouts.forEach(workout => createWorkout(workout));
  }, []);

  const handleWorkoutPress = (workout: Workout) => {
    // TODO: Navigation vers les détails du workout
    console.log('Workout pressed:', workout.id);
  };

  const handleWorkoutSettingsPress = (workout: Workout) => {
    // TODO: Afficher le menu de paramètres du workout
    console.log('Workout settings pressed:', workout.id);
  };

  const handleAddPress = () => {
    // TODO: Navigation vers l'écran de création de workout
    console.log('Add workout pressed');
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
        onWorkoutSettingsPress={handleWorkoutSettingsPress}
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