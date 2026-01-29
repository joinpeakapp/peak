import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import NotificationService from '../../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../../utils/logger';

const NOTIFICATION_PERMISSION_SHOWN_KEY = '@peak_notification_permission_shown';

interface NotificationPermissionBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationPermissionBottomSheet: React.FC<NotificationPermissionBottomSheetProps> = ({
  visible,
  onClose,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%'], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleEnableNotifications = async () => {
    try {
      const granted = await NotificationService.initialize();
      
      if (granted) {
        logger.log('[NotificationBottomSheet] Notification permission granted');
      } else {
        logger.log('[NotificationBottomSheet] Notification permission denied');
      }
      
      // Marquer comme affiché
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_SHOWN_KEY, 'true');
      onClose();
    } catch (error) {
      logger.error('[NotificationBottomSheet] Error requesting notification permission:', error);
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_SHOWN_KEY, 'true');
      onClose();
    }
  };

  const handleMaybeLater = async () => {
    try {
      // Marquer comme affiché même si l'utilisateur refuse
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_SHOWN_KEY, 'true');
      logger.log('[NotificationBottomSheet] User chose to skip notifications');
      onClose();
    } catch (error) {
      logger.error('[NotificationBottomSheet] Error saving preference:', error);
      onClose();
    }
  };

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.7}
      pressBehavior="close"
    />
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <BottomSheetView style={styles.contentContainer}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="notifications" size={40} color="#FFFFFF" />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Stay on track with reminders</Text>

        {/* Description */}
        <Text style={styles.description}>
          Notifications are only used to remind you of your scheduled workouts. You can manage this anytime in Settings.
        </Text>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleEnableNotifications}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Enable notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleMaybeLater}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#1A1A1D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 40,
    height: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1000,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Poppins-SemiBold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 1000,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Poppins-Regular',
  },
});
