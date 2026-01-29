import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrackingSet } from '../contexts/ActiveWorkoutContext';
import { PRBadge } from './PRBadge';

interface SetRowProps {
  set: TrackingSet;
  index: number;
  animation: Animated.Value;
  onToggle: (index: number) => void;
  onWeightChange: (index: number, value: string) => void;
  onRepsChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  prData?: {
    weightPR?: { isNew: boolean; weight: number } | null;
    repsPR?: { isNew: boolean; weight: number; reps: number; previousReps: number } | null;
    prBadgeAnim: Animated.Value;
  };
}

export const SetRow: React.FC<SetRowProps> = ({
  set,
  index,
  animation,
  onToggle,
  onWeightChange,
  onRepsChange,
  onRemove,
  prData
}) => {
  // Couleurs des badges pour les appliquer aux containers
  const weightPRColor = '#9B93E4'; // Violet pour les PR de poids
  const repsPRColor = '#3BDF32'; // Vert pour les PR de reps
  
  // Animations pour le flash des badges PR
  const weightFlashAnim = useRef(new Animated.Value(0)).current;
  const repsFlashAnim = useRef(new Animated.Value(0)).current;
  
  // Garde un suivi si les PRs ont déjà été vus
  const hasSeenWeightPR = useRef(false);
  const hasSeenRepsPR = useRef(false);

  // Effet pour animer lors de la détection d'un PR (seulement une fois)
  useEffect(() => {
    // Si prData devient null/undefined, réinitialiser les animations et les flags
    if (!prData) {
      hasSeenWeightPR.current = false;
      hasSeenRepsPR.current = false;
      weightFlashAnim.setValue(0);
      repsFlashAnim.setValue(0);
      return;
    }
    
    // Pour les PR de poids
    if (prData.weightPR && !hasSeenWeightPR.current) {
      hasSeenWeightPR.current = true;
      
      // Animation flash
      Animated.sequence([
        Animated.timing(weightFlashAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(weightFlashAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(weightFlashAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(weightFlashAnim, {
          toValue: 0.1, // Gardons une opacité de 10%
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else if (!prData.weightPR && hasSeenWeightPR.current) {
      // Si le PR de poids disparaît, réinitialiser
      hasSeenWeightPR.current = false;
      weightFlashAnim.setValue(0);
    }
    
    // Pour les PR de reps
    if (prData.repsPR && !hasSeenRepsPR.current) {
      hasSeenRepsPR.current = true;
      
      // Animation flash
      Animated.sequence([
        Animated.timing(repsFlashAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(repsFlashAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(repsFlashAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(repsFlashAnim, {
          toValue: 0.1, // Gardons une opacité de 10%
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else if (!prData.repsPR && hasSeenRepsPR.current) {
      // Si le PR de reps disparaît, réinitialiser
      hasSeenRepsPR.current = false;
      repsFlashAnim.setValue(0);
    }
  }, [prData, weightFlashAnim, repsFlashAnim]);

  return (
    <Animated.View 
      style={[
        styles.setRow,
        { transform: [{ scale: animation || 1 }] }
      ]}
    >
      <TouchableOpacity 
        style={[
          styles.trackingCheckbox,
          set.completed && styles.trackingCheckboxCompleted,
          styles.setTrackingCheckbox
        ]}
        onPress={() => onToggle(index)}
      >
        {set.completed ? (
          <Ionicons name="checkmark" size={24} color="#000000" />
        ) : (
          <View style={[styles.progressFill, { height: '0%' }]} />
        )}
      </TouchableOpacity>
      
      <View style={styles.setInputsContainer}>
        {/* Input pour le poids avec PR de poids potentiel */}
        <View style={styles.inputWrapper}>
          <Animated.View 
            style={[
              styles.prHighlight,
              {
                borderColor: weightPRColor,
                backgroundColor: weightPRColor,
                opacity: prData?.weightPR ? weightFlashAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 0.3], // Opacité entre 10% et 30%
                }) : 0,
              }
            ]}
          />
          <TextInput
            style={[
              styles.setInput,
              set.completed && styles.completedInput,
              prData?.weightPR && prData.weightPR !== null && {
                borderColor: weightPRColor,
              }
            ]}
            keyboardType="numeric"
            placeholder={set.weightPlaceholder || "0"}
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            value={set.weight}
            onChangeText={(value) => onWeightChange(index, value)}
            editable={!set.completed}
          />
          <Text style={styles.inputSuffix}>kg</Text>
          
          {/* Badge de PR de poids en superposition */}
          {prData?.weightPR && prData.weightPR !== null && (
            <View style={styles.prBadgeOverlay}>
              <PRBadge 
                type="weight"
                value={prData.weightPR.weight} 
              />
            </View>
          )}
        </View>
        
        {/* Input pour les reps avec PR de reps potentiel */}
        <View style={styles.inputWrapper}>
          <Animated.View 
            style={[
              styles.prHighlight,
              {
                borderColor: repsPRColor,
                backgroundColor: repsPRColor,
                opacity: prData?.repsPR ? repsFlashAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 0.3], // Opacité entre 10% et 30%
                }) : 0,
              }
            ]}
          />
          <TextInput
            style={[
              styles.setInput,
              set.completed && styles.completedInput,
              prData?.repsPR && prData.repsPR !== null && {
                borderColor: repsPRColor,
              }
            ]}
            keyboardType="numeric"
            placeholder={set.repsPlaceholder || "0"}
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            value={set.reps}
            onChangeText={(value) => onRepsChange(index, value)}
            editable={!set.completed}
          />
          <Text style={styles.inputSuffix}>reps</Text>
          
          {/* Badge de PR de reps en superposition */}
          {prData?.repsPR && prData.repsPR !== null && (
            <View style={styles.prBadgeOverlay}>
              <PRBadge 
                type="reps"
                value={prData.repsPR.reps}
                previousValue={prData.repsPR.previousReps}
              />
            </View>
          )}
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.setSettingsButton}
        onPress={() => onRemove(index)}
      >
        <Ionicons name="close" size={24} color="rgba(255, 255, 255, 0.6)" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'visible',
  },
  trackingCheckbox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  setTrackingCheckbox: {
    marginLeft: 0,
  },
  trackingCheckboxCompleted: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  setInputsContainer: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: 16,
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 16,
    overflow: 'visible',
  },
  inputWrapper: {
    position: 'relative',
    height: 48,
    minWidth: 70,
    overflow: 'visible',
  },
  setInput: {
    height: 48,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
    color: '#FFFFFF',
    textAlign: 'right',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingRight: 52,
    minWidth: 70,
    zIndex: 1, // Pour être au-dessus du highlight
  },
  completedInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  inputSuffix: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 12,
    textAlignVertical: 'center',
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
    height: '100%',
    lineHeight: 48,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2, // Pour être au-dessus du highlight et de l'input
  },
  setSettingsButton: {
    padding: 8,
    marginLeft: 16,
  },
  prBadgeOverlay: {
    position: 'absolute',
    top: -10,
    right: -5,
    zIndex: 9999,
    elevation: 20,
  },
  prHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 100,
    borderWidth: 1,
    zIndex: 0, // Sous l'input
  },
}); 