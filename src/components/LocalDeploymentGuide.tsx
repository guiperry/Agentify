'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Terminal, 
  Settings, 
  CheckCircle, 
  Copy, 
  ExternalLink,
  Monitor,
  Folder,
  Play,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocalDeploymentGuideProps {
  agentName: string;
  platform: 'windows' | 'mac' | 'linux';
  onDownload: (platform: 'windows' | 'mac' | 'linux') => void;
  compiledPluginUrl?: string;
  onPlatformChange?: (platform: 'windows' | 'mac' | 'linux') => void;
}

const LocalDeploymentGuide = ({ agentName, platform: initialPlatform, onDownload, compiledPluginUrl, onPlatformChange }: LocalDeploymentGuideProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [platform, setPlatform] = useState<'windows' | 'mac' | 'linux'>(initialPlatform);
  const { toast } = useToast();
  
  // Update parent component when platform changes
  useEffect(() => {
    if (platform !== initialPlatform && onPlatformChange) {
      // This will update the parent's state without triggering a download
      onPlatformChange(platform);
    }
  }, [platform, initialPlatform, onPlatformChange]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Command copied to clipboard",
    });
  };

  const platformConfig = {
    windows: {
      name: 'Windows',
      icon: '🪟',
      executable: 'agentic-engine.exe',
      configPath: '%APPDATA%\\Agentic-Engine\\config',
      pluginsPath: '%APPDATA%\\Agentic-Engine\\plugins',
      startCommand: '.\\agentic-engine.exe --config config.json',
      requirements: [
        'Windows 10 or later (64-bit)',
        'At least 4GB RAM',
        '1GB free disk space',
        'Internet connection for initial setup'
      ]
    },
    mac: {
      name: 'macOS',
      icon: '🍎',
      executable: 'agentic-engine',
      configPath: '~/Library/Application Support/Agentic-Engine/config',
      pluginsPath: '~/Library/Application Support/Agentic-Engine/plugins',
      startCommand: './agentic-engine --config config.json',
      requirements: [
        'macOS 10.15 (Catalina) or later',
        'Intel or Apple Silicon processor',
        'At least 4GB RAM',
        '1GB free disk space',
        'Internet connection for initial setup'
      ]
    },
    linux: {
      name: 'Linux',
      icon: '🐧',
      executable: 'agentic-engine',
      configPath: '~/.config/agentic-engine',
      pluginsPath: '~/.config/agentic-engine/plugins',
      startCommand: './agentic-engine --config config.json',
      requirements: [
        'Ubuntu 18.04+ / CentOS 7+ / Debian 9+',
        'x86_64 architecture',
        'At least 4GB RAM',
        '1GB free disk space',
        'Internet connection for initial setup'
      ]
    }
  };

  const config = platformConfig[platform];

  const steps = [
    {
      title: 'Download Agentic Engine',
      description: 'Download the Agentic Engine for your platform',
      icon: Download,
      content: (
        <div className="space-y-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">{config.icon}</span>
              <div>
                <h4 className="text-white font-medium">{config.name} Engine</h4>
                <p className="text-white/70 text-sm">Download the Agentic Engine runtime for your platform</p>
              </div>
            </div>
            <Button
              onClick={() => onDownload(platform)}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Engine for {config.name}
            </Button>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4 mt-4">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-2xl">🧩</span>
              <div>
                <h4 className="text-white font-medium">Agent Plugin</h4>
                <p className="text-white/70 text-sm">Download your compiled agent plugin separately</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full border-green-800 text-green-400 hover:bg-green-900/30"
              onClick={() => {
                if (compiledPluginUrl) {
                  // Use the directly passed compiledPluginUrl
                  window.open(compiledPluginUrl, '_blank');
                  toast({
                    title: "Downloading Plugin",
                    description: `Downloading ${agentName} plugin for ${platform}`,
                  });
                } else {
                  // Try to get from localStorage as fallback
                  const agentId = agentName.replace(/\s+/g, '-').toLowerCase();
                  const savedCompilationState = localStorage.getItem(`compilation-state-${agentId}`);
                  
                  if (savedCompilationState) {
                    try {
                      const parsed = JSON.parse(savedCompilationState);
                      if (parsed.success && parsed.result && parsed.result.downloadUrl) {
                        window.open(parsed.result.downloadUrl, '_blank');
                        toast({
                          title: "Downloading Plugin",
                          description: `Downloading ${agentName} plugin for ${platform}`,
                        });
                        return;
                      }
                    } catch (error) {
                      console.error("Error parsing saved compilation state:", error);
                    }
                  }
                  
                  // If all else fails, show error
                  toast({
                    title: "Download Failed",
                    description: "Could not find compiled plugin. Please go back and compile your agent first.",
                    variant: "destructive"
                  });
                }
              }}
              disabled={!compiledPluginUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Plugin
            </Button>
          </div>

          <div className="space-y-2">
            <h5 className="text-white font-medium">System Requirements:</h5>
            <ul className="space-y-1">
              {config.requirements.map((req, index) => (
                <li key={index} className="flex items-center space-x-2 text-white/70 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'Extract and Setup',
      description: 'Extract the downloaded package and set up directories',
      icon: Folder,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <h5 className="text-white font-medium mb-2">1. Extract the package</h5>
              <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-green-400">
                    {platform === 'windows'
                      ? 'Right-click → Extract All → Choose destination'
                      : 'tar -xzf agentic-engine-' + platform + '.tar.gz'
                    }
                  </span>
                  {platform !== 'windows' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`tar -xzf agentic-engine-${platform}.tar.gz`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-white font-medium mb-2">2. Navigate to the directory</h5>
              <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-green-400">cd agentic-engine</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('cd agentic-engine')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-white font-medium mb-2">3. Make executable (Mac/Linux only)</h5>
              {platform !== 'windows' && (
                <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-green-400">chmod +x {config.executable}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`chmod +x ${config.executable}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <h5 className="text-white font-medium mb-2">4. Extract the plugin to plugins directory</h5>
              <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-green-400">
                    {platform === 'windows'
                      ? 'Extract plugin.zip to ' + config.pluginsPath
                      : 'unzip plugin.zip -d ' + config.pluginsPath
                    }
                  </span>
                  {platform !== 'windows' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`unzip plugin.zip -d ${config.pluginsPath}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Configuration',
      description: 'Configure your agent settings and plugins',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <div className="bg-white/10 rounded-lg p-4">
            <h5 className="text-white font-medium mb-3">Configuration Files</h5>
            <div className="space-y-3">
              <div>
                <p className="text-white/70 text-sm mb-2">Config directory:</p>
                <div className="bg-gray-900 rounded-lg p-2 font-mono text-sm">
                  <span className="text-blue-400">{config.configPath}</span>
                </div>
              </div>
              <div>
                <p className="text-white/70 text-sm mb-2">Plugins directory:</p>
                <div className="bg-gray-900 rounded-lg p-2 font-mono text-sm">
                  <span className="text-blue-400">{config.pluginsPath}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-white font-medium">Sample Configuration (config.json):</h5>
            <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs overflow-x-auto">
              <pre className="text-green-400">{`{
  "agent": {
    "name": "${agentName}",
    "version": "1.0.0",
    "port": 8080
  },
  "plugins": {
    "directory": "${config.pluginsPath}",
    "autoload": true
  },
  "logging": {
    "level": "info",
    "file": "agentic-engine.log"
  }
}`}</pre>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Start Agent',
      description: 'Launch your agent and verify it is running',
      icon: Play,
      content: (
        <div className="space-y-4">
          <div>
            <h5 className="text-white font-medium mb-2">Start the Agentic Engine:</h5>
            <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span className="text-green-400">{config.startCommand}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(config.startCommand)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <h5 className="text-white font-medium mb-3">Verification Steps:</h5>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-white/70 text-sm">Agent starts without errors</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-white/70 text-sm">Web interface accessible at http://localhost:8080</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-white/70 text-sm">Plugin loaded successfully</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="border-white/20 text-white/70 hover:bg-white/10"
              onClick={() => window.open('http://localhost:8080', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Agent Interface
            </Button>
            <Button
              variant="outline"
              className="border-white/20 text-white/70 hover:bg-white/10"
              onClick={() => window.open('http://localhost:8080/health', '_blank')}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Check Health
            </Button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Local Deployment Guide</h3>
        <p className="text-white/70">
          Step-by-step instructions for deploying {agentName} locally on {config.name}
        </p>
        <p className="text-white/70 mt-2">
          <span className="text-yellow-400">Note:</span> You'll need to download both the Agent Plugin and the Agentic Engine separately.
        </p>
        
        {/* Platform Selection */}
        <div className="flex justify-center space-x-2 mt-4">
          <Button
            onClick={() => setPlatform('windows')}
            variant={platform === 'windows' ? 'default' : 'outline'}
            size="sm"
            className={platform === 'windows' ? 'bg-blue-600 hover:bg-blue-700' : 'border-white/20 text-white/70'}
          >
            Windows
          </Button>
          <Button
            onClick={() => setPlatform('mac')}
            variant={platform === 'mac' ? 'default' : 'outline'}
            size="sm"
            className={platform === 'mac' ? 'bg-gray-600 hover:bg-gray-700' : 'border-white/20 text-white/70'}
          >
            macOS
          </Button>
          <Button
            onClick={() => setPlatform('linux')}
            variant={platform === 'linux' ? 'default' : 'outline'}
            size="sm"
            className={platform === 'linux' ? 'bg-orange-600 hover:bg-orange-700' : 'border-white/20 text-white/70'}
          >
            Linux
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                index <= activeStep
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white/50'
              }`}
            >
              {React.createElement(step.icon, { className: "h-5 w-5" })}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  index < activeStep ? 'bg-purple-500' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            {React.createElement(steps[activeStep].icon, { className: "h-5 w-5 mr-2 text-purple-400" })}
            {steps[activeStep].title}
          </CardTitle>
          <CardDescription className="text-white/70">
            {steps[activeStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {steps[activeStep].content}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
          disabled={activeStep === 0}
          className="border-white/20 text-white/70 hover:bg-white/10"
        >
          Previous
        </Button>
        <Button
          onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
          disabled={activeStep === steps.length - 1}
          className="bg-purple-500 hover:bg-purple-600 text-white"
        >
          Next
        </Button>
      </div>

      {/* Troubleshooting */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-400" />
            Troubleshooting
          </CardTitle>
          <CardDescription className="text-white/70">
            Common issues and solutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="common" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
              <TabsTrigger value="common" className="data-[state=active]:bg-purple-500/20">
                Common Issues
              </TabsTrigger>
              <TabsTrigger value="performance" className="data-[state=active]:bg-purple-500/20">
                Performance
              </TabsTrigger>
              <TabsTrigger value="support" className="data-[state=active]:bg-purple-500/20">
                Support
              </TabsTrigger>
            </TabsList>

            <TabsContent value="common" className="space-y-4">
              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <h5 className="text-white font-medium mb-2">Agent won't start</h5>
                  <ul className="text-white/70 text-sm space-y-1">
                    <li>• Check if port 8080 is already in use</li>
                    <li>• Verify config.json syntax is valid</li>
                    <li>• Ensure executable permissions are set (Mac/Linux)</li>
                    <li>• Check system requirements are met</li>
                  </ul>
                </div>

                <div className="bg-white/10 rounded-lg p-3">
                  <h5 className="text-white font-medium mb-2">Plugin not loading</h5>
                  <ul className="text-white/70 text-sm space-y-1">
                    <li>• Verify plugin files are in the correct directory</li>
                    <li>• Check plugin compatibility with agent version</li>
                    <li>• Review logs for plugin loading errors</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <h5 className="text-white font-medium mb-2">Optimize Performance</h5>
                  <ul className="text-white/70 text-sm space-y-1">
                    <li>• Increase memory allocation in config</li>
                    <li>• Enable caching for better response times</li>
                    <li>• Monitor CPU and memory usage</li>
                    <li>• Consider running on SSD storage</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="support" className="space-y-4">
              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <h5 className="text-white font-medium mb-2">Get Help</h5>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full border-white/20 text-white/70 hover:bg-white/10"
                      onClick={() => window.open('https://docs.agentify.com', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Documentation
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-white/20 text-white/70 hover:bg-white/10"
                      onClick={() => window.open('https://community.agentify.com', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Community Forum
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocalDeploymentGuide;
