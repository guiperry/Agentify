import React from 'react';

interface LoadingScreenProps {
  isVisible?: boolean;
  message?: string;
  progress?: number | null;
  onComplete?: (() => void) | null;
}

declare const LoadingScreen: React.FC<LoadingScreenProps>;

export default LoadingScreen;