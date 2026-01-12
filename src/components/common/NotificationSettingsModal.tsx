import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  BackHandler,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../hooks/useNotifications';
import { SettingsService } from '../../services/settingsService';
import NotificationService from '../../services/notificationService';

const { height, width } = Dimensions.get('window');
const ANIMATION_DURATION = 300;

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const { hasPermission, requestPermissions, isInitialized } = useNotifications();
  const [workoutRemindersEnabled, setWorkoutRemindersEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation values - slide from right
  const slideAnim = React.useRef(new Animated.Value(width)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSettings();
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

  const loadSettings = async () => {
    setIsLoading(true);
    const enabled = await SettingsService.getWorkoutRemindersEnabled();
    setWorkoutRemindersEnabled(enabled);
    setIsLoading(false);
  };

  const handleToggle = async (value: boolean) => {
    if (!hasPermission && value) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permissions requises',
          'Veuillez autoriser les notifications dans les paramètres de votre appareil pour recevoir des rappels.',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Paramètres',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Alert.alert(
                    'Ouvrir Réglages',
                    'Allez dans Réglages > Notifications > Peak pour autoriser les notifications'
                  );
                } else {
                  Alert.alert(
                    'Ouvrir Paramètres',
                    'Allez dans Paramètres > Applications > Peak > Notifications pour autoriser les notifications'
                  );
                }
              },
            },
          ]
        );
        return;
      }
    }

    setWorkoutRemindersEnabled(value);
    await SettingsService.setWorkoutRemindersEnabled(value);
    
    // Replanifier les notifications si activées
    if (value) {
      await NotificationService.scheduleWorkoutReminders();
    } else {
      await NotificationService.cancelAllWorkoutReminders();
    }
  };

  const handlePermissionRequest = async () => {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert(
        'Permissions requises',
        'Veuillez autoriser les notifications dans les paramètres de votre appareil pour recevoir des rappels.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Paramètres',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Alert.alert(
                  'Ouvrir Réglages',
                  'Allez dans Réglages > Notifications > Peak pour autoriser les notifications'
                );
              } else {
                Alert.alert(
                  'Ouvrir Paramètres',
                  'Allez dans Paramètres > Applications > Peak > Notifications pour autoriser les notifications'
                );
              }
            },
          },
        ]
      );
    }
  };

  if (!modalVisible && !visible) {
    return null;
  }

  // Écran de chargement
  if (!isInitialized || isLoading) {
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
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Notifications</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </Animated.View>
      </Modal>
    );
  }

  // Écran si permissions non accordées
  if (hasPermission === false) {
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
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Notifications</Text>
            <View style={styles.placeholder} />
          </View>
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.permissionContainer}>
              <Ionicons name="notifications-off" size={64} color="rgba(255, 255, 255, 0.3)" />
              <Text style={styles.permissionTitle}>Notifications disabled</Text>
              <Text style={styles.permissionText}>
                Enable notifications to receive reminders for your scheduled workouts.
              </Text>
              <TouchableOpacity style={styles.permissionButton} onPress={handlePermissionRequest}>
                <Text style={styles.permissionButtonText}>Enable notifications</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </Modal>
    );
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.subtitle}>Workout reminders</Text>

          {/* Section principale */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionContent}>
                <Text style={styles.sectionTitle}>Workout reminders</Text>
                <Text style={styles.sectionDescription}>
                  Receive one reminder per day when you have a scheduled workout
                </Text>
              </View>
              <Switch
                value={workoutRemindersEnabled}
                onValueChange={handleToggle}
                trackColor={{ false: 'rgba(255, 255, 255, 0.25)', true: '#4CD964' }}
                thumbColor={workoutRemindersEnabled ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)'}
                ios_backgroundColor="rgba(255, 255, 255, 0.25)"
              />
            </View>
          </View>

          {/* Information */}
          <View style={styles.infoSection}>
            <Ionicons name="information-circle" size={20} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.infoText}>
              You will receive one notification per day maximum, only on days when you have a scheduled workout.
            </Text>
          </View>
        </ScrollView>
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
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0D0D0F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 16,
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionContent: {
    flex: 1,
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
});
