import { Workout } from '../types/workout';

export const mockWorkouts: Workout[] = [
  {
    id: '1',
    name: 'Push Day',
    date: new Date().toISOString().split('T')[0], // Today
    duration: 60,
    exercises: [],
    frequency: 'Monday',
    series: 12,
  },
  {
    id: '2',
    name: 'Pull Day',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    duration: 75,
    exercises: [],
    frequency: 'Tuesday',
    series: 8,
  },
  {
    id: '3',
    name: 'Legs Day',
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
    duration: 90,
    exercises: [],
    frequency: 'Wednesday',
    series: 15,
  },
  {
    id: '4',
    name: 'Full Body',
    date: new Date(Date.now() + 259200000).toISOString().split('T')[0], // In 3 days
    duration: 120,
    exercises: [],
    frequency: 'Every 3 days',
    series: 5,
  },
  {
    id: '5',
    name: 'New Workout',
    date: new Date(Date.now() + 345600000).toISOString().split('T')[0], // In 4 days
    duration: 45,
    exercises: [],
    frequency: 'Friday',
    series: 0,
  },
]; 