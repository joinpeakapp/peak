import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  addWorkout,
  updateWorkout,
  deleteWorkout,
  updateExercise,
  setLoading,
  setError,
} from '../store/slices/workoutSlice';
import { Workout, Exercise } from '../types/workout';

/**
 * Custom hook for managing workouts in the application.
 * Provides functions to create, modify, and delete workouts, as well as track personal records.
 * 
 * @returns {Object} An object containing:
 * - workouts: Array of all workouts
 * - loading: Loading state
 * - error: Error state
 * - personalRecords: Object containing personal records for each exercise
 * - createWorkout: Function to create a new workout
 * - modifyWorkout: Function to modify an existing workout
 * - removeWorkout: Function to delete a workout
 * - modifyExercise: Function to modify an exercise within a workout
 * - checkPersonalRecord: Function to check if a new personal record has been achieved
 * - getPersonalRecord: Function to get the personal record for a specific exercise
 * 
 * @example
 * ```tsx
 * const {
 *   workouts,
 *   createWorkout,
 *   modifyWorkout,
 *   personalRecords
 * } = useWorkout();
 * 
 * // Create a new workout
 * createWorkout({
 *   name: 'Morning Workout',
 *   date: '2024-03-20',
 *   duration: 60,
 *   exercises: [],
 *   frequency: 'Monday',
 *   series: 0
 * });
 * ```
 */
export const useWorkout = () => {
  const dispatch = useDispatch();
  const { workouts, loading, error, personalRecords } = useSelector(
    (state: RootState) => state.workout
  );

  /**
   * Creates a new workout and adds it to the store.
   * @param workout - The workout to create (without ID)
   */
  const createWorkout = (workout: Omit<Workout, 'id'>) => {
    dispatch(addWorkout(workout));
  };

  /**
   * Modifies an existing workout in the store.
   * @param workout - The updated workout
   */
  const modifyWorkout = (workout: Workout) => {
    dispatch(updateWorkout(workout));
  };

  /**
   * Removes a workout from the store.
   * @param workoutId - The ID of the workout to remove
   */
  const removeWorkout = (workoutId: string) => {
    console.log('Removing workout with ID:', workoutId);
    dispatch(deleteWorkout(workoutId));
  };

  /**
   * Modifies an exercise within a workout.
   * @param workoutId - The ID of the workout containing the exercise
   * @param exerciseId - The ID of the exercise to modify
   * @param exercise - The updated exercise
   */
  const modifyExercise = (workoutId: string, exerciseId: string, exercise: Exercise) => {
    dispatch(updateExercise({ workoutId, exercise }));
  };

  /**
   * Checks if a new personal record has been achieved for an exercise.
   * @param exerciseName - The name of the exercise
   * @param weight - The weight used
   * @param reps - The number of repetitions
   * @returns boolean indicating if a new record was achieved
   */
  const checkPersonalRecord = (exerciseName: string, weight: number, reps: number): boolean => {
    const currentRecord = personalRecords[exerciseName];
    if (!currentRecord) return true;
    return weight > currentRecord.weight || (weight === currentRecord.weight && reps > currentRecord.reps);
  };

  /**
   * Gets the personal record for a specific exercise.
   * @param exerciseName - The name of the exercise
   * @returns The personal record or null if no record exists
   */
  const getPersonalRecord = (exerciseName: string) => {
    return personalRecords[exerciseName] || null;
  };

  return {
    workouts,
    loading,
    error,
    personalRecords,
    createWorkout,
    modifyWorkout,
    removeWorkout,
    modifyExercise,
    checkPersonalRecord,
    getPersonalRecord,
  };
}; 