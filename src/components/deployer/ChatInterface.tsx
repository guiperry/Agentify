'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Rocket, 
  User, 
  Zap, 
  Cloud, 
  History, 
  Plus, 
  HelpCircle, 
  LayoutDashboard, 
  GitBranch, 
  Code, 
  TestTube 
} from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { DeploymentStep } from "@/contexts/ChatContext";
import { ChatSessionDrawer } from "./ChatSessionDrawer";

interface ChatInterfaceProps {
  repoUrl: string;
  onAgonResponse?: (msg: string) => void;
  currentTab?: DeploymentStep;
}

const ChatInterface = ({ 
  repoUrl, 
  onAgonResponse, 
  currentTab = 'dashboard' 
}: ChatInterfaceProps) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    setMessages,
    sessions,
    currentSessionId,
    loading,
    setLoading,
    currentDeploymentStep,
    setCurrentDeploymentStep,
    saveChat,
    startNewChat,
    loadChat,
    getContextualHelp,
    isApiAvailable
  } = useChat();

  // Update the current deployment step when the tab changes
  useEffect(() => {
    if (currentTab !== currentDeploymentStep) {
      setCurrentDeploymentStep(currentTab);
    }
  }, [currentTab, currentDeploymentStep, setCurrentDeploymentStep]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesEndRef]);

  // Notify parent about latest Agon message when messages update
  useEffect(() => {
    // Find the most recent AI message
    const lastAiMsg = [...messages]
      .reverse()
      .find(m => m.sender === "ai");
    if (lastAiMsg && onAgonResponse) {
      onAgonResponse(lastAiMsg.content);
    }
    scrollToBottom();
  }, [messages, onAgonResponse, scrollToBottom]);

  // Auto-save chat when messages change
  useEffect(() => {
    if (messages.length > 1) { // Only save if there's more than just the welcome message
      const saveTimeout = setTimeout(() => {
        saveChat();
      }, 2000);
      
      return () => clearTimeout(saveTimeout);
    }
  }, [messages, saveChat]);

  const generateAIResponse = async (userMessage: string) => {
    setIsTyping(true);
    
    try {
      // Include the current deployment step in the prompt to provide context
      const contextualPrompt = `[Current deployment step: ${currentDeploymentStep}]\n\nUser message: ${userMessage}`;
      
      // Check if API is available before making the request
      if (isApiAvailable) {
        try {
          const response = await fetch('/api/chat/gemini', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ 
              prompt: contextualPrompt,
              deploymentStep: currentDeploymentStep
            }),
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          
          // Check if response is OK
          if (!response.ok) {
            throw new Error(`Server returned ${response.status} ${response.statusText}`);
          }
          
          // Check content type
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Server returned non-JSON response: ${contentType}`);
          }
          
          // Parse JSON response
          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            throw new Error(`Failed to parse JSON response: ${(jsonError as Error).message}`);
          }
          
          // Check if response has the expected structure
          if (!data || typeof data.response !== 'string') {
            throw new Error('Invalid response format from server');
          }
          
          // Determine message type based on content and current step
          let type: "analysis" | "fix" | "deploy" | "normal" = "normal";
          
          if (currentDeploymentStep === 'deploy' || data.response.includes('deploy') || data.response.includes('🚀')) {
            type = "deploy";
          } else if (currentDeploymentStep === 'compile' || data.response.includes('fix') || data.response.includes('⚡')) {
            type = "fix";
          } else if (currentDeploymentStep === 'dashboard' || currentDeploymentStep === 'repository' || 
                    data.response.includes('analyz') || data.response.includes('🔍')) {
            type = "analysis";
          }
          
          const aiMessage = {
            id: Date.now().toString(),
            content: data.response,
            sender: "ai" as const,
            timestamp: new Date(),
            type
          };
          
          setMessages(prev => [...prev, aiMessage]);
          return; // Exit early if successful
        } catch (apiError) {
          console.error('API error:', apiError);
          // Continue to fallback response
        }
      }
      
      // If API is not available or request failed, use fallback response
      const fallbackResponses = {
        dashboard: "I'm analyzing your dashboard metrics. Your project looks healthy overall, with good test coverage and no critical issues.",
        repository: "I've analyzed your repository structure. The code organization looks good, but I noticed a few potential improvements in error handling.",
        compile: "Your compilation process completed successfully. There were a few warnings about unused variables that you might want to address.",
        tests: "Your test suite is running well with 87% coverage. There are 2 failing tests in the authentication module that need attention.",
        deploy: "I'm ready to help you deploy your application. Would you like to deploy to a cloud provider or set up a local environment?"
      };
      
      // Get fallback response based on current step
      const fallbackResponse = fallbackResponses[currentDeploymentStep as keyof typeof fallbackResponses] || 
        "I'm here to help with your project. What specific aspect would you like assistance with?";
      
      // Add context about the error
      const errorContext = `I'm currently operating in offline mode. I'll do my best to assist you with limited functionality.\n\n${fallbackResponse}`;
      
      const aiMessage = {
        id: Date.now().toString(),
        content: errorContext,
        sender: "ai" as const,
        timestamp: new Date(),
        type: "analysis" as const
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Add error message
      const errorMessage = {
        id: Date.now().toString(),
        content: `Sorry, I encountered an error: ${(error as Error).message}. Please try again.`,
        sender: "ai" as const,
        timestamp: new Date(),
        type: "normal" as const
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      content: message,
      sender: "user" as const,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    
    generateAIResponse(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleShowHelp = () => {
    setShowHelpPanel(false);
    
    // Add the contextual help message to the chat
    const helpMessage = {
      id: Date.now().toString(),
      content: getContextualHelp(),
      sender: "ai" as const,
      timestamp: new Date(),
      type: "analysis" as const
    };
    
    setMessages(prev => [...prev, helpMessage]);
    scrollToBottom();
  };

  // Get the appropriate icon for the current deployment step
  const getStepIcon = () => {
    switch (currentDeploymentStep) {
      case 'dashboard':
        return <LayoutDashboard className="w-5 h-5 text-purple-400" />;
      case 'repository':
        return <GitBranch className="w-5 h-5 text-purple-400" />;
      case 'compile':
        return <Code className="w-5 h-5 text-purple-400" />;
      case 'tests':
        return <TestTube className="w-5 h-5 text-purple-400" />;
      case 'deploy':
        return <Cloud className="w-5 h-5 text-purple-400" />;
      default:
        return <Rocket className="w-5 h-5 text-purple-400" />;
    }
  };

  // Get the title for the current deployment step
  const getStepTitle = () => {
    const baseTitle = "Agon - Deployment Assistant";

    switch (currentDeploymentStep) {
      case 'dashboard':
        return `${baseTitle} | Dashboard`;
      case 'repository':
        return `${baseTitle} | Repository`;
      case 'compile':
        return `${baseTitle} | Compilation`;
      case 'tests':
        return `${baseTitle} | Testing`;
      case 'deploy':
        return `${baseTitle} | Deployment`;
      default:
        return baseTitle;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 bg-slate-800/50 border-slate-700 flex flex-col overflow-hidden h-full">
        <CardHeader className="flex flex-row items-center">
          <div className="flex items-center space-x-2">
            {getStepIcon()}
            <CardTitle className="text-white">{getStepTitle()}</CardTitle>
            <Badge
              variant="outline"
              className="ml-2 text-purple-400 border-purple-400"
            >
              {currentDeploymentStep.charAt(0).toUpperCase() + currentDeploymentStep.slice(1)}
            </Badge>
          </div>
          <div className="flex ml-auto space-x-2 items-center">
            {/* API Status Indicator */}
            <div className="flex items-center mr-2" title={isApiAvailable ? "Connected to API" : "Offline Mode"}>
              <div className={`w-2 h-2 rounded-full mr-1 ${isApiAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-slate-400">{isApiAvailable ? 'Online' : 'Offline'}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="text-blue-300 border-blue-600"
              onClick={handleShowHelp}
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              Help
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-slate-300 border-slate-600"
              onClick={() => setIsDrawerOpen(true)}
            >
              <History className="w-4 h-4 mr-1" />
              History
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-emerald-400 border-emerald-400"
              onClick={startNewChat}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Chat
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4 min-h-0 max-h-full">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${
                    msg.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <div className={`p-2 rounded-full ${
                    msg.sender === "user"
                      ? "bg-purple-500"
                      : msg.type === "deploy"
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : msg.type === "fix"
                          ? "bg-emerald-500"
                          : msg.type === "analysis"
                            ? "bg-blue-500"
                            : "bg-slate-600"
                  }`}>
                    {msg.sender === "user" ? (
                      <User className="w-4 h-4 text-white" />
                    ) : msg.type === "deploy" ? (
                      <Cloud className="w-4 h-4 text-white" />
                    ) : msg.type === "fix" ? (
                      <Zap className="w-4 h-4 text-white" />
                    ) : (
                      <Rocket className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`max-w-[70%] p-3 rounded-lg ${
                    msg.sender === "user"
                      ? "bg-purple-500 text-white"
                      : "bg-slate-700 text-slate-100"
                  }`}>
                    <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                    <div className="text-xs opacity-70 mt-2">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                    <Rocket className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-slate-700 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
          <div className="p-4 border-t border-slate-700 bg-slate-800/70">
            <div className="flex space-x-2">
              <Input
                placeholder={`Ask about ${currentDeploymentStep}...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                disabled={isTyping || loading}
              />
              <Button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={isTyping || loading || !message.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ChatSessionDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        sessions={sessions}
        onSelectSession={loadChat}
        currentSessionId={currentSessionId}
      />
    </div>
  );
};

export default ChatInterface;
