import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useEnhancedPersonalRecords } from '../hooks/useEnhancedPersonalRecords';
import { EnhancedPersonalRecord } from '../types/workout';
import { ProfileStackParamList } from '../types/navigation';

type ExerciseDetailRouteProp = RouteProp<ProfileStackParamList, 'ExerciseDetail'>;

export const ExerciseDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ExerciseDetailRouteProp>();
  const { exerciseName } = route.params;
  const { records, loadRecords } = useEnhancedPersonalRecords();
  const [exerciseRecord, setExerciseRecord] = useState<EnhancedPersonalRecord | null>(null);

  useEffect(() => {
    if (records && exerciseName) {
      setExerciseRecord(records[exerciseName] || null);
    }
  }, [records, exerciseName]);

  // Recharger les records lorsque l'écran est focalisé
  useFocusEffect(
    React.useCallback(() => {
      loadRecords();
    }, [loadRecords])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{exerciseName}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {exerciseRecord ? (
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
                <Text style={styles.weightValue}>{exerciseRecord.maxWeight}</Text>
                <Text style={styles.weightUnit}>kg</Text>
              </View>
              
              <Text style={styles.recordDate}>
                {new Date(exerciseRecord.maxWeightDate).toLocaleDateString('en-US', {
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric'
                })}
              </Text>
            </View>

            {/* Repetition Records by Weight */}
            <Text style={styles.sectionTitle}>Repetition Records by Weight</Text>
            
            {Object.entries(exerciseRecord.repsPerWeight)
              .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
              .map(([weight, repRecord]) => (
                <View key={weight} style={styles.repRecordCard}>
                  <View style={styles.repRecordHeader}>
                    <Text style={styles.repRecordWeight}>{weight} kg</Text>
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
        )}
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
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
    marginBottom: 16,
    marginTop: 8,
  },
  repRecordCard: {
    backgroundColor: '#1A1A1D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  repRecordHeader: {
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
}); 