import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkout } from '../../hooks/useWorkout';

interface WorkoutCreateNameScreenProps {
  onNext: (name: string) => void;
  onClose: () => void;
}

export const WorkoutCreateNameScreen: React.FC<WorkoutCreateNameScreenProps> = ({
  onNext,
  onClose
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { workouts } = useWorkout();

  const validateName = () => {
    // Vérification si le champ est vide
    if (name.trim() === '') {
      setError('Please enter a workout name');
      return false;
    }
    
    // Vérification si le nom est déjà utilisé par un autre workout
    const nameExists = workouts.some(workout => 
      workout.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (nameExists) {
      setError('A workout with this name already exists');
      return false;
    }
    
    // Si aucune erreur, on efface le message d'erreur
    setError('');
    return true;
  };

  const handleNameChange = (text: string) => {
    setName(text);
    // Efface l'erreur lorsque l'utilisateur commence à modifier le champ
    if (error) setError('');
  };

  const handleNext = () => {
    if (validateName()) {
      onNext(name.trim());
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidView}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.container}>
          <TouchableOpacity 
            testID="close-button"
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Ionicons name="arrow-down" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Titre et sous-titre maintenant dans le ScrollView */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Name your workout</Text>
              <Text style={styles.subtitle}>Give your session a name to track it easily!</Text>
            </View>

            <View>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholder="e.g. Upper Body, Cardio..."
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={name}
                onChangeText={handleNameChange}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleNext}
                testID="workout-name-input"
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity 
                style={[styles.continueButton, !name.trim() && styles.continueButtonDisabled]} 
                onPress={handleNext}
                disabled={!name.trim()}
                testID="continue-button"
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
    paddingHorizontal: 24,
    paddingTop: 0,
  },
  closeButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    padding: 8,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
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
    marginBottom: 48,
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
  continueButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  continueButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: '600',
  },
}); 