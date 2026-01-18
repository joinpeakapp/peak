import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkout } from '../../hooks/useWorkout';
import { WorkoutFrequency } from '../../types/workout';
import { Workout } from '../../types/workout';
import { Picker } from '@react-native-picker/picker';

// Fonction pour générer un ID unique compatible avec Hermes
const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 15);
};

interface WorkoutCreateFrequencyScreenProps {
  name: string;
  onComplete: (workoutId: string) => void;
  onBack: () => void;
}

type FrequencyTab = 'weekly' | 'interval' | 'none';

// ⚠️ IMPORTANT: Les valeurs doivent correspondre à Date.getDay()
// où 0 = Dimanche, 1 = Lundi, 2 = Mardi, etc.
const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },    // Lundi = 1
  { value: 2, label: 'Tuesday' },   // Mardi = 2
  { value: 3, label: 'Wednesday' }, // Mercredi = 3
  { value: 4, label: 'Thursday' },  // Jeudi = 4
  { value: 5, label: 'Friday' },    // Vendredi = 5
  { value: 6, label: 'Saturday' },  // Samedi = 6
  { value: 0, label: 'Sunday' },    // Dimanche = 0
];

// Génerer les options d'intervalle (1-30 jours)
const INTERVAL_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);

export const WorkoutCreateFrequencyScreen: React.FC<WorkoutCreateFrequencyScreenProps> = ({
  name,
  onComplete,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<FrequencyTab>('weekly');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<number>(3); // Default: 3 jours
  const { createWorkout } = useWorkout();
  
  // Animation pour l'indicateur de tab
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;

  const handleDaySelect = (dayValue: number) => {
    setSelectedDay(dayValue);
  };
  
  const handleTabChange = (tab: FrequencyTab) => {
    setActiveTab(tab);
    
    // Animation de l'indicateur
    const tabIndex = tab === 'weekly' ? 0 : tab === 'interval' ? 1 : 2;
    Animated.spring(tabIndicatorPosition, {
      toValue: tabIndex,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const handleCreate = () => {
    let frequency: WorkoutFrequency | null = null;
    
    if (activeTab === 'weekly' && selectedDay !== null) {
      frequency = {
        type: 'weekly',
        value: selectedDay
      };
    } else if (activeTab === 'interval') {
      frequency = {
        type: 'interval',
        value: selectedInterval
      };
    } else if (activeTab === 'none') {
      // Pas de fréquence définie
      frequency = {
        type: 'none' as any, // On va gérer ça dans le type
        value: 0
      };
    }

    if (frequency) {
      // Générer un ID unique pour le workout AVANT de l'ajouter au store
      const workoutId = generateId();
      const now = new Date().toISOString();
      
      // Créer le nouveau workout AVEC l'ID
      const newWorkout: Workout = {
        id: workoutId,
        name,
        date: new Date().toISOString().split('T')[0],
        duration: 0, // Valeur par défaut
        exercises: [],
        frequency,
        createdAt: now,
        updatedAt: now
      };

      // Créer le workout dans le store (le reducer préservera l'ID)
      createWorkout(newWorkout);

      // Terminer le flow en passant l'ID du workout créé
      onComplete(workoutId);
    }
  };
  
  // Vérifier si le bouton Create est actif
  const isCreateButtonEnabled = () => {
    if (activeTab === 'weekly') {
      return selectedDay !== null;
    } else if (activeTab === 'interval') {
      return true; // Toujours un intervalle sélectionné par défaut
    } else if (activeTab === 'none') {
      return true; // Pas de validation nécessaire
    }
    return false;
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const renderTabContent = () => {
    if (activeTab === 'weekly') {
      return (
        <ScrollView 
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {DAYS_OF_WEEK.map((day) => (
            <TouchableOpacity
              key={day.value}
              style={[
                styles.dayOption,
                selectedDay === day.value && styles.dayOptionSelected
              ]}
              onPress={() => handleDaySelect(day.value)}
            >
              <Text style={[
                styles.dayText,
                selectedDay === day.value && styles.dayTextSelected
              ]}>
                {day.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    } else if (activeTab === 'interval') {
      return (
        <View style={styles.contentContainer}>
          <Text style={styles.intervalLabel}>Repeat every</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedInterval}
              onValueChange={(itemValue) => setSelectedInterval(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {INTERVAL_OPTIONS.map((days) => (
                <Picker.Item 
                  key={days} 
                  label={days === 1 ? "1 day" : `${days} days`} 
                  value={days} 
                />
              ))}
            </Picker>
          </View>
          <Text style={styles.intervalDescription}>
            Your workout will repeat every {selectedInterval} {selectedInterval === 1 ? 'day' : 'days'}
          </Text>
        </View>
      );
    } else if (activeTab === 'none') {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.noneContainer}>
            <Ionicons name="time-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.noneTitle}>Flexible schedule</Text>
            <Text style={styles.noneDescription}>
              This workout won't have a specific schedule. You can do it whenever you want.
            </Text>
          </View>
        </View>
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <TouchableOpacity 
          testID="back-button"
          style={styles.backButton} 
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Schedule your workout</Text>
          <Text style={styles.subtitle}>When do you plan to do this workout?</Text>
        </View>
        
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'weekly' && styles.tabActive]}
            onPress={() => handleTabChange('weekly')}
          >
            <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>
              Weekly
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'interval' && styles.tabActive]}
            onPress={() => handleTabChange('interval')}
          >
            <Text style={[styles.tabText, activeTab === 'interval' && styles.tabTextActive]}>
              Interval
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'none' && styles.tabActive]}
            onPress={() => handleTabChange('none')}
          >
            <Text style={[styles.tabText, activeTab === 'none' && styles.tabTextActive]}>
              Flexible
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Content selon le tab actif */}
        {renderTabContent()}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.createButton, !isCreateButtonEnabled() && styles.createButtonDisabled]} 
            onPress={handleCreate}
            disabled={!isCreateButtonEnabled()}
          >
            <Text style={styles.createButtonText}>Create workout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
    paddingHorizontal: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    padding: 8,
  },
  titleContainer: {
    alignItems: 'flex-start',
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Content
  contentContainer: {
    flex: 1,
    marginBottom: 16,
  },
  // Weekly content
  dayOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  dayOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  dayText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  dayTextSelected: {
    fontWeight: '600',
  },
  // Interval content
  intervalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  picker: {
    width: '100%',
    color: '#FFFFFF',
  },
  pickerItem: {
    fontSize: 20,
    color: '#FFFFFF',
    height: 120,
  },
  intervalDescription: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 20,
  },
  // None content
  noneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noneTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
  },
  noneDescription: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Button
  buttonContainer: {
    paddingBottom: Platform.OS === 'ios' ? 48 : 48,
  },
  createButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  createButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: '600',
  },
}); 