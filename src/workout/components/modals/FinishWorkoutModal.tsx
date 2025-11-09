import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';

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
      <View style={styles.modalOverlay}>
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
          <View style={styles.modalIndicator} />
          
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Finish workout</Text>
            
            <View style={styles.modalOptionsContainer}>
              <TouchableOpacity 
                style={[styles.modalOption, styles.discardOption]}
                onPress={onDiscard}
                activeOpacity={0.7}
              >
                <Text style={styles.modalOptionText}>Discard</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalOption, styles.logOption]}
                onPress={onLogWorkout}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalOptionText, styles.logOptionText]}>Log workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
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
  modalIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  modalContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 32,
    textAlign: 'center',
  },
  modalOptionsContainer: {
    width: '100%',
    gap: 12,
  },
  modalOption: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  discardOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logOption: {
    backgroundColor: '#FFFFFF',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  logOptionText: {
    color: '#000000',
  },
});

