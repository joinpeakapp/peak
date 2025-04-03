import { Workout } from '../types/workout';

const getFutureDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

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
    streak: 12, // Streak active
    nextDueDate: getFutureDate(7), // Prochain dans 7 jours
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
    streak: 0, // Streak inactive
    nextDueDate: getFutureDate(3), // Prochain dans 3 jours
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]; 