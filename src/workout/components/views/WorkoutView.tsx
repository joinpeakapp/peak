import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout, Exercise } from '../../../types/workout';
import { getExerciseProgressText, getExerciseCompletionData } from '../../utils/workoutUtils';
import { formatElapsedTime } from '../../utils/workoutUtils';

interface WorkoutViewProps {
  workout: Workout;
  exercises: Exercise[];
  isTrackingWorkout: boolean;
  activeWorkout?: any;
  animations: {
    exerciseBounceAnimations: Record<string, Animated.Value>;
    exerciseProgressAnimations: Record<string, Animated.Value>;
  };
  onClose: () => void;
  onStartWorkout: () => void;
  onFinishWorkout: () => void;
  onAddExercise: () => void;
  onExerciseTracking: (exerciseId: string) => void;
  onExerciseSettings: (exerciseId: string, event: any) => void;
  onWorkoutEdit: () => void;
  renderEmptyState: () => React.ReactNode;
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({
  workout,
  exercises,
  isTrackingWorkout,
  activeWorkout,
  animations,
  onClose,
  onStartWorkout,
  onFinishWorkout,
  onAddExercise,
  onExerciseTracking,
  onExerciseSettings,
  onWorkoutEdit,
  renderEmptyState,
}) => {
  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.rightButtons}>
          {!isTrackingWorkout && (
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={onWorkoutEdit}
            >
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[
              isTrackingWorkout ? styles.finishButton : styles.startButton
            ]}
            onPress={isTrackingWorkout ? onFinishWorkout : onStartWorkout}
          >
            <Text 
              style={[
                isTrackingWorkout ? styles.finishButtonText : styles.startButtonText
              ]}
            >
              {isTrackingWorkout ? "Finish" : "Start"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {isTrackingWorkout && activeWorkout && (
        <Text style={styles.workoutTimer}>
          {formatElapsedTime(activeWorkout.elapsedTime)}
        </Text>
      )}
      
      <View style={styles.workoutHeaderContainer}>
        <Text 
          style={[
            styles.workoutName,
            isTrackingWorkout && styles.workoutNameSmall
          ]}
        >
          {workout.name}
        </Text>
      </View>
      
      <View style={styles.scrollableContainer}>
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {exercises.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.exercisesList}>
              {exercises.map((exercise) => {
                const completionData = getExerciseCompletionData(exercise, activeWorkout);
                
                return (
                  <Pressable
                    key={exercise.id}
                    style={({ pressed }) => [
                      styles.exerciseItem,
                      isTrackingWorkout && styles.exerciseItemTracking,
                      pressed && styles.exerciseItemPressed
                    ]}
                    onPress={() => isTrackingWorkout ? onExerciseTracking(exercise.id) : {}}
                  >
                    <View style={styles.exerciseContent}>
                      {isTrackingWorkout && (
                        <View style={{position: 'relative'}}>
                          <TouchableOpacity
                            onPress={() => onExerciseTracking(exercise.id)}
                            style={[
                              styles.trackingCheckbox,
                              { 
                                borderWidth: 1,
                                borderColor: 'rgba(255, 255, 255, 0.2)'
                              },
                              completionData.isCompleted && styles.trackingCheckboxCompleted,
                              { transform: [{ scale: animations.exerciseBounceAnimations[exercise.id] || 1 }] }
                            ]}
                          >
                            {completionData.isCompleted ? (
                              <Ionicons name="checkmark" size={24} color="#000000" />
                            ) : (
                              <Animated.View style={[
                                styles.progressFill, 
                                { 
                                  height: animations.exerciseProgressAnimations[exercise.id] 
                                    ? animations.exerciseProgressAnimations[exercise.id].interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%']
                                      })
                                    : `${completionData.progressPercentage}%` 
                                }
                              ]} />
                            )}
                          </TouchableOpacity>
                          <View style={styles.dashedBorder} />
                        </View>
                      )}
                      
                      <View style={[
                        styles.exerciseInfo,
                        !isTrackingWorkout && { marginLeft: 0 }
                      ]}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Text style={styles.exerciseTrackingType}>
                          {getExerciseProgressText(exercise, isTrackingWorkout, activeWorkout)}
                        </Text>
                      </View>
                      
                      {!isTrackingWorkout ? (
                        <TouchableOpacity 
                          onPress={(event) => onExerciseSettings(exercise.id, event)}
                          style={styles.exerciseSettingsButton}
                        >
                          <Ionicons name="ellipsis-vertical" size={24} color="#5B5B5C" />
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.exerciseActionsContainer}>
                          <TouchableOpacity 
                            onPress={(event) => onExerciseSettings(exercise.id, event)}
                            style={styles.exerciseSettingsButtonTracking}
                          >
                            <Ionicons name="ellipsis-vertical" size={20} color="#5B5B5C" />
                          </TouchableOpacity>
                          <View style={styles.exerciseChevronContainer}>
                            <Ionicons name="chevron-forward" size={24} color="#5B5B5C" />
                          </View>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
              
              {/* Bouton Add exercise - disponible en mode édition ET tracking */}
              <TouchableOpacity 
                style={styles.addButtonContainer}
                onPress={onAddExercise}
              >
                <View style={styles.addRoundButton}>
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.addButtonText}>Add exercise</Text>
              </TouchableOpacity>
            </View>
          )}
          
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
    marginRight: 24,
  },
  startButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 16,
  },
  finishButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  workoutTimer: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 32,
    paddingHorizontal: 16,
  },
  workoutHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -8,
    paddingHorizontal: 16,
  },
  workoutName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 32,
    marginBottom: 24,
  },
  workoutNameSmall: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 8,
    marginBottom: 24,
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
  exercisesList: {
    paddingTop: 24,
    marginBottom: 24,
  },
  exerciseItem: {
    borderRadius: 0,
    marginBottom: 8,
  },
  exerciseItemTracking: {
    marginBottom: 8,
  },
  exerciseItemPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 16,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exerciseTrackingType: {
    fontSize: 14,
    color: '#5B5B5C',
  },
  exerciseSettingsButton: {
    padding: 8,
  },
  exerciseSettingsButtonTracking: {
    padding: 8,
    marginRight: 8,
  },
  exerciseActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseChevronContainer: {
    padding: 8,
  },
  trackingCheckbox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
  },
  trackingCheckboxCompleted: {
    backgroundColor: '#FFFFFF',
  },
  dashedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  addButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  addRoundButton: {
    width: 48,
    height: 48,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    marginLeft: 16,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
  bottomPadding: {
    height: 80,
  },
});

