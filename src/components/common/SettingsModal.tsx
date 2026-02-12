import React, { useState, useEffect, useRef } from 'react';
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
  Switch,
  Alert,
  ActivityIndicator,
  Clipboard,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsService } from '../../services/settingsService';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationService from '../../services/notificationService';
import { Picker } from '@react-native-picker/picker';

const { height, width } = Dimensions.get('window');
const ANIMATION_DURATION = 300;
const MINUTE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1); // 1 à 10 minutes

type SettingsView = 'list' | 'rest-timer' | 'notifications' | 'privacy-policy' | 'contact';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const { hasPermission, requestPermissions, isInitialized } = useNotifications();
  const [defaultRestTimer, setDefaultRestTimer] = useState(180);
  const [workoutRemindersEnabled, setWorkoutRemindersEnabled] = useState(true);
  const [selectedMinutes, setSelectedMinutes] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<SettingsView>('list');
  
  // Animation values - slide from bottom for main modal
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Animation for content slide - list goes left, detail comes from right
  const listSlideAnim = useRef(new Animated.Value(0)).current;
  const listOpacityAnim = useRef(new Animated.Value(1)).current;
  const detailSlideAnim = useRef(new Animated.Value(width)).current;
  const detailOpacityAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const previousViewRef = useRef<SettingsView>('list');

  useEffect(() => {
    if (visible) {
      loadSettings();
      setCurrentView('list');
      // Réinitialiser les animations quand on ouvre le modal
      listSlideAnim.setValue(0);
      listOpacityAnim.setValue(1);
      detailSlideAnim.setValue(width);
      detailOpacityAnim.setValue(0);
      previousViewRef.current = 'list';
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      slideAnim.setValue(height);
      fadeAnim.setValue(0);
      // Réinitialiser les animations de navigation interne
      listSlideAnim.setValue(0);
      listOpacityAnim.setValue(1);
      detailSlideAnim.setValue(width);
      detailOpacityAnim.setValue(0);
      previousViewRef.current = 'list';

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
        setCurrentView('list');
      });
    }
  }, [visible, modalVisible]);

  useEffect(() => {
    if (visible) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => backHandler.remove();
    }
  }, [visible, currentView]);

  // Animate content slide when view changes
  useEffect(() => {
    const isGoingForward = previousViewRef.current === 'list' && currentView !== 'list';
    const isGoingBack = previousViewRef.current !== 'list' && currentView === 'list';
    
    if (isGoingForward) {
      // Slide list to left, detail from right to center
      // S'assurer que l'opacité de la liste commence à 1 avant de disparaître
      // et que la position de la liste est à 0
      listSlideAnim.setValue(0);
      listOpacityAnim.setValue(1);
      detailSlideAnim.setValue(width);
      detailOpacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(listSlideAnim, {
          toValue: -width,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(listOpacityAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(detailSlideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(detailOpacityAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isGoingBack) {
      // Slide detail to right, list back to center
      // S'assurer que la liste commence à -width avant de revenir à 0
      listSlideAnim.setValue(-width);
      listOpacityAnim.setValue(0);
      detailSlideAnim.setValue(0);
      detailOpacityAnim.setValue(1);
      Animated.parallel([
        Animated.timing(listSlideAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(listOpacityAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(detailSlideAnim, {
          toValue: width,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(detailOpacityAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Réinitialiser les animations après l'animation de retour
        detailSlideAnim.setValue(width);
        detailOpacityAnim.setValue(0);
        listSlideAnim.setValue(0);
        // S'assurer que l'opacité est bien à 1 après le retour
        listOpacityAnim.setValue(1);
      });
    }
    
    previousViewRef.current = currentView;
  }, [currentView]);

  const handleBackPress = () => {
    if (currentView !== 'list') {
      setCurrentView('list');
      return true;
    }
    onClose();
    return true;
  };

  const loadSettings = async () => {
    setIsLoading(true);
    const restTimer = await SettingsService.getDefaultRestTimer();
    const remindersEnabled = await SettingsService.getWorkoutRemindersEnabled();
    setDefaultRestTimer(restTimer);
    setWorkoutRemindersEnabled(remindersEnabled);
    const minutes = Math.floor(restTimer / 60);
    setSelectedMinutes(minutes);
    setIsLoading(false);
  };

  const formatRestTimer = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const getNotificationSubtitle = (): string => {
    if (!hasPermission) {
      return 'Permissions not granted';
    }
    return workoutRemindersEnabled
      ? 'Enabled for scheduled workouts'
      : 'Disabled';
  };

  const handleRestTimerSave = async () => {
    const seconds = selectedMinutes * 60;
    await SettingsService.setDefaultRestTimer(seconds);
    await loadSettings();
    setCurrentView('list');
  };

  const handleNotificationToggle = async (value: boolean) => {
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
    
    if (value) {
      await NotificationService.scheduleWorkoutReminders();
    } else {
      await NotificationService.cancelAllWorkoutReminders();
    }
  };

  const handleCopyEmail = () => {
    const email = 'joinpeakapp@gmail.com';
    Clipboard.setString(email);
    Alert.alert(
      'Email Copied! 📧',
      `${email} has been copied to your clipboard.`,
      [{ text: 'OK', style: 'default' }]
    );
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
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.handle} />
        
        {/* Header fixe avec bouton retour/fermeture */}
        <View style={styles.headerFixed}>
          {currentView !== 'list' ? (
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentView('list')}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="arrow-down" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.contentContainer}>
          {/* List View - toujours rendue pour l'animation */}
          <Animated.View
            style={[
              styles.contentView,
              {
                transform: [{ translateX: listSlideAnim }],
                opacity: listOpacityAnim,
                zIndex: currentView === 'list' ? 10 : 0,
                elevation: currentView === 'list' ? 10 : 0,
                pointerEvents: currentView === 'list' ? 'auto' : 'none',
              },
            ]}
          >
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.title}>Settings</Text>
              <Text style={styles.subtitle}>How to track workouts and metrics</Text>

              <TouchableOpacity
                style={styles.categoryItem}
                onPress={() => setCurrentView('rest-timer')}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name="timer-outline" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryTitle}>Rest timer</Text>
                  <Text style={styles.categorySubtitle}>
                    Rest {formatRestTimer(defaultRestTimer)} between sets
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.categoryItem}
                onPress={() => setCurrentView('notifications')}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryTitle}>Notifications</Text>
                  <Text style={styles.categorySubtitle}>{getNotificationSubtitle()}</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.categoryItem}
                onPress={() => setCurrentView('contact')}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name="mail-outline" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryTitle}>Contact & Feedback</Text>
                  <Text style={styles.categorySubtitle}>Send us your suggestions and feedback</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.categoryItem}
                onPress={() => setCurrentView('privacy-policy')}
                activeOpacity={0.7}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name="shield-checkmark-outline" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryTitle}>Privacy Policy</Text>
                  <Text style={styles.categorySubtitle}>How we handle your data</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>

          {/* Rest Timer View */}
          {currentView === 'rest-timer' && (
            <Animated.View
              style={[
                styles.contentView,
                styles.contentViewDetail,
                {
                  transform: [{ translateX: detailSlideAnim }],
                  opacity: detailOpacityAnim,
                },
              ]}
            >
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.title}>Rest timer</Text>
              <Text style={styles.subtitle}>Default rest time between sets</Text>

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
                      label={`${min} min`}
                      value={min}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.description}>
                This will be the default rest time for all exercises. You can still customize it per exercise.
              </Text>
            </ScrollView>

            <View style={styles.bottomButtonContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleRestTimerSave}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
            </Animated.View>
          )}

          {/* Notifications View */}
          {currentView === 'notifications' && (
            <Animated.View
              style={[
                styles.contentView,
                styles.contentViewDetail,
                {
                  transform: [{ translateX: detailSlideAnim }],
                  opacity: detailOpacityAnim,
                },
              ]}
            >
            {isLoading || !isInitialized ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : hasPermission === false ? (
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
                  <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={async () => {
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
                    }}
                  >
                    <Text style={styles.permissionButtonText}>Enable notifications</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : (
              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <Text style={styles.title}>Notifications</Text>
                <Text style={styles.subtitle}>Workout reminders</Text>

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
                      onValueChange={handleNotificationToggle}
                      trackColor={{ false: 'rgba(255, 255, 255, 0.25)', true: '#4CD964' }}
                      thumbColor={workoutRemindersEnabled ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)'}
                      ios_backgroundColor="rgba(255, 255, 255, 0.25)"
                    />
                  </View>
                </View>

                <View style={styles.infoSection}>
                  <Ionicons name="information-circle" size={20} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={styles.infoText}>
                    You will receive one notification per day maximum, only on days when you have a scheduled workout.
                  </Text>
                </View>
              </ScrollView>
            )}
            </Animated.View>
          )}

          {/* Privacy Policy View */}
          {currentView === 'privacy-policy' && (
            <Animated.View
              style={[
                styles.contentView,
                styles.contentViewDetail,
                {
                  transform: [{ translateX: detailSlideAnim }],
                  opacity: detailOpacityAnim,
                },
              ]}
            >
              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <Text style={styles.title}>Privacy Policy</Text>
                <Text style={styles.lastUpdated}>Last Updated: January 30, 2026</Text>

                <View style={styles.privacySection}>
                  <Text style={styles.privacySectionTitle}>Introduction</Text>
                  <Text style={styles.privacyText}>
                    Peak is committed to protecting your privacy. All your workout data is stored <Text style={styles.privacyBold}>locally on your device</Text> and is never transmitted to our servers.
                  </Text>
                </View>

                <View style={styles.privacySection}>
                  <Text style={styles.privacySectionTitle}>What We Collect</Text>
                  <Text style={styles.privacyText}>
                    All data is stored locally on your device:
                  </Text>
                  <Text style={styles.privacyBullet}>• Workout templates and history</Text>
                  <Text style={styles.privacyBullet}>• Personal records and streak data</Text>
                  <Text style={styles.privacyBullet}>• Photos (stored locally)</Text>
                  <Text style={styles.privacyBullet}>• App preferences and settings</Text>
                </View>

                <View style={styles.privacySection}>
                  <Text style={styles.privacySectionTitle}>What We Do NOT Collect</Text>
                  <Text style={styles.privacyText}>We do <Text style={styles.privacyBold}>NOT</Text> collect:</Text>
                  <Text style={styles.privacyBullet}>• Personal identification information</Text>
                  <Text style={styles.privacyBullet}>• Location data</Text>
                  <Text style={styles.privacyBullet}>• Payment information</Text>
                  <Text style={styles.privacyBullet}>• Analytics or usage data</Text>
                </View>

                <View style={styles.privacySection}>
                  <Text style={styles.privacySectionTitle}>Data Storage</Text>
                  <Text style={styles.privacyBullet}>• 100% Local Storage</Text>
                  <Text style={styles.privacyBullet}>• No Cloud Sync</Text>
                  <Text style={styles.privacyBullet}>• No Third-Party Access</Text>
                  <Text style={styles.privacyBullet}>• Your device security protects your data</Text>
                </View>

                <View style={styles.privacySection}>
                  <Text style={styles.privacySectionTitle}>Your Rights</Text>
                  <Text style={styles.privacyBullet}>• Access: View all your data in the app</Text>
                  <Text style={styles.privacyBullet}>• Modify: Edit your data anytime</Text>
                  <Text style={styles.privacyBullet}>• Delete: Remove data at any time</Text>
                  <Text style={styles.privacyBullet}>• Control: Manage permissions in settings</Text>
                </View>

                <View style={styles.privacySection}>
                  <Text style={styles.privacySectionTitle}>Contact Us</Text>
                  <Text style={styles.privacyText}>
                    Questions about privacy or your data?
                  </Text>
                  <TouchableOpacity onPress={handleCopyEmail}>
                    <Text style={styles.privacyEmail}>joinpeakapp@gmail.com</Text>
                  </TouchableOpacity>
                  <Text style={styles.privacyText}>We'll respond within 48 hours.</Text>
                </View>

                <View style={styles.privacyFooter}>
                  <Text style={styles.privacyFooterText}>Peak - Your Privacy-First Workout Tracker</Text>
                </View>
              </ScrollView>
            </Animated.View>
          )}

          {/* Contact & Feedback View */}
          {currentView === 'contact' && (
            <Animated.View
              style={[
                styles.contentView,
                styles.contentViewDetail,
                {
                  transform: [{ translateX: detailSlideAnim }],
                  opacity: detailOpacityAnim,
                },
              ]}
            >
              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <Text style={styles.title}>Contact & Feedback</Text>
                
                <View style={styles.contactHeader}>
                  <Ionicons name="heart" size={48} color="#FF6B6B" />
                  <Text style={styles.contactThankYou}>Thank you for using Peak!</Text>
                </View>

                <View style={styles.contactSection}>
                  <Text style={styles.contactText}>
                    Your feedback is incredibly valuable to us. It helps us understand what you love about Peak and what we can improve.
                  </Text>
                </View>

                <View style={styles.contactSection}>
                  <Text style={styles.contactSectionTitle}>We'd love to hear from you about:</Text>
                  <Text style={styles.contactBullet}>💡 Feature suggestions</Text>
                  <Text style={styles.contactBullet}>🐛 Bug reports</Text>
                  <Text style={styles.contactBullet}>❓ Questions or concerns</Text>
                  <Text style={styles.contactBullet}>💬 General feedback</Text>
                </View>

                <View style={styles.contactSection}>
                  <Text style={styles.contactText}>
                    We're here to help and always happy to chat. Whether you have a question, a suggestion, or just want to say hi, we're all ears!
                  </Text>
                </View>

                <View style={styles.contactEmailSection}>
                  <Text style={styles.contactEmailLabel}>Get in touch:</Text>
                  <Text style={styles.contactEmailAddress}>joinpeakapp@gmail.com</Text>
                  <TouchableOpacity style={styles.copyEmailButton} onPress={handleCopyEmail}>
                    <Ionicons name="copy-outline" size={20} color="#0D0D0F" />
                    <Text style={styles.copyEmailButtonText}>Copy Email Address</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.contactFooter}>
                  <Text style={styles.contactFooterText}>
                    We typically respond within 48 hours.
                  </Text>
                </View>
              </ScrollView>
            </Animated.View>
          )}
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
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.85, // Remonte assez haut
    backgroundColor: '#0D0D0F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
  headerFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingTop: 32,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  contentContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  contentView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentViewDetail: {
    zIndex: 20,
    elevation: 20,
  },
  contentViewList: {
    left: 0,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
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
    fontSize: 48,
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
    borderRadius: 100,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: '600',
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
    borderRadius: 100,
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
  lastUpdated: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 20,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  privacySection: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  privacySectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  privacyBold: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  privacyBullet: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    paddingLeft: 8,
  },
  privacyEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 12,
  },
  privacyFooter: {
    marginTop: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  privacyFooterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  contactHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  contactThankYou: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  contactSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  contactSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  contactBullet: {
    fontSize: 14,
    lineHeight: 28,
    color: 'rgba(255, 255, 255, 0.8)',
    paddingLeft: 8,
  },
  contactEmailSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  contactEmailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  contactEmailAddress: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  copyEmailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
  },
  copyEmailButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  contactFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  contactFooterText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});
