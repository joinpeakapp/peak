import { renderHook, act } from '@testing-library/react-native';
import { useWorkoutSession } from '../useWorkoutSession';
import { PersonalRecords } from '../../../types/workout';

// Mock du service PersonalRecordService
jest.mock('../../../services/personalRecordService', () => ({
  PersonalRecordService: {
    checkWeightPR: jest.fn(),
    checkRepsPR: jest.fn(),
  },
}));

import { PersonalRecordService } from '../../../services/personalRecordService';
const mockedService = PersonalRecordService as jest.Mocked<typeof PersonalRecordService>;

describe('useWorkoutSession', () => {
  const mockRecords: PersonalRecords = {
    'Bench Press': {
      exerciseName: 'Bench Press',
      maxWeight: 80,
      maxWeightDate: '2024-01-01T00:00:00.000Z',
      repsPerWeight: {
        '70': { reps: 8, date: '2024-01-01T00:00:00.000Z' },
        '80': { reps: 5, date: '2024-01-01T00:00:00.000Z' }
      }
    },
    'Squat': {
      exerciseName: 'Squat',
      maxWeight: 100,
      maxWeightDate: '2024-01-02T00:00:00.000Z',
      repsPerWeight: {
        '90': { reps: 6, date: '2024-01-02T00:00:00.000Z' },
        '100': { reps: 3, date: '2024-01-02T00:00:00.000Z' }
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialisation', () => {
    it('should initialize with empty states', () => {
      const { result } = renderHook(() => useWorkoutSession());

      expect(result.current.originalRecords).toEqual({});
      expect(result.current.currentSessionMaxWeights).toEqual({});
      expect(result.current.prResults).toBeNull();
      expect(result.current.exercisePRResults).toEqual({});
    });

    it('should initialize session correctly', () => {
      const { result } = renderHook(() => useWorkoutSession());

      act(() => {
        result.current.initializeSession(mockRecords);
      });

      expect(result.current.originalRecords).toEqual(mockRecords);
      expect(result.current.currentSessionMaxWeights).toEqual({});
      expect(result.current.prResults).toBeNull();
      expect(result.current.exercisePRResults).toEqual({});
    });
  });

  describe('Session Management', () => {
    it('should set original records', () => {
      const { result } = renderHook(() => useWorkoutSession());

      act(() => {
        result.current.setOriginalRecords(mockRecords);
      });

      expect(result.current.originalRecords).toEqual(mockRecords);
    });

    it('should clear session data', () => {
      const { result } = renderHook(() => useWorkoutSession());

      // Initialize with data
      act(() => {
        result.current.initializeSession(mockRecords);
        result.current.safeUpdateSessionWeight('Bench Press', 85);
        result.current.safeSetPrResults({
          setIndex: 0,
          weightPR: { isNew: true, weight: 85 }
        });
      });

      // Clear session
      act(() => {
        result.current.clearSession();
      });

      expect(result.current.currentSessionMaxWeights).toEqual({});
      expect(result.current.prResults).toBeNull();
      expect(result.current.exercisePRResults).toEqual({});
      // Original records should remain unchanged
      expect(result.current.originalRecords).toEqual(mockRecords);
    });
  });

  describe('PR Detection', () => {
    beforeEach(() => {
      mockedService.checkWeightPR.mockReturnValue({ isNew: true, weight: 85 });
      mockedService.checkRepsPR.mockReturnValue({ 
        isNew: true, 
        weight: 70, 
        reps: 10, 
        previousReps: 8 
      });
    });

    it('should check original weight PR correctly', () => {
      const { result } = renderHook(() => useWorkoutSession());

      act(() => {
        result.current.setOriginalRecords(mockRecords);
      });

      const weightPR = result.current.checkOriginalWeightPR('Bench Press', 85);

      expect(mockedService.checkWeightPR).toHaveBeenCalledWith('Bench Press', 85, mockRecords);
      expect(weightPR).toEqual({ isNew: true, weight: 85 });
    });

    it('should check original reps PR correctly', () => {
      const { result } = renderHook(() => useWorkoutSession());

      act(() => {
        result.current.setOriginalRecords(mockRecords);
      });

      const repsPR = result.current.checkOriginalRepsPR('Bench Press', 70, 10);

      expect(mockedService.checkRepsPR).toHaveBeenCalledWith('Bench Press', 70, 10, mockRecords);
      expect(repsPR).toEqual({ 
        isNew: true, 
        weight: 70, 
        reps: 10, 
        previousReps: 8 
      });
    });

    it('should check session weight PR correctly - new PR', () => {
      const { result } = renderHook(() => useWorkoutSession());

      act(() => {
        result.current.setOriginalRecords(mockRecords);
      });

      // Test with weight higher than original record (80kg)
      const weightPR = result.current.checkSessionWeightPR('Bench Press', 85);

      expect(weightPR).toEqual({ isNew: true, weight: 85 });
    });

    it('should check session weight PR correctly - no PR when equal to original', () => {
      const { result } = renderHook(() => useWorkoutSession());

      act(() => {
        result.current.setOriginalRecords(mockRecords);
      });

      // Test with weight equal to original record (80kg)
      const weightPR = result.current.checkSessionWeightPR('Bench Press', 80);

      expect(weightPR).toBeNull();
    });

    it('should check session weight PR correctly - respect session max weights', () => {
      const { result } = renderHook(() => useWorkoutSession());

      act(() => {
        result.current.setOriginalRecords(mockRecords);
        // Set session max weight to 85kg
        result.current.safeUpdateSessionWeight('Bench Press', 85);
      });

      // Test with weight equal to session max (85kg) - should not be PR
      const weightPR1 = result.current.checkSessionWeightPR('Bench Press', 85);
      expect(weightPR1).toBeNull();

      // Test with weight higher than session max (90kg) - should be PR
      const weightPR2 = result.current.checkSessionWeightPR('Bench Press', 90);
      expect(weightPR2).toEqual({ isNew: true, weight: 90 });
    });
  });

  describe('Safe State Updates', () => {
    it('should safely update session weights', () => {
      const { result } = renderHook(() => useWorkoutSession());

      act(() => {
        result.current.safeUpdateSessionWeight('Bench Press', 85);
        result.current.safeUpdateSessionWeight('Squat', 110);
      });

      expect(result.current.currentSessionMaxWeights).toEqual({
        'Bench Press': 85,
        'Squat': 110
      });
    });

    it('should safely set PR results', () => {
      const { result } = renderHook(() => useWorkoutSession());

      const prData = {
        setIndex: 1,
        weightPR: { isNew: true, weight: 85 },
        repsPR: { isNew: true, weight: 70, reps: 10, previousReps: 8 }
      };

      act(() => {
        result.current.safeSetPrResults(prData);
      });

      expect(result.current.prResults).toEqual(prData);
    });

    it('should safely set exercise PR results', () => {
      const { result } = renderHook(() => useWorkoutSession());

      const prData = {
        setIndex: 1,
        weightPR: { isNew: true, weight: 85 }
      };

      act(() => {
        result.current.safeSetExercisePRResults('exercise1', 1, prData);
        result.current.safeSetExercisePRResults('exercise2', 0, prData);
      });

      expect(result.current.exercisePRResults).toEqual({
        'exercise1_set_1': prData,
        'exercise2_set_0': prData
      });
    });
  });

  describe('Reset Functions', () => {
    it('should reset exercise PR results', () => {
      const { result } = renderHook(() => useWorkoutSession());

      // Set some data first
      act(() => {
        result.current.safeSetExercisePRResults('exercise1', 1, {
          setIndex: 1,
          weightPR: { isNew: true, weight: 85 }
        });
      });

      expect(result.current.exercisePRResults).not.toEqual({});

      // Reset
      act(() => {
        result.current.resetExercisePRResults();
      });

      expect(result.current.exercisePRResults).toEqual({});
    });

    it('should reset session max weights', () => {
      const { result } = renderHook(() => useWorkoutSession());

      // Set some data first
      act(() => {
        result.current.safeUpdateSessionWeight('Bench Press', 85);
      });

      expect(result.current.currentSessionMaxWeights).not.toEqual({});

      // Reset
      act(() => {
        result.current.resetSessionMaxWeights();
      });

      expect(result.current.currentSessionMaxWeights).toEqual({});
    });
  });

  describe('Edge Cases', () => {
    it('should handle exercise without original record', () => {
      const { result } = renderHook(() => useWorkoutSession());

      act(() => {
        result.current.setOriginalRecords(mockRecords);
      });

      // Test with exercise not in original records
      const weightPR = result.current.checkSessionWeightPR('New Exercise', 50);

      // Should be a PR since original record is 0
      expect(weightPR).toEqual({ isNew: true, weight: 50 });
    });

    it('should handle setting null PR results', () => {
      const { result } = renderHook(() => useWorkoutSession());

      // Set PR result first
      act(() => {
        result.current.safeSetPrResults({
          setIndex: 1,
          weightPR: { isNew: true, weight: 85 }
        });
      });

      expect(result.current.prResults).not.toBeNull();

      // Set to null
      act(() => {
        result.current.safeSetPrResults(null);
      });

      expect(result.current.prResults).toBeNull();
    });
  });
});
