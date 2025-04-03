// Types pour les exercices
export interface Exercise {
  id: string;          // Identifiant unique de l'exercice
  name: string;        // Nom de l'exercice
  sets: number;        // Nombre de séries
  reps: number;        // Nombre de répétitions
  weight?: number;     // Poids utilisé (optionnel)
  duration?: number;   // Durée de l'exercice (optionnel)
  notes?: string;      // Notes sur l'exercice (optionnel)
  personalRecord?: {   // Record personnel pour cet exercice
    weight: number;    // Plus gros poids utilisé
    reps: number;      // Plus grand nombre de répétitions à ce poids
    date: string;      // Date du record
  };
}

// Types pour les séances d'entraînement
export interface Workout {
  id: string;          // Identifiant unique de la séance
  name: string;        // Nom de la séance
  date: string;        // Date de la séance
  duration: number;    // Durée en minutes
  exercises: Exercise[]; // Liste des exercices
  notes?: string;      // Notes sur la séance (optionnel)
  photos?: string[];   // Photos de la séance (optionnel)
  frequency: any;      // Format flexible pour permettre des types de fréquence variés
  series: number;      // Nombre de fois que le workout a été réalisé (streak)
}

// Pour gestion de la fréquence avec structure
export interface WorkoutFrequency {
  type: 'weekly' | 'interval';  // Type de fréquence
  value: number;                // Valeur numérique (jour de la semaine ou intervalle en jours)
}

// État initial pour le store Redux
export interface WorkoutState {
  workouts: Workout[];
  loading: boolean;
  error: string | null;
  personalRecords: {
    [key: string]: {
      weight: number;
      reps: number;
      date: string;
    };
  };
} 