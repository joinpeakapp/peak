import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ExerciseCreateTrackingScreenProps {
  onNext: (tracking: 'trackedOnSets' | 'trackedOnTime') => void;
  onBack: () => void;
}

export const ExerciseCreateTrackingScreen: React.FC<ExerciseCreateTrackingScreenProps> = ({
  onNext,
  onBack
}) => {
  const [trackingType, setTrackingType] = useState<'trackedOnSets' | 'trackedOnTime'>('trackedOnSets');

  const handleNext = () => {
    onNext(trackingType);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Title and subtitle */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Create an exercise</Text>
          <Text style={styles.subtitle}>How do you want to track this exercise?</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.option,
              trackingType === 'trackedOnSets' && styles.optionActive,
            ]}
            onPress={() => setTrackingType('trackedOnSets')}
          >
            <View style={styles.optionContent}>
              <View style={[
                styles.iconContainer,
                trackingType === 'trackedOnSets' && styles.iconContainerActive
              ]}>
                <Ionicons
                  name="barbell-outline"
                  size={20}
                  color={trackingType === 'trackedOnSets' ? '#0D0D0F' : '#FFFFFF'}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[
                  styles.optionTitle,
                  trackingType === 'trackedOnSets' && styles.optionTitleActive,
                ]}>
                  Sets & Reps
                </Text>
                <Text style={[
                  styles.optionDescription,
                  trackingType === 'trackedOnSets' && styles.optionDescriptionActive,
                ]}>
                  Track weight, sets, and repetitions
                </Text>
              </View>
            </View>
            {trackingType === 'trackedOnSets' && (
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              trackingType === 'trackedOnTime' && styles.optionActive,
            ]}
            onPress={() => setTrackingType('trackedOnTime')}
          >
            <View style={styles.optionContent}>
              <View style={[
                styles.iconContainer,
                trackingType === 'trackedOnTime' && styles.iconContainerActive
              ]}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={trackingType === 'trackedOnTime' ? '#0D0D0F' : '#FFFFFF'}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[
                  styles.optionTitle,
                  trackingType === 'trackedOnTime' && styles.optionTitleActive,
                ]}>
                  Time Based
                </Text>
                <Text style={[
                  styles.optionDescription,
                  trackingType === 'trackedOnTime' && styles.optionDescriptionActive,
                ]}>
                  Track duration only
                </Text>
              </View>
            </View>
            {trackingType === 'trackedOnTime' && (
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Next Button */}
        <TouchableOpacity 
          style={styles.nextButton} 
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#0D0D0F" />
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#242526',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#5B5B5C',
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
    marginTop: 32,
  },
  option: {
    backgroundColor: '#1A1A1D',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionActive: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconContainerActive: {
    backgroundColor: '#FFFFFF',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  optionTitleActive: {
    color: '#FFFFFF',
  },
  optionDescription: {
    fontSize: 13,
    color: '#5B5B5C',
    lineHeight: 18,
  },
  optionDescriptionActive: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 48,
  },
  nextButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: '600',
  },
});

