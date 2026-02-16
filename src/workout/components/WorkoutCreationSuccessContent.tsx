import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated 
} from 'react-native';
import { useWorkout } from '../../hooks/useWorkout';
import { WorkoutCard } from './WorkoutCard';

interface WorkoutCreationSuccessContentProps {
  workoutId: string;
  onClose: () => void;
}

export const WorkoutCreationSuccessContent: React.FC<WorkoutCreationSuccessContentProps> = ({
  workoutId,
  onClose
}) => {
  const { workouts } = useWorkout();
  
  // Récupérer le workout créé depuis les workouts en utilisant l'ID
  const workout = workouts.find(w => w.id === workoutId);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const cardOpacityAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.8)).current;
  const cardOffsetYAnim = useRef(new Animated.Value(30)).current;
  const buttonOpacityAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animation d'entrée inspirée de l'écran de stickers
    // 1. Fade in du titre et description
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Animation de la card après un court délai
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(cardOpacityAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(cardScaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(cardOffsetYAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // 3. Animation du bouton après la card
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(buttonOpacityAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start();
          }, 200);
        });
      }, 300);
    });
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Fermer la modale
      onClose();
    });
  };

  // If workout doesn't exist yet, show loading message
  if (!workout) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Créer un workout avec streak à 0 pour l'affichage
  const workoutWithZeroStreak = {
    ...workout,
    streak: 0,
  };

  return (
    <View style={styles.container}>
      {/* Contenu en haut */}
      <View style={styles.topContent}>
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Title */}
          <Text style={styles.title}>
            Workout created! 💪
          </Text>
          
          {/* Description */}
          <Text style={styles.description}>
            You can find it in your workouts and start adding exercises.
          </Text>
        </Animated.View>

        {/* Card du workout */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: cardOpacityAnim,
              transform: [
                { scale: cardScaleAnim },
                { translateY: cardOffsetYAnim }
              ],
            },
          ]}
          pointerEvents="none"
        >
          <WorkoutCard
            workout={workoutWithZeroStreak}
            onPress={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            hideMenu={true}
          />
        </Animated.View>
      </View>

      {/* Bouton continuer en bas */}
      <Animated.View 
        style={[
          styles.buttonContainer,
          {
            opacity: buttonOpacityAnim,
            transform: [{ scale: buttonScaleAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.button} onPress={handlePress}>
          <Text style={styles.buttonText}>
            View my workouts
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
    paddingHorizontal: 24,
  },
  topContent: {
    flex: 1,
    paddingTop: 32,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  cardContainer: {
    width: '100%',
    marginTop: 24,
  },
  buttonContainer: {
    paddingBottom: 48,
    paddingTop: 16,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
});
