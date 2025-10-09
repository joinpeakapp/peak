import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  BackHandler,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '../../types/workout';

interface ExerciseLibraryOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
  exercise?: Exercise | null;
  isCustomExercise: boolean;
}

const { height } = Dimensions.get('window');

export const ExerciseLibraryOptionsModal: React.FC<ExerciseLibraryOptionsModalProps> = ({
  visible,
  onClose,
  onDelete,
  exercise,
  isCustomExercise,
}) => {
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Gérer les animations
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

  // Gérer le bouton retour sur Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        onClose();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible]);

  const handleDeletePress = () => {
    if (!isCustomExercise) {
      Alert.alert(
        'Cannot Delete',
        'Default exercises cannot be deleted. Only custom exercises can be removed.',
        [{ text: 'OK', onPress: onClose }]
      );
      return;
    }

    Alert.alert(
      'Delete Exercise',
      `Are you sure you want to delete "${exercise?.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onClose,
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
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
            ]).start(() => {
              onClose();
              onDelete();
            });
          },
        },
      ]
    );
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
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />
          
          <View style={styles.content}>
            <Text style={styles.title}>{exercise?.name}</Text>
            <Text style={styles.subtitle}>
              {isCustomExercise ? 'Custom exercise' : 'Default exercise'}
            </Text>
            
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.option, 
                  styles.deleteOption,
                  !isCustomExercise && styles.deleteOptionDisabled
                ]}
                onPress={handleDeletePress}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={24} 
                  color={isCustomExercise ? "#FFFFFF" : "rgba(255, 255, 255, 0.3)"} 
                />
                <Text style={[
                  styles.optionText,
                  !isCustomExercise && styles.optionTextDisabled
                ]}>
                  Delete exercise
                </Text>
              </TouchableOpacity>
            </View>

            {!isCustomExercise && (
              <Text style={styles.infoText}>
                Only custom exercises can be deleted
              </Text>
            )}
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
    paddingBottom: 34,
    minHeight: 240,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
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
  deleteOption: {
    backgroundColor: '#FF3B30',
  },
  deleteOptionDisabled: {
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  optionTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 16,
    textAlign: 'center',
  },
});

