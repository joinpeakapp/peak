import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Easing 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRestTimer } from '../contexts/RestTimerContext';

interface RestTimerProps {
  // Propriétés supplémentaires si nécessaire
}

const RestTimer: React.FC<RestTimerProps> = () => {
  const { 
    isTimerActive, 
    isPaused, 
    currentTime, 
    totalTime, 
    pauseTimer, 
    resumeTimer, 
    stopTimer 
  } = useRestTimer();

  // Formater le temps au format mm:ss
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculer le pourcentage de temps écoulé pour la progression
  const progressPercentage = totalTime > 0 ? currentTime / totalTime : 0;

  // Animation pour le clignotement lorsque le timer est presque terminé
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Faire clignoter le timer lorsqu'il reste moins de 10 secondes
    if (isTimerActive && currentTime <= 10 && currentTime > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ]).start();
    }
  }, [currentTime, isTimerActive]);

  // Ne rien afficher si le timer n'est pas actif
  if (!isTimerActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.timerCard}>
        <View style={styles.infoContainer}>
          <Text style={styles.restForText}>rest for</Text>
          <Text style={styles.timerText}>{formatTime(currentTime)}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={isPaused ? resumeTimer : pauseTimer}
        >
          <Ionicons 
            name={isPaused ? "play" : "pause"} 
            size={20} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 48,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  timerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 4,
    paddingTop: 4,
    paddingBottom: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  restForText: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(10, 10, 12, 0.5)',
    marginRight: 8,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0A0C',
  },
  actionButton: {
    backgroundColor: '#0A0A0C',
    borderRadius: 100,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RestTimer; 