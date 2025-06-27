'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Cloud, 
  Rocket, 
  Server, 
  Globe, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Settings,
  Monitor,
  Zap
} from "lucide-react";

interface DeploymentPanelProps {
  repoUrl: string;
  agentConfig: {
    name: string;
    personality: string;
    instructions: string;
    features: Record<string, boolean>;
    // Other relevant config properties
  };
  onDeployComplete: () => void;
  compiledPluginUrl?: string;
  compilationJobId?: string;
}

const DeploymentPanel = ({ repoUrl, agentConfig, onDeployComplete, compiledPluginUrl, compilationJobId }: DeploymentPanelProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<
    "idle" | "building" | "deploying" | "success" | "failed"
  >("idle");
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [awsConfig, setAwsConfig] = useState({
    region: "us-east-1",
    instanceType: "t3.medium",
    keyPairName: ""
  });

  const deploymentPlatforms = [
    { id: "blockchain-aws", name: "Blockchain AWS", icon: "🔗", description: "Deploy to custom blockchain application on AWS", type: "blockchain" },
    { id: "vercel", name: "Vercel", icon: "⚡", description: "Fast, scalable deployment", type: "cloud" },
    { id: "netlify", name: "Netlify", icon: "🌐", description: "JAMstack deployment platform", type: "cloud" },
    { id: "aws", name: "AWS", icon: "☁️", description: "Amazon Web Services", type: "cloud" },
    { id: "gcp", name: "Google Cloud", icon: "🔥", description: "Google Cloud Platform", type: "cloud" },
    { id: "azure", name: "Azure", icon: "🔷", description: "Microsoft Azure", type: "cloud" },
    { id: "digitalocean", name: "DigitalOcean", icon: "🌊", description: "Simple cloud hosting", type: "cloud" }
  ];

  const handleDeploy = async () => {
    if (!selectedPlatform) return;

    setIsDeploying(true);
    setDeploymentStatus("building");
    setDeploymentProgress(0);

    try {
      const deploymentId = `deploy-${Date.now()}`;
      const isBlockchainDeployment = selectedPlatform === "blockchain-aws";

      // Validate blockchain deployment requirements
      if (isBlockchainDeployment) {
        if (!compiledPluginUrl && !compilationJobId) {
          throw new Error("No compiled plugin available. Please compile your agent first.");
        }
        if (!awsConfig.keyPairName) {
          throw new Error("AWS Key Pair name is required for blockchain deployment.");
        }
      }

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
          environment: 'production',
          deploymentType: isBlockchainDeployment ? 'blockchain-aws' : 'cloud',
          pluginUrl: compiledPluginUrl,
          jobId: compilationJobId,
          awsConfig: isBlockchainDeployment ? awsConfig : undefined
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Deployment failed');
      }

      // Simulate deployment process with different timings for blockchain vs cloud
      const steps = isBlockchainDeployment ? [
        { status: "building" as const, progress: 10, message: "Downloading plugin package..." },
        { status: "building" as const, progress: 20, message: "Preparing AWS infrastructure..." },
        { status: "deploying" as const, progress: 40, message: "Running Ansible playbook..." },
        { status: "deploying" as const, progress: 60, message: "Deploying blockchain application..." },
        { status: "deploying" as const, progress: 80, message: "Configuring agent plugin..." },
        { status: "success" as const, progress: 100, message: "Blockchain deployment successful!" }
      ] : [
        { status: "building" as const, progress: 25, message: "Building application..." },
        { status: "deploying" as const, progress: 75, message: "Deploying to platform..." },
        { status: "success" as const, progress: 100, message: "Deployment successful!" }
      ];

      const stepDelay = isBlockchainDeployment ? 3000 : 2000; // Longer delays for blockchain

      steps.forEach((step, index) => {
        setTimeout(() => {
          setDeploymentStatus(step.status);
          setDeploymentProgress(step.progress);
          if (index === steps.length - 1) {
            setIsDeploying(false);
            // Notify parent when deployment is complete
            setTimeout(() => {
              onDeployComplete();
            }, 1000);
          }
        }, (index + 1) * stepDelay);
      });

    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentStatus("failed");
      setIsDeploying(false);
      // Show error message to user
    }
  };

  const deploymentHistory = [
    { id: 1, platform: "Vercel", status: "success", date: "2024-01-15", url: "https://myapp.vercel.app" },
    { id: 2, platform: "Netlify", status: "success", date: "2024-01-14", url: "https://myapp.netlify.app" },
    { id: 3, platform: "AWS", status: "failed", date: "2024-01-13", url: null }
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="deploy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-slate-700">
          <TabsTrigger value="deploy">Deploy App</TabsTrigger>
          <TabsTrigger value="history">Deploy History</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="deploy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Selection */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Cloud className="w-5 h-5 text-purple-400" />
                  <span>Choose Deployment Platform</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {deploymentPlatforms.map((platform) => (
                    <div
                      key={platform.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPlatform === platform.id
                          ? "border-purple-400 bg-purple-500/20"
                          : "border-slate-600 hover:border-slate-500"
                      }`}
                      onClick={() => setSelectedPlatform(platform.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{platform.icon}</span>
                        <div>
                          <div className="text-white font-medium">{platform.name}</div>
                          <div className="text-slate-400 text-sm">{platform.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Label className="text-slate-300">Environment Variables</Label>
                  <Input
                    placeholder="NODE_ENV=production"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Input
                    placeholder="API_URL=https://api.example.com"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <Button
                  onClick={handleDeploy}
                  disabled={!selectedPlatform || isDeploying}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Deploy Application
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Deployment Status */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Monitor className="w-5 h-5 text-emerald-400" />
                  <span>Deployment Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  {deploymentStatus === "idle" && (
                    <div className="text-slate-400">
                      <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      Ready to deploy
                    </div>
                  )}
                  {deploymentStatus === "building" && (
                    <div className="text-blue-400">
                      <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
                      Building application...
                    </div>
                  )}
                  {deploymentStatus === "deploying" && (
                    <div className="text-purple-400">
                      <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
                      Deploying to platform...
                    </div>
                  )}
                  {deploymentStatus === "success" && (
                    <div className="text-emerald-400">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                      Deployment successful!
                      <div className="mt-4">
                        <Button variant="outline" className="text-emerald-400 border-emerald-400">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Live App
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {isDeploying && (
                  <div className="space-y-2">
                    <Progress value={deploymentProgress} className="w-full" />
                    <div className="text-sm text-slate-400 text-center">
                      {deploymentProgress}% complete
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Repository:</span>
                    <span className="text-slate-200 truncate ml-2">{repoUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Branch:</span>
                    <span className="text-slate-200">main</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Build Command:</span>
                    <span className="text-slate-200">npm run build</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Agent:</span>
                    <span className="text-slate-200">{agentConfig.name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Deployment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deploymentHistory.map((deployment) => (
                  <div
                    key={deployment.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 border border-slate-600"
                  >
                    <div className="flex items-center space-x-4">
                      {deployment.status === "success" ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <div>
                        <div className="text-white font-medium">{deployment.platform}</div>
                        <div className="text-slate-400 text-sm">{deployment.date}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        className={
                          deployment.status === "success"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }
                      >
                        {deployment.status}
                      </Badge>
                      {deployment.url && (
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-300">Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-400">99.9%</div>
                <div className="text-xs text-slate-400">Last 30 days</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-300">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400">245ms</div>
                <div className="text-xs text-slate-400">Average</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-300">Traffic</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">12.5K</div>
                <div className="text-xs text-slate-400">Visits today</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeploymentPanel;
