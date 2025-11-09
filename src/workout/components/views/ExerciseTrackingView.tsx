import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '../../../types/workout';
import { SetRow } from '../SetRow';
import { TrackingSet } from '../../contexts/ActiveWorkoutContext';

interface ExerciseTrackingViewProps {
  exercise: Exercise | null;
  exerciseSets: TrackingSet[];
  setAnimations: Animated.Value[];
  prResults?: {
    setIndex: number;
    weightPR?: { isNew: boolean; weight: number } | null;
    repsPR?: { isNew: boolean; reps: number } | null;
  } | null;
  exercisePRResults: Record<string, {
    weightPR?: { isNew: boolean; weight: number } | null;
    repsPR?: { isNew: boolean; reps: number } | null;
  }>;
  selectedExerciseId: string | null;
  prBadgeAnim: Animated.Value;
  onBack: () => void;
  onOpenTimerSettings: () => void;
  onSetToggle: (index: number) => void;
  onWeightChange: (index: number, value: string) => void;
  onRepsChange: (index: number, value: string) => void;
  onRemoveSet: (index: number) => void;
  onAddSet: () => void;
}

export const ExerciseTrackingView: React.FC<ExerciseTrackingViewProps> = ({
  exercise,
  exerciseSets,
  setAnimations,
  prResults,
  exercisePRResults,
  selectedExerciseId,
  prBadgeAnim,
  onBack,
  onOpenTimerSettings,
  onSetToggle,
  onWeightChange,
  onRepsChange,
  onRemoveSet,
  onAddSet,
}) => {
  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.rightButtons}>
          <TouchableOpacity 
            style={[styles.settingsButton, { marginRight: 16 }]}
            onPress={onOpenTimerSettings}
          >
            <Ionicons name="timer-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.exerciseTrackingTitle}>
        {exercise?.name || 'Exercise'}
      </Text>
      
      <Text style={styles.exerciseTrackingSubtitle}>
        Tick checkboxes as you complete the sets
      </Text>
      
      <View style={styles.scrollableContainer}>
        <ScrollView 
          style={[styles.content, { overflow: 'visible' }]}
          contentContainerStyle={{ overflow: 'visible' }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.setsContainer, { overflow: 'visible' }]}>
            {exerciseSets.map((set, index) => {
              // Déterminer les données PR pour ce set
              const prData = prResults && prResults.setIndex === index 
                ? {
                    weightPR: prResults.weightPR,
                    repsPR: prResults.repsPR,
                    prBadgeAnim: prBadgeAnim
                  }
                : selectedExerciseId && exercisePRResults[`${selectedExerciseId}_set_${index}`]
                  ? {
                      weightPR: exercisePRResults[`${selectedExerciseId}_set_${index}`]?.weightPR,
                      repsPR: exercisePRResults[`${selectedExerciseId}_set_${index}`]?.repsPR,
                      prBadgeAnim: prBadgeAnim
                    }
                  : undefined;

              return (
                <SetRow
                  key={index}
                  set={set}
                  index={index}
                  animation={setAnimations[index] || new Animated.Value(1)}
                  onToggle={onSetToggle}
                  onWeightChange={onWeightChange}
                  onRepsChange={onRepsChange}
                  onRemove={onRemoveSet}
                  prData={prData}
                />
              );
            })}
          </View>
          
          <TouchableOpacity 
            style={styles.addSetContainer}
            onPress={onAddSet}
          >
            <View style={styles.addSetButton}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.addSetText}>Add a set</Text>
          </TouchableOpacity>
          
          {/* Padding de bas pour assurer le défilement complet */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#242526',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseTrackingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 32,
    paddingHorizontal: 16,
  },
  exerciseTrackingSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#5B5B5C',
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  scrollableContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    overflow: 'visible',
  },
  setsContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 8,
    overflow: 'visible',
  },
  addSetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  addSetButton: {
    width: 48,
    height: 48,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSetText: {
    marginLeft: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
  bottomPadding: {
    height: 80,
  },
});

