import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WorkoutCreationContextType {
  openWorkoutCreation: () => void;
  isWorkoutCreationOpen: boolean;
  closeWorkoutCreation: () => void;
}

const WorkoutCreationContext = createContext<WorkoutCreationContextType | undefined>(undefined);

export const WorkoutCreationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isWorkoutCreationOpen, setIsWorkoutCreationOpen] = useState(false);

  const openWorkoutCreation = () => {
    setIsWorkoutCreationOpen(true);
  };

  const closeWorkoutCreation = () => {
    setIsWorkoutCreationOpen(false);
  };

  return (
    <WorkoutCreationContext.Provider
      value={{
        openWorkoutCreation,
        isWorkoutCreationOpen,
        closeWorkoutCreation,
      }}
    >
      {children}
    </WorkoutCreationContext.Provider>
  );
};

export const useWorkoutCreation = () => {
  const context = useContext(WorkoutCreationContext);
  if (!context) {
    throw new Error('useWorkoutCreation must be used within WorkoutCreationProvider');
  }
  return context;
};

