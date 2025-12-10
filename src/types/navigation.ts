import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { CompletedWorkout, Exercise, WorkoutState } from './workout';
import { Sticker } from './stickers';

// Types pour le stack WorkoutTab
export type WorkoutStackParamList = {
  WorkoutsList: undefined;
  WorkoutDetail: { id: string; template?: WorkoutState };
  ExercisesList: undefined;
  ExerciseDetail: { id: string; exercise?: Exercise };
};

// Types pour le stack JournalTab
export type JournalStackParamList = {
  Journal: { newWorkoutId?: string; shouldAnimateWorkout?: boolean };
};

// Types pour le stack ProfileTab
export type ProfileStackParamList = {
  Profile: undefined;
  ExerciseDetail: { exerciseName: string };
  Settings: undefined;
  RestTimerSettings: undefined;
  NotificationSettings: undefined;
};

// Types pour le stack WorkoutSummary (séparé du Tab Navigator)
export type SummaryStackParamList = {
  WorkoutSummary: { 
    workout: CompletedWorkout;
    sourceType?: 'journal' | 'completion';
    workouts?: CompletedWorkout[];
    currentIndex?: number;
    preCalculatedStickers?: Sticker[]; // Stickers pré-calculés pour éviter les appels async
  };
  WorkoutPhoto: { 
    workout: CompletedWorkout;
    fromSummary?: boolean;
  };
  WorkoutOverview: {
    workout: CompletedWorkout;
    photoUri: string;
    sourceType?: 'tracking' | 'journal';
    workouts?: CompletedWorkout[];
    currentIndex?: number;
  };
};

// Types pour le TabNavigator principal
export type MainTabParamList = {
  WorkoutsTab: NavigatorScreenParams<WorkoutStackParamList>;
  JournalTab: NavigatorScreenParams<JournalStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// Définition des types de props pour chaque écran
export type WorkoutsListScreenProps = CompositeScreenProps<
  NativeStackScreenProps<WorkoutStackParamList, 'WorkoutsList'>,
  BottomTabScreenProps<MainTabParamList, 'WorkoutsTab'>
>;

export type WorkoutDetailScreenProps = CompositeScreenProps<
  NativeStackScreenProps<WorkoutStackParamList, 'WorkoutDetail'>,
  BottomTabScreenProps<MainTabParamList, 'WorkoutsTab'>
>;

export type ExercisesListScreenProps = CompositeScreenProps<
  NativeStackScreenProps<WorkoutStackParamList, 'ExercisesList'>,
  BottomTabScreenProps<MainTabParamList, 'WorkoutsTab'>
>;

export type ExerciseDetailScreenProps = CompositeScreenProps<
  NativeStackScreenProps<WorkoutStackParamList, 'ExerciseDetail'>,
  BottomTabScreenProps<MainTabParamList, 'WorkoutsTab'>
>;

export type JournalScreenProps = CompositeScreenProps<
  NativeStackScreenProps<JournalStackParamList, 'Journal'>,
  BottomTabScreenProps<MainTabParamList, 'JournalTab'>
>;

export type ProfileScreenProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, 'Profile'>,
  BottomTabScreenProps<MainTabParamList, 'ProfileTab'>
>;

// Type pour l'écran WorkoutSummary (pas lié au Tab Navigator)
export type WorkoutSummaryScreenProps = NativeStackScreenProps<
  SummaryStackParamList, 
  'WorkoutSummary'
>;

// Type pour le RootNavigator qui contient à la fois les tabs et la stack indépendante
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  SummaryFlow: NavigatorScreenParams<SummaryStackParamList>;
};

// Types pour les écrans au niveau racine
export type RootScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>; 