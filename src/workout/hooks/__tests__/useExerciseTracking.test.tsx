import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { useExerciseTracking } from '../useExerciseTracking';
import { TrackingSet } from '../../contexts/ActiveWorkoutContext';

// Mock Animated pour les tests
jest.mock('react-native', () => ({
  Animated: {
    Value: jest.fn().mockImplementation((value) => ({
      setValue: jest.fn(),
      stopAnimation: jest.fn(),
      _value: value,
    })),
    timing: jest.fn(() => ({
      start: jest.fn(),
    })),
    sequence: jest.fn(() => ({
      start: jest.fn(),
    })),
  },
}));

describe('useExerciseTracking', () => {
  const mockSets: TrackingSet[] = [
    { completed: false, weight: '80', reps: '10' },
    { completed: true, weight: '70', reps: '12' },
    { completed: false, weight: '60', reps: '15' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialisation', () => {
    it('should initialize with empty states', () => {
      const { result } = renderHook(() => useExerciseTracking());

      expect(result.current.exerciseSets).toEqual([]);
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.completedCheckmarks).toEqual({});
      expect(result.current.setAnimations).toEqual({});
    });

    it('should initialize sets correctly', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.initializeSets(mockSets);
      });

      expect(result.current.exerciseSets).toEqual(mockSets);
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(Object.keys(result.current.setAnimations)).toHaveLength(3);
    });
  });

  describe('Set Management', () => {
    it('should update set weight', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.initializeSets(mockSets);
      });

      act(() => {
        result.current.updateSet(0, 'weight', '85');
      });

      expect(result.current.exerciseSets[0].weight).toBe('85');
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('should update set reps', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.initializeSets(mockSets);
      });

      act(() => {
        result.current.updateSet(1, 'reps', '8');
      });

      expect(result.current.exerciseSets[1].reps).toBe('8');
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('should not update invalid set index', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.initializeSets(mockSets);
      });

      const originalSets = [...result.current.exerciseSets];

      act(() => {
        result.current.updateSet(10, 'weight', '100'); // Index invalide
      });

      expect(result.current.exerciseSets).toEqual(originalSets);
      expect(result.current.hasUnsavedChanges).toBe(false);
    });

    it('should toggle set completion', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.initializeSets(mockSets);
      });

      // Toggle premier set (false -> true)
      let toggleResult: any;
      act(() => {
        toggleResult = result.current.toggleSetCompletion(0);
      });

      expect(result.current.exerciseSets[0].completed).toBe(true);
      expect(result.current.hasUnsavedChanges).toBe(true);
      expect(toggleResult).toEqual({
        newSets: expect.arrayContaining([
          expect.objectContaining({ completed: true }),
          expect.objectContaining({ completed: true }),
          expect.objectContaining({ completed: false })
        ]),
        wasCompleted: false,
        isNowCompleted: true
      });

      // Toggle deuxième set (true -> false)
      act(() => {
        toggleResult = result.current.toggleSetCompletion(1);
      });

      expect(result.current.exerciseSets[1].completed).toBe(false);
      expect(toggleResult).toEqual({
        newSets: expect.arrayContaining([
          expect.objectContaining({ completed: true }),
          expect.objectContaining({ completed: false }),
          expect.objectContaining({ completed: false })
        ]),
        wasCompleted: true,
        isNowCompleted: false
      });
    });

    it('should add a new set', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.initializeSets(mockSets);
      });

      act(() => {
        result.current.addSet();
      });

      expect(result.current.exerciseSets).toHaveLength(4);
      expect(result.current.exerciseSets[3]).toEqual({
        completed: false,
        weight: '',
        reps: ''
      });
      expect(result.current.hasUnsavedChanges).toBe(true);
      expect(Object.keys(result.current.setAnimations)).toHaveLength(4);
    });

    it('should remove a set', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.initializeSets(mockSets);
      });

      act(() => {
        result.current.removeSet(1);
      });

      expect(result.current.exerciseSets).toHaveLength(2);
      expect(result.current.exerciseSets[0]).toEqual(mockSets[0]);
      expect(result.current.exerciseSets[1]).toEqual(mockSets[2]);
      expect(result.current.hasUnsavedChanges).toBe(true);
    });

    it('should not remove the last set', () => {
      const { result } = renderHook(() => useExerciseTracking());

      const singleSet = [{ completed: false, weight: '80', reps: '10' }];

      act(() => {
        result.current.initializeSets(singleSet);
      });

      act(() => {
        result.current.removeSet(0);
      });

      expect(result.current.exerciseSets).toHaveLength(1);
      expect(result.current.hasUnsavedChanges).toBe(false);
    });
  });

  describe('Exercise Management', () => {
    it('should mark exercise as complete', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.markExerciseComplete('exercise1', true);
        result.current.markExerciseComplete('exercise2', false);
      });

      expect(result.current.completedCheckmarks).toEqual({
        exercise1: true,
        exercise2: false
      });
    });

    it('should clear all tracking data', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.initializeSets(mockSets);
      });

      act(() => {
        result.current.markExerciseComplete('exercise1', true);
        result.current.updateSet(0, 'weight', '90'); // Ceci met hasUnsavedChanges à true
      });

      expect(result.current.hasUnsavedChanges).toBe(true);

      act(() => {
        result.current.clearTracking();
      });

      expect(result.current.exerciseSets).toEqual([]);
      expect(result.current.hasUnsavedChanges).toBe(false);
      expect(result.current.completedCheckmarks).toEqual({});
      expect(result.current.setAnimations).toEqual({});
    });
  });

  describe('Getters', () => {
    beforeEach(() => {
      // Mock sets: 1 completed, 2 not completed
    });

    it('should return correct completed sets count', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.initializeSets(mockSets);
      });

      expect(result.current.getCompletedSetsCount()).toBe(1); // Only second set is completed
    });

    it('should return correct total sets count', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.initializeSets(mockSets);
      });

      expect(result.current.getTotalSetsCount()).toBe(3);
    });

    it('should return set by index', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.initializeSets(mockSets);
      });

      expect(result.current.getSetByIndex(1)).toEqual(mockSets[1]);
      expect(result.current.getSetByIndex(10)).toBeUndefined();
    });

    it('should check if set is completed', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.initializeSets(mockSets);
      });

      expect(result.current.isSetCompleted(0)).toBe(false);
      expect(result.current.isSetCompleted(1)).toBe(true);
      expect(result.current.isSetCompleted(2)).toBe(false);
      expect(result.current.isSetCompleted(10)).toBe(false);
    });
  });

  describe('Animations', () => {
    it('should initialize set animations', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.initializeSetAnimations(5);
      });

      expect(Object.keys(result.current.setAnimations)).toHaveLength(5);
      expect(Animated.Value).toHaveBeenCalledTimes(5);
    });

    it('should return set animation or default', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.initializeSets(mockSets);
      });

      const animation = result.current.getSetAnimation(0);
      expect(animation).toBeDefined();

      const defaultAnimation = result.current.getSetAnimation(10);
      expect(defaultAnimation).toBeDefined();
    });

    it('should animate set correctly', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.initializeSets(mockSets);
      });

      act(() => {
        result.current.animateSet(0);
      });

      expect(Animated.sequence).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle toggle completion with invalid index', () => {
      const { result } = renderHook(() => useExerciseTracking());

      act(() => {
        result.current.initializeSets(mockSets);
      });

      const originalSets = [...result.current.exerciseSets];

      let toggleResult1: any;
      let toggleResult2: any;
      act(() => {
        toggleResult1 = result.current.toggleSetCompletion(-1);
        toggleResult2 = result.current.toggleSetCompletion(10);
      });

      expect(result.current.exerciseSets).toEqual(originalSets);
      expect(toggleResult1).toBeNull();
      expect(toggleResult2).toBeNull();
    });

    it('should handle animation errors gracefully', () => {
      const { result } = renderHook(() => useExerciseTracking());

      // Mock une erreur d'animation
      const mockAnimatedValue = {
        setValue: jest.fn(() => { throw new Error('Animation error'); }),
        stopAnimation: jest.fn(),
      };

      act(() => {
        result.current.initializeSets(mockSets);
      });

      // Simuler une erreur d'animation
      const originalError = console.log;
      console.log = jest.fn();

      act(() => {
        // Injecter une animation défaillante
        result.current.setAnimations[0] = mockAnimatedValue as any;
        result.current.animateSet(0);
      });

      expect(console.log).toHaveBeenCalledWith('[useExerciseTracking] Animation error:', expect.any(Error));
      console.log = originalError;
    });

    it('should handle empty sets gracefully', () => {
      const { result } = renderHook(() => useExerciseTracking());

      expect(result.current.getCompletedSetsCount()).toBe(0);
      expect(result.current.getTotalSetsCount()).toBe(0);
      expect(result.current.getSetByIndex(0)).toBeUndefined();
      expect(result.current.isSetCompleted(0)).toBe(false);
    });
  });
});
