import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import NotificationService from '../../services/notificationService';

interface NotificationPermissionScreenProps {
  onContinue: () => void;
}

export const NotificationPermissionScreen: React.FC<NotificationPermissionScreenProps> = ({
  onContinue,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkPermissionStatus();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const checkPermissionStatus = async () => {
    const status = await NotificationService.getPermissionStatus();
    setPermissionStatus(status);
    
    if (status === 'granted') {
      setTimeout(() => {
        onContinue();
      }, 1000);
    }
  };

  const handleRequestPermission = async () => {
    try {
      const granted = await NotificationService.initialize();
      
      if (granted) {
        setPermissionStatus('granted');
        setTimeout(() => {
          onContinue();
        }, 500);
      } else {
        setPermissionStatus('denied');
        Alert.alert(
          'Notifications disabled',
          'You can enable notifications later in the app settings.',
          [
            {
              text: 'Continue anyway',
              onPress: onContinue,
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      Alert.alert('Error', 'An error occurred while requesting permission.');
    }
  };

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      handleRequestPermission();
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Content */}
      <Animated.View
        style={[
          styles.topContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={80} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>Never miss a workout</Text>
        <Text style={styles.description}>
          Notifications help us remind you of your planned sessions and keep you motivated to stay consistent.
        </Text>

        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.benefitText}>Workout reminders</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.benefitText}>Streak alerts</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.benefitText}>Daily motivation</Text>
          </View>
        </View>
      </Animated.View>

      {/* Bottom Button */}
      <Animated.View
        style={[
          styles.bottomSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Animated.View style={{ width: '100%', transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity style={styles.button} onPress={handlePress}>
            <Text style={styles.buttonText}>Enable notifications</Text>
          </TouchableOpacity>
        </Animated.View>

        {permissionStatus === 'denied' && (
          <TouchableOpacity style={styles.skipButton} onPress={onContinue}>
            <Text style={styles.skipButtonText}>Skip this step</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  topContent: {
    paddingTop: 120,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 48,
    opacity: 0.7,
  },
  benefitsContainer: {
    width: '100%',
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Regular',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 48,
    left: 40,
    right: 40,
    alignItems: 'stretch',
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1000,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins-SemiBold',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Poppins-Regular',
  },
});
