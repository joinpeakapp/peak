import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../hooks/useNotifications';
import NotificationService from '../services/notificationService';
import * as Notifications from 'expo-notifications';

const NotificationTestScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isInitialized, hasPermission, settings, scheduledNotifications } = useNotifications();
  const [allScheduledNotifications, setAllScheduledNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadScheduledNotifications();
  }, []);

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
          seconds: 2, // 2 secondes
        },
      });

      Alert.alert('Test Scheduled', `Notification will appear in 2 seconds (ID: ${notificationId})`);
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      Alert.alert('Error', 'Failed to schedule test notification');
    }
  };

  const testWorkoutReminders = async () => {
    try {
      await NotificationService.scheduleWorkoutReminders();
      await loadScheduledNotifications();
      Alert.alert('Success', 'Workout reminders scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling workout reminders:', error);
      Alert.alert('Error', 'Failed to schedule workout reminders');
    }
  };

  const testStreakReminder = async () => {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      await NotificationService.scheduleStreakReminder(
        'test-workout-id',
        'Test Workout',
        today.toISOString().split('T')[0],
        3 // 3 jours de fréquence
      );
      
      await loadScheduledNotifications();
      Alert.alert('Success', 'Streak reminder scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling streak reminder:', error);
      Alert.alert('Error', 'Failed to schedule streak reminder');
    }
  };

  const clearAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await loadScheduledNotifications();
      Alert.alert('Success', 'All notifications cleared!');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      Alert.alert('Error', 'Failed to clear notifications');
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'workout_reminder':
        return '#007AFF';
      case 'streak_reminder':
        return '#FF6B35';
      case 'test':
        return '#34C759';
      default:
        return '#666';
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Test</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.statusText}>Initializing notifications...</Text>
        </View>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Test</Text>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="notifications-off" size={64} color="#ccc" />
          <Text style={styles.statusText}>Notifications not permitted</Text>
          <Text style={styles.statusSubtext}>
            Please enable notifications in the settings first
          </Text>
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
        <Text style={styles.headerTitle}>Notification Test</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Initialized:</Text>
            <Text style={[styles.statusValue, { color: isInitialized ? '#34C759' : '#FF3B30' }]}>
              {isInitialized ? '✅ Yes' : '❌ No'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Permission:</Text>
            <Text style={[styles.statusValue, { color: hasPermission ? '#34C759' : '#FF3B30' }]}>
              {hasPermission ? '✅ Granted' : '❌ Denied'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Workout reminders:</Text>
            <Text style={[styles.statusValue, { color: settings?.workoutReminders.enabled ? '#34C759' : '#666' }]}>
              {settings?.workoutReminders.enabled ? '✅ Enabled' : '⭕ Disabled'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Streak reminders:</Text>
            <Text style={[styles.statusValue, { color: settings?.streakReminders.enabled ? '#34C759' : '#666' }]}>
              {settings?.streakReminders.enabled ? '✅ Enabled' : '⭕ Disabled'}
            </Text>
          </View>
        </View>

        {/* Test Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Actions</Text>
          
          <TouchableOpacity style={[styles.testButton, { backgroundColor: '#34C759' }]} onPress={testImmediateNotification}>
            <Ionicons name="notifications" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Test Immediate Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.testButton, { backgroundColor: '#007AFF' }]} onPress={testWorkoutReminders}>
            <Ionicons name="fitness" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Schedule Workout Reminders</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.testButton, { backgroundColor: '#FF6B35' }]} onPress={testStreakReminder}>
            <Ionicons name="flame" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Schedule Test Streak Reminder</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.testButton, { backgroundColor: '#FF3B30' }]} onPress={clearAllNotifications}>
            <Ionicons name="trash" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Clear All Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testButton, { backgroundColor: '#666' }]} 
            onPress={loadScheduledNotifications}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.testButtonText}>Refresh List</Text>
          </TouchableOpacity>
        </View>

        {/* Scheduled Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Scheduled Notifications ({allScheduledNotifications.length})
          </Text>
          
          {allScheduledNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No scheduled notifications</Text>
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
                    <Text style={styles.notificationId}>ID: {notification.identifier}</Text>
                    <Text style={styles.notificationDate}>
                      {triggerDate ? triggerDate.toLocaleString() : 'No date'}
                    </Text>
                    <Text style={styles.notificationType}>Type: {type}</Text>
                  </View>
                </View>
              );
            })
          )}
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    marginTop: 20,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#000',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 12,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  notificationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  typeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
    marginTop: 4,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  notificationMeta: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  notificationId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  notificationDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  notificationType: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export { NotificationTestScreen };
export default NotificationTestScreen;
