import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Sticker } from '../../types/stickers';
import { StickerBadge } from './StickerBadge';

const { height } = Dimensions.get('window');
const ANIMATION_DURATION = 300;

interface StickerInfoBottomSheetProps {
  visible: boolean;
  sticker: Sticker | null;
  onClose: () => void;
}

// Informations explicatives pour chaque type de sticker
const stickerInfo: Record<string, { name: string; description: string }> = {
  '100%': {
    name: '100% Completion',
    description: 'You completed every single set you planned - no shortcuts, just pure dedication. Every rep counts!'
  },
  'PR': {
    name: 'Personal Record',
    description: 'You broke through your limits and achieved a new personal record! Whether it\'s lifting more weight or pushing harder, you\'ve proven you can go beyond what you thought was possible.'
  },
  '+1': {
    name: 'Rep Progress',
    description: 'You pushed extra reps today! Every additional rep builds strength and shows your commitment to improvement. Keep pushing those limits!'
  },
  'Streak': {
    name: 'Streak',
    description: 'You\'re building consistency! A streak shows your dedication to regular training. The longer your streak, the stronger your habit becomes.'
  },
  'Volume': {
    name: 'Volume Beast',
    description: 'You\'ve pushed more total volume than ever before! Volume (weight × reps × sets) is a key indicator of progress. You\'re getting stronger!'
  },
};

export const StickerInfoBottomSheet: React.FC<StickerInfoBottomSheetProps> = ({
  visible,
  sticker,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (visible && sticker) {
      setModalVisible(true);
      slideAnim.setValue(height);
      fadeAnim.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!visible && modalVisible) {
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
  }, [visible, sticker]);

  if (!sticker || !modalVisible) {
    return null;
  }

  const info = stickerInfo[sticker.name] || {
    name: sticker.name,
    description: 'Achievement unlocked!'
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.overlayTouchable,
              { opacity: fadeAnim },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Background de base */}
        <View style={styles.background} />
        
        {/* Content container */}
        <View style={styles.contentContainer}>
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            {/* Sticker display */}
            <View style={styles.stickerContainer}>
              <View style={styles.stickerWrapper}>
                <StickerBadge
                  sticker={sticker}
                  size="xxlarge"
                  showText={true}
                />
              </View>
            </View>

            {/* Sticker name */}
            <Text style={styles.stickerName}>{info.name}</Text>

            {/* Description */}
            <Text style={styles.description}>{info.description}</Text>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: height * 0.85,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D0D0F',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 24,
  },
  handleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  stickerContainer: {
    marginBottom: 20,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 0.6 }], // 120 / 200 = 0.6 pour réduire xxlarge (200px) à 120px
  },
  stickerName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    paddingHorizontal: 16,
    maxWidth: '90%',
  },
});
