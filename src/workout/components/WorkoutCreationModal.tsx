import React, { useState, useEffect } from 'react';
import { FullScreenModal } from '../../components/common/FullScreenModal';
import { WorkoutCreateNameScreen } from '../screens/WorkoutCreateNameScreen';
import { WorkoutCreateFrequencyScreen } from '../screens/WorkoutCreateFrequencyScreen';

interface WorkoutCreationModalProps {
  visible: boolean;
  onClose: () => void;
}

type Step = 'name' | 'frequency';

export const WorkoutCreationModal: React.FC<WorkoutCreationModalProps> = ({
  visible,
  onClose
}) => {
  const [step, setStep] = useState<Step>('name');
  const [workoutName, setWorkoutName] = useState('');
  
  // Réinitialiser l'état lorsque la modale se ferme
  useEffect(() => {
    if (!visible) {
      // Délai pour s'assurer que la transition d'animation est terminée avant de réinitialiser
      const resetTimer = setTimeout(() => {
        setStep('name');
        setWorkoutName('');
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

  const handleComplete = () => {
    // Fermer la modale d'abord, pour éviter des problèmes d'état
    onClose();
    // La réinitialisation de l'état est maintenant gérée par useEffect
  };

  const handleCancel = () => {
    // Fermer la modale d'abord, pour éviter des problèmes d'état
    onClose();
    // La réinitialisation de l'état est maintenant gérée par useEffect
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
            onComplete={handleComplete}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <FullScreenModal visible={visible} onClose={handleCancel}>
      {renderContent()}
    </FullScreenModal>
  );
}; 