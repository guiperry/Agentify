'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingScreen from './LoadingScreen';
import MiniLoadingScreen, { 
  MCPServerLoadingScreen, 
  MCPInstallationLoadingScreen, 
  TransformationLoadingScreen, 
  ReloadLoadingScreen 
} from './MiniLoadingScreen';

const LoadingScreenDemo = () => {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showMiniOverlay, setShowMiniOverlay] = useState(false);
  const [showMiniInline, setShowMiniInline] = useState(false);
  const [showSpecialized, setShowSpecialized] = useState('');
  const [progress, setProgress] = useState(0);

  const handleShowFullScreen = () => {
    setShowFullScreen(true);
    setTimeout(() => setShowFullScreen(false), 3000);
  };

  const handleShowMiniOverlay = () => {
    setShowMiniOverlay(true);
    setTimeout(() => setShowMiniOverlay(false), 3000);
  };

  const handleShowSpecialized = (type) => {
    setShowSpecialized(type);
    setTimeout(() => setShowSpecialized(''), 3000);
  };

  const handleProgressDemo = () => {
    setProgress(0);
    setShowMiniInline(true);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowMiniInline(false), 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Agentify Loading Screens Demo
          </h1>
          <p className="text-slate-300 text-lg">
            Showcasing consistent branding with the Agentify logo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Screen Loading */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Full Screen Loading</CardTitle>
              <CardDescription className="text-slate-400">
                Main application loading screen with Agentify branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleShowFullScreen}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                Show Full Screen Loading
              </Button>
            </CardContent>
          </Card>

          {/* Mini Loading Overlay */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Mini Loading Overlay</CardTitle>
              <CardDescription className="text-slate-400">
                Overlay loading screen for quick operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleShowMiniOverlay}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                Show Mini Overlay
              </Button>
            </CardContent>
          </Card>

          {/* Progress Demo */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Progress Loading</CardTitle>
              <CardDescription className="text-slate-400">
                Loading with progress indicator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleProgressDemo}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                Show Progress Demo
              </Button>
            </CardContent>
          </Card>

          {/* Specialized Loading Screens */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Specialized Screens</CardTitle>
              <CardDescription className="text-slate-400">
                Context-specific loading screens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={() => handleShowSpecialized('mcp')}
                variant="outline"
                className="w-full border-purple-400/50 text-purple-400 hover:bg-purple-400/10"
              >
                MCP Server Loading
              </Button>
              <Button 
                onClick={() => handleShowSpecialized('install')}
                variant="outline"
                className="w-full border-purple-400/50 text-purple-400 hover:bg-purple-400/10"
              >
                Installation Loading
              </Button>
              <Button 
                onClick={() => handleShowSpecialized('transform')}
                variant="outline"
                className="w-full border-purple-400/50 text-purple-400 hover:bg-purple-400/10"
              >
                Transformation Loading
              </Button>
              <Button 
                onClick={() => handleShowSpecialized('reload')}
                variant="outline"
                className="w-full border-purple-400/50 text-purple-400 hover:bg-purple-400/10"
              >
                Reload Loading
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Inline Mini Loading Demo */}
        {showMiniInline && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Inline Loading Demo</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniLoadingScreen 
                message="Processing with progress..."
                progress={progress}
                size="medium"
                overlay={false}
                icon="logo"
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Loading Screen Overlays */}
      {showFullScreen && (
        <LoadingScreen 
          isVisible={true}
          message="Loading Agentify Platform..."
          progress={null}
        />
      )}

      {showMiniOverlay && (
        <MiniLoadingScreen 
          message="Quick operation in progress..."
          overlay={true}
          icon="logo"
          size="medium"
        />
      )}

      {/* Specialized Loading Screens */}
      {showSpecialized === 'mcp' && (
        <MCPServerLoadingScreen message="Loading MCP Servers..." />
      )}

      {showSpecialized === 'install' && (
        <MCPInstallationLoadingScreen message="Installing MCP Server..." />
      )}

      {showSpecialized === 'transform' && (
        <TransformationLoadingScreen message="Transforming to Capability..." />
      )}

      {showSpecialized === 'reload' && (
        <ReloadLoadingScreen message="Reloading Application..." />
      )}
    </div>
  );
};

export default LoadingScreenDemo;
