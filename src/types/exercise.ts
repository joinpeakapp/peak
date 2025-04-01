export type BodyPart = 
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'legs'
  | 'calves'
  | 'full-body';

export interface ExerciseCategory {
  id: string;
  name: string;
  bodyPart: BodyPart;
  description?: string;
  icon?: string;
}

export interface Exercise {
  id: string;
  name: string;
  categoryId: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number;
  notes?: string;
  personalRecord?: {
    weight: number;
    reps: number;
    date: string;
  };
}

// Validation des données
export const validateExercise = (exercise: Exercise): string[] => {
  const errors: string[] = [];

  if (exercise.sets < 1) {
    errors.push('Le nombre de séries doit être au moins 1');
  }

  if (exercise.reps < 1) {
    errors.push('Le nombre de répétitions doit être au moins 1');
  }

  if (exercise.weight !== undefined && exercise.weight < 0) {
    errors.push('Le poids ne peut pas être négatif');
  }

  if (exercise.duration !== undefined && exercise.duration < 0) {
    errors.push('La durée ne peut pas être négative');
  }

  return errors;
}; 