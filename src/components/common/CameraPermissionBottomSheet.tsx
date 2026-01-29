import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  TouchableWithoutFeedback,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import logger from '../../utils/logger';

const { height } = Dimensions.get('window');
const ANIMATION_DURATION = 300;

interface CameraPermissionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
  onChooseGallery?: () => void;
  onSkip?: () => void;
}

export const CameraPermissionBottomSheet: React.FC<CameraPermissionBottomSheetProps> = ({
  visible,
  onClose,
  onPermissionGranted,
  onChooseGallery,
  onSkip,
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = React.useState(false);

  useEffect(() => {
    if (visible && !modalVisible) {
      // Ouvrir le modal
      setModalVisible(true);
      slideAnim.setValue(height);
      fadeAnim.setValue(0);

      // Petit délai pour s'assurer que le DOM est prêt
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
            speed: 12,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (!visible && modalVisible) {
      // Fermer le modal
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
        setModalVisible(false);
      });
    }
  }, [visible, modalVisible, slideAnim, fadeAnim]);

  const handleEnableCamera = async () => {
    try {
      // Vérifier d'abord le statut actuel de la permission
      const currentStatus = await Camera.getCameraPermissionsAsync();
      
      // Si la permission a été refusée définitivement, rediriger vers les Settings
      if (currentStatus.status === 'denied' && !currentStatus.canAskAgain) {
        onClose();
        Alert.alert(
          'Camera Access Required',
          'To capture workout photos and create visual workout cards, please enable camera access in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                Linking.openSettings();
              },
            },
          ]
        );
        return;
      }
      
      // Demander la permission système directement - la modale native iOS/Android apparaîtra
      const { status } = await Camera.requestCameraPermissionsAsync();
      
      // Fermer le bottom sheet immédiatement après avoir déclenché la demande
      // (la modale système prendra le relais)
      onClose();
      
      // Si la permission est accordée, activer la caméra
      if (status === 'granted') {
        onPermissionGranted();
      }
      // Si refusée, onClose() a déjà été appelé, donc rien à faire
    } catch (error) {
      logger.error('Error requesting camera permission:', error);
      onClose();
    }
  };

  const handleChooseGallery = () => {
    onClose();
    if (onChooseGallery) {
      onChooseGallery();
    }
  };

  const handleSkip = () => {
    onClose();
    if (onSkip) {
      onSkip();
    }
  };

  // Ne pas rendre le Modal si pas visible pour éviter de bloquer l'interface
  if (!modalVisible && !visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleSkip}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={handleSkip}>
          <Animated.View 
            style={[
              styles.overlayTouchable,
              { opacity: fadeAnim }
            ]}
          />
        </TouchableWithoutFeedback>
        
        <Animated.View 
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.background}>
            <View style={styles.contentContainer}>
              {/* Handle */}
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>

              {/* Close Button */}
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleSkip}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>

              {/* Content */}
              <View style={styles.content}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <Ionicons name="camera-outline" size={64} color="#FFFFFF" />
                </View>

                {/* Title */}
                <Text style={styles.title}>Capture your progress</Text>

                {/* Description */}
                <Text style={styles.description}>
                  Take a photo after each workout to create beautiful workout cards and track your fitness journey visually. Your photos stay private and are only stored on your device.
                </Text>

                {/* Buttons */}
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity 
                    style={styles.primaryButton}
                    onPress={handleEnableCamera}
                  >
                    <Ionicons name="camera" size={20} color="#0D0D0F" style={styles.buttonIcon} />
                    <Text style={styles.primaryButtonText}>Enable Camera</Text>
                  </TouchableOpacity>

                  {onChooseGallery && (
                    <TouchableOpacity 
                      style={styles.secondaryButton}
                      onPress={handleChooseGallery}
                    >
                      <Ionicons name="images-outline" size={20} color="rgba(255, 255, 255, 0.6)" style={styles.buttonIcon} />
                      <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
                    </TouchableOpacity>
                  )}

                  {onSkip && (
                    <TouchableOpacity 
                      style={styles.tertiaryButton}
                      onPress={handleSkip}
                    >
                      <Text style={styles.tertiaryButtonText}>Skip Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
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
    backgroundColor: 'transparent',
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: height * 0.7,
  },
  background: {
    backgroundColor: '#0D0D0F',
  },
  contentContainer: {
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 24,
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    paddingTop: 20,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 32,
    fontFamily: 'Poppins-Regular',
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tertiaryButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
  },
});
