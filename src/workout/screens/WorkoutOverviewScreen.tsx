import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  StatusBar,
  Alert,
  ViewToken,
  SafeAreaView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { 
  useNavigation, 
  useRoute, 
  NavigationProp, 
  CommonActions, 
  RouteProp 
} from '@react-navigation/native';
import { RootStackParamList, SummaryStackParamList } from '../../types/navigation';
import { CompletedWorkout } from '../../types/workout';
import { useWorkoutHistory } from '../contexts/WorkoutHistoryContext';
import { CachedImage } from '../../components/common/CachedImage';
import { StickerService } from '../../services/stickerService';
import { StickerBadge } from '../../components/common/StickerBadge';
import { Sticker } from '../../types/stickers';

type WorkoutOverviewRouteProp = RouteProp<SummaryStackParamList, 'WorkoutOverview'>;

export const WorkoutOverviewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<WorkoutOverviewRouteProp>();
  const { workout, photoUri, sourceType = 'tracking', workouts = [], currentIndex = 0 } = route.params;
  
  // Déterminer si on est en mode carousel (plusieurs workouts)
  const isCarouselMode = workouts.length > 1;
  
  // Utiliser le contexte WorkoutHistory
  const { updateCompletedWorkout } = useWorkoutHistory();
  
  const [saving, setSaving] = useState(false);
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const flatListRef = useRef<FlatList>(null);
  
  // Dimensions de l'écran pour le carousel
  const { width: screenWidth } = Dimensions.get('window');
  
  // Configuration du ViewabilityConfig pour le FlatList
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 0,
  }).current;
  
  // Gérer le défilement du carousel
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems && viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  // État pour les stickers du workout principal
  const [stickers, setStickers] = useState<Sticker[]>([]);

  // Charger les stickers pour le workout principal (utilise le cache si disponible)
  useEffect(() => {
    const loadStickers = async () => {
      try {
        const workoutStickers = await StickerService.generateWorkoutStickers(workout, true);
        setStickers(workoutStickers);
      } catch (error) {
        console.error('[WorkoutOverviewScreen] Error loading stickers:', error);
        setStickers([]);
      }
    };

    loadStickers();
  }, [workout]);

  // Handle returning to the photo capture screen
  const handleGoBack = () => {
    navigation.goBack();
  };

  // Handle finalization and navigation to Journal
  const handleSaveAndViewJournal = useCallback(async () => {
    setSaving(true);
    
    try {
      // Utiliser le contexte pour mettre à jour le workout avec la photo
      if (photoUri) {
        await updateCompletedWorkout(workout.id, { photo: photoUri });
      }
      
      // Navigate to journal tab directly with optimized navigation
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'MainTabs',
              state: {
                routes: [
                  { 
                    name: 'JournalTab',
                    params: {
                      screen: 'Journal',
                      params: {
                        newWorkoutId: workout.id,
                        shouldAnimateWorkout: true,
                        fromSummary: true
                      }
                    }
                  }
                ],
                index: 0,
                type: 'tab'
              }
            }
          ]
        })
      );
    } catch (error) {
      console.error('Error saving workout with photo:', error);
      Alert.alert(
        "Error", 
        "Could not save the photo. Please try again.",
        [{ text: "OK", onPress: () => setSaving(false) }]
      );
    }
  }, [navigation, workout, photoUri, updateCompletedWorkout]);

  // État pour les stickers du carousel
  const [carouselStickers, setCarouselStickers] = useState<Record<string, Sticker[]>>({});

  // Charger les stickers pour tous les workouts du carousel
  useEffect(() => {
    if (sourceType === 'journal' && workouts && workouts.length > 0) {
      const loadCarouselStickers = async () => {
        const stickersMap: Record<string, Sticker[]> = {};
        
        for (const workout of workouts) {
          try {
            const workoutStickers = await StickerService.generateWorkoutStickers(workout, true);
            stickersMap[workout.id] = workoutStickers;
          } catch (error) {
            console.error('[WorkoutOverviewScreen] Error loading carousel stickers:', error);
            stickersMap[workout.id] = [];
          }
        }
        
        setCarouselStickers(stickersMap);
      };

      loadCarouselStickers();
    }
  }, [sourceType, workouts]);

  // Rendu d'un workout dans le carousel (pour le mode journal)
  const renderWorkoutItem = useCallback(({ item }: { item: CompletedWorkout }) => {
    const currentWorkout = item;
    const workoutStickers = carouselStickers[currentWorkout.id] || [];
    
    return (
      <View style={[styles.container, { width: screenWidth }]}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo container */}
          <View style={styles.photoContainer}>
            <CachedImage
              uri={currentWorkout.photo || 'https://via.placeholder.com/400x600/242526/FFFFFF?text=Workout'}
              style={styles.photo}
              workout={currentWorkout} // Passer l'objet workout pour déterminer le flip automatiquement
              resizeMode="cover"
              fallbackUri="https://via.placeholder.com/400x600/242526/FFFFFF?text=Workout"
            />
            <LinearGradient
              colors={[
                'rgba(13, 13, 15, 0)', 
                'rgba(13, 13, 15, 0)',
                'rgba(13, 13, 15, 0.05)', 
                'rgba(13, 13, 15, 0.2)', 
                'rgba(13, 13, 15, 0.4)', 
                'rgba(13, 13, 15, 0.6)', 
                'rgba(13, 13, 15, 0.8)', 
                'rgba(13, 13, 15, 0.95)', 
                'rgba(13, 13, 15, 1)'
              ]}
              locations={[0, 0.2, 0.3, 0.4, 0.5, 0.6, 0.75, 0.9, 1]}
              style={styles.photoGradient}
              start={{ x: 0.5, y: 0.5 }}
              end={{ x: 0.5, y: 1 }}
            />
          </View>
          
          {/* Contenu principal */}
          <View style={styles.mainContent}>
            {/* Badges */}
            <View style={styles.badgesContainer}>
              {workoutStickers.map((sticker, index) => (
                <StickerBadge
                  key={`sticker-${index}`}
                  sticker={sticker}
                  size="xlarge"
                  showText={true}
                />
              ))}
            </View>
            
            {/* Titre et date */}
            <View style={styles.titleContainer}>
              <Text style={styles.workoutTitle}>{currentWorkout.name || "Workout"}</Text>
              <Text style={styles.workoutDate}>
                {new Date(currentWorkout.date).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </Text>
            </View>
            
            {/* Stats container */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.floor(currentWorkout.duration / 60)} min</Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{currentWorkout.exercises.filter(ex => ex.sets.some(set => set.completed)).length}</Text>
                <Text style={styles.statLabel}>Exercises</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {currentWorkout.exercises.reduce((total, ex) => total + ex.sets.filter(set => set.completed).length, 0)}
                </Text>
                <Text style={styles.statLabel}>Sets</Text>
              </View>
            </View>
            
            {/* Exercices */}
            {currentWorkout.exercises
              .filter(exercise => exercise.sets.some(set => set.completed))
              .map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseContainer}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <View style={styles.headerRightContainer}>
                    {exercise.personalRecord && (
                      <View style={styles.recordBadge}>
                        <Ionicons name="trophy" size={14} color="#000000" />
                        <Text style={styles.recordText}>PR</Text>
                      </View>
                    )}
                    <Text style={styles.exerciseSetsCount}>
                      {exercise.sets.filter(set => set.completed).length} sets
                    </Text>
                  </View>
                </View>
                
                {/* Sets */}
                <View style={styles.setsListContainer}>
                  {exercise.tracking === 'trackedOnSets' ? (
                    exercise.sets
                      .filter(set => set.completed)
                      .map((set, setIndex) => (
                        <View 
                          key={`${exercise.id}-set-${setIndex}`} 
                          style={styles.setContainer}
                        >
                          {/* Weight container */}
                          <View style={styles.dataContainer}>
                            <Text style={styles.dataText}>{set.weight} kg</Text>
                          </View>
                          
                          {/* Reps container */}
                          <View style={styles.dataContainer}>
                            <Text style={styles.dataText}>{set.reps} reps</Text>
                          </View>
                          
                          {/* PR badge if needed */}
                          {exercise.personalRecord && setIndex === 0 && (
                            <View style={styles.setPrBadge}>
                              <Text style={styles.setPrText}>NEW PR</Text>
                            </View>
                          )}
                        </View>
                      ))
                  ) : (
                    <View style={styles.dataContainer}>
                      <Text style={styles.dataText}>{formatDuration(exercise.duration || 0)}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Back button et SafeAreaView en overlay */}
        <View style={styles.safeAreaOverlay} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [screenWidth, handleGoBack]);

  // Rendre la barre d'état transparente
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor('transparent');
    }

    return () => {
      // Réinitialiser lors du démontage
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(false);
        StatusBar.setBackgroundColor('#0D0D0F');
      }
    };
  }, []);

  // Rendu conditionnel basé sur le mode (tracking vs journal)
  if (sourceType === 'journal' && workouts.length > 0) {
    return (
      <View style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <FlatList
          ref={flatListRef}
          data={workouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={currentIndex}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          bounces={true}
          decelerationRate="fast"
          snapToInterval={screenWidth}
          snapToAlignment="center"
        />
      </View>
    );
  }

  // Rendu pour le mode tracking
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo container */}
        <View style={styles.photoContainer}>
          <CachedImage
            uri={photoUri}
            style={styles.photo}
            workout={workout} // Passer l'objet workout pour déterminer le flip automatiquement
            resizeMode="cover"
            fallbackUri="https://via.placeholder.com/400x600/242526/FFFFFF?text=Workout"
          />
          <LinearGradient
            colors={[
              'rgba(13, 13, 15, 0)', 
              'rgba(13, 13, 15, 0)',
              'rgba(13, 13, 15, 0.05)', 
              'rgba(13, 13, 15, 0.2)', 
              'rgba(13, 13, 15, 0.4)', 
              'rgba(13, 13, 15, 0.6)', 
              'rgba(13, 13, 15, 0.8)', 
              'rgba(13, 13, 15, 0.95)', 
              'rgba(13, 13, 15, 1)'
            ]}
            locations={[0, 0.2, 0.3, 0.4, 0.5, 0.6, 0.75, 0.9, 1]}
            style={styles.photoGradient}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>
        
        {/* Contenu principal */}
        <View style={styles.mainContent}>
          {/* Badges */}
          <View style={styles.badgesContainer}>
            {stickers.map((sticker, index) => (
              <StickerBadge
                key={`sticker-${index}`}
                sticker={sticker}
                size="xlarge"
                showText={true}
              />
            ))}
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.workoutTitle}>{workout.name || "Workout"}</Text>
            <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
          </View>
          
          {/* Stats container */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDuration(workout.duration)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workout.exercises.filter(ex => ex.sets.some(set => set.completed)).length}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {workout.exercises.reduce((total, ex) => 
                  total + ex.sets.filter(set => set.completed).length, 0)}
              </Text>
              <Text style={styles.statLabel}>Sets</Text>
            </View>
          </View>
          
          {/* Exercises */}
          {workout.exercises
            .filter(exercise => exercise.sets.some(set => set.completed))
            .map((exercise, index) => (
            <View key={exercise.id} style={styles.exerciseContainer}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <View style={styles.headerRightContainer}>
                  {exercise.personalRecord && (
                    <View style={styles.recordBadge}>
                      <Ionicons name="trophy" size={14} color="#000000" />
                      <Text style={styles.recordText}>PR</Text>
                    </View>
                  )}
                  <Text style={styles.exerciseSetsCount}>
                    {exercise.sets.filter(set => set.completed).length} sets
                  </Text>
                </View>
              </View>
              
              {/* Sets */}
              <View style={styles.setsListContainer}>
                {exercise.tracking === 'trackedOnSets' ? (
                  exercise.sets
                    .filter(set => set.completed)
                    .map((set, setIndex) => (
                      <View 
                        key={`${exercise.id}-set-${setIndex}`} 
                        style={styles.setContainer}
                      >
                        {/* Weight container */}
                        <View style={styles.dataContainer}>
                          <Text style={styles.dataText}>{set.weight} kg</Text>
                        </View>
                        
                        {/* Reps container */}
                        <View style={styles.dataContainer}>
                          <Text style={styles.dataText}>{set.reps} reps</Text>
                        </View>
                        
                        {/* PR badge if needed */}
                        {exercise.personalRecord && setIndex === 0 && (
                          <View style={styles.setPrBadge}>
                            <Text style={styles.setPrText}>NEW PR</Text>
                          </View>
                        )}
                      </View>
                    ))
                ) : (
                  <View style={styles.dataContainer}>
                    <Text style={styles.dataText}>{formatDuration(exercise.duration || 0)}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      
      {/* Save button - only shown in tracking mode */}
      {sourceType === 'tracking' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveAndViewJournal}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Save to Journal</Text>
                <Ionicons name="arrow-forward" size={20} color="#000000" />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Back button et SafeAreaView en overlay */}
      <View style={styles.safeAreaOverlay} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  photoContainer: {
    width: '100%',
    height: Dimensions.get('window').height * 0.7,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  safeAreaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  backButton: {
    marginTop: 64, // Position fixe à 64px du haut
    marginLeft: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    marginTop: -100,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 16,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  workoutTitle: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  workoutDate: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(36, 37, 38, 0.5)',
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(36, 37, 38, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseSetsCount: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'right',
  },
  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    gap: 4,
  },
  recordText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  setsListContainer: {
    marginTop: 16,
  },
  setContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    position: 'relative',
  },
  dataContainer: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  dataText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  setPrBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  setPrText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
}); 