import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveWorkout } from '../contexts/ActiveWorkoutContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Définition des types pour la navigation
type RootStackParamList = {
  WorkoutDetail: { id: string };
  // Ajoutez ici les autres écrans de navigation si nécessaire
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'WorkoutDetail'>;

interface ActiveWorkoutIndicatorProps {
  onPress?: () => void;
}

const ActiveWorkoutIndicator: React.FC<ActiveWorkoutIndicatorProps> = ({ onPress }) => {
  const { activeWorkout, isTrackingWorkout } = useActiveWorkout();
  const navigation = useNavigation<NavigationProp>();

  if (!activeWorkout || !isTrackingWorkout) {
    return null;
  }

  // Formater le temps écoulé (mm:ss)
  const formatElapsedTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculer le temps écoulé depuis le début
  const elapsedTimeFormatted = formatElapsedTime(activeWorkout.elapsedTime);

  // Gérer le clic sur l'indicateur
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Navigation par défaut vers le workout actif
      navigation.navigate('WorkoutDetail', { id: activeWorkout.workoutId });
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.indicator}>
        <View style={styles.leftContent}>
          <Text style={styles.timer}>{elapsedTimeFormatted}</Text>
          <View style={styles.workoutInfo}>
            <Text style={styles.workout}>{activeWorkout.workoutName}</Text>
            <Text style={styles.title}>In progress</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.upButton}
          onPress={handlePress}
        >
          <Ionicons name="arrow-up" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  indicator: {
    backgroundColor: '#242526',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  leftContent: {
    flex: 1,
  },
  timer: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  workoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workout: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  title: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '400',
  },
  upButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ActiveWorkoutIndicator; 