import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { usePersonalRecords } from '../usePersonalRecords';
import { PersonalRecordService } from '../../services/personalRecordService';

// Mock du service
jest.mock('../../services/personalRecordService');
const mockedService = PersonalRecordService as jest.Mocked<typeof PersonalRecordService>;

// Mock d'AppState
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(),
  },
}));

describe('usePersonalRecords', () => {
  const mockRecords = {
    'Bench Press': {
      exerciseName: 'Bench Press',
      maxWeight: 80,
      maxWeightDate: '2024-01-01T00:00:00.000Z',
      repsPerWeight: {
        '80': { reps: 5, date: '2024-01-01T00:00:00.000Z' }
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedService.loadRecords.mockResolvedValue(mockRecords);
    mockedService.checkWeightPR.mockReturnValue(null);
    mockedService.checkRepsPR.mockReturnValue(null);
    mockedService.checkPRs.mockReturnValue({});
    mockedService.updateRecords.mockReturnValue({
      updatedRecords: mockRecords,
      weightPR: null,
      repsPR: null
    });
  });

  it('should load records on mount', async () => {
    const { result } = renderHook(() => usePersonalRecords());

    expect(result.current.loading).toBe(true);

    await act(async () => {
      // Wait for initial load
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockedService.loadRecords).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.records).toEqual(mockRecords);
  });

  it('should check weight PR correctly', async () => {
    const mockWeightPR = { isNew: true, weight: 85 };
    mockedService.checkWeightPR.mockReturnValue(mockWeightPR);

    const { result } = renderHook(() => usePersonalRecords());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const result_checkWeightPR = result.current.checkWeightPR('Bench Press', 85);

    expect(mockedService.checkWeightPR).toHaveBeenCalledWith('Bench Press', 85, mockRecords);
    expect(result_checkWeightPR).toEqual(mockWeightPR);
  });

  it('should check reps PR correctly', async () => {
    const mockRepsPR = { isNew: true, weight: 80, reps: 8, previousReps: 5 };
    mockedService.checkRepsPR.mockReturnValue(mockRepsPR);

    const { result } = renderHook(() => usePersonalRecords());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const result_checkRepsPR = result.current.checkRepsPR('Bench Press', 80, 8);

    expect(mockedService.checkRepsPR).toHaveBeenCalledWith('Bench Press', 80, 8, mockRecords);
    expect(result_checkRepsPR).toEqual(mockRepsPR);
  });

  it('should update records temporarily without saving', async () => {
    const updatedRecords = {
      ...mockRecords,
      'Bench Press': {
        ...mockRecords['Bench Press'],
        maxWeight: 85
      }
    };

    mockedService.updateRecords.mockReturnValue({
      updatedRecords,
      weightPR: { isNew: true, weight: 85 },
      repsPR: null
    });

    const { result } = renderHook(() => usePersonalRecords());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    let updateResult;
    act(() => {
      updateResult = result.current.updateRecordsTemporary('Bench Press', 85, 5, '2024-01-15T10:00:00.000Z');
    });

    expect(mockedService.updateRecords).toHaveBeenCalledWith(
      'Bench Press',
      85,
      5,
      '2024-01-15T10:00:00.000Z',
      mockRecords
    );
    expect(updateResult).toEqual({
      updatedRecords,
      weightPR: { isNew: true, weight: 85 },
      repsPR: null
    });
    expect(result.current.records).toEqual(updatedRecords);
    // Verify save was NOT called
    expect(mockedService.saveRecords).not.toHaveBeenCalled();
  });

  it('should save records permanently', async () => {
    mockedService.saveRecords.mockResolvedValue();

    const { result } = renderHook(() => usePersonalRecords());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.saveRecords(mockRecords);
    });

    expect(mockedService.saveRecords).toHaveBeenCalledWith(mockRecords);
  });

  it('should update records from completed workout', async () => {
    const mockWorkout = {
      date: '2024-01-15T10:00:00.000Z',
      exercises: [
        {
          name: 'Bench Press',
          sets: [
            { weight: 85, reps: 5, completed: true }
          ]
        }
      ]
    };

    const mockResult = {
      updatedRecords: mockRecords,
      hasUpdates: true
    };

    mockedService.updateRecordsFromCompletedWorkout.mockReturnValue(mockResult);
    mockedService.saveRecords.mockResolvedValue();

    const { result } = renderHook(() => usePersonalRecords());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    let updateResult;
    await act(async () => {
      updateResult = await result.current.updateRecordsFromCompletedWorkout(mockWorkout);
    });

    expect(mockedService.updateRecordsFromCompletedWorkout).toHaveBeenCalledWith(
      mockWorkout,
      mockRecords
    );
    expect(mockedService.saveRecords).toHaveBeenCalledWith(mockRecords);
    expect(updateResult).toEqual(mockResult);
  });

  it('should handle errors gracefully', async () => {
    mockedService.loadRecords.mockRejectedValue(new Error('Load error'));

    const { result } = renderHook(() => usePersonalRecords());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Erreur lors du chargement des records personnels');
    expect(result.current.records).toEqual({});
  });

  it('should migrate from workout history', async () => {
    const mockWorkouts = [
      {
        date: '2024-01-01T00:00:00.000Z',
        exercises: [
          {
            name: 'Bench Press',
            sets: [{ weight: 80, reps: 5, completed: true }]
          }
        ]
      }
    ];

    mockedService.migrateFromWorkoutHistory.mockResolvedValue();

    const { result } = renderHook(() => usePersonalRecords());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.migrateFromWorkoutHistory(mockWorkouts);
    });

    expect(mockedService.migrateFromWorkoutHistory).toHaveBeenCalledWith(mockWorkouts);
    // Should also reload records and notify other instances
    expect(mockedService.loadRecords).toHaveBeenCalledTimes(2); // Once on mount, once after migration
  });

  it('should get records for specific exercise', async () => {
    const exerciseRecord = mockRecords['Bench Press'];
    mockedService.getRecordsForExercise.mockReturnValue(exerciseRecord);

    const { result } = renderHook(() => usePersonalRecords());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const records = result.current.getRecordsForExercise('Bench Press');

    expect(mockedService.getRecordsForExercise).toHaveBeenCalledWith('Bench Press', mockRecords);
    expect(records).toEqual(exerciseRecord);
  });

  describe('AppState handling', () => {
    it('should reload records when app becomes active', async () => {
      let appStateCallback: (state: string) => void = () => {};
      
      (AppState.addEventListener as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'change') {
          appStateCallback = callback;
        }
        return { remove: jest.fn() };
      });

      const { result } = renderHook(() => usePersonalRecords());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Clear the initial load call
      mockedService.loadRecords.mockClear();

      await act(async () => {
        appStateCallback('active');
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockedService.loadRecords).toHaveBeenCalled();
    });
  });

  describe('Validation des règles métier', () => {
    it('should respect Weight PR rule: only strictly superior', async () => {
      // Test que le hook respecte la règle de Weight PR strictement supérieur
      mockedService.checkWeightPR
        .mockReturnValueOnce(null) // 80kg (égal) = pas de PR
        .mockReturnValueOnce({ isNew: true, weight: 81 }); // 81kg (supérieur) = PR

      const { result } = renderHook(() => usePersonalRecords());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const equalWeightResult = result.current.checkWeightPR('Bench Press', 80);
      const higherWeightResult = result.current.checkWeightPR('Bench Press', 81);

      expect(equalWeightResult).toBeNull();
      expect(higherWeightResult).toEqual({ isNew: true, weight: 81 });
    });

    it('should only save PRs when workout is validated', async () => {
      // Test que les PRs ne sont sauvegardés que lors de la validation du workout
      const { result } = renderHook(() => usePersonalRecords());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Mise à jour temporaire - ne devrait PAS sauvegarder
      act(() => {
        result.current.updateRecordsTemporary('Bench Press', 85, 5, '2024-01-15T10:00:00.000Z');
      });

      expect(mockedService.saveRecords).not.toHaveBeenCalled();

      // Sauvegarde explicite - DEVRAIT sauvegarder
      await act(async () => {
        await result.current.saveRecords(mockRecords);
      });

      expect(mockedService.saveRecords).toHaveBeenCalledWith(mockRecords);
    });
  });
});
