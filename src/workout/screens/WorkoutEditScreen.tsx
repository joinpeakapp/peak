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

// ⚠️ IMPORTANT: Les valeurs doivent correspondre à Date.getDay()
// où 0 = Dimanche, 1 = Lundi, 2 = Mardi, etc.
const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },    // Lundi = 1
  { value: 2, label: 'Tuesday' },   // Mardi = 2
  { value: 3, label: 'Wednesday' }, // Mercredi = 3
  { value: 4, label: 'Thursday' },  // Jeudi = 4
  { value: 5, label: 'Friday' },    // Vendredi = 5
  { value: 6, label: 'Saturday' },  // Samedi = 6
  { value: 0, label: 'Sunday' },    // Dimanche = 0
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

      // Passer le workout précédent pour détecter les changements de fréquence
      updateWorkoutFn(updatedWorkout, workout);

      // Complete the flow
      onSave();
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const getSelectedDayLabel = () => {
    const day = DAYS_OF_WEEK.find(d => d.value === selectedDay);
    return day ? day.label : '';
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

          {/* Contenu scrollable */}
          <View style={styles.scrollContainer}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Titre et sous-titre maintenant dans le ScrollView */}
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Edit workout</Text>
                <Text style={styles.subtitle}>Update your workout details</Text>
              </View>
              <Text style={styles.sectionTitle}>Workout name</Text>
              <View>
                <TextInput
                  style={[styles.input, error ? styles.inputError : null]}
                  placeholder="e.g. Upper Body, Cardio..."
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
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
                  style={[
                    styles.tab,
                    activeTab === 'weekly' && styles.tabActive
                  ]}
                  onPress={() => handleTabChange('weekly')}
                >
                  <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>
                    Weekly
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.tab,
                    activeTab === 'interval' && styles.tabActive
                  ]}
                  onPress={() => handleTabChange('interval')}
                >
                  <Text style={[styles.tabText, activeTab === 'interval' && styles.tabTextActive]}>
                    Interval
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.tab,
                    activeTab === 'none' && styles.tabActive
                  ]}
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
                  <Text style={styles.sectionLabel}>
                    On <Text style={styles.highlightedText}>which day</Text> will you be doing this session?
                  </Text>
                  <View style={styles.daysGrid}>
                    {DAYS_OF_WEEK.map((day) => (
                      <TouchableOpacity
                        key={day.value}
                        style={[
                          styles.dayChip,
                          selectedDay === day.value && styles.dayChipSelected
                        ]}
                        onPress={() => handleDaySelect(day.value)}
                      >
                        <Text style={[
                          styles.dayChipText,
                          selectedDay === day.value && styles.dayChipTextSelected
                        ]}>
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {selectedDay !== null && (
                    <Text style={styles.dynamicText}>
                      Do this workout <Text style={styles.highlightedText}>every {getSelectedDayLabel()}</Text>
                    </Text>
                  )}
                </View>
              )}
              
              {activeTab === 'interval' && (
                <View style={styles.intervalContainer}>
                  <Text style={styles.sectionLabel}>
                    How many <Text style={styles.highlightedText}>rest days</Text> do you take between two {name} sessions?
                  </Text>
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
                          label={`${days}`} 
                          value={days} 
                        />
                      ))}
                    </Picker>
                  </View>
                  <Text style={styles.intervalDescription}>
                    Repeat this workout <Text style={styles.highlightedText}>every {selectedInterval} {selectedInterval === 1 ? 'day' : 'days'}</Text>
                  </Text>
                </View>
              )}
              
              {activeTab === 'none' && (
                <View style={styles.noneContainer}>
                  <View style={styles.noneIconContainer}>
                    <Ionicons name="calendar-outline" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={styles.noneTitle}>Flexible Schedule</Text>
                  <Text style={styles.noneDescription}>
                    No fixed schedule. Train whenever you feel like it and track your progress along the way.
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
    paddingTop: 32, 
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
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabActive: {
    borderBottomColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.3)',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  // Weekly content
  daysContainer: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
  },
  highlightedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  dayChip: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  dayChipSelected: {
    backgroundColor: '#FFFFFF',
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  dayChipTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
  dynamicText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 24,
  },
  // Interval content
  intervalContainer: {
    marginBottom: 32,
  },
  pickerContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    color: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  pickerItem: {
    fontSize: 36,
    color: '#FFFFFF',
    height: 150,
  },
  intervalDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
  // None content
  noneContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  noneIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  noneTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  noneDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
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