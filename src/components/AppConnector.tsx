'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, Zap, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeApplication, AppConnectionResult } from "@/services";
import { useOnboarding } from "@/contexts/OnboardingContext";

interface AppConnectorProps {
  onAppConnect: (appData: {url: string, name: string, type: string}) => void;
}

const AppConnector = ({ onAppConnect }: AppConnectorProps) => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const { toast } = useToast();
  const { updateState } = useOnboarding();

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
    setAnalysisError(null);
    
    try {
      // Use the real analysis service instead of simulation
      const result = await analyzeApplication(url);
      
      if (result.success && result.appData) {
        // Store the full app data in the onboarding context
        updateState({
          appConfig: result.appData
        });
        
        // Call the callback with the basic app info
        onAppConnect({
          url: result.appData.url,
          name: result.appData.name,
          type: result.appData.type
        });
        
        // Check if there was a CORS warning
        if (result.warning && result.appData.corsRestricted) {
          toast({
            title: "App Connected with Limited Information",
            description: `Connected to ${result.appData.name}, but API details are limited due to CORS restrictions.`,
            variant: "default",
            className: "bg-yellow-500/90 text-white border-yellow-600"
          });
          
          // Set a warning message instead of an error
          setAnalysisError(
            "CORS restrictions prevented full API analysis. Continuing with limited information. " +
            "This is normal when connecting to third-party services and won't affect basic functionality."
          );
        } else {
          toast({
            title: "App Connected!",
            description: `Successfully analyzed ${result.appData.name}`,
          });
        }
      } else {
        setAnalysisError(result.error || "Failed to analyze application");
        toast({
          title: "Analysis Failed",
          description: result.error || "Failed to analyze application",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setAnalysisError(errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };



  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">Connect Your GitHub Repository</h2>
        <p className="text-xl text-white/70">
          Enter your GitHub repository URL and we'll analyze it to create the perfect AI agent
        </p>
      </div>

      <div className="w-full">

        <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Link className="h-5 w-5 mr-2 text-purple-400" />
              GitHub Repository URL
            </CardTitle>
            <CardDescription className="text-white/70">
              Paste the URL of the GitHub repository you want to agentify
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex space-x-4">
              <Input
                placeholder="https://github.com/username/repository"
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
                  'Connect Repository'
                )}
              </Button>
            </div>
              
            {isAnalyzing && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-pulse h-3 w-3 bg-blue-400 rounded-full"></div>
                  <span className="text-blue-400">Analyzing repository structure and capabilities...</span>
                </div>
              </div>
            )}

            {analysisError && (
              <div className={`${
                analysisError.includes("CORS restrictions")
                  ? "bg-yellow-500/10 border border-yellow-500/20"
                  : "bg-red-500/10 border border-red-500/20"
              } rounded-lg p-4`}>
                <div className="flex items-start space-x-3">
                  <AlertCircle className={`h-5 w-5 ${
                    analysisError.includes("CORS restrictions")
                      ? "text-yellow-400"
                      : "text-red-400"
                  } mt-0.5 flex-shrink-0`} />
                  <span className={
                    analysisError.includes("CORS restrictions")
                      ? "text-yellow-400"
                      : "text-red-400"
                  }>{analysisError}</span>
                </div>

                {analysisError.includes("CORS restrictions") && (
                  <div className="mt-3 ml-8">
                    <Button
                      variant="outline"
                      className="text-xs border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10"
                      onClick={() => onAppConnect({
                        url,
                        name: url.replace(/(^\w+:|^)\/\//, '').split('/')[0],
                        type: 'GitHub Repository'
                      })}
                    >
                      Continue Anyway
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default AppConnector;
