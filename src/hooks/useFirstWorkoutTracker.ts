import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

const NOTIFICATION_PERMISSION_SHOWN_KEY = '@peak_notification_permission_shown';

/**
 * Hook pour tracker la création du premier workout et afficher
 * le bottom sheet de permission notifications au bon moment
 */
export const useFirstWorkoutTracker = () => {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  // Utiliser directement useSelector pour réagir immédiatement aux changements Redux
  const workouts = useSelector((state: RootState) => state.workout.workouts);
  const loading = useSelector((state: RootState) => state.workout.loading);
  const previousWorkoutCountRef = useRef(0);
  const isInitializedRef = useRef(false);
  const hasTriggeredRef = useRef(false); // Pour éviter de déclencher plusieurs fois
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializationAttemptedRef = useRef(false);

  // Vérifier si le bottom sheet a déjà été montré
  const checkIfPermissionShown = useCallback(async () => {
    try {
      const hasShown = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_SHOWN_KEY);
      return hasShown === 'true';
    } catch (error) {
      logger.error('[useFirstWorkoutTracker] Error checking notification permission shown:', error);
      return true; // En cas d'erreur, on considère qu'il a été montré
    }
  }, []);

  // Fermer le modal
  const closeNotificationModal = useCallback(() => {
    setShowNotificationModal(false);
    // Nettoyer le timeout si présent
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);


  // Initialiser quand les données sont chargées
  useEffect(() => {
    if (!loading && !isInitializedRef.current && !initializationAttemptedRef.current) {
      initializationAttemptedRef.current = true;
      previousWorkoutCountRef.current = workouts.length;
      isInitializedRef.current = true;
    }
  }, [loading, workouts.length]);

  // Détecter automatiquement quand un workout est créé
  useEffect(() => {
    if (!isInitializedRef.current) {
      return;
    }

    const currentCount = workouts.length;
    const previousCount = previousWorkoutCountRef.current;

    // Vérifier si un workout a été ajouté (passage de 0 à 1)
    if (currentCount === 1 && previousCount === 0 && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      
      checkIfPermissionShown().then(async (alreadyShown) => {
        if (!alreadyShown) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            setShowNotificationModal(true);
            timeoutRef.current = null;
          }, 1000);
        }
      }).catch((error) => {
        logger.error('[useFirstWorkoutTracker] Error checking permission:', error);
        hasTriggeredRef.current = false;
      });
    }

    // Mettre à jour le count précédent
    if (currentCount !== previousCount) {
      previousWorkoutCountRef.current = currentCount;
    }
  }, [workouts.length, checkIfPermissionShown]);

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return {
    showNotificationModal,
    closeNotificationModal,
  };
};
