'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Code, 
  Package, 
  Cpu, 
  Shield, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Download,
  Settings,
  Terminal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define types for the agent configuration
export interface AgentConfig {
  name: string;
  personality: string;
  instructions?: string;
  features: Record<string, boolean>;
  settings?: {
    mcpServers?: Array<{
      url: string;
      name: string;
      enabled: boolean;
    }>;
    creativity?: number;
  };
}

// Define AgentPluginConfig for type safety when sending to API
export interface AgentPluginConfig {
  agent_id: string;
  agent_name: string;
  agentType: string;
  description: string;
  version: string;
  facts_url: string;
  ttl: number;
  signature: string;
  tools: Array<{
    name: string;
    description: string;
    implementation: string;
    parameters: Array<{
      name: string;
      type: string;
      description: string;
      required: boolean;
      defaultValue?: unknown;
    }>;
    returnType: string;
  }>;
  resources: Array<{
    name: string;
    type: 'text' | 'binary' | 'json';
    content: string | Buffer;
    isEmbedded: boolean;
  }>;
  prompts: Array<{
    name: string;
    content: string;
    variables: Array<string>;
  }>;
  pythonDependencies: Array<string>;
  useChromemGo: boolean;
  subAgentCapabilities: boolean;
  trustedExecutionEnvironment: {
    isolationLevel: string;
    resourceLimits: {
      memory: number;
      cpu: number;
      timeLimit: number;
    };
    networkAccess: boolean;
    fileSystemAccess: boolean;
  };
}

// Define the compiler result type
export interface CompilerResult {
  success: boolean;
  pluginPath?: string;
  downloadUrl?: string;
  filename?: string;
  message: string;
  logs?: string[];
  compilationMethod?: string;
  jobId?: string;
}

interface CompilerPanelProps {
  agentConfig: AgentConfig;
  onCompileComplete: (result: CompilerResult) => void;
  triggerCompile?: number;
  selectedBuildTarget?: 'wasm' | 'go';
  onCompileStart?: () => void;
}

const CompilerPanel = ({
  agentConfig,
  onCompileComplete,
  triggerCompile,
  selectedBuildTarget: externalBuildTarget,
  onCompileStart
}: CompilerPanelProps): React.ReactElement => {
  const [compileProgress, setCompileProgress] = useState(0);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileStatus, setCompileStatus] = useState<'idle' | 'compiling' | 'success' | 'error'>('idle');
  const [compileResult, setCompileResult] = useState<CompilerResult | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'windows' | 'linux' | 'mac'>('linux');
  const [advancedSettings, setAdvancedSettings] = useState({
    isolationLevel: 'process',
    memoryLimit: 512,
    cpuCores: 1,
    timeLimit: 60,
    networkAccess: true,
    fileSystemAccess: false,
    useChromemGo: true,
    subAgentCapabilities: false
  });
  const [compileLog, setCompileLog] = useState<{message: string, timestamp: string}[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const logContainerRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef<number>(0);
  const isCompilingRef = useRef<boolean>(false);
  const { toast } = useToast();

  const addLogEntry = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setCompileLog(prev => [...prev, { message, timestamp }]);
  }, []);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [compileLog]);

  // Watch for external trigger to start compilation
  useEffect(() => {
    if (triggerCompile &&
        triggerCompile > 0 &&
        triggerCompile !== lastTriggerRef.current &&
        !isCompiling &&
        !isCompilingRef.current) {

      // Update the refs to prevent re-triggering
      lastTriggerRef.current = triggerCompile;
      isCompilingRef.current = true;

      // Automatically navigate to logs tab and start compilation
      setActiveTab("logs");
      handleCompile();
    }
  }, [triggerCompile]);
  
  // The frontend can indicate it's ready, but actual dependency checks
  // and service initialization happen on the backend.
  useEffect(() => {
    addLogEntry("Compiler panel ready. Backend will handle compilation and dependency checks.");
    
    // Check if the backend server is available
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          addLogEntry("Backend compiler service is available and ready.");
        }
      })
      .catch(error => {
        addLogEntry("Warning: Backend compiler service may not be available. Please ensure the server is running.");
        console.error("Backend health check failed:", error);
      });
  }, [addLogEntry]);

  // Function to poll GitHub Actions compilation status
  const pollGitHubActionsCompletion = async (jobId: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        addLogEntry(`🔍 Checking compilation status... (${attempts + 1}/${maxAttempts})`);

        const statusResponse = await fetch(`/api/compile/status?jobId=${encodeURIComponent(jobId)}`);
        const statusResult = await statusResponse.json();

        if (!statusResponse.ok) {
          throw new Error(statusResult.message || 'Failed to check compilation status');
        }

        if (statusResult.status === 'completed') {
          // Compilation completed successfully
          addLogEntry("🎉 GitHub Actions compilation completed successfully!");

          // Show download info
          addLogEntry("📦 Compilation package contains:");
          addLogEntry("  • 🔧 WASM plugin file");
          addLogEntry("  • 🐍 Python service component");
          addLogEntry("  • ⚙️ Configuration files");
          addLogEntry("📥 Download the complete package as a zip file");

          if (statusResult.downloadUrl) {
            addLogEntry(`Package ready for download`);
          }

          setCompileProgress(100);
          setCompileStatus('success');
          setCompileResult({
            success: true,
            message: 'GitHub Actions compilation completed successfully',
            compilationMethod: 'github-actions',
            downloadUrl: statusResult.downloadUrl,
            filename: `agent-plugin-${jobId}.zip`,
            logs: statusResult.logs || []
          });

          // Notify parent component
          onCompileComplete({
            success: true,
            message: 'GitHub Actions compilation completed successfully',
            compilationMethod: 'github-actions',
            downloadUrl: statusResult.downloadUrl,
            filename: `agent-plugin-${jobId}.zip`,
            jobId: jobId
          });

          // Show success toast
          toast({
            title: "Compilation Successful",
            description: "GitHub Actions compilation completed successfully",
            variant: "default",
          });

          // Set isCompiling to false since compilation is complete
          setIsCompiling(false);
          return; // Exit polling loop
        } else if (statusResult.status === 'failed') {
          // Compilation failed
          throw new Error(statusResult.error || 'GitHub Actions compilation failed');
        } else {
          // Still in progress, continue polling
          addLogEntry(`Status: ${statusResult.status || 'in_progress'}`);
          setCompileProgress(Math.min(80 + (attempts * 2), 95)); // Gradually increase progress
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;

      } catch (error) {
        console.error('Polling error:', error);
        addLogEntry(`Polling error: ${error instanceof Error ? error.message : String(error)}`);

        // If it's a network error, continue polling (might be temporary)
        if (attempts < maxAttempts - 1) {
          addLogEntry("Retrying in 5 seconds...");
          await new Promise(resolve => setTimeout(resolve, 5000));
          attempts++;
          continue;
        } else {
          // Max attempts reached, treat as failure
          setCompileStatus('error');
          setCompileResult({
            success: false,
            message: `GitHub Actions compilation polling failed: ${error instanceof Error ? error.message : String(error)}`
          });

          onCompileComplete({
            success: false,
            message: `GitHub Actions compilation polling failed: ${error instanceof Error ? error.message : String(error)}`
          });

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
    addLogEntry("Polling timeout reached. Compilation may still be in progress.");
    addLogEntry("Check the GitHub Actions tab for the latest status.");

    setCompileStatus('error');
    setCompileResult({
      success: false,
      message: 'GitHub Actions compilation monitoring timed out. Check GitHub Actions tab for status.'
    });

    onCompileComplete({
      success: false,
      message: 'GitHub Actions compilation monitoring timed out. Check GitHub Actions tab for status.'
    });

    toast({
      title: "Monitoring Timeout",
      description: "Compilation monitoring timed out. Check GitHub Actions tab for status.",
      variant: "destructive",
    });

    // Set isCompiling to false since monitoring timed out
    setIsCompiling(false);
  };

  const handleCompile = useCallback(async () => {
    // Prevent multiple simultaneous compilations
    if (isCompilingRef.current) {
      return;
    }

    isCompilingRef.current = true;
    setIsCompiling(true);
    setCompileStatus('compiling');
    setCompileProgress(0);
    setCompileLog([]);

    // Notify parent component that compilation has started
    if (onCompileStart) {
      onCompileStart();
    }

    // Automatically navigate to compiler logs tab
    setActiveTab("logs");

    try {
      // Use external build target if provided, otherwise use selected platform
      const buildTarget = externalBuildTarget || (selectedPlatform === 'linux' ? 'wasm' : 'go');

      // Add initial log entries
      addLogEntry("🚀 Starting compilation process...");
      addLogEntry(`📋 Build target: ${buildTarget}`);
      addLogEntry(`📋 Target platform: ${selectedPlatform}`);
      addLogEntry(`🤖 Agent name: ${agentConfig.name}`);
      addLogEntry("📂 Switched to Compiler Logs tab automatically");
      
      // Create a UI config object that matches the expected format for conversion
      const uiConfigForConversion = {
        name: agentConfig.name,
        personality: agentConfig.personality,
        instructions: agentConfig.instructions || `You are ${agentConfig.name}, a helpful AI assistant.`,
        features: agentConfig.features,
        settings: {
          mcpServers: agentConfig.settings?.mcpServers || [],
          creativity: agentConfig.settings?.creativity || 0.7
        }
      };
      
      addLogEntry("Converting UI configuration to compiler format...");
      setCompileProgress(10);
      
      // Prepare the payload for the API
      const payload = {
        agentConfig: uiConfigForConversion,
        buildTarget: buildTarget,
        advancedSettings: {
          isolationLevel: advancedSettings.isolationLevel,
          memoryLimit: advancedSettings.memoryLimit,
          cpuCores: advancedSettings.cpuCores,
          timeLimit: advancedSettings.timeLimit,
          networkAccess: advancedSettings.networkAccess,
          fileSystemAccess: advancedSettings.fileSystemAccess,
          useChromemGo: advancedSettings.useChromemGo,
          subAgentCapabilities: advancedSettings.subAgentCapabilities
        },
        selectedPlatform
      };
      
      // Handle platform-specific settings
      addLogEntry(`Build target: ${buildTarget}, Platform: ${selectedPlatform}`);
      addLogEntry("Sending compilation request to backend server...");
      setCompileProgress(20);

      try {
        const response = await fetch('/api/compile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        // Process the response
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to compile agent');
        }
        
        // Check if this is a GitHub Actions compilation that needs polling
        if (result.compilationMethod === 'github-actions' && result.status === 'in_progress' && result.jobId) {
          addLogEntry("🔄 GitHub Actions compilation started. Polling for completion...");
          addLogEntry(`🆔 Job ID: ${result.jobId}`);
          addLogEntry(`🔗 Monitor progress: ${result.githubActionsUrl}`);

          // Set intermediate state - compilation is still in progress via GitHub Actions
          setCompileProgress(85); // Show we're in GitHub Actions phase
          setCompileStatus('compiling'); // Keep compiling state

          // Set a temporary result to show GitHub Actions is in progress
          setCompileResult({
            success: false, // Not complete yet
            message: 'GitHub Actions compilation in progress...',
            compilationMethod: 'github-actions'
          });

          // Don't call onCompileComplete yet - we're still compiling via GitHub Actions
          // Don't set isCompiling to false yet - we're still compiling via GitHub Actions
          // Start polling for completion (this will update the final state and call onCompileComplete when done)
          await pollGitHubActionsCompletion(result.jobId);
          return; // Exit early to avoid the finally block setting isCompiling to false
        } else {
          // Local compilation completed immediately or GitHub Actions returned final result
          setCompileResult(result);
          setCompileStatus(result.success ? 'success' : 'error');
          setCompileProgress(100);

          // Add logs from the server if available
          if (result.logs && Array.isArray(result.logs)) {
            result.logs.forEach((log: string) => {
              addLogEntry(log);
            });
          } else {
            // Add final log entries if no server logs
            if (result.success) {
              addLogEntry(`Plugin created at: ${result.pluginPath}`);
              addLogEntry("Cleaning up temporary files...");
              addLogEntry("Compilation process completed successfully!");
            } else {
              addLogEntry(`Error: ${result.message}`);
            }
          }

          // Add download link if plugin was created
          if (result.success && result.downloadUrl) {
            addLogEntry(`Plugin ready for download: ${result.filename}`);
            addLogEntry(`Download URL: ${result.downloadUrl}`);
          }

          // Notify parent component
          onCompileComplete(result);

          // Show toast notification
          toast({
            title: result.success ? "Compilation Successful" : "Compilation Failed",
            description: result.message,
            variant: result.success ? "default" : "destructive",
          });
        }
      } catch (error) {
        console.error("Compilation error:", error);
        setCompileStatus('error');
        setCompileResult({
          success: false,
          message: `Compilation failed: ${error instanceof Error ? error.message : String(error)}`
        });
        
        // Add error log entry
        addLogEntry(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
        
        // Notify parent component
        onCompileComplete({
          success: false,
          message: `Compilation failed: ${error instanceof Error ? error.message : String(error)}`
        });
        
        // Show toast notification
        toast({
          title: "Compilation Failed",
          description: `An error occurred during compilation: ${error instanceof Error ? error.message : String(error)}`,
          variant: "destructive",
        });
      }
    } finally {
      setIsCompiling(false);
      isCompilingRef.current = false;
    }
  }, [agentConfig, externalBuildTarget, selectedPlatform, advancedSettings, onCompileStart, onCompileComplete, addLogEntry, toast]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-slate-700">
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
          <TabsTrigger value="logs">Compiler Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Package className="w-5 h-5 text-purple-400" />
                <span>Compiler Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Target Platform</Label>
                <Select 
                  value={selectedPlatform} 
                  onValueChange={(value) => setSelectedPlatform(value as 'windows' | 'linux' | 'mac')}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="windows">Windows</SelectItem>
                    <SelectItem value="linux">Linux</SelectItem>
                    <SelectItem value="mac">macOS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              

              
              {compileStatus !== 'idle' && (
                <div className="space-y-2 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">Compilation Progress</span>
                    <Badge 
                      variant={
                        compileStatus === 'compiling' ? 'default' : 
                        compileStatus === 'success' ? 'default' : 'destructive'
                      }
                      className={
                        compileStatus === 'compiling' ? 'bg-blue-600' : 
                        compileStatus === 'success' ? 'bg-green-600' : 'bg-red-600'
                      }
                    >
                      {compileStatus === 'compiling' ? 'Compiling' : 
                       compileStatus === 'success' ? 'Success' : 'Error'}
                    </Badge>
                  </div>
                  <Progress value={compileProgress} className="h-2" />
                  
                  {compileResult && (
                    <div className={`mt-4 p-3 rounded-md ${compileResult.success ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}`}>
                      <div className="flex items-start">
                        {compileResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                        )}
                        <div>
                          <h4 className={`font-medium ${compileResult.success ? 'text-green-400' : 'text-red-400'}`}>
                            {compileResult.success ? 'Compilation Successful' : 'Compilation Failed'}
                          </h4>
                          <p className="text-sm text-slate-300 mt-1">{compileResult.message}</p>
                          
                          {compileResult.success && compileResult.downloadUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 border-green-800 text-green-400 hover:bg-green-900/30"
                              onClick={() => window.open(compileResult.downloadUrl, '_blank')}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download Plugin ({compileResult.filename})
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Settings className="w-5 h-5 text-purple-400" />
                <span>Advanced Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-purple-400" />
                  Trusted Execution Environment
                </h3>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Isolation Level</Label>
                    <Select 
                      value={advancedSettings.isolationLevel} 
                      onValueChange={(value) => setAdvancedSettings({...advancedSettings, isolationLevel: value})}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select isolation level" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="process">Process</SelectItem>
                        <SelectItem value="container">Container</SelectItem>
                        <SelectItem value="vm">Virtual Machine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Memory Limit (MB)</Label>
                      <Input 
                        type="number" 
                        value={advancedSettings.memoryLimit}
                        onChange={(e) => setAdvancedSettings({...advancedSettings, memoryLimit: parseInt(e.target.value)})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">CPU Cores</Label>
                      <Input 
                        type="number" 
                        value={advancedSettings.cpuCores}
                        onChange={(e) => setAdvancedSettings({...advancedSettings, cpuCores: parseInt(e.target.value)})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Time Limit (seconds)</Label>
                      <Input 
                        type="number" 
                        value={advancedSettings.timeLimit}
                        onChange={(e) => setAdvancedSettings({...advancedSettings, timeLimit: parseInt(e.target.value)})}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-3 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="networkAccess" 
                        checked={advancedSettings.networkAccess}
                        onCheckedChange={(checked) => setAdvancedSettings({...advancedSettings, networkAccess: checked === true})}
                      />
                      <Label htmlFor="networkAccess" className="text-slate-300">Allow Network Access</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="fileSystemAccess" 
                        checked={advancedSettings.fileSystemAccess}
                        onCheckedChange={(checked) => setAdvancedSettings({...advancedSettings, fileSystemAccess: checked === true})}
                      />
                      <Label htmlFor="fileSystemAccess" className="text-slate-300">Allow File System Access</Label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-2">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <Cpu className="w-4 h-4 mr-2 text-purple-400" />
                  Agent Capabilities
                </h3>
                
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="useChromemGo" 
                      checked={advancedSettings.useChromemGo}
                      onCheckedChange={(checked) => setAdvancedSettings({...advancedSettings, useChromemGo: checked === true})}
                    />
                    <Label htmlFor="useChromemGo" className="text-slate-300">Use Chromem-Go for Persistence</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="subAgentCapabilities" 
                      checked={advancedSettings.subAgentCapabilities}
                      onCheckedChange={(checked) => setAdvancedSettings({...advancedSettings, subAgentCapabilities: checked === true})}
                    />
                    <Label htmlFor="subAgentCapabilities" className="text-slate-300">Enable Sub-Agent Capabilities</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-purple-400" />
                <span>Compiler Logs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                ref={logContainerRef}
                className="bg-slate-900 border border-slate-700 rounded-md p-4 h-[400px] overflow-y-auto font-mono text-sm text-slate-300"
              >
                {compileLog.length > 0 ? (
                  compileLog.map((log, index) => (
                    <div key={index} className="py-1">
                      <span className="text-slate-500">[{log.timestamp}]</span> {log.message}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic">No logs available. Start compilation to see logs.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompilerPanel;