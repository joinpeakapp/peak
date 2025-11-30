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
import { Workout } from '../../types/workout';

interface WorkoutRepositionModalProps {
  visible: boolean;
  onClose: () => void;
  workouts: Workout[];
  selectedWorkout: Workout;
  onPositionSelected: (newPosition: number) => void;
}

const ANIMATION_DURATION = 300;

export const WorkoutRepositionModal: React.FC<WorkoutRepositionModalProps> = ({
  visible,
  onClose,
  workouts,
  selectedWorkout,
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

  // Trouver l'index actuel du workout sélectionné
  // Protection contre selectedWorkout null/undefined ou sans id valide
  const currentIndex = selectedWorkout?.id ? workouts.findIndex(w => w.id === selectedWorkout.id) : -1;

  useEffect(() => {
    if (visible) {
      // Vérifier que selectedWorkout est défini avant de continuer
      if (!selectedWorkout?.id) {
        return;
      }
      setHasBeenVisible(true);
      setModalVisible(true);
      // Réinitialiser les animations avec la hauteur actuelle
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
  // Cette fonction calcule qui sera AVANT le workout APRÈS le déplacement
  const getPositionDescription = (newPosition: number): string => {
    if (newPosition === currentIndex) {
      return 'Current place';
    }
    if (newPosition === 0) {
      return 'First workout';
    }
    if (newPosition === workouts.length - 1) {
      return 'Last workout';
    }
    
    // Pour calculer qui sera avant le workout APRÈS le déplacement :
    // 1. On crée une liste sans le workout à déplacer
    // 2. Dans la liste finale, le workout sera à newPosition
    // 3. Le workout avant sera donc à newPosition - 1 dans la liste finale
    // 4. On doit trouver quel workout de la liste actuelle sera à cette position
    
    // Créer la liste sans le workout sélectionné
    const workoutsWithoutSelected = workouts.filter(w => w.id !== selectedWorkout.id);
    
    // Dans la liste finale, le workout avant sera à l'index newPosition - 1
    // Dans la liste sans le workout sélectionné, cet index correspond à :
    let workoutBeforeIndexInFinalList = newPosition - 1;
    
    // Trouver le workout qui sera à cette position dans la liste finale
    // Si newPosition > currentIndex, on a retiré un élément avant, donc l'index reste le même
    // Si newPosition < currentIndex, on a retiré un élément après, donc l'index reste le même aussi
    // En fait, dans la liste sans l'élément, l'index newPosition - 1 correspond toujours à l'index newPosition - 1
    // sauf si newPosition - 1 >= currentIndex, auquel cas il faut ajuster
    
    let workoutBeforeIndex: number;
    if (workoutBeforeIndexInFinalList >= currentIndex) {
      // L'index dans la liste finale correspond à l'index + 1 dans la liste actuelle
      // car on a retiré un élément avant cette position
      workoutBeforeIndex = workoutBeforeIndexInFinalList + 1;
    } else {
      // L'index reste le même car on retire un élément après
      workoutBeforeIndex = workoutBeforeIndexInFinalList;
    }
    
    // Récupérer le workout qui sera avant dans la liste finale
    const workoutBefore = workouts[workoutBeforeIndex];
    return `After "${workoutBefore?.name || 'workout'}"`;
  };

  // Créer une liste simple de toutes les positions possibles avec descriptions
  const positionOptions = Array.from({ length: workouts.length }, (_, i) => ({
    position: i,
    displayPosition: i + 1,
    isCurrentPosition: i === currentIndex,
    description: getPositionDescription(i),
  }));

  // Debug: vérifier que les données sont correctes
  useEffect(() => {
    if (visible) {
      console.log('[WorkoutRepositionModal] Workouts:', workouts.length);
      console.log('[WorkoutRepositionModal] Selected workout:', selectedWorkout?.name);
      console.log('[WorkoutRepositionModal] Position options:', positionOptions.length);
    }
  }, [visible, workouts.length, selectedWorkout, positionOptions.length]);

  // Ne pas rendre si jamais visible et pas visible actuellement
  // Cela évite les problèmes de timing sur TestFlight
  if (!hasBeenVisible && !visible) {
    return null;
  }

  // Si pas de workouts ou de workout sélectionné valide, ne rien afficher
  if (!workouts || workouts.length === 0 || !selectedWorkout?.id) {
    return null;
  }

  return (
    <Modal
      transparent
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
            <Text style={styles.title}>Reposition Workout</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Choose the position for "{selectedWorkout.name}"
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

