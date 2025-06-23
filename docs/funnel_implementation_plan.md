# Onboarding Funnel Implementation Plan

## Overview

This document outlines a comprehensive plan for implementing a seamless onboarding process in the Agentify application. The implementation will enable users to connect their applications via URL or configuration file, configure their AI agents, and deploy them with persistent configuration data flowing through each step of the process.

## Current Architecture Analysis

The current application has a multi-step onboarding flow:
1. **Hero/Landing Page** - Initial entry point
2. **Connect** - Connect an application via URL or upload a configuration file
3. **Configure** - Set up the AI agent's personality, features, and capabilities
4. **Deploy** - Compile and deploy the agent
5. **Dashboard** - Monitor and manage the deployed agent

While the basic UI flow exists, there are gaps in the data persistence between steps and limited functionality for real application connections or configuration file processing.

## Implementation Goals

1. Create a persistent state management system for the onboarding funnel
2. Implement real application connection functionality
3. Enable configuration file upload and parsing
4. Ensure seamless data flow between all steps
5. Add validation at each step to prevent progression with invalid data
6. Implement a save/resume feature for the onboarding process

## Detailed Implementation Plan

### 1. State Management Enhancement

#### Implementation Details

- Create a dedicated context provider for the onboarding process
- Implement local storage persistence for in-progress onboarding
- Add session recovery for interrupted onboarding flows

```typescript
// src/contexts/OnboardingContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AgentConfiguration } from '@/components/AgentConfig';

interface OnboardingState {
  currentStep: 'hero' | 'connect' | 'configure' | 'deploy' | 'dashboard';
  connectedApp: {url: string, name: string, type: string} | null;
  appConfig: any | null; // Parsed configuration from file or API
  agentConfig: AgentConfiguration | null;
  deploymentConfig: any | null;
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

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
```

### 2. Real Application Connection Implementation

#### Implementation Details

- Enhance the AppConnector component to perform actual API discovery
- Implement OpenAPI/Swagger specification parsing
- Add connection validation and error handling
- Create adapters for popular application types

```typescript
// src/services/app-connector.ts
export interface AppConnectionResult {
  success: boolean;
  appData?: {
    url: string;
    name: string;
    type: string;
    apiSpec?: any;
    endpoints?: Record<string, string>;
    authMethods?: string[];
  };
  error?: string;
}

export async function analyzeApplication(url: string): Promise<AppConnectionResult> {
  try {
    // Attempt to discover API documentation
    const apiEndpoints = [
      `${url}/swagger.json`,
      `${url}/openapi.json`,
      `${url}/api-docs`,
      `${url}/.well-known/ai-plugin.json`
    ];
    
    // Try each potential API documentation endpoint
    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const apiSpec = await response.json();
          
          // Extract app name and type from the API spec
          const appName = apiSpec.info?.title || url.replace(/(^\w+:|^)\/\//, '').split('/')[0];
          const appType = detectAppType(url, apiSpec);
          
          return {
            success: true,
            appData: {
              url,
              name: appName,
              type: appType,
              apiSpec,
              endpoints: extractEndpoints(apiSpec),
              authMethods: extractAuthMethods(apiSpec)
            }
          };
        }
      } catch (e) {
        // Continue to next endpoint if this one fails
        console.log(`Failed to fetch API spec from ${endpoint}`);
      }
    }
    
    // If no API spec was found, return basic information
    const appName = url.replace(/(^\w+:|^)\/\//, '').split('/')[0];
    const appType = detectAppType(url);
    
    return {
      success: true,
      appData: {
        url,
        name: appName,
        type: appType
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to analyze application: ${error.message}`
    };
  }
}

function detectAppType(url: string, apiSpec?: any): string {
  // Enhanced app type detection logic
  if (apiSpec?.info?.title?.toLowerCase().includes('e-commerce')) return 'E-commerce';
  if (apiSpec?.info?.title?.toLowerCase().includes('cms')) return 'CMS';
  
  // URL-based detection (fallback)
  if (url.includes('shopify')) return 'E-commerce';
  if (url.includes('wordpress')) return 'CMS';
  if (url.includes('github')) return 'Development';
  if (url.includes('slack')) return 'Communication';
  
  return 'Web Application';
}

function extractEndpoints(apiSpec: any): Record<string, string> {
  const endpoints: Record<string, string> = {};
  
  // Extract endpoints from OpenAPI/Swagger spec
  if (apiSpec.paths) {
    for (const [path, methods] of Object.entries(apiSpec.paths)) {
      for (const [method, details] of Object.entries(methods)) {
        const operationId = details.operationId || `${method}${path.replace(/\//g, '_')}`;
        endpoints[operationId] = `${method.toUpperCase()} ${path}`;
      }
    }
  }
  
  return endpoints;
}

function extractAuthMethods(apiSpec: any): string[] {
  const authMethods: string[] = [];
  
  // Extract authentication methods from OpenAPI/Swagger spec
  if (apiSpec.components?.securitySchemes) {
    for (const [name, scheme] of Object.entries(apiSpec.components.securitySchemes)) {
      authMethods.push(`${scheme.type} (${name})`);
    }
  } else if (apiSpec.securityDefinitions) {
    // Swagger 2.0
    for (const [name, scheme] of Object.entries(apiSpec.securityDefinitions)) {
      authMethods.push(`${scheme.type} (${name})`);
    }
  }
  
  return authMethods;
}
```

### 3. Configuration File Upload and Processing

#### Implementation Details

- Implement file upload functionality in the AppConnector component
- Add parsers for different configuration file formats (JSON, YAML, OpenAPI)
- Create a unified configuration model for different file types
- Add validation for uploaded configuration files

```typescript
// src/services/config-parser.ts
export interface ParsedConfig {
  appName: string;
  appType: string;
  endpoints?: Record<string, string>;
  authMethods?: string[];
  resources?: any[];
  schemas?: any[];
  rawConfig: any;
}

export async function parseConfigFile(file: File): Promise<ParsedConfig> {
  const fileContent = await readFileAsText(file);
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  let parsedData: any;
  
  // Parse based on file type
  if (fileExtension === 'json') {
    parsedData = JSON.parse(fileContent);
  } else if (['yaml', 'yml'].includes(fileExtension)) {
    parsedData = parseYaml(fileContent);
  } else {
    // Attempt to detect format from content
    try {
      parsedData = JSON.parse(fileContent);
    } catch (e) {
      try {
        parsedData = parseYaml(fileContent);
      } catch (e2) {
        throw new Error('Unsupported file format. Please upload JSON or YAML files.');
      }
    }
  }
  
  // Detect the type of configuration file
  if (isOpenApiSpec(parsedData)) {
    return parseOpenApiSpec(parsedData);
  } else if (isAgentifyConfig(parsedData)) {
    return parseAgentifyConfig(parsedData);
  } else {
    // Generic configuration
    return {
      appName: parsedData.name || parsedData.title || 'Unnamed App',
      appType: 'Custom Application',
      rawConfig: parsedData
    };
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function parseYaml(content: string): any {
  // YAML parsing implementation (using a library like js-yaml)
  // This is a placeholder - actual implementation would use a YAML library
  throw new Error('YAML parsing not implemented');
}

function isOpenApiSpec(data: any): boolean {
  return (
    (data.swagger && ['2.0', '3.0'].includes(data.swagger)) ||
    (data.openapi && data.openapi.startsWith('3.'))
  );
}

function isAgentifyConfig(data: any): boolean {
  return data.agentify !== undefined;
}

function parseOpenApiSpec(spec: any): ParsedConfig {
  return {
    appName: spec.info?.title || 'API Application',
    appType: 'API',
    endpoints: extractEndpointsFromSpec(spec),
    authMethods: extractAuthMethodsFromSpec(spec),
    schemas: extractSchemasFromSpec(spec),
    rawConfig: spec
  };
}

function parseAgentifyConfig(config: any): ParsedConfig {
  return {
    appName: config.name || 'Agentify Application',
    appType: config.type || 'Custom Agent',
    endpoints: config.endpoints,
    resources: config.resources,
    rawConfig: config
  };
}

// Helper functions for extracting data from OpenAPI specs
function extractEndpointsFromSpec(spec: any): Record<string, string> {
  // Implementation similar to the one in app-connector.ts
  const endpoints: Record<string, string> = {};
  
  if (spec.paths) {
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, details] of Object.entries(methods)) {
        const operationId = details.operationId || `${method}${path.replace(/\//g, '_')}`;
        endpoints[operationId] = `${method.toUpperCase()} ${path}`;
      }
    }
  }
  
  return endpoints;
}

function extractAuthMethodsFromSpec(spec: any): string[] {
  // Implementation similar to the one in app-connector.ts
  const authMethods: string[] = [];
  
  if (spec.components?.securitySchemes) {
    for (const [name, scheme] of Object.entries(spec.components.securitySchemes)) {
      authMethods.push(`${scheme.type} (${name})`);
    }
  } else if (spec.securityDefinitions) {
    for (const [name, scheme] of Object.entries(spec.securityDefinitions)) {
      authMethods.push(`${scheme.type} (${name})`);
    }
  }
  
  return authMethods;
}

function extractSchemasFromSpec(spec: any): any[] {
  const schemas: any[] = [];
  
  if (spec.components?.schemas) {
    for (const [name, schema] of Object.entries(spec.components.schemas)) {
      schemas.push({
        name,
        schema
      });
    }
  } else if (spec.definitions) {
    for (const [name, schema] of Object.entries(spec.definitions)) {
      schemas.push({
        name,
        schema
      });
    }
  }
  
  return schemas;
}
```

### 4. Enhanced AppConnector Component

#### Implementation Details

- Update the AppConnector component to use the new services
- Add file upload functionality
- Implement error handling and validation
- Add loading states for API discovery

```typescript
// Enhanced AppConnector.tsx
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Upload, Link, Zap, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeApplication } from "@/services/app-connector";
import { parseConfigFile } from "@/services/config-parser";
import { useOnboarding } from "@/contexts/OnboardingContext";

const AppConnector = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { state, updateState, saveProgress } = useOnboarding();

  const handleConnect = async () => {
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please enter a valid URL to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await analyzeApplication(url);
      
      if (result.success && result.appData) {
        updateState({
          currentStep: 'configure',
          connectedApp: {
            url: result.appData.url,
            name: result.appData.name,
            type: result.appData.type
          },
          appConfig: result.appData
        });
        
        saveProgress();
        
        toast({
          title: "App Connected!",
          description: `Successfully analyzed ${result.appData.name}`,
        });
      } else {
        setError(result.error || "Failed to analyze the application");
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to analyze the application",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast({
        title: "Connection Error",
        description: "An unexpected error occurred while analyzing the application",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const parsedConfig = await parseConfigFile(file);
      
      updateState({
        currentStep: 'configure',
        connectedApp: {
          url: parsedConfig.rawConfig.url || 'file-upload',
          name: parsedConfig.appName,
          type: parsedConfig.appType
        },
        appConfig: parsedConfig
      });
      
      saveProgress();
      
      toast({
        title: "Configuration Loaded!",
        description: `Successfully loaded configuration for ${parsedConfig.appName}`,
      });
    } catch (err) {
      setError(err.message || "Failed to parse configuration file");
      toast({
        title: "Parse Error",
        description: err.message || "Failed to parse configuration file",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const popularApps = [
    { name: 'Shopify Store', url: 'https://demo.shopify.com', type: 'E-commerce', icon: '🛍️' },
    { name: 'WordPress Site', url: 'https://wordpress.com/demo', type: 'CMS', icon: '📝' },
    { name: 'GitHub Repo', url: 'https://github.com/vercel/next.js', type: 'Development', icon: '💻' },
    { name: 'Slack Workspace', url: 'https://slack.com/demo', type: 'Communication', icon: '💬' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">Connect Your App</h2>
        <p className="text-xl text-white/70">
          Enter your app's URL or upload a configuration file to create the perfect AI agent
        </p>
      </div>

      <Tabs defaultValue="url" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
          <TabsTrigger value="url" className="data-[state=active]:bg-purple-500/20">
            <Globe className="h-4 w-4 mr-2" />
            Enter URL
          </TabsTrigger>
          <TabsTrigger value="upload" className="data-[state=active]:bg-purple-500/20">
            <Upload className="h-4 w-4 mr-2" />
            Upload Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Link className="h-5 w-5 mr-2 text-purple-400" />
                App URL
              </CardTitle>
              <CardDescription className="text-white/70">
                Paste the URL of the app you want to agentify
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex space-x-4">
                <Input
                  placeholder="https://your-app.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
                <Button 
                  onClick={handleConnect}
                  disabled={isAnalyzing}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  {isAnalyzing ? (
                    <>
                      <Zap className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Connect App'
                  )}
                </Button>
              </div>
              
              {isAnalyzing && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-pulse h-3 w-3 bg-blue-400 rounded-full"></div>
                    <span className="text-blue-400">Analyzing app structure and capabilities...</span>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400">{error}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Apps */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-6">Try with Popular Apps</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {popularApps.map((app, index) => (
                <Card 
                  key={index} 
                  className="bg-white/5 border-white/10 backdrop-blur-lg hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => setUrl(app.url)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{app.icon}</span>
                      <div>
                        <h4 className="font-semibold text-white">{app.name}</h4>
                        <Badge variant="outline" className="border-purple-400/50 text-purple-400 text-xs">
                          {app.type}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Upload className="h-5 w-5 mr-2 text-purple-400" />
                Upload Configuration
              </CardTitle>
              <CardDescription className="text-white/70">
                Upload an API specification or configuration file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json,.yaml,.yml"
                className="hidden"
              />
              <div 
                className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center hover:border-purple-400/50 transition-colors cursor-pointer"
                onClick={triggerFileUpload}
              >
                <Upload className="h-12 w-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/70 mb-2">Drop your files here or click to browse</p>
                <p className="text-white/50 text-sm">Supports OpenAPI, Swagger, JSON, and YAML</p>
              </div>
              
              {isAnalyzing && (
                <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-pulse h-3 w-3 bg-blue-400 rounded-full"></div>
                    <span className="text-blue-400">Processing configuration file...</span>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400">{error}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppConnector;
```

### 5. Enhanced AgentConfig Component

#### Implementation Details

- Update the AgentConfig component to use data from the previous step
- Pre-populate fields based on the connected app or uploaded configuration
- Add validation for the agent configuration
- Implement auto-save functionality

```typescript
// Enhanced AgentConfig.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Bot, Brain, Zap, Settings, Sparkles, Plus, Trash2, Server } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AgentHeaderActions from "@/components/AgentHeaderActions";
import { useOnboarding } from "@/contexts/OnboardingContext";

export interface AgentConfiguration {
  name: string;
  type: string;
  personality: string;
  instructions: string;
  features: Record<string, boolean>;
  settings: Record<string, unknown>;
  endpoints?: {
    [key: string]: string;
  };
}

const AgentConfig = () => {
  const { state, updateState, saveProgress } = useOnboarding();
  const { connectedApp, appConfig } = state;
  
  const [agentName, setAgentName] = useState(`${connectedApp?.name || 'App'} Assistant`);
  const [personality, setPersonality] = useState('helpful');
  const [instructions, setInstructions] = useState('You are a helpful AI assistant for this application. Help users navigate and get the most out of the features.');
  const [creativity, setCreativity] = useState([0.7]);
  const [features, setFeatures] = useState({
    chat: true,
    automation: true,
    analytics: true,
    notifications: false
  });
  const [mcpServers, setMcpServers] = useState([]);
  const [newMcpServer, setNewMcpServer] = useState({
    name: '',
    url: '',
    description: ''
  });
  const [isValid, setIsValid] = useState(false);
  const { toast } = useToast();

  // Initialize with data from appConfig if available
  useEffect(() => {
    if (appConfig) {
      // Pre-populate agent name
      setAgentName(`${connectedApp?.name || 'App'} Assistant`);
      
      // Pre-populate instructions based on app type
      if (connectedApp?.type === 'E-commerce') {
        setInstructions('You are a helpful AI assistant for this e-commerce store. Help users find products, answer questions about inventory, and assist with the checkout process.');
      } else if (connectedApp?.type === 'CMS') {
        setInstructions('You are a helpful AI assistant for this content management system. Help users create, edit, and manage content effectively.');
      }
      
      // If we have endpoints from the app config, add them to the agent config
      if (appConfig.endpoints) {
        // Pre-configure features based on available endpoints
        const updatedFeatures = { ...features };
        if (Object.keys(appConfig.endpoints).some(e => e.toLowerCase().includes('chat'))) {
          updatedFeatures.chat = true;
        }
        if (Object.keys(appConfig.endpoints).some(e => e.toLowerCase().includes('automat'))) {
          updatedFeatures.automation = true;
        }
        if (Object.keys(appConfig.endpoints).some(e => e.toLowerCase().includes('analytic'))) {
          updatedFeatures.analytics = true;
        }
        if (Object.keys(appConfig.endpoints).some(e => e.toLowerCase().includes('notif'))) {
          updatedFeatures.notifications = true;
        }
        setFeatures(updatedFeatures);
      }
    }
  }, [appConfig, connectedApp]);

  // Validate the configuration
  useEffect(() => {
    const valid = 
      agentName.trim().length > 0 && 
      instructions.trim().length > 0;
    
    setIsValid(valid);
  }, [agentName, instructions]);

  // Auto-save configuration changes
  useEffect(() => {
    const config: AgentConfiguration = {
      name: agentName,
      type: 'custom',
      personality,
      instructions,
      features,
      settings: {
        creativity: creativity[0],
        mcpServers
      },
      endpoints: appConfig?.endpoints
    };
    
    updateState({ agentConfig: config });
    saveProgress();
  }, [agentName, personality, instructions, features, creativity, mcpServers]);

  const handleContinue = () => {
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    const config: AgentConfiguration = {
      name: agentName,
      type: 'custom',
      personality,
      instructions,
      features,
      settings: {
        creativity: creativity[0],
        mcpServers
      },
      endpoints: appConfig?.endpoints
    };
    
    updateState({
      currentStep: 'deploy',
      agentConfig: config
    });
    
    saveProgress();
    
    toast({
      title: "Agent Configured!",
      description: `${agentName} has been configured and is ready to deploy`,
    });
  };

  const personalities = [
    { id: 'helpful', name: 'Helpful', description: 'Friendly and supportive' },
    { id: 'professional', name: 'Professional', description: 'Formal and business-focused' },
    { id: 'casual', name: 'Casual', description: 'Relaxed and conversational' },
    { id: 'expert', name: 'Expert', description: 'Technical and knowledgeable' },
  ];

  const toggleFeature = (feature: keyof typeof features) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };

  const addMcpServer = () => {
    if (!newMcpServer.name || !newMcpServer.url) {
      toast({
        title: "Error",
        description: "Please fill in both name and URL fields",
        variant: "destructive"
      });
      return;
    }

    const server = {
      id: Date.now().toString(),
      name: newMcpServer.name,
      url: newMcpServer.url,
      description: newMcpServer.description,
      enabled: true
    };

    setMcpServers(prev => [...prev, server]);
    setNewMcpServer({ name: '', url: '', description: '' });
    
    toast({
      title: "MCP Server Added",
      description: `${server.name} has been added to your agent configuration`,
    });
  };

  const removeMcpServer = (id: string) => {
    setMcpServers(prev => prev.filter(server => server.id !== id));
    toast({
      title: "MCP Server Removed",
      description: "Server has been removed from your agent configuration",
    });
  };

  const toggleMcpServer = (id: string) => {
    setMcpServers(prev => prev.map(server => 
      server.id === id ? { ...server, enabled: !server.enabled } : server
    ));
  };

  // Rest of the component remains the same as the original AgentConfig.tsx
  // ...

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Component UI remains the same */}
      {/* ... */}
      
      {/* Add a continue button at the bottom */}
      <div className="flex justify-end mt-8">
        <Button
          onClick={handleContinue}
          disabled={!isValid}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          Continue to Deployment
        </Button>
      </div>
    </div>
  );
};

export default AgentConfig;
```

### 6. Enhanced AgentDeployer Component

#### Implementation Details

- Update the AgentDeployer component to use data from previous steps
- Implement real compilation and deployment functionality
- Add progress tracking and error handling
- Ensure configuration data is passed to the compiler

```typescript
// Enhanced AgentDeployer.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rocket, MessageSquare, Cloud, Code } from "lucide-react";
import StatusDashboard from "@/components/deployer/StatusDashboard";
import RepositoryPanel from "@/components/deployer/RepositoryPanel";
import TestRunner from "@/components/deployer/TestRunner";
import DeploymentPanel from "@/components/deployer/DeploymentPanel";
import CompilerPanel from "@/components/deployer/CompilerPanel";
import ChatModal from "@/components/deployer/ChatModal";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/contexts/OnboardingContext";

const AgentDeployer = () => {
  const { state, updateState, saveProgress } = useOnboarding();
  const { connectedApp, appConfig, agentConfig } = state;
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastAgonResponse, setLastAgonResponse] = useState<string>("");
  const [compileResult, setCompileResult] = useState<any>(null);
  const [deploymentConfig, setDeploymentConfig] = useState<any>(null);
  const { toast } = useToast();

  // Initialize with data from previous steps
  useEffect(() => {
    if (agentConfig && !deploymentConfig) {
      // Create initial deployment configuration
      setDeploymentConfig({
        agentId: `${connectedApp?.name?.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        version: '1.0.0',
        platforms: ['windows', 'mac', 'linux'],
        teeConfig: {
          isolationLevel: 'process',
          resourceLimits: {
            memory: 512,
            cpu: 1,
            timeLimit: 60
          },
          networkAccess: true,
          fileSystemAccess: false
        }
      });
    }
  }, [agentConfig, connectedApp]);

  // Handler to receive AI response from chat interface
  const handleAgonResponse = (response: string) => {
    setLastAgonResponse(response);
  };

  // Handler for compilation completion
  const handleCompileComplete = (result: any) => {
    setCompileResult(result);
    
    // Update deployment config with compilation result
    setDeploymentConfig(prev => ({
      ...prev,
      compiledAt: new Date().toISOString(),
      compileResult: result
    }));
    
    // Update onboarding state
    updateState({
      deploymentConfig: {
        ...deploymentConfig,
        compiledAt: new Date().toISOString(),
        compileResult: result
      }
    });
    
    saveProgress();
    
    // Auto-switch to deploy tab
    setActiveTab("deploy");
    
    toast({
      title: "Compilation Complete",
      description: "Your agent has been successfully compiled and is ready to deploy",
    });
  };

  // Handler for deployment completion
  const handleDeployComplete = () => {
    // Update onboarding state
    updateState({
      currentStep: 'dashboard',
      deploymentConfig: {
        ...deploymentConfig,
        deployedAt: new Date().toISOString()
      }
    });
    
    saveProgress();
    
    toast({
      title: "Agent Deployed!",
      description: `${agentConfig?.name} has been successfully deployed and is ready to use`,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-12">
        <div className="text-center md:text-left w-full">
          <h2 className="text-4xl font-bold text-white mb-4">Deploy Your AI Agent</h2>
          <p className="text-xl text-white/70">
            Test and deploy your agent for {connectedApp?.name}
          </p>
        </div>
      </div>

      {/* Main Interface */}
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/5 border border-white/10">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-500/20">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="repository" className="data-[state=active]:bg-purple-500/20">
              Repository
            </TabsTrigger>
            <TabsTrigger value="compile" className="data-[state=active]:bg-purple-500/20">
              <Code className="w-4 h-4 mr-2" />
              Compile
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
            <StatusDashboard 
              repoUrl={connectedApp?.url} 
              agentConfig={agentConfig} 
              appConfig={appConfig}
              deploymentConfig={deploymentConfig}
            />
          </TabsContent>

          <TabsContent value="repository" className="space-y-6">
            <RepositoryPanel 
              repoUrl={connectedApp?.url} 
              appConfig={appConfig}
            />
          </TabsContent>
          
          <TabsContent value="compile" className="space-y-6">
            <CompilerPanel 
              agentConfig={agentConfig} 
              appConfig={appConfig}
              deploymentConfig={deploymentConfig}
              onCompileComplete={handleCompileComplete}
            />
          </TabsContent>

          <TabsContent value="tests" className="space-y-6">
            <TestRunner 
              repoUrl={connectedApp?.url} 
              agentConfig={agentConfig}
              appConfig={appConfig}
              compileResult={compileResult}
            />
          </TabsContent>

          <TabsContent value="deploy" className="space-y-6">
            <DeploymentPanel 
              repoUrl={connectedApp?.url} 
              agentConfig={agentConfig}
              appConfig={appConfig}
              deploymentConfig={deploymentConfig}
              compileResult={compileResult}
              onDeployComplete={handleDeployComplete}
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
            repoUrl={connectedApp?.url}
            onAgonResponse={handleAgonResponse}
            agentConfig={agentConfig}
            appConfig={appConfig}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentDeployer;
```

### 7. Update Index Page to Use OnboardingContext

#### Implementation Details

- Refactor the Index page to use the OnboardingContext
- Remove redundant state management
- Ensure proper navigation between steps

```typescript
// Enhanced Index.tsx
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { Link } from "react-router-dom";
import Hero from "@/components/Hero";
import AppConnector from "@/components/AppConnector";
import AgentConfig from "@/components/AgentConfig";
import AgentDeployer from "@/components/AgentDeployer";
import Dashboard from "@/components/Dashboard";
import LoginModal from "@/components/LoginModal";
import AgentHeaderActions from "@/components/AgentHeaderActions";
import StepIndicator from "@/components/StepIndicator";
import { useOnboarding } from "@/contexts/OnboardingContext";

const Index = () => {
  const { state, updateState } = useOnboarding();
  const { currentStep, connectedApp } = state;
  
  const [loginModalOpen, setLoginModalOpen] = React.useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [dashboardIsActive, setDashboardIsActive] = React.useState(true);

  // Handle navigation between steps
  const goBack = () => {
    if (currentStep === 'configure') updateState({ currentStep: 'connect' });
    if (currentStep === 'connect') updateState({ currentStep: 'hero' });
    if (currentStep === 'deploy') updateState({ currentStep: 'configure' });
    if (currentStep === 'dashboard') updateState({ currentStep: 'deploy' });
  };

  // Determine if agent actions should be shown
  const showAgentActions = currentStep === 'dashboard' || 
                          (currentStep === 'configure' && connectedApp) || 
                          (currentStep === 'deploy' && connectedApp);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo and left-side buttons */}
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2" aria-label="Go to homepage">
                <Bot className="h-8 w-8 text-purple-400" />
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Agentify
                </span>
              </Link>
              {/* Back then Sign In button */}
              {currentStep !== 'hero' && (
                <Button 
                  variant="ghost" 
                  onClick={goBack} 
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  ← Back
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setLoginModalOpen(true)}
                className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10 hover:text-purple-300"
              >
                Sign In
              </Button>
              
              {/* Step Indicator */}
              <div className="ml-4">
                <StepIndicator currentStep={currentStep} />
              </div>
            </div>
            {/* Right: Agent (dashboard/configure) status/actions */}
            <div>
              {showAgentActions && (
                <AgentHeaderActions
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
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative">
        {currentStep === 'hero' && (
          <Hero onGetStarted={() => updateState({ currentStep: 'connect' })} />
        )}
        
        {currentStep === 'connect' && (
          <AppConnector />
        )}
        
        {currentStep === 'configure' && connectedApp && (
          <AgentConfig />
        )}
        
        {currentStep === 'deploy' && connectedApp && (
          <AgentDeployer />
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

      <LoginModal 
        open={loginModalOpen} 
        onOpenChange={setLoginModalOpen} 
      />
    </div>
  );
};

export default Index;
```

## Implementation Timeline

### Phase 1: Core State Management (Week 1)
- Create OnboardingContext
- Implement local storage persistence
- Update Index page to use the context

### Phase 2: Enhanced App Connection (Week 2)
- Implement app-connector service
- Update AppConnector component
- Add configuration file parsing

### Phase 3: Configuration Flow (Week 3)
- Enhance AgentConfig component
- Implement auto-save functionality
- Add validation

### Phase 4: Deployment Integration (Week 4)
- Update AgentDeployer component
- Integrate with compiler
- Implement deployment functionality

### Phase 5: Testing and Refinement (Week 5)
- End-to-end testing
- Bug fixes
- Performance optimization
- Documentation

## Conclusion

This implementation plan provides a comprehensive approach to enhancing the onboarding process in the Agentify application. By implementing a persistent state management system, real application connection functionality, and seamless data flow between steps, users will be able to connect their applications, configure AI agents, and deploy them with minimal friction.

The plan focuses on creating a simple, elegant solution that maintains state throughout the onboarding funnel while providing a rich, interactive experience. Each step builds upon the previous one, ensuring that configuration data is carried forward and utilized effectively.

Upon completion, users will be able to:
1. Connect real applications via URL or configuration files
2. Configure AI agents with pre-populated settings based on the connected application
3. Deploy agents with all necessary configuration data
4. Monitor and manage their deployed agents

This implementation will significantly enhance the user experience and increase the likelihood of successful agent deployments.