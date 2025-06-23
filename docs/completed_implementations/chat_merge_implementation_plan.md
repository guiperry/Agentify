# Chat Merge Implementation Plan

## Overview

This document outlines the plan for merging the chat functionality from the MY-CHAT-BRAIN_v2 project into the main Agentify application. The goal is to enhance the existing Agon chatbot with robust chat capabilities while maintaining a seamless user experience and consistent design language. Additionally, Agon will be enhanced to detect and respond to the current step in the deployment process, providing contextual assistance to users.

## Current Architecture Analysis

### MY-CHAT-BRAIN_v2 (Source)

The MY-CHAT-BRAIN_v2 project is a Next.js application with a comprehensive chat interface that includes:

1. **State Management**: Context-based state management for chat history, sessions, and UI state
2. **Chat Interface**: Components for displaying messages, user input, and chat history
3. **API Integration**: Routes for connecting to AI models (Gemini, DeepSeek)
4. **Data Persistence**: Database schema and API routes for storing chat sessions and messages
5. **Additional Features**: Note-taking, memory graph, and prompt management (to be excluded from migration)

### Agentify (Target)

The Agentify project already has a basic chat interface for the Agon deployment assistant:

1. **Chat Components**: `ChatInterface.tsx` and `ChatModal.tsx` for displaying a chat interface
2. **Basic State Management**: Local state for managing messages and UI state
3. **Simulated Responses**: Currently using hardcoded responses based on user input
4. **No Persistence**: Chat history is not currently saved between sessions
5. **Deployment Process**: Multi-step deployment process with distinct phases (connect, configure, deploy, dashboard)

## Implementation Goals

1. Enhance Agon with real AI model integration (using Gemini API)
2. Implement chat history persistence
3. Add session management for multiple conversations
4. Maintain the existing Agentify UI design language
5. Ensure seamless user experience
6. Enable Agon to detect and respond to the current deployment step
7. Provide contextual assistance based on the deployment phase

## Detailed Implementation Plan

### 1. State Management Implementation

#### Create ChatContext Provider with Deployment Step Awareness

```typescript
// src/contexts/ChatContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define deployment step types
export type DeploymentStep = 'dashboard' | 'repository' | 'compile' | 'tests' | 'deploy';

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  type?: "analysis" | "fix" | "deploy" | "normal";
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

interface ChatContextType {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  sessions: ChatSession[];
  setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  currentSessionId: string | null;
  setCurrentSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  currentDeploymentStep: DeploymentStep;
  setCurrentDeploymentStep: React.Dispatch<React.SetStateAction<DeploymentStep>>;
  saveChat: () => Promise<void>;
  startNewChat: () => void;
  loadChat: (sessionId: string) => Promise<void>;
  deleteChat: (sessionId: string) => Promise<void>;
  getContextualHelp: () => string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{
  children: React.ReactNode;
  initialStep?: DeploymentStep;
  repoUrl?: string;
}> = ({ children, initialStep = 'dashboard', repoUrl = '' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentDeploymentStep, setCurrentDeploymentStep] = useState<DeploymentStep>(initialStep);

  // Load sessions on initial mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Generate contextual welcome message based on deployment step
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = getContextualWelcomeMessage();
      setMessages([{
        id: "welcome",
        content: welcomeMessage,
        sender: "ai",
        timestamp: new Date(),
        type: "analysis"
      }]);
    }
  }, [currentDeploymentStep, messages.length]);

  const getContextualWelcomeMessage = (): string => {
    switch (currentDeploymentStep) {
      case 'dashboard':
        return `I'm Agon, your deployment assistant! I can help you understand your repository metrics and guide you through the deployment process. What would you like to know about your project?`;
      case 'repository':
        return `I see you're in the Repository section. I can help you analyze your codebase, identify potential issues, and suggest improvements. What would you like me to explain about your repository?`;
      case 'compile':
        return `Welcome to the Compile section! I can help you understand compilation errors, suggest fixes, and optimize your build process. How can I assist with your compilation?`;
      case 'tests':
        return `You're in the Test Runner section. I can help you understand test results, fix failing tests, and improve your test coverage. What testing challenges can I help with?`;
      case 'deploy':
        return `You've reached the Deployment section! I can guide you through deploying your application, recommend platforms, and troubleshoot deployment issues. How would you like to proceed with deployment?`;
      default:
        return `I'm Agon, your deployment assistant! I'm here to help you with your project. What can I do for you today?`;
    }
  };

  // Provide contextual help based on the current deployment step
  const getContextualHelp = (): string => {
    switch (currentDeploymentStep) {
      case 'dashboard':
        return `## Dashboard Help\n\nThe Dashboard provides an overview of your project's health and status. Here you can see:\n\n- Repository connection status\n- Code quality metrics\n- Test coverage statistics\n- Files analyzed\n- Test results\n- Agent configuration\n\nI can help you interpret these metrics and suggest improvements. What specific aspect would you like to know more about?`;
      case 'repository':
        return `## Repository Help\n\nIn this section, you can explore your codebase and get insights about:\n\n- File structure and organization\n- Code complexity and quality\n- Potential issues and vulnerabilities\n- Dependency management\n\nI can analyze specific files or provide general recommendations for your codebase. What would you like me to help with?`;
      case 'compile':
        return `## Compilation Help\n\nThe Compile section allows you to build your project and identify any compilation issues. I can help with:\n\n- Resolving build errors\n- Optimizing compilation configuration\n- Improving build performance\n- Understanding compiler warnings\n\nLet me know if you encounter any specific compilation problems.`;
      case 'tests':
        return `## Test Runner Help\n\nThe Test Runner section helps you execute and analyze your test suite. I can assist with:\n\n- Interpreting test results\n- Fixing failing tests\n- Improving test coverage\n- Writing better test cases\n- Setting up continuous testing\n\nWhat testing challenges are you facing?`;
      case 'deploy':
        return `## Deployment Help\n\nThe Deployment section guides you through deploying your application. I can help with:\n\n- Choosing the right deployment platform\n- Setting up deployment configurations\n- Troubleshooting deployment issues\n- Configuring environment variables\n- Setting up CI/CD pipelines\n\nWhat deployment questions do you have?`;
      default:
        return `I'm here to help with any aspect of your project. Just let me know what you need assistance with.`;
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/chat/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  };

  const saveChat = async () => {
    if (messages.length === 0) return;

    try {
      // Create a title from the first user message
      const firstUserMessage = messages.find(m => m.sender === 'user');
      const title = firstUserMessage 
        ? (firstUserMessage.content.length > 50 
            ? firstUserMessage.content.substring(0, 47) + '...' 
            : firstUserMessage.content)
        : `Chat - ${currentDeploymentStep.charAt(0).toUpperCase() + currentDeploymentStep.slice(1)}`;

      // Include deployment step metadata in the session
      const sessionMetadata = {
        deploymentStep: currentDeploymentStep,
        repoUrl: repoUrl || ''
      };

      if (currentSessionId) {
        // Update existing session
        await fetch(`/api/chat/sessions/${currentSessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title,
            metadata: sessionMetadata,
            messages: messages.map(m => ({
              content: m.content,
              role: m.sender === 'user' ? 'user' : 'bot',
              timestamp: m.timestamp.toISOString(),
              type: m.type
            }))
          })
        });
      } else {
        // Create new session
        const response = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title,
            metadata: sessionMetadata,
            messages: messages.map(m => ({
              content: m.content,
              role: m.sender === 'user' ? 'user' : 'bot',
              timestamp: m.timestamp.toISOString(),
              type: m.type
            }))
          })
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentSessionId(data.sessionId);
        }
      }

      // Refresh sessions list
      loadSessions();
    } catch (error) {
      console.error('Failed to save chat:', error);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    
    // Add a new contextual welcome message based on the current step
    const welcomeMessage = getContextualWelcomeMessage();
    setMessages([{
      id: "welcome",
      content: welcomeMessage,
      sender: "ai",
      timestamp: new Date(),
      type: "analysis"
    }]);
  };

  const loadChat = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chat/sessions/${sessionId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Convert messages to the format expected by the UI
        const formattedMessages = data.messages.map((msg: any) => ({
          id: msg.id.toString(),
          content: msg.content,
          sender: msg.role === 'user' ? 'user' : 'ai',
          timestamp: new Date(msg.timestamp),
          type: msg.type || (msg.role === 'user' ? undefined : 'normal')
        }));
        
        setMessages(formattedMessages);
        setCurrentSessionId(sessionId);
        
        // If the session has deployment step metadata, update the current step
        if (data.metadata && data.metadata.deploymentStep) {
          setCurrentDeploymentStep(data.metadata.deploymentStep);
        }
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId));
        
        // If the deleted session was the current one, start a new chat
        if (currentSessionId === sessionId) {
          startNewChat();
        }
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  return (
    <ChatContext.Provider value={{
      messages,
      setMessages,
      sessions,
      setSessions,
      currentSessionId,
      setCurrentSessionId,
      loading,
      setLoading,
      currentDeploymentStep,
      setCurrentDeploymentStep,
      saveChat,
      startNewChat,
      loadChat,
      deleteChat,
      getContextualHelp
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
```

### 2. API Implementation

#### Create Chat API Routes

```typescript
// src/server/api/chat/sessions.ts
import { Request, Response } from 'express';
import db from '../../db';

// Get all chat sessions
export const getSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await db.query(
      'SELECT id, title, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC'
    );
    
    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ error: 'Failed to fetch chat sessions' });
  }
};

// Get a specific chat session with messages
export const getSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get session details
    const [session] = await db.query(
      'SELECT id, title, created_at, updated_at FROM chat_sessions WHERE id = ?',
      [id]
    );
    
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    // Get messages for this session
    const messages = await db.query(
      'SELECT id, content, role, timestamp FROM chat_messages WHERE session_id = ? ORDER BY timestamp',
      [id]
    );
    
    res.json({ ...session, messages });
  } catch (error) {
    console.error('Error fetching chat session:', error);
    res.status(500).json({ error: 'Failed to fetch chat session' });
  }
};

// Create a new chat session
export const createSession = async (req: Request, res: Response) => {
  try {
    const { title, messages } = req.body;
    
    // Create session
    const [result] = await db.query(
      'INSERT INTO chat_sessions (title, created_at, updated_at) VALUES (?, NOW(), NOW())',
      [title]
    );
    
    const sessionId = result.insertId;
    
    // Add messages if provided
    if (messages && messages.length > 0) {
      const messageValues = messages.map(msg => [
        sessionId,
        msg.content,
        msg.role,
        msg.timestamp || new Date().toISOString()
      ]);
      
      await db.query(
        'INSERT INTO chat_messages (session_id, content, role, timestamp) VALUES ?',
        [messageValues]
      );
    }
    
    res.status(201).json({ sessionId });
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({ error: 'Failed to create chat session' });
  }
};

// Update an existing chat session
export const updateSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, messages } = req.body;
    
    // Update session
    await db.query(
      'UPDATE chat_sessions SET title = ?, updated_at = NOW() WHERE id = ?',
      [title, id]
    );
    
    // Delete existing messages
    await db.query('DELETE FROM chat_messages WHERE session_id = ?', [id]);
    
    // Add new messages
    if (messages && messages.length > 0) {
      const messageValues = messages.map(msg => [
        id,
        msg.content,
        msg.role,
        msg.timestamp || new Date().toISOString()
      ]);
      
      await db.query(
        'INSERT INTO chat_messages (session_id, content, role, timestamp) VALUES ?',
        [messageValues]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating chat session:', error);
    res.status(500).json({ error: 'Failed to update chat session' });
  }
};

// Delete a chat session
export const deleteSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Delete messages first (foreign key constraint)
    await db.query('DELETE FROM chat_messages WHERE session_id = ?', [id]);
    
    // Delete session
    await db.query('DELETE FROM chat_sessions WHERE id = ?', [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ error: 'Failed to delete chat session' });
  }
};
```

#### Create AI Integration API

```typescript
// src/server/api/chat/gemini.ts
import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const generateResponse = async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    
    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'Gemini API key not configured',
        response: 'API key not configured. Please set the GEMINI_API_KEY environment variable.'
      });
    }
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Configure generation parameters
    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };
    
    // Configure safety settings
    const safetySettings = [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ];
    
    // Start chat and send message
    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [],
    });
    
    const result = await chat.sendMessage(prompt);
    const response = result.response.text();
    
    res.json({ response });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI response',
      response: `Error: ${(error as Error).message}`
    });
  }
};
```

### 3. Database Schema Implementation

```sql
-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  content TEXT NOT NULL,
  role ENUM('user', 'bot') NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);
```

### 4. Enhanced ChatInterface Component with Deployment Step Awareness

```typescript
// src/components/deployer/ChatInterface.tsx
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
import { useChat, DeploymentStep } from "@/contexts/ChatContext";
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
    getContextualHelp
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
      
      const response = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          prompt: contextualPrompt,
          deploymentStep: currentDeploymentStep
        })
      });
      
      const data = await response.json();
      
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
          <div className="flex ml-auto space-x-2">
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
```

### 5. Chat Session History Component

```typescript
// src/components/deployer/ChatSessionDrawer.tsx
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, MessageSquare, Trash2 } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";

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
```

### 6. Integration with Main Application

#### Update AgentDeployer.tsx to Pass Current Tab to ChatModal

```typescript
// src/components/AgentDeployer.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rocket, MessageSquare, Cloud, Code } from "lucide-react";
import StatusDashboard from "@/components/deployer/StatusDashboard";
import RepositoryPanel from "@/components/deployer/RepositoryPanel";
import TestRunner from "@/components/deployer/TestRunner";
import DeploymentPanel from "@/components/deployer/DeploymentPanel";
import CompilerPanel from "@/components/deployer/CompilerPanel";
import ChatModal from "@/components/deployer/ChatModal";
import { useToast } from "@/hooks/use-toast";
import { DeploymentStep } from "@/contexts/ChatContext";

// ... other imports and interface definitions

const AgentDeployer = ({
  connectedApp,
  agentConfig,
  onDeployed,
  isActive,
  downloadModalOpen,
  setDownloadModalOpen,
  onDownload,
  settingsModalOpen,
  setSettingsModalOpen
}: AgentDeployerProps) => {
  const [activeTab, setActiveTab] = useState<DeploymentStep>("dashboard");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [lastAgonResponse, setLastAgonResponse] = useState<string>("");
  const { toast } = useToast();

  // Handler to receive AI response from chat interface
  const handleAgonResponse = (response: string) => {
    setLastAgonResponse(response);
  };

  // Utility: get last 4-5 lines (prefer up to 5 if enough newlines, otherwise at least 1 line)
  const getPreviewLines = (text: string, lines: number = 5) => {
    if (!text) return "";
    const split = text.trim().split(/\r?\n/);
    return split.slice(-lines).join('\n');
  };

  const handleDeploy = () => {
    toast({
      title: "Agent Deployed!",
      description: `${agentConfig.name} has been successfully deployed and is ready to use`,
    });
    
    setTimeout(() => {
      onDeployed();
    }, 1500);
  };

  // Handle tab change to update the active tab state
  const handleTabChange = (value: string) => {
    setActiveTab(value as DeploymentStep);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-12">
        <div className="text-center md:text-left w-full">
          <h2 className="text-4xl font-bold text-white mb-4">Deploy Your AI Agent</h2>
          <p className="text-xl text-white/70">
            Test and deploy your agent for {connectedApp.name}
          </p>
        </div>
      </div>

      {/* Main Interface */}
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/5 border border-white/10">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-500/20">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="repository" className="data-[state=active]:bg-purple-500/20">
              Repository
            </TabsTrigger>
            <TabsTrigger value="compile" className="data-[state=active]:bg-purple-500/20">
              <Code className="w-4 h-4 mr-2" />
              Compile
            </TabsTrigger>
            <TabsTrigger value="tests" className="data-[state=active]:bg-purple-500/20">
              Test Runner
            </TabsTrigger>
            <TabsTrigger value="deploy" className="data-[state=active]:bg-purple-500/20">
              <Cloud className="w-4 h-4 mr-2" />
              Deploy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <StatusDashboard repoUrl={connectedApp.url} agentConfig={agentConfig} />
          </TabsContent>

          <TabsContent value="repository" className="space-y-6">
            <RepositoryPanel repoUrl={connectedApp.url} />
          </TabsContent>
          
          <TabsContent value="compile" className="space-y-6">
            <CompilerPanel 
              agentConfig={agentConfig} 
              onCompileComplete={(result) => {
                // Handle compile completion if needed
                console.log("Compilation result:", result);
              }} 
            />
          </TabsContent>

          <TabsContent value="tests" className="space-y-6">
            <TestRunner repoUrl={connectedApp.url} agentConfig={agentConfig} />
          </TabsContent>

          <TabsContent value="deploy" className="space-y-6">
            <DeploymentPanel 
              repoUrl={connectedApp.url} 
              agentConfig={agentConfig}
              onDeployComplete={handleDeploy}
            />
          </TabsContent>
        </Tabs>

        {/* Chat Button and Modal */}
        <div className="flex justify-end mt-6">
          <Button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            variant="outline"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat with Agon
          </Button>
          <ChatModal
            open={isChatOpen}
            onOpenChange={setIsChatOpen}
            repoUrl={connectedApp.url}
            onAgonResponse={handleAgonResponse}
            currentTab={activeTab}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentDeployer;
```

#### Update App.tsx to Include ChatProvider

```typescript
// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChatProvider } from './contexts/ChatContext';
// Other imports...

function App() {
  return (
    <ChatProvider>
      <Router>
        {/* Routes and other components */}
      </Router>
    </ChatProvider>
  );
}

export default App;
```

#### Update ChatModal.tsx to Use ChatProvider with Deployment Step Awareness

```typescript
// src/components/deployer/ChatModal.tsx
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
```

## Migration Strategy

### Phase 1: Setup and Preparation

1. Create database tables for chat sessions and messages
2. Implement the ChatContext provider with deployment step awareness
3. Create API routes for chat functionality
4. Set up Gemini API integration with contextual prompting

### Phase 2: Component Implementation

1. Enhance the ChatInterface component with real AI integration and deployment step awareness
2. Create the ChatSessionDrawer component for history management
3. Update the ChatModal component to use the ChatProvider and pass the current deployment step
4. Modify the AgentDeployer component to track and pass the current tab to the ChatModal

### Phase 3: Testing and Refinement

1. Test chat functionality with real AI responses
2. Test session persistence and history management
3. Verify that contextual responses match the current deployment step
4. Ensure UI consistency with the existing Agentify design
5. Test the Help feature for each deployment step
6. Optimize performance and fix any issues

### Phase 4: Deployment

1. Deploy the updated application
2. Monitor for any issues
3. Gather user feedback for future improvements

## Technical Considerations

### API Keys and Environment Variables

The implementation will require the following environment variables:

```
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL_NAME=gemini-1.5-flash
```

### Database Considerations

The implementation requires two new database tables:
- `chat_sessions` - For storing chat session metadata (including deployment step information)
- `chat_messages` - For storing individual messages within sessions

The `chat_sessions` table should include a `metadata` column to store JSON data about the deployment context:

```sql
ALTER TABLE chat_sessions ADD COLUMN metadata JSON;
```

### Performance Optimization

- Implement pagination for chat history to handle large conversations
- Use debouncing for auto-saving chat sessions
- Optimize database queries for chat history retrieval
- Cache contextual help messages for each deployment step

### Deployment Step Integration

The implementation integrates with the existing deployment workflow by:

1. Detecting the current tab in the AgentDeployer component
2. Passing this information to the ChatModal and ChatInterface components
3. Updating the ChatContext with the current deployment step
4. Providing contextual welcome messages and help based on the current step
5. Including the deployment step context in prompts sent to the AI model

## Future Enhancements

After the initial implementation, the following enhancements could be considered:

1. Add support for multiple AI models (similar to MY-CHAT-BRAIN_v2)
2. Implement chat export functionality
3. Add message search capabilities
4. Implement user authentication for personalized chat history
5. Add support for file attachments in chat
6. Enhance deployment step awareness with:
   - Automatic detection of errors and issues in each step
   - Proactive suggestions based on the current deployment context
   - Integration with repository analysis for more targeted assistance
   - Ability to execute deployment actions directly from the chat interface
7. Implement a guided deployment workflow where Agon walks users through each step
8. Add real-time monitoring and alerts during the deployment process

## Conclusion

This implementation plan provides a comprehensive approach to merging the chat functionality from MY-CHAT-BRAIN_v2 into the Agentify application. By focusing on the core chat functionality and maintaining the existing UI design language, we can create a seamless experience for users while significantly enhancing the capabilities of the Agon chatbot.

The addition of deployment step awareness enables Agon to provide contextual assistance throughout the deployment process, making it a more valuable tool for users. By understanding which phase of the deployment process the user is currently in, Agon can offer more relevant suggestions, help, and guidance, ultimately improving the user experience and increasing the success rate of deployments.