import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { usePersonalRecords } from '../hooks/usePersonalRecords';
import { PersonalRecord } from '../types/workout';
import { ProfileStackParamList } from '../types/navigation';
import { PRDeleteModal } from '../components/common/PRDeleteModal';
import { ExerciseRecords } from '../components/ExerciseRecords';

type ExerciseDetailRouteProp = RouteProp<ProfileStackParamList, 'ExerciseDetail'>;

export const ExerciseDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ExerciseDetailRouteProp>();
  const { exerciseName } = route.params;
  const { records, loadRecords, loading, deleteRepRecord, deleteAllRecordsForExercise } = usePersonalRecords();
  const [exerciseRecord, setExerciseRecord] = useState<PersonalRecord | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteModalData, setDeleteModalData] = useState<{
    weight?: string;
    reps?: number;
    isAllRecords: boolean;
  }>({ isAllRecords: false });

  useEffect(() => {
    if (records && exerciseName) {
      // Essayer une correspondance exacte d'abord
      let record = records[exerciseName];
      
      // Si pas de correspondance exacte, essayer une correspondance fuzzy
      if (!record) {
        // Chercher des noms similaires (insensible à la casse et aux espaces)
        const normalizedSearchName = exerciseName.toLowerCase().trim();
        const matchingKey = Object.keys(records).find(key => 
          key.toLowerCase().trim() === normalizedSearchName
        );
        
        if (matchingKey) {
          record = records[matchingKey];
        }
      }
      
      // En mode développement, afficher toutes les clés disponibles pour diagnostic
      if (__DEV__ && !record) {
        Object.keys(records).forEach(key => {
          });
        }
      
      setExerciseRecord(record || null);
    }
  }, [records, exerciseName]);

  // Recharger les records lorsque l'écran est focalisé
  useFocusEffect(
    React.useCallback(() => {
      loadRecords();
    }, [loadRecords])
  );

  // Gestion du long press sur un record spécifique
  const handleLongPressRecord = (weight: string, reps: number) => {
    setDeleteModalData({
      weight,
      reps,
      isAllRecords: false
    });
    setDeleteModalVisible(true);
  };

  // Confirmation de suppression
  const handleConfirmDelete = async () => {
    try {
      if (deleteModalData.weight) {
        // Supprimer un record spécifique
        await deleteRepRecord(exerciseName, deleteModalData.weight);
        Alert.alert('Success', 'Record deleted successfully.');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      Alert.alert(
        'Error',
        'Failed to delete record. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDeleteModalVisible(false);
      setDeleteModalData({ isAllRecords: false });
    }
  };

  // Reset de toutes les données de l'exercice (la séance en cours est prévenue via usePersonalRecords)
  const handleResetExercise = () => {
    Alert.alert(
      `Reset ${exerciseName}?`,
      'This deletes your max weight and all repetition records for this exercise. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllRecordsForExercise(exerciseRecord?.exerciseName ?? exerciseName);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to reset this exercise. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Fermer la modale
  const handleCloseModal = () => {
    setDeleteModalVisible(false);
    setDeleteModalData({ isAllRecords: false });
  };

  // Afficher un état de chargement
  if (loading) {
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
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading records...</Text>
        </View>
      </View>
    );
  }

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
        {exerciseRecord ? (
          <TouchableOpacity style={styles.resetButton} onPress={handleResetExercise} activeOpacity={0.7}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        <ExerciseRecords
          record={exerciseRecord}
          exerciseName={exerciseName}
          onDeleteRepRecord={handleLongPressRecord}
        />
      </ScrollView>

      <PRDeleteModal
        visible={deleteModalVisible}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        exerciseName={exerciseName}
        weight={deleteModalData.weight}
        reps={deleteModalData.reps}
      />
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
  resetButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF453A',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0F',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 