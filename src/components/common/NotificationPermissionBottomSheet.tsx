import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  TouchableWithoutFeedback,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import NotificationService from '../../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../../utils/logger';

const { height } = Dimensions.get('window');
const ANIMATION_DURATION = 300;
const STORAGE_KEY = '@peak_notification_permission_shown';

interface NotificationPermissionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationPermissionBottomSheet: React.FC<NotificationPermissionBottomSheetProps> = ({
  visible,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(height);
      fadeAnim.setValue(0);
      
      // Animation simple
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
      // Fermer avec animation
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

  const handleEnableNotifications = async () => {
    try {
      // Vérifier le statut actuel de la permission
      const currentPermission = await Notifications.getPermissionsAsync();
      
      // Si la permission a été refusée définitivement, rediriger vers Settings
      if (currentPermission.status === 'denied' && currentPermission.canAskAgain === false) {
        onClose();
        
        Alert.alert(
          'Notification Access Required',
          'To receive workout reminders, please enable notifications in Settings.',
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
        
        await AsyncStorage.setItem(STORAGE_KEY, 'true');
        return;
      }
      
      // Demander la permission système
      const { status } = await Notifications.requestPermissionsAsync();
      
      // Marquer comme affiché
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      
      // Si la permission est accordée, initialiser et planifier
      if (status === 'granted') {
        const initialized = await NotificationService.initialize();
        
        if (initialized) {
          await NotificationService.scheduleWorkoutReminders();
        }
      } else if (status === 'denied') {
        // Si refusé, proposer d'aller dans Settings
        Alert.alert(
          'Notification Access Required',
          'To receive workout reminders, please enable notifications in Settings.',
          [
            { text: 'Maybe Later', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                Linking.openSettings();
              },
            },
          ]
        );
      }
      
      onClose();
    } catch (error) {
      logger.error('Error enabling notifications:', error);
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      onClose();
    }
  };

  const handleMaybeLater = async () => {
    // Marquer comme affiché pour ne plus redemander
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    onClose();
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={handleMaybeLater}>
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
        pointerEvents="box-none"
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
              onPress={handleMaybeLater}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.content}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <Ionicons name="notifications-outline" size={64} color="#FFFFFF" />
              </View>

              {/* Title */}
              <Text style={styles.title}>Stay on track with reminders</Text>

              {/* Description */}
              <Text style={styles.description}>
                Notifications are only used to remind you of your scheduled workouts. You can manage this anytime in Settings.
              </Text>

              {/* Buttons */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleEnableNotifications}
                >
                  <Text style={styles.primaryButtonText}>Enable notifications</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={handleMaybeLater}
                >
                  <Text style={styles.secondaryButtonText}>Maybe later</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    elevation: 10000,
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1,
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
    zIndex: 2,
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
  },
  primaryButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Poppins-Regular',
  },
});
