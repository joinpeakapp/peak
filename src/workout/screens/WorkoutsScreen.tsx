import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WorkoutList } from '../components/WorkoutList';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useWorkout } from '../../hooks/useWorkout';
import { Workout } from '../../types/workout';
import { mockWorkouts } from '../../data/mockWorkouts';
import { WorkoutCreationModal } from '../components/WorkoutCreationModal';
import { WorkoutDetailModal } from '../components/WorkoutDetailModal';
import ActiveWorkoutIndicator from '../components/ActiveWorkoutIndicator';
import { useActiveWorkout } from '../contexts/ActiveWorkoutContext';

export const WorkoutsScreen: React.FC = () => {
  const { workouts, loading, error, createWorkout } = useWorkout();
  const { activeWorkout } = useActiveWorkout();
  const [isCreationModalVisible, setIsCreationModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  // Charger les données de test au montage du composant
  useEffect(() => {
    // Cette logique est pour le développement uniquement
    if (workouts.length === 0) {
      mockWorkouts.forEach(workout => createWorkout(workout));
    }
  }, []);

  const handleWorkoutPress = (workout: Workout) => {
    // Si une séance est en cours pour ce workout, continuer avec ce workout
    if (activeWorkout && activeWorkout.workoutId === workout.id) {
      setSelectedWorkout(workout);
      setIsDetailModalVisible(true);
      return;
    }

    // Sinon, ouvrir le workout normalement
    setSelectedWorkout(workout);
    setIsDetailModalVisible(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalVisible(false);
    // Réinitialiser le workout sélectionné après un délai pour éviter les flashs
    setTimeout(() => {
      setSelectedWorkout(null);
    }, 300);
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

  // Gestionnaire pour reprendre une séance active
  const handleResumeActiveWorkout = () => {
    if (activeWorkout) {
      // Trouver le workout correspondant à la séance active
      const workout = workouts.find(w => w.id === activeWorkout.workoutId);
      if (workout) {
        setSelectedWorkout(workout);
        setIsDetailModalVisible(true);
      }
    }
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

      <WorkoutDetailModal
        visible={isDetailModalVisible}
        onClose={handleCloseDetailModal}
        workout={selectedWorkout}
      />

      {/* Indicateur de séance active */}
      <ActiveWorkoutIndicator onPress={handleResumeActiveWorkout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
}); 