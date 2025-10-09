import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WorkoutSettingsModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback function when the modal is closed */
  onClose: () => void;
  /** Callback function when edit is pressed */
  onEdit: () => void;
  /** Callback function when delete is pressed */
  onDelete: () => void;
}

const { height } = Dimensions.get('window');
const ANIMATION_DURATION = 300;

/**
 * A modal component that appears from the bottom of the screen
 * to display workout settings options.
 * 
 * @component
 * @example
 * ```tsx
 * <WorkoutSettingsModal
 *   visible={true}
 *   onClose={() => setVisible(false)}
 *   onEdit={() => handleEdit()}
 *   onDelete={() => handleDelete()}
 * />
 * ```
 */
export const WorkoutSettingsModal: React.FC<WorkoutSettingsModalProps> = ({
  visible,
  onClose,
  onEdit,
  onDelete,
}) => {
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Gérer le changement de visibilité avec animations améliorées
  React.useEffect(() => {
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

  // Gérer le bouton retour sur Android
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        onClose();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  // Fonctions pour gérer les actions avec fermeture de modale
  const handleEditPress = () => {
    onClose();
    onEdit();
  };

  const handleDeletePress = () => {
    onClose();
    onDelete();
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
        
        <Animated.View 
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.handle} />
          
          <View style={styles.content}>
            <Text style={styles.title}>Workout settings</Text>
            
            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={[styles.option, styles.editOption]}
                onPress={handleEditPress}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={24} color="#FFFFFF" />
                <Text style={styles.optionText}>Edit workout</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.option, styles.deleteOption]}
                onPress={handleDeletePress}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
                <Text style={styles.optionText}>Delete workout</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 34, // Safe area
    minHeight: 280,
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
  editOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  deleteOption: {
    backgroundColor: '#FF3B30',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
}); 