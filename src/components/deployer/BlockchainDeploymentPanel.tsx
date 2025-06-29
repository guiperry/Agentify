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
  Shield,
  Wallet,
  CreditCard,
  Coins
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
  const [isPurchasingTokens, setIsPurchasingTokens] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<
    "idle" | "purchasing" | "preparing" | "deploying" | "confirming" | "success" | "failed"
  >("idle");
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [networkConfig, setNetworkConfig] = useState({
    tokenAmount: 50,
    networkTier: "standard" as "basic" | "standard" | "premium",
    walletAddress: "",
    agentWalletAddress: "0x" + Math.random().toString(16).substring(2, 12) + Math.random().toString(16).substring(2, 12)
  });
  
  const [tokenBalance, setTokenBalance] = useState(0);
  const [hasPurchasedTokens, setHasPurchasedTokens] = useState(false);

  const networkTiers = [
    { value: "basic", label: "Basic (1 NRN/hour, Limited resources)", fee: 10 },
    { value: "standard", label: "Standard (5 NRN/hour, Moderate resources)", fee: 50 },
    { value: "premium", label: "Premium (15 NRN/hour, High resources)", fee: 150 }
  ];

  const getTierFee = (tier: string) => {
    const selectedTier = networkTiers.find(t => t.value === tier);
    return selectedTier ? selectedTier.fee : 50;
  };

  const handlePurchaseTokens = async () => {
    if (networkConfig.tokenAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid token amount to purchase.",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasingTokens(true);
    setDeploymentStatus("purchasing");
    setDeploymentProgress(10);

    try {
      // Simulate token purchase API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTokenBalance(networkConfig.tokenAmount);
      setHasPurchasedTokens(true);
      setDeploymentProgress(30);
      
      toast({
        title: "Tokens Purchased",
        description: `Successfully purchased ${networkConfig.tokenAmount} NRN tokens.`,
      });

      // Simulate transaction confirmation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDeploymentStatus("idle");
      setDeploymentProgress(0);
      
    } catch (error) {
      console.error('Token purchase error:', error);
      toast({
        title: "Purchase Failed",
        description: "Failed to purchase NRN tokens. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasingTokens(false);
    }
  };

  const handleBlockchainDeploy = async () => {
    const requiredFee = getTierFee(networkConfig.networkTier);
    
    if (!compiledPluginUrl && !compilationJobId) {
      toast({
        title: "Plugin Required",
        description: "Please compile your agent first before deploying to the network.",
        variant: "destructive",
      });
      return;
    }

    if (tokenBalance < requiredFee) {
      toast({
        title: "Insufficient Tokens",
        description: `You need at least ${requiredFee} NRN tokens for this deployment tier.`,
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus("preparing");
    setDeploymentProgress(0);

    try {
      const deploymentId = `network-deploy-${Date.now()}`;
      
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
          deploymentType: 'decentralized-network',
          pluginUrl: compiledPluginUrl,
          jobId: compilationJobId,
          networkConfig: {
            tier: networkConfig.networkTier,
            fee: requiredFee,
            walletAddress: networkConfig.agentWalletAddress
          }
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Network deployment failed');
      }

      // Deduct tokens from balance
      setTokenBalance(prev => prev - requiredFee);

      toast({
        title: "Deployment Started",
        description: `Network deployment initiated. Your agent will be live shortly.`,
      });

      // Simulate blockchain deployment process
      const steps = [
        { status: "preparing" as const, progress: 15, message: "Preparing agent package..." },
        { status: "preparing" as const, progress: 30, message: "Submitting to network..." },
        { status: "deploying" as const, progress: 45, message: "Deploying to decentralized nodes..." },
        { status: "deploying" as const, progress: 60, message: "Allocating network resources..." },
        { status: "confirming" as const, progress: 75, message: "Waiting for network confirmation..." },
        { status: "confirming" as const, progress: 90, message: "Finalizing deployment..." },
        { status: "success" as const, progress: 100, message: "Network deployment successful!" }
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
        }, (index + 1) * 2000); // 2 second intervals for network deployment
      });

    } catch (error) {
      console.error('Network deployment error:', error);
      setDeploymentStatus("failed");
      setIsDeploying(false);
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Network deployment failed",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    switch (deploymentStatus) {
      case "purchasing":
        return <Coins className="w-12 h-12 mx-auto mb-4 animate-pulse text-yellow-400" />;
      case "preparing":
      case "deploying":
      case "confirming":
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
      case "purchasing":
        return "Purchasing NRN tokens...";
      case "preparing":
        return "Preparing agent for network deployment...";
      case "deploying":
        return "Deploying to decentralized network...";
      case "confirming":
        return "Waiting for network confirmation...";
      case "success":
        return "Network deployment successful!";
      case "failed":
        return "Deployment failed. Check logs for details.";
      default:
        return hasPurchasedTokens 
          ? "Ready to deploy to decentralized network" 
          : "Purchase NRN tokens to deploy";
    }
  };

  return (
    <div className="space-y-6">
      {/* Token Purchase Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Coins className="w-4 h-4 text-yellow-400" />
          <h4 className="text-white font-medium">Network Tokens (NRN)</h4>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-white">
              <div className="text-sm text-slate-400">Current Balance</div>
              <div className="text-xl font-bold">{tokenBalance} <span className="text-yellow-400">NRN</span></div>
            </div>
            <Badge className="bg-yellow-500/20 text-yellow-400 px-3 py-1">
              <Wallet className="w-3 h-3 mr-1" />
              {networkConfig.agentWalletAddress.substring(0, 6)}...{networkConfig.agentWalletAddress.substring(networkConfig.agentWalletAddress.length - 4)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="token-amount" className="text-white/80">Purchase Amount</Label>
              <div className="flex space-x-2">
                <Input
                  id="token-amount"
                  type="number"
                  value={networkConfig.tokenAmount}
                  onChange={(e) => setNetworkConfig(prev => ({ ...prev, tokenAmount: parseInt(e.target.value) || 0 }))}
                  placeholder="50"
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Button
                  onClick={handlePurchaseTokens}
                  disabled={isPurchasingTokens || networkConfig.tokenAmount <= 0}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {isPurchasingTokens ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Purchasing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Buy Tokens
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Configuration */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4 text-orange-400" />
          <h4 className="text-white font-medium">Network Configuration</h4>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="network-tier" className="text-white/80">Network Tier</Label>
            <Select 
              value={networkConfig.networkTier} 
              onValueChange={(value: "basic" | "standard" | "premium") => setNetworkConfig(prev => ({ ...prev, networkTier: value }))}
            >
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Select network tier" />
              </SelectTrigger>
              <SelectContent>
                {networkTiers.map((tier) => (
                  <SelectItem key={tier.value} value={tier.value}>
                    {tier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-2 text-sm text-orange-300">
              Network fee: {getTierFee(networkConfig.networkTier)} NRN
            </div>
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
      {(isDeploying || isPurchasingTokens) && (
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
        disabled={isDeploying || tokenBalance < getTierFee(networkConfig.networkTier) || !hasPurchasedTokens}
        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
      >
        {isDeploying ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Minting Agent...
          </>
        ) : (
          <>
            <Activity className="w-4 h-4 mr-2" />
            Mint Agent
          </>
        )}
      </Button>

      {/* Info Box */}
      <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
          <div className="text-orange-200 text-sm">
            <p className="font-medium mb-1">Decentralized Network Deployment</p>
            <p>This will deploy your agent to a decentralized network using NRN tokens. Your agent will run on distributed nodes for maximum reliability and uptime. Network fees are charged hourly based on your selected tier.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainDeploymentPanel;
