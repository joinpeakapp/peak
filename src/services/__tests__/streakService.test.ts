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
  });

  describe('isWorkoutInValidTimeWindow', () => {
    it('devrait retourner true pour une première complétion', () => {
      const result = StreakService.isWorkoutInValidTimeWindow(
        undefined,
        mockDate,
        { type: 'weekly', value: 1 }
      );
      
      expect(result).toBe(true);
    });

    it('devrait retourner true si dans la fenêtre valide pour un workout hebdomadaire', () => {
      const lastCompletionDate = format(subDays(mockDate, 6), 'yyyy-MM-dd');
      
      const result = StreakService.isWorkoutInValidTimeWindow(
        lastCompletionDate,
        mockDate,
        { type: 'weekly', value: 1 }
      );
      
      expect(result).toBe(true);
    });

    it('devrait retourner false si hors de la fenêtre valide pour un workout hebdomadaire', () => {
      const lastCompletionDate = format(subDays(mockDate, 10), 'yyyy-MM-dd');
      
      const result = StreakService.isWorkoutInValidTimeWindow(
        lastCompletionDate,
        mockDate,
        { type: 'weekly', value: 1 }
      );
      
      expect(result).toBe(false);
    });

    it('devrait retourner true si dans la fenêtre valide pour un workout par intervalle', () => {
      const lastCompletionDate = format(subDays(mockDate, 2), 'yyyy-MM-dd');
      
      const result = StreakService.isWorkoutInValidTimeWindow(
        lastCompletionDate,
        mockDate,
        { type: 'interval', value: 2 }
      );
      
      expect(result).toBe(true);
    });

    it('devrait retourner false si hors de la fenêtre valide pour un workout par intervalle', () => {
      const lastCompletionDate = format(subDays(mockDate, 4), 'yyyy-MM-dd');
      
      const result = StreakService.isWorkoutInValidTimeWindow(
        lastCompletionDate,
        mockDate,
        { type: 'interval', value: 2 }
      );
      
      expect(result).toBe(false);
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
        lastCompletedDate: format(subDays(mockDate, 21), 'yyyy-MM-dd'), // 3 semaines, hors fenêtre
        streakHistory: [
          {
            startDate: format(subDays(mockDate, 35), 'yyyy-MM-dd'),
            endDate: format(subDays(mockDate, 21), 'yyyy-MM-dd'),
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
    it('devrait retourner 0 si pas de lastCompletedDate', () => {
      const result = StreakService.getDaysUntilStreakLoss(undefined, { type: 'weekly', value: 1 });
      expect(result).toBe(0);
    });

    it('devrait calculer les jours restants pour un workout hebdomadaire', () => {
      // Marge de 2 jours après 7 jours pour weekly
      const lastCompletedDate = format(subDays(mockDate, 5), 'yyyy-MM-dd');
      
      // Il reste 7 + 2 - 5 = 4 jours
      const result = StreakService.getDaysUntilStreakLoss(
        lastCompletedDate,
        { type: 'weekly', value: 1 }
      );
      
      expect(result).toBe(4);
    });

    it('devrait calculer les jours restants pour un workout par intervalle', () => {
      // Marge de 1 jour après l'intervalle
      const lastCompletedDate = format(subDays(mockDate, 1), 'yyyy-MM-dd');
      
      // Il reste 2 + 1 - 1 = 2 jours
      const result = StreakService.getDaysUntilStreakLoss(
        lastCompletedDate,
        { type: 'interval', value: 2 }
      );
      
      expect(result).toBe(2);
    });

    it('devrait retourner 0 si la date limite est déjà passée', () => {
      const lastCompletedDate = format(subDays(mockDate, 10), 'yyyy-MM-dd');
      
      const result = StreakService.getDaysUntilStreakLoss(
        lastCompletedDate,
        { type: 'weekly', value: 1 }
      );
      
      expect(result).toBe(0);
    });
  });
}); 