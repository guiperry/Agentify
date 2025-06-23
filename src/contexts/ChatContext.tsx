'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Define deployment step types
export type DeploymentStep = 'dashboard' | 'repository' | 'compile' | 'tests' | 'deploy';

// API availability state
let isApiAvailable = false;
let apiChecked = false;

// Function to check if the API is available
const checkApiAvailability = async (forceRecheck: boolean = false): Promise<boolean> => {
  if (apiChecked && !forceRecheck) return isApiAvailable;

  try {
    console.log('Checking API availability...');
    const response = await fetch('/api/test', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      // Short timeout to avoid long waits
      signal: AbortSignal.timeout(2000)
    });

    isApiAvailable = response.ok;
    apiChecked = true;
    console.log('API availability check result:', isApiAvailable ? 'Available' : 'Unavailable');
    return isApiAvailable;
  } catch (error) {
    console.warn('API availability check failed:', error);
    isApiAvailable = false;
    apiChecked = true;
    return false;
  }
};

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
  metadata?: {
    deploymentStep?: DeploymentStep;
    repoUrl?: string;
    [key: string]: unknown;
  };
}

// Define the structure for local storage sessions
interface LocalStorageSession {
  id: string | number;
  title: string;
  created_at: string;
  updated_at: string;
  messages: {
    content: string;
    role: string;
    timestamp: string;
    type?: string;
  }[];
  metadata?: {
    deploymentStep?: DeploymentStep;
    repoUrl?: string;
    [key: string]: unknown;
  };
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
  isApiAvailable: boolean;
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
  const [isApiAvailable, setIsApiAvailable] = useState<boolean>(false);

  // Define contextual welcome message function
  const getContextualWelcomeMessage = useCallback((): string => {
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
  }, [currentDeploymentStep]);

  // Helper function to load sessions from local storage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const localSessions = localStorage.getItem('chatSessions');
      if (localSessions && localSessions.trim() !== '') {
        setSessions(JSON.parse(localSessions));
      }
    } catch (localStorageError) {
      console.error('Failed to load sessions from local storage:', localStorageError);
    }
  }, [setSessions]);

  // Function to load sessions from API or local storage
  const loadSessions = useCallback(async () => {
    try {
      // Check if API is available (force recheck for fresh status)
      const apiAvailable = await checkApiAvailability(true);
      setIsApiAvailable(apiAvailable);

      // If API is not available, use local storage only
      if (!apiAvailable) {
        console.log('API is not available. Using local storage only.');
        loadFromLocalStorage();
        return;
      }

      // Try to load from API
      try {
        const response = await fetch('/api/chat/sessions', {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });

        if (!response.ok) {
          console.error('Failed to load chat sessions. Server returned:', response.status, response.statusText);
          loadFromLocalStorage();
          return;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Server returned non-JSON response:', contentType);
          loadFromLocalStorage();
          return;
        }

        const data = await response.json();
        const sessions = data.sessions || [];
        setSessions(sessions);

        // Also save to local storage as backup
        try {
          localStorage.setItem('chatSessions', JSON.stringify(sessions));
        } catch (localStorageError) {
          console.warn('Failed to save sessions to local storage:', localStorageError);
        }
      } catch (apiError) {
        console.error('Error fetching from API:', apiError);
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      loadFromLocalStorage();
    }
  }, [loadFromLocalStorage, setIsApiAvailable, setSessions]);

  // Check API availability on mount - force recheck to ensure fresh status
  useEffect(() => {
    const checkApi = async () => {
      const available = await checkApiAvailability(true); // Force recheck
      setIsApiAvailable(available);
    };

    checkApi();
  }, []);

  // Load sessions on initial mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

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
  }, [currentDeploymentStep, messages.length, getContextualWelcomeMessage]);

  // Provide contextual help based on the current deployment step
  const getContextualHelp = useCallback((): string => {
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
  }, [currentDeploymentStep]);

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

      // Prepare the session data
      const sessionData = {
        title,
        metadata: sessionMetadata,
        messages: messages.map(m => ({
          content: m.content,
          role: m.sender === 'user' ? 'user' : 'bot',
          timestamp: m.timestamp.toISOString(),
          type: m.type
        }))
      };

      // Always save to local storage
      try {
        // Get existing sessions from local storage
        const localSessionsStr = localStorage.getItem('chatSessions');
        const localSessions = localSessionsStr && localSessionsStr.trim() !== ''
          ? JSON.parse(localSessionsStr)
          : [];

        if (currentSessionId) {
          // Update existing session in local storage
          const sessionIndex = localSessions.findIndex((s: LocalStorageSession) => s.id.toString() === currentSessionId);
          if (sessionIndex >= 0) {
            localSessions[sessionIndex] = {
              ...localSessions[sessionIndex],
              ...sessionData,
              updated_at: new Date().toISOString()
            };
          } else {
            // Session not found in local storage, create a new one
            const newSessionId = currentSessionId;
            localSessions.push({
              id: newSessionId,
              ...sessionData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        } else {
          // Create new session in local storage
          const newSessionId = Date.now().toString();
          localSessions.push({
            id: newSessionId,
            ...sessionData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          setCurrentSessionId(newSessionId);
        }

        localStorage.setItem('chatSessions', JSON.stringify(localSessions));
      } catch (localStorageError) {
        console.warn('Failed to save to local storage:', localStorageError);
      }
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

      // Try to load from local storage
      try {
        const localSessionsStr = localStorage.getItem('chatSessions');
        if (localSessionsStr && localSessionsStr.trim() !== '') {
          const localSessions = JSON.parse(localSessionsStr);
          const session = localSessions.find((s: LocalStorageSession) => s.id.toString() === sessionId.toString());

          if (session) {
            // Convert messages to the format expected by the UI
            const formattedMessages = (session.messages || []).map((msg: {
              content: string;
              role: string;
              timestamp: string;
              type?: string;
            }) => ({
              id: Math.random().toString(36).substring(2, 9),
              content: msg.content || '',
              sender: msg.role === 'user' ? 'user' : 'ai',
              timestamp: new Date(msg.timestamp || Date.now()),
              type: msg.type || (msg.role === 'user' ? undefined : 'normal')
            }));

            setMessages(formattedMessages);
            setCurrentSessionId(sessionId);

            // If the session has deployment step metadata, update the current step
            if (session.metadata && session.metadata.deploymentStep) {
              setCurrentDeploymentStep(session.metadata.deploymentStep);
            }
          }
        }
      } catch (localStorageError) {
        console.warn('Failed to load from local storage:', localStorageError);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (sessionId: string) => {
    try {
      // Delete from local storage
      try {
        const localSessionsStr = localStorage.getItem('chatSessions');
        if (localSessionsStr && localSessionsStr.trim() !== '') {
          const localSessions = JSON.parse(localSessionsStr);
          const updatedSessions = localSessions.filter((s: LocalStorageSession) => s.id.toString() !== sessionId.toString());
          localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
        }
      } catch (localStorageError) {
        console.warn('Failed to delete from local storage:', localStorageError);
      }

      // Update UI state
      setSessions(sessions.filter(s => s.id.toString() !== sessionId.toString()));

      // If the deleted session was the current one, start a new chat
      if (currentSessionId === sessionId) {
        startNewChat();
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
      getContextualHelp,
      isApiAvailable
    }}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// Export the context for use in the custom hook
export { ChatContext };
