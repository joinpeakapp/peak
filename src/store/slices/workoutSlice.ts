import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Workout, WorkoutState, Exercise } from '../../types/workout';
import { RobustStorageService } from '../../services/storage';

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
    addWorkout: (state, action: PayloadAction<Omit<Workout, 'id'>>) => {
      // Générer un ID unique pour le workout
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
      const newWorkout = { 
        ...action.payload, 
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
    console.error('[loadInitialData] Error loading initial data:', error);
    dispatch(setError('Erreur lors du chargement des données'));
  } finally {
    dispatch(setLoading(false));
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
  clearWorkouts,
} = workoutSlice.actions;

// Export du reducer
export default workoutSlice.reducer; 