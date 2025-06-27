import React from 'react';
import { Zap, Server, Download, Sparkles } from 'lucide-react';
import { useAppLogo } from '../hooks/useAssetPath';

const MiniLoadingScreen = ({
  message = 'Loading...',
  progress = null,
  showProgress = true,
  size = 'medium', // 'small', 'medium', 'large'
  overlay = true,
  icon = 'logo', // 'logo', 'zap', 'server', 'download', 'sparkles'
  className = '',
  animated = true
}) => {
  const logoPath = useAppLogo();
  const sizeClasses = {
    small: {
      container: 'w-64 h-32',
      icon: 'w-6 h-6',
      text: 'text-sm',
      progress: 'h-1',
      padding: 'p-4'
    },
    medium: {
      container: 'w-80 h-40',
      icon: 'w-8 h-8',
      text: 'text-base',
      progress: 'h-2',
      padding: 'p-6'
    },
    large: {
      container: 'w-96 h-48',
      icon: 'w-12 h-12',
      text: 'text-lg',
      progress: 'h-3',
      padding: 'p-8'
    }
  };

  const icons = {
    zap: Zap,
    server: Server,
    download: Download,
    sparkles: Sparkles
  };

  const IconComponent = icons[icon] || Zap;
  const currentSize = sizeClasses[size];
  const isLogoIcon = icon === 'logo';

  const LoadingContent = () => (
    <div className={`${currentSize.container} bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-2xl flex flex-col items-center justify-center space-y-4 ${currentSize.padding} ${className}`}>
      {/* Animated Icon */}
      <div className="relative">
        {animated && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse opacity-20 scale-150"></div>
        )}
        <div className={`relative ${currentSize.padding} ${isLogoIcon ? 'bg-white rounded-xl' : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full'} border border-purple-500/30`}>
          {isLogoIcon ? (
            <img
              src={logoPath}
              alt="Agentify Logo"
              className={`${currentSize.icon} object-contain ${animated ? 'animate-pulse' : ''}`}
              onError={(e) => {
                // Fallback to Zap icon if logo fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
          ) : (
            <IconComponent className={`${currentSize.icon} text-purple-400 ${animated ? 'animate-pulse' : ''}`} />
          )}
          {/* Fallback icon for logo */}
          {isLogoIcon && (
            <Zap className={`${currentSize.icon} text-purple-400 ${animated ? 'animate-pulse' : ''} hidden`} />
          )}
        </div>
        {animated && (
          <div className="absolute inset-0 border-2 border-purple-500/30 rounded-full animate-ping"></div>
        )}
      </div>

      {/* Loading Message */}
      <div className="text-center space-y-3 w-full">
        <h3 className={`${currentSize.text} font-semibold text-white`}>
          {message}
        </h3>
        
        {/* Progress Bar */}
        {showProgress && progress !== null && (
          <div className="w-full space-y-2">
            <div className={`w-full bg-slate-700/50 rounded-full ${currentSize.progress} overflow-hidden`}>
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Animated Dots (when no progress bar) */}
        {(!showProgress || progress === null) && animated && (
          <div className="flex justify-center space-x-1">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
        <LoadingContent />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <LoadingContent />
    </div>
  );
};

// Specialized loading screens for different use cases
export const MCPServerLoadingScreen = ({ message = 'Loading MCP Servers...', progress = null }) => (
  <MiniLoadingScreen
    message={message}
    progress={progress}
    icon="logo"
    size="medium"
    overlay={false}
  />
);

export const MCPInstallationLoadingScreen = ({ message = 'Installing MCP Server...', progress = null }) => (
  <MiniLoadingScreen
    message={message}
    progress={progress}
    icon="logo"
    size="medium"
    overlay={true}
  />
);

export const TransformationLoadingScreen = ({ message = 'Transforming to Capability...', progress = null }) => (
  <MiniLoadingScreen
    message={message}
    progress={progress}
    icon="logo"
    size="medium"
    overlay={true}
  />
);

export const ReloadLoadingScreen = ({ message = 'Reloading Application...', progress = null }) => (
  <MiniLoadingScreen
    message={message}
    progress={progress}
    icon="logo"
    size="large"
    overlay={true}
  />
);

export default MiniLoadingScreen;
