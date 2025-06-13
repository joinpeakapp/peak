import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  SafeAreaView,
  Platform,
  Dimensions,
  ScrollView,
  Alert,
  FlatList,
  ViewToken,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  NavigationProp, 
  RouteProp, 
  useNavigation, 
  useRoute,
  CommonActions 
} from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList, SummaryStackParamList } from '../../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompletedWorkout } from '../../types/workout';

type WorkoutOverviewRouteProp = RouteProp<SummaryStackParamList, 'WorkoutOverview'>;

export const WorkoutOverviewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<WorkoutOverviewRouteProp>();
  const { workout, photoUri, sourceType = 'tracking', workouts = [], currentIndex = 0 } = route.params;
  
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

  // Determine which stickers to display
  const getStickers = (currentWorkout = workout) => {
    const stickers = [];
    
    // Check if total time is greater than 45 minutes
    if (currentWorkout.duration > 45 * 60) {
      stickers.push({
        name: "Endurance",
        icon: "fitness-outline" as any,
        color: "#3498db"
      });
    }
    
    // Check if at least 5 different exercises were performed
    if (currentWorkout.exercises.length >= 5) {
      stickers.push({
        name: "Variety",
        icon: "grid-outline" as any,
        color: "#9b59b6"
      });
    }
    
    // Check personal records
    const prExercises = currentWorkout.exercises.filter(ex => ex.personalRecord);
    if (prExercises.length > 0) {
      stickers.push({
        name: "New Record",
        icon: "trophy-outline" as any,
        color: "#f39c12"
      });
    }
    
    // Default sticker if no other
    if (stickers.length === 0) {
      stickers.push({
        name: "Complete",
        icon: "checkmark-circle-outline" as any,
        color: "#2ecc71"
      });
    }
    
    return stickers.slice(0, 3); // Limit to a maximum of 3 stickers
  };

  const stickers = useMemo(() => getStickers(), [workout]);

  // Handle returning to the photo capture screen
  const handleGoBack = () => {
    navigation.goBack();
  };

  // Handle finalization and navigation to Journal
  const handleSaveAndViewJournal = useCallback(async () => {
    setSaving(true);
    
    try {
      // Get existing workouts
      const storedWorkouts = await AsyncStorage.getItem('completedWorkouts');
      let workouts: CompletedWorkout[] = [];
      
      if (storedWorkouts) {
        workouts = JSON.parse(storedWorkouts);
      }
      
      // Update or add workout with photo
      const workoutWithPhoto = { ...workout, photo: photoUri };
      const existingIndex = workouts.findIndex(w => w.id === workout.id);
      
      if (existingIndex >= 0) {
        workouts[existingIndex] = workoutWithPhoto;
      } else {
        workouts.push(workoutWithPhoto);
      }
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('completedWorkouts', JSON.stringify(workouts));
      
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
  }, [navigation, workout, photoUri]);

  // Rendu d'un workout dans le carousel (pour le mode journal)
  const renderWorkoutItem = useCallback(({ item }: { item: CompletedWorkout }) => {
    const currentWorkout = item;
    const workoutStickers = getStickers(currentWorkout);
    
    return (
      <View style={[styles.container, { width: screenWidth }]}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo container */}
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: currentWorkout.photo || 'https://via.placeholder.com/400x600/242526/FFFFFF?text=Workout' }}
              style={styles.photo}
              resizeMode="cover"
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
                <View
                  key={`sticker-${index}`}
                  style={[
                    styles.stickerBadge,
                    { backgroundColor: sticker.color }
                  ]}
                >
                  <Ionicons name={sticker.icon} size={18} color="#FFFFFF" />
                  <Text style={styles.stickerText}>{sticker.name}</Text>
                </View>
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
        <SafeAreaView style={styles.safeAreaOverlay} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }, [screenWidth, handleGoBack, getStickers]);

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
          <Image
            source={{ uri: photoUri }}
            style={styles.photo}
            resizeMode="cover"
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
              <View
                key={`sticker-${index}`}
                style={[
                  styles.stickerBadge,
                  { backgroundColor: sticker.color }
                ]}
              >
                <Ionicons name={sticker.icon} size={18} color="#FFFFFF" />
                <Text style={styles.stickerText}>{sticker.name}</Text>
              </View>
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
      <SafeAreaView style={styles.safeAreaOverlay} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>
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
    marginTop: Platform.OS === 'ios' ? 8 : (StatusBar.currentHeight || 0) + 8,
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
  stickerBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  stickerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
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