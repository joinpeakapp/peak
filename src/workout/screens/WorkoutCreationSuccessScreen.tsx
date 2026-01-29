import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated 
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WorkoutStackParamList } from '../../types/navigation';
import { useWorkout } from '../../hooks/useWorkout';
import { WorkoutCard } from '../components/WorkoutCard';
import logger from '../../utils/logger';

type WorkoutCreationSuccessRouteProp = RouteProp<WorkoutStackParamList, 'WorkoutCreationSuccess'>;
type WorkoutCreationSuccessNavigationProp = NativeStackNavigationProp<WorkoutStackParamList, 'WorkoutCreationSuccess'>;

export const WorkoutCreationSuccessScreen: React.FC = () => {
  const route = useRoute<WorkoutCreationSuccessRouteProp>();
  const navigation = useNavigation<WorkoutCreationSuccessNavigationProp>();
  const { workouts } = useWorkout();
  
  logger.log('[WorkoutCreationSuccessScreen] Mounted with workoutId:', route.params.workoutId);
  logger.log('[WorkoutCreationSuccessScreen] Total workouts in store:', workouts.length);
  
  // Récupérer le workout créé depuis les workouts en utilisant l'ID
  const workout = workouts.find(w => w.id === route.params.workoutId);
  
  logger.log('[WorkoutCreationSuccessScreen] Workout found:', !!workout);
  if (workout) {
    logger.log('[WorkoutCreationSuccessScreen] Workout name:', workout.name);
  }

  // Si le workout n'est pas trouvé, attendre un peu puis vérifier à nouveau
  // Le workout pourrait être en train d'être ajouté au store
  useEffect(() => {
    if (!workout) {
      logger.log('[WorkoutCreationSuccessScreen] Workout not found, waiting...');
      // Attendre un peu pour que le store Redux soit mis à jour
      const timeout = setTimeout(() => {
        const workoutAfterDelay = workouts.find(w => w.id === route.params.workoutId);
        if (!workoutAfterDelay) {
          logger.log('[WorkoutCreationSuccessScreen] Workout still not found after delay, redirecting');
          navigation.replace('WorkoutsList');
        } else {
          logger.log('[WorkoutCreationSuccessScreen] Workout found after delay');
        }
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [workout, workouts, route.params.workoutId, navigation]);
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
      // Naviguer vers la liste des workouts
      navigation.navigate('WorkoutsList');
    });
  };

  // Si le workout n'existe pas encore, ne rien afficher
  if (!workout) {
    return null;
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
          {/* Titre */}
          <Text style={styles.title}>
            Workout créé 💪
          </Text>
          
          {/* Description */}
          <Text style={styles.description}>
            Ton workout est maintenant disponible dans tes workouts.{'\n'}
            Tu peux dès maintenant y ajouter des exercices.
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
            Voir mes workouts
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
    borderRadius: 12,
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
});
