export type NotificationType = 
  | 'workout_reminder';

export interface NotificationData {
  type: NotificationType;
  workoutId?: string;
  workoutName?: string;
  streakCount?: number;
  daysUntilLoss?: number;
  dayOfWeek?: number;
  date?: string; // Date au format YYYY-MM-DD pour les notifications de workout
}

export interface ScheduledNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  scheduledTime: Date;
  data?: NotificationData;
  recurring?: boolean;
  workoutId?: string;
}

export interface NotificationSettings {
  workoutReminders: {
    enabled: boolean;
    days: number[]; // 0 = Sunday, 1 = Monday, etc.
    time: string; // "HH:MM"
  };
  streakReminders: {
    enabled: boolean;
    time: string; // "HH:MM"
  };
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  workoutReminders: {
    enabled: false,
    days: [1, 3, 5], // Mon, Wed, Fri
    time: '09:00', // Toutes les notifications sont envoyées à 9h du matin
  },
  streakReminders: {
    enabled: false,
    time: '09:00', // Toutes les notifications sont envoyées à 9h du matin
  },
};
