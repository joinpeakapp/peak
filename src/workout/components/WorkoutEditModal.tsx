import React, { useEffect, useState } from 'react';
import { FullScreenModal } from '../../components/common/FullScreenModal';
import { WorkoutEditScreen } from '../screens/WorkoutEditScreen';
import { Workout } from '../../types/workout';

interface WorkoutEditModalProps {
  visible: boolean;
  workout: Workout;
  onClose: () => void;
  onSave: () => void;
}

export const WorkoutEditModal: React.FC<WorkoutEditModalProps> = ({
  visible,
  workout,
  onClose,
  onSave
}) => {
  // Suivre l'état local à ce composant pour plus de contrôle
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Synchroniser avec les props externes
  useEffect(() => {
    if (visible) {
      // Montrer le modal immédiatement quand on demande de l'afficher
      setIsModalVisible(true);
    } else {
      // Fonction pour gérer la fermeture du modal
      const closeModal = () => {
        setIsModalVisible(false);
      };
      
      closeModal();
    }
  }, [visible]);
  
  // Fonction callback pour gérer la fermeture du modal
  const handleClose = () => {
    onClose();
  };
  
  const handleSave = () => {
    onSave();
  };

  return (
    <FullScreenModal 
      visible={isModalVisible} 
      onClose={handleClose}
      title={`Edit ${workout?.name || 'workout'}`}
    >
      <WorkoutEditScreen 
        workout={workout} 
        onClose={handleClose} 
        onSave={handleSave} 
      />
    </FullScreenModal>
  );
}; 