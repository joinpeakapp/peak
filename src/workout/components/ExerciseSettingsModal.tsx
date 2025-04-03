import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ExerciseSettingsModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback function when the modal is closed */
  onClose: () => void;
  /** Callback function when replace is pressed */
  onReplace: () => void;
  /** Callback function when delete is pressed */
  onDelete: () => void;
}

const { height } = Dimensions.get('window');

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
 * />
 * ```
 */
export const ExerciseSettingsModal: React.FC<ExerciseSettingsModalProps> = ({
  visible,
  onClose,
  onReplace,
  onDelete,
}) => {
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Fonctions améliorées pour assurer une fermeture correcte
  const handleReplacePress = () => {
    // Fermer d'abord la modale, puis appeler onReplace après un court délai
    onClose();
    setTimeout(() => {
      onReplace();
    }, 50);
  };

  const handleDeletePress = () => {
    // Fermer d'abord la modale, puis appeler onDelete après un délai suffisant
    // pour que l'animation de fermeture soit complète
    onClose();
    setTimeout(() => {
      onDelete();
    }, 350); // Légèrement plus long que la durée de l'animation (300ms)
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
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

        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />
          
          <TouchableOpacity
            style={styles.option}
            onPress={handleReplacePress}
          >
            <Ionicons name="swap-horizontal-outline" size={24} color="#FFFFFF" />
            <Text style={styles.optionText}>Remplacer l'exercice</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, styles.deleteOption]}
            onPress={handleDeletePress}
          >
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            <Text style={[styles.optionText, styles.deleteText]}>
              Supprimer l'exercice
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
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
    marginLeft: 12,
  },
  deleteText: {
    color: '#FF3B30',
  },
}); 