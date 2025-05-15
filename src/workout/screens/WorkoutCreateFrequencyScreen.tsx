import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkout } from '../../hooks/useWorkout';
import { WorkoutFrequency } from '../../types/workout';
import { Workout } from '../../types/workout';

// Fonction pour générer un ID unique compatible avec Hermes
const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 15);
};

interface WorkoutCreateFrequencyScreenProps {
  name: string;
  onComplete: () => void;
  onBack: () => void;
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

export const WorkoutCreateFrequencyScreen: React.FC<WorkoutCreateFrequencyScreenProps> = ({
  name,
  onComplete,
  onBack
}) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const { createWorkout } = useWorkout();

  const handleDaySelect = (dayValue: number) => {
    setSelectedDay(dayValue);
  };

  const handleCreate = () => {
    if (selectedDay !== null) {
      // Créer un objet de fréquence pour le workout
      const frequency: WorkoutFrequency = {
        type: 'weekly',
        value: selectedDay
      };

      // Créer et ajouter le nouveau workout
      const newWorkout: Workout = {
        id: generateId(),
        name,
        date: new Date().toISOString().split('T')[0],
        duration: 0, // Valeur par défaut
        exercises: [],
        frequency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      createWorkout(newWorkout);

      // Terminer le flow
      onComplete();
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <TouchableOpacity 
          testID="back-button"
          style={styles.backButton} 
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Schedule your workout</Text>
          <Text style={styles.subtitle}>When do you plan to do this workout?</Text>
        </View>
        
        <ScrollView 
          style={styles.daysContainer}
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.createButton, selectedDay === null && styles.createButtonDisabled]} 
            onPress={handleCreate}
            disabled={selectedDay === null}
          >
            <Text style={styles.createButtonText}>Create workout</Text>
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
  },
  backButton: {
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
    marginBottom: 48,
  },
  daysContainer: {
    flex: 1,
    marginBottom: 16,
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
  buttonContainer: {
    paddingBottom: Platform.OS === 'ios' ? 48 : 48,
  },
  createButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  createButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: '600',
  },
}); 