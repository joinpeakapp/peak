import { PersonalRecordService } from '../personalRecordService';
import UserProfileService from '../userProfileService';
import { PersonalRecords } from '../../types/workout';

// Mock du service de profil utilisateur
jest.mock('../userProfileService');
const mockedUserProfileService = UserProfileService as jest.Mocked<typeof UserProfileService>;

describe('PersonalRecordService', () => {
  let mockRecords: PersonalRecords;

  // Fonction pour créer des données de test fraîches
  const createMockRecords = (): PersonalRecords => ({
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
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRecords = createMockRecords(); // Créer des données fraîches à chaque test
    mockedUserProfileService.getPersonalRecords.mockResolvedValue(mockRecords);
  });

  describe('loadRecords', () => {
    it('should load records from user profile service', async () => {
      const records = await PersonalRecordService.loadRecords();
      
      expect(mockedUserProfileService.getPersonalRecords).toHaveBeenCalled();
      expect(records).toEqual(mockRecords);
    });

    it('should return empty object on error', async () => {
      mockedUserProfileService.getPersonalRecords.mockRejectedValue(new Error('Storage error'));
      
      const records = await PersonalRecordService.loadRecords();
      
      expect(records).toEqual({});
    });
  });

  describe('checkWeightPR', () => {
    it('should detect new weight PR when weight is higher than current max', () => {
      const result = PersonalRecordService.checkWeightPR('Bench Press', 85, mockRecords);
      
      expect(result).toEqual({
        isNew: true,
        weight: 85
      });
    });

    it('should not detect PR when weight equals current max', () => {
      const result = PersonalRecordService.checkWeightPR('Bench Press', 80, mockRecords);
      
      expect(result).toBeNull();
    });

    it('should not detect PR when weight is lower than current max', () => {
      const result = PersonalRecordService.checkWeightPR('Bench Press', 75, mockRecords);
      
      expect(result).toBeNull();
    });

    it('should detect PR for new exercise', () => {
      const result = PersonalRecordService.checkWeightPR('New Exercise', 50, mockRecords);
      
      expect(result).toEqual({
        isNew: true,
        weight: 50
      });
    });

    it('should not detect PR for zero or negative weight', () => {
      const result = PersonalRecordService.checkWeightPR('Bench Press', 0, mockRecords);
      
      expect(result).toBeNull();
    });
  });

  describe('checkRepsPR', () => {
    it('should detect reps PR when improving on existing weight', () => {
      const result = PersonalRecordService.checkRepsPR('Bench Press', 70, 10, mockRecords);
      
      expect(result).toEqual({
        isNew: true,
        weight: 70,
        reps: 10,
        previousReps: 8
      });
    });

    it('should not detect reps PR when reps are equal', () => {
      const result = PersonalRecordService.checkRepsPR('Bench Press', 70, 8, mockRecords);
      
      expect(result).toBeNull();
    });

    it('should not detect reps PR when reps are lower', () => {
      const result = PersonalRecordService.checkRepsPR('Bench Press', 70, 6, mockRecords);
      
      expect(result).toBeNull();
    });

    it('should not detect reps PR for new weight (no previous record)', () => {
      const result = PersonalRecordService.checkRepsPR('Bench Press', 85, 5, mockRecords);
      
      expect(result).toBeNull();
    });

    it('should not detect reps PR for new exercise', () => {
      const result = PersonalRecordService.checkRepsPR('New Exercise', 50, 8, mockRecords);
      
      expect(result).toBeNull();
    });

    it('should not detect PR for zero or negative values', () => {
      const result1 = PersonalRecordService.checkRepsPR('Bench Press', 0, 8, mockRecords);
      const result2 = PersonalRecordService.checkRepsPR('Bench Press', 70, 0, mockRecords);
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('updateRecords', () => {
    const testDate = '2024-01-15T10:00:00.000Z';

    it('should update weight PR and create new exercise record', () => {
      const result = PersonalRecordService.updateRecords(
        'New Exercise',
        60,
        8,
        testDate,
        mockRecords
      );

      expect(result.weightPR).toEqual({
        isNew: true,
        weight: 60
      });
      expect(result.repsPR).toBeNull(); // No reps PR for first record
      expect(result.updatedRecords['New Exercise']).toEqual({
        exerciseName: 'New Exercise',
        maxWeight: 60,
        maxWeightDate: testDate,
        repsPerWeight: {
          '60': { reps: 8, date: testDate }
        }
      });
    });

    it('should update weight PR for existing exercise', () => {
      const result = PersonalRecordService.updateRecords(
        'Bench Press',
        90,
        3,
        testDate,
        mockRecords
      );

      expect(result.weightPR).toEqual({
        isNew: true,
        weight: 90
      });
      expect(result.repsPR).toBeNull();
      expect(result.updatedRecords['Bench Press'].maxWeight).toBe(90);
      expect(result.updatedRecords['Bench Press'].maxWeightDate).toBe(testDate);
    });

    it('should update reps PR for existing weight', () => {
      const result = PersonalRecordService.updateRecords(
        'Bench Press',
        70,
        12,
        testDate,
        mockRecords
      );

      expect(result.weightPR).toBeNull();
      expect(result.repsPR).toEqual({
        isNew: true,
        weight: 70,
        reps: 12,
        previousReps: 8
      });
      expect(result.updatedRecords['Bench Press'].repsPerWeight['70']).toEqual({
        reps: 12,
        date: testDate
      });
    });

    it('should not create records for zero or negative values', () => {
      const result1 = PersonalRecordService.updateRecords('Test', 0, 8, testDate, mockRecords);
      const result2 = PersonalRecordService.updateRecords('Test', 50, 0, testDate, mockRecords);

      expect(result1.updatedRecords).toEqual(mockRecords);
      expect(result2.updatedRecords).toEqual(mockRecords);
    });
  });

  describe('updateRecordsFromCompletedWorkout', () => {
    const mockWorkout = {
      date: '2024-01-15T10:00:00.000Z',
      exercises: [
        {
          name: 'Bench Press',
          sets: [
            { weight: 85, reps: 5, completed: true }, // Should create weight PR (85 > 80)
            { weight: 70, reps: 10, completed: true }, // Should create reps PR (10 > 8)
            { weight: 60, reps: 8, completed: false } // Not completed
          ]
        },
        {
          name: 'New Exercise',
          sets: [
            { weight: 40, reps: 12, completed: true }
          ]
        }
      ]
    };

    it('should process all completed sets and detect PRs', () => {
      const result = PersonalRecordService.updateRecordsFromCompletedWorkout(
        mockWorkout,
        mockRecords
      );

      expect(result.hasUpdates).toBe(true);
      
      // Should detect weight PR for Bench Press (85 > 80)
      expect(result.updatedRecords['Bench Press'].maxWeight).toBe(85);
      
      // Should detect reps PR for Bench Press at 70kg (10 > 8)
      expect(result.updatedRecords['Bench Press'].repsPerWeight['70'].reps).toBe(10);
      
      // Should create new exercise record
      expect(result.updatedRecords['New Exercise']).toBeDefined();
      expect(result.updatedRecords['New Exercise'].maxWeight).toBe(40);
    });

    it('should ignore incomplete sets', () => {
      const workoutWithIncomplete = {
        date: '2024-01-15T10:00:00.000Z',
        exercises: [
          {
            name: 'Bench Press',
            sets: [
              { weight: 100, reps: 5, completed: false } // Should be ignored
            ]
          }
        ]
      };

      const result = PersonalRecordService.updateRecordsFromCompletedWorkout(
        workoutWithIncomplete,
        mockRecords
      );

      expect(result.hasUpdates).toBe(false);
      expect(result.updatedRecords).toEqual(mockRecords);
    });
  });

  describe('saveRecords', () => {
    it('should save records via user profile service', async () => {
      const testRecords: PersonalRecords = { ...mockRecords };
      
      await PersonalRecordService.saveRecords(testRecords);
      
      expect(mockedUserProfileService.updatePersonalRecords).toHaveBeenCalledWith(testRecords);
    });

    it('should throw error if save fails', async () => {
      mockedUserProfileService.updatePersonalRecords.mockRejectedValue(new Error('Save failed'));
      
      await expect(PersonalRecordService.saveRecords(mockRecords)).rejects.toThrow('Save failed');
    });
  });

  describe('getRecordsForExercise', () => {
    it('should return exercise record if exists', () => {
      const result = PersonalRecordService.getRecordsForExercise('Bench Press', mockRecords);
      
      expect(result).toEqual(mockRecords['Bench Press']);
    });

    it('should return null if exercise does not exist', () => {
      const result = PersonalRecordService.getRecordsForExercise('Non-existent', mockRecords);
      
      expect(result).toBeNull();
    });
  });

  describe('Règles métier spécifiques', () => {
    const testDate = '2024-01-15T10:00:00.000Z';

    it('Weight PR: doit être strictement supérieur', () => {
      // Test de la règle: PR détecté seulement si strictement supérieur
      const equalWeight = PersonalRecordService.checkWeightPR('Bench Press', 80, mockRecords);
      const higherWeight = PersonalRecordService.checkWeightPR('Bench Press', 81, mockRecords);
      
      expect(equalWeight).toBeNull(); // Égal = pas de PR
      expect(higherWeight).toEqual({ isNew: true, weight: 81 }); // Supérieur = PR
    });

    it('Un seul badge NEW PR par exercice par session', () => {
      // Cette règle est implémentée dans l'UI, mais on peut tester la logique
      const firstUpdate = PersonalRecordService.updateRecords('Test', 50, 5, testDate, {});
      const secondUpdate = PersonalRecordService.updateRecords('Test', 60, 5, testDate, firstUpdate.updatedRecords);
      
      // Le deuxième update devrait toujours donner un weight PR car 60 > 50
      expect(firstUpdate.weightPR?.isNew).toBe(true);
      expect(secondUpdate.weightPR?.isNew).toBe(true);
    });

    it('Reps PR: nécessite un record précédent pour ce poids', () => {
      // Premier set à 50kg = pas de reps PR
      const firstSet = PersonalRecordService.updateRecords('Test', 50, 8, testDate, {});
      expect(firstSet.repsPR).toBeNull();
      
      // Deuxième set à 50kg avec plus de reps = reps PR
      const secondSet = PersonalRecordService.updateRecords('Test', 50, 10, testDate, firstSet.updatedRecords);
      expect(secondSet.repsPR?.isNew).toBe(true);
      expect(secondSet.repsPR?.reps).toBe(10);
      expect(secondSet.repsPR?.previousReps).toBe(8);
    });
  });
});
