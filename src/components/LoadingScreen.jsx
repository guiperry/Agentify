import React, { useState, useEffect } from 'react';
import { useAppLogo } from '../hooks/useAssetPath';

const LoadingScreen = ({
  isVisible = true,
  message = "Starting Agentify...",
  progress = null,
  onComplete = null
}) => {
  const logoPath = useAppLogo();
  const [dots, setDots] = useState('');
  const [currentMessage, setCurrentMessage] = useState(message);

  // Animate loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Update message when prop changes
  useEffect(() => {
    setCurrentMessage(message);
  }, [message]);

  // Auto-hide after minimum display time if onComplete is provided
  useEffect(() => {
    if (onComplete && isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000); // Minimum 2 seconds display time

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
      </div>

      {/* Loading content */}
      <div className="relative z-10 flex flex-col items-center space-y-8 max-w-md mx-auto px-6">
        {/* Large app logo */}
        <div className="relative">
          <div className="w-32 h-32 bg-white rounded-2xl p-4 shadow-2xl shadow-purple-500/20">
            <img
              src={logoPath}
              alt="Agentify Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback if logo fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback logo */}
            <div
              className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg items-center justify-center text-white font-bold text-2xl hidden"
              style={{ display: 'none' }}
            >
              AG
            </div>
          </div>
          
          {/* Animated ring around logo */}
          <div className="absolute inset-0 w-32 h-32 border-4 border-purple-500/30 rounded-2xl animate-pulse"></div>
          <div className="absolute inset-0 w-32 h-32 border-4 border-transparent border-t-purple-500 rounded-2xl animate-spin"></div>
        </div>

        {/* App title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Agentify</h1>
          <p className="text-slate-300 text-lg">AI Agent Platform</p>
        </div>

        {/* Loading message and spinner */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <span className="text-white font-medium">{currentMessage}{dots}</span>
          </div>

          {/* Progress bar if provided */}
          {progress !== null && (
            <div className="w-64 bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              ></div>
            </div>
          )}

          {/* Loading steps indicator */}
          <div className="flex justify-center space-x-2 mt-6">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-500/50 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-purple-500/30 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>

        {/* Version info */}
        <div className="text-center text-slate-400 text-sm">
          <p>Version 1.0.0</p>
          <p>Initializing services...</p>
        </div>
      </div>

      {/* Subtle background animation */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 opacity-50">
        <div className="h-full bg-white/20 animate-pulse"></div>
      </div>
    </div>
  );
};

export default LoadingScreen;
