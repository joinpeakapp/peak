import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SettingsService } from '../services/settingsService';
import { Picker } from '@react-native-picker/picker';

const MINUTE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1); // 1 à 10 minutes

export const RestTimerSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedMinutes, setSelectedMinutes] = useState(3);

  useEffect(() => {
    loadDefaultRestTimer();
  }, []);

  const loadDefaultRestTimer = async () => {
    const seconds = await SettingsService.getDefaultRestTimer();
    const minutes = Math.floor(seconds / 60);
    setSelectedMinutes(minutes);
  };

  const handleSave = async () => {
    const seconds = selectedMinutes * 60;
    const result = await SettingsService.setDefaultRestTimer(seconds);
    if (result.success) {
      navigation.goBack();
    }
  };

  const formatTime = (minutes: number): string => {
    return `${minutes} min`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Titre maintenant dans le ScrollView */}
        <Text style={styles.title}>Rest timer</Text>
        <Text style={styles.subtitle}>Default rest time between sets</Text>

        {/* Picker pour sélectionner les minutes */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedMinutes}
            onValueChange={(itemValue) => setSelectedMinutes(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            {MINUTE_OPTIONS.map((min) => (
              <Picker.Item
                key={min}
                label={formatTime(min)}
                value={min}
              />
            ))}
          </Picker>
        </View>

        <Text style={styles.description}>
          This will be the default rest time for all exercises. You can still customize it per exercise.
        </Text>
      </ScrollView>

      {/* Bouton Save fixe en bas */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#0D0D0F',
  },
  backButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Pour le bouton fixe en bas
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingTop: 32,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 24,
    overflow: 'hidden',
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
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: '#0D0D0F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: '600',
  },
});

