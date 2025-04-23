import React, { useState, useCallback, useMemo } from 'react';
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
  Alert
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
import { BlurView } from 'expo-blur';
import { RootStackParamList, SummaryStackParamList } from '../../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompletedWorkout } from '../../types/workout';

type WorkoutPreviewRouteProp = RouteProp<SummaryStackParamList, 'WorkoutPreview'>;

export const WorkoutPreviewScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<WorkoutPreviewRouteProp>();
  const { workout, photoUri } = route.params;
  
  const [saving, setSaving] = useState(false);

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
  const getStickers = () => {
    const stickers = [];
    
    // Check if total time is greater than 45 minutes
    if (workout.duration > 45 * 60) {
      stickers.push({
        name: "Endurance",
        icon: "fitness-outline" as any,
        color: "#3498db"
      });
    }
    
    // Check if at least 5 different exercises were performed
    if (workout.exercises.length >= 5) {
      stickers.push({
        name: "Variety",
        icon: "grid-outline" as any,
        color: "#9b59b6"
      });
    }
    
    // Check personal records
    const prExercises = workout.exercises.filter(ex => ex.personalRecord);
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
      
      // Get the fromSummary parameter from route
      const fromSummary = route.params.fromSummary || false;
      
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
                        fromSummary
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
  }, [navigation, workout, photoUri, route.params.fromSummary]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.contentContainer}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo container avec gradient */}
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: photoUri }}
              style={styles.photo}
              resizeMode="cover"
            />
        <LinearGradient
              colors={[
                'rgba(25, 26, 29, 0)', 
                'rgba(25, 26, 29, 0)', 
                'rgba(25, 26, 29, 0.05)', 
                'rgba(25, 26, 29, 0.1)', 
                'rgba(25, 26, 29, 0.2)', 
                'rgba(25, 26, 29, 0.4)', 
                'rgba(25, 26, 29, 0.6)', 
                'rgba(25, 26, 29, 0.8)', 
                '#191A1D'
              ]}
              locations={[0, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 1]}
              style={styles.photoGradient}
              start={{ x: 0.5, y: 0.45 }}
              end={{ x: 0.5, y: 1 }}
            />
            <BlurView 
              intensity={20} 
              tint="dark" 
              style={styles.blurOverlay}
            />
          </View>
          
          {/* Contenu principal */}
          <View style={styles.mainContent}>
            {/* Badges, titre et date placés 24px au-dessus du container des statistiques */}
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
                  <Text style={styles.statValue}>{workout.exercises.length}</Text>
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
              {workout.exercises.map((exercise, index) => (
                <View key={exercise.id} style={styles.exerciseContainer}>
                  <View style={styles.exerciseHeader}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <View style={styles.headerRightContainer}>
                      <Text style={styles.exerciseSetsCount}>
                      {exercise.sets.filter(set => set.completed).length} séries
                      </Text>
                    </View>
                  </View>
                  
                  {/* Sets */}
                  <View style={styles.setsListContainer}>
                    {exercise.tracking === 'trackedOnSets' ? (
                      exercise.sets
                        .map((set, originalIndex) => 
                          set.completed ? (
                            <View 
                              key={`${exercise.id}-set-${originalIndex}`} 
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
                            {exercise.personalRecord && originalIndex === 0 && (
                              <View style={styles.setPrBadge}>
                                <Text style={styles.setPrText}>NEW PR</Text>
                              </View>
                            )}
                            </View>
                          ) : null
                        ).filter(Boolean)
                    ) : (
                      <View style={styles.dataContainer}>
                        <Text style={styles.dataText}>{formatDuration(exercise.duration || 0)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
              
            <View style={styles.bottomPadding} />
          </View>
        </ScrollView>

        {/* Fixed save button at bottom */}
        <View style={styles.saveButtonContainer}>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSaveAndViewJournal}
                  disabled={saving}
                >
                  <Text style={styles.saveText}>
                    {saving ? 'Saving...' : 'Save & View in Journal'}
                  </Text>
                  {!saving && <Ionicons name="arrow-forward" size={20} color="#000000" />}
                </TouchableOpacity>
              </View>
          </SafeAreaView>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#191A1D',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Pour éviter que le contenu soit caché par le bouton fixe
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoContainer: {
    width: width,
    height: height * 0.5, // Modifié de 70% à 50% de la hauteur de l'écran
    position: 'relative',
    overflow: 'hidden',
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
    height: '100%', // Le gradient couvre toute la hauteur depuis le point de départ
  },
  blurOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    opacity: 0.3,
  },
  mainContent: {
    paddingTop: 0, // Réduit le padding pour remonter le contenu
    paddingHorizontal: 16,
    marginTop: -height * 0.05, // Remonte le contenu pour chevaucher la photo
  },
  // Styles for badges
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
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
  // Styles for title and date
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24, // 24px d'espace avant le conteneur des statistiques
  },
  workoutTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
  // Styles for stats - harmonisé avec les autres conteneurs
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginTop: 4,
  },
  statLabel: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  // Styles for exercises
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
    fontSize: 18,
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
    fontSize: 16,
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
  // Style for fixed save button
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: 'rgba(25, 26, 29, 0.5)',
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
  saveText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
}); 