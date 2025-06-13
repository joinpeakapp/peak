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
  // Refs pour suivre l'état du composant
  const isMounted = useRef(true);
  const animationInProgress = useRef(false);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // État interne de visibilité de la modale
  // Nous allons utiliser un état local uniquement pour déterminer si la Modal doit être rendue
  const [modalVisible, setModalVisible] = useState(false);
  
  // Effet pour initialiser/nettoyer le composant
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      if (slideAnim) slideAnim.stopAnimation();
      if (fadeAnim) fadeAnim.stopAnimation();
    };
  }, []);
  
  // Sécuriser la mise à jour de l'état modalVisible
  const updateModalVisibility = useCallback((isVisible: boolean) => {
    if (isMounted.current) {
      setModalVisible(isVisible);
    }
  }, []);
  
  // Effet unifié pour gérer la visibilité et les animations
  useEffect(() => {
    // Si une animation est déjà en cours, ne rien faire
    if (animationInProgress.current) return;
    
    if (visible) {
      // OUVERTURE de la modale
      
      // 1. D'abord rendre la Modal visible dans le DOM
      updateModalVisibility(true);
      
      // 2. Ensuite préparer et lancer l'animation d'entrée
      // Préparer l'animation (réinitialiser aux valeurs initiales)
      slideAnim.setValue(height);
      fadeAnim.setValue(0);
      
      // Marquer que l'animation est en cours
      animationInProgress.current = true;
      
      // Lancer l'animation d'entrée
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
      ]).start(() => {
        // Uniquement mettre à jour les refs si le composant est toujours monté
        if (isMounted.current) {
          animationInProgress.current = false;
        }
      });
    } else if (modalVisible) {
      // FERMETURE de la modale
      
      // Marquer que l'animation est en cours
      animationInProgress.current = true;
      
      // Lancer l'animation de sortie
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
        // Uniquement mettre à jour l'état si le composant est toujours monté
        if (isMounted.current) {
          updateModalVisibility(false);
          animationInProgress.current = false;
        }
      });
    }
  }, [visible, modalVisible, slideAnim, fadeAnim, updateModalVisibility]);
  
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

  // Fonction utilitaire pour fermer le clavier
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Si la modale n'est pas visible dans le DOM, retourner null
  if (!modalVisible && !visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
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
            onPress={onClose} 
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
    overflow: 'visible', // Permet aux badges PR de dépasser
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  contentContainer: {
    flex: 1,
    overflow: 'visible', // Permet aux éléments de dépasser
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