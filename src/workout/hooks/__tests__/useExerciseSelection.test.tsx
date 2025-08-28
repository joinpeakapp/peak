import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useExerciseSelection } from '../useExerciseSelection';
import { Exercise } from '../../../types/workout';

// Mock des exercices pour les tests
const mockExercises: Exercise[] = [
  {
    id: 'bench-press',
    name: 'Bench Press',
    sets: 3,
    tracking: 'trackedOnSets',
    tags: ['Chest', 'Upper Body']
  },
  {
    id: 'squat',
    name: 'Squat', 
    sets: 4,
    tracking: 'trackedOnSets',
    tags: ['Quads', 'Lower Body']
  },
  {
    id: 'pull-ups',
    name: 'Pull-ups',
    sets: 3,
    tracking: 'trackedOnSets',
    tags: ['Back', 'Upper Body']
  }
];

// Mock du module SAMPLE_EXERCISES
jest.mock('../../components/ExerciseSelectionModal', () => ({
  SAMPLE_EXERCISES: [
    {
      id: 'bench-press',
      name: 'Bench Press',
      sets: 3,
      tracking: 'trackedOnSets',
      tags: ['Chest', 'Upper Body']
    },
    {
      id: 'squat',
      name: 'Squat', 
      sets: 4,
      tracking: 'trackedOnSets',
      tags: ['Quads', 'Lower Body']
    },
    {
      id: 'pull-ups',
      name: 'Pull-ups',
      sets: 3,
      tracking: 'trackedOnSets',
      tags: ['Back', 'Upper Body']
    }
  ]
}));

describe('useExerciseSelection', () => {
  describe('Initialisation', () => {
    it('should initialize with default states', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      expect(result.current.searchQuery).toBe('');
      expect(result.current.selectedExercises).toEqual([]);
      expect(result.current.selectedTags).toEqual([]);
      expect(result.current.exerciseToReplaceId).toBeNull();
      expect(result.current.modalMode).toBe('workout');
      expect(result.current.hasSelectedExercises).toBe(false);
      expect(result.current.canConfirmSelection).toBe(false);
    });

    it('should load all exercises initially', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      expect(result.current.filteredExercises).toHaveLength(3);
      expect(result.current.groupedExercises).toHaveLength(3); // B, P, S
      expect(result.current.allTags.length).toBeGreaterThan(0);
    });
  });

  describe('Search and Filtering', () => {
    it('should filter exercises by search query', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      act(() => {
        result.current.setSearchQuery('bench');
      });
      
      expect(result.current.searchQuery).toBe('bench');
      expect(result.current.filteredExercises).toHaveLength(1);
      expect(result.current.filteredExercises[0].name).toBe('Bench Press');
    });

    it('should filter exercises by tags', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      act(() => {
        result.current.setSelectedTags(['Upper Body']);
      });
      
      expect(result.current.selectedTags).toEqual(['Upper Body']);
      expect(result.current.filteredExercises).toHaveLength(2); // Bench Press et Pull-ups
    });

    it('should filter by both search and tags', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      act(() => {
        result.current.setSearchQuery('pull');
        result.current.setSelectedTags(['Upper Body']);
      });
      
      expect(result.current.filteredExercises).toHaveLength(1);
      expect(result.current.filteredExercises[0].name).toBe('Pull-ups');
    });

    it('should return all exercises when no filters applied', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      expect(result.current.filteredExercises).toHaveLength(3);
    });
  });

  describe('Exercise Selection', () => {
    it('should toggle exercise selection in selection mode', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      act(() => {
        result.current.setModalMode('exercise-selection');
      });
      
      const exercise = result.current.filteredExercises[0];
      
      // Sélectionner l'exercice
      act(() => {
        result.current.toggleExerciseSelection(exercise);
      });
      
      expect(result.current.selectedExercises).toHaveLength(1);
      expect(result.current.selectedExercises[0].id).toBe(exercise.id);
      expect(result.current.hasSelectedExercises).toBe(true);
      
      // Désélectionner l'exercice
      act(() => {
        result.current.toggleExerciseSelection(exercise);
      });
      
      expect(result.current.selectedExercises).toHaveLength(0);
      expect(result.current.hasSelectedExercises).toBe(false);
    });

    it('should allow multiple selections in selection mode', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      act(() => {
        result.current.setModalMode('exercise-selection');
      });
      
      const exercise1 = result.current.filteredExercises[0];
      const exercise2 = result.current.filteredExercises[1];
      
      act(() => {
        result.current.toggleExerciseSelection(exercise1);
        result.current.toggleExerciseSelection(exercise2);
      });
      
      expect(result.current.selectedExercises).toHaveLength(2);
    });

    it('should allow only single selection in replacement mode', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      act(() => {
        result.current.setModalMode('exercise-replacement');
      });
      
      const exercise1 = result.current.filteredExercises[0];
      const exercise2 = result.current.filteredExercises[1];
      
      act(() => {
        result.current.toggleExerciseSelection(exercise1);
        result.current.toggleExerciseSelection(exercise2);
      });
      
      expect(result.current.selectedExercises).toHaveLength(1);
      expect(result.current.selectedExercises[0].id).toBe(exercise2.id);
    });
  });

  describe('Mode Management', () => {
    it('should start exercise selection correctly', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      // D'abord sélectionner quelque chose pour tester le clearing
      act(() => {
        result.current.setSearchQuery('test');
        result.current.setSelectedTags(['Chest']);
      });
      
      act(() => {
        result.current.startExerciseSelection();
      });
      
      expect(result.current.modalMode).toBe('exercise-selection');
      expect(result.current.searchQuery).toBe('');
      expect(result.current.selectedTags).toEqual([]);
      expect(result.current.selectedExercises).toEqual([]);
    });

    it('should start exercise replacement correctly', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      act(() => {
        result.current.startExerciseReplacement('exercise-123');
      });
      
      expect(result.current.modalMode).toBe('exercise-replacement');
      expect(result.current.exerciseToReplaceId).toBe('exercise-123');
      expect(result.current.searchQuery).toBe('');
      expect(result.current.selectedExercises).toEqual([]);
      expect(result.current.selectedTags).toEqual([]);
    });

    it('should reset to workout mode correctly', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      // D'abord mettre en mode replacement
      act(() => {
        result.current.startExerciseReplacement('exercise-123');
      });
      
      act(() => {
        result.current.resetToWorkoutMode();
      });
      
      expect(result.current.modalMode).toBe('workout');
      expect(result.current.exerciseToReplaceId).toBeNull();
    });
  });

  describe('Helpers', () => {
    it('should generate correct filter button text', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      // Aucun filtre
      expect(result.current.getFilterButtonText()).toBe('Filter by');
      
      // Un filtre
      act(() => {
        result.current.setSelectedTags(['Chest']);
      });
      expect(result.current.getFilterButtonText()).toBe('Chest');
      
      // Plusieurs filtres
      act(() => {
        result.current.setSelectedTags(['Chest', 'Back']);
      });
      expect(result.current.getFilterButtonText()).toBe('2 filters');
    });

    it('should clear selection correctly', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      // Remplir tous les états
      act(() => {
        result.current.setSearchQuery('test');
        result.current.setSelectedTags(['Chest']);
        result.current.toggleExerciseSelection(result.current.filteredExercises[0]);
        result.current.startExerciseReplacement('exercise-123');
      });
      
      act(() => {
        result.current.clearSelection();
      });
      
      expect(result.current.searchQuery).toBe('');
      expect(result.current.selectedTags).toEqual([]);
      expect(result.current.selectedExercises).toEqual([]);
      expect(result.current.exerciseToReplaceId).toBeNull();
    });
  });

  describe('Grouped Exercises', () => {
    it('should group exercises alphabetically', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      const groups = result.current.groupedExercises;
      
      expect(groups).toHaveLength(3);
      expect(groups[0].letter).toBe('B'); // Bench Press
      expect(groups[1].letter).toBe('P'); // Pull-ups
      expect(groups[2].letter).toBe('S'); // Squat
    });

    it('should filter grouped exercises correctly', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      act(() => {
        result.current.setSearchQuery('bench');
      });
      
      const groups = result.current.groupedExercises;
      
      expect(groups).toHaveLength(1);
      expect(groups[0].letter).toBe('B');
      expect(groups[0].data).toHaveLength(1);
      expect(groups[0].data[0].name).toBe('Bench Press');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty search gracefully', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      act(() => {
        result.current.setSearchQuery('   '); // Spaces only
      });
      
      expect(result.current.filteredExercises).toHaveLength(3); // Should return all
    });

    it('should handle non-existent exercise selection', () => {
      const { result } = renderHook(() => useExerciseSelection());
      
      const fakeExercise: Exercise = {
        id: 'fake',
        name: 'Fake Exercise',
        sets: 1,
        tracking: 'trackedOnSets'
      };
      
      act(() => {
        result.current.toggleExerciseSelection(fakeExercise);
      });
      
      expect(result.current.selectedExercises).toHaveLength(1);
    });
  });
});
