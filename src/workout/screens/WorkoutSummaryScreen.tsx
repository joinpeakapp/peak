import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompletedWorkout } from '../../types/workout';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  useNavigation, 
  useRoute, 
  NavigationProp, 
  CommonActions, 
  RouteProp 
} from '@react-navigation/native';
import { RootStackParamList, SummaryStackParamList } from '../../types/navigation';
import { useStreak } from '../contexts/StreakContext';

interface StepInfo {
  title: string;
  subtitle: string;
}

type WorkoutSummaryRouteProp = RouteProp<SummaryStackParamList, 'WorkoutSummary'>;

export const WorkoutSummaryScreen: React.FC = () => {
  // Navigation
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<WorkoutSummaryRouteProp>();
  
  // Récupérer le workout et les paramètres depuis la route
  const { workout } = route.params;
  
  // Récupérer la streak actuelle
  const { getWorkoutStreak } = useStreak();
  const [currentStreak, setCurrentStreak] = useState<number>(workout.streakData?.current || 0);
  
  // Récupérer la streak actuelle si elle n'est pas dans l'objet workout
  useEffect(() => {
    if (!workout.streakData) {
      const loadCurrentStreak = async () => {
        try {
          const streakData = await getWorkoutStreak(workout.workoutId);
          if (streakData) {
            setCurrentStreak(streakData.current || 1);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération de la streak :", error);
        }
      };
      
      loadCurrentStreak();
    }
  }, []);
  
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
  const [isSkipButtonDisabled, setIsSkipButtonDisabled] = useState(false);
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const exercisesOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  
  // Animation pour l'opacité du gradient
  const gradientOpacity = useRef(new Animated.Value(0)).current;

  // Animations pour les stickers
  const stickerAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  // Animations pour l'offset vertical des stickers
  const stickerOffsetYAnims = [
    useRef(new Animated.Value(30)).current,
    useRef(new Animated.Value(30)).current,
    useRef(new Animated.Value(30)).current,
  ];
  // Animations pour l'opacité des stickers
  const stickerOpacityAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  // Animations pour l'opacité des textes des stickers
  const stickerTextOpacityAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  // Refs pour stocker les timeouts en cours
  const currentTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Fonction pour nettoyer tous les timeouts en cours
  const clearAllTimeouts = () => {
    currentTimeouts.current.forEach(timeout => clearTimeout(timeout));
    currentTimeouts.current = [];
  };

  // Fonction pour ajouter un timeout à la liste
  const addTimeout = (callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
      // Retirer ce timeout de la liste quand il s'exécute
      currentTimeouts.current = currentTimeouts.current.filter(t => t !== timeout);
      callback();
    }, delay);
    currentTimeouts.current.push(timeout);
    return timeout;
  };

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
    "Streak": {
      title: `${currentStreak > 0 ? currentStreak : 1} Day Streak!`,
      subtitle: "You're building consistency - keep that momentum going!"
    },
    "Complete": {
      title: "Workout Complete",
      subtitle: "Great job on completing your workout!"
    }
  };

  // Animation finale pour afficher le contenu
  const animateFinalContent = () => {
    setAnimationComplete(true);
    
    // Animer l'apparition du contenu stats
    Animated.timing(statsOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setShowStats(true);
      
      // Animer l'apparition des exercices après les stats
      addTimeout(() => {
        Animated.timing(exercisesOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          setShowExercises(true);
          
          // Animer l'apparition du bouton après les exercices
          addTimeout(() => {
            Animated.timing(buttonOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }, 150);
        });
      }, 150);
    });
  };

  // Déterminer quels stickers afficher
  const getStickers = () => {
    const stickers = [];
    
    // Vérifier si le temps total est supérieur à 45 minutes
    if (workout.duration > 45 * 60) {
      stickers.push({
        name: "Endurance",
        icon: "fitness-outline" as any,
        color: "#3498db"
      });
    }
    
    // Vérifier si au moins 5 exercices différents ont été effectués
    if (workout.exercises.length >= 5) {
      stickers.push({
        name: "Variety",
        icon: "grid-outline" as any,
        color: "#9b59b6"
      });
    }
    
    // Vérifier les records personnels
    const prExercises = workout.exercises.filter(ex => ex.personalRecord);
    if (prExercises.length > 0) {
      stickers.push({
        name: "New Record",
        icon: "trophy-outline" as any,
        color: "#f39c12"
      });
    }
    
    // Afficher le badge de streak même pour la première séance
    // La valeur affichée sera au moins 1
    stickers.push({
      name: "Streak",
      icon: "flame-outline" as any,
      color: "#FF8A24"
    });
    
    // Si aucun autre sticker n'est présent (ce qui n'arrivera plus puisque Streak est toujours ajouté)
    // mais on garde ce code par sécurité
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
    
    // Une fois l'animation terminée, utiliser la couleur du dernier sticker
    return stickers.length > 0 ? stickers[stickers.length - 1].color : "#2ecc71";
  };
  
  // Info de l'étape courante
  const currentStepInfo = getCurrentStepInfo();

  // Fonction pour passer à l'animation suivante
  const handleSkipAnimation = useCallback(() => {
    // Vérifier si le bouton est déjà désactivé (protection contre les clics multiples)
    if (isSkipButtonDisabled) return;

    // Vérifier qu'on n'est pas en animation finale et qu'il reste au moins un sticker après le courant
    if (animationComplete || currentStickerIndex >= stickers.length - 1) return;

    // Vérifier qu'on a un sticker courant valide
    if (currentStickerIndex < 0) return;

    // Désactiver immédiatement le bouton pour empêcher les clics multiples
    setIsSkipButtonDisabled(true);

    // Nettoyer tous les timeouts en cours pour éviter qu'ils affectent le sticker suivant
    clearAllTimeouts();

    // Arrêter toutes les animations en cours pour le sticker actuel
    stickerAnims[currentStickerIndex].stopAnimation();
    stickerOffsetYAnims[currentStickerIndex].stopAnimation();
    stickerOpacityAnims[currentStickerIndex].stopAnimation();
    stickerTextOpacityAnims[currentStickerIndex].stopAnimation();
    gradientOpacity.stopAnimation();
    
    // Passer au sticker suivant (un seul à la fois)
    setCurrentStickerIndex(prev => prev + 1);

    // Réactiver le bouton après un délai plus long pour éviter les clics rapides
    setTimeout(() => {
      setIsSkipButtonDisabled(false);
    }, 300); // Augmenté de 200ms à 300ms pour plus de sécurité
  }, [currentStickerIndex, stickers.length, animationComplete, isSkipButtonDisabled, clearAllTimeouts]);

  // Memoize la fonction de navigation pour éviter des re-rendus inutiles
  const handleViewInJournal = useCallback(() => {
    // Naviguer vers l'écran de prise de photo
    navigation.navigate('SummaryFlow', {
      screen: 'WorkoutPhoto',
      params: {
        workout: workout,
        fromSummary: true
      }
    });
  }, [navigation, workout]);

  // Memoize la fonction de retour pour éviter des re-rendus inutiles
  const handleBackToWorkouts = useCallback(() => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }]
      })
    );
  }, [navigation]);

  // Memoize le component pour les stickers pour éviter des re-rendus inutiles
  const StickersComponent = useMemo(() => {
    return (
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
    );
  }, [stickers, currentStickerIndex, stickerAnims]);

  // Animation d'entrée
  useEffect(() => {
    // Animer l'apparition progressive du titre et du container vide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Commencer la séquence d'animation des stickers après 1 seconde
      addTimeout(() => {
        setShowInitialTitle(false);
        if (stickers.length > 0) {
          setCurrentStickerIndex(0);
        } else {
          animateFinalContent();
        }
      }, 1000);
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
    // Animation plus naturelle et moins robotique
    
    // Réinitialiser l'opacité du gradient pour chaque nouveau sticker
    gradientOpacity.setValue(0);
    
    // 1. Animation du sticker avec entrée par le bas et opacité
    Animated.parallel([
      // Opacité du sticker
      Animated.timing(stickerOpacityAnims[currentStickerIndex], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Mouvement vertical du sticker (offset)
      Animated.timing(stickerOffsetYAnims[currentStickerIndex], {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      // Animation du gradient en parallèle
      Animated.timing(gradientOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      })
    ]).start(() => {
      // 2. Animation du texte du sticker après que le sticker soit visible
      addTimeout(() => {
        Animated.timing(stickerTextOpacityAnims[currentStickerIndex], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Attendre un moment puis passer au sticker suivant
          addTimeout(() => {
            if (currentStickerIndex < stickers.length - 1) {
              setCurrentStickerIndex(prev => prev + 1);
            } else if (currentStickerIndex === stickers.length - 1) {
              // Si c'est le dernier sticker, passer à l'animation finale
              animateFinalContent();
            }
          }, 1200);
        });
      }, 150);
    });
  };

  const gradientAnimatedOpacityHex = gradientOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ['00', '40'],
  });

  const gradientAnimatedOpacity = gradientOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.25],
  });

  // Nettoyer les timeouts au démontage du composant
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Fond de base noir */}
      <View style={styles.baseBackground} />
      
      {/* Gradient de fond avec opacité animée */}
      {!animationComplete ? (
        // Gradient animé pendant la phase d'obtention des stickers
        <Animated.View 
          style={[
            styles.gradient,
            { opacity: gradientOpacity }
          ]}
        >
          <LinearGradient
            colors={[`${getGradientColor()}59`, 'rgba(10, 10, 12, 0.35)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
      ) : (
        // Gradient fixe une fois l'animation terminée
        <LinearGradient
          colors={[`${getGradientColor()}40`, 'rgba(10, 10, 12, 0.25)']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      )}
      
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
              styles.completionTitleContainer,
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
          
          {/* Conteneur pour afficher le sticker en cours d'obtention */}
          {!animationComplete && currentStickerIndex >= 0 && currentStickerIndex < stickers.length && (
            <View style={styles.currentStickerContainer}>
              <Animated.View 
                style={[
                  styles.currentStickerCircle, 
                  { 
                    backgroundColor: stickers[currentStickerIndex].color,
                    opacity: stickerOpacityAnims[currentStickerIndex],
                    transform: [
                      { translateY: stickerOffsetYAnims[currentStickerIndex] }
                    ]
                  }
                ]}
              >
                <Ionicons 
                  name={stickers[currentStickerIndex].icon} 
                  size={48} 
                  color="#FFFFFF" 
                />
              </Animated.View>
              <Animated.Text 
                style={[
                  styles.currentStickerText,
                  { opacity: stickerTextOpacityAnims[currentStickerIndex] }
                ]}
              >
                {stickers[currentStickerIndex].name}
              </Animated.Text>
            </View>
          )}
          
          {/* Container pour les stickers - n'afficher qu'après l'animation complète */}
          {animationComplete && StickersComponent}
          
          {/* Stats */}
          <Animated.View style={{ opacity: statsOpacity }}>
            <View style={[styles.statsContainer, !showStats && { opacity: 0 }]}>
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
          </Animated.View>
          
          {/* Exercices */}
          <Animated.View style={{ opacity: exercisesOpacity }}>
            {showExercises && workout.exercises
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
            <Text style={styles.finishButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#000000" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
      
      {/* Bouton "Tap to skip" en bas de l'écran - visible uniquement pendant l'animation et pas sur le dernier sticker */}
      {!animationComplete && currentStickerIndex < stickers.length - 1 && (
        <TouchableOpacity
          style={[
            styles.skipButton,
            isSkipButtonDisabled && styles.skipButtonDisabled
          ]}
          onPress={handleSkipAnimation}
          activeOpacity={0.7}
          disabled={isSkipButtonDisabled}
        >
          <View style={styles.skipButtonContainer}>
            <Text style={[
              styles.skipButtonText,
              isSkipButtonDisabled && styles.skipButtonTextDisabled
            ]}>Tap to skip</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');
const stickerSize = width * 0.25;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  baseBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0D0D0F',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  completionTitleContainer: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
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
    bottom: 64,
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
    minHeight: 112,
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
    marginBottom: 16,
    marginHorizontal: 16,
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
  skipButton: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  skipButtonContainer: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  skipButtonDisabled: {
    opacity: 0.3,
  },
  skipButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
}); 