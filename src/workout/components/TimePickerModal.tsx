import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  BackHandler,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimePicker } from './TimePicker';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (totalSeconds: number) => void;
}

const { height } = Dimensions.get('window');
const ANIMATION_DURATION = 300;

/**
 * Modal bottom sheet pour sélectionner manuellement une durée
 * Réutilise la même structure que ExerciseSettingsModal
 */
export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const [selectedMinutes, setSelectedMinutes] = useState(0);
  const [selectedSeconds, setSelectedSeconds] = useState(0);

  useEffect(() => {
    if (visible) {
      // Réinitialiser les valeurs quand le modal s'ouvre
      setSelectedMinutes(0);
      setSelectedSeconds(0);
      
      // Animer l'ouverture
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
      // Animer la fermeture
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
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  // Gérer le bouton retour Android
  useEffect(() => {
    if (visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        onClose();
        return true;
      });
      return () => backHandler.remove();
    }
  }, [visible, onClose]);

  const handleSave = () => {
    const totalSeconds = selectedMinutes * 60 + selectedSeconds;
    if (totalSeconds > 0) {
      onSave(totalSeconds);
      onClose();
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
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
              onPress={onClose}
            />
          </Animated.View>
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>Log time manually</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Ionicons name="arrow-down" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.subtitle}>
                Select the duration you want to log
              </Text>
              
              <View style={styles.pickerContainer}>
                <TimePicker
                  minutes={selectedMinutes}
                  seconds={selectedSeconds}
                  onMinutesChange={setSelectedMinutes}
                  onSecondsChange={setSelectedSeconds}
                />
              </View>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0D0D0F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
  },
  content: {
    paddingBottom: Platform.OS === 'ios' ? 48 : 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  pickerContainer: {
    paddingVertical: 16,
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});

