# Agent Deployer Integration Plan

## Overview

This document outlines the implementation plan for integrating the agent-deployer application into the main Agentify application. The integration will place the Agent Deployer between the "Configure Agent" (AgentConfig) and "Agent Dashboard" (Dashboard) components within the onboarding funnel sequence.

## Current Architecture

The current onboarding flow in Agentify follows this sequence:
1. Hero (landing page)
2. AppConnector (connect to an application)
3. AgentConfig (configure the agent)
4. Dashboard (monitor the agent)

The agent-deployer is currently a separate application with its own routing, header, and UI components.

## Integration Goals

1. Seamlessly integrate the agent-deployer as a step in the Agentify onboarding funnel
2. Maintain consistent UI with Agentify header and footer
3. Preserve the agent-deployer's core functionality
4. Ensure smooth transitions between steps in the onboarding process
5. Share state between steps to maintain context throughout the flow

## Implementation Plan

### 1. Create a New AgentDeployer Component

Create a new component in the main Agentify application that adapts the agent-deployer functionality:

```tsx
// src/components/AgentDeployer.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rocket, MessageSquare, Cloud } from "lucide-react";
import StatusDashboard from "@/components/deployer/StatusDashboard";
import RepositoryPanel from "@/components/deployer/RepositoryPanel";
import TestRunner from "@/components/deployer/TestRunner";
import DeploymentPanel from "@/components/deployer/DeploymentPanel";
import ChatModal from "@/components/deployer/ChatModal";
import { useToast } from "@/hooks/use-toast";

interface AgentDeployerProps {
  connectedApp: {url: string, name: string, type: string};
  agentConfig: {
    name: string;
    personality: string;
    instructions: string;
    features: Record<string, boolean>;
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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastAgonResponse, setLastAgonResponse] = useState<string>("");
  const { toast } = useToast();

  // Handler to receive AI response from chat interface
  const handleAgonResponse = (response: string) => {
    setLastAgonResponse(response);
  };

  // Utility: get last 4-5 lines (prefer up to 5 if enough newlines, otherwise at least 1 line)
  const getPreviewLines = (text: string, lines: number = 5) => {
    if (!text) return "";
    const split = text.trim().split(/\r?\n/);
    return split.slice(-lines).join('\n');
  };

  const handleDeploy = () => {
    toast({
      title: "Agent Deployed!",
      description: `${agentConfig.name} has been successfully deployed and is ready to use`,
    });
    
    setTimeout(() => {
      onDeployed();
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-12">
        <div className="text-center md:text-left w-full">
          <h2 className="text-4xl font-bold text-white mb-4">Deploy Your AI Agent</h2>
          <p className="text-xl text-white/70">
            Test and deploy your agent for {connectedApp.name}
          </p>
        </div>
      </div>

      {/* Main Interface */}
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/5 border border-white/10">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-500/20">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="repository" className="data-[state=active]:bg-purple-500/20">
              Repository
            </TabsTrigger>
            <TabsTrigger value="tests" className="data-[state=active]:bg-purple-500/20">
              Test Runner
            </TabsTrigger>
            <TabsTrigger value="deploy" className="data-[state=active]:bg-purple-500/20">
              <Cloud className="w-4 h-4 mr-2" />
              Deploy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <StatusDashboard repoUrl={connectedApp.url} agentConfig={agentConfig} />
          </TabsContent>

          <TabsContent value="repository" className="space-y-6">
            <RepositoryPanel repoUrl={connectedApp.url} />
          </TabsContent>

          <TabsContent value="tests" className="space-y-6">
            <TestRunner repoUrl={connectedApp.url} agentConfig={agentConfig} />
          </TabsContent>

          <TabsContent value="deploy" className="space-y-6">
            <DeploymentPanel 
              repoUrl={connectedApp.url} 
              agentConfig={agentConfig}
              onDeployComplete={handleDeploy}
            />
          </TabsContent>
        </Tabs>

        {/* Chat Button and Modal */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            variant="outline"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat with Agon
          </Button>
          <ChatModal
            open={isChatOpen}
            onOpenChange={setIsChatOpen}
            repoUrl={connectedApp.url}
            onAgonResponse={handleAgonResponse}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentDeployer;
```

### 2. Migrate Deployer Components

Create a new directory structure to house the migrated agent-deployer components:

```
src/
└── components/
    └── deployer/
        ├── ChatInterface.tsx
        ├── ChatModal.tsx
        ├── DeploymentPanel.tsx
        ├── RepositoryPanel.tsx
        ├── StatusDashboard.tsx
        └── TestRunner.tsx
```

Migrate the components from the agent-deployer application, adapting them to work within the Agentify application context:

1. Update imports to use the Agentify component paths
2. Ensure consistent styling with the Agentify UI
3. Modify components to accept and use the agent configuration data

### 3. Update the Index Component

Modify the Index component to include the new AgentDeployer step in the onboarding flow:

```tsx
// src/pages/Index.tsx (partial update)
import React, { useState } from 'react';
// ... existing imports
import AgentDeployer from "@/components/AgentDeployer";

const Index = () => {
  // Update the step type to include 'deploy'
  const [currentStep, setCurrentStep] = useState<'hero' | 'connect' | 'configure' | 'deploy' | 'dashboard'>('hero');
  // ... existing state
  
  // Add state to store agent configuration
  const [agentConfig, setAgentConfig] = useState({
    name: '',
    personality: 'helpful',
    instructions: '',
    features: {},
    // Other relevant config properties
  });

  const handleAppConnect = (appData: {url: string, name: string, type: string}) => {
    setConnectedApp(appData);
    setCurrentStep('configure');
  };

  // Update to store agent config and move to deploy step
  const handleAgentConfigured = (config: any) => {
    setAgentConfig(config);
    setCurrentStep('deploy');
  };
  
  // Add handler for deployment completion
  const handleAgentDeployed = () => {
    setCurrentStep('dashboard');
  };

  const goBack = () => {
    if (currentStep === 'configure') setCurrentStep('connect');
    if (currentStep === 'connect') setCurrentStep('hero');
    if (currentStep === 'deploy') setCurrentStep('configure');
    if (currentStep === 'dashboard') setCurrentStep('deploy');
  };

  // ... existing code

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* ... existing navigation */}
      
      {/* Main Content */}
      <main className="relative">
        {currentStep === 'hero' && (
          <Hero onGetStarted={() => setCurrentStep('connect')} />
        )}
        
        {currentStep === 'connect' && (
          <AppConnector onAppConnect={handleAppConnect} />
        )}
        
        {currentStep === 'configure' && connectedApp && (
          <AgentConfig 
            connectedApp={connectedApp} 
            onConfigured={handleAgentConfigured}
            isActive={dashboardIsActive}
            downloadModalOpen={downloadModalOpen}
            setDownloadModalOpen={setDownloadModalOpen}
            onDownload={(platform) => {
              console.log(`Downloading Agentic Engine for ${platform}`);
              setDownloadModalOpen(false);
            }}
            settingsModalOpen={settingsModalOpen}
            setSettingsModalOpen={setSettingsModalOpen}
          />
        )}
        
        {/* New Deploy Step */}
        {currentStep === 'deploy' && connectedApp && (
          <AgentDeployer
            connectedApp={connectedApp}
            agentConfig={agentConfig}
            onDeployed={handleAgentDeployed}
            isActive={dashboardIsActive}
            downloadModalOpen={downloadModalOpen}
            setDownloadModalOpen={setDownloadModalOpen}
            onDownload={(platform) => {
              console.log(`Downloading Agentic Engine for ${platform}`);
              setDownloadModalOpen(false);
            }}
            settingsModalOpen={settingsModalOpen}
            setSettingsModalOpen={setSettingsModalOpen}
          />
        )}
        
        {currentStep === 'dashboard' && connectedApp && (
          <Dashboard 
            connectedApp={connectedApp}
            isActive={dashboardIsActive}
            setIsActive={setDashboardIsActive}
            settingsModalOpen={settingsModalOpen}
            setSettingsModalOpen={setSettingsModalOpen}
          />
        )}
      </main>
      
      {/* ... existing modals */}
    </div>
  );
};
```

### 4. Update the AgentConfig Component

Modify the AgentConfig component to pass the configuration data to the parent component:

```tsx
// src/components/AgentConfig.tsx (partial update)
const AgentConfig = ({
  // ... existing props
}) => {
  // ... existing state and functions

  const handleDeploy = () => {
    toast({
      title: "Agent Minted!",
      description: `${agentName} has been minted and is ready to deploy`,
    });
    
    // Create a config object to pass to the parent
    const config = {
      name: agentName,
      personality,
      instructions,
      creativity: creativity[0],
      features,
      mcpServers
    };
    
    setTimeout(() => {
      onConfigured(config);
    }, 1500);
  };

  // ... rest of the component
};
```

### 5. Data Flow Between Components

Ensure proper data flow between the components:

1. **AgentConfig → AgentDeployer**: Pass agent configuration data
2. **AgentDeployer → Dashboard**: Pass deployment status and details

### 6. UI Consistency

Ensure UI consistency across all components:

1. Use the same color scheme, typography, and spacing
2. Maintain the same header and footer structure
3. Use consistent button styles and interactions

### 7. Testing Plan

1. **Unit Testing**:
   - Test each component in isolation
   - Verify props are correctly passed between components
   - Ensure state management works as expected

2. **Integration Testing**:
   - Test the complete onboarding flow
   - Verify transitions between steps
   - Ensure data is preserved between steps

3. **UI/UX Testing**:
   - Verify consistent styling across all components
   - Test responsive behavior on different screen sizes
   - Ensure accessibility standards are met

### 8. Deployment Strategy

1. **Phase 1**: Implement the integration in a development environment
2. **Phase 2**: Deploy to a staging environment for testing
3. **Phase 3**: Gradually roll out to production

## Timeline

1. **Week 1**: Component migration and adaptation
2. **Week 2**: Integration into the main application flow
3. **Week 3**: Testing and refinement
4. **Week 4**: Deployment and monitoring

## Conclusion

This integration plan provides a structured approach to incorporating the agent-deployer functionality into the Agentify application's onboarding flow. By following this plan, we can ensure a seamless user experience while maintaining the core functionality of both applications.