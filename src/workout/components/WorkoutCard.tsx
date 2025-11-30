import React, { memo, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout } from '../../types/workout';
import { ContextMenu, ContextMenuItem } from '../../components/common/ContextMenu';
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
  /** Callback function when the workout should be repositioned */
  onReposition?: () => void;
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
    } else if (frequency.type === 'none') {
      return 'Flexible schedule';
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
 *   onPress={() => }
 *   onEdit={() => }
 *   onDelete={() => }
 * />
 * ```
 */
export const WorkoutCard = memo<WorkoutCardProps>(({
  workout,
  onPress,
  onEdit,
  onDelete,
  onReposition,
}) => {
  const { name, frequency } = workout;
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [buttonLayout, setButtonLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const settingsButtonRef = useRef<TouchableOpacity>(null);

  // Menu items configuration
  const menuItems: ContextMenuItem[] = [
    ...(onReposition ? [{
      key: 'reposition',
      label: 'Reposition workout',
      icon: 'swap-vertical-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => {
        // Le ContextMenu ferme déjà le menu et attend 400ms sur iOS avant d'appeler onPress
        // Appel direct comme pour "Edit Workout" qui fonctionne
        if (onReposition) {
          onReposition();
        }
      },
    }] : []),
    {
      key: 'edit',
      label: 'Edit workout',
      icon: 'pencil-outline',
      onPress: () => {
        setIsMenuVisible(false);
        onEdit();
      },
    },
    {
      key: 'delete',
      label: 'Delete workout',
      icon: 'trash-outline',
      onPress: () => {
        setIsMenuVisible(false);
        onDelete();
      },
      destructive: true,
    },
  ];

  // Handle settings button press
  const handleSettingsPress = () => {
    if (settingsButtonRef.current) {
      settingsButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setButtonLayout({ x: pageX, y: pageY, width, height });
        setIsMenuVisible(true);
      });
    }
  };

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
              ref={settingsButtonRef}
              testID="settings-button"
              style={styles.settingsButton}
              onPress={handleSettingsPress}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      <ContextMenu
        visible={isMenuVisible}
        onClose={() => setIsMenuVisible(false)}
        items={menuItems}
        anchorPosition={buttonLayout || undefined}
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
    color: 'rgba(255, 255, 255, 0.6)',
  },
  settingsButton: {
    padding: 4,
    marginLeft: 16,
  },
}); 