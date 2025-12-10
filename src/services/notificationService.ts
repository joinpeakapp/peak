import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  NotificationSettings, 
  ScheduledNotification, 
  NotificationType, 
  NotificationData,
  DEFAULT_NOTIFICATION_SETTINGS 
} from '../types/notifications';
import { SettingsService } from './settingsService';
import { RobustStorageService } from './storage';
import { Workout } from '../types/workout';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private static readonly SETTINGS_KEY = 'notification_settings';
  private static readonly SCHEDULED_KEY = 'scheduled_notifications';

  /**
   * Initialise le service de notifications
   */
  static async initialize(): Promise<boolean> {
    try {
      // Vérifier si c'est un appareil physique
      if (!Device.isDevice) {
        return false;
      }

      // Demander les permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      // Configuration pour Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('workout-reminders', {
          name: 'Workout Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('streak-warnings', {
          name: 'Streak Warnings',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFD700',
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Initialization failed:', error);
      return false;
    }
  }

  /**
   * Planifier les rappels d'entraînement basés sur les workouts de l'utilisateur
   * Envoie une notification uniquement pour les jours où il y a un workout planifié
   */
  static async scheduleWorkoutReminders(): Promise<void> {
    try {
      // Vérifier si les notifications sont activées dans les settings
      const remindersEnabled = await SettingsService.getWorkoutRemindersEnabled();
      if (!remindersEnabled) {
        await this.cancelAllWorkoutReminders();
        return;
      }

      // Charger tous les workouts
      const workoutsResult = await RobustStorageService.loadWorkouts();
      if (!workoutsResult.success || !workoutsResult.data) {
        console.warn('🔔 [NotificationService] No workouts found');
        return;
      }

      const workouts: Workout[] = workoutsResult.data;

      // Déterminer quels jours de la semaine ont des workouts planifiés
      const daysWithWorkouts = new Set<number>();
      
      workouts.forEach(workout => {
        if (workout.frequency.type === 'weekly') {
          // Workout hebdomadaire : ajouter le jour de la semaine
          daysWithWorkouts.add(workout.frequency.value);
        } else if (workout.frequency.type === 'interval') {
          // Pour les workouts avec intervalle, on ne peut pas déterminer facilement les jours
          // On pourrait calculer les prochaines dates, mais pour simplifier, on ignore pour l'instant
          // TODO: Implémenter la logique pour les workouts avec intervalle si nécessaire
        }
        // 'none' (flexible schedule) : pas de notifications
      });

      if (daysWithWorkouts.size === 0) {
        // Pas de workouts planifiés, annuler toutes les notifications
        await this.cancelAllWorkoutReminders();
        return;
      }

      // Annuler les anciens rappels
      await this.cancelAllWorkoutReminders();

      // Récupérer l'heure depuis les settings de notifications (par défaut 08:00)
      const notificationSettings = await this.getSettings();
      const time = notificationSettings.workoutReminders.time || '08:00';
      const [hour, minute] = time.split(':').map(Number);

      // Planifier une notification pour chaque jour avec workout planifié
      for (const dayOfWeek of daysWithWorkouts) {
        const scheduledDate = this.getNextDateForDay(dayOfWeek, hour, minute);
        
        await this.scheduleNotification({
          id: `workout_reminder_${dayOfWeek}`,
          type: 'workout_reminder',
          title: '🏋️ Time to workout!',
          body: 'Don\'t forget your planned workout today. Stay consistent!',
          scheduledTime: scheduledDate,
          data: { type: 'workout_reminder' as NotificationType, dayOfWeek },
        });
      }

      console.log(`🔔 [NotificationService] Scheduled ${daysWithWorkouts.size} workout reminders`);

      } catch (error) {
      console.error('🔔 [NotificationService] Error scheduling workout reminders:', error);
    }
  }

  /**
   * Planifier un rappel de streak pour un workout spécifique
   */
  static async scheduleStreakReminder(workoutId: string, workoutName: string, lastCompletedDate: string, frequency: number): Promise<void> {
    try {
      const settings = await this.getSettings();
      
      if (!settings.streakReminders.enabled) {
        return;
      }

      // Annuler les anciens rappels de streak pour ce workout
      await this.cancelNotificationsByType('streak_reminder');

      const { time } = settings.streakReminders;
      const [hour, minute] = time.split(':').map(Number);

      // Calculer la date d'expiration de la streak
      const lastDate = new Date(lastCompletedDate);
      const expirationDate = new Date(lastDate);
      expirationDate.setDate(lastDate.getDate() + frequency);

      // Planifier le rappel 1 jour avant l'expiration
      const reminderDate = new Date(expirationDate);
      reminderDate.setDate(expirationDate.getDate() - 1);
      reminderDate.setHours(hour, minute, 0, 0);

      // Ne pas planifier si c'est dans le passé
      if (reminderDate <= new Date()) {
        return;
      }

      await this.scheduleNotification({
        id: `streak_reminder_${workoutId}`,
        type: 'streak_reminder',
        title: `⚡ Your ${workoutName} streak is ending soon!`,
        body: `Complete your workout by ${expirationDate.toLocaleDateString()} to keep your streak alive!`,
        scheduledTime: reminderDate,
        data: { type: 'streak_reminder' as NotificationType, workoutId, workoutName },
      });

      } catch (error) {
      console.error('🔔 [NotificationService] Error scheduling streak reminder:', error);
    }
  }

  /**
   * Obtenir la prochaine date pour un jour de la semaine donné
   */
  private static getNextDateForDay(dayOfWeek: number, hour: number, minute: number): Date {
    const now = new Date();
    const targetDate = new Date();
    
    // Calculer le nombre de jours jusqu'au prochain jour cible
    const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
    
    targetDate.setDate(now.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
    targetDate.setHours(hour, minute, 0, 0);

    // Si c'est aujourd'hui mais que l'heure est passée, programmer pour la semaine suivante
    if (daysUntilTarget === 0 && targetDate <= now) {
      targetDate.setDate(targetDate.getDate() + 7);
    }

    return targetDate;
  }

  /**
   * Annuler les notifications d'un type spécifique
   */
  static async cancelNotificationsByType(type: NotificationType): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        const notificationData = notification.content.data as unknown as NotificationData;
        if (notificationData?.type === type) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
      
      } catch (error) {
      console.error(`🔔 [NotificationService] Error cancelling ${type} notifications:`, error);
    }
  }

  /**
   * Planifier une notification locale
   */
  static async scheduleNotification(notification: ScheduledNotification): Promise<string | null> {
    try {
      const triggerDate = new Date(notification.scheduledTime);
      
      // Vérifier que la date est dans le futur
      if (triggerDate <= new Date()) {
        console.warn('🔔 [NotificationService] Cannot schedule notification in the past');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: (notification.data as unknown as Record<string, unknown>) || {},
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      // Sauvegarder la notification planifiée
      await this.saveScheduledNotification({
        ...notification,
        id: notificationId,
      });

      return notificationId;
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Annuler une notification
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await this.removeScheduledNotification(notificationId);
      } catch (error) {
      console.error('🔔 [NotificationService] ❌ Failed to cancel notification:', error);
    }
  }

  /**
   * Annuler toutes les notifications
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(this.SCHEDULED_KEY);
      } catch (error) {
      console.error('🔔 [NotificationService] ❌ Failed to cancel all notifications:', error);
    }
  }

  /**
   * Annuler tous les rappels de workout
   */
  static async cancelAllWorkoutReminders(): Promise<void> {
    try {
      await this.cancelNotificationsByType('workout_reminder');
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Failed to cancel workout reminders:', error);
    }
  }

  /**
   * Obtenir toutes les notifications planifiées
   */
  static async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    try {
      const data = await AsyncStorage.getItem(this.SCHEDULED_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Sauvegarder une notification planifiée
   */
  private static async saveScheduledNotification(notification: ScheduledNotification): Promise<void> {
    try {
      const scheduled = await this.getScheduledNotifications();
      scheduled.push(notification);
      await AsyncStorage.setItem(this.SCHEDULED_KEY, JSON.stringify(scheduled));
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Failed to save scheduled notification:', error);
    }
  }

  /**
   * Supprimer une notification planifiée
   */
  private static async removeScheduledNotification(notificationId: string): Promise<void> {
    try {
      const scheduled = await this.getScheduledNotifications();
      const filtered = scheduled.filter(n => n.id !== notificationId);
      await AsyncStorage.setItem(this.SCHEDULED_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Failed to remove scheduled notification:', error);
    }
  }

  /**
   * Obtenir les paramètres de notification
   */
  static async getSettings(): Promise<NotificationSettings> {
    try {
      const data = await AsyncStorage.getItem(this.SETTINGS_KEY);
      return data ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(data) } : DEFAULT_NOTIFICATION_SETTINGS;
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Failed to get settings:', error);
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }

  /**
   * Sauvegarder les paramètres de notification
   */
  static async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      } catch (error) {
      console.error('🔔 [NotificationService] ❌ Failed to save settings:', error);
    }
  }

  /**
   * Nettoyer les notifications expirées
   */
  static async cleanupExpiredNotifications(): Promise<void> {
    try {
      const scheduled = await this.getScheduledNotifications();
      const now = new Date();
      const active = scheduled.filter(n => new Date(n.scheduledTime) > now);
      
      if (active.length < scheduled.length) {
        await AsyncStorage.setItem(this.SCHEDULED_KEY, JSON.stringify(active));
        }
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Failed to cleanup expired notifications:', error);
    }
  }

  /**
   * Obtenir le statut des permissions
   */
  static async getPermissionStatus(): Promise<string> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Failed to get permission status:', error);
      return 'unknown';
    }
  }
}

export default NotificationService;
