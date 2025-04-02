import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout } from '../../types/workout';
import { WorkoutSettingsModal } from './WorkoutSettingsModal';

interface WorkoutCardProps {
  /** The workout data to display */
  workout: Workout;
  /** Callback function when the card is pressed */
  onPress: () => void;
  /** Callback function when the workout is edited */
  onEdit: () => void;
  /** Callback function when the workout is deleted */
  onDelete: () => void;
  /** Whether this workout is scheduled for today */
  isToday?: boolean;
}

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
 *     series: 5
 *   }}
 *   onPress={() => console.log('Card pressed')}
 *   onEdit={() => console.log('Edit pressed')}
 *   onDelete={() => console.log('Delete pressed')}
 *   isToday={true}
 * />
 * ```
 */
export const WorkoutCard = memo<WorkoutCardProps>(({
  workout,
  onPress,
  onEdit,
  onDelete,
  isToday = false,
}) => {
  const { name, frequency, series } = workout;
  const hasStreak = series > 0;
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
            <Text style={styles.frequency}>{frequency}</Text>
          </View>

          <View style={[styles.seriesContainer, !hasStreak && styles.seriesContainerOff]}>
            <View style={[styles.flameContainer, !hasStreak && styles.flameContainerOff]}>
              <View style={[styles.flameShadow, !hasStreak && styles.flameShadowOff]}>
                <Ionicons 
                  name="flame" 
                  size={20} 
                  color={hasStreak ? "#FF8A24" : "#5B5B5C"} 
                />
              </View>
              <Text style={[styles.seriesText, !hasStreak && styles.seriesTextOff]}>
                {series}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            testID="settings-button"
            style={styles.settingsButton}
            onPress={() => setIsSettingsVisible(true)}
          >
            <Ionicons name="settings-outline" size={24} color="#5B5B5C" />
          </TouchableOpacity>
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
  },
  leftContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  frequency: {
    fontSize: 14,
    color: '#5B5B5C',
  },
  seriesContainer: {
    backgroundColor: 'rgba(255, 138, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 36, 0.5)',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
  },
  seriesContainerOff: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  flameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flameContainerOff: {
    opacity: 0.5,
  },
  flameShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#FF8A24',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  flameShadowOff: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  seriesText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  seriesTextOff: {
    color: '#5B5B5C',
  },
  settingsButton: {
    padding: 4,
  },
}); 