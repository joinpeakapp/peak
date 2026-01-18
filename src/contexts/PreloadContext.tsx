import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type PreloadStep = 
  | 'user-profile'
  | 'personal-records'
  | 'streaks'
  | 'workout-history'
  | 'stickers'
  | 'photos'
  | 'images'
  | 'complete';

export interface PreloadState {
  isPreloading: boolean;
  currentStep: PreloadStep | null;
  progress: number; // 0-100
  error: string | null;
  messages: string[];
}

export interface PreloadContextType {
  state: PreloadState;
  setCurrentStep: (step: PreloadStep) => void;
  setProgress: (progress: number) => void;
  setError: (error: string) => void;
  addMessage: (message: string) => void;
  completePreload: () => void;
  reset: () => void;
}

const PreloadContext = createContext<PreloadContextType | undefined>(undefined);

const initialState: PreloadState = {
  isPreloading: true,
  currentStep: null,
  progress: 0,
  error: null,
  messages: [],
};

export const PreloadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PreloadState>(initialState);

  const setCurrentStep = useCallback((step: PreloadStep) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isPreloading: false,
    }));
  }, []);

  const addMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  const completePreload = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPreloading: false,
      currentStep: 'complete',
      progress: 100,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const value: PreloadContextType = {
    state,
    setCurrentStep,
    setProgress,
    setError,
    addMessage,
    completePreload,
    reset,
  };

  return (
    <PreloadContext.Provider value={value}>
      {children}
    </PreloadContext.Provider>
  );
};

export const usePreload = (): PreloadContextType => {
  const context = useContext(PreloadContext);
  if (!context) {
    throw new Error('usePreload must be used within a PreloadProvider');
  }
  return context;
};
