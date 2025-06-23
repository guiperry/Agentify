'use client';

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, MessageSquare, Trash2 } from "lucide-react";
import { useChat } from "@/hooks/useChat";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatSessionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: ChatSession[];
  onSelectSession: (sessionId: string) => Promise<void>;
  currentSessionId: string | null;
}

export const ChatSessionDrawer = ({
  open,
  onOpenChange,
  sessions,
  onSelectSession,
  currentSessionId
}: ChatSessionDrawerProps) => {
  const { deleteChat } = useChat();

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this chat?')) {
      await deleteChat(sessionId);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-slate-800 text-white border-slate-700">
        <DrawerHeader className="flex items-center justify-between">
          <DrawerTitle className="text-white">Chat History</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <ScrollArea className="h-[50vh]">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                No saved chats found
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-slate-700 ${
                      currentSessionId === session.id ? 'bg-slate-700 border-l-2 border-purple-500' : 'bg-slate-800'
                    }`}
                    onClick={() => {
                      onSelectSession(session.id);
                      onOpenChange(false);
                    }}
                  >
                    <MessageSquare className="h-5 w-5 text-purple-400 mr-3" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{session.title}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(session.updated_at).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-400"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
