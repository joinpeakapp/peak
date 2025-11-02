import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '../../types/notifications';
import NotificationService from '../../services/notificationService';

const DAYS_OF_WEEK = [
  { key: 0, label: 'Dimanche', short: 'D' },
  { key: 1, label: 'Lundi', short: 'L' },
  { key: 2, label: 'Mardi', short: 'M' },
  { key: 3, label: 'Mercredi', short: 'M' },
  { key: 4, label: 'Jeudi', short: 'J' },
  { key: 5, label: 'Vendredi', short: 'V' },
  { key: 6, label: 'Samedi', short: 'S' },
];

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00',
];

const { height } = Dimensions.get('window');
const ANIMATION_DURATION = 300;

interface NotificationSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  visible,
  onClose,
}) => {
  const { settings, hasPermission, saveSettings, requestPermissions, isInitialized } = useNotifications();
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings || DEFAULT_NOTIFICATION_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Animation values
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Animation logic
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      slideAnim.setValue(height);
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
  }, [visible, modalVisible]);

  const handleSave = async () => {
    try {
      await saveSettings(localSettings);
      setHasChanges(false);
      Alert.alert('Succès', 'Paramètres de notifications sauvegardés');
      
      // Replanifier les notifications avec les nouveaux paramètres
      await NotificationService.scheduleWorkoutReminders();
      
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les paramètres');
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
          { text: 'Paramètres', onPress: () => {
            if (Platform.OS === 'ios') {
              Alert.alert('Ouvrir Réglages', 'Allez dans Réglages > Notifications > Peak pour autoriser les notifications');
            } else {
              Alert.alert('Ouvrir Paramètres', 'Allez dans Paramètres > Applications > Peak > Notifications pour autoriser les notifications');
            }
          }},
        ]
      );
    }
  };

  const updateLocalSettings = (updates: Partial<NotificationSettings>) => {
    setLocalSettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const toggleWorkoutDay = (day: number) => {
    const currentDays = localSettings.workoutReminders.days;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();

    updateLocalSettings({
      workoutReminders: {
        ...localSettings.workoutReminders,
        days: newDays,
      },
    });
  };

  const showTimeSelector = (type: 'workout' | 'streak') => {
    const currentTime = type === 'workout' 
      ? localSettings.workoutReminders.time 
      : localSettings.streakReminders.time;

    Alert.alert(
      'Choisir l\'heure',
      'Sélectionnez l\'heure pour les rappels',
      [
        ...TIME_OPTIONS.map(time => ({
          text: time,
          onPress: () => {
            if (type === 'workout') {
              updateLocalSettings({
                workoutReminders: {
                  ...localSettings.workoutReminders,
                  time,
                },
              });
            } else {
              updateLocalSettings({
                streakReminders: {
                  ...localSettings.streakReminders,
                  time,
                },
              });
            }
          },
        })),
        { text: 'Annuler', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

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
          <View style={styles.handle} />
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
            >
              <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            {hasChanges && (
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Notifications</Text>
          </View>

          {/* Loading state */}
          {(!isInitialized || !settings) ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Initialisation...</Text>
            </View>
          ) : !hasPermission ? (
            /* Permission state */
            <View style={styles.permissionContainer}>
              <Ionicons name="notifications-off" size={64} color="#666" style={styles.permissionIcon} />
              <Text style={styles.permissionTitle}>Notifications désactivées</Text>
              <Text style={styles.permissionText}>
                Autorisez les notifications pour recevoir des rappels d'entraînement et de streak.
              </Text>
              <TouchableOpacity style={styles.permissionButton} onPress={handlePermissionRequest}>
                <Text style={styles.permissionButtonText}>Activer les notifications</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Main content */
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Rappels d'entraînement */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <Ionicons name="fitness" size={20} color="#FFFFFF" />
                    <Text style={styles.sectionTitle}>Rappels d'entraînement</Text>
                  </View>
                  <Switch
                    value={localSettings.workoutReminders.enabled}
                    onValueChange={(enabled) =>
                      updateLocalSettings({
                        workoutReminders: { ...localSettings.workoutReminders, enabled },
                      })
                    }
                    trackColor={{ false: '#3A3A3C', true: '#FFFFFF' }}
                    thumbColor={localSettings.workoutReminders.enabled ? '#0D0D0F' : '#FFFFFF'}
                  />
                </View>

                {localSettings.workoutReminders.enabled && (
                  <>
                    <Text style={styles.sectionDescription}>
                      Recevez des rappels pour maintenir votre routine d'entraînement
                    </Text>

                    {/* Jours de la semaine */}
                    <View style={styles.daysContainer}>
                      <Text style={styles.subTitle}>Jours de rappel</Text>
                      <View style={styles.daysGrid}>
                        {DAYS_OF_WEEK.map((day) => (
                          <TouchableOpacity
                            key={day.key}
                            style={[
                              styles.dayButton,
                              localSettings.workoutReminders.days.includes(day.key) && styles.dayButtonActive,
                            ]}
                            onPress={() => toggleWorkoutDay(day.key)}
                          >
                            <Text
                              style={[
                                styles.dayButtonText,
                                localSettings.workoutReminders.days.includes(day.key) && styles.dayButtonTextActive,
                              ]}
                            >
                              {day.short}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Heure */}
                    <TouchableOpacity style={styles.timeSelector} onPress={() => showTimeSelector('workout')}>
                      <Text style={styles.subTitle}>Heure du rappel</Text>
                      <View style={styles.timeSelectorRight}>
                        <Text style={styles.timeText}>{localSettings.workoutReminders.time}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#666" />
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Rappels de streak */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <Ionicons name="flame" size={20} color="#FF6B35" />
                    <Text style={styles.sectionTitle}>Rappels de streak</Text>
                  </View>
                  <Switch
                    value={localSettings.streakReminders.enabled}
                    onValueChange={(enabled) =>
                      updateLocalSettings({
                        streakReminders: { ...localSettings.streakReminders, enabled },
                      })
                    }
                    trackColor={{ false: '#3A3A3C', true: '#FFFFFF' }}
                    thumbColor={localSettings.streakReminders.enabled ? '#0D0D0F' : '#FFFFFF'}
                  />
                </View>

                {localSettings.streakReminders.enabled && (
                  <>
                    <Text style={styles.sectionDescription}>
                      Soyez alerté quand vos streaks sont sur le point d'expirer
                    </Text>

                    {/* Heure */}
                    <TouchableOpacity style={styles.timeSelector} onPress={() => showTimeSelector('streak')}>
                      <Text style={styles.subTitle}>Heure du rappel</Text>
                      <View style={styles.timeSelectorRight}>
                        <Text style={styles.timeText}>{localSettings.streakReminders.time}</Text>
                        <Ionicons name="chevron-forward" size={16} color="#666" />
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Information */}
              <View style={styles.infoSection}>
                <Ionicons name="information-circle" size={16} color="#666" />
                <Text style={styles.infoText}>
                  Les notifications seront automatiquement replanifiées lorsque vous modifiez vos paramètres.
                </Text>
              </View>
            </ScrollView>
          )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 100,
    backgroundColor: '#0D0D0F',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  closeButton: {
    alignSelf: 'flex-start',
    padding: 8,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#0D0D0F',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionIcon: {
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 20,
    lineHeight: 18,
  },
  daysContainer: {
    marginBottom: 20,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dayButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
  },
  dayButtonTextActive: {
    color: '#0D0D0F',
  },
  timeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  timeSelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 4,
    fontWeight: '500',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginLeft: 8,
    flex: 1,
  },
});

export default NotificationSettingsModal;
