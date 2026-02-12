import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Clipboard,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsService } from '../services/settingsService';
import { useNotifications } from '../hooks/useNotifications';

interface SettingsCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: 'RestTimerSettings' | 'NotificationSettings' | 'PrivacyPolicy';
  action?: () => void;
}

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { hasPermission } = useNotifications();
  const [defaultRestTimer, setDefaultRestTimer] = React.useState(180);
  const [workoutRemindersEnabled, setWorkoutRemindersEnabled] = React.useState(true);

  React.useEffect(() => {
    loadSettings();
  }, []);

  // Recharger les settings quand on revient sur cet écran
  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    const restTimer = await SettingsService.getDefaultRestTimer();
    const remindersEnabled = await SettingsService.getWorkoutRemindersEnabled();
    setDefaultRestTimer(restTimer);
    setWorkoutRemindersEnabled(remindersEnabled);
  };

  const formatRestTimer = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const getNotificationSubtitle = (): string => {
    if (!hasPermission) {
      return 'Permissions not granted';
    }
    return workoutRemindersEnabled
      ? 'Enabled for scheduled workouts'
      : 'Disabled';
  };

  const handleContactPress = () => {
    const email = 'joinpeakapp@gmail.com';
    Clipboard.setString(email);
    Alert.alert(
      'Email Copied! 📧',
      `${email} has been copied to your clipboard.\n\nYour feedback helps us improve Peak!`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const categories: SettingsCategory[] = [
    {
      id: 'rest-timer',
      title: 'Rest timer',
      subtitle: `Rest ${formatRestTimer(defaultRestTimer)} between sets`,
      icon: 'timer-outline',
      route: 'RestTimerSettings',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: getNotificationSubtitle(),
      icon: 'notifications-outline',
      route: 'NotificationSettings',
    },
    {
      id: 'contact',
      title: 'Contact & Feedback',
      subtitle: 'Send us your suggestions and feedback',
      icon: 'mail-outline',
      action: handleContactPress,
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      subtitle: 'How we handle your data',
      icon: 'shield-checkmark-outline',
      route: 'PrivacyPolicy',
    },
  ];

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
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>How to track workouts and metrics</Text>

        {/* Liste des catégories */}
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryItem}
              onPress={() => {
                if (category.action) {
                  category.action();
                } else if (category.route) {
                  // @ts-ignore - navigation type
                  navigation.navigate(category.route);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.categoryIcon}>
                <Ionicons name={category.icon} size={24} color="#FFFFFF" />
              </View>
              <View style={styles.categoryContent}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>
          ))}
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
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

