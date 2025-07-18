import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StreakData, Workout } from '../../types/workout';
import { useStreak } from '../contexts/StreakContext';
import { Ionicons } from '@expo/vector-icons';

interface StreakDisplayProps {
  workout: Workout;
  showDaysRemaining?: boolean;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({ 
  workout, 
  showDaysRemaining = true
}) => {
  const { getWorkoutStreak, formatStreakText, getDaysUntilStreakLoss, subscribeToStreakUpdates } = useStreak();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStreakData = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`[StreakDisplay] Loading streak data for workout ${workout.id} (${workout.name})`);
      const data = await getWorkoutStreak(workout.id, workout);
      console.log(`[StreakDisplay] Loaded streak data for ${workout.id}:`, { current: data.current, lastDate: data.lastCompletedDate });
      setStreakData(data);
      
      if (showDaysRemaining && data.lastCompletedDate) {
        const days = await getDaysUntilStreakLoss(workout.id, workout);
        console.log(`[StreakDisplay] Days remaining for ${workout.id}:`, days);
        setDaysRemaining(days);
      }
    } catch (error) {
      console.error("[StreakDisplay] Error loading streak data:", error);
    } finally {
      setLoading(false);
    }
  }, [workout.id, workout.name, getWorkoutStreak, getDaysUntilStreakLoss, showDaysRemaining]);

  useEffect(() => {
    loadStreakData();
  }, [loadStreakData]);

  // S'abonner aux mises à jour globales des streaks
  useEffect(() => {
    console.log(`[StreakDisplay] Subscribing to streak updates for workout ${workout.id}`);
    const unsubscribe = subscribeToStreakUpdates(() => {
      console.log(`[StreakDisplay] Received streak update notification for workout ${workout.id}, reloading...`);
      loadStreakData();
    });

    return unsubscribe;
  }, [subscribeToStreakUpdates, workout.id]); // Enlever loadStreakData des dépendances pour éviter les boucles

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FF8A24" />
      </View>
    );
  }

  // Si pas de streak, on affiche quand même mais avec le style inactif
  if (!streakData) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.containerOff}>
          <Ionicons name="flame" size={18} color="#464646" />
          <Text style={styles.textOff}>0</Text>
        </View>
      </View>
    );
  }

  // Détermine si la streak est active ou non
  const isStreakActive = streakData.current > 0;

  return (
    <View style={styles.wrapper}>
      <View style={isStreakActive ? styles.containerOn : styles.containerOff}>
        <Ionicons 
          name="flame" 
          size={18} 
          color={isStreakActive ? "#FF8A24" : "#464646"} 
          style={isStreakActive ? styles.iconOn : styles.iconOff}
        />
        <Text style={isStreakActive ? styles.textOn : styles.textOff}>
          {streakData.current}
        </Text>
      </View>
      {showDaysRemaining && isStreakActive && daysRemaining !== null && daysRemaining > 0 && (
        <Text style={styles.daysRemaining}>
          {daysRemaining} day{daysRemaining > 1 ? 's' : ''} remaining
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerOn: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 138, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 36, 0.5)',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  containerOff: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconOn: {
    marginRight: 4,
    shadowColor: '#FF8A24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 8,
    elevation: 5,
  },
  iconOff: {
    marginRight: 4,
  },
  textOn: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  textOff: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  daysRemaining: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  }
}); 