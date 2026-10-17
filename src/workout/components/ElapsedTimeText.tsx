import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { useWorkoutElapsedSeconds } from '../contexts/ActiveWorkoutContext';
import { formatElapsedTime } from '../utils/workoutUtils';

// Ticks on its own so the screens around it don't re-render every second.
export const ElapsedTimeText: React.FC<{ style?: StyleProp<TextStyle> }> = ({ style }) => {
  const seconds = useWorkoutElapsedSeconds();
  return <Text style={style}>{formatElapsedTime(seconds)}</Text>;
};
