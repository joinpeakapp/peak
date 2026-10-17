import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

export interface WorkoutLiveActivityState {
  workoutName: string;
  startedAt: number; // epoch ms
  pausedElapsed?: number; // seconds, only while the workout is paused
  exerciseName?: string;
  completedSets: number;
  totalSets: number;
  restEndsAt?: number; // epoch ms
  restTotal?: number; // seconds
}

interface PeakLiveActivityNativeModule {
  startOrUpdate(workoutId: string, state: WorkoutLiveActivityState): Promise<void>;
  end(): Promise<void>;
}

// null on Android, in Expo Go and in binaries built before this module existed (OTA updates stay safe)
const native =
  Platform.OS === 'ios' ? requireOptionalNativeModule<PeakLiveActivityNativeModule>('PeakLiveActivity') : null;

export const startOrUpdateWorkoutActivity = (workoutId: string, state: WorkoutLiveActivityState) =>
  native?.startOrUpdate(workoutId, state).catch(() => {});

export const endWorkoutActivity = () => native?.end().catch(() => {});
