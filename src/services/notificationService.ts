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
import { StreakService } from './streakService';
import { 
  getRandomSingleWorkoutMessage, 
  getRandomMultipleWorkoutsMessage, 
  type NotificationMessage 
} from '../utils/notificationMessages';
import { addDays, format, startOfDay, isBefore } from 'date-fns';

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
   * Planifier les rappels d'entraînement pour les workouts HEBDOMADAIRES uniquement
   * Les workouts à intervalles sont gérés par scheduleIntervalWorkoutReminder()
   * 
   * Règles importantes :
   * - Une seule notification par jour maximum (à 9h du matin par défaut)
   * - Toutes les notifications sont envoyées à la même heure (09:00)
   * - Si 1 seul workout le jour : notification avec le nom du workout
   * - Si 2+ workouts le jour : notification mixte (remplace les notifications individuelles)
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
      const workoutsResult = await RobustStorageService.loadWorkoutTemplates();
      if (!workoutsResult.success || !workoutsResult.data) {
        console.warn('🔔 [NotificationService] No workouts found');
        return;
      }

      const workouts: Workout[] = workoutsResult.data;

      // Récupérer l'heure depuis les settings de notifications (par défaut 09:00)
      const notificationSettings = await this.getSettings();
      const time = notificationSettings.workoutReminders.time || '09:00';
      const [hour, minute] = time.split(':').map(Number);

      // Map pour grouper les workouts HEBDOMADAIRES par date (YYYY-MM-DD)
      // Clé : date au format YYYY-MM-DD, Valeur : liste des workouts pour cette date
      const workoutsByDate = new Map<string, Workout[]>();
      const now = new Date();
      const maxDaysAhead = 30; // Planifier jusqu'à 30 jours à l'avance

      // 🔧 REFACTO : Ne calculer QUE les workouts hebdomadaires
      // Les workouts à intervalles sont gérés dynamiquement par scheduleIntervalWorkoutReminder()
      for (const workout of workouts) {
        if (workout.frequency.type === 'weekly') {
          // Workout hebdomadaire : calculer les prochaines dates pour ce jour de la semaine
          const dayOfWeek = workout.frequency.value;
          let currentDate = this.getNextDateForDay(dayOfWeek, hour, minute);
          
          // Planifier pour les prochaines semaines (jusqu'à maxDaysAhead jours)
          while (isBefore(currentDate, addDays(now, maxDaysAhead))) {
            const dateKey = format(startOfDay(currentDate), 'yyyy-MM-dd');
            if (!workoutsByDate.has(dateKey)) {
              workoutsByDate.set(dateKey, []);
            }
            workoutsByDate.get(dateKey)!.push(workout);
            
            // Passer à la semaine suivante
            currentDate = addDays(currentDate, 7);
          }
        }
        // 'interval' : ignoré ici, géré par scheduleIntervalWorkoutReminder()
        // 'none' : pas de notifications
      }

      // 🔧 REFACTO : Annuler uniquement les notifications hebdomadaires
      // Les notifications d'intervalles sont gérées séparément
      await this.cancelWeeklyWorkoutReminders();

      if (workoutsByDate.size === 0) {
        console.log('🔔 [NotificationService] No weekly workouts to schedule');
        return;
      }

      // Planifier une notification pour chaque jour avec workout(s) planifié(s)
      for (const [dateKey, dayWorkouts] of workoutsByDate.entries()) {
        // Parser la date depuis YYYY-MM-DD
        const [year, month, day] = dateKey.split('-').map(Number);
        const scheduledDate = new Date(year, month - 1, day, hour, minute, 0);
        
        // Vérifier que la date est dans le futur
        if (scheduledDate <= now) {
          continue;
        }

        // 🔧 SÉCURITÉ : Vérifier s'il y a déjà une notification pour cette date (intervalle, hebdomadaire ou mixte)
        // On doit garantir qu'il n'y a qu'une seule notification par jour
        const existingNotification = await this.getNotificationForDate(dateKey);
        
        if (existingNotification) {
          // Il y a déjà une notification pour cette date
          const isIntervalNotification = existingNotification.identifier.startsWith('workout_reminder_interval_');
          const isWeeklyNotification = existingNotification.identifier.startsWith('workout_reminder_weekly_');
          const isMixedNotification = existingNotification.identifier.startsWith('workout_reminder_mixed_');
          
          // Si c'est une notification mixte existante, on la garde et on ne fait rien
          // (elle inclut déjà tous les workouts pour ce jour)
          if (isMixedNotification) {
            console.log(`🔔 [NotificationService] Mixed notification already exists for ${dateKey}, skipping`);
            continue;
          }
          
          // Si c'est une notification d'intervalle ou hebdomadaire, on doit créer une notification mixte
          // qui remplace l'existante
          if (isIntervalNotification || isWeeklyNotification) {
            // Annuler la notification existante
            await Notifications.cancelScheduledNotificationAsync(existingNotification.identifier);
            await this.removeScheduledNotification(existingNotification.identifier);
            
            // Créer une notification mixte
            const mixedMessage = getRandomMultipleWorkoutsMessage();
            await this.scheduleNotification({
              id: `workout_reminder_mixed_${dateKey}`,
              type: 'workout_reminder',
              title: mixedMessage.title,
              body: mixedMessage.body,
              scheduledTime: scheduledDate,
              data: { 
                type: 'workout_reminder' as NotificationType, 
                workoutId: dayWorkouts[0]?.id || '',
                workoutName: 'Multiple Workouts',
                date: dateKey
              },
            });
            
            console.log(`🔔 [NotificationService] Created mixed notification for ${dateKey} (replacing existing)`);
            continue;
          }
        }

        // Pas de notification existante pour cette date
        let message: NotificationMessage;
        let notificationId: string;
        let workoutId: string;
        let workoutName: string;

        if (dayWorkouts.length === 1) {
          // Un seul workout hebdomadaire → notification individuelle avec le nom du workout
          const workout = dayWorkouts[0];
          message = getRandomSingleWorkoutMessage(workout.name);
          notificationId = `workout_reminder_weekly_${dateKey}`;
          workoutId = workout.id;
          workoutName = workout.name;
        } else {
          // Plusieurs workouts hebdomadaires → notification mixte
          message = getRandomMultipleWorkoutsMessage();
          notificationId = `workout_reminder_mixed_${dateKey}`;
          workoutId = dayWorkouts[0]?.id || '';
          workoutName = 'Multiple Workouts';
        }

        await this.scheduleNotification({
          id: notificationId,
          type: 'workout_reminder',
          title: message.title,
          body: message.body,
          scheduledTime: scheduledDate,
          data: { 
            type: 'workout_reminder' as NotificationType, 
            workoutId,
            workoutName,
            date: dateKey
          },
        });
      }

      console.log(`🔔 [NotificationService] Scheduled ${workoutsByDate.size} weekly workout reminders`);

      } catch (error) {
      console.error('🔔 [NotificationService] Error scheduling workout reminders:', error);
    }
  }

  /**
   * Planifier une notification pour un workout à intervalle
   * Appelée uniquement après complétion d'un workout à intervalle
   * 
   * @param workoutId - ID du workout
   * @param workoutName - Nom du workout
   * @param completionDate - Date de complétion du workout
   * @param intervalDays - Nombre de jours d'intervalle
   */
  static async scheduleIntervalWorkoutReminder(
    workoutId: string,
    workoutName: string,
    completionDate: Date,
    intervalDays: number
  ): Promise<void> {
    try {
      // Vérifier si les notifications sont activées
      const remindersEnabled = await SettingsService.getWorkoutRemindersEnabled();
      if (!remindersEnabled) {
        return;
      }

      // Récupérer l'heure depuis les settings (par défaut 09:00)
      const notificationSettings = await this.getSettings();
      const time = notificationSettings.workoutReminders.time || '09:00';
      const [hour, minute] = time.split(':').map(Number);

      // Calculer la date de notification : date de complétion + intervalle, à 09h00
      const notificationDate = addDays(completionDate, intervalDays);
      notificationDate.setHours(hour, minute, 0, 0);

      const now = new Date();
      
      // Ne pas planifier si la date est dans le passé
      if (notificationDate <= now) {
        console.log(`🔔 [NotificationService] Skipping notification in the past for workout ${workoutId}`);
        return;
      }

      const dateKey = format(startOfDay(notificationDate), 'yyyy-MM-dd');

      // Annuler l'ancienne notification pour ce workout (si elle existe)
      await this.cancelWorkoutReminder(workoutId);

      // 🔧 SÉCURITÉ : Vérifier s'il y a déjà une notification pour cette date
      // On doit garantir qu'il n'y a qu'une seule notification par jour
      const existingNotification = await this.getNotificationForDate(dateKey);
      
      if (existingNotification) {
        // Il y a déjà une notification pour cette date
        const isWeeklyNotification = existingNotification.identifier.startsWith('workout_reminder_weekly_');
        const isMixedNotification = existingNotification.identifier.startsWith('workout_reminder_mixed_');
        const isIntervalNotification = existingNotification.identifier.startsWith('workout_reminder_interval_');
        
        // Si c'est une notification mixte existante, on la garde et on ne fait rien
        // (elle inclut déjà tous les workouts pour ce jour)
        if (isMixedNotification) {
          console.log(`🔔 [NotificationService] Mixed notification already exists for ${dateKey}, skipping interval notification`);
          return;
        }
        
        // Si c'est une notification hebdomadaire ou d'intervalle, on doit créer une notification mixte
        // qui remplace l'existante
        if (isWeeklyNotification || isIntervalNotification) {
          // Annuler la notification existante
          await Notifications.cancelScheduledNotificationAsync(existingNotification.identifier);
          await this.removeScheduledNotification(existingNotification.identifier);
          
          // Créer une notification mixte
          const mixedMessage = getRandomMultipleWorkoutsMessage();
          await this.scheduleNotification({
            id: `workout_reminder_mixed_${dateKey}`,
            type: 'workout_reminder',
            title: mixedMessage.title,
            body: mixedMessage.body,
            scheduledTime: notificationDate,
            data: {
              type: 'workout_reminder' as NotificationType,
              workoutId: workoutId,
              workoutName: 'Multiple Workouts',
              date: dateKey
            },
          });

          console.log(`🔔 [NotificationService] Created mixed notification for ${dateKey} (interval + existing)`);
          return;
        }
      }

      // Pas de notification existante pour cette date → créer une notification individuelle
      const message = getRandomSingleWorkoutMessage(workoutName);
      
      await this.scheduleNotification({
        id: `workout_reminder_interval_${workoutId}`,
        type: 'workout_reminder',
        title: message.title,
        body: message.body,
        scheduledTime: notificationDate,
        data: {
          type: 'workout_reminder' as NotificationType,
          workoutId,
          workoutName,
          date: dateKey
        },
      });

      console.log(`🔔 [NotificationService] Scheduled interval reminder for ${workoutName} on ${dateKey}`);
    } catch (error) {
      console.error('🔔 [NotificationService] Error scheduling interval workout reminder:', error);
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
   * Annuler tous les rappels de workout (hebdomadaires + intervalles)
   */
  static async cancelAllWorkoutReminders(): Promise<void> {
    try {
      await this.cancelNotificationsByType('workout_reminder');
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Failed to cancel workout reminders:', error);
    }
  }

  /**
   * Annuler uniquement les rappels de workout hebdomadaires
   * Les notifications d'intervalles sont conservées
   */
  static async cancelWeeklyWorkoutReminders(): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        const notificationData = notification.content.data as unknown as NotificationData;
        if (notificationData?.type === 'workout_reminder') {
          // Annuler uniquement les notifications hebdomadaires (qui commencent par workout_reminder_weekly_)
          // et les notifications mixtes (qui commencent par workout_reminder_mixed_)
          // Conserver les notifications d'intervalles (qui commencent par workout_reminder_interval_)
          if (notification.identifier.startsWith('workout_reminder_weekly_') || 
              notification.identifier.startsWith('workout_reminder_mixed_')) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            await this.removeScheduledNotification(notification.identifier);
          }
        }
      }
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Failed to cancel weekly workout reminders:', error);
    }
  }

  /**
   * Obtenir une notification planifiée pour une date spécifique
   * Retourne la première notification trouvée pour cette date (peut être intervalle, hebdomadaire ou mixte)
   * Retourne null si aucune notification n'existe pour cette date
   */
  private static async getNotificationForDate(dateKey: string): Promise<Notifications.NotificationRequest | null> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        const notificationData = notification.content.data as unknown as NotificationData;
        if (notificationData?.type === 'workout_reminder' && notificationData.date === dateKey) {
          // Retourner la première notification trouvée pour cette date
          return notification;
        }
      }
      
      return null;
    } catch (error) {
      console.error('🔔 [NotificationService] ❌ Failed to get notification for date:', error);
      return null;
    }
  }

  /**
   * Annuler une notification spécifique pour un workout
   * Utilisé pour les workouts à intervalles lors de la replanification
   */
  static async cancelWorkoutReminder(workoutId: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      for (const notification of scheduledNotifications) {
        const notificationData = notification.content.data as unknown as NotificationData;
        // Annuler si c'est une notification d'intervalle pour ce workout
        if (notification.identifier === `workout_reminder_interval_${workoutId}`) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          await this.removeScheduledNotification(notification.identifier);
          console.log(`🔔 [NotificationService] Cancelled interval reminder for workout ${workoutId}`);
          return;
        }
      }
    } catch (error) {
      console.error(`🔔 [NotificationService] ❌ Failed to cancel workout reminder for ${workoutId}:`, error);
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
