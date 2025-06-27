'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Activity, 
  Server, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink,
  AlertTriangle,
  Zap,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlockchainDeploymentPanelProps {
  agentConfig: {
    name: string;
    personality: string;
    instructions: string;
    features: Record<string, boolean>;
  };
  onDeployComplete: () => void;
  compiledPluginUrl?: string;
  compilationJobId?: string;
}

const BlockchainDeploymentPanel = ({ 
  agentConfig, 
  onDeployComplete, 
  compiledPluginUrl, 
  compilationJobId 
}: BlockchainDeploymentPanelProps) => {
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<
    "idle" | "preparing" | "provisioning" | "deploying" | "configuring" | "success" | "failed"
  >("idle");
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [awsConfig, setAwsConfig] = useState({
    region: "us-east-1",
    instanceType: "t3.medium",
    keyPairName: "",
    environment: "production" as "staging" | "production"
  });

  const awsRegions = [
    { value: "us-east-1", label: "US East (N. Virginia)" },
    { value: "us-west-2", label: "US West (Oregon)" },
    { value: "eu-west-1", label: "Europe (Ireland)" },
    { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" }
  ];

  const instanceTypes = [
    { value: "t3.small", label: "t3.small (2 vCPU, 2 GB RAM)" },
    { value: "t3.medium", label: "t3.medium (2 vCPU, 4 GB RAM)" },
    { value: "t3.large", label: "t3.large (2 vCPU, 8 GB RAM)" },
    { value: "m5.large", label: "m5.large (2 vCPU, 8 GB RAM)" },
    { value: "m5.xlarge", label: "m5.xlarge (4 vCPU, 16 GB RAM)" }
  ];

  const handleBlockchainDeploy = async () => {
    if (!awsConfig.keyPairName) {
      toast({
        title: "Configuration Required",
        description: "Please provide an AWS Key Pair name for deployment.",
        variant: "destructive",
      });
      return;
    }

    if (!compiledPluginUrl && !compilationJobId) {
      toast({
        title: "Plugin Required",
        description: "Please compile your agent first before deploying to blockchain.",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus("preparing");
    setDeploymentProgress(0);

    try {
      const deploymentId = `blockchain-deploy-${Date.now()}`;
      
      // Call deployment API
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deploymentId,
          agentName: agentConfig.name,
          version: '1.0.0',
          environment: awsConfig.environment,
          deploymentType: 'blockchain-aws',
          pluginUrl: compiledPluginUrl,
          jobId: compilationJobId,
          awsConfig: {
            region: awsConfig.region,
            instanceType: awsConfig.instanceType,
            keyPairName: awsConfig.keyPairName
          }
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Blockchain deployment failed');
      }

      toast({
        title: "Deployment Started",
        description: `Blockchain deployment initiated. Estimated time: ${result.estimatedTime}`,
      });

      // Simulate blockchain deployment process (longer than regular deployment)
      const steps = [
        { status: "preparing" as const, progress: 10, message: "Downloading plugin package..." },
        { status: "provisioning" as const, progress: 25, message: "Provisioning AWS infrastructure..." },
        { status: "provisioning" as const, progress: 40, message: "Setting up blockchain nodes..." },
        { status: "deploying" as const, progress: 60, message: "Running Ansible playbook..." },
        { status: "deploying" as const, progress: 75, message: "Deploying blockchain application..." },
        { status: "configuring" as const, progress: 90, message: "Configuring agent plugin..." },
        { status: "success" as const, progress: 100, message: "Blockchain deployment successful!" }
      ];

      steps.forEach((step, index) => {
        setTimeout(() => {
          setDeploymentStatus(step.status);
          setDeploymentProgress(step.progress);
          if (index === steps.length - 1) {
            setIsDeploying(false);
            setTimeout(() => {
              onDeployComplete();
            }, 1000);
          }
        }, (index + 1) * 4000); // 4 second intervals for blockchain deployment
      });

    } catch (error) {
      console.error('Blockchain deployment error:', error);
      setDeploymentStatus("failed");
      setIsDeploying(false);
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Blockchain deployment failed",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    switch (deploymentStatus) {
      case "preparing":
      case "provisioning":
      case "deploying":
      case "configuring":
        return <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-orange-400" />;
      case "success":
        return <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />;
      case "failed":
        return <XCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />;
      default:
        return <Activity className="w-12 h-12 mx-auto mb-4 text-orange-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (deploymentStatus) {
      case "preparing":
        return "Preparing deployment package...";
      case "provisioning":
        return "Provisioning AWS infrastructure...";
      case "deploying":
        return "Deploying blockchain application...";
      case "configuring":
        return "Configuring agent plugin...";
      case "success":
        return "Blockchain deployment successful!";
      case "failed":
        return "Deployment failed. Check logs for details.";
      default:
        return "Ready to deploy to blockchain";
    }
  };

  return (
    <div className="space-y-6">
      {/* AWS Configuration */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4 text-orange-400" />
          <h4 className="text-white font-medium">AWS Configuration</h4>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="aws-region" className="text-white/80">AWS Region</Label>
            <Select value={awsConfig.region} onValueChange={(value) => setAwsConfig(prev => ({ ...prev, region: value }))}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Select AWS region" />
              </SelectTrigger>
              <SelectContent>
                {awsRegions.map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="instance-type" className="text-white/80">Instance Type</Label>
            <Select value={awsConfig.instanceType} onValueChange={(value) => setAwsConfig(prev => ({ ...prev, instanceType: value }))}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Select instance type" />
              </SelectTrigger>
              <SelectContent>
                {instanceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="key-pair" className="text-white/80">AWS Key Pair Name *</Label>
            <Input
              id="key-pair"
              value={awsConfig.keyPairName}
              onChange={(e) => setAwsConfig(prev => ({ ...prev, keyPairName: e.target.value }))}
              placeholder="my-key-pair"
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="environment" className="text-white/80">Environment</Label>
            <Select value={awsConfig.environment} onValueChange={(value: "staging" | "production") => setAwsConfig(prev => ({ ...prev, environment: value }))}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Deployment Status */}
      <div className="text-center py-6">
        {getStatusIcon()}
        <div className="text-orange-400 font-medium">
          {getStatusMessage()}
        </div>
      </div>

      {/* Progress Bar */}
      {isDeploying && (
        <div className="space-y-2">
          <Progress value={deploymentProgress} className="w-full" />
          <div className="text-sm text-slate-400 text-center">
            {deploymentProgress}% complete
          </div>
        </div>
      )}

      {/* Deploy Button */}
      <Button
        onClick={handleBlockchainDeploy}
        disabled={isDeploying || !awsConfig.keyPairName}
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
      >
        {isDeploying ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Deploying to Blockchain...
          </>
        ) : (
          <>
            <Activity className="w-4 h-4 mr-2" />
            Deploy to Blockchain AWS
          </>
        )}
      </Button>

      {/* Info Box */}
      <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
          <div className="text-orange-200 text-sm">
            <p className="font-medium mb-1">Blockchain Deployment</p>
            <p>This will deploy your agent to a custom blockchain application on AWS using Ansible automation. The process typically takes 10-15 minutes.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainDeploymentPanel;
