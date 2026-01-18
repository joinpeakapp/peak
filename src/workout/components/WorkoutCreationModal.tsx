import React, { useState, useEffect } from 'react';
import { FullScreenModal } from '../../components/common/FullScreenModal';
import { WorkoutCreateNameScreen } from '../screens/WorkoutCreateNameScreen';
import { WorkoutCreateFrequencyScreen } from '../screens/WorkoutCreateFrequencyScreen';
import { WorkoutCreationSuccessContent } from './WorkoutCreationSuccessContent';

interface WorkoutCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onWorkoutCreated?: (workoutId: string) => void;
}

type Step = 'name' | 'frequency' | 'success';

export const WorkoutCreationModal: React.FC<WorkoutCreationModalProps> = ({
  visible,
  onClose,
  onWorkoutCreated
}) => {
  const [step, setStep] = useState<Step>('name');
  const [workoutName, setWorkoutName] = useState('');
  const [createdWorkoutId, setCreatedWorkoutId] = useState<string | null>(null);
  
  // Réinitialiser l'état lorsque la modale se ferme
  useEffect(() => {
    if (!visible) {
      // Délai pour s'assurer que la transition d'animation est terminée avant de réinitialiser
      const resetTimer = setTimeout(() => {
        setStep('name');
        setWorkoutName('');
        setCreatedWorkoutId(null);
      }, 300);
      
      return () => clearTimeout(resetTimer);
    }
  }, [visible]);

  const handleNameNext = (name: string) => {
    setWorkoutName(name);
    setStep('frequency');
  };

  const handleBack = () => {
    setStep('name');
  };

  const handleComplete = (workoutId: string) => {
    // Sauvegarder l'ID du workout créé
    setCreatedWorkoutId(workoutId);
    
    // Notifier que le workout a été créé
    if (onWorkoutCreated) {
      onWorkoutCreated(workoutId);
    }
    
    // Passer à l'écran de succès
    setStep('success');
  };

  const handleCancel = () => {
    // Fermer la modale d'abord, pour éviter des problèmes d'état
    onClose();
    // La réinitialisation de l'état est maintenant gérée par useEffect
  };

  const handleSuccessClose = () => {
    // Fermer la modale depuis l'écran de succès
    onClose();
  };

  // Rendu du contenu selon l'étape actuelle
  const renderContent = () => {
    switch (step) {
      case 'name':
        return (
          <WorkoutCreateNameScreen
            onNext={handleNameNext}
            onClose={handleCancel}
          />
        );
      case 'frequency':
        return (
          <WorkoutCreateFrequencyScreen
            name={workoutName}
            onComplete={(workoutId) => handleComplete(workoutId)}
            onBack={handleBack}
          />
        );
      case 'success':
        return createdWorkoutId ? (
          <WorkoutCreationSuccessContent
            workoutId={createdWorkoutId}
            onClose={handleSuccessClose}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <FullScreenModal 
      visible={visible} 
      onClose={step === 'success' ? handleSuccessClose : handleCancel}
    >
      {renderContent()}
    </FullScreenModal>
  );
}; 