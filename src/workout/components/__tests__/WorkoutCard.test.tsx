import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WorkoutCard } from '../WorkoutCard';
import { Workout } from '../../../types/workout';

// Créer un mock de workout pour les tests
const mockWorkout: Workout = {
  id: '1',
  name: 'Test Workout',
  date: '2024-03-20',
  duration: 60,
  exercises: [],
  frequency: 'Monday',
  series: 5,
};

// Créer un mock de workout sans séries pour tester l'état "off"
const mockWorkoutNoSeries: Workout = {
  ...mockWorkout,
  series: 0,
};

describe('WorkoutCard', () => {
  // Test du rendu basique
  it('renders correctly with all props', () => {
    const onPress = jest.fn();
    const onSettingsPress = jest.fn();
    
    const { getByText, getByTestId } = render(
      <WorkoutCard
        workout={mockWorkout}
        onPress={onPress}
        onSettingsPress={onSettingsPress}
      />
    );

    // Vérifier que le nom est affiché
    expect(getByText('Test Workout')).toBeTruthy();
    
    // Vérifier que la fréquence est affichée
    expect(getByText('Monday')).toBeTruthy();
    
    // Vérifier que le nombre de séries est affiché
    expect(getByText('5')).toBeTruthy();
  });

  // Test de l'état "off" (séries à 0)
  it('renders correctly with 0 series', () => {
    const onPress = jest.fn();
    const onSettingsPress = jest.fn();
    
    const { getByText } = render(
      <WorkoutCard
        workout={mockWorkoutNoSeries}
        onPress={onPress}
        onSettingsPress={onSettingsPress}
      />
    );

    // Vérifier que le nombre de séries est affiché
    expect(getByText('0')).toBeTruthy();
  });

  // Test des interactions
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const onSettingsPress = jest.fn();
    
    const { getByTestId } = render(
      <WorkoutCard
        workout={mockWorkout}
        onPress={onPress}
        onSettingsPress={onSettingsPress}
      />
    );

    // Simuler un appui sur la carte
    fireEvent.press(getByTestId('workout-card'));
    
    // Vérifier que onPress a été appelé
    expect(onPress).toHaveBeenCalled();
  });

  // Test du bouton settings
  it('calls onSettingsPress when settings button is pressed', () => {
    const onPress = jest.fn();
    const onSettingsPress = jest.fn();
    
    const { getByTestId } = render(
      <WorkoutCard
        workout={mockWorkout}
        onPress={onPress}
        onSettingsPress={onSettingsPress}
      />
    );

    // Simuler un appui sur le bouton settings
    fireEvent.press(getByTestId('settings-button'));
    
    // Vérifier que onSettingsPress a été appelé
    expect(onSettingsPress).toHaveBeenCalled();
  });
}); 