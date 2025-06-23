# Agentify Developer Guide

## Introduction

Agentify is a framework for building, configuring, and deploying AI agents with enhanced developer experience. This guide provides comprehensive documentation on how to use Agentify to create and configure agents with various capabilities.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Agent Configuration](#agent-configuration)
3. [Tool Configuration](#tool-configuration)
4. [LLM Integration](#llm-integration)
5. [Credential Management](#credential-management)
6. [Terminal UI](#terminal-ui)
7. [Multi-Language Subagents](#multi-language-subagents)
8. [Testing and Debugging](#testing-and-debugging)
9. [Best Practices](#best-practices)

## Getting Started

### Installation

```bash
npm install agentify
```

### Basic Usage

```typescript
import { AgentCompiler } from 'agentify';
import myAgentConfig from './my-agent-config';

// Create a new agent compiler
const compiler = new AgentCompiler(
  './work-dir',
  './templates',
  './output'
);

// Compile the agent
compiler.compile(myAgentConfig)
  .then(() => {
    console.log('Agent compiled successfully!');
  })
  .catch((error) => {
    console.error('Error compiling agent:', error);
  });
```

## Agent Configuration

The `AgentPluginConfig` interface defines the configuration for an agent:

```typescript
export interface AgentPluginConfig {
  // Basic agent information
  agent_id: string;
  agent_name: string;
  agentType: 'llm' | 'sequential' | 'parallel' | 'loop';
  description: string;
  version: string;
  facts_url: string;
  private_facts_url?: string;
  adaptive_router_url?: string;
  ttl: number;
  signature: string;
  
  // Tool configurations
  tools: ToolConfig[];
  
  // Resource configurations
  resources: ResourceConfig[];
  
  // Prompt configurations
  prompts: PromptConfig[];
  
  // Python dependencies
  pythonDependencies: string[];
  
  // Whether to use chromem-go for persistence
  useChromemGo: boolean;
  
  // Whether the agent can spawn sub-agents
  subAgentCapabilities: boolean;
  
  // TEE configuration
  trustedExecutionEnvironment: TEEConfig;
  
  // Terminal UI configuration
  terminalUI?: TerminalUIConfig;
  
  // Model provider configuration
  modelProvider?: ModelProviderConfig;
  
  // Required credentials
  requiredCredentials?: RequiredCredential[];
  
  // Subagent configurations
  subagents?: SubagentConfig[];
  
  // Subagent management configuration
  subagentManagement?: SubagentManagementUIConfig;
}
```

## Tool Configuration

Tools are the primary way for agents to interact with the outside world. Agentify provides a flexible system for defining tools:

```typescript
export interface ToolConfig {
  name: string;
  description: string;
  parameters: ParameterConfig[];
  returnType: string;
  sourceType: 'inlineBody' | 'filePath';
  sourceValue: string; // Implementation body or path to file
}
```

### Parameter Configuration

Parameters for tools can be configured with rich type information:

```typescript
export interface ParameterConfig {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  defaultValue?: unknown;
  schema?: {
    // For object types
    properties?: Record<string, ParameterConfig>;
    // For array types
    items?: ParameterConfig;
    // For string types
    enum?: string[];
    pattern?: string;
    // For number types
    minimum?: number;
    maximum?: number;
  };
}
```

### Example Tool Configuration

```typescript
const searchTool: ToolConfig = {
  name: 'search_web',
  description: 'Search the web for information',
  parameters: [
    {
      name: 'query',
      description: 'The search query',
      type: 'string',
      required: true
    },
    {
      name: 'num_results',
      description: 'Number of results to return',
      type: 'number',
      required: false,
      defaultValue: 5,
      schema: {
        minimum: 1,
        maximum: 20
      }
    }
  ],
  returnType: 'array',
  sourceType: 'inlineBody',
  sourceValue: `
    package main
    
    import (
      "context"
      "encoding/json"
      "fmt"
      "net/http"
      "net/url"
    )
    
    func main() {
      // Tool implementation...
    }
  `
};
```

## LLM Integration

Agentify supports integration with various LLM providers:

```typescript
export type SupportedModelProvider = 'openai' | 'anthropic' | 'google' | 'cerebras' | 'custom';

export interface ModelProviderConfig {
  provider: SupportedModelProvider;
  model: string;
  parameters?: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    // Other provider-specific parameters
    [key: string]: unknown;
  };
}
```

### Example LLM Configuration

```typescript
const modelProvider: ModelProviderConfig = {
  provider: 'openai',
  model: 'gpt-4',
  parameters: {
    temperature: 0.7,
    topP: 1.0,
    maxTokens: 2000,
    presencePenalty: 0.0,
    frequencyPenalty: 0.0
  }
};
```

## Credential Management

Agentify provides a secure way to manage credentials:

```typescript
export interface RequiredCredential {
  name: string;  // e.g., "OPENAI_API_KEY", "GOOGLE_API_KEY"
  description?: string;
  optional?: boolean;
  envVarName?: string;  // Environment variable name to look for
}
```

### Example Credential Configuration

```typescript
const requiredCredentials: RequiredCredential[] = [
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API key for GPT-4 access',
    optional: false,
    envVarName: 'OPENAI_API_KEY'
  },
  {
    name: 'SEARCH_API_KEY',
    description: 'API key for the search service',
    optional: true,
    envVarName: 'SEARCH_API_KEY'
  }
];
```

## Terminal UI

Agentify provides an interactive terminal UI for agents:

```typescript
export interface TerminalUIConfig {
  enabled: boolean;
  defaultHeight?: number;
  theme?: 'light' | 'dark' | 'system';
  allowCommandHistory?: boolean;
  supportedCommands?: string[];
}
```

### Example Terminal UI Configuration

```typescript
const terminalUI: TerminalUIConfig = {
  enabled: true,
  defaultHeight: 300,
  theme: 'dark',
  allowCommandHistory: true,
  supportedCommands: [
    'help',
    'clear',
    'history',
    'run',
    'search',
    'memory'
  ]
};
```

## Multi-Language Subagents

Agentify supports creating and managing subagents in different programming languages:

```typescript
export interface SubagentConfig {
  id: string;
  name: string;
  description: string;
  language: 'python' | 'javascript';
  initScript: string;
  environmentVariables: Record<string, string>;
  tools: ToolConfig[];
  modelProvider?: ModelProviderConfig;
  resourceLimits?: ResourceLimits;
}

export interface SubagentManagementUIConfig {
  enabled: boolean;
  allowDynamicCreation?: boolean;
  maxSubagents?: number;
  resourceLimits?: {
    maxMemoryMB?: number;
    maxCPUPercent?: number;
    timeoutSeconds?: number;
  };
}
```

### Example Subagent Configuration

```typescript
const pythonSubagent: SubagentConfig = {
  id: 'data-processor',
  name: 'Data Processor',
  description: 'Processes and analyzes data using Python',
  language: 'python',
  initScript: `
    import numpy as np
    import pandas as pd
    from sklearn.preprocessing import StandardScaler
    
    # Initialize data processing components
    scaler = StandardScaler()
    
    def preprocess_data(data):
        """Preprocess data using sklearn."""
        df = pd.DataFrame(data)
        return scaler.fit_transform(df)
  `,
  environmentVariables: {
    'PYTHONPATH': '/app',
    'NUMPY_EXPERIMENTAL_ARRAY_FUNCTION': '1'
  },
  tools: [
    // Tool configurations...
  ],
  modelProvider: {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    parameters: {
      temperature: 0.5,
      maxTokens: 1000
    }
  }
};
```

## Testing and Debugging

### Testing Tools

You can test tools individually before deploying the agent:

```typescript
import { testTool } from 'agentify';

const result = await testTool(searchTool, { query: 'Agentify framework', num_results: 5 });
console.log(result);
```

### Testing LLM Integration

You can test LLM integration before deploying the agent:

```typescript
import { testLLMProvider } from 'agentify';

const result = await testLLMProvider(modelProvider, 'Hello, world!');
console.log(result);
```

### Debugging Subagents

You can debug subagents using the subagent management interface:

```typescript
import { SubagentManager } from 'agentify';

const manager = new SubagentManager();
const subagentInfo = await manager.getSubagentInfo('data-processor');
console.log(subagentInfo);
```

## Best Practices

1. **Tool Design**
   - Keep tools focused on a single responsibility
   - Provide clear descriptions and parameter documentation
   - Use appropriate parameter types and validation

2. **LLM Configuration**
   - Start with conservative temperature settings (0.3-0.7)
   - Adjust maxTokens based on expected response length
   - Test different models to find the best fit for your use case

3. **Credential Management**
   - Use environment variables for sensitive credentials
   - Make credentials optional when possible
   - Provide clear descriptions for required credentials

4. **Subagent Design**
   - Use the appropriate language for each subagent based on its purpose
   - Keep subagents focused on specific domains
   - Monitor resource usage to prevent overloading

5. **Testing**
   - Test tools individually before integrating them
   - Test the agent with various inputs
   - Monitor resource usage during testing