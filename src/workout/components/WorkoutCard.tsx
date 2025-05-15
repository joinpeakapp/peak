import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout } from '../../types/workout';
import { WorkoutSettingsModal } from './WorkoutSettingsModal';
import { StreakDisplay } from './StreakDisplay';

interface WorkoutCardProps {
  /** The workout data to display */
  workout: Workout;
  /** Callback function when the card is pressed */
  onPress: () => void;
  /** Callback function when the workout is edited */
  onEdit: () => void;
  /** Callback function when the workout is deleted */
  onDelete: () => void;
}

/**
 * Format workout frequency for display
 */
const formatFrequency = (frequency: any): string => {
  if (!frequency) return '';
  
  // Si la fréquence est un objet avec type et value
  if (typeof frequency === 'object' && frequency.type && frequency.value !== undefined) {
    if (frequency.type === 'weekly') {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const dayIndex = Number(frequency.value);
      
      if (!isNaN(dayIndex) && dayIndex >= 0 && dayIndex < days.length) {
        return `On ${days[dayIndex]}`;
      }
      return 'Weekly';
    } else if (frequency.type === 'interval') {
      const intervalValue = Number(frequency.value);
      if (!isNaN(intervalValue) && intervalValue > 0) {
        return `Every ${intervalValue} day${intervalValue > 1 ? 's' : ''}`;
      }
      return 'Daily';
    }
  }
  
  // Fallback pour les anciennes données (chaîne de caractères)
  return String(frequency);
};

/**
 * A card component that displays workout information and handles user interactions.
 * 
 * @component
 * @example
 * ```tsx
 * <WorkoutCard
 *   workout={{
 *     id: '1',
 *     name: 'Morning Workout',
 *     date: '2024-03-20',
 *     duration: 60,
 *     exercises: [],
 *     frequency: 'Monday',
 *     streak: 5
 *   }}
 *   onPress={() => console.log('Card pressed')}
 *   onEdit={() => console.log('Edit pressed')}
 *   onDelete={() => console.log('Delete pressed')}
 * />
 * ```
 */
export const WorkoutCard = memo<WorkoutCardProps>(({
  workout,
  onPress,
  onEdit,
  onDelete,
}) => {
  const { name, frequency } = workout;
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        testID="workout-card"
        style={styles.container}
        onPress={onPress}
      >
        <View style={styles.content}>
          <View style={styles.leftContent}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.frequency}>{formatFrequency(frequency)}</Text>
          </View>

          <View style={styles.rightContent}>
            <StreakDisplay workout={workout} showDaysRemaining={false} />
            <TouchableOpacity
              testID="settings-button"
              style={styles.settingsButton}
              onPress={() => setIsSettingsVisible(true)}
            >
              <Ionicons name="settings-outline" size={24} color="#5B5B5C" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      <WorkoutSettingsModal
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
});

WorkoutCard.displayName = 'WorkoutCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(36, 37, 38, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  frequency: {
    fontSize: 14,
    color: '#5B5B5C',
  },
  settingsButton: {
    padding: 4,
    marginLeft: 16,
  },
}); 