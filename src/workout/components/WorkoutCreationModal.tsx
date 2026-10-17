import React, { useState, useEffect } from 'react';
import { FullScreenModal } from '../../components/common/FullScreenModal';
import { WorkoutCreateTypeScreen } from '../screens/WorkoutCreateTypeScreen';
import { WorkoutCreateTemplateScreen } from '../screens/WorkoutCreateTemplateScreen';
import { WorkoutCreateNameScreen } from '../screens/WorkoutCreateNameScreen';
import { WorkoutCreateFrequencyScreen } from '../screens/WorkoutCreateFrequencyScreen';
import { WorkoutCreationSuccessContent } from './WorkoutCreationSuccessContent';
import { Exercise, WorkoutFrequency } from '../../types/workout';

interface WorkoutCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onWorkoutCreated?: (workoutId: string) => void;
}

type Step = 'type' | 'template' | 'name' | 'frequency' | 'success';

export const WorkoutCreationModal: React.FC<WorkoutCreationModalProps> = ({
  visible,
  onClose,
  onWorkoutCreated
}) => {
  const [step, setStep] = useState<Step>('type');
  const [workoutName, setWorkoutName] = useState('');
  const [templateExercises, setTemplateExercises] = useState<Omit<Exercise, 'id'>[] | null>(null);
  const [templateFrequency, setTemplateFrequency] = useState<WorkoutFrequency | null>(null);
  const [createdWorkoutId, setCreatedWorkoutId] = useState<string | null>(null);
  
  // Réinitialiser l'état lorsque la modale se ferme
  useEffect(() => {
    if (!visible) {
      // Délai pour s'assurer que la transition d'animation est terminée avant de réinitialiser
      const resetTimer = setTimeout(() => {
        setStep('type');
        setWorkoutName('');
        setTemplateExercises(null);
        setTemplateFrequency(null);
        setCreatedWorkoutId(null);
      }, 300);
      
      return () => clearTimeout(resetTimer);
    }
  }, [visible]);

  const handleSelectCustom = () => {
    setTemplateExercises(null);
    setTemplateFrequency(null);
    setStep('name');
  };

  const handleSelectTemplate = () => {
    setStep('template');
  };

  const handleTemplateSelected = (name: string, exercises: Omit<Exercise, 'id'>[], frequency: WorkoutFrequency) => {
    setWorkoutName(name);
    setTemplateExercises(exercises);
    setTemplateFrequency(frequency);
    setStep('frequency');
  };

  const handleNameNext = (name: string) => {
    setWorkoutName(name);
    setStep('frequency');
  };

  const handleBackFromTemplate = () => {
    setStep('type');
  };

  const handleBackFromName = () => {
    setStep('type');
  };

  const handleBackFromFrequency = () => {
    if (templateExercises) {
      setStep('template');
    } else {
      setStep('name');
    }
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
      case 'type':
        return (
          <WorkoutCreateTypeScreen
            onSelectCustom={handleSelectCustom}
            onSelectTemplate={handleSelectTemplate}
            onClose={handleCancel}
          />
        );
      case 'template':
        return (
          <WorkoutCreateTemplateScreen
            onSelectTemplate={handleTemplateSelected}
            onBack={handleBackFromTemplate}
          />
        );
      case 'name':
        return (
          <WorkoutCreateNameScreen
            onNext={handleNameNext}
            onClose={handleCancel}
            onBack={handleBackFromName}
          />
        );
      case 'frequency':
        return (
          <WorkoutCreateFrequencyScreen
            name={workoutName}
            templateExercises={templateExercises}
            templateFrequency={templateFrequency}
            onComplete={(workoutId) => handleComplete(workoutId)}
            onBack={handleBackFromFrequency}
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