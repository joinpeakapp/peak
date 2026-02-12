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
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '../../types/workout';
import { Picker } from '@react-native-picker/picker';
import { SettingsService } from '../../services/settingsService';

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
  /** Callback function when tracking type is changed */
  onTrackingTypeChange?: (trackingType: 'trackedOnSets' | 'trackedOnTime') => void;
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
  onTrackingTypeChange,
  openTimerDirectly = false,
}) => {
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  // État pour gérer le temps de repos (en minutes seulement, comme dans SettingsModal)
  const [selectedMinutes, setSelectedMinutes] = useState(3);
  // État pour savoir si on est en mode configuration de timer
  const [timerMode, setTimerMode] = useState(openTimerDirectly);
  // État pour savoir si on est en mode sélection du type de tracking
  const [trackingTypeMode, setTrackingTypeMode] = useState(false);
  // État pour suivre si le clavier est visible
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // Mettre à jour le temps de repos quand l'exercice change
  useEffect(() => {
    const loadRestTime = async () => {
      if (exercise && exercise.restTimeSeconds) {
        // Si l'exercice a un rest timer personnalisé, l'utiliser
        const minutes = Math.floor(exercise.restTimeSeconds / 60);
        setSelectedMinutes(minutes);
      } else {
        // Sinon, utiliser le rest timer par défaut depuis les settings
        const defaultRestTime = await SettingsService.getDefaultRestTimer();
        const minutes = Math.floor(defaultRestTime / 60);
        setSelectedMinutes(minutes);
      }
    };
    
    if (visible && exercise) {
      loadRestTime();
    }
    
    // Mettre à jour le mode timer en fonction de openTimerDirectly
    setTimerMode(openTimerDirectly);
  }, [exercise, visible, openTimerDirectly]);

  // Effet pour réinitialiser le mode timer quand la modale s'ouvre
  useEffect(() => {
    if (visible) {
      setTimerMode(openTimerDirectly);
    }
  }, [visible, openTimerDirectly]);

  // Gérer le changement de visibilité avec animations améliorées
  useEffect(() => {
    if (visible) {
      // Animation d'entrée
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }),
      ]).start();
    } else {
      // Animation de sortie
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
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
      if (visible) {
        if (isKeyboardVisible) {
          Keyboard.dismiss();
          return true;
        }
        if (trackingTypeMode) {
          // Si on est en mode sélection du type de tracking, revenir au menu principal
          setTrackingTypeMode(false);
        } else if (timerMode) {
          // Si on est en mode timer, revenir au menu principal
          // Si on a ouvert directement en mode timer, fermer la modale
          if (openTimerDirectly) {
            handleClose();
          } else {
            setTimerMode(false);
          }
        } else {
          // Sinon, fermer la modale
          handleClose();
        }
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, timerMode, openTimerDirectly, isKeyboardVisible]);

  // Fonction pour mettre à jour le temps de repos
  const handleRestTimeUpdate = () => {
    if (onRestTimeUpdate) {
      // Convertir les minutes en secondes
      const totalSeconds = selectedMinutes * 60;
      onRestTimeUpdate(totalSeconds);
    }
    handleClose();
  };

  // Fonction pour fermer la modale
  const handleClose = () => {
    // Fermer le clavier d'abord si visible
    if (isKeyboardVisible) {
      Keyboard.dismiss();
    }
    onClose();
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

  // Permettre de basculer en mode configuration de timer
  const handleShowTimerMode = () => {
    setTimerMode(true);
  };

  const handleShowTrackingTypeMode = () => {
    setTrackingTypeMode(true);
  };

  const handleTrackingTypeSelect = (trackingType: 'trackedOnSets' | 'trackedOnTime') => {
    if (onTrackingTypeChange) {
      onTrackingTypeChange(trackingType);
    }
    setTrackingTypeMode(false);
    handleClose();
  };

  // Revenir au menu principal
  const handleBackToMenu = () => {
    // Fermer le clavier d'abord si visible
    if (isKeyboardVisible) {
      Keyboard.dismiss();
    }
    
    // Si on a ouvert directement en mode timer, fermer la modale
    if (openTimerDirectly) {
      handleClose();
    } else {
      setTimerMode(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[styles.backdrop, { opacity: fadeAnim }]}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={onClose} 
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingContainer}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {trackingTypeMode ? (
              // Mode sélection du type de tracking
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                  style={styles.scrollContent}
                  contentContainerStyle={styles.scrollContentContainer}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.timerHeader}>
                    <Text style={styles.timerTitle}>Tracking Type</Text>
                    <TouchableOpacity 
                      style={styles.backButton}
                      onPress={() => setTrackingTypeMode(false)}
                    >
                      <Ionicons name="arrow-down" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.timerSubtitle}>
                    Choose how you want to track {exercise?.name}.
                  </Text>
                  
                  <View style={styles.trackingTypeOptions}>
                    <TouchableOpacity
                      style={[
                        styles.trackingTypeOptionCard,
                        exercise?.tracking === 'trackedOnSets' && styles.trackingTypeOptionCardActive
                      ]}
                      onPress={() => handleTrackingTypeSelect('trackedOnSets')}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name="repeat-outline" 
                        size={32} 
                        color={exercise?.tracking === 'trackedOnSets' ? '#0D0D0F' : '#FFFFFF'} 
                      />
                      <Text style={[
                        styles.trackingTypeOptionText,
                        exercise?.tracking === 'trackedOnSets' && styles.trackingTypeOptionTextActive
                      ]}>
                        Track by sets
                      </Text>
                      <Text style={[
                        styles.trackingTypeOptionDescription,
                        exercise?.tracking === 'trackedOnSets' && styles.trackingTypeOptionDescriptionActive
                      ]}>
                        Weight and reps per set
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.trackingTypeOptionCard,
                        exercise?.tracking === 'trackedOnTime' && styles.trackingTypeOptionCardActive
                      ]}
                      onPress={() => handleTrackingTypeSelect('trackedOnTime')}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name="time-outline" 
                        size={32} 
                        color={exercise?.tracking === 'trackedOnTime' ? '#0D0D0F' : '#FFFFFF'} 
                      />
                      <Text style={[
                        styles.trackingTypeOptionText,
                        exercise?.tracking === 'trackedOnTime' && styles.trackingTypeOptionTextActive
                      ]}>
                        Track by time
                      </Text>
                      <Text style={[
                        styles.trackingTypeOptionDescription,
                        exercise?.tracking === 'trackedOnTime' && styles.trackingTypeOptionDescriptionActive
                      ]}>
                        Duration with timer
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </TouchableWithoutFeedback>
            ) : timerMode ? (
              // Mode configuration du timer de repos
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                  style={styles.scrollContent}
                  contentContainerStyle={styles.scrollContentContainer}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.timerHeader}>
                    <Text style={styles.timerTitle}>Rest Timer</Text>
                    <TouchableOpacity 
                      style={styles.backButton}
                      onPress={handleBackToMenu}
                    >
                      <Ionicons name="arrow-down" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.timerSubtitle}>
                    Set a specific rest time between sets for {exercise?.name}.
                  </Text>
                  
                  {/* Picker pour sélectionner les minutes - même format que SettingsModal */}
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={selectedMinutes}
                      onValueChange={(itemValue) => setSelectedMinutes(itemValue)}
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((min) => (
                        <Picker.Item
                          key={min}
                          label={`${min} min`}
                          value={min}
                        />
                      ))}
                    </Picker>
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
                
                <View style={styles.content}>
                  <Text style={styles.title}>Exercise settings</Text>
                  
                  <View style={styles.optionsContainer}>
                    <TouchableOpacity
                      style={[styles.option, styles.replaceOption]}
                      onPress={handleReplacePress}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="swap-horizontal-outline" size={24} color="#FFFFFF" />
                      <Text style={styles.optionText}>Replace exercise</Text>
                    </TouchableOpacity>
                    
                    {onRestTimeUpdate && exercise?.tracking !== 'trackedOnTime' && (
                      <TouchableOpacity
                        style={[styles.option, styles.timerOption]}
                        onPress={handleShowTimerMode}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="timer-outline" size={24} color="#FFFFFF" />
                        <Text style={styles.optionText}>Configure rest timer</Text>
                      </TouchableOpacity>
                    )}
                    
                    {onTrackingTypeChange && (
                      <TouchableOpacity
                        style={[styles.option, styles.trackingTypeOption]}
                        onPress={handleShowTrackingTypeMode}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="swap-horizontal" size={24} color="#FFFFFF" />
                        <Text style={styles.optionText}>Change tracking type</Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      style={[styles.option, styles.deleteOption]}
                      onPress={handleDeletePress}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
                      <Text style={styles.optionText}>Delete exercise</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
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
  keyboardAvoidingContainer: {
    width: '100%',
  },
  modalContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area
    minHeight: 320,
  },
  scrollContent: {
    maxHeight: '100%',
  },
  scrollContentContainer: {
    paddingBottom: 16,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 32,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  replaceOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  timerOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  deleteOption: {
    backgroundColor: '#FF3B30',
  },
  trackingTypeOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  // Styles pour le mode timer
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  timerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  timerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  pickerWrapper: {
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  picker: {
    width: '100%',
    color: '#FFFFFF',
  },
  pickerItem: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    height: 100,
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 24,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  // Styles pour le mode sélection du type de tracking
  trackingTypeOptions: {
    gap: 16,
    marginTop: 24,
    paddingHorizontal: 24,
  },
  trackingTypeOptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  trackingTypeOptionCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  trackingTypeOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
  },
  trackingTypeOptionTextActive: {
    color: '#0D0D0F',
  },
  trackingTypeOptionDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  trackingTypeOptionDescriptionActive: {
    color: 'rgba(13, 13, 15, 0.6)',
  },
}); 