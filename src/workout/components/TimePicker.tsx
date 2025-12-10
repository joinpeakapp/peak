import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface TimePickerProps {
  minutes: number;
  seconds: number;
  onMinutesChange: (minutes: number) => void;
  onSecondsChange: (seconds: number) => void;
}

const MINUTES_OPTIONS = Array.from({ length: 60 }, (_, i) => i);
const SECONDS_OPTIONS = Array.from({ length: 60 }, (_, i) => i);

export const TimePicker: React.FC<TimePickerProps> = ({
  minutes,
  seconds,
  onMinutesChange,
  onSecondsChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={minutes}
          onValueChange={(itemValue) => onMinutesChange(itemValue)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {MINUTES_OPTIONS.map((min) => (
            <Picker.Item 
              key={min} 
              label={min.toString().padStart(2, '0')} 
              value={min} 
            />
          ))}
        </Picker>
      </View>
      
      <Text style={styles.separator}>:</Text>
      
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={seconds}
          onValueChange={(itemValue) => onSecondsChange(itemValue)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {SECONDS_OPTIONS.map((sec) => (
            <Picker.Item 
              key={sec} 
              label={sec.toString().padStart(2, '0')} 
              value={sec} 
            />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  pickerWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  picker: {
    width: '100%',
    color: '#FFFFFF',
  },
  pickerItem: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    height: 100,
  },
  separator: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    marginHorizontal: 8,
  },
});

