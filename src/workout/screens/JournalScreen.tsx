import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompletedWorkout } from '../../types/workout';

/**
 * Écran qui affiche les séances d'entraînement enregistrées
 */
export const JournalScreen: React.FC = () => {
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les séances enregistrées
  useEffect(() => {
    const loadCompletedWorkouts = async () => {
      try {
        setLoading(true);
        const storedWorkouts = await AsyncStorage.getItem('completedWorkouts');
        
        if (storedWorkouts) {
          const parsedWorkouts: CompletedWorkout[] = JSON.parse(storedWorkouts);
          // Tri par date (plus récentes en premier)
          const sortedWorkouts = parsedWorkouts.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setCompletedWorkouts(sortedWorkouts);
        }
      } catch (error) {
        console.error('Error loading completed workouts:', error);
        setError('Failed to load your workout history');
      } finally {
        setLoading(false);
      }
    };

    loadCompletedWorkouts();
  }, []);

  // Formater la date pour l'affichage
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Si c'est aujourd'hui
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Si c'est hier
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Autrement, afficher la date complète
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Formater la durée (de secondes à minutes)
  const formatDuration = (durationInSeconds: number) => {
    const minutes = Math.floor(durationInSeconds / 60);
    return `${minutes} min`;
  };

  // Rendu d'une carte de séance terminée
  const renderWorkoutCard = (workout: CompletedWorkout) => (
    <TouchableOpacity 
      key={workout.id} 
      style={styles.workoutCard}
      onPress={() => handleWorkoutPress(workout)}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardMainInfo}>
          <Text style={styles.workoutName}>{workout.name}</Text>
          <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
        </View>
        
        <View style={styles.badgesContainer}>
          {/* À terme, ajouter les badges de performance ici */}
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleWorkoutPress = (workout: CompletedWorkout) => {
    // TODO: Implémenter l'ouverture du détail de la séance
    console.log('Workout pressed:', workout.id);
    Alert.alert('Coming Soon', 'Workout details will be available soon!');
  };

  // Afficher un état de chargement
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // Afficher un message d'erreur
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Afficher un état vide
  if (completedWorkouts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Journal</Text>
        </View>
        
        <View style={styles.emptyStateContainer}>
          <Ionicons name="calendar-outline" size={48} color="#FFFFFF" />
          
          <View style={styles.emptyStateTextContainer}>
            <Text style={styles.emptyStateTitle}>No workouts yet</Text>
            <Text style={styles.emptyStateSubtitle}>Complete a workout to see it here</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Journal</Text>
        </View>
        
        <View style={styles.content}>
          {completedWorkouts.map(workout => renderWorkoutCard(workout))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0F',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 80,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  workoutCard: {
    backgroundColor: 'rgba(36, 37, 38, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMainInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: '#5B5B5C',
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyStateTextContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  errorText: {
    color: '#FF4D4F',
    fontSize: 16,
  },
}); 