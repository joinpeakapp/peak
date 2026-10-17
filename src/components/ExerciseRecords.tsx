import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PersonalRecord } from '../types/workout';

interface ExerciseRecordsProps {
  record: PersonalRecord | null;
  exerciseName: string;
  /** Shows a delete button on each repetition record when provided */
  onDeleteRepRecord?: (weight: string, reps: number) => void;
}

// Max weight + repetition records of an exercise. Shared by ExerciseDetailScreen and the in-workout records sheet.
export const ExerciseRecords: React.FC<ExerciseRecordsProps> = ({ record, exerciseName, onDeleteRepRecord }) => {
  const hasRecords = !!record && (record.maxWeight > 0 || Object.keys(record.repsPerWeight).length > 0);
  return (
    record && hasRecords ? (
      <>
        {/* Max Weight Record */}
        <View style={styles.recordCard}>
          <View style={styles.recordHeader}>
            <Text style={styles.recordTitle}>Max Weight</Text>
            <View style={styles.trophy}>
              <Ionicons name="trophy" size={18} color="#FFD700" />
            </View>
          </View>
          
          <View style={styles.weightContainer}>
            <Text style={styles.weightValue}>{record.maxWeight}</Text>
            <Text style={styles.weightUnit}>kg</Text>
          </View>
          
          <Text style={styles.recordDate}>
            {new Date(record.maxWeightDate).toLocaleDateString('en-US', {
              year: 'numeric', 
              month: 'short', 
              day: 'numeric'
            })}
          </Text>
        </View>

        {/* Repetition Records by Weight */}
        <Text style={styles.sectionTitle}>Repetition records by weight</Text>
        
        {Object.entries(record.repsPerWeight)
          .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
          .map(([weight, repRecord]) => (
            <View key={weight} style={styles.repRecordCard}>
              <View style={styles.repRecordHeader}>
                <Text style={styles.repRecordWeight}>{weight} kg</Text>
                {onDeleteRepRecord && (
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => onDeleteRepRecord(weight, repRecord.reps)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={18} color="#888888" />
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.repRecordInfo}>
                <View style={styles.repValue}>
                  <Text style={styles.repValueNumber}>{repRecord.reps}</Text>
                  <Text style={styles.repValueUnit}>reps</Text>
                </View>
                
                <Text style={styles.repRecordDate}>
                  {new Date(repRecord.date).toLocaleDateString('en-US', {
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </View>
          ))}
      </>
    ) : (
      <View style={styles.emptyState}>
        <Ionicons name="barbell-outline" size={48} color="#555555" />
        <Text style={styles.emptyStateText}>
          No records found for {exerciseName}
        </Text>
        <Text style={styles.emptyStateSubtext}>
          Complete workouts with this exercise to see your progress
        </Text>
      </View>
    )
  );
};

const styles = StyleSheet.create({
  recordCard: {
    backgroundColor: '#1A1A1D',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#AAAAAA',
  },
  trophy: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  weightUnit: {
    fontSize: 18,
    color: '#AAAAAA',
    marginLeft: 8,
  },
  recordDate: {
    fontSize: 14,
    color: '#888888',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 32,
    marginBottom: 16,
    marginLeft: 16,
  },
  repRecordCard: {
    backgroundColor: '#1A1A1D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  repRecordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  repRecordWeight: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  repRecordInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  repValueNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  repValueUnit: {
    fontSize: 14,
    color: '#AAAAAA',
    marginLeft: 6,
  },
  repRecordDate: {
    fontSize: 14,
    color: '#888888',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    maxWidth: '80%',
  },
  deleteButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
