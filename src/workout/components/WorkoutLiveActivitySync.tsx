import { useEffect, useMemo, useRef } from 'react';
import { useActiveWorkout, TrackingData, computeElapsedSeconds } from '../contexts/ActiveWorkoutContext';
import { useRestTimer } from '../contexts/RestTimerContext';
import { Exercise } from '../../types/workout';
import { endWorkoutActivity, startOrUpdateWorkoutActivity } from '../../../modules/peak-live-activity';

const progressOf = (exercise: Exercise, trackingData: TrackingData) => {
  const data = trackingData[exercise.id];
  if (exercise.tracking === 'trackedOnTime') {
    const times = data?.times ?? [];
    return { completed: times.filter(t => t.completed).length, total: times.length };
  }
  const sets = data?.sets ?? [];
  return { completed: sets.filter(s => s.completed).length, total: sets.length };
};

// Mirrors the active workout and rest timer into the iOS Live Activity. Renders nothing.
export const WorkoutLiveActivitySync: React.FC = () => {
  const { activeWorkout } = useActiveWorkout();
  const { isTimerActive, isPaused, currentTime, totalTime, currentExercise } = useRestTimer();

  // Read on demand only: it ticks every second, and the widget runs its own timers.
  const restRemainingRef = useRef(0);
  restRemainingRef.current = currentTime;

  const workoutId = activeWorkout?.workoutId;
  const isRunning = activeWorkout?.isActive ?? false;
  const exercises = activeWorkout?.exercises;
  const trackingData = activeWorkout?.trackingData;

  // Effective start: shifting by manual pauses makes the widget's count-up match computeElapsedSeconds.
  const startedAt = activeWorkout ? activeWorkout.startTime + (activeWorkout.pausedDuration ?? 0) : 0;

  const restEndsAt = useMemo(
    () => (isTimerActive && !isPaused ? Date.now() + restRemainingRef.current * 1000 : undefined),
    [isTimerActive, isPaused, totalTime, currentExercise?.id]
  );

  // The exercise whose sets changed most recently is the one being worked on.
  const lastTouchedIdRef = useRef<string | null>(null);
  const prevTrackingRef = useRef<TrackingData | undefined>(undefined);
  if (trackingData !== prevTrackingRef.current) {
    const prev = prevTrackingRef.current;
    if (prev && trackingData) {
      const changed = Object.keys(trackingData).find(id => trackingData[id] !== prev[id]);
      if (changed) lastTouchedIdRef.current = changed;
    }
    prevTrackingRef.current = trackingData;
  }

  const wasActiveRef = useRef(false);

  useEffect(() => {
    if (!activeWorkout || !exercises || !trackingData) {
      // Only end on an actual finish/abandon, not on the empty state before a session is restored.
      if (wasActiveRef.current) endWorkoutActivity();
      wasActiveRef.current = false;
      lastTouchedIdRef.current = null;
      return;
    }
    wasActiveRef.current = true;

    const focus =
      exercises.find(e => e.id === currentExercise?.id && isTimerActive) ??
      exercises.find(e => e.id === lastTouchedIdRef.current) ??
      exercises.find(e => {
        const { completed, total } = progressOf(e, trackingData);
        return completed < total;
      }) ??
      exercises[exercises.length - 1];
    const progress = focus ? progressOf(focus, trackingData) : { completed: 0, total: 0 };

    startOrUpdateWorkoutActivity(activeWorkout.workoutId, {
      workoutName: activeWorkout.workoutName,
      startedAt,
      pausedElapsed: isRunning ? undefined : computeElapsedSeconds(activeWorkout),
      exerciseName: focus?.name,
      completedSets: progress.completed,
      totalSets: progress.total,
      restEndsAt,
      restTotal: restEndsAt ? totalTime : undefined,
    });
    // Depend on the fields shown, not on activeWorkout itself (photo, PR data… change it too).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId, activeWorkout?.workoutName, isRunning, exercises, trackingData, startedAt, restEndsAt]);

  return null;
};
