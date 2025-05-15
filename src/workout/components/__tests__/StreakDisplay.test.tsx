import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { StreakDisplay } from '../StreakDisplay';
import { Workout } from '../../../types/workout';
import { StreakProvider } from '../../contexts/StreakContext';

// Mock du service de streak
jest.mock('../../../services/streakService', () => ({
  StreakService: {
    getWorkoutStreak: jest.fn().mockResolvedValue({
      current: 3,
      longest: 5,
      lastCompletedDate: '2023-06-14',
      streakHistory: [
        {
          startDate: '2023-06-12',
          endDate: '2023-06-14',
          count: 3
        }
      ]
    }),
    getDaysUntilStreakLoss: jest.fn().mockReturnValue(4),
    formatStreakText: jest.fn().mockReturnValue('Streak: 3 fois'),
    formatBestStreakText: jest.fn().mockReturnValue('Meilleure streak: 5 fois')
  }
}));

describe('StreakDisplay', () => {
  const mockWorkout: Workout = {
    id: 'workout-123',
    name: 'Test Workout',
    date: '2023-06-15',
    duration: 60,
    exercises: [],
    frequency: { type: 'weekly', value: 1 }
  };

  it('affiche correctement les données de streak', async () => {
    const { getByText, queryByText } = render(
      <StreakProvider>
        <StreakDisplay 
          workout={mockWorkout} 
          size="medium"
          showDaysRemaining={true}
        />
      </StreakProvider>
    );

    // Attendre que les données soient chargées
    await waitFor(() => {
      expect(getByText('3 jour')).toBeTruthy();
      expect(getByText('4 jours restants')).toBeTruthy();
    });
  });

  it('ne montre pas les jours restants si showDaysRemaining est à false', async () => {
    const { getByText, queryByText } = render(
      <StreakProvider>
        <StreakDisplay 
          workout={mockWorkout} 
          size="medium"
          showDaysRemaining={false}
        />
      </StreakProvider>
    );

    // Attendre que les données soient chargées
    await waitFor(() => {
      expect(getByText('3 jour')).toBeTruthy();
      expect(queryByText('4 jours restants')).toBeNull();
    });
  });

  it('utilise différentes tailles selon la propriété size', async () => {
    const { getByText } = render(
      <StreakProvider>
        <StreakDisplay 
          workout={mockWorkout} 
          size="large"
          showDaysRemaining={false}
        />
      </StreakProvider>
    );

    // Attendre que les données soient chargées
    await waitFor(() => {
      const streakText = getByText('3 jour');
      expect(streakText).toBeTruthy();
    });
  });
}); 