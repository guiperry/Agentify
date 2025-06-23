'use client';

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ChatInterface from "@/components/deployer/ChatInterface";
import { ChatProvider, DeploymentStep } from "@/contexts/ChatContext";

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoUrl: string;
  onAgonResponse?: (msg: string) => void;
  currentTab?: DeploymentStep;
}

const ChatModal = ({ 
  open, 
  onOpenChange, 
  repoUrl, 
  onAgonResponse,
  currentTab = 'dashboard'
}: ChatModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl w-[90vw] p-0 bg-transparent border-none shadow-none"
        style={{
          maxHeight: "90vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <DialogTitle className="sr-only">Agon Chat</DialogTitle>
        <div 
          className="w-full max-w-xl"
          style={{
            height: "600px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ChatProvider initialStep={currentTab} repoUrl={repoUrl}>
            <ChatInterface 
              repoUrl={repoUrl} 
              onAgonResponse={onAgonResponse} 
              currentTab={currentTab}
            />
          </ChatProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;
