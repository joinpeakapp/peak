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
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ExerciseCreateNameScreenProps {
  onNext: (name: string) => void;
  onClose: () => void;
  existingExercises?: string[]; // Liste des noms d'exercices existants
}

export const ExerciseCreateNameScreen: React.FC<ExerciseCreateNameScreenProps> = ({
  onNext,
  onClose,
  existingExercises = []
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const validateName = () => {
    if (name.trim() === '') {
      setError('Please enter an exercise name');
      return false;
    }
    
    if (name.length > 30) {
      setError('Exercise name must be 30 characters or less');
      return false;
    }
    
    // Vérifier si un exercice avec ce nom existe déjà
    const nameExists = existingExercises.some(
      exerciseName => exerciseName.toLowerCase().trim() === name.toLowerCase().trim()
    );
    
    if (nameExists) {
      setError('An exercise with this name already exists');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleNameChange = (text: string) => {
    setName(text);
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

  const canContinue = name.trim().length > 0 && name.length <= 30;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.content}>
            {/* Title and subtitle */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Create an exercise</Text>
              <Text style={styles.subtitle}>Choose a clear and recognizable name</Text>
            </View>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholder="e.g., Barbell Squat, Pull-ups..."
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={name}
                onChangeText={handleNameChange}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleNext}
                autoFocus
                maxLength={30}
              />
              
              <Text style={styles.characterCount}>
                {name.length}/30 characters
              </Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            {/* Spacer to push button to bottom */}
            <View style={styles.spacer} />

            {/* Next Button */}
            <TouchableOpacity 
              style={[styles.nextButton, !canContinue && styles.nextButtonDisabled]} 
              onPress={handleNext}
              disabled={!canContinue}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#0D0D0F" />
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#242526',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
  inputContainer: {
    marginTop: 32,
  },
  input: {
    backgroundColor: '#1A1A1D',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  characterCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    textAlign: 'right',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 8,
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 48,
  },
  nextButtonDisabled: {
    backgroundColor: '#2A2A2D',
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: '600',
  },
});

