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
import { Workout, CompletedWorkout } from '../types/workout';
import { StreakService } from './streakService';
import { 
  getRandomSingleWorkoutMessage, 
  getRandomMultipleWorkoutsMessage, 
  type NotificationMessage 
} from '../utils/notificationMessages';
import { addDays, format, startOfDay, isBefore, parseISO } from 'date-fns';
import logger from '../utils/logger';

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

interface ScheduledNotificationDate {
  date: Date; // Date à 09:00 heure locale
  dateKey: string; // Format YYYY-MM-DD
  workouts: Array<{
    id: string;
    name: string;
    type: 'weekly' | 'interval';
  }>;
}

class NotificationService {
  private static readonly SETTINGS_KEY = 'notification_settings';
  private static readonly SCHEDULED_KEY = 'scheduled_notifications';
  private static readonly NOTIFICATION_HOUR = 9; // 09:00
  private static readonly NOTIFICATION_MINUTE = 0;
  private static readonly MAX_DAYS_AHEAD = 30; // Planifier 30 jours à l'avance

  /**
   * Initialise le service de notifications
   */
  static async initialize(): Promise<boolean> {
    try {
      // Vérifier si c'est un appareil physique
      if (!Device.isDevice) {
        return false;
      }

      // Vérifier les permissions
      const { status } = await Notifications.getPermissionsAsync();

      if (status !== 'granted') {
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
      logger.error('[NotificationService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * 🔔 FONCTION PRINCIPALE : Replanifier toutes les notifications
   * 
   * Cette fonction est la seule entrée pour mettre à jour les notifications.
   * Elle implémente une logique centralisée, simple et fiable :
   * 
   * 1. Maximum 1 notification par jour à 09:00
   * 2. Workouts hebdomadaires : notification le jour prévu
   * 3. Workouts à intervalle : notification calculée depuis la dernière séance
   * 4. Workouts flexibles : aucune notification
   * 5. Plusieurs workouts le même jour : une seule notification mixte
   */
  static async scheduleWorkoutReminders(): Promise<void> {
    try {
      logger.log('🔔 [NotificationService] ═══ Starting notification scheduling ═══');

      // 1. Vérifier si les notifications sont activées
      const remindersEnabled = await SettingsService.getWorkoutRemindersEnabled();
      if (!remindersEnabled) {
        logger.log('🔔 [NotificationService] Reminders disabled, cancelling all');
        await this.cancelAllWorkoutNotifications();
        return;
      }

      // 2. Charger tous les workouts
      const workoutsResult = await RobustStorageService.loadWorkoutTemplates();
      if (!workoutsResult.success || !workoutsResult.data) {
        logger.log('🔔 [NotificationService] No workouts found');
        await this.cancelAllWorkoutNotifications();
        return;
      }

      const workouts: Workout[] = workoutsResult.data;

      // 3. Charger l'historique des séances (pour les workouts à intervalle)
      const historyResult = await RobustStorageService.loadWorkoutHistory();
      const completedWorkouts: CompletedWorkout[] = historyResult.success && historyResult.data 
        ? historyResult.data 
        : [];

      // 4. Calculer toutes les dates où une notification doit être envoyée
      const scheduledDates = await this.calculateScheduledDates(workouts, completedWorkouts);

      logger.log(`🔔 [NotificationService] Calculated ${scheduledDates.length} notification dates`);

      // 5. Annuler TOUTES les notifications existantes
      await this.cancelAllWorkoutNotifications();

      // 6. Créer les nouvelles notifications
      for (const scheduledDate of scheduledDates) {
        await this.createNotificationForDate(scheduledDate);
      }

      logger.log(`🔔 [NotificationService] ✅ Successfully scheduled ${scheduledDates.length} notifications`);
    } catch (error) {
      logger.error('🔔 [NotificationService] ❌ Error scheduling reminders:', error);
    }
  }

  /**
   * 📅 Calculer toutes les dates où une notification doit être envoyée
   * Retourne une liste de dates avec les workouts associés
   */
  private static async calculateScheduledDates(
    workouts: Workout[],
    completedWorkouts: CompletedWorkout[]
  ): Promise<ScheduledNotificationDate[]> {
    const now = new Date();
    const scheduledDatesMap = new Map<string, ScheduledNotificationDate>();

    for (const workout of workouts) {
      // Ignorer les workouts sans fréquence ou flexibles
      if (!workout.frequency || workout.frequency.type === 'none') {
        logger.log(`🔔 [NotificationService] Skipping flexible workout: ${workout.name}`);
        continue;
      }

      if (workout.frequency.type === 'weekly') {
        // 📌 Workouts hebdomadaires : notification le jour prévu
        const dates = this.calculateWeeklyDates(workout, now);
        this.addDatesToMap(scheduledDatesMap, dates, workout, 'weekly');
      } else if (workout.frequency.type === 'interval') {
        // 📌 Workouts à intervalle : calculer depuis la dernière séance
        const dates = this.calculateIntervalDates(workout, completedWorkouts, now);
        this.addDatesToMap(scheduledDatesMap, dates, workout, 'interval');
      }
    }

    // Convertir la Map en tableau et trier par date
    return Array.from(scheduledDatesMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * 📆 Calculer les dates pour un workout hebdomadaire
   * 
   * ⚠️ FIX: Utilisation correcte de date-fns pour éviter les problèmes de timezone
   * avec setHours() qui peut causer des décalages d'un jour
   */
  private static calculateWeeklyDates(workout: Workout, now: Date): Date[] {
    const dates: Date[] = [];
    const dayOfWeek = workout.frequency.value; // 0 = dimanche, 1 = lundi, etc.
    
    const nowDay = now.getDay();
    logger.log(`🔔 [DEBUG] calculateWeeklyDates for "${workout.name}"`);
    logger.log(`🔔 [DEBUG] - Now: ${format(now, 'yyyy-MM-dd HH:mm:ss EEEE')} (day ${nowDay})`);
    logger.log(`🔔 [DEBUG] - Target day: ${dayOfWeek} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]})`);
    
    // ⚠️ FIX: Au lieu d'utiliser setHours() qui peut causer des problèmes de timezone,
    // on commence avec startOfDay() puis on ajoute les heures avec date-fns
    let currentDate = startOfDay(now);
    // Ajouter 9 heures pour la notification à 09:00
    currentDate.setHours(this.NOTIFICATION_HOUR, this.NOTIFICATION_MINUTE, 0, 0);
    
    logger.log(`🔔 [DEBUG] - currentDate after setting time: ${format(currentDate, 'yyyy-MM-dd HH:mm:ss EEEE')}`);
    logger.log(`🔔 [DEBUG] - currentDate.getDay(): ${currentDate.getDay()}`);

    // ⚠️ FIX: Recalculer daysUntilNext APRÈS avoir défini l'heure
    // car setHours() peut changer le jour dans certains cas de timezone
    const currentDayAfterSetHours = currentDate.getDay();
    let daysUntilNext = (dayOfWeek - currentDayAfterSetHours + 7) % 7;
    logger.log(`🔔 [DEBUG] - daysUntilNext (initial): ${daysUntilNext}`);
    
    if (daysUntilNext === 0) {
      // C'est le bon jour de la semaine
      if (currentDate <= now) {
        // L'heure est déjà passée aujourd'hui, passer à la semaine prochaine
        logger.log(`🔔 [DEBUG] - Same day but time passed, adding 7 days`);
        daysUntilNext = 7;
      } else {
        // L'heure n'est pas passée, programmer pour aujourd'hui
        logger.log(`🔔 [DEBUG] - Same day and time not passed, keeping today`);
      }
    } else {
      logger.log(`🔔 [DEBUG] - Different day, will add ${daysUntilNext} days`);
    }
    
    // Ajouter les jours nécessaires
    if (daysUntilNext > 0) {
      currentDate = addDays(currentDate, daysUntilNext);
    }
    
    logger.log(`🔔 [DEBUG] - First notification date: ${format(currentDate, 'yyyy-MM-dd HH:mm:ss EEEE')}`);
    logger.log(`🔔 [DEBUG] - First notification date getDay(): ${currentDate.getDay()}`);

    // Planifier pour les N prochaines semaines
    const maxDate = addDays(now, this.MAX_DAYS_AHEAD);
    while (currentDate < maxDate) {
      dates.push(new Date(currentDate));
      logger.log(`🔔 [DEBUG] - Added date: ${format(currentDate, 'yyyy-MM-dd HH:mm:ss EEEE')} (day ${currentDate.getDay()})`);
      currentDate = addDays(currentDate, 7);
    }

    logger.log(`🔔 [NotificationService] Weekly workout "${workout.name}": ${dates.length} dates`);
    return dates;
  }

  /**
   * 📆 Calculer les dates pour un workout à intervalle
   * RÈGLE : La notification est calculée depuis la dernière séance effectuée
   * 
   * ⚠️ FIX: Utilisation correcte de date-fns pour éviter les problèmes de timezone
   */
  private static calculateIntervalDates(
    workout: Workout,
    completedWorkouts: CompletedWorkout[],
    now: Date
  ): Date[] {
    const intervalDays = workout.frequency.value;

    // Trouver la dernière séance de ce workout
    const workoutSessions = completedWorkouts
      .filter(cw => cw.workoutId === workout.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (workoutSessions.length === 0) {
      // Aucune séance effectuée → aucune notification
      logger.log(`🔔 [NotificationService] Interval workout "${workout.name}": no sessions yet, no notification`);
      return [];
    }

    // Calculer la date de notification depuis la dernière séance
    const lastSession = workoutSessions[0];
    const lastSessionDate = parseISO(lastSession.date);
    
    // ⚠️ FIX: Date de notification = dernière séance + intervalle, à 09:00
    // Utiliser startOfDay() puis setHours() pour éviter les problèmes de timezone
    let notificationDate = addDays(startOfDay(lastSessionDate), intervalDays);
    notificationDate.setHours(this.NOTIFICATION_HOUR, this.NOTIFICATION_MINUTE, 0, 0);

    logger.log(`🔔 [DEBUG] Interval workout "${workout.name}":`);
    logger.log(`🔔 [DEBUG] - Last session: ${format(lastSessionDate, 'yyyy-MM-dd')}`);
    logger.log(`🔔 [DEBUG] - Interval days: ${intervalDays}`);
    logger.log(`🔔 [DEBUG] - Notification date: ${format(notificationDate, 'yyyy-MM-dd HH:mm:ss EEEE')} (day ${notificationDate.getDay()})`);

    // Ne planifier que si la date est dans le futur et dans les MAX_DAYS_AHEAD jours
    const maxDate = addDays(now, this.MAX_DAYS_AHEAD);
    if (notificationDate > now && notificationDate < maxDate) {
      logger.log(`🔔 [NotificationService] Interval workout "${workout.name}": 1 date (${format(notificationDate, 'yyyy-MM-dd')})`);
      return [notificationDate];
    }

    logger.log(`🔔 [NotificationService] Interval workout "${workout.name}": no valid date`);
    return [];
  }

  /**
   * 📝 Ajouter des dates à la Map (en gérant les collisions)
   */
  private static addDatesToMap(
    map: Map<string, ScheduledNotificationDate>,
    dates: Date[],
    workout: Workout,
    type: 'weekly' | 'interval'
  ): void {
    for (const date of dates) {
      // ⚠️ FIX: Ne pas utiliser startOfDay() car cela peut causer des décalages
      // Utiliser directement format() sur la date qui a déjà l'heure à 09:00
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!map.has(dateKey)) {
        map.set(dateKey, {
          date,
          dateKey,
          workouts: [],
        });
      }

      map.get(dateKey)!.workouts.push({
        id: workout.id,
        name: workout.name,
        type,
      });
    }
  }

  /**
   * 🔔 Créer une notification pour une date donnée
   */
  private static async createNotificationForDate(scheduledDate: ScheduledNotificationDate): Promise<void> {
    try {
      let message: NotificationMessage;
      let notificationId: string;

      logger.log(`🔔 [DEBUG] createNotificationForDate:`);
      logger.log(`🔔 [DEBUG] - dateKey: ${scheduledDate.dateKey}`);
      logger.log(`🔔 [DEBUG] - date object: ${format(scheduledDate.date, 'yyyy-MM-dd HH:mm:ss EEEE')}`);
      logger.log(`🔔 [DEBUG] - date ISO: ${scheduledDate.date.toISOString()}`);
      logger.log(`🔔 [DEBUG] - workouts: ${scheduledDate.workouts.map(w => w.name).join(', ')}`);

      if (scheduledDate.workouts.length === 1) {
        // 📌 Un seul workout → notification avec le nom
        message = getRandomSingleWorkoutMessage(scheduledDate.workouts[0].name);
        notificationId = `workout_reminder_${scheduledDate.dateKey}`;
      } else {
        // 📌 Plusieurs workouts → notification mixte
        message = getRandomMultipleWorkoutsMessage();
        notificationId = `workout_reminder_mixed_${scheduledDate.dateKey}`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          data: {
            type: 'workout_reminder',
            date: scheduledDate.dateKey,
            workoutIds: scheduledDate.workouts.map(w => w.id),
          } as unknown as Record<string, unknown>,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: scheduledDate.date,
        },
        identifier: notificationId,
      });

      logger.log(`🔔 [NotificationService] ✅ Created notification for ${scheduledDate.dateKey} (${scheduledDate.workouts.length} workout(s))`);
    } catch (error) {
      logger.error(`🔔 [NotificationService] ❌ Failed to create notification for ${scheduledDate.dateKey}:`, error);
    }
  }

  /**
   * ❌ Annuler toutes les notifications de workout
   */
  private static async cancelAllWorkoutNotifications(): Promise<void> {
    try {
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
      let cancelledCount = 0;
      
      for (const notification of allNotifications) {
        const data = notification.content.data as unknown as NotificationData;
        if (data?.type === 'workout_reminder') {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          cancelledCount++;
        }
      }

      logger.log(`🔔 [NotificationService] ❌ Cancelled ${cancelledCount} workout notifications`);
    } catch (error) {
      logger.error('🔔 [NotificationService] ❌ Error cancelling notifications:', error);
    }
  }

  /**
   * 🔧 DEPRECATED: Cette fonction est maintenant gérée par scheduleWorkoutReminders()
   * Gardée pour compatibilité avec le code existant
   */
  static async scheduleIntervalWorkoutReminder(
    workoutId: string,
    workoutName: string,
    completionDate: Date,
    intervalDays: number
  ): Promise<void> {
    // Cette fonction appelle maintenant scheduleWorkoutReminders() pour tout replanifier
    logger.log(`🔔 [NotificationService] scheduleIntervalWorkoutReminder() deprecated, calling scheduleWorkoutReminders()`);
    await this.scheduleWorkoutReminders();
  }

  /**
   * DEPRECATED: Remplacé par scheduleWorkoutReminders()
   */
  private static getNextDateForDay(dayOfWeek: number, hour: number, minute: number): Date {
    const now = new Date();
    const targetDate = new Date(now);
    const currentDayOfWeek = now.getDay();
    let daysUntilTarget = (dayOfWeek - currentDayOfWeek + 7) % 7;
    if (daysUntilTarget === 0) {
      const todayAtTime = new Date(now);
      todayAtTime.setHours(hour, minute, 0, 0);
      if (todayAtTime <= now) {
        daysUntilTarget = 7;
      }
    }
    targetDate.setDate(now.getDate() + daysUntilTarget);
    targetDate.setHours(hour, minute, 0, 0);
    targetDate.setSeconds(0, 0);
    return targetDate;
  }

  /**
   * DEPRECATED: Remplacé par cancelAllWorkoutNotifications()
   */
  static async cancelWorkoutReminder(workoutId: string): Promise<void> {
    // Ne rien faire - les notifications seront recréées par scheduleWorkoutReminders()
    logger.log(`🔔 [NotificationService] cancelWorkoutReminder() deprecated`);
  }

  /**
   * DEPRECATED: Remplacé par cancelAllWorkoutNotifications()
   */
  static async cancelWeeklyWorkoutReminders(): Promise<void> {
    // Ne rien faire - les notifications seront recréées par scheduleWorkoutReminders()
    logger.log(`🔔 [NotificationService] cancelWeeklyWorkoutReminders() deprecated`);
  }

  /**
   * DEPRECATED: Remplacé par cancelAllWorkoutNotifications()
   */
  static async cancelAllWorkoutReminders(): Promise<void> {
    await this.cancelAllWorkoutNotifications();
  }

  /**
   * DEPRECATED
   */
  static async scheduleNotification(notification: ScheduledNotification): Promise<string | null> {
    logger.warn('🔔 [NotificationService] scheduleNotification() is deprecated');
    return null;
  }

  /**
   * DEPRECATED
   */
  private static async getNotificationForDate(dateKey: string): Promise<Notifications.NotificationRequest | null> {
    return null;
  }

  /**
   * 📜 Méthodes utilitaires (gardées pour compatibilité)
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
      logger.error(`🔔 [NotificationService] Error cancelling ${type} notifications:`, error);
    }
  }

  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      } catch (error) {
      logger.error('🔔 [NotificationService] ❌ Failed to cancel notification:', error);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      } catch (error) {
      logger.error('🔔 [NotificationService] ❌ Failed to cancel all notifications:', error);
    }
  }

  static async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    // Cette fonction n'est plus utilisée mais gardée pour compatibilité
    return [];
  }

  private static async saveScheduledNotification(notification: ScheduledNotification): Promise<void> {
    // Ne rien faire - on ne sauvegarde plus dans AsyncStorage
  }

  private static async removeScheduledNotification(notificationId: string): Promise<void> {
    // Ne rien faire - on ne sauvegarde plus dans AsyncStorage
  }

  static async getSettings(): Promise<NotificationSettings> {
    try {
      const data = await AsyncStorage.getItem(this.SETTINGS_KEY);
      return data ? { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(data) } : DEFAULT_NOTIFICATION_SETTINGS;
    } catch (error) {
      logger.error('🔔 [NotificationService] ❌ Failed to get settings:', error);
      return DEFAULT_NOTIFICATION_SETTINGS;
    }
  }

  static async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      } catch (error) {
      logger.error('🔔 [NotificationService] ❌ Failed to save settings:', error);
    }
  }

  static async cleanupExpiredNotifications(): Promise<void> {
    // Ne rien faire - les notifications expirées sont gérées par le système
  }

  static async getPermissionStatus(): Promise<string> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      logger.error('🔔 [NotificationService] ❌ Failed to get permission status:', error);
      return 'unknown';
    }
  }
}

export default NotificationService;
