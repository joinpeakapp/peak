import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useWorkout } from '../hooks/useWorkout';
import { useWorkoutHistory } from '../workout/contexts/WorkoutHistoryContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileScreenProps } from '../types/navigation';
import { usePersonalRecords } from '../hooks/usePersonalRecords';
import UserProfileService, { UserProfile } from '../services/userProfileService';
import { PersonalRecordService } from '../services/personalRecordService';

export const ProfileScreen: React.FC = () => {
  const { personalRecords } = useWorkout();
  const { completedWorkouts, refreshWorkoutHistory } = useWorkoutHistory();
  const { records, loadRecords, migrateFromWorkoutHistory } = usePersonalRecords();
  const navigation = useNavigation<ProfileScreenProps['navigation']>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Charger le profil utilisateur
  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await UserProfileService.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('[ProfileScreen] Error loading user profile:', error);
    }
  }, []);

  // Recharger les records et l'historique lorsque l'écran Profile est focalisé
  useFocusEffect(
    useCallback(() => {
      const refreshData = async () => {
        try {
          // Rafraîchir l'historique des workouts
          await refreshWorkoutHistory();
          
          // Migrer/synchroniser les records depuis l'historique
          await migrateFromWorkoutHistory(completedWorkouts);
          
          // Recharger les records personnels
          await loadRecords();

          // Charger le profil utilisateur
          await loadUserProfile();
          
        } catch (error) {
          console.error('[ProfileScreen] Error refreshing data:', error);
        }
      };
      
      refreshData();
    }, [refreshWorkoutHistory, loadRecords, loadUserProfile])
  );

  // Fonction pour réinitialiser l'onboarding (développement uniquement)
  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will reset your profile and show the onboarding again. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await UserProfileService.resetUserProfile();
              setUserProfile(null);
              // L'app va redétecter que l'onboarding n'est pas fait
              Alert.alert('Success', 'Onboarding reset. Restart the app to see the onboarding flow.');
            } catch (error) {
              console.error('[ProfileScreen] Error resetting onboarding:', error);
              Alert.alert('Error', 'Failed to reset onboarding');
            }
          },
        },
      ]
    );
  };

  // Calculate workout statistics
  const workoutStats = useMemo(() => {
    // Total workouts completed
    const totalWorkouts = completedWorkouts.length;
    
    // Total exercises performed (counting each exercise in a workout)
    const totalExercises = completedWorkouts.reduce(
      (total, workout) => total + workout.exercises.length, 
      0
    );
    
    // Total sets completed
    const totalSets = completedWorkouts.reduce(
      (total, workout) => total + workout.exercises.reduce(
        (subTotal, exercise) => subTotal + exercise.sets.filter(set => set.completed).length, 
        0
      ), 
      0
    );
    
    // Total weight lifted (kg)
    const totalWeight = completedWorkouts.reduce(
      (total, workout) => total + workout.exercises.reduce(
        (subTotal, exercise) => subTotal + exercise.sets.reduce(
          (setTotal, set) => set.completed ? setTotal + (set.weight * set.reps) : setTotal,
          0
        ),
        0
      ),
      0
    );
    
    // Find unique workout types
    const workoutTypes = new Set(completedWorkouts.map(workout => workout.name));
    
    // Extract all unique exercises with their records (max weight)
    const exercisesMap = new Map();
    
    // Utiliser les records unifiés pour garantir la cohérence
    // Si un exercice n'est pas dans records, il ne sera pas affiché
    // Cela évite le problème de cards affichées mais avec des détails vides
    console.log('[ProfileScreen] Processing records:', Object.keys(records));
    Object.entries(records).forEach(([exerciseName, record]) => {
      // Validation stricte : s'assurer que l'exercice a des données complètes et valides
      if (record.maxWeight > 0 && record.maxWeightDate && record.repsPerWeight && Object.keys(record.repsPerWeight).length > 0) {
        console.log(`[ProfileScreen] ✅ Record valid for ${exerciseName}: ${record.maxWeight}kg`);
        exercisesMap.set(exerciseName, {
          name: exerciseName,
          weight: record.maxWeight,
          reps: 0, // On n'affiche plus les reps sur la card
          date: record.maxWeightDate
        });
      } else {
        console.log(`[ProfileScreen] ❌ Record invalid for ${exerciseName}:`, {
          maxWeight: record.maxWeight,
          hasDate: !!record.maxWeightDate,
          hasRepsPerWeight: !!record.repsPerWeight,
          repsCount: Object.keys(record.repsPerWeight || {}).length
        });
      }
    });
    
    console.log('[ProfileScreen] Final exercises to display:', Array.from(exercisesMap.keys()));
    
    // Convert the map to array and sort by weight (highest to lowest)
    const exercisesList = Array.from(exercisesMap.values()).sort((a, b) => b.weight - a.weight);
    
    return {
      totalWorkouts,
      totalExercises,
      totalSets,
      totalWeight,
      uniqueWorkoutTypes: workoutTypes.size,
      exercisesList
    };
  }, [completedWorkouts, records]);
  
  const navigateToExerciseDetail = (exerciseName: string) => {
    navigation.navigate('ExerciseDetail', { exerciseName });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          {/* Development-only reset onboarding button */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleResetOnboarding}
            >
              <Ionicons name="refresh" size={18} color="#F59E0B" />
              <Text style={[styles.testButtonText, { color: '#F59E0B' }]}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* User Profile Information */}
        {userProfile && (
          <View style={styles.userProfileContainer}>
            <View style={styles.profileHeader}>
              <View style={styles.profileIconContainer}>
                <Ionicons name="person" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Hello, {userProfile.firstName}!</Text>
                <Text style={styles.profileDetails}>
                  {UserProfileService.getFitnessLevelLabel(userProfile.fitnessLevel)} • {UserProfileService.getPrimaryGoalLabel(userProfile.primaryGoal)}
                </Text>
              </View>
            </View>
            {userProfile.createdAt && (
              <Text style={styles.memberSince}>
                Member since {new Date(userProfile.createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {/* Workout Statistics */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={styles.statsCard}>
              <Text style={styles.statsNumber}>{workoutStats.totalWorkouts}</Text>
              <Text style={styles.statsLabel}>Workouts</Text>
            </View>
            
            <View style={styles.statsCard}>
              <Text style={styles.statsNumber}>{workoutStats.totalExercises}</Text>
              <Text style={styles.statsLabel}>Exercises</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statsCard}>
              <Text style={styles.statsNumber}>{workoutStats.totalSets}</Text>
              <Text style={styles.statsLabel}>Sets</Text>
            </View>
            
            <View style={styles.statsCard}>
              <Text style={styles.statsNumber}>{(workoutStats.totalWeight / 1000).toFixed(1)}k</Text>
              <Text style={styles.statsLabel}>Kg lifted</Text>
            </View>
          </View>
        </View>
        
        {/* List of exercises with their personal records */}
        <View style={styles.exercisesContainer}>
          <Text style={styles.sectionTitle}>My Exercises</Text>
          
          {workoutStats.exercisesList.length === 0 ? (
            <View style={styles.emptyExercisesMessage}>
              <Text style={styles.emptyText}>No recorded exercises</Text>
            </View>
          ) : (
            workoutStats.exercisesList.map((exercise, index) => (
              <TouchableOpacity 
                key={`exercise-${index}`}
                style={styles.exerciseCard}
                onPress={() => navigateToExerciseDetail(exercise.name)}
                activeOpacity={0.7}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDate}>
                    Personal record: {exercise.weight} kg
                  </Text>
                </View>
                <View style={styles.chevronContainer}>
                  <Ionicons name="chevron-forward" size={24} color="#5B5B5C" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 80,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsGrid: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#1A1A1D',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statsLabel: {
    fontSize: 14,
    color: '#888888',
  },
  exercisesContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  exerciseCard: {
    backgroundColor: '#1A1A1D',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  exerciseDate: {
    fontSize: 12,
    color: '#888',
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 8,
  },
  emptyExercisesMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2D',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  userProfileContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#1A1A1D',
    borderRadius: 10,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  profileDetails: {
    fontSize: 14,
    color: '#888888',
  },
  memberSince: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
});
