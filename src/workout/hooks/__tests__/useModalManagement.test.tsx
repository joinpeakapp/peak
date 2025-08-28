import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useModalManagement } from '../useModalManagement';
import { Exercise } from '../../../types/workout';

// Mock d'exercice pour les tests
const mockExercise: Exercise = {
  id: 'test-exercise',
  name: 'Test Exercise',
  sets: 3,
  tracking: 'trackedOnSets'
};

describe('useModalManagement', () => {
  describe('Initialisation', () => {
    it('should initialize with all modals closed', () => {
      const { result } = renderHook(() => useModalManagement());
      
      expect(result.current.isExerciseSettingsVisible).toBe(false);
      expect(result.current.isFilterModalVisible).toBe(false);
      expect(result.current.isFinishModalVisible).toBe(false);
      expect(result.current.settingsModalVisible).toBe(false);
      expect(result.current.isWorkoutEditModalVisible).toBe(false);
      expect(result.current.selectedExerciseId).toBeNull();
      expect(result.current.currentExercise).toBeUndefined();
      expect(result.current.openTimerDirectly).toBe(false);
    });
  });

  describe('Exercise Settings Modal', () => {
    it('should show and hide exercise settings modal', () => {
      const { result } = renderHook(() => useModalManagement());
      
      act(() => {
        result.current.showExerciseSettings();
      });
      
      expect(result.current.isExerciseSettingsVisible).toBe(true);
      
      act(() => {
        result.current.hideExerciseSettings();
      });
      
      expect(result.current.isExerciseSettingsVisible).toBe(false);
    });
  });

  describe('Filter Modal', () => {
    it('should show and hide filter modal', () => {
      const { result } = renderHook(() => useModalManagement());
      
      act(() => {
        result.current.showFilterModal();
      });
      
      expect(result.current.isFilterModalVisible).toBe(true);
      
      act(() => {
        result.current.hideFilterModal();
      });
      
      expect(result.current.isFilterModalVisible).toBe(false);
    });
  });

  describe('Finish Modal', () => {
    it('should show and hide finish modal', () => {
      const { result } = renderHook(() => useModalManagement());
      
      act(() => {
        result.current.showFinishModal();
      });
      
      expect(result.current.isFinishModalVisible).toBe(true);
      
      act(() => {
        result.current.hideFinishModal();
      });
      
      expect(result.current.isFinishModalVisible).toBe(false);
    });
  });

  describe('Workout Edit Modal', () => {
    it('should show and hide workout edit modal', () => {
      const { result } = renderHook(() => useModalManagement());
      
      act(() => {
        result.current.showWorkoutEditModal();
      });
      
      expect(result.current.isWorkoutEditModalVisible).toBe(true);
      
      act(() => {
        result.current.hideWorkoutEditModal();
      });
      
      expect(result.current.isWorkoutEditModalVisible).toBe(false);
    });
  });

  describe('Exercise Settings Modal with Exercise', () => {
    it('should show exercise settings modal with exercise', () => {
      const { result } = renderHook(() => useModalManagement());
      
      act(() => {
        result.current.showExerciseSettingsModal(mockExercise);
      });
      
      expect(result.current.settingsModalVisible).toBe(true);
      expect(result.current.currentExercise).toEqual(mockExercise);
      expect(result.current.openTimerDirectly).toBe(false);
    });

    it('should show exercise settings modal with timer option', () => {
      const { result } = renderHook(() => useModalManagement());
      
      act(() => {
        result.current.showExerciseSettingsModal(mockExercise, true);
      });
      
      expect(result.current.settingsModalVisible).toBe(true);
      expect(result.current.currentExercise).toEqual(mockExercise);
      expect(result.current.openTimerDirectly).toBe(true);
    });

    it('should hide exercise settings modal and clear states', () => {
      const { result } = renderHook(() => useModalManagement());
      
      // D'abord afficher avec des données
      act(() => {
        result.current.showExerciseSettingsModal(mockExercise, true);
      });
      
      // Puis cacher
      act(() => {
        result.current.hideExerciseSettingsModal();
      });
      
      expect(result.current.settingsModalVisible).toBe(false);
      expect(result.current.currentExercise).toBeUndefined();
      expect(result.current.openTimerDirectly).toBe(false);
    });
  });

  describe('Exercise Selection', () => {
    it('should select and clear exercise', () => {
      const { result } = renderHook(() => useModalManagement());
      
      act(() => {
        result.current.selectExercise('exercise-123');
      });
      
      expect(result.current.selectedExerciseId).toBe('exercise-123');
      
      act(() => {
        result.current.clearSelectedExercise();
      });
      
      expect(result.current.selectedExerciseId).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    it('should close all modals', () => {
      const { result } = renderHook(() => useModalManagement());
      
      // Ouvrir toutes les modales
      act(() => {
        result.current.showExerciseSettings();
        result.current.showFilterModal();
        result.current.showFinishModal();
        result.current.showWorkoutEditModal();
        result.current.showExerciseSettingsModal(mockExercise, true);
      });
      
      // Vérifier qu'elles sont ouvertes
      expect(result.current.isExerciseSettingsVisible).toBe(true);
      expect(result.current.isFilterModalVisible).toBe(true);
      expect(result.current.isFinishModalVisible).toBe(true);
      expect(result.current.isWorkoutEditModalVisible).toBe(true);
      expect(result.current.settingsModalVisible).toBe(true);
      
      // Fermer toutes les modales
      act(() => {
        result.current.closeAllModals();
      });
      
      // Vérifier qu'elles sont fermées
      expect(result.current.isExerciseSettingsVisible).toBe(false);
      expect(result.current.isFilterModalVisible).toBe(false);
      expect(result.current.isFinishModalVisible).toBe(false);
      expect(result.current.isWorkoutEditModalVisible).toBe(false);
      expect(result.current.settingsModalVisible).toBe(false);
      expect(result.current.currentExercise).toBeUndefined();
      expect(result.current.openTimerDirectly).toBe(false);
    });

    it('should reset all modal states', () => {
      const { result } = renderHook(() => useModalManagement());
      
      // Ouvrir toutes les modales et sélectionner un exercice
      act(() => {
        result.current.showExerciseSettings();
        result.current.showFilterModal();
        result.current.selectExercise('exercise-456');
        result.current.showExerciseSettingsModal(mockExercise, true);
      });
      
      // Réinitialiser tous les états
      act(() => {
        result.current.resetModalStates();
      });
      
      // Vérifier que tout est réinitialisé
      expect(result.current.isExerciseSettingsVisible).toBe(false);
      expect(result.current.isFilterModalVisible).toBe(false);
      expect(result.current.isFinishModalVisible).toBe(false);
      expect(result.current.isWorkoutEditModalVisible).toBe(false);
      expect(result.current.settingsModalVisible).toBe(false);
      expect(result.current.selectedExerciseId).toBeNull();
      expect(result.current.currentExercise).toBeUndefined();
      expect(result.current.openTimerDirectly).toBe(false);
    });
  });

  describe('Multiple Operations', () => {
    it('should handle multiple modal operations correctly', () => {
      const { result } = renderHook(() => useModalManagement());
      
      // Séquence d'opérations
      act(() => {
        result.current.selectExercise('exercise-1');
        result.current.showFilterModal();
      });
      
      expect(result.current.selectedExerciseId).toBe('exercise-1');
      expect(result.current.isFilterModalVisible).toBe(true);
      
      act(() => {
        result.current.hideFilterModal();
        result.current.showExerciseSettingsModal(mockExercise);
      });
      
      expect(result.current.isFilterModalVisible).toBe(false);
      expect(result.current.settingsModalVisible).toBe(true);
      expect(result.current.currentExercise).toEqual(mockExercise);
      
      act(() => {
        result.current.hideExerciseSettingsModal();
        result.current.clearSelectedExercise();
      });
      
      expect(result.current.settingsModalVisible).toBe(false);
      expect(result.current.selectedExerciseId).toBeNull();
      expect(result.current.currentExercise).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined exercise gracefully', () => {
      const { result } = renderHook(() => useModalManagement());
      
      // Tenter d'afficher avec un exercice undefined
      act(() => {
        result.current.showExerciseSettingsModal(undefined as any);
      });
      
      expect(result.current.settingsModalVisible).toBe(true);
      expect(result.current.currentExercise).toBeUndefined();
    });

    it('should handle multiple calls to same function', () => {
      const { result } = renderHook(() => useModalManagement());
      
      // Appeler show plusieurs fois
      act(() => {
        result.current.showFilterModal();
        result.current.showFilterModal();
        result.current.showFilterModal();
      });
      
      expect(result.current.isFilterModalVisible).toBe(true);
      
      // Appeler hide plusieurs fois
      act(() => {
        result.current.hideFilterModal();
        result.current.hideFilterModal();
        result.current.hideFilterModal();
      });
      
      expect(result.current.isFilterModalVisible).toBe(false);
    });
  });
});
