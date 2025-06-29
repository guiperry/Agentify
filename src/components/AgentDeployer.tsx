'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Rocket, Download, Cloud, Monitor, Activity, Clock } from "lucide-react";
import DeploymentPanel from "@/components/deployer/DeploymentPanel";
import BlockchainDeploymentPanel from "@/components/deployer/BlockchainDeploymentPanel";
import LocalDeploymentGuide from "@/components/LocalDeploymentGuide";
import { useToast } from "@/hooks/use-toast";
import { deploymentTracker, DeploymentStatus } from "@/services/deploymentTracker";

interface AgentDeployerProps {
  connectedApp: {url: string, name: string, type: string};
  agentConfig: {
    name: string;
    personality: string;
    instructions: string;
    features: Record<string, boolean>;
    compilationData?: {
      success: boolean;
      downloadUrl?: string;
      filename?: string;
      compilationMethod?: string;
      jobId?: string;
    };
    // Other relevant config properties
  };
  onDeployed: () => void;
  // Props to support top-right agent actions:
  isActive: boolean;
  downloadModalOpen: boolean;
  setDownloadModalOpen: (open: boolean) => void;
  onDownload: (platform: 'windows' | 'mac' | 'linux') => void;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  // Note: Compilation data is now available in agentConfig.compilationData
}

const AgentDeployer = ({
  connectedApp,
  agentConfig,
  onDeployed,
  isActive,
  downloadModalOpen,
  setDownloadModalOpen,
  onDownload,
  settingsModalOpen,
  setSettingsModalOpen
}: AgentDeployerProps) => {
  const { toast } = useToast();
  const [activeDeployments, setActiveDeployments] = useState<DeploymentStatus[]>([]);
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentStatus[]>([]);
  const [showLocalGuide, setShowLocalGuide] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'windows' | 'mac' | 'linux'>('windows');
  const [isDeploymentComplete, setIsDeploymentComplete] = useState(false);

  // Extract compilation data from agentConfig
  const compilationData = agentConfig.compilationData;
  const compiledPluginUrl = compilationData?.downloadUrl;
  const compilationJobId = compilationData?.jobId;

  // Subscribe to deployment updates
  useEffect(() => {
    const unsubscribe = deploymentTracker.subscribe((deployment) => {
      setActiveDeployments(deploymentTracker.getActiveDeployments());
      setDeploymentHistory(deploymentTracker.getAllDeployments());

      if (deployment.status === 'success') {
        setIsDeploymentComplete(true);
        toast({
          title: "Deployment Successful!",
          description: `${deployment.agentName} v${deployment.version} deployed to ${deployment.environment}. Proceeding to dashboard...`,
        });

        // Navigate to dashboard after successful deployment
        setTimeout(() => {
          onDeployed();
        }, 2000); // Wait 2 seconds to show the success message
      } else if (deployment.status === 'failed') {
        toast({
          title: "Deployment Failed",
          description: `${deployment.agentName} v${deployment.version} deployment failed`,
          variant: "destructive",
        });
      }
    });

    // Load initial data
    setActiveDeployments(deploymentTracker.getActiveDeployments());
    setDeploymentHistory(deploymentTracker.getAllDeployments());

    return unsubscribe;
  }, [toast, onDeployed]);

  const handleDeploy = async (environment: 'staging' | 'production' = 'production') => {
    try {
      const deploymentId = await deploymentTracker.mockDeployment(
        agentConfig.name,
        '1.0.0',
        environment
      );

      toast({
        title: "Deployment Started",
        description: `Starting deployment of ${agentConfig.name} to ${environment}`,
      });
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: "Failed to start deployment",
        variant: "destructive",
      });
    }
  };

  // Function to just update the platform without triggering download
  const handlePlatformChange = (platform: 'windows' | 'mac' | 'linux') => {
    setSelectedPlatform(platform);
  };
  
  // Function to handle actual download
  const handleLocalDownload = (platform: 'windows' | 'mac' | 'linux') => {
    setSelectedPlatform(platform);
    toast({
      title: "Downloading Agentic Engine",
      description: `Downloading Agentic Engine for ${platform} with your compiled agent plugin`,
    });
    onDownload(platform);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-12">
        <div className="text-center md:text-left w-full">
          <h2 className="text-4xl font-bold text-white mb-4">Deploy Your AI Agent</h2>
          <p className="text-xl text-white/70">
            Deploy your agent for {connectedApp.name} to the cloud or locally
          </p>
        </div>
      </div>

      {/* Active Deployments */}
      {activeDeployments.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-6">Active Deployments</h3>
          <div className="space-y-4">
            {activeDeployments.map((deployment) => (
              <Card key={deployment.id} className="bg-white/5 border-white/10 backdrop-blur-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-white font-medium">{deployment.agentName} v{deployment.version}</h4>
                      <p className="text-white/60 text-sm">Deploying to {deployment.environment}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-blue-400 animate-pulse" />
                      <span className="text-blue-400 text-sm">{deployment.status}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Progress</span>
                      <span className="text-white">{deployment.progress}%</span>
                    </div>
                    <Progress value={deployment.progress} className="w-full" />

                    {deployment.logs.length > 0 && (
                      <div className="bg-white/10 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <div className="space-y-1">
                          {deployment.logs.slice(-3).map((log, index) => (
                            <div key={index} className="flex items-start space-x-2 text-xs">
                              <Clock className="h-3 w-3 text-white/50 mt-0.5 flex-shrink-0" />
                              <span className="text-white/70">{log.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Top row with Cloud Deploy (full width) */}
      <div className="grid grid-cols-1 gap-8 mb-8">
        {/* Cloud Deployment */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Cloud className="h-5 w-5 mr-2 text-purple-400" />
              Cloud Deploy
            </CardTitle>
            <CardDescription className="text-white/70">
              Deploy your agent to cloud platforms for global access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => handleDeploy('staging')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Cloud className="h-4 w-4 mr-2" />
                Deploy to Staging
              </Button>
              <Button
                onClick={() => handleDeploy('production')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Rocket className="h-4 w-4 mr-2" />
                Deploy to Production
              </Button>
            </div>

            {/* Success Message */}
            {isDeploymentComplete && (
              <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium">
                    Deployment successful! Redirecting to dashboard...
                  </span>
                </div>
              </div>
            )}

            <DeploymentPanel
              repoUrl={connectedApp.url}
              agentConfig={agentConfig}
              onDeployComplete={() => handleDeploy('production')}
              compiledPluginUrl={compiledPluginUrl}
              compilationJobId={compilationJobId}
            />
          </CardContent>
        </Card>
      </div>

      {/* Bottom row with Local Deploy and Blockchain Deploy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Local Deployment */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Download className="h-5 w-5 mr-2 text-green-400" />
              Local Deploy
            </CardTitle>
            <CardDescription className="text-white/70">
              Download and run your agent locally on your machine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LocalDeploymentGuide
              agentName={agentConfig.name}
              platform={selectedPlatform}
              onDownload={onDownload}
              compiledPluginUrl={compiledPluginUrl}
              onPlatformChange={handlePlatformChange}
            />
          </CardContent>
        </Card>

        {/* Blockchain Deployment */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="h-5 w-5 mr-2 text-orange-400" />
              Blockchain Deploy
            </CardTitle>
            <CardDescription className="text-white/70">
              Deploy to custom blockchain application on AWS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <BlockchainDeploymentPanel
              agentConfig={agentConfig}
              onDeployComplete={() => setIsDeploymentComplete(true)}
              compiledPluginUrl={compiledPluginUrl}
              compilationJobId={compilationJobId}
            />
            
            {/* Network Statistics */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Network Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white/70">Total Deployments</CardTitle>
                    <Rocket className="h-4 w-4 text-purple-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">12</div>
                    <p className="text-xs text-white/50">+2 from last month</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white/70">Active Instances</CardTitle>
                    <Monitor className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">3</div>
                    <p className="text-xs text-white/50">All systems operational</p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white/70">Success Rate</CardTitle>
                    <Cloud className="h-4 w-4 text-blue-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">98.5%</div>
                    <p className="text-xs text-white/50">Last 30 days</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Local Deployment Guide has been moved to the Local Deploy panel */}
    </div>
  );
};

export default AgentDeployer;
