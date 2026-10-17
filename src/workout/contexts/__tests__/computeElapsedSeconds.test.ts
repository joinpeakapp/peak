// The context's provider dependencies pull in native modules that do not load under Jest
jest.mock('../StreakContext', () => ({ useStreak: jest.fn() }));
jest.mock('../../../hooks/useWorkout', () => ({ useWorkout: jest.fn() }));
jest.mock('../../../services/storage', () => ({ RobustStorageService: {} }));
jest.mock('../../../services/notificationService', () => ({}));

import { computeElapsedSeconds, ActiveWorkout } from '../ActiveWorkoutContext';

const base = (overrides: Partial<ActiveWorkout>): ActiveWorkout => ({
  workoutId: 'w1',
  workoutName: 'Legs',
  exercises: [],
  startTime: 0,
  elapsedTime: 0,
  trackingData: {},
  isActive: true,
  ...overrides,
});

describe('computeElapsedSeconds', () => {
  it('counts wall-clock time since start, background or kill included', () => {
    // Restored 15 min after start, with a stale elapsedTime and lastResumeTime from an old save
    const workout = base({ startTime: 1_000, elapsedTime: 600, lastResumeTime: 1_000 });
    expect(computeElapsedSeconds(workout, 1_000 + 15 * 60_000)).toBe(15 * 60);
  });

  it('freezes while manually paused and subtracts finished pauses', () => {
    const paused = base({ isActive: false, pausedAt: 10 * 60_000, pausedDuration: 2 * 60_000 });
    expect(computeElapsedSeconds(paused, 30 * 60_000)).toBe(8 * 60);

    const resumed = base({ pausedDuration: 2 * 60_000 });
    expect(computeElapsedSeconds(resumed, 30 * 60_000)).toBe(28 * 60);
  });

  it('never goes negative', () => {
    expect(computeElapsedSeconds(base({ startTime: 5_000 }), 1_000)).toBe(0);
  });
});
