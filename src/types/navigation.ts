import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

// Paramètres pour les écrans de la pile des workouts
export type WorkoutStackParamList = {
  WorkoutsList: undefined;
  WorkoutDetail: { workoutId: string };
  WorkoutEdit: { workoutId: string };
  WorkoutCreate: undefined;
};

// Paramètres pour les écrans du journal
export type JournalStackParamList = {
  JournalList: undefined;
  JournalDetail: { entryId: string };
  JournalCreate: undefined;
};

// Paramètres pour les écrans du profil
export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfileEdit: undefined;
  Settings: undefined;
};

// Paramètres pour les onglets principaux
export type RootTabParamList = {
  WorkoutsTab: undefined;
  JournalTab: undefined;
  ProfileTab: undefined;
};

// Types pour les props des écrans dans la pile des workouts
export type WorkoutsListScreenProps = NativeStackScreenProps<
  WorkoutStackParamList,
  'WorkoutsList'
>;

export type WorkoutDetailScreenProps = NativeStackScreenProps<
  WorkoutStackParamList,
  'WorkoutDetail'
>;

export type WorkoutEditScreenProps = NativeStackScreenProps<
  WorkoutStackParamList,
  'WorkoutEdit'
>;

export type WorkoutCreateScreenProps = NativeStackScreenProps<
  WorkoutStackParamList,
  'WorkoutCreate'
>;

// Types composites qui combinent Tab et Stack navigation
export type WorkoutsTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'WorkoutsTab'>,
  NativeStackScreenProps<WorkoutStackParamList>
>;

export type JournalTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'JournalTab'>,
  NativeStackScreenProps<JournalStackParamList>
>;

export type ProfileTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'ProfileTab'>,
  NativeStackScreenProps<ProfileStackParamList>
>; 