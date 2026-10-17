import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import NotificationService from '../services/notificationService';
import { NotificationSettings, ScheduledNotification } from '../types/notifications';
import logger from '../utils/logger';

export const useNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);

  // Initialiser le service
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const success = await NotificationService.initialize();
        setIsInitialized(true); // Toujours mettre à true même si initialize échoue
        
        if (success) {
          const status = await NotificationService.getPermissionStatus();
          setPermissionStatus(status);
          
          const userSettings = await NotificationService.getSettings();
          setSettings(userSettings);
          
          const scheduled = await NotificationService.getScheduledNotifications();
          setScheduledNotifications(scheduled);
          
          // Nettoyer les notifications expirées
          await NotificationService.cleanupExpiredNotifications();
        } else {
          // Si l'initialisation échoue, vérifier quand même le statut de permission
          const status = await NotificationService.getPermissionStatus();
          setPermissionStatus(status);
        }
      } catch (error) {
        logger.error('[useNotifications] Error initializing:', error);
        setIsInitialized(true); // Mettre à true pour éviter le loading infini
        // Essayer de récupérer le statut de permission même en cas d'erreur
        try {
          const status = await NotificationService.getPermissionStatus();
          setPermissionStatus(status);
        } catch (e) {
          logger.error('[useNotifications] Error getting permission status:', e);
        }
      }
    };

    initializeNotifications();
  }, []);

  // Recharger les settings et vérifier le statut des permissions
  const reloadSettings = useCallback(async () => {
    if (isInitialized) {
      const status = await NotificationService.getPermissionStatus();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        const userSettings = await NotificationService.getSettings();
        setSettings(userSettings);
        
        const scheduled = await NotificationService.getScheduledNotifications();
        setScheduledNotifications(scheduled);
      }
    }
  }, [isInitialized]);

  // Écouter les changements de permissions
  useEffect(() => {
    const checkPermissions = async () => {
      if (isInitialized) {
        const status = await NotificationService.getPermissionStatus();
        if (status !== permissionStatus) {
          setPermissionStatus(status);
          await reloadSettings();
        }
      }
    };

    // Vérifier périodiquement si pas encore accordées
    if (isInitialized && permissionStatus !== 'granted') {
      const interval = setInterval(checkPermissions, 2000);
      return () => clearInterval(interval);
    }
  }, [isInitialized, permissionStatus, reloadSettings]);

  // Écouter les notifications reçues
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      // Ici on peut ajouter la navigation ou autres actions
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  // Planifier une notification
  const scheduleNotification = useCallback(async (notification: ScheduledNotification) => {
    if (!isInitialized) {
      logger.warn('🔔 [useNotifications] Service not initialized');
      return null;
    }

    const notificationId = await NotificationService.scheduleNotification(notification);
    
    if (notificationId) {
      // Mettre à jour la liste locale
      const updated = await NotificationService.getScheduledNotifications();
      setScheduledNotifications(updated);
    }
    
    return notificationId;
  }, [isInitialized]);

  // Annuler une notification
  const cancelNotification = useCallback(async (notificationId: string) => {
    if (!isInitialized) {
      logger.warn('🔔 [useNotifications] Service not initialized');
      return;
    }

    await NotificationService.cancelNotification(notificationId);
    
    // Mettre à jour la liste locale
    const updated = await NotificationService.getScheduledNotifications();
    setScheduledNotifications(updated);
  }, [isInitialized]);

  // Annuler toutes les notifications d'un type
  const cancelNotificationsByType = useCallback(async (type: string) => {
    if (!isInitialized) {
      logger.warn('🔔 [useNotifications] Service not initialized');
      return;
    }

    await NotificationService.cancelNotificationsByType(type as any);
    
    // Mettre à jour la liste locale
    const updated = await NotificationService.getScheduledNotifications();
    setScheduledNotifications(updated);
  }, [isInitialized]);

  // Sauvegarder les paramètres
  const saveSettings = useCallback(async (newSettings: NotificationSettings) => {
    if (!isInitialized) {
      logger.warn('🔔 [useNotifications] Service not initialized');
      return;
    }

    await NotificationService.saveSettings(newSettings);
    setSettings(newSettings);
  }, [isInitialized]);

  // Demander les permissions
  const requestPermissions = useCallback(async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      
      // Si la permission est accordée, mettre à jour les settings et replanifier
      if (status === 'granted') {
        const userSettings = await NotificationService.getSettings();
        setSettings(userSettings);
        
        const scheduled = await NotificationService.getScheduledNotifications();
        setScheduledNotifications(scheduled);
      }
      
      return status === 'granted';
    } catch (error) {
      logger.error('[useNotifications] Failed to request permissions:', error);
      return false;
    }
  }, []);

  // Planifier les rappels d'entraînement
  const scheduleWorkoutReminders = useCallback(async () => {
    if (!isInitialized) {
      logger.warn('🔔 [useNotifications] Service not initialized');
      return;
    }

    await NotificationService.scheduleWorkoutReminders();
    
    // Mettre à jour la liste locale
    const updated = await NotificationService.getScheduledNotifications();
    setScheduledNotifications(updated);
  }, [isInitialized]);

  return {
    // État
    isInitialized,
    permissionStatus: permissionStatus as 'granted' | 'denied' | 'unknown',
    settings,
    scheduledNotifications,
    hasPermission: permissionStatus === 'granted',

    // Actions
    scheduleNotification,
    cancelNotification,
    cancelNotificationsByType,
    saveSettings,
    requestPermissions,
    scheduleWorkoutReminders,
    reloadSettings,
  };
};
