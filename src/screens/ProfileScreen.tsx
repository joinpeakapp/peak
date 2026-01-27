import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useWorkoutHistory } from '../workout/contexts/WorkoutHistoryContext';
import { useNavigation, useScrollToTop } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePersonalRecords } from '../hooks/usePersonalRecords';
import UserProfileService, { UserProfile } from '../services/userProfileService';
import { SettingsModal } from '../components/common/SettingsModal';
import { EditProfileModal } from '../components/common/EditProfileModal';
import { ContextMenu, ContextMenuItem } from '../components/common/ContextMenu';
import { WorkoutMiniCard } from '../workout/components/WorkoutMiniCard';
import { CompletedWorkout } from '../types/workout';
import { StickerService } from '../services/stickerService';
import { PhotoStorageService } from '../services/photoStorageService';
import { Sticker } from '../types/stickers';
import { CachedImage } from '../components/common/CachedImage';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { NewOnboardingNavigator } from './onboarding/NewOnboardingNavigator';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - (16 * 2) - (8 * 2)) / 3;
const CARD_HEIGHT = CARD_WIDTH * (192 / 114); // Ratio 114x192px

export const ProfileScreen: React.FC = () => {
  const { completedWorkouts } = useWorkoutHistory();
  const { records } = usePersonalRecords();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] = useState(false);
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [settingsButtonLayout, setSettingsButtonLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const settingsButtonRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Charger le profil au montage
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Scroll vers le haut quand on clique sur le tab actif
  useScrollToTop(scrollViewRef);

  // Charger le profil utilisateur
  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await UserProfileService.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('[ProfileScreen] Error loading user profile:', error);
    }
  }, []);


  // Récupérer les stickers d'une séance via le cache
  const getWorkoutStickers = (workout: CompletedWorkout): Sticker[] => {
    return workoutStickers[workout.id] || [];
  };

  // Gérer le clic sur le bouton settings
  const handleSettingsPress = () => {
    if (settingsButtonRef.current) {
      settingsButtonRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setSettingsButtonLayout({ x: pageX, y: pageY, width, height });
        setIsContextMenuVisible(true);
      });
    }
  };

  // Gérer la complétion de l'onboarding
  const handleOnboardingComplete = useCallback(async (profile: UserProfile) => {
    console.log('[ProfileScreen] Onboarding completed:', profile);
    setUserProfile(profile);
    setShowOnboarding(false);
    // Recharger le profil pour s'assurer qu'il est à jour
    await loadUserProfile();
  }, [loadUserProfile]);

  // Items du ContextMenu
  const contextMenuItems: ContextMenuItem[] = [
    {
      key: 'edit',
      label: 'Edit profile',
      icon: 'pencil-outline',
      onPress: () => setIsEditProfileModalVisible(true),
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: 'settings-outline',
      onPress: () => setIsSettingsModalVisible(true),
    },
    {
      key: 'onboarding',
      label: 'View onboarding (dev)',
      icon: 'rocket-outline',
      onPress: () => setShowOnboarding(true),
    },
  ];

  // Gérer la mise à jour du profil
  const handleProfileUpdated = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  // Calculate workout statistics
  const workoutStats = useMemo(() => {
    // Total workouts completed
    const totalWorkouts = completedWorkouts.length;
    
    // Total exercises performed (counting unique exercises)
    const uniqueExercises = new Set<string>();
    completedWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        uniqueExercises.add(exercise.name);
      });
    });
    const totalExercises = uniqueExercises.size;
    
    // Total sets completed
    const totalSets = completedWorkouts.reduce(
      (total, workout) => total + workout.exercises.reduce(
        (subTotal, exercise) => subTotal + exercise.sets.filter(set => set.completed).length, 
        0
      ), 
      0
    );
    
    // Extract all unique exercises with their records (max weight)
    const exercisesMap = new Map();
    
    Object.entries(records).forEach(([exerciseName, record]) => {
      if (record.maxWeight > 0 && record.maxWeightDate && record.repsPerWeight && Object.keys(record.repsPerWeight).length > 0) {
        exercisesMap.set(exerciseName, {
          name: exerciseName,
          weight: record.maxWeight,
          date: record.maxWeightDate
        });
      }
    });
    
    // Convert the map to array and sort by weight (highest to lowest)
    const exercisesList = Array.from(exercisesMap.values()).sort((a, b) => b.weight - a.weight);
    
    return {
      totalWorkouts,
      totalExercises,
      totalSets,
      exercisesList
    };
  }, [completedWorkouts, records]);

  // Workouts récents triés (plus récents en premier)
  const recentWorkouts = useMemo(() => {
    return [...completedWorkouts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Limiter aux 10 premiers
  }, [completedWorkouts]);

  // Calculer les stickers depuis le cache AVANT le premier render (instantané)
  const initialStickers = useMemo(() => {
    const stickersMap: Record<string, Sticker[]> = {};
    recentWorkouts.forEach((workout) => {
      const cachedStickers = StickerService.getCachedStickers(workout, true);
      if (cachedStickers) {
        stickersMap[workout.id] = cachedStickers;
      }
    });
    return stickersMap;
  }, [recentWorkouts]);

  // Initialiser les URIs de photos vérifiées AVANT le premier render
  // Les photos sont déjà vérifiées et migrées dans AppPreloadService.preloadPhotos()
  const initialPhotoUris = useMemo(() => {
    const photoUrisMap: Record<string, string> = {};
    recentWorkouts.forEach((workout) => {
      // Utiliser directement item.photo car les photos sont déjà migrées vers documentDirectory
      if (workout.photo && !workout.photo.includes('placeholder')) {
        photoUrisMap[workout.id] = workout.photo;
      }
    });
    return photoUrisMap;
  }, [recentWorkouts]);

  // États pour les workouts récents (initialisés avec le cache)
  const [workoutStickers, setWorkoutStickers] = useState<Record<string, Sticker[]>>(initialStickers);
  const [verifiedPhotoUris, setVerifiedPhotoUris] = useState<Record<string, string>>(initialPhotoUris);

  // Mettre à jour les stickers et photos si le cache change (pour les nouveaux workouts)
  useEffect(() => {
    setWorkoutStickers(initialStickers);
    setVerifiedPhotoUris(initialPhotoUris);
  }, [initialStickers, initialPhotoUris]);

  // Charger les stickers manquants et vérifier les photos pour les workouts récents
  // Note: Les photos sont déjà préchargées dans AppPreloadService, mais on vérifie quand même
  // pour les cas où une photo n'est plus accessible
  useEffect(() => {
    const loadStickersAndPhotos = async () => {
      const stickersMap: Record<string, Sticker[]> = { ...initialStickers };
      const photoUrisMap: Record<string, string> = { ...initialPhotoUris };
      
      // Charger en parallèle les stickers manquants et vérifier les photos si nécessaire
      const loadPromises = recentWorkouts.map(async (workout) => {
        try {
          // Si les stickers ne sont pas dans le cache, les générer
          let stickers = stickersMap[workout.id];
          if (!stickers) {
            stickers = await StickerService.generateWorkoutStickers(workout, true);
          }
          
          // Vérifier l'URI de photo seulement si elle n'est pas déjà dans initialPhotoUris
          // ou si elle pourrait ne plus être accessible (fallback pour compatibilité)
          let photoUri = photoUrisMap[workout.id];
          if (!photoUri && workout.photo && !workout.photo.includes('placeholder')) {
            // Utiliser getAccessiblePhotoUri() pour garantir la compatibilité avec la persistance
            const accessiblePhotoUri = await PhotoStorageService.getAccessiblePhotoUri(
              workout.photo, 
              workout.id
            );
            if (accessiblePhotoUri && !accessiblePhotoUri.includes('placeholder')) {
              photoUri = accessiblePhotoUri;
            }
          }
          
          return {
            workoutId: workout.id,
            stickers,
            photoUri
          };
        } catch (error) {
          console.error('[ProfileScreen] Error loading data for workout:', workout.name, error);
          return {
            workoutId: workout.id,
            stickers: stickersMap[workout.id] || [],
            photoUri: photoUrisMap[workout.id]
          };
        }
      });
      
      // Attendre que tous les chargements soient terminés
      const results = await Promise.all(loadPromises);
      
      // Construire les maps à partir des résultats (seulement mettre à jour si nécessaire)
      let hasChanges = false;
      results.forEach(({ workoutId, stickers, photoUri }) => {
        if (stickers.length > 0 && !stickersMap[workoutId]) {
          stickersMap[workoutId] = stickers;
          hasChanges = true;
        }
        if (photoUri && photoUri !== photoUrisMap[workoutId]) {
          photoUrisMap[workoutId] = photoUri;
          hasChanges = true;
        }
      });
      
      // Mettre à jour seulement si nécessaire pour éviter les re-renders inutiles
      if (hasChanges) {
        setWorkoutStickers(stickersMap);
        setVerifiedPhotoUris(photoUrisMap);
      }
    };

    if (recentWorkouts.length > 0) {
      loadStickersAndPhotos();
    }
  }, [recentWorkouts, initialStickers, initialPhotoUris]);

  const navigateToExerciseDetail = (exerciseName: string) => {
    navigation.navigate('MainTabs', {
      screen: 'ProfileTab',
      params: {
        screen: 'ExerciseDetail',
        params: { exerciseName },
      },
    });
  };

  const navigateToJournal = () => {
    navigation.navigate('MainTabs', {
      screen: 'JournalTab',
      params: {
        screen: 'Journal',
      },
    } as any);
  };

  const handleWorkoutPress = (workout: CompletedWorkout) => {
    // Naviguer vers le journal puis ouvrir le workout en grand
    const workoutIndex = recentWorkouts.findIndex(w => w.id === workout.id);
    
    navigation.navigate('SummaryFlow', {
      screen: 'WorkoutOverview',
      params: {
        workout: workout,
        photoUri: verifiedPhotoUris[workout.id] || workout.photo || 'https://via.placeholder.com/400x600/242526/FFFFFF?text=Workout',
        sourceType: 'journal',
        workouts: recentWorkouts,
        currentIndex: workoutIndex
      }
    });
  };

  const renderWorkoutCard = ({ item }: { item: CompletedWorkout }) => {
    const stickers = getWorkoutStickers(item);
    const imageUri = verifiedPhotoUris[item.id] || item.photo || 'https://via.placeholder.com/114x192/242526/FFFFFF?text=Workout';
    
    return (
      <WorkoutMiniCard
        workout={item}
        imageUri={imageUri}
        stickers={stickers}
        onPress={() => handleWorkoutPress(item)}
        cardWidth={CARD_WIDTH}
        cardHeight={CARD_HEIGHT}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Bouton settings fixe en haut à droite */}
      <TouchableOpacity
        ref={settingsButtonRef}
        style={styles.settingsButton}
        onPress={handleSettingsPress}
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo de profil */}
        <View style={styles.profilePhotoContainer}>
          <TouchableOpacity
            onPress={() => setIsEditProfileModalVisible(true)}
            activeOpacity={0.8}
            style={styles.profilePhotoWrapper}
          >
            {userProfile?.profilePhotoUri ? (
              <CachedImage
                uri={userProfile.profilePhotoUri}
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Ionicons name="person" size={48} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Nom d'utilisateur */}
        {userProfile && (
          <Text style={styles.userName}>
            {userProfile.firstName}
          </Text>
        )}

        {/* Section métriques */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.metricNumber}>{workoutStats.totalWorkouts}</Text>
            <Text style={styles.metricLabel}>workouts</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricNumber}>{workoutStats.totalExercises}</Text>
            <Text style={styles.metricLabel}>exercises</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricNumber}>{workoutStats.totalSets}</Text>
            <Text style={styles.metricLabel}>sets</Text>
          </View>
        </View>


        {/* Section Last Workouts */}
        {recentWorkouts.length > 0 && (
          <View style={styles.lastWorkoutsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Last workouts</Text>
              <TouchableOpacity onPress={() => navigateToJournal()}>
                <Text style={styles.seeMoreButton}>See more</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentWorkouts}
              renderItem={renderWorkoutCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.workoutsList}
            />
          </View>
        )}

        {/* Section Exercises */}
        <View style={styles.exercisesContainer}>
          <Text style={styles.exercisesTitle}>Exercises</Text>
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
                    Current PR : {exercise.weight}kg
                  </Text>
                </View>
                <View style={styles.chevronContainer}>
                  <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.6)" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Context Menu */}
      <ContextMenu
        visible={isContextMenuVisible}
        onClose={() => setIsContextMenuVisible(false)}
        items={contextMenuItems}
        anchorPosition={settingsButtonLayout || undefined}
      />

      {/* Edit Profile Modal */}
      {isEditProfileModalVisible && userProfile && (
        <EditProfileModal
          visible={isEditProfileModalVisible}
          onClose={() => setIsEditProfileModalVisible(false)}
          userProfile={userProfile}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        visible={isSettingsModalVisible}
        onClose={() => setIsSettingsModalVisible(false)}
      />

      {/* Onboarding Modal (Dev) */}
      <NewOnboardingNavigator
        visible={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
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
    paddingTop: 0,
    paddingBottom: 30,
  },
  settingsButton: {
    position: 'absolute',
    top: 80,
    right: 12,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginTop: 120,
    marginBottom: 16,
  },
  profilePhotoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  profilePhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 14,
    color: '#888888',
    textTransform: 'lowercase',
  },
  lastWorkoutsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  seeMoreButton: {
    fontSize: 16,
    color: '#888',
  },
  workoutsList: {
    paddingHorizontal: 16,
  },
  exercisesContainer: {
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  exercisesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 8,
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
});
