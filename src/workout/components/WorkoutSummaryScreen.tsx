import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompletedWorkout, CompletedSet } from '../../types/workout';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, NavigationProp } from '@react-navigation/native';

// Type de navigation pour l'application
type RootStackParamList = {
  JournalTab: { newWorkoutId?: string } | undefined;
  // Ajouter d'autres écrans si nécessaire
};

interface WorkoutSummaryScreenProps {
  workout: CompletedWorkout;
  onFinish: () => void;
}

interface StepInfo {
  title: string;
  subtitle: string;
}

export const WorkoutSummaryScreen: React.FC<WorkoutSummaryScreenProps> = ({
  workout,
  onFinish
}) => {
  // Navigation
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  // State pour animations
  const [showContent, setShowContent] = useState(false);
  const [currentStickerIndex, setCurrentStickerIndex] = useState(-1);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showInitialTitle, setShowInitialTitle] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const [showStats, setShowStats] = useState(false);
  const [showExercises, setShowExercises] = useState(false);
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const exercisesOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // Animation pour les stickers
  const stickerAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  // Formatage du temps (secondes -> mm:ss)
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Textes spécifiques pour chaque type de badge
  const badgeInfo: Record<string, StepInfo> = {
    "Endurance": {
      title: "Endurance Master!",
      subtitle: "You've pushed through a long session - your stamina is remarkable"
    },
    "Variety": {
      title: "Exercise Explorer!",
      subtitle: "Mixing up your routine with diverse exercises - that's how you grow"
    },
    "New Record": {
      title: "New Personal Best!",
      subtitle: "You just crushed your limits - and set a new one"
    },
    "Complete": {
      title: "Workout Complete",
      subtitle: "Great job on completing your workout!"
    }
  };

  // Gestion du tap pour passer à l'animation suivante
  const handleTapToContinue = () => {
    if (showInitialTitle) {
      // Passer de l'écran initial aux animations de stickers
      setShowInitialTitle(false);
      if (stickers.length > 0) {
        setCurrentStickerIndex(0);
      } else {
        animateFinalContent();
      }
    } else if (currentStickerIndex >= 0 && currentStickerIndex < stickers.length - 1) {
      // Passer à l'animation du sticker suivant
      setCurrentStickerIndex(prev => prev + 1);
    } else if (currentStickerIndex === stickers.length - 1) {
      // Si on est sur le dernier sticker, passer à l'animation finale
      animateFinalContent();
    }
  };

  // Animation d'entrée
  useEffect(() => {
    // Animer l'apparition progressive du titre et du container vide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Commencer la séquence d'animation des stickers après 1.5 secondes
      setTimeout(() => {
        setShowInitialTitle(false);
        if (stickers.length > 0) {
          setCurrentStickerIndex(0);
        } else {
          animateFinalContent();
        }
      }, 1500);
    });
  }, []);

  // Observer les changements de sticker courant
  useEffect(() => {
    if (currentStickerIndex >= 0 && currentStickerIndex < stickers.length) {
      // Animer ce sticker
      animateCurrentSticker();
    } else if (currentStickerIndex >= stickers.length) {
      // Tous les stickers ont été animés, passer à l'animation finale
      animateFinalContent();
    }
  }, [currentStickerIndex]);

  // Animation pour le sticker courant
  const animateCurrentSticker = () => {
    // Animer le sticker
    Animated.spring(stickerAnims[currentStickerIndex], {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      // Attendre un moment avant de passer au sticker suivant automatiquement
      setTimeout(() => {
        if (currentStickerIndex < stickers.length - 1) {
          setCurrentStickerIndex(prev => prev + 1);
        } else if (currentStickerIndex === stickers.length - 1) {
          // Si c'est le dernier sticker, passer à l'animation finale
          animateFinalContent();
        }
      }, 2000);
    });
  };

  // Animation finale pour afficher le contenu
  const animateFinalContent = () => {
    setAnimationComplete(true);
    
    // Animer l'apparition du contenu stats
    Animated.timing(statsOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowStats(true);
      
      // Animer l'apparition des exercices après les stats
      setTimeout(() => {
        Animated.timing(exercisesOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setShowExercises(true);
          
          // Animer l'apparition du bouton après les exercices
          setTimeout(() => {
            Animated.timing(buttonOpacity, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }).start();
          }, 200);
        });
      }, 200);
    });
  };

  // Déterminer quels stickers afficher
  const getStickers = () => {
    const stickers = [];
    
    // Sticker pour la durée
    if (workout.duration > 30 * 60) { // Plus de 30 minutes
      stickers.push({
        name: "Endurance",
        icon: "timer-outline" as any,
        color: "#FF8A24"
      });
    }
    
    // Sticker pour le nombre d'exercices
    if (workout.exercises.length >= 5) {
      stickers.push({
        name: "Variety",
        icon: "grid-outline" as any,
        color: "#3498db"
      });
    }
    
    // Sticker pour les records personnels
    const hasPersonalRecords = workout.exercises.some(ex => ex.personalRecord);
    if (hasPersonalRecords) {
      stickers.push({
        name: "New Record",
        icon: "trophy-outline" as any,
        color: "#f1c40f"
      });
    }
    
    // Sticker par défaut si aucun autre
    if (stickers.length === 0) {
      stickers.push({
        name: "Complete",
        icon: "checkmark-circle-outline" as any,
        color: "#2ecc71"
      });
    }
    
    return stickers.slice(0, 3); // Limiter à 3 stickers maximum
  };

  const stickers = getStickers();
  
  // Détermine l'information à afficher selon le sticker courant ou l'état de l'animation
  const getCurrentStepInfo = (): StepInfo => {
    if (showInitialTitle) {
      return badgeInfo.Complete;
    }
    
    if (!animationComplete && currentStickerIndex >= 0 && currentStickerIndex < stickers.length) {
      const currentSticker = stickers[currentStickerIndex];
      return badgeInfo[currentSticker.name] || badgeInfo.Complete;
    }
    
    // Animation finale ou pas de sticker
    return badgeInfo.Complete;
  };
  
  // Obtenir la couleur du gradient
  const getGradientColor = () => {
    if (!animationComplete && currentStickerIndex >= 0 && currentStickerIndex < stickers.length) {
      return stickers[currentStickerIndex].color;
    }
    
    // Utiliser la couleur du premier sticker ou une couleur par défaut
    return stickers.length > 0 ? stickers[0].color : "#2ecc71";
  };
  
  // Info de l'étape courante
  const currentStepInfo = getCurrentStepInfo();

  // Fonction pour naviguer vers l'écran Journal avec l'ID du workout
  const handleViewInJournal = () => {
    // Naviguer vers l'écran Journal en passant l'ID du workout terminé
    navigation.navigate('JournalTab', { newWorkoutId: workout.id });
    
    // Appeler aussi la fonction onFinish fournie par le parent
    onFinish();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={{flex: 1}}
      onPress={handleTapToContinue}
    >
      <View style={styles.container}>
        {/* Gradient de fond */}
        <LinearGradient
          colors={[`${getGradientColor()}20`, 'rgba(10, 10, 12, 0.12)']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        
        <Animated.View 
          style={[
            styles.contentContainer,
            { opacity: fadeAnim }
          ]}
        >
          <ScrollView style={styles.scrollView} scrollEnabled={animationComplete}>
            {/* Titre et sous-titre */}
            <Animated.View 
              style={[
                styles.titleContainer,
                { 
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Text style={styles.congratsText}>
                {currentStepInfo.title}
              </Text>
              <Text style={styles.headerSubtext}>
                {currentStepInfo.subtitle}
              </Text>
            </Animated.View>
            
            {/* Container pour les stickers (toujours visible, même vide) */}
            <View style={styles.stickersContentContainer}>
              {stickers.map((sticker, index) => (
                <Animated.View 
                  key={`sticker-content-${index}`}
                  style={[
                    styles.stickerContentCircle,
                    { 
                      backgroundColor: sticker.color,
                      opacity: index <= currentStickerIndex ? 1 : 0,
                      transform: [
                        { 
                          scale: index === currentStickerIndex 
                            ? stickerAnims[index] 
                            : index < currentStickerIndex ? 1 : 0 
                        }
                      ]
                    }
                  ]}
                >
                  <Ionicons name={sticker.icon} size={32} color="#FFFFFF" />
                  <Text style={styles.stickerContentText}>{sticker.name}</Text>
                </Animated.View>
              ))}
            </View>
            
            {/* Texte "Tap to continue" */}
            {!animationComplete && (
              <Text style={styles.tapToContinueText}>Tap to continue</Text>
            )}
            
            {/* Stats */}
            <Animated.View style={{ opacity: statsOpacity }}>
              <View style={[styles.statsContainer, !showStats && { opacity: 0 }]}>
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
            </Animated.View>
            
            {/* Exercices */}
            <Animated.View style={{ opacity: exercisesOpacity }}>
              {showExercises && workout.exercises.map((exercise, index) => (
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
                        .map((set, originalIndex) => 
                          set.completed ? (
                            <View 
                              key={`${exercise.id}-set-${originalIndex}`} 
                              style={styles.setContainer}
                            >
                              {/* Container de poids */}
                              <View style={styles.dataContainer}>
                                <Text style={styles.dataText}>{set.weight} kg</Text>
                              </View>
                              
                              {/* Container de répétitions */}
                              <View style={styles.dataContainer}>
                                <Text style={styles.dataText}>{set.reps} reps</Text>
                              </View>
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
            </Animated.View>
            
            <View style={styles.bottomPadding} />
          </ScrollView>
          
          {/* Bouton de fin */}
          <Animated.View style={[
            styles.finishButtonContainer,
            { opacity: buttonOpacity }
          ]}>
            <TouchableOpacity 
              style={styles.finishButton}
              onPress={handleViewInJournal}
              activeOpacity={0.8}
            >
              <Text style={styles.finishButtonText}>View in Journal</Text>
              <Ionicons name="arrow-forward" size={20} color="#000000" />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
};

const { width } = Dimensions.get('window');
const stickerSize = width * 0.25;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  titleContainer: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: 0,
  },
  congratsText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  headerSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    maxWidth: '80%',
  },
  currentStickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  currentStickerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  currentStickerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 8,
  },
  tapToContinueText: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  stickersContentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 48,
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 112, // Hauteur minimale pour éviter le redimensionnement
  },
  stickerContentCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  stickerContentText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 10,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 0,
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 16,
    marginBottom: 16,
    display: 'none',
  },
  exerciseContainer: {
    marginHorizontal: 16,
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
  bottomPadding: {
    height: 100,
  },
  finishButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  finishButton: {
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
  finishButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
}); 