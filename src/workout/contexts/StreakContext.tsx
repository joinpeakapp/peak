import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { StreakData, Workout } from '../../types/workout';
import { StreakService } from '../../services/streakService';

interface StreakContextType {
  getWorkoutStreak: (workoutId: string) => Promise<StreakData>;
  updateStreakOnCompletion: (workout: Workout) => Promise<StreakData>;
  getDaysUntilStreakLoss: (workoutId: string, workout: Workout) => Promise<number>;
  formatStreakText: (streakData: StreakData | null) => string;
  formatBestStreakText: (streakData: StreakData | null) => string;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export const StreakProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Récupérer les streaks pour un workout
  const getWorkoutStreak = useCallback(async (workoutId: string): Promise<StreakData> => {
    try {
      return await StreakService.getWorkoutStreak(workoutId);
    } catch (error) {
      console.error('[StreakContext] Error getting workout streak:', error);
      // Retourner une streak vide en cas d'erreur
      return {
        workoutId,
        current: 0,
        longest: 0,
        lastCompletedDate: undefined,
        streakHistory: []
      };
    }
  }, []);

  // Mettre à jour la streak après la complétion d'un workout
  const updateStreakOnCompletion = useCallback(async (workout: Workout): Promise<StreakData> => {
    try {
      return await StreakService.updateStreakOnCompletion(workout);
    } catch (error) {
      console.error('[StreakContext] Error updating streak:', error);
      // Retourner une streak vide en cas d'erreur
      return {
        workoutId: workout.id,
        current: 0,
        longest: 0,
        lastCompletedDate: undefined,
        streakHistory: []
      };
    }
  }, []);

  // Calculer le nombre de jours restants avant de perdre la streak
  const getDaysUntilStreakLoss = useCallback(async (workoutId: string, workout: Workout): Promise<number> => {
    try {
      const streakData = await getWorkoutStreak(workoutId);
      if (!streakData || !streakData.lastCompletedDate) {
        return 0;
      }
      return StreakService.getDaysUntilStreakLoss(streakData.lastCompletedDate, workout.frequency);
    } catch (error) {
      console.error('[StreakContext] Error calculating days until streak loss:', error);
      return 0;
    }
  }, [getWorkoutStreak]);

  // Formater le texte pour l'affichage de la streak
  const formatStreakText = useCallback((streakData: StreakData | null): string => {
    return StreakService.formatStreakText(streakData);
  }, []);

  // Formater le texte pour l'affichage de la meilleure streak
  const formatBestStreakText = useCallback((streakData: StreakData | null): string => {
    return StreakService.formatBestStreakText(streakData);
  }, []);

  return (
    <StreakContext.Provider
      value={{
        getWorkoutStreak,
        updateStreakOnCompletion,
        getDaysUntilStreakLoss,
        formatStreakText,
        formatBestStreakText
      }}
    >
      {children}
    </StreakContext.Provider>
  );
};

export const useStreak = () => {
  const context = useContext(StreakContext);
  
  if (!context) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  
  return context;
}; 