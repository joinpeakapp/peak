import { StreakService } from '../streakService';
import { StorageService } from '../storage';
import { StreakData, Workout } from '../../types/workout';
import { addDays, subDays, format } from 'date-fns';

// Mock du storage service
jest.mock('../storage', () => ({
  StorageService: {
    saveWorkoutStreak: jest.fn(),
    loadWorkoutStreak: jest.fn(),
    loadWorkoutStreaks: jest.fn(),
  }
}));

describe('StreakService', () => {
  const mockWorkoutId = 'workout-123';
  const mockDate = new Date('2023-06-15');

  beforeEach(() => {
    jest.resetAllMocks();
    // Mock de format date
    jest.spyOn(global.Date, 'now').mockImplementation(() => mockDate.getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initializeStreak', () => {
    it('devrait initialiser une nouvelle streak', () => {
      const result = StreakService.initializeStreak(mockWorkoutId);
      
      expect(result).toEqual({
        workoutId: mockWorkoutId,
        current: 0,
        longest: 0,
        lastCompletedDate: undefined,
        streakHistory: []
      });
      
      expect(StorageService.saveWorkoutStreak).toHaveBeenCalledWith(
        mockWorkoutId,
        expect.objectContaining({
          workoutId: mockWorkoutId,
          current: 0,
          longest: 0,
          lastCompletedDate: undefined,
          streakHistory: []
        })
      );
    });
  });

  describe('getWorkoutStreak', () => {
    it('devrait retourner les données de streak existantes', async () => {
      const mockStreak: StreakData = {
        workoutId: mockWorkoutId,
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
      };
      
      (StorageService.loadWorkoutStreak as jest.Mock).mockResolvedValue(mockStreak);
      
      const result = await StreakService.getWorkoutStreak(mockWorkoutId);
      
      expect(result).toEqual(mockStreak);
      expect(StorageService.loadWorkoutStreak).toHaveBeenCalledWith(mockWorkoutId);
    });

    it('devrait initialiser une nouvelle streak si aucune données n\'existe', async () => {
      (StorageService.loadWorkoutStreak as jest.Mock).mockResolvedValue(null);
      
      const result = await StreakService.getWorkoutStreak(mockWorkoutId);
      
      expect(result).toEqual({
        workoutId: mockWorkoutId,
        current: 0,
        longest: 0,
        lastCompletedDate: undefined,
        streakHistory: []
      });
      
      expect(StorageService.saveWorkoutStreak).toHaveBeenCalledWith(
        mockWorkoutId,
        expect.any(Object)
      );
    });

    it('devrait valider et réinitialiser une streak expirée', async () => {
      const mockWorkout: Workout = {
        id: mockWorkoutId,
        name: 'Test Workout',
        date: '2023-06-15',
        duration: 60,
        exercises: [],
        frequency: { type: 'weekly', value: 1 }
      };

      const expiredStreak: StreakData = {
        workoutId: mockWorkoutId,
        current: 3,
        longest: 5,
        lastCompletedDate: '2023-05-30', // Plus de 15 jours = expiré avec nouvelle logique
        streakHistory: [
          {
            startDate: '2023-05-10',
            endDate: '2023-05-30',
            count: 3
          }
        ]
      };
      
      (StorageService.loadWorkoutStreak as jest.Mock).mockResolvedValue(expiredStreak);
      
      const result = await StreakService.getWorkoutStreak(mockWorkoutId, mockWorkout);
      
      expect(result.current).toBe(0);
      expect(result.longest).toBe(5); // Reste inchangé
      expect(StorageService.saveWorkoutStreak).toHaveBeenCalledWith(
        mockWorkoutId,
        expect.objectContaining({ current: 0 })
      );
    });
  });

  describe('isWorkoutInValidTimeWindow', () => {
    it('devrait retourner true si lastCompletionDate est undefined', () => {
      const result = StreakService.isWorkoutInValidTimeWindow(
        undefined,
        mockDate,
        { type: 'weekly', value: 1 }
      );
      
      expect(result).toBe(true);
    });

    it('devrait retourner true pour un workout hebdomadaire dans les temps', () => {
      const lastDate = format(subDays(mockDate, 14), 'yyyy-MM-dd'); // 14 jours = limite
      
      const result = StreakService.isWorkoutInValidTimeWindow(
        lastDate,
        mockDate,
        { type: 'weekly', value: 1 }
      );
      
      expect(result).toBe(true);
    });

    it('devrait retourner false pour un workout hebdomadaire trop tardif', () => {
      const lastDate = format(subDays(mockDate, 15), 'yyyy-MM-dd'); // 15 jours = trop tardif
      
      const result = StreakService.isWorkoutInValidTimeWindow(
        lastDate,
        mockDate,
        { type: 'weekly', value: 1 }
      );
      
      expect(result).toBe(false);
    });

    it('devrait retourner true pour un workout par intervalles dans les temps', () => {
      const lastDate = format(subDays(mockDate, 6), 'yyyy-MM-dd'); // 6 jours = limite pour intervalle de 3
      
      const result = StreakService.isWorkoutInValidTimeWindow(
        lastDate,
        mockDate,
        { type: 'interval', value: 3 }
      );
      
      expect(result).toBe(true);
    });

    it('devrait retourner false pour un workout par intervalles trop tardif', () => {
      const lastDate = format(subDays(mockDate, 7), 'yyyy-MM-dd'); // 7 jours pour un intervalle de 3 = trop tardif
      
      const result = StreakService.isWorkoutInValidTimeWindow(
        lastDate,
        mockDate,
        { type: 'interval', value: 3 }
      );
      
      expect(result).toBe(false);
    });
  });

  describe('validateAndCleanAllStreaks', () => {
    it('devrait nettoyer les streaks expirées', async () => {
      const mockWorkouts: Workout[] = [
        {
          id: 'workout-1',
          name: 'Workout 1',
          date: '2023-06-15',
          duration: 60,
          exercises: [],
          frequency: { type: 'weekly', value: 1 }
        },
        {
          id: 'workout-2',
          name: 'Workout 2',
          date: '2023-06-15',
          duration: 60,
          exercises: [],
          frequency: { type: 'interval', value: 3 }
        }
      ];

      const mockStreaks = {
        'workout-1': {
          workoutId: 'workout-1',
          current: 3,
          longest: 5,
          lastCompletedDate: '2023-05-30', // Plus de 15 jours = expiré pour weekly
          streakHistory: []
        },
        'workout-2': {
          workoutId: 'workout-2',
          current: 2,
          longest: 4,
          lastCompletedDate: '2023-06-12', // 3 jours = valide pour intervalle de 3 (limite = 6 jours)
          streakHistory: []
        }
      };

      (StorageService.loadWorkoutStreaks as jest.Mock).mockResolvedValue(mockStreaks);

      await StreakService.validateAndCleanAllStreaks(mockWorkouts);

      // Vérifier que seule la première streak a été réinitialisée
      expect(StorageService.saveWorkoutStreak).toHaveBeenCalledWith(
        'workout-1',
        expect.objectContaining({ current: 0 })
      );

      // Vérifier que la deuxième streak n'a pas été touchée
      expect(StorageService.saveWorkoutStreak).not.toHaveBeenCalledWith(
        'workout-2',
        expect.anything()
      );
    });

    it('devrait gérer les erreurs gracieusement', async () => {
      (StorageService.loadWorkoutStreaks as jest.Mock).mockRejectedValue(new Error('Storage error'));

      // Ne devrait pas throw
      await expect(StreakService.validateAndCleanAllStreaks([])).resolves.toBeUndefined();
    });
  });

  describe('updateStreakOnCompletion', () => {
    const mockWeeklyWorkout: Workout = {
      id: mockWorkoutId,
      name: 'Test Workout',
      date: '2023-06-15',
      duration: 60,
      exercises: [],
      frequency: { type: 'weekly', value: 1 }
    };

    it('devrait initialiser une streak pour une première complétion', async () => {
      (StorageService.loadWorkoutStreak as jest.Mock).mockResolvedValue(null);
      
      const result = await StreakService.updateStreakOnCompletion(mockWeeklyWorkout, mockDate);
      
      expect(result).toEqual({
        workoutId: mockWorkoutId,
        current: 1,
        longest: 1,
        lastCompletedDate: format(mockDate, 'yyyy-MM-dd'),
        streakHistory: [
          {
            startDate: format(mockDate, 'yyyy-MM-dd'),
            endDate: format(mockDate, 'yyyy-MM-dd'),
            count: 1
          }
        ]
      });
      
      expect(StorageService.saveWorkoutStreak).toHaveBeenCalledWith(
        mockWorkoutId,
        expect.objectContaining({
          current: 1,
          longest: 1
        })
      );
    });

    it('devrait incrémenter la streak si dans la fenêtre valide', async () => {
      const mockExistingStreak: StreakData = {
        workoutId: mockWorkoutId,
        current: 2,
        longest: 3,
        lastCompletedDate: format(subDays(mockDate, 7), 'yyyy-MM-dd'),
        streakHistory: [
          {
            startDate: format(subDays(mockDate, 14), 'yyyy-MM-dd'),
            endDate: format(subDays(mockDate, 7), 'yyyy-MM-dd'),
            count: 2
          }
        ]
      };
      
      (StorageService.loadWorkoutStreak as jest.Mock).mockResolvedValue(mockExistingStreak);
      
      const result = await StreakService.updateStreakOnCompletion(mockWeeklyWorkout, mockDate);
      
      expect(result.current).toBe(3);
      expect(result.lastCompletedDate).toBe(format(mockDate, 'yyyy-MM-dd'));
      expect(result.streakHistory[0].count).toBe(3);
      expect(result.streakHistory[0].endDate).toBe(format(mockDate, 'yyyy-MM-dd'));
      
      expect(StorageService.saveWorkoutStreak).toHaveBeenCalled();
    });

    it('devrait mettre à jour la streak la plus longue si nécessaire', async () => {
      const mockExistingStreak: StreakData = {
        workoutId: mockWorkoutId,
        current: 3,
        longest: 3,
        lastCompletedDate: format(subDays(mockDate, 7), 'yyyy-MM-dd'),
        streakHistory: [
          {
            startDate: format(subDays(mockDate, 21), 'yyyy-MM-dd'),
            endDate: format(subDays(mockDate, 7), 'yyyy-MM-dd'),
            count: 3
          }
        ]
      };
      
      (StorageService.loadWorkoutStreak as jest.Mock).mockResolvedValue(mockExistingStreak);
      
      const result = await StreakService.updateStreakOnCompletion(mockWeeklyWorkout, mockDate);
      
      expect(result.current).toBe(4);
      expect(result.longest).toBe(4);
      
      expect(StorageService.saveWorkoutStreak).toHaveBeenCalled();
    });

    it('devrait réinitialiser la streak si hors de la fenêtre valide', async () => {
      const mockExistingStreak: StreakData = {
        workoutId: mockWorkoutId,
        current: 3,
        longest: 5,
        lastCompletedDate: format(subDays(mockDate, 16), 'yyyy-MM-dd'), // 16 jours, hors fenêtre (limite = 14)
        streakHistory: [
          {
            startDate: format(subDays(mockDate, 30), 'yyyy-MM-dd'),
            endDate: format(subDays(mockDate, 16), 'yyyy-MM-dd'),
            count: 3
          }
        ]
      };
      
      (StorageService.loadWorkoutStreak as jest.Mock).mockResolvedValue(mockExistingStreak);
      
      const result = await StreakService.updateStreakOnCompletion(mockWeeklyWorkout, mockDate);
      
      expect(result.current).toBe(1);
      expect(result.longest).toBe(5); // Inchangé
      expect(result.streakHistory.length).toBe(2);
      expect(result.streakHistory[1].count).toBe(1);
      expect(result.streakHistory[1].startDate).toBe(format(mockDate, 'yyyy-MM-dd'));
      
      expect(StorageService.saveWorkoutStreak).toHaveBeenCalled();
    });
  });

  describe('getDaysUntilStreakLoss', () => {
    it('devrait retourner 0 si pas de lastCompletionDate', () => {
      const result = StreakService.getDaysUntilStreakLoss(
        undefined,
        { type: 'weekly', value: 1 }
      );
      
      expect(result).toBe(0);
    });

    it('devrait calculer correctement les jours restants pour un workout hebdomadaire', () => {
      const lastDate = format(subDays(mockDate, 5), 'yyyy-MM-dd');
      
      const result = StreakService.getDaysUntilStreakLoss(
        lastDate,
        { type: 'weekly', value: 1 }
      );
      
      // 14 jours (2x7) - 5 jours écoulés = 9 jours restants
      expect(result).toBe(9);
    });

    it('devrait retourner 0 si la deadline est dépassée', () => {
      const lastDate = format(subDays(mockDate, 16), 'yyyy-MM-dd'); // Plus de 14 jours
      
      const result = StreakService.getDaysUntilStreakLoss(
        lastDate,
        { type: 'weekly', value: 1 }
      );
      
      expect(result).toBe(0);
    });
  });
}); 