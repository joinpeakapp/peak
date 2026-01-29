import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Workout, WorkoutState, Exercise } from '../../types/workout';
import { RobustStorageService } from '../../services/storage';
import NotificationService from '../../services/notificationService';
import logger from '../../utils/logger';

// État initial
const initialState: WorkoutState = {
  workouts: [],
  loading: true, // Commencer avec loading: true pour éviter le flash d'empty state
  error: null,
  personalRecords: {},
};

// Création du slice
const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    setWorkouts: (state, action: PayloadAction<Workout[]>) => {
      state.workouts = action.payload;
    },
    // Ajouter une nouvelle séance
    addWorkout: (state, action: PayloadAction<Omit<Workout, 'id'> | Workout>) => {
      // Si le workout a déjà un ID (cas où il est créé avec un ID spécifique),
      // l'utiliser, sinon générer un nouvel ID
      const hasId = 'id' in action.payload && action.payload.id;
      const id = hasId ? action.payload.id : Date.now().toString() + Math.random().toString(36).substring(2, 9);
      
      // Préserver createdAt et updatedAt s'ils existent, sinon les générer
      const now = new Date().toISOString();
      const newWorkout: Workout = { 
        ...action.payload, 
        id,
        createdAt: action.payload.createdAt || now,
        updatedAt: action.payload.updatedAt || now
      };
      
      state.workouts.push(newWorkout);
      
      // Mise à jour des records personnels
      newWorkout.exercises.forEach(exercise => {
        if (exercise.weight && exercise.reps) {
          const key = `${exercise.name}_${exercise.reps}`;
          const currentRecord = state.personalRecords[key];
          if (!currentRecord || exercise.weight > currentRecord.weight) {
            state.personalRecords[key] = {
              weight: exercise.weight,
              reps: exercise.reps,
              date: newWorkout.date,
            };
          }
        }
      });
      
      // Sauvegarde avec le nouveau service robuste
      RobustStorageService.saveWorkoutTemplates(state.workouts);
      RobustStorageService.savePersonalRecords({
        legacy: state.personalRecords,
        enhanced: {},
        lastUpdated: new Date().toISOString()
      });
    },
    // Mettre à jour une séance existante
    updateWorkout: (state, action: PayloadAction<Workout>) => {
      const index = state.workouts.findIndex(w => w.id === action.payload.id);
      if (index !== -1) {
        state.workouts[index] = action.payload;
        // Mise à jour des records personnels
        action.payload.exercises.forEach(exercise => {
          if (exercise.weight && exercise.reps) {
            const key = `${exercise.name}_${exercise.reps}`;
            const currentRecord = state.personalRecords[key];
            if (!currentRecord || exercise.weight > currentRecord.weight) {
              state.personalRecords[key] = {
                weight: exercise.weight,
                reps: exercise.reps,
                date: action.payload.date,
              };
            }
          }
        });
        // Sauvegarde avec le nouveau service robuste
        RobustStorageService.saveWorkoutTemplates(state.workouts);
        RobustStorageService.savePersonalRecords({
          legacy: state.personalRecords,
          enhanced: {},
          lastUpdated: new Date().toISOString()
        });
      }
    },
    // Supprimer une séance
    deleteWorkout: (state, action: PayloadAction<string>) => {
      const workoutIdToDelete = action.payload;
      // Filtrer le workout à supprimer en se basant sur son ID exact
      state.workouts = state.workouts.filter(workout => workout.id !== workoutIdToDelete);
      
      // Sauvegarde avec le nouveau service robuste
      RobustStorageService.saveWorkoutTemplates(state.workouts);
    },
    // Mettre à jour un exercice dans une séance
    updateExercise: (state, action: PayloadAction<{ workoutId: string; exercise: Exercise }>) => {
      const workout = state.workouts.find(w => w.id === action.payload.workoutId);
      if (workout) {
        const exerciseIndex = workout.exercises.findIndex(e => e.id === action.payload.exercise.id);
        if (exerciseIndex !== -1) {
          workout.exercises[exerciseIndex] = action.payload.exercise;
          // Mise à jour des records personnels
          if (action.payload.exercise.weight && action.payload.exercise.reps) {
            const key = `${action.payload.exercise.name}_${action.payload.exercise.reps}`;
            const currentRecord = state.personalRecords[key];
            if (!currentRecord || action.payload.exercise.weight > currentRecord.weight) {
              state.personalRecords[key] = {
                weight: action.payload.exercise.weight,
                reps: action.payload.exercise.reps,
                date: workout.date,
              };
            }
          }
          // Sauvegarde avec le nouveau service robuste
          RobustStorageService.saveWorkoutTemplates(state.workouts);
          RobustStorageService.savePersonalRecords({
            legacy: state.personalRecords,
            enhanced: {},
            lastUpdated: new Date().toISOString()
          });
        }
      }
    },
    // Gestion du chargement
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    // Gestion des erreurs
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    // Réorganiser les workouts
    reorderWorkouts: (state, action: PayloadAction<Workout[]>) => {
      state.workouts = action.payload;
      // Sauvegarde avec le nouveau service robuste
      RobustStorageService.saveWorkoutTemplates(state.workouts);
    },
    // Effacer toutes les données (reset to new user)
    clearWorkouts: (state) => {
      state.workouts = [];
      state.personalRecords = {};
      state.loading = false;
      state.error = null;
    },
  },
});

// Action thunk pour charger les données initiales
export const loadInitialData = () => async (dispatch: any) => {
  dispatch(setLoading(true));
  try {
    const [workoutsResult, recordsResult] = await Promise.all([
      RobustStorageService.loadWorkoutTemplates(),
      RobustStorageService.loadPersonalRecords(),
    ]);
    
    dispatch(setWorkouts(workoutsResult.data || []));
    
    // Charger les records legacy si disponibles
    if (recordsResult.success && recordsResult.data.legacy) {
      // Les records legacy seront mis à jour via les actions Redux
      }
    
    dispatch(setError(null));
  } catch (error) {
    logger.error('[loadInitialData] Error loading initial data:', error);
    dispatch(setError('Erreur lors du chargement des données'));
  } finally {
    dispatch(setLoading(false));
  }
};

// Action thunk pour ajouter un workout et replanifier les notifications
export const addWorkoutWithNotifications = (workout: Omit<Workout, 'id'> | Workout) => async (dispatch: any) => {
  dispatch(addWorkout(workout));
  
  // Replanifier les notifications si le workout a une fréquence
  if (workout.frequency && workout.frequency.type !== 'none') {
    try {
      if (workout.frequency.type === 'weekly') {
        await NotificationService.scheduleWorkoutReminders();
      }
      // Les workouts à intervalles seront planifiés lors de leur complétion
    } catch (error) {
      logger.error('[addWorkoutWithNotifications] Failed to replan notifications:', error);
    }
  }
};

// Action thunk pour mettre à jour un workout et replanifier les notifications
export const updateWorkoutWithNotifications = (workout: Workout, previousWorkout?: Workout) => async (dispatch: any) => {
  dispatch(updateWorkout(workout));
  
  // Annuler les notifications pour l'ancien workout si nécessaire
  if (previousWorkout) {
    try {
      // Si c'était un workout à intervalle, annuler sa notification
      if (previousWorkout.frequency?.type === 'interval') {
        await NotificationService.cancelWorkoutReminder(previousWorkout.id);
      }
    } catch (error) {
      logger.error('[updateWorkoutWithNotifications] Failed to cancel old notifications:', error);
    }
  }
  
  // Replanifier les notifications selon la nouvelle fréquence
  if (workout.frequency && workout.frequency.type !== 'none') {
    try {
      if (workout.frequency.type === 'weekly') {
        // Replanifier toutes les notifications hebdomadaires
        await NotificationService.scheduleWorkoutReminders();
      }
      // Les workouts à intervalles seront planifiés lors de leur complétion
      // (pas besoin de replanifier ici car ils n'ont pas encore été complétés avec la nouvelle fréquence)
    } catch (error) {
      logger.error('[updateWorkoutWithNotifications] Failed to replan notifications:', error);
    }
  } else {
    // Si le workout n'a plus de fréquence, replanifier pour nettoyer les notifications mixtes
    try {
      await NotificationService.scheduleWorkoutReminders();
    } catch (error) {
      logger.error('[updateWorkoutWithNotifications] Failed to replan notifications:', error);
    }
  }
};

// Action thunk pour supprimer un workout et annuler ses notifications
export const deleteWorkoutWithNotifications = (workoutId: string) => async (dispatch: any, getState: any) => {
  // Récupérer le workout avant de le supprimer pour connaître son type
  const state = getState();
  const workoutToDelete = state.workout.workouts.find((w: Workout) => w.id === workoutId);
  
  dispatch(deleteWorkout(workoutId));
  
  // Annuler les notifications pour ce workout
  if (workoutToDelete) {
    try {
      if (workoutToDelete.frequency?.type === 'interval') {
        // Annuler la notification d'intervalle spécifique
        await NotificationService.cancelWorkoutReminder(workoutId);
      }
      // Replanifier les notifications hebdomadaires (pour gérer les notifications mixtes)
      await NotificationService.scheduleWorkoutReminders();
    } catch (error) {
      logger.error('[deleteWorkoutWithNotifications] Failed to cancel notifications:', error);
    }
  }
};

// Export des actions
export const {
  setWorkouts,
  addWorkout,
  updateWorkout,
  deleteWorkout,
  updateExercise,
  setLoading,
  setError,
  reorderWorkouts,
  clearWorkouts,
} = workoutSlice.actions;

// Export du reducer
export default workoutSlice.reducer; 