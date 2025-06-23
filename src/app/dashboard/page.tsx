'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Rocket, MessageSquare, Cloud, Code } from "lucide-react";
import CompilerPanel from "@/components/deployer/CompilerPanel";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("compile");
  const { toast } = useToast();
  
  // Sample agent configuration
  const sampleAgentConfig = {
    name: "Assistant Agent",
    personality: "Helpful and friendly",
    instructions: "You are a helpful AI assistant that provides accurate and concise information.",
    features: {
      chat: true,
      automation: true,
      analytics: false
    },
    settings: {
      mcpServers: [
        {
          url: "https://mcp1.example.com",
          name: "Primary MCP",
          enabled: true
        }
      ],
      creativity: 0.7
    }
  };

  const handleCompileComplete = (result: any) => {
    console.log("Compilation result:", result);
    if (result.success) {
      toast({
        title: "Compilation Successful",
        description: "Your agent has been compiled successfully.",
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-12">
        <div className="text-center md:text-left w-full">
          <h2 className="text-4xl font-bold text-white mb-4">Agent Dashboard</h2>
          <p className="text-xl text-white/70">
            Build, test, and deploy your AI agents
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
            <TabsTrigger value="compile" className="data-[state=active]:bg-purple-500/20">
              <Code className="w-4 h-4 mr-2" />
              Compile
            </TabsTrigger>
            <TabsTrigger value="test" className="data-[state=active]:bg-purple-500/20">
              Test Runner
            </TabsTrigger>
            <TabsTrigger value="deploy" className="data-[state=active]:bg-purple-500/20">
              <Cloud className="w-4 h-4 mr-2" />
              Deploy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Agent Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">Welcome to your agent dashboard. Select a tab to get started.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="compile" className="space-y-6">
            <CompilerPanel 
              agentConfig={sampleAgentConfig} 
              onCompileComplete={handleCompileComplete} 
            />
          </TabsContent>

          <TabsContent value="test" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Test Runner</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">Test your agent before deployment.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deploy" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Deployment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">Deploy your agent to production.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Chat Button */}
        <div className="flex justify-end mt-6">
          <Button
            className="flex items-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            variant="outline"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat with Agent
          </Button>
        </div>
      </div>
    </div>
  );
}