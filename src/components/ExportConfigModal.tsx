'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Copy, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AgentFacts } from "./AgentConfig";

interface ExportConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentFacts: AgentFacts;
  agentName: string;
  personality: string;
  instructions: string;
  creativity: number;
  features: Record<string, boolean>;
  mcpServers: any[];
  connectedApp: { name: string };
  configProcessComplete: boolean;
}

const ExportConfigModal = ({ 
  open, 
  onOpenChange, 
  agentFacts,
  agentName,
  personality,
  instructions,
  creativity,
  features,
  mcpServers,
  connectedApp,
  configProcessComplete
}: ExportConfigModalProps) => {
  const { toast } = useToast();

  const configData = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    agentName,
    personality,
    instructions,
    creativity,
    features,
    agentFacts,
    mcpServers,
    metadata: {
      connectedApp: connectedApp.name,
      exportedBy: "Agentify",
      configProcessComplete
    }
  };

  const jsonString = JSON.stringify(configData, null, 2);

  const handleDownload = () => {
    const dataBlob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${agentName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_config.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Configuration Downloaded",
      description: `Configuration saved as ${link.download}`,
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      toast({
        title: "Copied to Clipboard",
        description: "Configuration JSON has been copied to your clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center">
            <FileText className="h-5 w-5 mr-2 text-purple-400" />
            Export Configuration
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Download or copy your agent configuration as JSON
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* JSON Preview */}
          <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4 max-h-96 overflow-auto">
            <pre className="text-sm text-white/90 whitespace-pre-wrap font-mono">
              {jsonString}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="border-white/20 text-white/70 hover:bg-white/10"
            >
              Close
            </Button>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="border-white/20 text-white/70 hover:bg-white/10"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy JSON
              </Button>
              <Button
                onClick={handleDownload}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportConfigModal;
