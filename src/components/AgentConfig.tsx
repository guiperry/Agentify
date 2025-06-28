'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bot, Brain, Zap, Settings, Sparkles, Plus, Trash2, Server, Code, TestTube, Upload, FileText, CheckCircle, XCircle, Download, Share, Key, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AgentHeaderActions from "@/components/AgentHeaderActions";
import CompilerPanel from "@/components/deployer/CompilerPanel";
import TestRunner from "@/components/deployer/TestRunner";
import StatusDashboard from "@/components/deployer/StatusDashboard";
import ImportConfigModal from "@/components/ImportConfigModal";
import ExportConfigModal from "@/components/ExportConfigModal";
import { parseConfigFile } from "@/services";
import { configurationService, ProcessingStep } from "@/services/configurationService";
import { useSSE } from "@/hooks/useSSE";

export interface AgentFacts {
  id: string;
  agent_name: string;
  capabilities: {
    modalities: string[];
    skills: string[];
  };
  endpoints: {
    static: string[];
    adaptive_resolver: {
      url: string;
      policies: string[];
    };
  };
  certification: {
    level: string;
    issuer: string;
    attestations: string[];
  };
}

export interface ApiKeys {
  openai: string;
  anthropic: string;
  google: string;
  cerebras: string;
  deepseek: string;
}

export interface AgentConfiguration {
  name: string;
  type: string;
  personality: string;
  instructions: string;
  features: Record<string, boolean>;
  settings: Record<string, unknown>;
  agentFacts: AgentFacts;
  apiKeys?: ApiKeys;
  endpoints?: {
    [key: string]: string;
  };
  compilationData?: {
    success: boolean;
    downloadUrl?: string;
    filename?: string;
    compilationMethod?: string;
    jobId?: string;
  };
}

interface AgentConfigProps {
  connectedApp: {url: string, name: string, type: string};
  onConfigured: (config: AgentConfiguration) => void;
  // Props to support top-right agent actions:
  isActive: boolean;
  downloadModalOpen: boolean;
  setDownloadModalOpen: (open: boolean) => void;
  onDownload: (platform: 'windows' | 'mac' | 'linux') => void;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
}

interface MCPServer {
  id: string;
  name: string;
  url: string;
  description: string;
  enabled: boolean;
}

const AgentConfig = ({
  connectedApp,
  onConfigured,
  isActive,
  downloadModalOpen,
  setDownloadModalOpen,
  onDownload,
  settingsModalOpen,
  setSettingsModalOpen
}: AgentConfigProps) => {
  const [agentName, setAgentName] = useState(`${connectedApp.name} Assistant`);
  const [personality, setPersonality] = useState('helpful');
  const [instructions, setInstructions] = useState('You are a helpful AI assistant for this application. Help users navigate and get the most out of the features.');
  const [creativity, setCreativity] = useState([0.7]);
  const [features, setFeatures] = useState({
    chat: true,
    automation: true,
    analytics: true,
    notifications: false
  });

  // Agent Facts state
  const [agentFacts, setAgentFacts] = useState<AgentFacts>({
    id: crypto.randomUUID(),
    agent_name: `${connectedApp.name} Assistant`,
    capabilities: {
      modalities: ['text', 'structured_data'],
      skills: ['analysis', 'synthesis', 'research']
    },
    endpoints: {
      static: ['https://api.provider.com/v1/chat'],
      adaptive_resolver: {
        url: 'https://resolver.provider.com/capabilities',
        policies: ['capability_negotiation', 'load_balancing']
      }
    },
    certification: {
      level: 'verified',
      issuer: 'NANDA',
      attestations: ['privacy_compliant', 'security_audited']
    }
  });
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [newMcpServer, setNewMcpServer] = useState({
    name: '',
    url: '',
    description: ''
  });

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    openai: '',
    anthropic: '',
    google: '',
    cerebras: '',
    deepseek: ''
  });

  // Process Configuration state
  const [isProcessingConfig, setIsProcessingConfig] = useState(false);
  const [currentProcessingTab, setCurrentProcessingTab] = useState<string>('');
  const [configProcessComplete, setConfigProcessComplete] = useState(false);
  const [agentMinted, setAgentMinted] = useState(false);
  const [compilationComplete, setCompilationComplete] = useState(false);
  const [compilationResult, setCompilationResult] = useState<{
    success: boolean;
    downloadUrl?: string;
    filename?: string;
    compilationMethod?: string;
    jobId?: string;
  } | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileStatus, setCompileStatus] = useState<'idle' | 'compiling' | 'success' | 'error'>('idle');
  const [selectedBuildTarget, setSelectedBuildTarget] = useState<'wasm' | 'go'>('wasm');
  const [agentRegistered, setAgentRegistered] = useState(false);
  const [activeTab, setActiveTab] = useState('identity');
  const [triggerCompile, setTriggerCompile] = useState<number>(0);

  // Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Processing state
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [compilationLogs, setCompilationLogs] = useState<string[]>([]);
  const [completedTabs, setCompletedTabs] = useState<Set<string>>(new Set());
  const [waitingForCompilation, setWaitingForCompilation] = useState(false);

  // Modal states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const { toast } = useToast();

  // SSE for real-time updates using singleton
  const { isConnected: sseConnected } = useSSE({
    onMessage: (message) => {
      console.log('🔔 Raw SSE message received:', message);
      if (message.type === 'compilation_update') {
        setCompilationLogs(prev => [...prev, message.data]);
      }
    },
    onCompilationUpdate: (update) => {
      console.log('🔔 Received compilation update:', update);

      // Update processing steps
      setProcessingSteps(prev => {
        const updated = [...prev];
        const index = updated.findIndex(s => s.id === update.step);

        // Map SSE status to ProcessingStep status
        const mapStatus = (sseStatus: string): 'pending' | 'running' | 'completed' | 'failed' => {
          switch (sseStatus) {
            case 'in_progress': return 'running';
            case 'completed': return 'completed';
            case 'error': return 'failed';
            default: return 'pending';
          }
        };

        if (index >= 0) {
          updated[index] = {
            ...updated[index],
            status: mapStatus(update.status),
            progress: update.progress || 0,
            message: update.message
          };
        } else if (update.step && update.step !== 'initialization' && update.step !== 'error') {
          updated.push({
            id: update.step,
            name: update.step,
            status: mapStatus(update.status),
            progress: update.progress || 0,
            message: update.message
          });
        }
        return updated;
      });

      // Update current processing tab for button display
      if (update.step && update.status === 'in_progress') {
        const stepNames: Record<string, string> = {
          'validate': 'Identity',
          'api-keys': 'API Keys',
          'analyze': 'Personality',
          'capabilities': 'Capabilities',
          'compile': 'Compilation'
        };
        setCurrentProcessingTab(stepNames[update.step] || update.step);
      }

      // Update active tab based on current step (exactly like mock)
      if (update.step === 'validate') {
        setActiveTab('identity');
        if (update.status === 'completed') {
          setCompletedTabs(prev => new Set(prev).add('identity'));
        }
      } else if (update.step === 'api-keys') {
        setActiveTab('api-keys');
        if (update.status === 'completed') {
          setCompletedTabs(prev => new Set(prev).add('api-keys'));
        }
      } else if (update.step === 'analyze') {
        setActiveTab('personality');
        if (update.status === 'completed') {
          setCompletedTabs(prev => new Set(prev).add('personality'));
        }
      } else if (update.step === 'capabilities') {
        setActiveTab('capabilities');
        if (update.status === 'completed') {
          setCompletedTabs(prev => new Set(prev).add('capabilities'));
        }
      } else if (update.step === 'compile') {
        setActiveTab('compile');
        if (update.status === 'in_progress') {
          // Compile step started but not completed - set waiting state
          setWaitingForCompilation(true);
          setIsProcessingConfig(false); // Stop processing animation, start waiting
          console.log('⏸️ Compilation paused, waiting for manual compilation');
        } else if (update.status === 'completed') {
          setCompletedTabs(prev => new Set(prev).add('compile'));
          setWaitingForCompilation(false);
        }
      }
    }
  });

  // Update agent name when connected app changes (only if no saved progress)
  useEffect(() => {
    const savedProgress = localStorage.getItem('agentify-config-progress');
    if (!savedProgress) {
      const newAgentName = `${connectedApp.name} Assistant`;
      setAgentName(newAgentName);
      setAgentFacts(prev => ({ ...prev, agent_name: newAgentName }));
    }
  }, [connectedApp.name]);

  // Load saved progress on component mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('agentify-config-progress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        if (parsed.agentName) setAgentName(parsed.agentName);
        if (parsed.personality) setPersonality(parsed.personality);
        if (parsed.instructions) setInstructions(parsed.instructions);
        if (parsed.creativity) setCreativity(parsed.creativity);
        if (parsed.features) setFeatures(parsed.features);
        if (parsed.agentFacts) setAgentFacts(parsed.agentFacts);
        if (parsed.mcpServers) setMcpServers(parsed.mcpServers);
        if (parsed.apiKeys) setApiKeys(parsed.apiKeys);
        if (parsed.activeTab) setActiveTab(parsed.activeTab);
        if (parsed.configProcessComplete) setConfigProcessComplete(parsed.configProcessComplete);

        toast({
          title: "Progress Restored",
          description: "Your previous configuration has been restored.",
        });
      } catch (error) {
        console.error('Failed to load saved progress:', error);
      }
    }
  }, []);

  // Save progress whenever key state changes
  useEffect(() => {
    const progressData = {
      agentName,
      personality,
      instructions,
      creativity,
      features,
      agentFacts,
      mcpServers,
      apiKeys,
      activeTab,
      configProcessComplete,
      timestamp: Date.now()
    };

    localStorage.setItem('agentify-config-progress', JSON.stringify(progressData));
  }, [agentName, personality, instructions, creativity, features, agentFacts, mcpServers, apiKeys, activeTab, configProcessComplete]);

  // Clear saved progress when agent is successfully minted
  const clearSavedProgress = () => {
    localStorage.removeItem('agentify-config-progress');
  };

  // Export configuration
  const exportConfiguration = () => {
    const configData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      agentName,
      personality,
      instructions,
      creativity: creativity[0],
      features,
      agentFacts,
      mcpServers,
      apiKeys,
      metadata: {
        connectedApp: connectedApp.name,
        exportedBy: "Agentify",
        configProcessComplete
      }
    };

    const dataStr = JSON.stringify(configData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${agentName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_config.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Configuration Exported",
      description: `Configuration saved as ${link.download}`,
    });
  };

  // Import configuration from exported file
  const importConfiguration = (configData: any) => {
    try {
      if (configData.agentName) setAgentName(configData.agentName);
      if (configData.personality) setPersonality(configData.personality);
      if (configData.instructions) setInstructions(configData.instructions);
      if (configData.creativity !== undefined) setCreativity([configData.creativity]);
      if (configData.features) setFeatures(configData.features);
      if (configData.agentFacts) setAgentFacts(configData.agentFacts);
      if (configData.mcpServers) setMcpServers(configData.mcpServers);
      if (configData.apiKeys) setApiKeys(configData.apiKeys);
      if (configData.metadata?.configProcessComplete) setConfigProcessComplete(configData.metadata.configProcessComplete);

      toast({
        title: "Configuration Imported",
        description: "All settings have been restored from the exported configuration.",
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import configuration. Please check the file format.",
        variant: "destructive",
      });
    }
  };

  const personalities = [
    { id: 'helpful', name: 'Helpful', description: 'Friendly and supportive' },
    { id: 'professional', name: 'Professional', description: 'Formal and business-focused' },
    { id: 'casual', name: 'Casual', description: 'Relaxed and conversational' },
    { id: 'expert', name: 'Expert', description: 'Technical and knowledgeable' },
  ];

  const handleRegisterAgent = () => {
    setAgentRegistered(true);

    toast({
      title: "Agent Registered!",
      description: `${agentName} has been registered successfully. You can now access all tabs and process the configuration.`,
    });

    // Switch to API Keys tab after registration
    setActiveTab('api-keys');
  };

  const handleDeploy = () => {
    setAgentMinted(true);

    toast({
      title: "Agent Minted!",
      description: `${agentName} has been minted successfully. Navigating to deployment...`,
    });

    // Clear saved progress since we're moving to the next step
    clearSavedProgress();

    // Create the final configuration object
    const finalConfig: AgentConfiguration = {
      name: agentName,
      type: 'custom',
      personality,
      instructions,
      features,
      agentFacts,
      apiKeys,
      settings: {
        creativity: creativity[0],
        mcpServers
      },
      compilationData: compilationResult || undefined
    };

    // Navigate to deploy step
    onConfigured(finalConfig);
  };

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

    const server: MCPServer = {
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

  // Function to poll GitHub Actions compilation status
  const pollGitHubActionsCompletion = async (jobId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        console.log(`🔍 Checking GitHub Actions compilation status... (${attempts + 1}/${maxAttempts})`);

        const statusResponse = await fetch(`/api/compile/status?jobId=${encodeURIComponent(jobId)}`);
        const statusResult = await statusResponse.json();

        if (!statusResponse.ok) {
          throw new Error(statusResult.message || 'Failed to check compilation status');
        }

        if (statusResult.status === 'completed') {
          // Compilation completed successfully
          console.log('🎉 GitHub Actions compilation completed successfully!');

          setCompileStatus('success');
          setCompilationComplete(true);
          setCompletedTabs(prev => new Set(prev).add('compile'));

          // Store compilation result
          setCompilationResult({
            success: true,
            downloadUrl: statusResult.downloadUrl,
            filename: `agent-plugin-${jobId}.zip`,
            compilationMethod: 'github-actions',
            jobId: jobId
          });

          toast({
            title: "Compilation Successful",
            description: "GitHub Actions compilation completed successfully!",
          });

          // Set isCompiling to false since compilation is complete
          setIsCompiling(false);
          return; // Exit polling loop
        } else if (statusResult.status === 'failed') {
          // Compilation failed
          throw new Error(statusResult.error || 'GitHub Actions compilation failed');
        } else {
          // Still in progress, continue polling
          console.log(`Status: ${statusResult.status || 'in_progress'}`);
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;

      } catch (error) {
        console.error('GitHub Actions polling error:', error);

        // If it's a network error, continue polling (might be temporary)
        if (attempts < maxAttempts - 1) {
          console.log("Retrying in 5 seconds...");
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
          continue;
        } else {
          // Max attempts reached, treat as failure
          setCompileStatus('error');

          toast({
            title: "Compilation Failed",
            description: "Failed to monitor GitHub Actions compilation",
            variant: "destructive",
          });

          // Set isCompiling to false since compilation failed
          setIsCompiling(false);
          return;
        }
      }
    }

    // Timeout reached
    console.log("GitHub Actions compilation monitoring timed out");
    setCompileStatus('error');

    toast({
      title: "Monitoring Timeout",
      description: "GitHub Actions compilation monitoring timed out. Check GitHub Actions tab for status.",
      variant: "destructive",
    });

    // Set isCompiling to false since monitoring timed out
    setIsCompiling(false);
  };

  const handleCompile = async () => {
    console.log("🚀 AgentConfig handleCompile called");
    setIsCompiling(true);
    setCompileStatus('compiling');

    // Navigate to compile tab first
    setActiveTab('compile');

    // Use a small delay to ensure the tab switch happens, then trigger the CompilerPanel compile
    setTimeout(() => {
      console.log("🎯 Triggering CompilerPanel compilation");
      // The CompilerPanel will handle the actual compilation and navigation to logs tab
      setTriggerCompile(Date.now()); // This will trigger the CompilerPanel to start compilation
    }, 100);

    // The CompilerPanel will handle the actual compilation logic
    // We just need to manage the main compile button state here
  };

  const processConfiguration = async () => {
    console.log('🚀 Process Configuration button clicked!');
    setIsProcessingConfig(true);
    setConfigProcessComplete(false);
    setProcessingSteps([]);
    setCompilationLogs([]);
    setCompletedTabs(new Set()); // Reset completed tabs
    setWaitingForCompilation(false); // Reset waiting state

    // Send initial SSE update
    const sendCompilationUpdate = (update: {
      step: string;
      progress: number;
      message: string;
      status: string;
    }) => {
      if (sseConnected) {
        fetch('/.netlify/functions/compile-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'compilation_update',
            data: update
          }),
        });
      }
    };
  
    // Send initial SSE update
    if (sseConnected) {
      sendCompilationUpdate({
        step: 'initialization',
        progress: 0,
        message: 'Starting configuration processing...',
        status: 'in_progress'
      });
    }

    try {
      // First validate the agent facts
      console.log('Starting validation with agent facts:', agentFacts);

      // Send validation start update
      sendCompilationUpdate({
        step: 'validation',
        progress: 10,
        message: 'Validating agent configuration...',
        status: 'in_progress'
      });

      const validation = await configurationService.validateAgentFacts(agentFacts);
      console.log('Validation result:', validation);

      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        console.error('Validation failed with errors:', validation.errors);

        // Send validation failure update
        if (sseConnected) {
          sendCompilationUpdate({
            step: 'validation',
            progress: 10,
            message: 'Validation failed: ' + Object.values(validation.errors).join(', '),
            status: 'error'
          });
        }

        toast({
          title: "Validation Failed",
          description: "Please fix the validation errors before proceeding.",
          variant: "destructive",
        });
        setIsProcessingConfig(false);
        return;
      }

      // Send validation success update
      sendCompilationUpdate({
        step: 'validation',
        progress: 25,
        message: 'Agent configuration validated successfully',
        status: 'completed'
      });

      // Clear any previous validation errors
      setValidationErrors({});

      // Send configuration preparation update
      sendCompilationUpdate({
        step: 'configuration',
        progress: 35,
        message: 'Preparing agent configuration...',
        status: 'in_progress'
      });

      // Create configuration object
      const config: AgentConfiguration = {
        name: agentName,
        type: 'custom',
        personality,
        instructions,
        features,
        agentFacts,
        apiKeys,
        settings: {
          creativity: creativity[0],
          mcpServers
        }
      };

      // Send configuration ready update
      sendCompilationUpdate({
        step: 'configuration',
        progress: 45,
        message: 'Agent configuration prepared successfully',
        status: 'completed'
      });

      // Use SSE-based process configuration for real-time animation
      console.log('🔧 SSE connected:', sseConnected);
      console.log('🔧 Starting SSE-based configuration processing with config:', config);

      // Set processing state to show button as disabled with running icon (regardless of WebSocket)
      setIsProcessingConfig(true);
      setCurrentProcessingTab('Initialization');
      console.log('🔧 Button state set to processing: true');

      if (sseConnected) {
        // Send process configuration request via SSE
        fetch('/.netlify/functions/compile-stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'start_process_configuration',
            data: config,
            timestamp: new Date().toISOString()
          }),
        });

        // The SSE server will handle the process and send updates
        // The onCompilationUpdate callback will handle the UI updates
        console.log('✅ Process Configuration request sent via SSE singleton');

        // Don't reset button state here - let WebSocket updates handle it
        return; // Don't call API route, let WebSocket handle it
      } else {
        console.log('⚠️ SSE not connected, falling back to mock process');

        // Fallback to mock process if WebSocket is not connected
        const result = await configurationService.mockProcessConfigurationWithCompilePause(
          config,
          connectedApp.url,
          (step: ProcessingStep) => {
            setCurrentProcessingTab(step.name);
            setProcessingSteps(prev => {
              const updated = [...prev];
              const index = updated.findIndex(s => s.id === step.id);
              if (index >= 0) {
                updated[index] = step;
              } else {
                updated.push(step);
              }
              return updated;
            });

            // Update active tab based on current step
            if (step.id === 'validate') {
              setActiveTab('identity');
              if (step.status === 'completed') {
                setCompletedTabs(prev => new Set(prev).add('identity'));
              }
            } else if (step.id === 'api-keys') {
              setActiveTab('api-keys');
              if (step.status === 'completed') {
                setCompletedTabs(prev => new Set(prev).add('api-keys'));
              }
            } else if (step.id === 'analyze') {
              setActiveTab('personality');
              if (step.status === 'completed') {
                setCompletedTabs(prev => new Set(prev).add('personality'));
              }
            } else if (step.id === 'capabilities') {
              setActiveTab('capabilities');
              if (step.status === 'completed') {
                setCompletedTabs(prev => new Set(prev).add('capabilities'));
              }
            } else if (step.id === 'compile') {
              setActiveTab('compile');
              if (step.status === 'running') {
                setWaitingForCompilation(true);
              } else if (step.status === 'completed') {
                setCompletedTabs(prev => new Set(prev).add('compile'));
                setWaitingForCompilation(false);
              }
            }
          }
        );

        // Handle the result from fallback
        console.log('Fallback result:', result);

        // Process the fallback result
        if (result.success) {
          setConfigProcessComplete(true);
          toast({
            title: "Configuration Processing Complete",
            description: "All configuration steps have been processed successfully. You can now mint your agent.",
          });
        } else {
          // Check if the failure is compilation-related
          const isCompilationFailure = result.errors?.some(error =>
            error.toLowerCase().includes('compil') ||
            error.toLowerCase().includes('build')
          ) || result.warnings?.some(warning =>
            warning.toLowerCase().includes('compil')
          );

          // If compilation failed, navigate to compiler logs tab
          if (isCompilationFailure) {
            console.log('🔧 Compilation failure detected, navigating to compiler logs tab');
            setActiveTab('compile');

            toast({
              title: "Compilation Failed",
              description: "Please check the Compiler Logs tab for troubleshooting information.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Processing Failed",
              description: result.errors?.join(', ') || "Configuration processing failed.",
              variant: "destructive",
            });
          }
        }
      }

      // When using WebSocket, the process configuration is handled by the WebSocket server
      // Success/failure notifications will come through WebSocket updates
      console.log('✅ Process Configuration workflow initiated via WebSocket');
    } catch (error) {
      console.error('Configuration processing error:', error);

      // Check if the error is compilation-related
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isCompilationError = errorMessage.toLowerCase().includes('compil') ||
                                errorMessage.toLowerCase().includes('build');

      // If compilation error, navigate to compiler logs tab
      if (isCompilationError) {
        console.log('🔧 Compilation error detected, navigating to compiler logs tab');
        setActiveTab('compile');

        toast({
          title: "Compilation Error",
          description: "Please check the Compiler Logs tab for troubleshooting information.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Processing Error",
          description: "An unexpected error occurred during processing.",
          variant: "destructive",
        });
      }

      // Send error SSE update
      sendCompilationUpdate({
        step: 'error',
        progress: 0,
        message: `Processing error: ${errorMessage}`,
        status: 'error'
      });
    } finally {
      // Only reset button state if not using SSE (SSE will handle state updates)
      if (!sseConnected) {
        setIsProcessingConfig(false);
        setCurrentProcessingTab('');
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadedFile(file);

    try {
      // Try to read as JSON first (for exported configurations)
      const text = await file.text();
      let parsedConfig;

      try {
        parsedConfig = JSON.parse(text);

        // Check if it's an exported Agentify configuration
        if (parsedConfig.version && parsedConfig.agentFacts) {
          importConfiguration(parsedConfig);
          return;
        }
      } catch {
        // If JSON parsing fails, try the original parseConfigFile method
        parsedConfig = await parseConfigFile(file);
      }

      // Update the agent configuration with the uploaded data
      if (parsedConfig.name) setAgentName(parsedConfig.name);
      if (parsedConfig.personality) setPersonality(parsedConfig.personality);
      if (parsedConfig.instructions) setInstructions(parsedConfig.instructions);
      if (parsedConfig.features) setFeatures(parsedConfig.features);

      // Update Agent Facts if available
      if (parsedConfig.agentFacts) {
        setAgentFacts(parsedConfig.agentFacts);
      }

      toast({
        title: "Configuration Imported!",
        description: `Successfully imported configuration from ${file.name}`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setUploadError(errorMessage);
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Validation functions
  const validateAgentFacts = (facts: AgentFacts): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Validate ID (should be UUID format)
    if (!facts.id || !facts.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      errors.id = 'ID must be a valid UUID v4 format';
    }

    // Validate agent name
    if (!facts.agent_name || facts.agent_name.trim().length < 3) {
      errors.agent_name = 'Agent name must be at least 3 characters long';
    }

    // Validate modalities
    if (!facts.capabilities.modalities || facts.capabilities.modalities.length === 0) {
      errors.modalities = 'At least one modality is required';
    }

    // Validate skills
    if (!facts.capabilities.skills || facts.capabilities.skills.length === 0) {
      errors.skills = 'At least one skill is required';
    }

    // Validate static endpoints
    if (!facts.endpoints.static || facts.endpoints.static.length === 0) {
      errors.static_endpoints = 'At least one static endpoint is required';
    } else {
      // Validate URL format for static endpoints
      const invalidUrls = facts.endpoints.static.filter(url => {
        try {
          new URL(url);
          return false;
        } catch {
          return true;
        }
      });
      if (invalidUrls.length > 0) {
        errors.static_endpoints = `Invalid URLs: ${invalidUrls.join(', ')}`;
      }
    }

    // Validate adaptive resolver URL
    if (!facts.endpoints.adaptive_resolver.url) {
      errors.adaptive_resolver_url = 'Adaptive resolver URL is required';
    } else {
      try {
        new URL(facts.endpoints.adaptive_resolver.url);
      } catch {
        errors.adaptive_resolver_url = 'Invalid URL format';
      }
    }

    // Validate certification level
    const validLevels = ['basic', 'verified', 'premium', 'enterprise'];
    if (!validLevels.includes(facts.certification.level)) {
      errors.certification_level = `Level must be one of: ${validLevels.join(', ')}`;
    }

    // Validate issuer
    if (!facts.certification.issuer || facts.certification.issuer.trim().length < 2) {
      errors.certification_issuer = 'Issuer must be at least 2 characters long';
    }

    return errors;
  };

  const validateField = (fieldName: string) => {
    const errors = validateAgentFacts(agentFacts);
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: errors[fieldName] || ''
    }));
  };

  return (
    // Full width wrapper for header actions bar
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-12">
        <div className="text-center md:text-left w-full">
          <h2 className="text-4xl font-bold text-white mb-4">Configure Your AI Agent</h2>
          <p className="text-xl text-white/70">
            Customize how your AI agent will interact with users of {connectedApp.name}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setExportModalOpen(true)}
            variant="outline"
            className="border-white/20 text-white/70 hover:bg-white/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </Button>
          <Button
            onClick={() => setImportModalOpen(true)}
            variant="outline"
            className="border-white/20 text-white/70 hover:bg-white/10"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Config
          </Button>
          <Button
            onClick={() => {
              clearSavedProgress();
              window.location.reload();
            }}
            variant="outline"
            className="border-white/20 text-white/70 hover:bg-white/10"
          >
            Clear Progress
          </Button>
        </div>
      </div>
      {/* The rest of the config form remains below */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-white/5 border border-white/10">
              <TabsTrigger value="identity" className="data-[state=active]:bg-purple-500/20">
                {completedTabs.has('identity') ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400 flex-shrink-0" />
                ) : (
                  <Bot className="h-4 w-4 mr-2 flex-shrink-0" />
                )}
                Identity
              </TabsTrigger>
              <TabsTrigger
                value="api-keys"
                disabled={!agentRegistered}
                className={`data-[state=active]:bg-purple-500/20 ${!agentRegistered ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {completedTabs.has('api-keys') ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400 flex-shrink-0" />
                ) : (
                  <Key className="h-4 w-4 mr-2 flex-shrink-0" />
                )}
                API Keys
              </TabsTrigger>
              <TabsTrigger
                value="personality"
                disabled={!agentRegistered}
                className={`data-[state=active]:bg-purple-500/20 ${!agentRegistered ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {completedTabs.has('personality') ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400 flex-shrink-0" />
                ) : (
                  <Settings className="h-4 w-4 mr-2 flex-shrink-0" />
                )}
                Personality
              </TabsTrigger>
              <TabsTrigger
                value="capabilities"
                disabled={!agentRegistered}
                className={`data-[state=active]:bg-purple-500/20 ${!agentRegistered ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {completedTabs.has('capabilities') ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400 flex-shrink-0" />
                ) : (
                  <Brain className="h-4 w-4 mr-2 flex-shrink-0" />
                )}
                Capabilities
              </TabsTrigger>
              <TabsTrigger
                value="compile"
                disabled={!agentRegistered}
                className={`data-[state=active]:bg-purple-500/20 ${!agentRegistered ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {completedTabs.has('compile') ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400 flex-shrink-0" />
                ) : (
                  <Code className="h-4 w-4 mr-2 flex-shrink-0" />
                )}
                Compile
              </TabsTrigger>
              <TabsTrigger
                value="test"
                disabled={!compilationComplete}
                className={`data-[state=active]:bg-purple-500/20 ${!compilationComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {completedTabs.has('test') ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                ) : (
                  <TestTube className="h-4 w-4 mr-2" />
                )}
                Test
              </TabsTrigger>
            </TabsList>

            <TabsContent value="identity" className="space-y-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="text-white">Agent Identity</CardTitle>
                  <CardDescription className="text-white/70">
                    Define your agent's core identity and generate Agent Facts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-white font-medium mb-2 block">Agent Name</label>
                      <Input
                        value={agentFacts.agent_name}
                        onChange={(e) => {
                          setAgentName(e.target.value);
                          setAgentFacts(prev => ({ ...prev, agent_name: e.target.value }));
                          validateField('agent_name');
                        }}
                        className={`bg-white/10 border-white/20 text-white ${
                          validationErrors.agent_name ? 'border-red-400' : ''
                        }`}
                      />
                      {validationErrors.agent_name && (
                        <p className="text-red-400 text-sm mt-1">{validationErrors.agent_name}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-white font-medium mb-2 block">Agent ID</label>
                      <Input
                        value={agentFacts.id}
                        onChange={(e) => {
                          setAgentFacts(prev => ({ ...prev, id: e.target.value }));
                          validateField('id');
                        }}
                        className={`bg-white/10 border-white/20 text-white ${
                          validationErrors.id ? 'border-red-400' : ''
                        }`}
                        placeholder="UUID v4 identifier"
                      />
                      {validationErrors.id && (
                        <p className="text-red-400 text-sm mt-1">{validationErrors.id}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-white font-medium mb-2 block">Modalities</label>
                    <Input
                      value={agentFacts.capabilities.modalities.join(', ')}
                      onChange={(e) => setAgentFacts(prev => ({
                        ...prev,
                        capabilities: {
                          ...prev.capabilities,
                          modalities: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }
                      }))}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="text, structured_data, audio, video"
                    />
                  </div>

                  <div>
                    <label className="text-white font-medium mb-2 block">Skills</label>
                    <Input
                      value={agentFacts.capabilities.skills.join(', ')}
                      onChange={(e) => setAgentFacts(prev => ({
                        ...prev,
                        capabilities: {
                          ...prev.capabilities,
                          skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }
                      }))}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="analysis, synthesis, research, automation"
                    />
                  </div>

                  <div>
                    <label className="text-white font-medium mb-2 block">Static Endpoints</label>
                    <Input
                      value={agentFacts.endpoints.static.join(', ')}
                      onChange={(e) => {
                        setAgentFacts(prev => ({
                          ...prev,
                          endpoints: {
                            ...prev.endpoints,
                            static: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          }
                        }));
                        validateField('static_endpoints');
                      }}
                      className={`bg-white/10 border-white/20 text-white ${
                        validationErrors.static_endpoints ? 'border-red-400' : ''
                      }`}
                      placeholder="https://api.provider.com/v1/chat"
                    />
                    {validationErrors.static_endpoints && (
                      <p className="text-red-400 text-sm mt-1">{validationErrors.static_endpoints}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-white font-medium mb-2 block">Adaptive Resolver URL</label>
                      <Input
                        value={agentFacts.endpoints.adaptive_resolver.url}
                        onChange={(e) => setAgentFacts(prev => ({
                          ...prev,
                          endpoints: {
                            ...prev.endpoints,
                            adaptive_resolver: {
                              ...prev.endpoints.adaptive_resolver,
                              url: e.target.value
                            }
                          }
                        }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="https://resolver.provider.com/capabilities"
                      />
                    </div>
                    <div>
                      <label className="text-white font-medium mb-2 block">Resolver Policies</label>
                      <Input
                        value={agentFacts.endpoints.adaptive_resolver.policies.join(', ')}
                        onChange={(e) => setAgentFacts(prev => ({
                          ...prev,
                          endpoints: {
                            ...prev.endpoints,
                            adaptive_resolver: {
                              ...prev.endpoints.adaptive_resolver,
                              policies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                            }
                          }
                        }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="capability_negotiation, load_balancing"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-white font-medium mb-2 block">Certification Level</label>
                      <Input
                        value={agentFacts.certification.level}
                        onChange={(e) => setAgentFacts(prev => ({
                          ...prev,
                          certification: {
                            ...prev.certification,
                            level: e.target.value
                          }
                        }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="verified, basic, premium"
                      />
                    </div>
                    <div>
                      <label className="text-white font-medium mb-2 block">Issuer</label>
                      <Input
                        value={agentFacts.certification.issuer}
                        onChange={(e) => setAgentFacts(prev => ({
                          ...prev,
                          certification: {
                            ...prev.certification,
                            issuer: e.target.value
                          }
                        }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="NANDA, ACME, etc."
                      />
                    </div>
                    <div>
                      <label className="text-white font-medium mb-2 block">Attestations</label>
                      <Input
                        value={agentFacts.certification.attestations.join(', ')}
                        onChange={(e) => setAgentFacts(prev => ({
                          ...prev,
                          certification: {
                            ...prev.certification,
                            attestations: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          }
                        }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="privacy_compliant, security_audited"
                      />
                    </div>
                  </div>


                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api-keys" className="space-y-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Key className="h-5 w-5 mr-2 text-purple-400" />
                    API Keys Configuration
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Configure API keys for different LLM providers. These keys will be securely stored and used by your agent.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-white font-medium mb-2 block">OpenAI API Key</label>
                      <Input
                        type="password"
                        value={apiKeys.openai}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="sk-..."
                      />
                      <p className="text-white/50 text-xs mt-1">For GPT-3.5, GPT-4, and other OpenAI models</p>
                    </div>

                    <div>
                      <label className="text-white font-medium mb-2 block">Anthropic API Key</label>
                      <Input
                        type="password"
                        value={apiKeys.anthropic}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="sk-ant-..."
                      />
                      <p className="text-white/50 text-xs mt-1">For Claude models (Opus, Sonnet, Haiku)</p>
                    </div>

                    <div>
                      <label className="text-white font-medium mb-2 block">Google Gemini API Key</label>
                      <Input
                        type="password"
                        value={apiKeys.google}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, google: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="AIza..."
                      />
                      <p className="text-white/50 text-xs mt-1">For Gemini Pro and Flash models</p>
                    </div>

                    <div>
                      <label className="text-white font-medium mb-2 block">Cerebras API Key</label>
                      <Input
                        type="password"
                        value={apiKeys.cerebras}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, cerebras: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="csk-..."
                      />
                      <p className="text-white/50 text-xs mt-1">For Llama and other Cerebras models</p>
                    </div>

                    <div>
                      <label className="text-white font-medium mb-2 block">DeepSeek API Key</label>
                      <Input
                        type="password"
                        value={apiKeys.deepseek}
                        onChange={(e) => setApiKeys(prev => ({ ...prev, deepseek: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="sk-..."
                      />
                      <p className="text-white/50 text-xs mt-1">For DeepSeek models</p>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">i</span>
                      </div>
                      <div>
                        <h4 className="text-blue-400 font-medium mb-1">Security Notice</h4>
                        <p className="text-blue-300/80 text-sm">
                          API keys are stored securely and only used by your agent. They are not shared with other users or services.
                          You can update or remove these keys at any time.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="personality" className="space-y-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="text-white">Agent Personality</CardTitle>
                  <CardDescription className="text-white/70">
                    Configure your agent's personality traits and behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-white font-medium mb-4 block">Personality Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {personalities.map((p) => (
                        <Card
                          key={p.id}
                          className={`cursor-pointer transition-all ${
                            personality === p.id
                              ? 'bg-purple-500/20 border-purple-500/50'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                          onClick={() => setPersonality(p.id)}
                        >
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-white">{p.name}</h4>
                            <p className="text-white/70 text-sm">{p.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-white font-medium mb-4 block">
                      Creativity Level: {creativity[0].toFixed(1)}
                    </label>
                    <Slider
                      value={creativity}
                      onValueChange={setCreativity}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-white/50 text-sm mt-2">
                      <span>Conservative</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-white font-medium mb-2 block">Custom Instructions</label>
                    <Textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="bg-white/10 border-white/20 text-white min-h-24"
                      placeholder="Additional instructions for your agent..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="capabilities" className="space-y-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="text-white">Agent Features</CardTitle>
                  <CardDescription className="text-white/70">
                    Enable the capabilities your agent should have
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(features).map(([feature, enabled]) => (
                    <div key={feature} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium capitalize">{feature}</h4>
                        <p className="text-white/70 text-sm">
                          {feature === 'chat' && 'Real-time conversation capabilities'}
                          {feature === 'automation' && 'Automated task execution'}
                          {feature === 'analytics' && 'Usage tracking and insights'}
                          {feature === 'notifications' && 'Push notifications to users'}
                        </p>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={() => toggleFeature(feature as keyof typeof features)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Server className="h-5 w-5 mr-2 text-purple-400" />
                    MCP Server Connections
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Connect your agent to Model Context Protocol (MCP) servers for enhanced capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add New MCP Server */}
                  <div className="bg-white/10 rounded-lg p-4 space-y-4">
                    <h4 className="text-white font-medium">Add New MCP Server</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-white/80 text-sm mb-1 block">Server Name</label>
                        <Input
                          value={newMcpServer.name}
                          onChange={(e) => setNewMcpServer(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., File System Server"
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-white/80 text-sm mb-1 block">Server URL</label>
                        <Input
                          value={newMcpServer.url}
                          onChange={(e) => setNewMcpServer(prev => ({ ...prev, url: e.target.value }))}
                          placeholder="e.g., mcp://localhost:3000"
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-white/80 text-sm mb-1 block">Description (Optional)</label>
                      <Input
                        value={newMcpServer.description}
                        onChange={(e) => setNewMcpServer(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of server capabilities"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <Button
                      onClick={addMcpServer}
                      className="bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Server
                    </Button>
                  </div>

                  {/* Existing MCP Servers */}
                  {mcpServers.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-white font-medium">Connected Servers</h4>
                      {mcpServers.map((server) => (
                        <div key={server.id} className="bg-white/10 rounded-lg p-4 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <h5 className="text-white font-medium">{server.name}</h5>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    server.enabled
                                      ? 'border-green-400/50 text-green-400'
                                      : 'border-red-400/50 text-red-400'
                                  }`}
                                >
                                  {server.enabled ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-white/60 text-sm mt-1">{server.url}</p>
                            {server.description && (
                              <p className="text-white/50 text-sm mt-1">{server.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={server.enabled}
                              onCheckedChange={() => toggleMcpServer(server.id)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMcpServer(server.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {mcpServers.length === 0 && (
                    <div className="text-center py-8 text-white/50">
                      <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No MCP servers connected yet</p>
                      <p className="text-sm">Add your first server above to enhance your agent's capabilities</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>



            <TabsContent value="compile" className="space-y-6">
              <CompilerPanel
                agentConfig={{
                  name: agentName,
                  personality,
                  instructions,
                  features,
                  settings: {
                    mcpServers,
                    creativity: creativity[0]
                  }
                }}
                triggerCompile={triggerCompile}
                selectedBuildTarget={selectedBuildTarget}
                onCompileStart={() => {
                  // This will be called when CompilerPanel starts compilation
                  setIsCompiling(true);
                  setCompileStatus('compiling');
                }}
                onCompileComplete={(result) => {
                  console.log("🎯 AgentConfig received compilation result:", result);

                  // Reset main compile button state
                  setIsCompiling(false);
                  setCompileStatus(result.success ? 'success' : 'error');

                  // Store compilation data for deployment
                  setCompilationResult({
                    success: result.success,
                    downloadUrl: result.downloadUrl,
                    filename: result.filename,
                    compilationMethod: result.compilationMethod,
                    jobId: result.jobId
                  });

                  if (result.success) {
                    setCompilationComplete(true);

                    // Mark compile step as completed
                    setCompletedTabs(prev => new Set(prev).add('compile'));

                    // Update the compile step in processing steps
                    setProcessingSteps(prev => {
                      const updated = [...prev];
                      const compileIndex = updated.findIndex(s => s.id === 'compile');
                      if (compileIndex >= 0) {
                        updated[compileIndex] = {
                          ...updated[compileIndex],
                          status: 'completed',
                          progress: 100,
                          message: 'Compilation completed successfully',
                          duration: 3000
                        };
                      }
                      return updated;
                    });

                    // Complete the configuration process
                    setConfigProcessComplete(true);
                    setIsProcessingConfig(false);
                    setWaitingForCompilation(false);

                    toast({
                      title: "Configuration Complete!",
                      description: "Your agent has been compiled successfully. You can now mint your agent.",
                    });
                  } else {
                    // Handle compilation failure
                    toast({
                      title: "Compilation Failed",
                      description: result.message || "Compilation failed. Check the logs for details.",
                      variant: "destructive",
                    });
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="test" className="space-y-6">
              <TestRunner
                repoUrl={connectedApp.url}
                agentConfig={{
                  name: agentName,
                  personality,
                  instructions,
                  features
                }}
              />
            </TabsContent>


          </Tabs>

          {/* Compile Agent Section */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-white">Build Target:</label>
                <select
                  value={selectedBuildTarget}
                  onChange={(e) => setSelectedBuildTarget(e.target.value as 'wasm' | 'go')}
                  className="bg-slate-700 border border-slate-600 text-white rounded px-3 py-1 text-sm"
                >
                  <option value="wasm">WebAssembly (WASM)</option>
                  <option value="go">Go Plugin (Fallback)</option>
                </select>
              </div>
              <Button
                onClick={handleCompile}
                disabled={!agentRegistered || isCompiling}
                className={`${
                  agentRegistered && !isCompiling
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                size="lg"
              >
                {isCompiling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Compiling...
                  </>
                ) : (
                  <>
                    <Code className="mr-2 h-4 w-4" />
                    Compile Agent
                  </>
                )}
              </Button>
            </div>
            {compileStatus === 'success' && (
              <div className="space-y-2">
                <div className="text-green-400 text-sm">
                  ✅ Agent compiled successfully! Ready for deployment.
                </div>
                {compilationResult?.downloadUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-800 text-green-400 hover:bg-green-900/30"
                    onClick={() => window.open(compilationResult.downloadUrl, '_blank')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Plugin ({compilationResult.filename})
                  </Button>
                )}
              </div>
            )}
            {compileStatus === 'error' && (
              <div className="text-red-400 text-sm">
                ❌ Compilation failed. Check the Compiler Logs tab for details.
              </div>
            )}
          </div>

          {/* Register Agent and Process Configuration Buttons */}
          <div className="flex justify-start space-x-4 items-center">
            {/* Register Agent Button */}
            <Button
              onClick={handleRegisterAgent}
              disabled={agentRegistered}
              className={`${
                agentRegistered
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
              }`}
              size="lg"
            >
              <Bot className="h-5 w-5 mr-2" />
              {agentRegistered ? 'Agent Registered' : 'Register Agent'}
            </Button>

            {/* Process Configuration Button */}
            <Button
              onClick={processConfiguration}
              disabled={!agentRegistered || isProcessingConfig || configProcessComplete}
              className={`${
                agentRegistered && !isProcessingConfig && !configProcessComplete
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
              size="lg"
            >
              {isProcessingConfig ? (
                <>
                  <Zap className="h-5 w-5 mr-2 animate-spin" />
                  Processing {currentProcessingTab}...
                </>
              ) : configProcessComplete ? (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Configuration Complete
                </>
              ) : (
                <>
                  <Settings className="h-5 w-5 mr-2" />
                  Process Configuration
                </>
              )}
            </Button>


          </div>

          {/* Processing Status - Only shown during processing */}
          {(isProcessingConfig || waitingForCompilation) && processingSteps.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-white mb-6">Processing Status</h3>
              <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {processingSteps.map((step) => (
                      <div key={step.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            step.status === 'completed' ? 'bg-green-400' :
                            step.status === 'running' ? 'bg-blue-400 animate-pulse' :
                            step.status === 'failed' ? 'bg-red-400' :
                            'bg-gray-400'
                          }`} />
                          <span className="text-white font-medium">{step.name}</span>
                          {step.duration && (
                            <span className="text-white/50 text-sm">({step.duration}ms)</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {step.status === 'running' && (
                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                          )}
                          <span className={`text-sm ${
                            step.status === 'completed' ? 'text-green-400' :
                            step.status === 'running' ? 'text-blue-400' :
                            step.status === 'failed' ? 'text-red-400' :
                            'text-gray-400'
                          }`}>
                            {step.status === 'completed' ? 'Complete' :
                             step.status === 'running' ? 'Running' :
                             step.status === 'failed' ? 'Failed' :
                             'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {processingSteps.some(s => s.message) && (
                    <div className="mt-4 p-3 bg-white/10 rounded-lg">
                      {processingSteps.filter(s => s.message).map(step => (
                        <p key={step.id} className="text-white/80 text-sm">{step.message}</p>
                      ))}
                    </div>
                  )}
                  {waitingForCompilation && (
                    <div className="mt-4 p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="text-orange-400 font-medium">
                          Waiting for compilation. Please use the Compile button in the Compiler Logs tab.
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stats Cards - Only shown after configuration processing */}
          {configProcessComplete && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-white mb-6">Configuration Statistics</h3>
              <StatusDashboard
                repoUrl={connectedApp.url}
                agentConfig={{
                  name: agentName,
                  personality,
                  instructions,
                  features
                }}
              />
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-purple-400" />
                Agent Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{agentName}</p>
                    <Badge variant="outline" className="border-purple-400/50 text-purple-400 text-xs">
                      {personality}
                    </Badge>
                  </div>
                </div>
                <div className="bg-white/10 rounded p-3">
                  <p className="text-white/90 text-sm">
                    Hello! I'm {agentName}, your AI assistant for {connectedApp.name}.
                    How can I help you today?
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-white font-medium">Enabled Features:</h4>
                {Object.entries(features)
                  .filter(([_, enabled]) => enabled)
                  .map(([feature]) => (
                    <div key={feature} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-white/70 text-sm capitalize">{feature}</span>
                    </div>
                  ))}
              </div>

              {mcpServers.filter(server => server.enabled).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-white font-medium">Connected MCP Servers:</h4>
                  {mcpServers
                    .filter(server => server.enabled)
                    .map((server) => (
                      <div key={server.id} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-white/70 text-sm">{server.name}</span>
                      </div>
                    ))}
                </div>
              )}

              {/* Debug Terminal */}
              <div className="space-y-2">
                <h4 className="text-white font-medium">Debug Terminal:</h4>
                <div className="bg-black/50 border border-white/20 rounded p-2 font-mono text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">$</span>
                    <span className="text-white/90">
                      {agentMinted
                        ? `${agentName.toLowerCase().replace(/\s+/g, '-')}-plugin compiled successfully`
                        : `Waiting for agent to be minted...`}
                    </span>
                    {!agentMinted && <span className="animate-pulse text-white/50">|</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mint Agent Button - Now in preview panel and disabled until config processed */}
          <Button
            onClick={handleDeploy}
            disabled={!configProcessComplete || agentMinted}
            className={`w-full py-6 ${
              configProcessComplete && !agentMinted
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            size="lg"
          >
            <Zap className="h-5 w-5 mr-2" />
            {agentMinted ? 'Agent Minted' : 'Mint Agent'}
          </Button>
        </div>
      </div>

      {/* Import Config Modal */}
      <ImportConfigModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onFileUpload={handleFileUpload}
      />

      {/* Export Config Modal */}
      <ExportConfigModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        agentFacts={agentFacts}
        agentName={agentName}
        personality={personality}
        instructions={instructions}
        creativity={creativity[0]}
        features={features}
        mcpServers={mcpServers}
        connectedApp={connectedApp}
        configProcessComplete={configProcessComplete}
      />
    </div>
  );
};

export default AgentConfig;
