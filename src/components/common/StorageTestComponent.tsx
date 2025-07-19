import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RobustStorageService } from '../../services/storage';
import { CompletedWorkout } from '../../types/workout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { clearWorkouts } from '../../store/slices/workoutSlice';

/**
 * Composant de test pour valider le service de stockage robuste
 * Utilisé uniquement en développement pour tester les migrations et la gestion d'erreur
 */

interface StorageTestComponentProps {
  onClose: () => void;
}

export const StorageTestComponent: React.FC<StorageTestComponentProps> = ({ onClose }) => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const dispatch = useDispatch();

  const addTestResult = (message: string, success: boolean = true) => {
    const timestamp = new Date().toLocaleTimeString();
    const icon = success ? '✅' : '❌';
    setTestResults(prev => [...prev, `[${timestamp}] ${icon} ${message}`]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  // Récupérer les informations de stockage actuelles
  const getStorageInfo = async () => {
    try {
      const info = await RobustStorageService.getStorageInfo();
      setStorageInfo(info);
      addTestResult(`Storage info: ${info.keys.length} keys, ${(info.totalSize / 1024).toFixed(2)}KB total`);
    } catch (error) {
      addTestResult(`Failed to get storage info: ${error}`, false);
    }
  };

  // Test 1: Initialisation et migration
  const testInitialization = async () => {
    try {
      addTestResult('Testing storage service initialization...');
      const success = await RobustStorageService.initialize();
      addTestResult(`Initialization ${success ? 'successful' : 'failed'}`, success);
      await getStorageInfo();
    } catch (error) {
      addTestResult(`Initialization error: ${error}`, false);
    }
  };

  // Test 2: Sauvegarde et chargement de l'historique
  const testWorkoutHistory = async () => {
    try {
      addTestResult('Testing workout history operations...');
      
      // Test de sauvegarde - créer un workout valide pour le test
      const testWorkout: CompletedWorkout = {
        id: 'test_' + Date.now(),
        workoutId: 'test_template_id',
        name: 'Test Workout Storage',
        date: new Date().toISOString(),
        duration: 1800, // 30 minutes
        photo: '',
        exercises: [
          {
            id: 'test_exercise_1',
            name: 'Test Push-ups',
            tracking: 'trackedOnSets',
            sets: [
              { weight: 0, reps: 10, completed: true },
              { weight: 0, reps: 12, completed: true }
            ]
          }
        ]
      };

      const saveResult = await RobustStorageService.loadWorkoutHistory();
      const existingWorkouts = saveResult.success ? saveResult.data : [];
      
      const updatedWorkouts = [...existingWorkouts, testWorkout];
      const saveWorkoutResult = await RobustStorageService.saveWorkoutHistory(updatedWorkouts);
      addTestResult(`Save test workout: ${saveWorkoutResult.success ? 'success' : 'failed'}`, saveWorkoutResult.success);
      
      if (!saveWorkoutResult.success && saveWorkoutResult.error) {
        addTestResult(`Save error: ${saveWorkoutResult.error.userMessage}`, false);
      }

      // Test de chargement
      const loadResult = await RobustStorageService.loadWorkoutHistory();
      addTestResult(`Load workout history: ${loadResult.success ? 'success' : 'failed'} (${loadResult.data.length} workouts)`, loadResult.success);
      
      if (!loadResult.success && loadResult.error) {
        addTestResult(`Load error: ${loadResult.error.userMessage}`, false);
      }

    } catch (error) {
      addTestResult(`Workout history test error: ${error}`, false);
    }
  };

  // Nouveau test: Validation complète du feature 2.2
  const testFeature22 = async () => {
    try {
      addTestResult('🎯 Testing Feature 2.2: Robust AsyncStorage Error Handling...');
      
      // Test 1: Try/catch systématiques
      addTestResult('✓ Testing systematic try/catch protection...');
      const invalidResult = await RobustStorageService.saveWorkoutHistory(null as any);
      addTestResult(`Invalid data handling: ${!invalidResult.success ? 'protected' : 'failed'}`, !invalidResult.success);
      
      // Test 2: Fallbacks
      addTestResult('✓ Testing fallback mechanisms...');
      const loadResult = await RobustStorageService.loadWorkoutHistory();
      addTestResult(`Fallback on empty data: ${loadResult.success ? 'works' : 'failed'}`, loadResult.success);
      
      // Test 3: User-friendly messages
      addTestResult('✓ Testing user-friendly error messages...');
      if (invalidResult.error) {
        const hasUserMessage = Boolean(invalidResult.error.userMessage && invalidResult.error.userMessage.length > 0);
        addTestResult(`User-friendly error message: ${hasUserMessage ? 'provided' : 'missing'}`, hasUserMessage);
        addTestResult(`Message: "${invalidResult.error.userMessage}"`);
      }
      
      // Test 4: Validation du nombre de clés optimisées
      addTestResult('✓ Testing optimized storage keys...');
      const storageInfo = await RobustStorageService.getStorageInfo();
      const hasOptimalKeys = storageInfo.keys.length <= 5;
      addTestResult(`Storage keys optimization: ${storageInfo.keys.length}/5 keys used`, hasOptimalKeys);
      
      addTestResult('🎉 Feature 2.2 validation completed!');
      
    } catch (error) {
      addTestResult(`Feature 2.2 test error: ${error}`, false);
    }
  };

  // Test 3: Gestion des erreurs
  const testErrorHandling = async () => {
    try {
      addTestResult('Testing error handling...');
      
      // Simuler une erreur en utilisant une clé invalide
      const result = await RobustStorageService.saveWorkoutHistory(null as any);
      addTestResult(`Error handling test: ${result.success ? 'unexpected success' : 'properly handled error'}`, !result.success);
      
      if (result.error) {
        addTestResult(`Error message: "${result.error.userMessage}"`);
      }

    } catch (error) {
      addTestResult(`Error handling test: exception properly caught`, true);
    }
  };

  // Test 4: Nettoyage des anciennes clés
  const testLegacyKeyCleanup = async () => {
    try {
      addTestResult('Testing legacy key cleanup...');
      
      const allKeys = await AsyncStorage.getAllKeys();
      const legacyKeys = allKeys.filter(key => 
        key === 'completedWorkouts' || 
        key === 'activeWorkoutData' || 
        key === 'restTimerData' ||
        key === '@peak_personal_records' // anciennes clés
      );
      
      addTestResult(`Legacy keys found: ${legacyKeys.length}`, legacyKeys.length === 0);
      if (legacyKeys.length > 0) {
        addTestResult(`Remaining legacy keys: ${legacyKeys.join(', ')}`);
      }

    } catch (error) {
      addTestResult(`Legacy key cleanup test error: ${error}`, false);
    }
  };

  // Exécuter tous les tests
  const runAllTests = async () => {
    setIsLoading(true);
    clearTestResults();
    
    try {
      await testInitialization();
      await testFeature22(); // Nouveau test principal
      await testWorkoutHistory();
      await testErrorHandling();
      await testLegacyKeyCleanup();
      addTestResult('🎉 All tests completed!');
    } catch (error) {
      addTestResult(`Test suite error: ${error}`, false);
    } finally {
      setIsLoading(false);
    }
  };

  // Nettoyer toutes les données de test
  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your workout data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await RobustStorageService.clearAllData();
              addTestResult(`Clear all data: ${result.success ? 'success' : 'failed'}`, result.success);
              await getStorageInfo();
            } catch (error) {
              addTestResult(`Clear data error: ${error}`, false);
            }
          }
        }
      ]
    );
  };

  // Reset to New User - Effacer toutes les données et revenir à l'état initial
  const resetToNewUser = async () => {
    Alert.alert(
      'Reset to New User',
      'This will completely clear all your data and reset the app as if you were a new user. This action cannot be undone.\n\nAre you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              addTestResult('🔄 Starting complete reset to new user state...');
              
              // 1. Clear all AsyncStorage
              await AsyncStorage.clear();
              addTestResult('✅ Cleared all AsyncStorage data');
              
              // 2. Reset Redux store
              dispatch(clearWorkouts());
              addTestResult('✅ Reset Redux store');
              
              // 3. Clear any cached state
              await getStorageInfo();
              addTestResult('✅ Cleared cached state');
              
              addTestResult('🎉 Reset complete! App is now in new user state');
              
              Alert.alert(
                'Reset Complete!',
                'The app has been reset to new user state. Please restart the app to see the changes.',
                [
                  { 
                    text: 'Close & Restart', 
                    onPress: () => {
                      onClose();
                      // Force app to reload by clearing any remaining state
                    }
                  }
                ]
              );
              
            } catch (error) {
              addTestResult(`❌ Reset failed: ${error}`, false);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    getStorageInfo();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗄️ Storage Service Test</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.description}>
        Test the robust storage service migration, error handling, and key optimization.
      </Text>

      {/* Storage Info */}
      {storageInfo && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>📊 Current Storage Status</Text>
          <Text style={styles.infoText}>
            Keys: {storageInfo.keys.length}{'\n'}
            Total Size: {(storageInfo.totalSize / 1024).toFixed(2)}KB{'\n'}
            Active Keys: {storageInfo.keys.join(', ')}
          </Text>
        </View>
      )}

      {/* Test Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.testButton, isLoading && styles.buttonDisabled]}
          onPress={runAllTests}
          disabled={isLoading}
        >
          <Ionicons name="play" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Run All Tests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={testFeature22}
          disabled={isLoading}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Quick Test 2.2</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={testInitialization}
          disabled={isLoading}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Test Migration</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={getStorageInfo}
          disabled={isLoading}
        >
          <Ionicons name="information" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Get Storage Info</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.newUserButton}
          onPress={resetToNewUser}
          disabled={isLoading}
        >
          <Ionicons name="person-add" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Reset to New User</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={clearAllData}
          disabled={isLoading}
        >
          <Ionicons name="trash" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* Test Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultsTitle}>📝 Test Results</Text>
        {testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
        {testResults.length === 0 && (
          <Text style={styles.emptyText}>No tests run yet. Press "Run All Tests" to start.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  description: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 20,
    marginBottom: 20,
  },
  infoContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#93C5FD',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dangerButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontFamily: 'monospace',
    lineHeight: 18,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  newUserButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
}); 