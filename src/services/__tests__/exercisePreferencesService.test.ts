import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExercisePreferencesService } from '../exercisePreferencesService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('ExercisePreferencesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveExercisePreferences', () => {
    it('should save exercise preferences successfully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await ExercisePreferencesService.saveExercisePreferences('exercise-1', {
        restTimeSeconds: 120
      });

      expect(result.success).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@peak_exercise_preferences',
        JSON.stringify({
          'exercise-1': {
            restTimeSeconds: 120,
            lastUpdated: expect.any(String)
          }
        })
      );
    });

    it('should merge with existing preferences', async () => {
      const existingData = {
        'exercise-2': {
          restTimeSeconds: 180,
          lastUpdated: '2023-01-01T00:00:00.000Z'
        }
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingData));
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await ExercisePreferencesService.saveExercisePreferences('exercise-1', {
        restTimeSeconds: 120
      });

      expect(result.success).toBe(true);
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@peak_exercise_preferences',
        JSON.stringify({
          'exercise-2': existingData['exercise-2'],
          'exercise-1': {
            restTimeSeconds: 120,
            lastUpdated: expect.any(String)
          }
        })
      );
    });
  });

  describe('getExercisePreferences', () => {
    it('should return preferences for existing exercise', async () => {
      const preferences = {
        'exercise-1': {
          restTimeSeconds: 120,
          lastUpdated: '2023-01-01T00:00:00.000Z'
        }
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(preferences));

      const result = await ExercisePreferencesService.getExercisePreferences('exercise-1');

      expect(result.success).toBe(true);
      expect(result.preferences).toEqual({ restTimeSeconds: 120 });
    });

    it('should return undefined for non-existing exercise', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await ExercisePreferencesService.getExercisePreferences('exercise-1');

      expect(result.success).toBe(true);
      expect(result.preferences).toBeUndefined();
    });
  });

  describe('applyPreferencesToExercises', () => {
    it('should apply preferences to exercises', async () => {
      const preferences = {
        'exercise-1': {
          restTimeSeconds: 120,
          lastUpdated: '2023-01-01T00:00:00.000Z'
        }
      };
      
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(preferences));

      const exercises = [
        { id: 'exercise-1', name: 'Push-ups' },
        { id: 'exercise-2', name: 'Squats' }
      ];

      const result = await ExercisePreferencesService.applyPreferencesToExercises(exercises);

      expect(result).toEqual([
        { id: 'exercise-1', name: 'Push-ups', restTimeSeconds: 120 },
        { id: 'exercise-2', name: 'Squats' }
      ]);
    });
  });
});
