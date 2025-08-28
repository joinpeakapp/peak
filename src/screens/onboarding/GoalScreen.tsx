import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../../services/userProfileService';

interface GoalScreenProps {
  onComplete: (goal: UserProfile['primaryGoal']) => void;
  onBack: () => void;
}

type GoalOption = {
  goal: UserProfile['primaryGoal'];
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const goalOptions: GoalOption[] = [
  {
    goal: 'strength',
    title: 'Build Strength',
    description: 'Focus on getting stronger',
    icon: 'barbell-outline',
  },
  {
    goal: 'consistency',
    title: 'Stay Consistent',
    description: 'Build lasting habits',
    icon: 'calendar-outline',
  },
  {
    goal: 'progress',
    title: 'Track Progress',
    description: 'Measure your growth',
    icon: 'analytics-outline',
  },
];

export const GoalScreen: React.FC<GoalScreenProps> = ({ 
  onComplete, 
  onBack 
}) => {
  const [selectedGoal, setSelectedGoal] = useState<UserProfile['primaryGoal'] | null>(null);

  const handleComplete = () => {
    if (selectedGoal) {
      onComplete(selectedGoal);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0F" />
      
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Icône */}
        <View style={styles.iconContainer}>
          <Ionicons name="flag-outline" size={48} color="#FFFFFF" />
        </View>

        {/* Titre */}
        <Text style={styles.title}>What's your main focus?</Text>
        
        {/* Sous-titre */}
        <Text style={styles.subtitle}>
          This helps us understand what matters most to you
        </Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {goalOptions.map((option) => (
            <TouchableOpacity
              key={option.goal}
              style={[
                styles.optionCard,
                selectedGoal === option.goal && styles.optionCardSelected
              ]}
              onPress={() => setSelectedGoal(option.goal)}
              activeOpacity={0.8}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  <View style={[
                    styles.optionIconContainer,
                    selectedGoal === option.goal && styles.optionIconContainerSelected
                  ]}>
                    <Ionicons 
                      name={option.icon} 
                      size={24} 
                      color={selectedGoal === option.goal ? "#000000" : "#FFFFFF"} 
                    />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                </View>
                
                <View style={[
                  styles.radioButton,
                  selectedGoal === option.goal && styles.radioButtonSelected
                ]}>
                  {selectedGoal === option.goal && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bouton Complete */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.completeButton,
            !selectedGoal && styles.completeButtonDisabled
          ]}
          onPress={handleComplete}
          disabled={!selectedGoal}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.completeButtonText,
            !selectedGoal && styles.completeButtonTextDisabled
          ]}>
            Get Started
          </Text>
          <Ionicons 
            name="checkmark" 
            size={20} 
            color={selectedGoal ? "#000000" : "#888888"} 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 32,
    padding: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#888888',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
  },
  optionsContainer: {
    width: '100%',
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#1A1A1D',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIconContainerSelected: {
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#888888',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#888888',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#FFFFFF',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  completeButtonDisabled: {
    backgroundColor: '#2A2A2D',
  },
  completeButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButtonTextDisabled: {
    color: '#888888',
  },
}); 