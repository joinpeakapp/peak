export interface Workout {
  id: string;
  name: string;
  date: string;
  duration: number;
  exercises: Exercise[];
  notes?: string;
  photos?: string[];
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number;
  notes?: string;
}

export interface WorkoutState {
  workouts: Workout[];
  isLoading: boolean;
  error: string | null;
} 