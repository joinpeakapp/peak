import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkout } from '../../hooks/useWorkout';
import { Workout, WorkoutFrequency } from '../../types/workout';
import { Picker } from '@react-native-picker/picker';

interface WorkoutEditScreenProps {
  workout: Workout;
  onSave: () => void;
  onClose: () => void;
}

type FrequencyTab = 'weekly' | 'interval' | 'none';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' },
];

// Génerer les options d'intervalle (1-30 jours)
const INTERVAL_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);

export const WorkoutEditScreen: React.FC<WorkoutEditScreenProps> = ({
  workout,
  onSave,
  onClose
}) => {
  const [name, setName] = useState(workout.name);
  
  // Initialiser le tab actif en fonction de la fréquence du workout
  const [activeTab, setActiveTab] = useState<FrequencyTab>(workout.frequency.type);
  
  const [selectedDay, setSelectedDay] = useState<number>(
    workout.frequency.type === 'weekly' ? workout.frequency.value : 0
  );
  
  const [selectedInterval, setSelectedInterval] = useState<number>(
    workout.frequency.type === 'interval' ? workout.frequency.value : 3
  );
  
  const [error, setError] = useState('');
  const { updateWorkout: updateWorkoutFn, workouts } = useWorkout();
  
  // Animation pour l'indicateur de tab
  const tabIndicatorPosition = useRef(new Animated.Value(
    workout.frequency.type === 'weekly' ? 0 : workout.frequency.type === 'interval' ? 1 : 2
  )).current;

  const validateName = () => {
    // Check if field is empty
    if (name.trim() === '') {
      setError('Please enter a workout name');
      return false;
    }
    
    // Check if the name is already used by another workout
    const nameExists = workouts.some(w => 
      w.id !== workout.id && w.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (nameExists) {
      setError('A workout with this name already exists');
      return false;
    }
    
    // If no error, clear the error message
    setError('');
    return true;
  };

  const handleNameChange = (text: string) => {
    setName(text);
    // Clear error when user starts modifying the field
    if (error) setError('');
  };

  const handleDaySelect = (dayValue: number) => {
    setSelectedDay(dayValue);
  };
  
  const handleTabChange = (tab: FrequencyTab) => {
    setActiveTab(tab);
    
    // Animation de l'indicateur
    const tabIndex = tab === 'weekly' ? 0 : tab === 'interval' ? 1 : 2;
    Animated.spring(tabIndicatorPosition, {
      toValue: tabIndex,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const handleSave = () => {
    if (validateName()) {
      let frequency: WorkoutFrequency;
      
      if (activeTab === 'weekly') {
        frequency = {
          type: 'weekly',
          value: selectedDay
        };
      } else if (activeTab === 'interval') {
        frequency = {
          type: 'interval',
          value: selectedInterval
        };
      } else {
        frequency = {
          type: 'none',
          value: 0
        };
      }

      // Update the workout
      const updatedWorkout: Workout = {
        ...workout,
        name: name.trim(),
        frequency,
        updatedAt: new Date().toISOString()
      };

      updateWorkoutFn(updatedWorkout);

      // Complete the flow
      onSave();
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
          <TouchableOpacity 
            testID="close-button"
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Edit workout</Text>
            <Text style={styles.subtitle}>Update your workout details</Text>
          </View>

          {/* Contenu scrollable */}
          <View style={styles.scrollContainer}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Text style={styles.sectionTitle}>Workout name</Text>
              <View>
                <TextInput
                  style={[styles.input, error ? styles.inputError : null]}
                  placeholder="e.g. Upper Body, Cardio..."
                  placeholderTextColor="#5B5B5C"
                  value={name}
                  onChangeText={handleNameChange}
                  autoCapitalize="words"
                  returnKeyType="done"
                  testID="workout-name-input"
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>

              <Text style={styles.sectionTitle}>Workout schedule</Text>
              
              {/* Tabs */}
              <View style={styles.tabsContainer}>
                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'weekly' && styles.tabActive]}
                  onPress={() => handleTabChange('weekly')}
                >
                  <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>
                    Weekly
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'interval' && styles.tabActive]}
                  onPress={() => handleTabChange('interval')}
                >
                  <Text style={[styles.tabText, activeTab === 'interval' && styles.tabTextActive]}>
                    Interval
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'none' && styles.tabActive]}
                  onPress={() => handleTabChange('none')}
                >
                  <Text style={[styles.tabText, activeTab === 'none' && styles.tabTextActive]}>
                    Flexible
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Content selon le tab actif */}
              {activeTab === 'weekly' && (
                <View style={styles.daysContainer}>
                  {DAYS_OF_WEEK.map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        styles.dayOption,
                        selectedDay === day.value && styles.dayOptionSelected
                      ]}
                      onPress={() => handleDaySelect(day.value)}
                    >
                      <Text style={[
                        styles.dayText,
                        selectedDay === day.value && styles.dayTextSelected
                      ]}>
                        {day.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {activeTab === 'interval' && (
                <View style={styles.intervalContainer}>
                  <Text style={styles.intervalLabel}>Repeat every</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedInterval}
                      onValueChange={(itemValue) => setSelectedInterval(itemValue)}
                      style={styles.picker}
                      itemStyle={styles.pickerItem}
                    >
                      {INTERVAL_OPTIONS.map((days) => (
                        <Picker.Item 
                          key={days} 
                          label={days === 1 ? "1 day" : `${days} days`} 
                          value={days} 
                        />
                      ))}
                    </Picker>
                  </View>
                  <Text style={styles.intervalDescription}>
                    Your workout will repeat every {selectedInterval} {selectedInterval === 1 ? 'day' : 'days'}
                  </Text>
                </View>
              )}
              
              {activeTab === 'none' && (
                <View style={styles.noneContainer}>
                  <Ionicons name="time-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
                  <Text style={styles.noneTitle}>Flexible schedule</Text>
                  <Text style={styles.noneDescription}>
                    This workout won't have a specific schedule. You can do it whenever you want.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>

          {/* Bouton fixe en bas */}
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity 
              style={[styles.saveButton, (!name.trim() || error) && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={!name.trim() || !!error}
              testID="save-button"
            >
              <Text style={styles.saveButtonText}>Save changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
    paddingHorizontal: 24,
    paddingTop: 0,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16, // Espace pour éviter que le contenu soit coupé
  },
  bottomButtonContainer: {
    paddingVertical: 16,
    paddingBottom: 32, // Safe area
    backgroundColor: '#0D0D0F',
  },
  closeButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    padding: 8,
  },
  titleContainer: {
    alignItems: 'flex-start',
    marginTop: 24, 
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    height: 56,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 14,
    marginBottom: 16,
  },
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Weekly content
  daysContainer: {
    marginBottom: 32,
  },
  dayOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  dayOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  dayText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  dayTextSelected: {
    fontWeight: '600',
  },
  // Interval content
  intervalContainer: {
    marginBottom: 32,
  },
  intervalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  picker: {
    width: '100%',
    color: '#FFFFFF',
  },
  pickerItem: {
    fontSize: 20,
    color: '#FFFFFF',
    height: 120,
  },
  intervalDescription: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 20,
  },
  // None content
  noneContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  noneTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
  },
  noneDescription: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Button
  saveButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 32,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: '600',
  },
}); 