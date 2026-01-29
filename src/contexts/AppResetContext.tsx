import React, { createContext, useContext, useState, useCallback } from 'react';
import { store } from '../store';
import { loadInitialData } from '../store/slices/workoutSlice';

interface AppResetContextType {
  triggerReset: () => void;
  resetKey: number;
}

const AppResetContext = createContext<AppResetContextType | undefined>(undefined);

export const AppResetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [resetKey, setResetKey] = useState(0);

  const triggerReset = useCallback(() => {
    setResetKey(prev => prev + 1);
    // Recharger les données Redux
    store.dispatch(loadInitialData());
  }, []);

  return (
    <AppResetContext.Provider value={{ triggerReset, resetKey }}>
      {children}
    </AppResetContext.Provider>
  );
};

export const useAppReset = () => {
  const context = useContext(AppResetContext);
  if (!context) {
    throw new Error('useAppReset must be used within AppResetProvider');
  }
  return context;
};
