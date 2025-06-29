'use client';

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Download dialog
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button as UIButton } from "@/components/ui/button";

const DashboardDownloadDialog = ({
  open,
  onOpenChange,
  onDownload
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (platform: 'windows' | 'mac' | 'linux') => void;
}) => {
  const [showMacModal, setShowMacModal] = useState(false);
  const [showLinuxModal, setShowLinuxModal] = useState(false);
  const { toast } = useToast();

  const handleDownloadEngine = (platform: 'windows' | 'mac' | 'linux') => {
    if (platform === 'windows') {
      // Direct download for Windows
      window.open('https://agentic-engine-binaries.s3.us-east-2.amazonaws.com/AgenticInferenceEngine_windows_amd64.zip', '_blank');
      onOpenChange(false); // Close the main dialog
      toast({
        title: "Downloading Windows Engine",
        description: "Starting download for Windows Agentic Engine",
      });
    } else if (platform === 'mac') {
      // Show modal for Mac architecture selection
      onOpenChange(false); // Close the main dialog first
      setShowMacModal(true);
    } else if (platform === 'linux') {
      // Show modal for Linux architecture selection
      onOpenChange(false); // Close the main dialog first
      setShowLinuxModal(true);
    }
  };

  const handleMacDownload = (architecture: 'arm64' | 'amd64') => {
    const url = architecture === 'arm64'
      ? 'https://agentic-engine-binaries.s3.us-east-2.amazonaws.com/AgenticInferenceEngine_darwin_arm64.tar.gz'
      : 'https://agentic-engine-binaries.s3.us-east-2.amazonaws.com/AgenticInferenceEngine_darwin_amd64.tar.gz';

    window.open(url, '_blank');
    setShowMacModal(false);
    toast({
      title: `Downloading Mac Engine (${architecture})`,
      description: `Starting download for Mac ${architecture} Agentic Engine`,
    });
  };

  const handleLinuxDownload = (architecture: 'arm64' | 'amd64') => {
    const url = architecture === 'arm64'
      ? 'https://agentic-engine-binaries.s3.us-east-2.amazonaws.com/AgenticInferenceEngine_linux_arm64.tar.gz'
      : 'https://agentic-engine-binaries.s3.us-east-2.amazonaws.com/AgenticInferenceEngine_linux_amd64.tar.gz';

    window.open(url, '_blank');
    setShowLinuxModal(false);
    toast({
      title: `Downloading Linux Engine (${architecture})`,
      description: `Starting download for Linux ${architecture} Agentic Engine`,
    });
  };

  return (
    <>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogTrigger asChild>
          <UIButton
            variant="outline"
            className="border-blue-400/50 text-blue-400 hover:bg-blue-400/10 hover:text-blue-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Engine
          </UIButton>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Download Agentic Engine</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Choose your platform to download the Agentic Engine software for advanced agent management and control.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-1 gap-3 my-4">
            <UIButton
              onClick={() => handleDownloadEngine('windows')}
              className="bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 hover:text-white justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Windows (.exe)
            </UIButton>
            <UIButton
              onClick={() => handleDownloadEngine('mac')}
              className="bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 hover:text-white justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              macOS (.dmg)
            </UIButton>
            <UIButton
              onClick={() => handleDownloadEngine('linux')}
              className="bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 hover:text-white justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Linux (.AppImage)
            </UIButton>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/20 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mac Architecture Selection Modal */}
      <Dialog open={showMacModal} onOpenChange={setShowMacModal}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Choose Mac Architecture</DialogTitle>
            <DialogDescription className="text-white/70">
              Select your Mac's processor architecture to download the correct version.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 my-4">
            <UIButton
              onClick={() => handleMacDownload('arm64')}
              className="bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 hover:text-white justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Mac Apple Silicon (M1/M2/M3) - ARM64
            </UIButton>
            <UIButton
              onClick={() => handleMacDownload('amd64')}
              className="bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 hover:text-white justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Mac Intel - AMD64
            </UIButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Linux Architecture Selection Modal */}
      <Dialog open={showLinuxModal} onOpenChange={setShowLinuxModal}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Choose Linux Architecture</DialogTitle>
            <DialogDescription className="text-white/70">
              Select your Linux system's processor architecture to download the correct version.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 my-4">
            <UIButton
              onClick={() => handleLinuxDownload('arm64')}
              className="bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 hover:text-white justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Linux ARM64 (Raspberry Pi, ARM servers)
            </UIButton>
            <UIButton
              onClick={() => handleLinuxDownload('amd64')}
              className="bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 hover:text-white justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Linux AMD64 (Intel/AMD 64-bit)
            </UIButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

interface AgentHeaderActionsProps {
  isActive: boolean;
  downloadModalOpen: boolean;
  setDownloadModalOpen: (open: boolean) => void;
  onDownload: (platform: 'windows' | 'mac' | 'linux') => void;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
}

const AgentHeaderActions = ({
  isActive,
  downloadModalOpen,
  setDownloadModalOpen,
  onDownload,
  settingsModalOpen,
  setSettingsModalOpen
}: AgentHeaderActionsProps) => (
  <div className="flex items-center space-x-4">
    <Badge 
      variant={isActive ? "default" : "secondary"} 
      className={isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
    {/* Download Modal Trigger */}
    <DashboardDownloadDialog 
      open={downloadModalOpen}
      onOpenChange={setDownloadModalOpen}
      onDownload={onDownload}
    />
    {/* Settings Button */}
    <Button 
      variant="outline" 
      onClick={() => setSettingsModalOpen(true)}
      className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10 hover:text-purple-300"
    >
      <Settings className="h-4 w-4 mr-2" />
      Settings
    </Button>
  </div>
);

export default AgentHeaderActions;
