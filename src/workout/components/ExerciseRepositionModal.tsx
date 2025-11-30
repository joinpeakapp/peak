import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  BackHandler,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '../../types/workout';

interface ExerciseRepositionModalProps {
  visible: boolean;
  onClose: () => void;
  exercises: Exercise[];
  selectedExercise: Exercise;
  onPositionSelected: (newPosition: number) => void;
}

const ANIMATION_DURATION = 300;

export const ExerciseRepositionModal: React.FC<ExerciseRepositionModalProps> = ({
  visible,
  onClose,
  exercises,
  selectedExercise,
  onPositionSelected,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const [screenHeight, setScreenHeight] = useState(() => Dimensions.get('window').height);
  // Initialiser slideAnim avec la hauteur actuelle de l'écran
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Mettre à jour la hauteur de l'écran dynamiquement
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenHeight(window.height);
    });
    return () => subscription?.remove();
  }, []);

  // Trouver l'index actuel de l'exercice sélectionné
  // Protection contre selectedExercise null/undefined ou sans id/name valides
  const currentIndex = selectedExercise?.id ? exercises.findIndex(ex => ex.id === selectedExercise.id) : -1;

  useEffect(() => {
    if (visible) {
      // Vérifier que selectedExercise est défini avant de continuer
      if (!selectedExercise?.id) {
        return;
      }
      setHasBeenVisible(true);
      setModalVisible(true);
      
      // Démarrer les animations immédiatement
      slideAnim.setValue(screenHeight);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
        if (!visible) {
          setHasBeenVisible(false);
        }
      });
    }
  }, [visible, screenHeight]);

  // Gérer le bouton retour sur Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (modalVisible) {
        handleClose();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [modalVisible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handlePositionSelect = (position: number) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onPositionSelected(position);
      onClose();
    });
  };

  // Fonction pour obtenir la description d'une position
  // Cette fonction calcule qui sera AVANT l'exercice APRÈS le déplacement
  const getPositionDescription = (newPosition: number): string => {
    // Protection contre selectedExercise null/undefined
    if (!selectedExercise) {
      return '';
    }
    
    if (newPosition === currentIndex) {
      return 'Current place';
    }
    if (newPosition === 0) {
      return 'First exercise';
    }
    if (newPosition === exercises.length - 1) {
      return 'Last exercise';
    }
    
    // Pour calculer qui sera avant l'exercice APRÈS le déplacement :
    // 1. On crée une liste sans l'exercice à déplacer
    // 2. Dans la liste finale, l'exercice sera à newPosition
    // 3. L'exercice avant sera donc à newPosition - 1 dans la liste finale
    // 4. On doit trouver quel exercice de la liste actuelle sera à cette position
    
    // Créer la liste sans l'exercice sélectionné
    const exercisesWithoutSelected = exercises.filter(ex => ex.id !== selectedExercise.id);
    
    // Dans la liste finale, l'exercice avant sera à l'index newPosition - 1
    // Dans la liste sans l'exercice sélectionné, cet index correspond à :
    let exerciseBeforeIndexInFinalList = newPosition - 1;
    
    // Trouver l'exercice qui sera à cette position dans la liste finale
    // Si newPosition > currentIndex, on a retiré un élément avant, donc l'index reste le même
    // Si newPosition < currentIndex, on a retiré un élément après, donc l'index reste le même aussi
    // En fait, dans la liste sans l'élément, l'index newPosition - 1 correspond toujours à l'index newPosition - 1
    // sauf si newPosition - 1 >= currentIndex, auquel cas il faut ajuster
    
    let exerciseBeforeIndex: number;
    if (exerciseBeforeIndexInFinalList >= currentIndex) {
      // L'index dans la liste finale correspond à l'index + 1 dans la liste actuelle
      // car on a retiré un élément avant cette position
      exerciseBeforeIndex = exerciseBeforeIndexInFinalList + 1;
    } else {
      // L'index reste le même car on retire un élément après
      exerciseBeforeIndex = exerciseBeforeIndexInFinalList;
    }
    
    // Récupérer l'exercice qui sera avant dans la liste finale
    const exerciseBefore = exercises[exerciseBeforeIndex];
    return `After "${exerciseBefore?.name || 'exercise'}"`;
  };

  // Créer une liste simple de toutes les positions possibles avec descriptions
  // Protection contre selectedExercise null/undefined
  const positionOptions = selectedExercise && exercises.length > 0 
    ? Array.from({ length: exercises.length }, (_, i) => ({
        position: i,
        displayPosition: i + 1,
        isCurrentPosition: i === currentIndex,
        description: getPositionDescription(i),
      }))
    : [];

  // Debug: vérifier que les données sont correctes
  useEffect(() => {
    if (visible) {
      console.log('[ExerciseRepositionModal] Exercises:', exercises.length);
      console.log('[ExerciseRepositionModal] Selected exercise:', selectedExercise?.name);
      console.log('[ExerciseRepositionModal] Position options:', positionOptions.length);
    }
  }, [visible, exercises.length, selectedExercise, positionOptions.length]);

  // Ne pas rendre si jamais visible et pas visible actuellement
  // Cela évite les problèmes de timing sur TestFlight
  if (!hasBeenVisible && !visible) {
    return null;
  }

  // Si pas d'exercices ou d'exercice sélectionné valide, ne rien afficher
  if (!exercises || exercises.length === 0 || !selectedExercise?.id) {
    return null;
  }

  return (
    <Modal
      transparent={true}
      visible={modalVisible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: fadeAnim }
          ]}
        >
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Reposition Exercise</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Choose the position for "{selectedExercise.name}"
          </Text>

          <View style={styles.scrollContainer}>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
            {/* Afficher une option pour chaque position possible */}
            {positionOptions.length > 0 ? (
              positionOptions.map((option) => (
                <TouchableOpacity
                  key={option.position}
                  style={[
                    styles.positionOption,
                    option.isCurrentPosition && styles.positionOptionCurrent
                  ]}
                  onPress={() => handlePositionSelect(option.position)}
                  activeOpacity={0.7}
                >
                  <View style={styles.positionLeft}>
                    <View style={styles.positionNumber}>
                      <Text style={styles.positionNumberText}>{option.displayPosition}</Text>
                    </View>
                    <Text style={styles.positionDescription}>{option.description}</Text>
                  </View>
                  {option.isCurrentPosition && (
                    <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No positions available</Text>
              </View>
            )}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '55%',
    flexDirection: 'column',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  scrollContainer: {
    flex: 1,
    flexShrink: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 0,
  },
  positionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 12,
    minHeight: 64,
  },
  positionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  positionOptionCurrent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  positionNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionNumberText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  positionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 12,
    flex: 1,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

