import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutList } from '../components/WorkoutList';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useWorkout } from '../../hooks/useWorkout';
import { Workout } from '../../types/workout';
import { WorkoutCreationModal } from '../components/WorkoutCreationModal';
import { WorkoutDetailModal } from '../components/WorkoutDetailModal';
import ActiveWorkoutIndicator from '../components/ActiveWorkoutIndicator';
import { useActiveWorkout } from '../contexts/ActiveWorkoutContext';
import { useWorkoutCreation } from '../../contexts/WorkoutCreationContext';
import { NotificationPermissionBottomSheet } from '../../components/common/NotificationPermissionBottomSheet';
import { FirstWorkoutTracker } from '../../services/firstWorkoutTracker';
import logger from '../../utils/logger';

const NOTIFICATION_PERMISSION_SHOWN_KEY = '@peak_notification_permission_shown';

export const WorkoutsScreen: React.FC = () => {
  const { workouts, loading, error, createWorkout } = useWorkout();
  const { activeWorkout } = useActiveWorkout();
  const { isWorkoutCreationOpen, closeWorkoutCreation } = useWorkoutCreation();
  const [isCreationModalVisible, setIsCreationModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showNotificationBottomSheet, setShowNotificationBottomSheet] = useState(false);

  // Synchroniser avec le contexte
  useEffect(() => {
    if (isWorkoutCreationOpen) {
      setIsCreationModalVisible(true);
    }
  }, [isWorkoutCreationOpen]);

  // Synchroniser selectedWorkout avec les changements dans le store
  useEffect(() => {
    if (selectedWorkout && workouts.length > 0) {
      const updatedWorkout = workouts.find(w => w.id === selectedWorkout.id);
      if (updatedWorkout && updatedWorkout.updatedAt !== selectedWorkout.updatedAt) {
        setSelectedWorkout(updatedWorkout);
      }
    }
  }, [workouts, selectedWorkout]);

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
    };

  const handleAddPress = () => {
    // Ouvrir la modale de création
    setIsCreationModalVisible(true);
  };

  const handleCloseCreationModal = () => {
    setIsCreationModalVisible(false);
    closeWorkoutCreation();
  };

  const handleWorkoutCreated = async (workoutId: string) => {
    // Le workout a été créé, l'écran de succès est maintenant dans la modale
    // Vérifier si c'est le premier workout et afficher le Bottom Sheet de notification
    try {
      const hasCreatedFirstWorkout = await FirstWorkoutTracker.hasCreatedFirstWorkout();
      const notificationShown = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_SHOWN_KEY);
      
      if (!hasCreatedFirstWorkout && notificationShown !== 'true') {
        // C'est le premier workout et on n'a pas encore montré le Bottom Sheet
        logger.log('[WorkoutsScreen] First workout created, will show notification bottom sheet');
        
        // Marquer que le premier workout a été créé
        await FirstWorkoutTracker.markFirstWorkoutCreated();
        
        // Attendre que la modale de création se ferme avant d'afficher le Bottom Sheet
        setTimeout(() => {
          setShowNotificationBottomSheet(true);
        }, 800); // Délai pour laisser la modale se fermer
      } else {
        logger.log('[WorkoutsScreen] Not showing notification bottom sheet', { 
          hasCreatedFirstWorkout, 
          notificationShown 
        });
      }
    } catch (error) {
      logger.error('[WorkoutsScreen] Error checking first workout:', error);
    }
  };

  const handleCloseNotificationBottomSheet = () => {
    setShowNotificationBottomSheet(false);
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
        onWorkoutCreated={handleWorkoutCreated}
      />

      <WorkoutDetailModal
        visible={isDetailModalVisible}
        onClose={handleCloseDetailModal}
        workout={selectedWorkout}
      />

      {/* Indicateur de séance active */}
      <ActiveWorkoutIndicator onPress={handleResumeActiveWorkout} />

      {/* Bottom Sheet pour permission notifications (après premier workout) */}
      <NotificationPermissionBottomSheet 
        visible={showNotificationBottomSheet}
        onClose={handleCloseNotificationBottomSheet}
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