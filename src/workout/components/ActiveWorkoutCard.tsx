import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveWorkout } from '../contexts/ActiveWorkoutContext';

interface ActiveWorkoutCardProps {
  onPress: () => void;
}

export const ActiveWorkoutCard: React.FC<ActiveWorkoutCardProps> = ({ onPress }) => {
  const { activeWorkout } = useActiveWorkout();

  if (!activeWorkout) return null;

  // Formatter le temps (mm:ss)
  const formatElapsedTime = () => {
    const minutes = Math.floor(activeWorkout.elapsedTime / 60);
    const seconds = activeWorkout.elapsedTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <Text style={styles.timer}>{formatElapsedTime()}</Text>
          <View style={styles.workoutInfo}>
            <Text style={styles.workoutName}>{activeWorkout.workoutName}</Text>
            <Text style={styles.statusText}>In progress</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.resumeButton}
          onPress={onPress}
        >
          <Ionicons name="chevron-up" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // Au-dessus de la navbar
    left: 16,
    right: 16,
    backgroundColor: '#242526',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
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
  workoutName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '400',
  },
  resumeButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 