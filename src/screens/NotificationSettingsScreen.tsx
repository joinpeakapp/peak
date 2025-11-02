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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationSettings, DEFAULT_NOTIFICATION_SETTINGS } from '../types/notifications';
import NotificationService from '../services/notificationService';

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

const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { settings, hasPermission, saveSettings, requestPermissions, isInitialized } = useNotifications();
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings || DEFAULT_NOTIFICATION_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

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
              // iOS
              Alert.alert('Ouvrir Réglages', 'Allez dans Réglages > Notifications > Peak pour autoriser les notifications');
            } else {
              // Android
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

  // Écran de chargement si pas encore initialisé
  if (!isInitialized || !settings) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.permissionTitle}>Initialisation...</Text>
          <Text style={styles.permissionText}>
            Configuration des notifications en cours...
          </Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        <View style={styles.permissionContainer}>
          <Ionicons name="notifications-off" size={64} color="#ccc" style={styles.permissionIcon} />
          <Text style={styles.permissionTitle}>Notifications désactivées</Text>
          <Text style={styles.permissionText}>
            Autorisez les notifications pour recevoir des rappels d'entraînement et de streak.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={handlePermissionRequest}>
            <Text style={styles.permissionButtonText}>Activer les notifications</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {hasChanges && (
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Sauver</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Rappels d'entraînement */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="fitness" size={24} color="#007AFF" />
              <Text style={styles.sectionTitle}>Rappels d'entraînement</Text>
            </View>
            <Switch
              value={localSettings.workoutReminders.enabled}
              onValueChange={(enabled) =>
                updateLocalSettings({
                  workoutReminders: { ...localSettings.workoutReminders, enabled },
                })
              }
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={localSettings.workoutReminders.enabled ? '#007AFF' : '#f4f3f4'}
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
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Rappels de streak */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="flame" size={24} color="#FF6B35" />
              <Text style={styles.sectionTitle}>Rappels de streak</Text>
            </View>
            <Switch
              value={localSettings.streakReminders.enabled}
              onValueChange={(enabled) =>
                updateLocalSettings({
                  streakReminders: { ...localSettings.streakReminders, enabled },
                })
              }
              trackColor={{ false: '#767577', true: '#ff9f7a' }}
              thumbColor={localSettings.streakReminders.enabled ? '#FF6B35' : '#f4f3f4'}
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
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Information */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={20} color="#666" />
          <Text style={styles.infoText}>
            Les notifications seront automatiquement replanifiées lorsque vous modifiez vos paramètres.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginRight: 34, // Compenser le bouton back
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  daysContainer: {
    marginBottom: 20,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  timeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  timeSelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: '#007AFF',
    marginRight: 5,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 12,
    padding: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 10,
    flex: 1,
  },
});

export { NotificationSettingsScreen };
export default NotificationSettingsScreen;
