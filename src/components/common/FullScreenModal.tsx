import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  // État local pour la visibilité de la modale (permet l'animation)
  const [modalVisible, setModalVisible] = useState(visible);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasAnimationStarted = useRef(false);
  const isInitialRender = useRef(true);

  // Fonction pour animer la fermeture de la modale
  const animateClose = useCallback(() => {
    if (hasAnimationStarted.current) return;
    
    hasAnimationStarted.current = true;
    
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
      hasAnimationStarted.current = false;
    });
  }, [slideAnim, fadeAnim]);

  // Gérer l'ouverture et la fermeture de la modale
  useEffect(() => {
    if (visible && !modalVisible) {
      // Ouverture de la modale
      setModalVisible(true);
      hasAnimationStarted.current = false;
    } else if (!visible && modalVisible && !hasAnimationStarted.current) {
      // Fermeture de la modale
      animateClose();
    }
  }, [visible, modalVisible, animateClose]);

  // Animation d'ouverture lorsque modalVisible devient true
  useEffect(() => {
    // Lorsque la modale devient visible, lancer l'animation d'entrée
    if (modalVisible) {
      // Réinitialiser l'animation d'entrée si ce n'est pas le rendu initial
      if (!isInitialRender.current) {
        slideAnim.setValue(height);
        fadeAnim.setValue(0);
      }
      isInitialRender.current = false;
      
      // Animation d'entrée
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
    }
  }, [modalVisible, slideAnim, fadeAnim]);

  // Gérer le bouton retour sur Android
  useEffect(() => {
    const backAction = () => {
      if (modalVisible) {
        onClose();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [modalVisible, onClose]);

  // Fermer le clavier
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Gérer la fermeture
  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
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
            onPress={handleClose} 
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