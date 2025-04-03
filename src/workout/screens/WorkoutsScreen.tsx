import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WorkoutList } from '../components/WorkoutList';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useWorkout } from '../../hooks/useWorkout';
import { Workout } from '../../types/workout';
import { mockWorkouts } from '../../data/mockWorkouts';
import { WorkoutCreationModal } from '../components/WorkoutCreationModal';

export const WorkoutsScreen: React.FC = () => {
  const { workouts, loading, error, createWorkout } = useWorkout();
  const [isCreationModalVisible, setIsCreationModalVisible] = useState(false);

  // Charger les données de test au montage du composant
  useEffect(() => {
    // Cette logique est pour le développement uniquement
    if (workouts.length === 0) {
      mockWorkouts.forEach(workout => createWorkout(workout));
    }
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
    // Ouvrir la modale de création
    setIsCreationModalVisible(true);
  };

  const handleCloseCreationModal = () => {
    setIsCreationModalVisible(false);
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
      
      <WorkoutCreationModal 
        visible={isCreationModalVisible}
        onClose={handleCloseCreationModal}
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