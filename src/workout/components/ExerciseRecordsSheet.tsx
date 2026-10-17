import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePersonalRecords } from '../../hooks/usePersonalRecords';
import { ExerciseRecords } from '../../components/ExerciseRecords';

interface ExerciseRecordsSheetProps {
  visible: boolean;
  exerciseName: string;
  onClose: () => void;
}

// Native iOS sheet over the workout: check your records without leaving the exercise (swipe down to close).
export const ExerciseRecordsSheet: React.FC<ExerciseRecordsSheetProps> = ({ visible, exerciseName, onClose }) => {
  const { records } = usePersonalRecords();
  const recordKey = Object.keys(records).find(key => key.toLowerCase().trim() === exerciseName.toLowerCase().trim());

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{exerciseName}</Text>
            <Text style={styles.subtitle}>Personal records · this session counts once you finish</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <ExerciseRecords record={recordKey ? records[recordKey] : null} exerciseName={exerciseName} />
        </ScrollView>
      </View>
    </Modal>
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
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#242526',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
});
