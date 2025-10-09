import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ImageBackground,
  Animated,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, NavigationProp, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../../types/navigation';
import { CompletedWorkout } from '../../types/workout';
import { useWorkoutHistory } from '../contexts/WorkoutHistoryContext';
import { CachedImageBackground } from '../../components/common/CachedImageBackground';
import { ImageCacheUtils } from '../../components/common/CachedImage';
import { StickerService } from '../../services/stickerService';
import { PhotoStorageService } from '../../services/photoStorageService';
import { StickerBadge } from '../../components/common/StickerBadge';
import { Sticker } from '../../types/stickers';

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
  const [newWorkoutIndex, setNewWorkoutIndex] = useState<number>(-1);
  
  // Utiliser le contexte WorkoutHistory au lieu d'un état local
  const { completedWorkouts, error, refreshWorkoutHistory } = useWorkoutHistory();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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

  // Organiser les workouts par date (plus récentes en premier) et initialiser les animations
  const sortedWorkouts = React.useMemo(() => {
    if (!completedWorkouts) return [];
    
    const sorted = [...completedWorkouts].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Initialiser les animations pour chaque workout
    sorted.forEach(workout => {
      if (!cardAnimations.current[workout.id]) {
        cardAnimations.current[workout.id] = new Animated.Value(1);
      }
    });
    
    return sorted;
  }, [completedWorkouts]);

  // Effet pour détecter un nouvel entraînement et préparer l'animation
  useEffect(() => {
    if (newWorkoutId && shouldAnimateWorkout && sortedWorkouts.length > 0) {
      const workoutIndex = sortedWorkouts.findIndex(w => w.id === newWorkoutId);
      if (workoutIndex !== -1) {
        setNewWorkoutIndex(workoutIndex);
      }
    }
  }, [newWorkoutId, shouldAnimateWorkout, sortedWorkouts]);

  // État pour éviter les rechargements inutiles - initialisé à true car préchargé
  const [hasInitialized, setHasInitialized] = useState(true);

  // Précharger les images quand les workouts changent
  useEffect(() => {
    if (sortedWorkouts.length > 0) {
      const imageUris = sortedWorkouts
        .filter(workout => workout.photo)
        .map(workout => workout.photo!);
      
      if (imageUris.length > 0) {
        ImageCacheUtils.preloadImages(imageUris).catch(console.warn);
      }
    }
  }, [sortedWorkouts]);

  // Fonction de refresh intelligente pour le pull-to-refresh
  const handlePullRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshWorkoutHistory();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshWorkoutHistory]);

  // Recharger les données seulement si explicitement demandé (pull-to-refresh)
  // Les données sont maintenant préchargées au démarrage
  useFocusEffect(
    React.useCallback(() => {
      // Ne plus recharger automatiquement, les données sont préchargées
      // refreshWorkoutHistory() sera appelé seulement via pull-to-refresh
    }, [])
  );

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

  // État pour stocker les stickers de chaque workout
  const [workoutStickers, setWorkoutStickers] = useState<Record<string, Sticker[]>>({});
  
  // État pour stocker les URIs de photos vérifiées
  const [verifiedPhotoUris, setVerifiedPhotoUris] = useState<Record<string, string>>({});

  // Charger les stickers et vérifier les photos pour tous les workouts
  useEffect(() => {
    const loadStickersAndPhotos = async () => {
      const stickersMap: Record<string, Sticker[]> = {};
      const photoUrisMap: Record<string, string> = {};
      
      for (const workout of completedWorkouts) {
        try {
          // Générer les stickers pour ce workout
          const stickers = await StickerService.generateWorkoutStickers(workout, true);
          stickersMap[workout.id] = stickers;
          
          // Vérifier et obtenir l'URI de photo accessible
          const accessiblePhotoUri = await PhotoStorageService.getAccessiblePhotoUri(
            workout.photo || '', 
            workout.id
          );
          // Ne stocker que si ce n'est pas un placeholder ou si on n'a pas d'URI originale
          if (!accessiblePhotoUri.includes('placeholder') || !workout.photo) {
            photoUrisMap[workout.id] = accessiblePhotoUri;
          }
        } catch (error) {
          console.error('[JournalScreen] Error loading data for workout:', workout.name, error);
          stickersMap[workout.id] = [];
          photoUrisMap[workout.id] = 'https://via.placeholder.com/114x192/242526/FFFFFF?text=Workout';
        }
      }
      
      setWorkoutStickers(stickersMap);
      setVerifiedPhotoUris(photoUrisMap);
    };

    if (completedWorkouts.length > 0) {
      loadStickersAndPhotos();
    }
  }, [completedWorkouts]);

  // Récupérer les stickers d'une séance via le cache
  const getWorkoutStickers = (workout: CompletedWorkout): Sticker[] => {
    return workoutStickers[workout.id] || [];
  };

  // Rendu d'une carte de séance terminée
  const renderWorkoutCard = ({ item, index }: { item: CompletedWorkout, index: number }) => {
    const stickers = getWorkoutStickers(item);
    
    // Utiliser l'URI de photo vérifiée, sinon l'URI originale, sinon un placeholder
    const imageUri = verifiedPhotoUris[item.id] || item.photo || 'https://via.placeholder.com/114x192/242526/FFFFFF?text=Workout';
    
    // Obtenir ou créer l'animation pour cette carte
    if (!cardAnimations.current[item.id]) {
      cardAnimations.current[item.id] = new Animated.Value(1);
    }
    
    // Déterminer si cette carte est la nouvelle à animer
    const isNewWorkout = index === newWorkoutIndex;
    
    // Calculer si c'est la dernière carte de la ligne (pas de margin droite)
    const isLastInRow = (index + 1) % 3 === 0;
    
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
      <CachedImageBackground 
        uri={imageUri}
        style={styles.cardImage}
        imageStyle={styles.cardImageStyle}
        showLoader={false}
        workout={item} // Passer l'objet workout pour déterminer le flip automatiquement
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
                  <StickerBadge
                    key={`sticker-${idx}`}
                    sticker={sticker}
                    size="small"
                    showText={false}
                    style={styles.stickerSpacing}
                  />
                ))}
              </View>
            )}
            
            {/* Nom de la séance */}
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.name || 'Quick Workout'}
            </Text>
          </View>
        </LinearGradient>
      </CachedImageBackground>
    );

    return (
      <TouchableOpacity 
        style={[styles.cardContainer, isLastInRow && { marginRight: 0 }]}
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
    // Garder le même ordre que dans le Journal pour cohérence
    // Journal: récent à gauche, ancien à droite
    // Carousel: swipe gauche = plus récent, swipe droite = plus ancien
    const workoutIndex = sortedWorkouts.findIndex(w => w.id === workout.id);
    
    // Naviguer vers l'écran de détail du workout avec tous les workouts pour le carousel
    navigation.navigate('SummaryFlow', {
      screen: 'WorkoutOverview',
      params: {
        workout: workout,
        photoUri: workout.photo || 'https://via.placeholder.com/400x600/242526/FFFFFF?text=Workout',
        sourceType: 'journal',
        workouts: sortedWorkouts,
        currentIndex: workoutIndex
      }
    });
  };

  // Mettre à jour manuellement les séances
  const handleRefresh = () => {
    refreshWorkoutHistory();
  };

  // Plus d'état de chargement - les données sont préchargées

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
        data={sortedWorkouts}
        renderItem={renderWorkoutCard}
        keyExtractor={item => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.workoutsList}
        showsVerticalScrollIndicator={true}
        onRefresh={handlePullRefresh}
        refreshing={isRefreshing}
        key={sortedWorkouts.length} // Force re-render when data changes
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
    paddingTop: 64,
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
    marginRight: GAP,
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
  stickerSpacing: {
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
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
}); 