import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useEnhancedPersonalRecords } from '../../hooks/useEnhancedPersonalRecords';
import { EnhancedPersonalRecords } from '../../types/workout';
import { StorageService } from '../../services/storage';

/**
 * Écran de débogage pour visualiser les records personnels
 */
export const RecordsDebugScreen = () => {
  const { records, loadRecords } = useEnhancedPersonalRecords();
  const [recordsData, setRecordsData] = useState<EnhancedPersonalRecords>({});

  useEffect(() => {
    setRecordsData(records);
  }, [records]);

  const refreshRecords = async () => {
    await loadRecords();
    Alert.alert('Success', 'Records refreshed');
  };

  const clearAllRecords = async () => {
    Alert.alert(
      'Clear All Records',
      'Are you sure you want to delete all your personal records? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await StorageService.saveEnhancedPersonalRecords({});
            await loadRecords();
            Alert.alert('Success', 'All records cleared');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personal Records Debug</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={refreshRecords}>
          <Text style={styles.buttonText}>Refresh Records</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearAllRecords}>
          <Text style={styles.buttonText}>Clear All Records</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {Object.keys(recordsData).length === 0 ? (
          <Text style={styles.emptyText}>No records found</Text>
        ) : (
          Object.entries(recordsData).map(([exerciseName, record]) => (
            <View key={exerciseName} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{exerciseName}</Text>
              <Text style={styles.recordText}>
                Max Weight: {record.maxWeight}kg (on {new Date(record.maxWeightDate).toLocaleDateString()})
              </Text>
              
              <Text style={styles.subtitle}>Repetition Records by Weight:</Text>
              
              {Object.entries(record.repsPerWeight).map(([weight, repRecord]) => (
                <View key={weight} style={styles.repRecord}>
                  <Text style={styles.recordText}>
                    {weight}kg: {repRecord.reps} reps (on {new Date(repRecord.date).toLocaleDateString()})
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 44,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyText: {
    color: '#999999',
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
  },
  exerciseCard: {
    backgroundColor: '#242426',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  recordText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  repRecord: {
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#444444',
    marginBottom: 4,
  },
}); 