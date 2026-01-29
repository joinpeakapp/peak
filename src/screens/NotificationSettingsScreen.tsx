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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../hooks/useNotifications';
import { SettingsService } from '../services/settingsService';
import NotificationService from '../services/notificationService';

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { hasPermission, requestPermissions, isInitialized, permissionStatus, reloadSettings } = useNotifications();
  const [workoutRemindersEnabled, setWorkoutRemindersEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  // Recharger les settings quand les permissions changent
  useEffect(() => {
    if (isInitialized && hasPermission) {
      loadSettings();
    }
  }, [isInitialized, hasPermission, permissionStatus]);

  const loadSettings = async () => {
    setIsLoading(true);
    const enabled = await SettingsService.getWorkoutRemindersEnabled();
    setWorkoutRemindersEnabled(enabled);
    setIsLoading(false);
  };

  const handlePermissionRequest = async () => {
    const granted = await requestPermissions();
    
    if (granted) {
      // Recharger les settings après avoir accordé la permission
      if (reloadSettings) {
        await reloadSettings();
      }
      await loadSettings();
    } else {
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

  // Écran de chargement
  if (!isInitialized || isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.permissionContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.permissionTitle}>Loading...</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Écran si permissions non accordées
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Notifications</Text>
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Titre maintenant dans le ScrollView */}
        <Text style={styles.title}>Notifications</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#0D0D0F',
  },
  backButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingTop: 32,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
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
