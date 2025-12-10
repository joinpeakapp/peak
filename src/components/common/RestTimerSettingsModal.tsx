import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  BackHandler,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsService } from '../../services/settingsService';
import { Picker } from '@react-native-picker/picker';

const { height, width } = Dimensions.get('window');
const ANIMATION_DURATION = 300;
const MINUTE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1); // 1 à 10 minutes

interface RestTimerSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RestTimerSettingsModal: React.FC<RestTimerSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState(3);
  
  // Animation values - slide from right
  const slideAnim = React.useRef(new Animated.Value(width)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      loadDefaultRestTimer();
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      slideAnim.setValue(width);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: width,
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
  }, [visible, modalVisible]);

  useEffect(() => {
    if (visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => backHandler.remove();
    }
  }, [visible]);

  const handleBackPress = () => {
    onClose();
    return true;
  };

  const loadDefaultRestTimer = async () => {
    const seconds = await SettingsService.getDefaultRestTimer();
    const minutes = Math.floor(seconds / 60);
    setSelectedMinutes(minutes);
  };

  const handleSave = async () => {
    const seconds = selectedMinutes * 60;
    await SettingsService.setDefaultRestTimer(seconds);
    onClose();
  };

  const formatTime = (minutes: number): string => {
    return `${minutes} min`;
  };

  if (!modalVisible && !visible) {
    return null;
  }

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.overlayTouchable} />
        </Animated.View>
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Rest timer</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.subtitle}>Default rest time between sets</Text>

          {/* Picker pour sélectionner les minutes - sans container */}
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedMinutes}
              onValueChange={(itemValue) => setSelectedMinutes(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {MINUTE_OPTIONS.map((min) => (
                <Picker.Item
                  key={min}
                  label={formatTime(min)}
                  value={min}
                />
              ))}
            </Picker>
          </View>

          <Text style={styles.description}>
            This will be the default rest time for all exercises. You can still customize it per exercise.
          </Text>
        </ScrollView>

        {/* Bouton Save fixe en bas */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayTouchable: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0D0D0F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Pour le bouton fixe en bas
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  pickerWrapper: {
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  picker: {
    width: '100%',
    color: '#FFFFFF',
  },
  pickerItem: {
    fontSize: 48, // Même taille que TimePicker
    fontWeight: '700',
    color: '#FFFFFF',
    height: 100,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: '#0D0D0F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: '600',
  },
});

