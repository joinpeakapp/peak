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
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompletedWorkout } from '../../types/workout';
import { useRoute, RouteProp, useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../types/navigation';

// Type pour les paramètres de route
type JournalScreenParams = {
  newWorkoutId?: string;
  shouldAnimateWorkout?: boolean;
  fromSummary?: boolean;
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
  const [newWorkoutIndex, setNewWorkoutIndex] = useState<number>(-1);
  
  // Référence pour stocker les animations des cartes
  const cardAnimations = useRef<{[key: string]: Animated.Value}>({});
  const newWorkoutAnimation = useRef(new Animated.Value(0)).current;
  
  // Récupérer les paramètres de route pour identifier une nouvelle séance
  const route = useRoute();
  const params = route.params as JournalScreenParams || {};
  const newWorkoutId = params.newWorkoutId;
  const shouldAnimateWorkout = params.shouldAnimateWorkout;

  // Récupérer la navigation
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

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
            cardAnimations.current[workout.id] = new Animated.Value(1);
          }
        });
        
        setCompletedWorkouts(sortedWorkouts);
        
        // Si on a un ID de nouvel entraînement, trouver son index
        if (newWorkoutId && shouldAnimateWorkout) {
          const workoutIndex = sortedWorkouts.findIndex(w => w.id === newWorkoutId);
          if (workoutIndex !== -1) {
            setNewWorkoutIndex(workoutIndex);
          }
        }
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

  // Gestionnaire pour l'effet d'animation du nouvel entraînement
  useEffect(() => {
    // Si on a un nouvel entraînement à animer
    if (newWorkoutId && shouldAnimateWorkout && newWorkoutIndex !== -1) {
      // Réinitialiser l'animation
      newWorkoutAnimation.setValue(0);
      
      // Optimiser le timing de l'animation basé sur la source
      const animationDelay = params.fromSummary ? 150 : 300;
      
      // Démarrer l'animation avec un délai optimisé
      setTimeout(() => {
        // Animation fluide avec une courbe d'accélération personnalisée
        Animated.timing(newWorkoutAnimation, {
          toValue: 1,
          duration: 400,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Courbe plus naturelle
          useNativeDriver: true,
        }).start(() => {
          // Une fois l'animation terminée, réinitialiser l'index
          setNewWorkoutIndex(-1);
        });
      }, animationDelay);
    }
  }, [newWorkoutId, shouldAnimateWorkout, newWorkoutIndex, newWorkoutAnimation, params.fromSummary]);

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
  const renderWorkoutCard = ({ item, index }: { item: CompletedWorkout, index: number }) => {
    const stickers = getWorkoutStickers(item);
    
    // Utiliser l'image réelle de l'entraînement ou un placeholder
    const imageUri = item.photo || 'https://via.placeholder.com/114x192/242526/FFFFFF?text=Workout';
    
    // Obtenir ou créer l'animation pour cette carte
    if (!cardAnimations.current[item.id]) {
      cardAnimations.current[item.id] = new Animated.Value(1);
    }
    
    // Déterminer si cette carte est la nouvelle à animer
    const isNewWorkout = index === newWorkoutIndex;
    
    // Améliorer les styles d'animation pour la nouvelle carte
    const animatedCardStyle = {
      transform: [{ 
        scale: isNewWorkout 
          ? newWorkoutAnimation 
          : cardAnimations.current[item.id] 
      }],
      // Effet visuel amélioré pour la nouvelle carte
      shadowColor: isNewWorkout ? '#FFFFFF' : 'transparent',
      shadowOffset: { width: 0, height: isNewWorkout ? 4 : 0 },
      shadowOpacity: isNewWorkout ? 0.3 : 0,
      shadowRadius: isNewWorkout ? 6 : 0,
      elevation: isNewWorkout ? 5 : 0,
      zIndex: isNewWorkout ? 10 : 1, // S'assurer que la carte animée est au-dessus des autres
    };

    // Memo pour optimiser les re-rendus uniquement lorsque nécessaire
    const cardContent = (
      <ImageBackground 
        source={{ uri: imageUri }} 
        style={styles.cardImage}
        imageStyle={styles.cardImageStyle}
      >
        <LinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.5)']}
          style={styles.cardGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          <View style={styles.cardContent}>
            {/* Container de stickers */}
            {stickers.length > 0 && (
              <View style={styles.stickersContainer}>
                {stickers.map((sticker, idx) => (
                  <View key={sticker.id} style={styles.stickerCircle}>
                    <Ionicons 
                      name={sticker.icon} 
                      size={12} 
                      color="#FFFFFF" 
                    />
                  </View>
                ))}
              </View>
            )}
            
            {/* Nom de la séance */}
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.name || 'Quick Workout'}
            </Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    );

    return (
      <TouchableOpacity 
        style={styles.cardContainer}
        onPress={() => handleWorkoutPress(item)}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.card, animatedCardStyle]}>
          {cardContent}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const handleWorkoutPress = (workout: CompletedWorkout) => {
    // Naviguer vers l'écran de détail du workout avec tous les workouts pour le carousel
    navigation.navigate('SummaryFlow', {
      screen: 'WorkoutOverview',
      params: {
        workout: workout,
        photoUri: workout.photo || 'https://via.placeholder.com/400x600/242526/FFFFFF?text=Workout',
        sourceType: 'journal',
        workouts: completedWorkouts,
        currentIndex: completedWorkouts.findIndex(w => w.id === workout.id)
      }
    });
  };

  // Mettre à jour manuellement les séances
  const handleRefresh = () => {
    loadCompletedWorkouts();
  };

  // Afficher un état de chargement
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // Afficher un message d'erreur
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Afficher un état vide
  if (completedWorkouts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={48} color="#FFFFFF" />
        
        <View style={styles.emptyTextContainer}>
          <Text style={styles.emptyText}>No workouts yet</Text>
          <Text style={styles.emptySubtitle}>Complete a workout to see it here</Text>
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
            <View style={{ width: 44, height: 44 }} />
          </View>
        )}
        data={completedWorkouts}
        renderItem={renderWorkoutCard}
        keyExtractor={item => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.workoutsList}
        showsVerticalScrollIndicator={true}
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
    padding: PADDING,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingTop: 80,
    paddingBottom: 24,
    marginBottom: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 16,
  },
  workoutsList: {
    paddingBottom: 20, // Ajouter du padding en bas pour éviter que le dernier élément soit caché
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: 8,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#242526',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  cardImageStyle: {
    borderRadius: 8,
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    borderRadius: 8,
    justifyContent: 'flex-end',
  },
  cardContent: {
    padding: 8,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  stickersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  stickerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTextContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#AAAAAA',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  row: {
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
}); 