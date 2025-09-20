import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationService from '../../services/notificationService';
import * as Notifications from 'expo-notifications';

const { height } = Dimensions.get('window');
const ANIMATION_DURATION = 300;

interface NotificationTestModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationTestModal: React.FC<NotificationTestModalProps> = ({
  visible,
  onClose,
}) => {
  const { isInitialized, hasPermission, settings } = useNotifications();
  const [allScheduledNotifications, setAllScheduledNotifications] = useState<any[]>([]);
  
  // Animation values
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      loadScheduledNotifications();
    }
  }, [visible]);

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

  const loadScheduledNotifications = async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      setAllScheduledNotifications(notifications);
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
    }
  };

  const testImmediateNotification = async () => {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'This is a test notification from Peak!',
          data: { type: 'test' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });

      Alert.alert('Test planifié', `Notification dans 2 secondes (ID: ${notificationId})`);
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      Alert.alert('Erreur', 'Impossible de planifier la notification de test');
    }
  };

  const testWorkoutReminders = async () => {
    try {
      await NotificationService.scheduleWorkoutReminders();
      await loadScheduledNotifications();
      Alert.alert('Succès', 'Rappels d\'entraînement planifiés !');
    } catch (error) {
      console.error('Error scheduling workout reminders:', error);
      Alert.alert('Erreur', 'Impossible de planifier les rappels d\'entraînement');
    }
  };

  const testStreakReminder = async () => {
    try {
      const today = new Date();
      await NotificationService.scheduleStreakReminder(
        'test-workout-id',
        'Test Workout',
        today.toISOString().split('T')[0],
        3
      );
      
      await loadScheduledNotifications();
      Alert.alert('Succès', 'Rappel de streak planifié !');
    } catch (error) {
      console.error('Error scheduling streak reminder:', error);
      Alert.alert('Erreur', 'Impossible de planifier le rappel de streak');
    }
  };

  const clearAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await loadScheduledNotifications();
      Alert.alert('Succès', 'Toutes les notifications supprimées !');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      Alert.alert('Erreur', 'Impossible de supprimer les notifications');
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'workout_reminder':
        return '#34C759';
      case 'streak_reminder':
        return '#FF6B35';
      case 'test':
        return '#007AFF';
      default:
        return '#666';
    }
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
            <Text style={styles.headerTitle}>Test Notifications</Text>
            <TouchableOpacity onPress={loadScheduledNotifications} style={styles.refreshButton}>
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {!isInitialized ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Initialisation...</Text>
            </View>
          ) : !hasPermission ? (
            <View style={styles.permissionContainer}>
              <Ionicons name="notifications-off" size={64} color="#666" />
              <Text style={styles.permissionTitle}>Permissions manquantes</Text>
              <Text style={styles.permissionText}>
                Activez d'abord les notifications dans les paramètres
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Status */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status</Text>
                <View style={styles.statusGrid}>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Initialisé</Text>
                    <Text style={[styles.statusValue, { color: isInitialized ? '#34C759' : '#FF453A' }]}>
                      {isInitialized ? '✅' : '❌'}
                    </Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Permissions</Text>
                    <Text style={[styles.statusValue, { color: hasPermission ? '#34C759' : '#FF453A' }]}>
                      {hasPermission ? '✅' : '❌'}
                    </Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Rappels workout</Text>
                    <Text style={[styles.statusValue, { color: settings?.workoutReminders.enabled ? '#34C759' : '#666' }]}>
                      {settings?.workoutReminders.enabled ? '✅' : '⭕'}
                    </Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Rappels streak</Text>
                    <Text style={[styles.statusValue, { color: settings?.streakReminders.enabled ? '#34C759' : '#666' }]}>
                      {settings?.streakReminders.enabled ? '✅' : '⭕'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Test Actions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actions de test</Text>
                
                <TouchableOpacity style={[styles.testButton, { backgroundColor: '#007AFF' }]} onPress={testImmediateNotification}>
                  <Ionicons name="notifications" size={18} color="#fff" />
                  <Text style={styles.testButtonText}>Test immédiat (2s)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.testButton, { backgroundColor: '#34C759' }]} onPress={testWorkoutReminders}>
                  <Ionicons name="fitness" size={18} color="#fff" />
                  <Text style={styles.testButtonText}>Planifier rappels workout</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.testButton, { backgroundColor: '#FF6B35' }]} onPress={testStreakReminder}>
                  <Ionicons name="flame" size={18} color="#fff" />
                  <Text style={styles.testButtonText}>Planifier rappel streak</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.testButton, { backgroundColor: '#FF453A' }]} onPress={clearAllNotifications}>
                  <Ionicons name="trash" size={18} color="#fff" />
                  <Text style={styles.testButtonText}>Supprimer toutes</Text>
                </TouchableOpacity>
              </View>

              {/* Scheduled Notifications */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Notifications planifiées ({allScheduledNotifications.length})
                </Text>
                
                {allScheduledNotifications.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="notifications-outline" size={48} color="#666" />
                    <Text style={styles.emptyText}>Aucune notification planifiée</Text>
                  </View>
                ) : (
                  allScheduledNotifications.map((notification, index) => {
                    const data = notification.content.data || {};
                    const type = data.type || 'unknown';
                    const triggerDate = notification.trigger?.date ? new Date(notification.trigger.date) : null;
                    
                    return (
                      <View key={index} style={styles.notificationCard}>
                        <View style={styles.notificationHeader}>
                          <View style={[styles.typeIndicator, { backgroundColor: getNotificationTypeColor(type) }]} />
                          <View style={styles.notificationInfo}>
                            <Text style={styles.notificationTitle}>{notification.content.title}</Text>
                            <Text style={styles.notificationBody}>{notification.content.body}</Text>
                          </View>
                        </View>
                        <View style={styles.notificationMeta}>
                          <Text style={styles.notificationDate}>
                            {triggerDate ? triggerDate.toLocaleString() : 'Pas de date'}
                          </Text>
                          <Text style={styles.notificationType}>{type}</Text>
                        </View>
                      </View>
                    );
                  })
                )}
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1A1A1D',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#888888',
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  notificationCard: {
    backgroundColor: '#1A1A1D',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#34C759',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    marginTop: 4,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  notificationBody: {
    fontSize: 12,
    color: '#888888',
    lineHeight: 16,
  },
  notificationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  notificationDate: {
    fontSize: 10,
    color: '#666',
  },
  notificationType: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
});

export default NotificationTestModal;
