import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

interface FinishWorkoutModalProps {
  visible: boolean;
  slideAnim: Animated.Value;
  onClose: () => void;
  onDiscard: () => void;
  onLogWorkout: () => void;
}

export const FinishWorkoutModal: React.FC<FinishWorkoutModalProps> = ({
  visible,
  slideAnim,
  onClose,
  onDiscard,
  onLogWorkout,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [300, 0]
                })
              }]
            }
          ]}
        >
          <View style={styles.handle} />
          
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name="checkmark-circle" 
                size={32} 
                color="#FFFFFF" 
              />
            </View>
            
            <Text style={styles.title}>Finish workout</Text>
            <Text style={styles.message}>
              Would you like to save this session to your history or discard it?
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.discardButton]}
                onPress={onDiscard}
                activeOpacity={0.7}
              >
                <Text style={styles.discardButtonText}>Discard</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.logButton]}
                onPress={onLogWorkout}
                activeOpacity={0.7}
              >
                <Text style={styles.logButtonText}>Log workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    minHeight: 280,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discardButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logButton: {
    backgroundColor: '#FFFFFF',
  },
  discardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
