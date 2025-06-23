'use client';

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Download } from "lucide-react";

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
import { Button as UIButton } from "@/components/ui/button";

const DashboardDownloadDialog = ({
  open,
  onOpenChange,
  onDownload
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (platform: 'windows' | 'mac' | 'linux') => void;
}) => (
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
          onClick={() => onDownload('windows')}
          className="bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 hover:text-white justify-start"
        >
          <Download className="h-4 w-4 mr-2" />
          Windows (.exe)
        </UIButton>
        <UIButton
          onClick={() => onDownload('mac')}
          className="bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 hover:text-white justify-start"
        >
          <Download className="h-4 w-4 mr-2" />
          macOS (.dmg)
        </UIButton>
        <UIButton
          onClick={() => onDownload('linux')}
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
);

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
