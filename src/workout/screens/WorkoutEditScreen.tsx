import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkout } from '../../hooks/useWorkout';
import { Workout, WorkoutFrequency } from '../../types/workout';

interface WorkoutEditScreenProps {
  workout: Workout;
  onSave: () => void;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Monday' },
  { value: 1, label: 'Tuesday' },
  { value: 2, label: 'Wednesday' },
  { value: 3, label: 'Thursday' },
  { value: 4, label: 'Friday' },
  { value: 5, label: 'Saturday' },
  { value: 6, label: 'Sunday' },
];

export const WorkoutEditScreen: React.FC<WorkoutEditScreenProps> = ({
  workout,
  onSave,
  onClose
}) => {
  const [name, setName] = useState(workout.name);
  const [selectedDay, setSelectedDay] = useState<number>(
    workout.frequency.type === 'weekly' ? workout.frequency.value : 0
  );
  const [error, setError] = useState('');
  const { updateWorkout: updateWorkoutFn, workouts } = useWorkout();

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

  const handleSave = () => {
    if (validateName()) {
      // Create a frequency object for the workout
      const frequency: WorkoutFrequency = {
        type: 'weekly',
        value: selectedDay
      };

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