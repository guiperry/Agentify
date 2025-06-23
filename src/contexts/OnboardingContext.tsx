'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AgentConfiguration } from '@/components/AgentConfig';

// Define types for configuration objects
export interface AppConfig {
  url: string;
  name: string;
  type: string;
  apiSpec?: Record<string, unknown>;
  endpoints?: Record<string, string>;
  authMethods?: string[];
  corsRestricted?: boolean;
  [key: string]: unknown;
}

export interface DeploymentConfig {
  status: string;
  environment: string;
  version: string;
  deployedAt?: Date;
  [key: string]: unknown;
}

interface OnboardingState {
  currentStep: 'hero' | 'connect' | 'configure' | 'deploy' | 'dashboard';
  connectedApp: {url: string, name: string, type: string} | null;
  appConfig: AppConfig | null; // Parsed configuration from file or API
  agentConfig: AgentConfiguration | null;
  deploymentConfig: DeploymentConfig | null;
}

interface OnboardingContextType {
  state: OnboardingState;
  updateState: (updates: Partial<OnboardingState>) => void;
  resetOnboarding: () => void;
  saveProgress: () => void;
  loadProgress: () => boolean; // Returns true if progress was loaded
}

const defaultState: OnboardingState = {
  currentStep: 'hero',
  connectedApp: null,
  appConfig: null,
  agentConfig: null,
  deploymentConfig: null,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [state, setState] = useState<OnboardingState>(defaultState);

  // Load saved progress on initial mount
  useEffect(() => {
    loadProgress();
  }, []);

  const updateState = (updates: Partial<OnboardingState>) => {
    setState(prev => ({
      ...prev,
      ...updates
    }));
  };

  const resetOnboarding = () => {
    localStorage.removeItem('onboardingState');
    setState(defaultState);
  };

  const saveProgress = () => {
    localStorage.setItem('onboardingState', JSON.stringify(state));
  };

  const loadProgress = (): boolean => {
    const saved = localStorage.getItem('onboardingState');
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        setState(parsedState);
        return true;
      } catch (e) {
        console.error('Failed to parse saved onboarding state', e);
      }
    }
    return false;
  };

  return (
    <OnboardingContext.Provider value={{ 
      state, 
      updateState, 
      resetOnboarding,
      saveProgress,
      loadProgress
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

// Move this to a separate hook file to avoid ESLint react-refresh/only-export-components warning
// For now, we'll keep it here but disable the ESLint rule for this specific case
// eslint-disable-next-line react-refresh/only-export-components
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
