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

  const getSelectedDayLabel = () => {
    const day = DAYS_OF_WEEK.find(d => d.value === selectedDay);
    return day ? day.label : '';
  };

  const renderTabContent = () => {
    if (activeTab === 'weekly') {
      return (
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>
            On <Text style={styles.highlightedText}>which day</Text> will you be doing this session?
          </Text>
          <View style={styles.daysGrid}>
            {DAYS_OF_WEEK.map((day) => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayChip,
                  selectedDay === day.value && styles.dayChipSelected
                ]}
                onPress={() => handleDaySelect(day.value)}
              >
                <Text style={[
                  styles.dayChipText,
                  selectedDay === day.value && styles.dayChipTextSelected
                ]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedDay !== null && (
            <Text style={styles.dynamicText}>
              Do this workout <Text style={styles.highlightedText}>every {getSelectedDayLabel()}</Text>
            </Text>
          )}
        </View>
      );
    } else if (activeTab === 'interval') {
      return (
        <View style={styles.contentContainer}>
          <Text style={styles.sectionTitle}>
            How many <Text style={styles.highlightedText}>rest days</Text> do you take between two {name} sessions?
          </Text>
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
                  label={`${days}`} 
                  value={days} 
                />
              ))}
            </Picker>
          </View>
          <Text style={styles.intervalDescription}>
            Repeat this workout <Text style={styles.highlightedText}>every {selectedInterval} {selectedInterval === 1 ? 'day' : 'days'}</Text>
          </Text>
        </View>
      );
    } else if (activeTab === 'none') {
      return (
        <View style={styles.contentContainer}>
          <View style={styles.noneContainer}>
            <View style={styles.noneIconContainer}>
              <Ionicons name="calendar-outline" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.noneTitle}>Flexible Schedule</Text>
            <Text style={styles.noneDescription}>
              No fixed schedule. Train whenever you feel like it and track your progress along the way.
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
            style={[
              styles.tab,
              activeTab === 'weekly' && styles.tabActive
            ]}
            onPress={() => handleTabChange('weekly')}
          >
            <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>
              Weekly
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab,
              activeTab === 'interval' && styles.tabActive
            ]}
            onPress={() => handleTabChange('interval')}
          >
            <Text style={[styles.tabText, activeTab === 'interval' && styles.tabTextActive]}>
              Interval
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tab,
              activeTab === 'none' && styles.tabActive
            ]}
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
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabActive: {
    borderBottomColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.3)',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  // Content
  contentContainer: {
    flex: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
  },
  highlightedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Weekly content - Day chips
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  dayChip: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  dayChipSelected: {
    backgroundColor: '#FFFFFF',
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  dayChipTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
  dynamicText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 24,
  },
  // Interval content
  pickerContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    color: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  pickerItem: {
    fontSize: 36,
    color: '#FFFFFF',
    height: 150,
  },
  intervalDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
  // None content
  noneContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noneIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  noneTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  noneDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Button
  buttonContainer: {
    paddingBottom: Platform.OS === 'ios' ? 48 : 48,
  },
  createButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
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