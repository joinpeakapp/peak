import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  FlatList,
  Dimensions,
  ImageBackground,
  Image,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompletedWorkout } from '../../types/workout';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';

// Type pour les paramètres de route
type JournalScreenParams = {
  newWorkoutId?: string;
}

// Calcul de la largeur des cards (3 par rangée, 8px d'espacement, 16px de padding externe)
const { width } = Dimensions.get('window');
const PADDING = 16;
const GAP = 8;
const CARD_WIDTH = (width - (PADDING * 2) - (GAP * 2)) / 3;
const CARD_HEIGHT = CARD_WIDTH * (192 / 114); // Ratio 114x192px

/**
 * Écran qui affiche les séances d'entraînement enregistrées
 */
export const JournalScreen: React.FC = () => {
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Référence pour stocker les animations des cartes
  const cardAnimations = useRef<{[key: string]: Animated.Value}>({});
  
  // Récupérer les paramètres de route pour identifier une nouvelle séance
  const route = useRoute();
  const params = route.params as JournalScreenParams || {};
  const newWorkoutId = params.newWorkoutId;

  // Charger les séances enregistrées
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
        
        // Initialiser les animations pour chaque workout
        sortedWorkouts.forEach(workout => {
          if (!cardAnimations.current[workout.id]) {
            // Pour les nouvelles séances (celle qu'on vient de terminer), commencer à scale=0
            const initialValue = workout.id === newWorkoutId ? 0 : 1;
            cardAnimations.current[workout.id] = new Animated.Value(initialValue);
          }
        });
        
        setCompletedWorkouts(sortedWorkouts);
      }
    } catch (error) {
      console.error('Error loading completed workouts:', error);
      setError('Failed to load your workout history');
    } finally {
      setLoading(false);
    }
  };

  // Effet pour charger les séances au montage et chaque fois que newWorkoutId change
  useEffect(() => {
    loadCompletedWorkouts();
  }, [newWorkoutId]);

  // Effet pour animer la nouvelle séance quand l'écran reçoit le focus
  useFocusEffect(
    React.useCallback(() => {
      // Si on a un nouvel ID de séance et que l'animation correspondante existe
      if (newWorkoutId && !loading && completedWorkouts.length > 0) {
        // S'assurer que l'animation est initialisée
        if (!cardAnimations.current[newWorkoutId]) {
          cardAnimations.current[newWorkoutId] = new Animated.Value(0);
        } else {
          // Réinitialiser l'animation pour être sûr qu'elle s'exécute à chaque focus
          cardAnimations.current[newWorkoutId].setValue(0);
        }
        
        // Attendre un court instant pour que la FlatList ait le temps de se rendre
        setTimeout(() => {
          // Animation pour faire apparaître la carte avec un effet de "pop"
          Animated.sequence([
            Animated.timing(cardAnimations.current[newWorkoutId], {
              toValue: 1.1, // Légèrement plus grand
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(cardAnimations.current[newWorkoutId], {
              toValue: 1, // Retour à la taille normale
              duration: 150,
              useNativeDriver: true,
            })
          ]).start();
        }, 500); // Un délai un peu plus long pour s'assurer que la transition d'écran est terminée
      }
    }, [newWorkoutId, loading, completedWorkouts])
  );

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

  // Récupérer les stickers d'une séance (maximum 5)
  const getWorkoutStickers = (workout: CompletedWorkout) => {
    // Pour l'instant, simulons des stickers basés sur les exercices
    // À terme, cela sera remplacé par les vrais stickers obtenus
    const stickers = [];
    
    // Exemple : un sticker pour chaque record personnel
    for (const exercise of workout.exercises) {
      if (exercise.personalRecord) {
        stickers.push({
          id: `pr-${exercise.id}`,
          type: 'personal-record',
          icon: 'trophy-outline' as const
        });
      }
    }
    
    // Exemple : sticker d'endurance si la séance a duré plus de 45 minutes
    if (workout.duration > 45 * 60) {
      stickers.push({
        id: 'endurance',
        type: 'endurance',
        icon: 'fitness-outline' as const
      });
    }
    
    // Exemple : sticker de variété si plus de 5 exercices
    if (workout.exercises.length > 5) {
      stickers.push({
        id: 'variety',
        type: 'variety',
        icon: 'grid-outline' as const
      });
    }
    
    // Limiter à 5 stickers maximum
    return stickers.slice(0, 5);
  };

  // Rendu d'une carte de séance terminée
  const renderWorkoutCard = ({ item }: { item: CompletedWorkout }) => {
    const stickers = getWorkoutStickers(item);
    
    // Utiliser une image temporaire jusqu'à ce que la vraie photo soit prise
    const imageUri = item.photo || 'https://via.placeholder.com/114x192/242526/FFFFFF?text=Workout';
    
    // Obtenir ou créer l'animation pour cette carte
    if (!cardAnimations.current[item.id]) {
      cardAnimations.current[item.id] = new Animated.Value(1);
    }
    
    const isNewWorkout = item.id === newWorkoutId;
    
    return (
      <Animated.View 
        style={[
          styles.animatedCardContainer,
          { 
            transform: [{ scale: cardAnimations.current[item.id] }],
          }
        ]}
      >
        <TouchableOpacity 
          key={item.id} 
          style={[
            styles.workoutCard,
            isNewWorkout && styles.newWorkoutCard
          ]}
          onPress={() => handleWorkoutPress(item)}
        >
          <ImageBackground 
            source={{ uri: imageUri }} 
            style={styles.cardBackground}
            imageStyle={styles.cardBackgroundImage}
          >
            <View style={styles.cardOverlay}>
              <View style={styles.cardContent}>
                {/* Stickers */}
                {stickers.length > 0 && (
                  <View style={styles.stickersContainer}>
                    {stickers.map(sticker => (
                      <View key={sticker.id} style={styles.stickerBadge}>
                        <Ionicons name={sticker.icon} size={16} color="#FFFFFF" />
                      </View>
                    ))}
                  </View>
                )}
                
                {/* Nom de la séance */}
                <Text style={styles.workoutName} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleWorkoutPress = (workout: CompletedWorkout) => {
    // TODO: Implémenter l'ouverture du détail de la séance
    console.log('Workout pressed:', workout.id);
    Alert.alert('Coming Soon', 'Workout details will be available soon!');
  };

  // Mettre à jour manuellement les séances
  const handleRefresh = () => {
    loadCompletedWorkouts();
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
      <FlatList
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.title}>Journal</Text>
          </View>
        )}
        data={completedWorkouts}
        renderItem={renderWorkoutCard}
        keyExtractor={item => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        onRefresh={handleRefresh}
        refreshing={loading}
      />
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
  gridContainer: {
    paddingHorizontal: PADDING,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
  },
  animatedCardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: 8,
  },
  workoutCard: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#242526',
  },
  newWorkoutCard: {
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 36, 0.7)',
  },
  cardBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  cardBackgroundImage: {
    borderRadius: 8,
  },
  cardOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingBottom: 8,
    width: '100%',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  stickersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stickerBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 138, 36, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  workoutName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
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