import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

// Paramètres pour les écrans de la pile des workouts
export type WorkoutStackParamList = {
  WorkoutsList: undefined;
  WorkoutCreation: undefined;
  WorkoutFrequency: { name: string };
  WorkoutDetail: { workoutId: string };
};

// Paramètres pour les onglets principaux
export type RootTabParamList = {
  Workouts: undefined;
  Journal: undefined;
  Profile: undefined;
};

// Types pour les props des écrans dans la pile des workouts
export type WorkoutsScreenProps = NativeStackScreenProps<
  WorkoutStackParamList,
  'WorkoutsList'
>;

export type WorkoutCreationScreenProps = NativeStackScreenProps<
  WorkoutStackParamList,
  'WorkoutCreation'
>;

export type WorkoutFrequencyScreenProps = NativeStackScreenProps<
  WorkoutStackParamList,
  'WorkoutFrequency'
>;

export type WorkoutDetailScreenProps = NativeStackScreenProps<
  WorkoutStackParamList,
  'WorkoutDetail'
>;

// Types composites qui combinent Tab et Stack navigation
export type WorkoutsTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Workouts'>,
  NativeStackScreenProps<WorkoutStackParamList>
>; 