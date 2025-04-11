import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  BackHandler,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '../../types/workout';

interface ExerciseSettingsModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback function when the modal is closed */
  onClose: () => void;
  /** Callback function when replace is pressed */
  onReplace: () => void;
  /** Callback function when delete is pressed */
  onDelete: () => void;
  /** Current exercise data */
  exercise?: Exercise;
  /** Callback function when rest time is updated */
  onRestTimeUpdate?: (seconds: number) => void;
  /** Whether to open directly in timer mode */
  openTimerDirectly?: boolean;
}

const { height } = Dimensions.get('window');
const ANIMATION_DURATION = 300;

/**
 * A modal component that appears from the bottom of the screen
 * to display exercise settings options.
 * 
 * @component
 * @example
 * ```tsx
 * <ExerciseSettingsModal
 *   visible={true}
 *   onClose={() => setVisible(false)}
 *   onReplace={() => handleReplace()}
 *   onDelete={() => handleDelete()}
 *   exercise={selectedExercise}
 *   onRestTimeUpdate={(seconds) => handleRestTimeUpdate(seconds)}
 *   openTimerDirectly={false}
 * />
 * ```
 */
export const ExerciseSettingsModal: React.FC<ExerciseSettingsModalProps> = ({
  visible,
  onClose,
  onReplace,
  onDelete,
  exercise,
  onRestTimeUpdate,
  openTimerDirectly = false,
}) => {
  const [modalVisible, setModalVisible] = useState(visible);
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  // État pour gérer le temps de repos (par défaut 3 minutes = 180 secondes)
  const [restTimeMinutes, setRestTimeMinutes] = useState('3');
  const [restTimeSeconds, setRestTimeSeconds] = useState('00');
  // État pour savoir si on est en mode configuration de timer
  const [timerMode, setTimerMode] = useState(openTimerDirectly);
  // État pour suivre si le clavier est visible
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Mettre à jour les champs de temps de repos quand l'exercice change
  useEffect(() => {
    if (exercise && exercise.restTimeSeconds) {
      const minutes = Math.floor(exercise.restTimeSeconds / 60);
      const seconds = exercise.restTimeSeconds % 60;
      setRestTimeMinutes(minutes.toString());
      setRestTimeSeconds(seconds.toString().padStart(2, '0'));
    } else {
      // Valeur par défaut: 3 minutes
      setRestTimeMinutes('3');
      setRestTimeSeconds('00');
    }
    
    // Mettre à jour le mode timer en fonction de openTimerDirectly
    setTimerMode(openTimerDirectly);
  }, [exercise, visible, openTimerDirectly]);

  // Gérer le changement de visibilité
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
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
          toValue: height,
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
      });
    }
  }, [visible]);

  // Détecter l'apparition et la disparition du clavier
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Gérer le bouton retour sur Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (modalVisible) {
        if (isKeyboardVisible) {
          Keyboard.dismiss();
          return true;
        }
        if (timerMode) {
          // Si on est en mode timer, revenir au menu principal
          // Si on a ouvert directement en mode timer, fermer la modale
          if (openTimerDirectly) {
            closeModal();
          } else {
            setTimerMode(false);
          }
        } else {
          // Sinon, fermer la modale
          closeModal();
        }
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [modalVisible, timerMode, openTimerDirectly, isKeyboardVisible]);

  // Fonction pour mettre à jour le temps de repos
  const handleRestTimeUpdate = () => {
    if (onRestTimeUpdate) {
      // Convertir les minutes et secondes en secondes
      const minutes = parseInt(restTimeMinutes) || 0;
      const seconds = parseInt(restTimeSeconds) || 0;
      const totalSeconds = (minutes * 60) + seconds;
      onRestTimeUpdate(totalSeconds);
    }
    closeModal();
  };

  // Fonction pour fermer la modale avec animation
  const closeModal = () => {
    // Fermer le clavier d'abord si visible
    if (isKeyboardVisible) {
      Keyboard.dismiss();
    }
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
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

  // Fonctions améliorées pour assurer une fermeture correcte avec animation
  const handleReplacePress = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
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
      onReplace();
    });
  };

  const handleDeletePress = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
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
      onDelete();
    });
  };

  // Fonction pour valider les entrées du temps de repos
  const validateTimeInput = (text: string, isMinutes: boolean) => {
    // Accepter uniquement les nombres
    const numericValue = text.replace(/[^0-9]/g, '');
    
    if (isMinutes) {
      // Pas de limite spécifique pour les minutes, mais convertir en entier
      setRestTimeMinutes(numericValue);
    } else {
      // Pour les secondes, limiter à 59
      const value = parseInt(numericValue);
      if (numericValue === '' || isNaN(value)) {
        setRestTimeSeconds('00');
      } else if (value > 59) {
        setRestTimeSeconds('59');
      } else {
        setRestTimeSeconds(value.toString().padStart(2, '0'));
      }
    }
  };

  // Permettre de basculer en mode configuration de timer
  const handleShowTimerMode = () => {
    setTimerMode(true);
  };

  // Revenir au menu principal
  const handleBackToMenu = () => {
    // Fermer le clavier d'abord si visible
    if (isKeyboardVisible) {
      Keyboard.dismiss();
    }
    
    // Si on a ouvert directement en mode timer, fermer la modale
    if (openTimerDirectly) {
      closeModal();
    } else {
      setTimerMode(false);
    }
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={closeModal}
    >
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.overlayTouchable}
              activeOpacity={1}
              onPress={closeModal}
            />
          </Animated.View>
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingContainer}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {timerMode ? (
              // Mode configuration du timer de repos
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                  style={styles.scrollContent}
                  contentContainerStyle={styles.scrollContentContainer}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.timerHeader}>
                    <TouchableOpacity 
                      style={styles.backButton}
                      onPress={handleBackToMenu}
                    >
                      <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.timerTitle}>Rest Timer</Text>
                  </View>
                  
                  <Text style={styles.timerSubtitle}>
                    Set a specific rest time between sets for {exercise?.name}.
                  </Text>
                  
                  <View style={styles.timeInputContainer}>
                    <View style={styles.timeInput}>
                      <TextInput
                        style={styles.timeInputField}
                        value={restTimeMinutes}
                        onChangeText={(text) => validateTimeInput(text, true)}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                      <Text style={styles.timeInputLabel}>min</Text>
                    </View>
                    
                    <Text style={styles.timeSeparator}>:</Text>
                    
                    <View style={styles.timeInput}>
                      <TextInput
                        style={styles.timeInputField}
                        value={restTimeSeconds}
                        onChangeText={(text) => validateTimeInput(text, false)}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                      <Text style={styles.timeInputLabel}>sec</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleRestTimeUpdate}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </ScrollView>
              </TouchableWithoutFeedback>
            ) : (
              // Menu principal
              <>
                <View style={styles.handle} />
                
                <TouchableOpacity
                  style={styles.option}
                  onPress={handleReplacePress}
                >
                  <Ionicons name="swap-horizontal-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.optionText}>Replace exercise</Text>
                </TouchableOpacity>
                
                {onRestTimeUpdate && (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={handleShowTimerMode}
                  >
                    <Ionicons name="timer-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.optionText}>Configure rest timer</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.option, styles.deleteOption]}
                  onPress={handleDeletePress}
                >
                  <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                  <Text style={[styles.optionText, styles.deleteText]}>
                    Delete exercise
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoidingContainer: {
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: 'rgba(36, 37, 38, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
  },
  scrollContent: {
    maxHeight: '100%',
  },
  scrollContentContainer: {
    paddingBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  deleteOption: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  optionText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 16,
  },
  deleteText: {
    color: '#FF3B30',
  },
  // Styles pour le mode timer
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  timerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 32,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInputField: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    color: '#FFFFFF',
    width: 60,
    textAlign: 'center',
  },
  timeInputLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 8,
    fontSize: 16,
  },
  timeSeparator: {
    color: '#FFFFFF',
    fontSize: 24,
    marginHorizontal: 8,
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
}); 