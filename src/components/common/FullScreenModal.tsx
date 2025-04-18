import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  BackHandler
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FullScreenModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const { height } = Dimensions.get('window');
const ANIMATION_DURATION = 250;

/**
 * Composant de modale plein écran qui commence à 64px du haut de l'écran
 */
export const FullScreenModal: React.FC<FullScreenModalProps> = ({ 
  visible, 
  onClose, 
  children,
  title
}) => {
  const [modalVisible, setModalVisible] = useState(visible);
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      // Animation d'entrée de la modale
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true
        })
      ]).start();
    } else {
      // Animation de sortie de la modale
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: ANIMATION_DURATION,
          useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true
        })
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible]);

  // Gérer le bouton retour sur Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (modalVisible) {
        closeModal();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [modalVisible]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Fonction pour fermer la modale avec animation
  const closeModal = () => {
    // Animation de sortie de la modale
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: ANIMATION_DURATION,
        useNativeDriver: true
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true
      })
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeModal}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.backdrop, 
            { opacity: fadeAnim }
          ]}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={closeModal} 
          />
        </Animated.View>
        <Animated.View 
          style={[
            styles.modalContainer, 
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.contentContainer}
            >
              <View style={styles.handle} />
              {children}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#242526',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 64, // Distance depuis le haut de l'écran
    backgroundColor: '#0D0D0F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  contentContainer: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
}); 