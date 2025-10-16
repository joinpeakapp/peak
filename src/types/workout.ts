// Types de tracking pour les exercices
export type TrackingType = 'trackedOnSets' | 'trackedOnTime';

// Types pour les exercices
export interface Exercise {
  id: string;          // Identifiant unique de l'exercice
  name: string;        // Nom de l'exercice
  sets: number;        // Nombre de séries
  reps: number;        // Nombre de répétitions
  weight?: number;     // Poids utilisé (optionnel)
  duration?: number;   // Durée de l'exercice (optionnel)
  notes?: string;      // Notes sur l'exercice (optionnel)
  tags?: string[];     // Tags pour catégoriser les exercices
  tracking?: TrackingType; // Type de tracking (sets ou time)
  restTimeSeconds?: number; // Temps de repos entre les séries en secondes (optionnel)
  personalRecord?: {   // Record personnel pour cet exercice
    weight: number;    // Plus gros poids utilisé
    reps: number;      // Plus grand nombre de répétitions à ce poids
    date: string;      // Date du record
  };
}

// Types unifiés pour les records personnels
export interface PersonalRecord {
  exerciseName: string;        // Nom de l'exercice
  maxWeight: number;           // Poids maximum jamais soulevé
  maxWeightDate: string;       // Date du record de poids
  repsPerWeight: {             // Records de répétitions par poids
    [weight: string]: {        // Le poids comme clé (en string pour JSON)
      reps: number;            // Nombre max de répétitions
      date: string;            // Date du record
    }
  };
}

// Collection de tous les records personnels
export interface PersonalRecords {
  [exerciseName: string]: PersonalRecord;
}

// Types pour la détection de nouveaux PRs
export interface WeightPR {
  isNew: boolean;
  weight: number;
}

export interface RepsPR {
  isNew: boolean;
  weight: number;
  reps: number;
  previousReps: number;
}

// Résultat de vérification de PRs
export interface PRCheckResult {
  weightPR?: WeightPR | null;
  repsPR?: RepsPR | null;
}

// Résultat de mise à jour de PRs
export interface PRUpdateResult {
  updatedRecords: PersonalRecords;
  weightPR?: WeightPR | null;
  repsPR?: RepsPR | null;
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
  frequency: WorkoutFrequency; // Fréquence de l'entraînement
  createdAt?: string;  // Date de création du workout (optionnel)
  updatedAt?: string;  // Date de dernière modification (optionnel)
  streak?: number;     // Nombre actuel de streak pour ce workout
  nextDueDate?: string; // Prochaine date prévue pour ce workout
}

// Pour gestion de la fréquence avec structure
export interface WorkoutFrequency {
  type: 'weekly' | 'interval' | 'none';  // Type de fréquence
  value: number;                         // Valeur numérique (jour de la semaine ou intervalle en jours, 0 pour 'none')
}

// Types pour les streak (séries consécutives d'entraînements)
export interface StreakHistoryEntry {
  startDate: string;    // Date de début de la streak
  endDate: string;      // Date de fin de la streak
  count: number;        // Nombre de jours/fois consécutifs
}

export interface StreakData {
  workoutId: string;          // ID du workout concerné
  current: number;            // Streak actuelle
  longest: number;            // Meilleure streak historique
  lastCompletedDate?: string; // Date de dernière complétion
  streakHistory: StreakHistoryEntry[]; // Historique complet des streaks
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

export interface CompletedSet {
  weight: number;
  reps: number;
  completed: boolean;
}

export interface CompletedExercise {
  id: string;
  name: string;
  sets: CompletedSet[];
  tracking: TrackingType;
  duration?: number;
  personalRecord?: {
    maxWeight: number;
    maxReps: number;
  };
  // Nouveaux champs pour les PR améliorés
  enhancedPersonalRecord?: {
    weightPR?: {         // Record de poids
      isNew: boolean;    // Si c'est un nouveau record
      weight: number;    // Poids du record
    };
    repsPR?: {           // Record de répétitions pour un poids donné
      isNew: boolean;    // Si c'est un nouveau record  
      weight: number;    // Le poids utilisé
      reps: number;      // Nombre de répétitions (nouveau record)
      previousReps: number; // Nombre de répétitions précédent (+1, +2, etc.)
    };
  };
}

// Données historiques des stickers au moment de la séance
export interface StickerHistoricalData {
  starCount: number;    // Nombre de fois que ce workout spécifique a été complété
  streakCount: number;  // Streak au moment de cette séance
  completionCount: number; // Nombre total de séances complétées par l'utilisateur
}

export interface CompletedWorkout {
  id: string;
  workoutId: string;
  name: string;
  date: string;
  duration: number;
  exercises: CompletedExercise[];
  notes?: string;
  photo: string; // URI de la photo prise après la séance
  isFrontCamera?: boolean; // Indique si la photo a été prise avec la caméra frontale
  streakData?: StreakData; // Données de streak au moment de l'achèvement du workout
  stickerData?: StickerHistoricalData; // Valeurs historiques des stickers au moment de la séance
} 