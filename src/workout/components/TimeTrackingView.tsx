import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise } from '../../types/workout';
import { useTimeTracking } from '../hooks/useTimeTracking';
import { TrackingTime } from '../contexts/ActiveWorkoutContext';
import { RollingTimer } from './RollingTimer';
import { TimePickerModal } from './TimePickerModal';

interface TimeTrackingViewProps {
  exercise: Exercise | null;
  times: TrackingTime[];
  onBack: () => void;
  onOpenTimerSettings: () => void;
  onTimesUpdate: (times: TrackingTime[], completedTimes: number) => void;
}

export const TimeTrackingView: React.FC<TimeTrackingViewProps> = ({
  exercise,
  times: initialTimes,
  onBack,
  onOpenTimerSettings,
  onTimesUpdate,
}) => {
  const {
    timerState,
    elapsedTime,
    times,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    addTime,
    removeTime,
    toggleTimeCompletion,
    getCompletedTimesCount,
    formatTime,
  } = useTimeTracking(initialTimes);
  
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  
  // Mettre à jour les durées dans le parent quand elles changent
  React.useEffect(() => {
    // Calculer le nombre de durées complétées directement pour éviter les dépendances
    const completedCount = times.filter(time => time.completed).length;
    onTimesUpdate(times, completedCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [times]); // Seulement times comme dépendance pour éviter les boucles
  
  const handleStop = () => {
    stopTimer();
    // Les times seront mis à jour par l'effet ci-dessus
  };
  
  const handleLog = () => {
    // Sauvegarder le temps actuel du chronomètre
    if (elapsedTime > 0) {
      addTime(elapsedTime);
      resetTimer();
    }
  };
  
  const handleAddTime = () => {
    setShowTimePickerModal(true);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.rightButtons}>
          {/* Pas de bouton dans le header pour les exercices trackés par temps */}
        </View>
      </View>
      
      <View style={styles.scrollableContainer}>
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Titre maintenant dans le ScrollView */}
          <Text style={styles.exerciseTrackingTitle}>
            {exercise?.name || 'Exercise'}
          </Text>
          
          <Text style={styles.exerciseTrackingSubtitle}>
            Either start a timer, or log the time directly
          </Text>
          
          {/* Chronomètre avec animation de défilement */}
          <View style={styles.timerSection}>
        <View style={styles.timerContainer}>
          <RollingTimer 
            totalSeconds={elapsedTime}
            showHours={elapsedTime >= 3600}
          />
        </View>
        
        {/* Contrôles du chronomètre */}
        <View style={styles.timerControls}>
          {timerState === 'stopped' && (
            <>
              <TouchableOpacity
                style={styles.timerButton}
                onPress={startTimer}
              >
                <Ionicons name="play" size={20} color="#000000" />
                <Text style={styles.timerButtonText}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timerButton, styles.timerButtonSecondary]}
                onPress={handleAddTime}
              >
                <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                <Text style={[styles.timerButtonText, styles.timerButtonTextSecondary]}>Log manually</Text>
              </TouchableOpacity>
            </>
          )}
          
          {timerState === 'running' && (
            <>
              <TouchableOpacity
                style={styles.timerButton}
                onPress={pauseTimer}
              >
                <Ionicons name="pause" size={20} color="#000000" />
                <Text style={styles.timerButtonText}>Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timerButton, styles.timerButtonSecondary]}
                onPress={handleLog}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={[styles.timerButtonText, styles.timerButtonTextSecondary]}>Log</Text>
              </TouchableOpacity>
            </>
          )}
          
          {timerState === 'paused' && (
            <>
              <TouchableOpacity
                style={styles.timerButton}
                onPress={resumeTimer}
              >
                <Ionicons name="play" size={20} color="#000000" />
                <Text style={styles.timerButtonText}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timerButton, styles.timerButtonSecondary]}
                onPress={handleLog}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={[styles.timerButtonText, styles.timerButtonTextSecondary]}>Log</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timerButtonIcon, styles.timerButtonSecondary]}
                onPress={resetTimer}
              >
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      
          {/* Liste des durées enregistrées */}
          {times.length > 0 ? (
            <View style={styles.timesSection}>
              {times.map((time, index) => (
                <View key={index} style={styles.timeRow}>
                  <TouchableOpacity 
                    style={[
                      styles.timeCheckbox,
                      time.completed && styles.timeCheckboxCompleted
                    ]}
                    onPress={() => toggleTimeCompletion(index)}
                  >
                    {time.completed ? (
                      <Ionicons name="checkmark" size={24} color="#000000" />
                    ) : (
                      <View style={styles.progressFill} />
                    )}
                  </TouchableOpacity>
                  
                  <View style={styles.timeDisplay}>
                    <Text style={[
                      styles.timeText,
                      time.completed && styles.completedTimeText
                    ]}>
                      {formatTime(time.duration)}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeTime(index)}
                  >
                    <Ionicons name="close" size={24} color="rgba(255, 255, 255, 0.6)" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
              <Text style={styles.emptyStateText}>Log a time to see it here</Text>
            </View>
          )}
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
      
      {/* Modal bottom sheet pour log manually */}
      <TimePickerModal
        visible={showTimePickerModal}
        onClose={() => setShowTimePickerModal(false)}
        onSave={(totalSeconds) => {
          if (totalSeconds > 0) {
            addTime(totalSeconds);
          }
          setShowTimePickerModal(false);
        }}
      />
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
  exerciseTrackingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingTop: 32,
    paddingHorizontal: 16,
  },
  exerciseTrackingSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 80, // Pour le bottomPadding
  },
  timerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerControls: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    paddingTop: 8,
    alignItems: 'center',
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    gap: 8,
    backgroundColor: '#FFFFFF',
    minWidth: 120,
  },
  timerButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  timerButtonTextSecondary: {
    color: '#FFFFFF',
  },
  scrollableContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  timesSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'visible',
  },
  timeCheckbox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  timeCheckboxCompleted: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '0%',
    backgroundColor: '#FFFFFF',
  },
  timeDisplay: {
    flex: 1,
    marginLeft: 16,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  completedTimeText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  removeButton: {
    padding: 8,
    marginLeft: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 16,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 80,
  },
});

