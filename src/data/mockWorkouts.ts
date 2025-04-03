import { Workout } from '../types/workout';

export const mockWorkouts: Workout[] = [
  {
    id: '1',
    name: 'Upper Body',
    date: new Date().toISOString().split('T')[0], // Today
    duration: 60,
    exercises: [],
    frequency: {
      type: 'weekly',
      value: 1 // Tuesday
    },
    series: 12, // Streak active
  },
  {
    id: '2',
    name: 'Lower Body',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    duration: 75,
    exercises: [],
    frequency: {
      type: 'interval',
      value: 3 // Every 3 days
    },
    series: 0, // Streak inactive
  }
]; 