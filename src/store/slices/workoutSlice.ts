import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Workout, WorkoutState, Exercise } from '../../types/workout';
import { StorageService } from '../../services/storage';

// État initial
const initialState: WorkoutState = {
  workouts: [],
  loading: false,
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
    addWorkout: (state, action: PayloadAction<Workout>) => {
      state.workouts.push(action.payload);
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
      // Sauvegarde dans le stockage local
      StorageService.saveWorkouts(state.workouts);
      StorageService.savePersonalRecords(state.personalRecords);
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
        // Sauvegarde dans le stockage local
        StorageService.saveWorkouts(state.workouts);
        StorageService.savePersonalRecords(state.personalRecords);
      }
    },
    // Supprimer une séance
    deleteWorkout: (state, action: PayloadAction<string>) => {
      state.workouts = state.workouts.filter(w => w.id !== action.payload);
      // Sauvegarde dans le stockage local
      StorageService.saveWorkouts(state.workouts);
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
          // Sauvegarde dans le stockage local
          StorageService.saveWorkouts(state.workouts);
          StorageService.savePersonalRecords(state.personalRecords);
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
  },
});

// Action thunk pour charger les données initiales
export const loadInitialData = () => async (dispatch: any) => {
  dispatch(setLoading(true));
  try {
    const [workouts, records] = await Promise.all([
      StorageService.loadWorkouts(),
      StorageService.loadPersonalRecords(),
    ]);
    dispatch(setWorkouts(workouts));
    dispatch(setError(null));
  } catch (error) {
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
} = workoutSlice.actions;

// Export du reducer
export default workoutSlice.reducer; 