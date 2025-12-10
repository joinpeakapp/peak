import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RollingDigit } from './RollingDigit';

interface RollingTimerProps {
  totalSeconds: number; // Total time in seconds
  showHours?: boolean; // Whether to show hours (HH:MM:SS) or just MM:SS
}

/**
 * RollingTimer - Displays time with rolling digit animations
 * 
 * Formats time as MM:SS (or HH:MM:SS if showHours is true)
 * Each digit animates independently when it changes
 */
export const RollingTimer: React.FC<RollingTimerProps> = ({ 
  totalSeconds,
  showHours = false 
}) => {
  // Calculate hours, minutes, seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Format as strings with leading zeros
  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = seconds.toString().padStart(2, '0');

  return (
    <View style={styles.container}>
      {/* Hours (if needed) */}
      {showHours && hours > 0 && (
        <>
          <RollingDigit digit={hoursStr[0]} />
          <RollingDigit digit={hoursStr[1]} />
          <Text style={styles.separator}>:</Text>
        </>
      )}
      
      {/* Minutes */}
      <RollingDigit digit={minutesStr[0]} />
      <RollingDigit digit={minutesStr[1]} />
      <Text style={styles.separator}>:</Text>
      
      {/* Seconds */}
      <RollingDigit digit={secondsStr[0]} />
      <RollingDigit digit={secondsStr[1]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    fontSize: 80,
    fontWeight: '700', // Bold
    color: '#FFFFFF',
    marginHorizontal: 2, // Rapprocher les chiffres
  },
});

