# ADK Integration Plan for Inference Engine

## Overview

This document outlines a comprehensive plan for integrating Google's Agent Development Kit (ADK) with our existing Inference Engine. The integration will enable dynamic creation and management of AI agents at runtime, with the Golang backend handling agent creation and the TypeScript frontend managing them.

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  TypeScript     │◄────►│  Go Backend     │◄────►│  Python ADK     │
│  Frontend       │      │  (Orchestrator) │      │  Agent Service  │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
       ▲                        │                        ▲
       │                        ▼                        │
       │                ┌─────────────────┐              │
       │                │                 │              │
       └───────────────►│  Agent Registry │◄─────────────┘
                        │  (chromem-go)   │
                        │                 │
                        └─────────────────┘
```


**Google A2A Protocol Implementation**
**Status**: ❌ Not Implemented  
**Priority**: Important  
**Estimated Effort**: 3-4 days  

**Requirements**:
- Agent-to-Agent communication protocol implementation
- Agent discovery and capability negotiation
- Secure message exchange
- Task delegation and collaboration
- Support for synchronous and asynchronous communication

**Implementation Steps**:
1. Create `A2AProtocolManager.jsx` component
2. Implement Agent Card creation and discovery
3. Add message exchange interface
4. Implement task delegation and status tracking
5. Create capability negotiation interface

**Technical Components**:
- **Agent Cards**: Implement standardized agent capability descriptions
- **JSON-RPC 2.0**: Set up communication over HTTP(S)
- **Flexible Interaction**: Support synchronous request/response, streaming (SSE), and asynchronous push notifications
- **Rich Data Exchange**: Handle text, files, and structured JSON data
- **Security & Authentication**: Implement enterprise-ready security measures

**Google Agent Development Kit (ADK) Integration**:
- Implement agent orchestration using ADK patterns as detailed the key components section below
- Support for flexible workflows (Sequential, Parallel, Loop) via ADK's agent composition
- Enable multi-agent architecture for complex tasks through chromem-go persistence
- Integrate with tool ecosystem for enhanced capabilities using ADK's tool system
- Implement built-in evaluation mechanisms with ADK callbacks
- Single binary compilation with embedded Python runtime


## Key Components

### 1. Agent Registry using chromem-go

We'll use our existing chromem-go vector database implementation to store and retrieve agent configurations and states.

```go
// agent_registry.go
package agent

import (
	"encoding/json"
	"fmt"
	"github.com/philippgille/chromem-go"
	"github.com/philippgille/chromem-go/document"
)

// AgentRegistry manages agent storage and retrieval using chromem-go
type AgentRegistry struct {
	db         *chromem.DB
	collection *chromem.Collection
}

// NewAgentRegistry creates a new agent registry
func NewAgentRegistry(dbPath string) (*AgentRegistry, error) {
	// Open or create the database
	db, err := chromem.Open(dbPath, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to open chromem-go database: %v", err)
	}

	// Get or create the agents collection
	collection, err := db.GetOrCreateCollection("agents", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get/create agents collection: %v", err)
	}

	return &AgentRegistry{
		db:         db,
		collection: collection,
	}, nil
}

// RegisterAgent stores an agent configuration in the registry
func (r *AgentRegistry) RegisterAgent(agentID string, config map[string]interface{}) error {
	// Create a document with the agent configuration
	doc := document.Document{
		ID:     agentID,
		Fields: config,
	}

	// Store the document in the collection
	_, err := r.collection.Set(doc)
	if err != nil {
		return fmt.Errorf("failed to store agent: %v", err)
	}

	return nil
}

// GetAgent retrieves an agent configuration from the registry
func (r *AgentRegistry) GetAgent(agentID string) (map[string]interface{}, error) {
	// Get the document from the collection
	doc, err := r.collection.Get(agentID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve agent: %v", err)
	}

	return doc.Fields, nil
}

// DeleteAgent removes an agent from the registry
func (r *AgentRegistry) DeleteAgent(agentID string) error {
	// Delete the document from the collection
	err := r.collection.Delete(agentID)
	if err != nil {
		return fmt.Errorf("failed to delete agent: %v", err)
	}

	return nil
}

// ListAgents returns a list of all agent IDs
func (r *AgentRegistry) ListAgents() ([]string, error) {
	// Get all documents from the collection
	docs, err := r.collection.GetAll()
	if err != nil {
		return nil, fmt.Errorf("failed to list agents: %v", err)
	}

	// Extract the IDs
	ids := make([]string, len(docs))
	for i, doc := range docs {
		ids[i] = doc.ID
	}

	return ids, nil
}

// Close closes the database connection
func (r *AgentRegistry) Close() error {
	return r.db.Close()
}
```

### 2. Python Agent Service as Embedded Process

Instead of using Docker, we'll embed the Python agent service as a subprocess within our Go application. This allows us to compile everything into a single binary.

```go
// python_service.go
package agent

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"
)

// PythonAgentService manages the embedded Python agent service
type PythonAgentService struct {
	cmd       *exec.Cmd
	port      int
	baseURL   string
	pythonEnv string
}

// NewPythonAgentService creates a new Python agent service
func NewPythonAgentService(port int) (*PythonAgentService, error) {
	// Determine the Python executable based on the OS
	pythonExe := "python"
	if runtime.GOOS == "windows" {
		pythonExe = "python.exe"
	}

	// Check if Python is installed
	_, err := exec.LookPath(pythonExe)
	if err != nil {
		return nil, fmt.Errorf("Python not found: %v", err)
	}

	return &PythonAgentService{
		port:      port,
		baseURL:   fmt.Sprintf("http://localhost:%d", port),
		pythonEnv: pythonExe,
	}, nil
}

// extractPythonScript extracts the embedded Python script to a temporary file
func (s *PythonAgentService) extractPythonScript() (string, error) {
	// Create a temporary directory
	tempDir, err := ioutil.TempDir("", "agent-service")
	if err != nil {
		return "", fmt.Errorf("failed to create temp directory: %v", err)
	}

	// Write the Python script to a file
	scriptPath := filepath.Join(tempDir, "agent_service.py")
	err = ioutil.WriteFile(scriptPath, []byte(pythonAgentServiceScript), 0644)
	if err != nil {
		return "", fmt.Errorf("failed to write Python script: %v", err)
	}

	// Write the requirements file
	reqPath := filepath.Join(tempDir, "requirements.txt")
	err = ioutil.WriteFile(reqPath, []byte(pythonRequirements), 0644)
	if err != nil {
		return "", fmt.Errorf("failed to write requirements file: %v", err)
	}

	return scriptPath, nil
}

// Start starts the Python agent service
func (s *PythonAgentService) Start() error {
	// Extract the Python script
	scriptPath, err := s.extractPythonScript()
	if err != nil {
		return err
	}

	// Install dependencies
	installCmd := exec.Command(s.pythonEnv, "-m", "pip", "install", "-r", filepath.Join(filepath.Dir(scriptPath), "requirements.txt"))
	installCmd.Stdout = os.Stdout
	installCmd.Stderr = os.Stderr
	if err := installCmd.Run(); err != nil {
		return fmt.Errorf("failed to install Python dependencies: %v", err)
	}

	// Start the Python service
	s.cmd = exec.Command(s.pythonEnv, scriptPath, fmt.Sprintf("--port=%d", s.port))
	s.cmd.Stdout = os.Stdout
	s.cmd.Stderr = os.Stderr
	if err := s.cmd.Start(); err != nil {
		return fmt.Errorf("failed to start Python service: %v", err)
	}

	// Wait for the service to start
	for i := 0; i < 10; i++ {
		resp, err := http.Get(fmt.Sprintf("%s/health", s.baseURL))
		if err == nil && resp.StatusCode == http.StatusOK {
			return nil
		}
		time.Sleep(500 * time.Millisecond)
	}

	return fmt.Errorf("Python service failed to start")
}

// Stop stops the Python agent service
func (s *PythonAgentService) Stop() error {
	if s.cmd != nil && s.cmd.Process != nil {
		return s.cmd.Process.Kill()
	}
	return nil
}

// CreateAgent creates a new agent
func (s *PythonAgentService) CreateAgent(config map[string]interface{}) (string, error) {
	// Convert config to JSON
	jsonData, err := json.Marshal(config)
	if err != nil {
		return "", fmt.Errorf("error marshaling agent config: %v", err)
	}

	// Send request to Python Agent Service
	resp, err := http.Post(
		fmt.Sprintf("%s/create_agent", s.baseURL),
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return "", fmt.Errorf("error creating agent: %v", err)
	}
	defer resp.Body.Close()

	// Parse response
	var result struct {
		Status  string `json:"status"`
		AgentID string `json:"agent_id"`
		Error   string `json:"error,omitempty"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("error parsing response: %v", err)
	}

	if result.Status != "success" {
		return "", fmt.Errorf("agent creation failed: %s", result.Error)
	}

	return result.AgentID, nil
}

// RunAgent runs an agent with the given input
func (s *PythonAgentService) RunAgent(agentID string, input string, sessionID string) (string, error) {
	// Create request payload
	payload := struct {
		Input     string `json:"input"`
		SessionID string `json:"session_id"`
	}{
		Input:     input,
		SessionID: sessionID,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("error marshaling input: %v", err)
	}

	// Send request to run the agent
	resp, err := http.Post(
		fmt.Sprintf("%s/run_agent/%s", s.baseURL, agentID),
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return "", fmt.Errorf("error running agent: %v", err)
	}
	defer resp.Body.Close()

	// Parse response
	var result struct {
		Status   string `json:"status"`
		Response string `json:"response"`
		Error    string `json:"error,omitempty"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("error parsing response: %v", err)
	}

	if result.Status != "success" {
		return "", fmt.Errorf("agent execution failed: %s", result.Error)
	}

	return result.Response, nil
}

// Embedded Python script for the agent service
const pythonAgentServiceScript = `
import argparse
import json
import os
import sys
import uuid
from flask import Flask, request, jsonify
from google.adk.agents import LlmAgent, SequentialAgent, ParallelAgent, LoopAgent
from google.adk.tools import google_search, FunctionTool
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.code_executors import BuiltInCodeExecutor
from google.adk.tools import VertexAiSearchTool
from google.genai import types

app = Flask(__name__)

# In-memory agent registry (will be replaced by external storage)
agent_registry = {}
runner_registry = {}
session_services = {}

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

@app.route('/create_agent', methods=['POST'])
def create_agent():
    config = request.json
    agent_id = config.get('agent_id', str(uuid.uuid4()))
    agent_type = config.get('agent_type', 'llm')
    
    # Create tools based on configuration
    tools = []
    if config.get('use_search', False):
        tools.append(google_search)
    
    # Add code execution if specified
    use_code_execution = config.get('use_code_execution', False)
    code_executor = [BuiltInCodeExecutor] if use_code_execution else None
    
    # Add Vertex AI Search if specified
    if config.get('use_vertex_search', False) and 'vertex_datastore_id' in config:
        vertex_search_tool = VertexAiSearchTool(data_store_id=config['vertex_datastore_id'])
        tools.append(vertex_search_tool)
    
    # Create the agent based on type
    if agent_type == 'llm':
        agent = LlmAgent(
            name=config.get('name', f'Agent-{agent_id}'),
            model=config.get('model', 'gemini-2.0-flash'),
            instruction=config.get('instruction', ''),
            description=config.get('description', ''),
            tools=tools,
            executor=code_executor
        )
    elif agent_type == 'sequential':
        # Create sub-agents and then sequential agent
        sub_agent_ids = config.get('sub_agents', [])
        sub_agents = [agent_registry.get(sub_id) for sub_id in sub_agent_ids if sub_id in agent_registry]
        agent = SequentialAgent(
            name=config.get('name', f'SequentialAgent-{agent_id}'),
            sub_agents=sub_agents
        )
    elif agent_type == 'parallel':
        # Create sub-agents and then parallel agent
        sub_agent_ids = config.get('sub_agents', [])
        sub_agents = [agent_registry.get(sub_id) for sub_id in sub_agent_ids if sub_id in agent_registry]
        agent = ParallelAgent(
            name=config.get('name', f'ParallelAgent-{agent_id}'),
            sub_agents=sub_agents
        )
    elif agent_type == 'loop':
        # Create sub-agents and then loop agent
        sub_agent_ids = config.get('sub_agents', [])
        sub_agents = [agent_registry.get(sub_id) for sub_id in sub_agent_ids if sub_id in agent_registry]
        agent = LoopAgent(
            name=config.get('name', f'LoopAgent-{agent_id}'),
            sub_agents=sub_agents,
            max_iterations=config.get('max_iterations', 5)
        )
    else:
        return jsonify({"status": "error", "error": f"Unknown agent type: {agent_type}"})
    
    # Register agent in registry
    agent_registry[agent_id] = agent
    
    # Create session service and runner for this agent
    app_name = f"app-{agent_id}"
    session_services[agent_id] = InMemorySessionService()
    runner_registry[agent_id] = Runner(agent=agent, app_name=app_name, session_service=session_services[agent_id])
    
    return jsonify({"status": "success", "agent_id": agent_id})

@app.route('/run_agent/<agent_id>', methods=['POST'])
def run_agent(agent_id):
    # Get input from request
    input_data = request.json.get('input', '')
    session_id = request.json.get('session_id', 'default')
    user_id = request.json.get('user_id', 'default_user')
    
    # Get agent from registry
    runner = runner_registry.get(agent_id)
    if not runner:
        return jsonify({"status": "error", "message": "Agent not found"})
    
    # Create session if it doesn't exist
    session_service = session_services[agent_id]
    session = session_service.create_session(app_name=f"app-{agent_id}", user_id=user_id, session_id=session_id)
    
    # Run agent and collect response
    content = types.Content(role='user', parts=[types.Part(text=input_data)])
    
    try:
        events = runner.run(user_id=user_id, session_id=session_id, new_message=content)
        
        final_response = None
        for event in events:
            if event.is_final_response() and event.content and event.content.parts:
                final_response = event.content.parts[0].text
                break
        
        if final_response is None:
            return jsonify({"status": "error", "message": "No response from agent"})
        
        return jsonify({"status": "success", "response": final_response})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Agent Service')
    parser.add_argument('--port', type=int, default=5000, help='Port to run the service on')
    args = parser.parse_args()
    
    app.run(host='0.0.0.0', port=args.port)
`

// Python requirements for the agent service
const pythonRequirements = `
flask==2.0.1
google-adk==1.0.0
google-generativeai==0.3.0
`
```

### 3. Agent Builder in Go

```go
// agent_builder.go
package agent

import (
	"fmt"
	"github.com/google/uuid"
)

// AgentConfig represents the configuration for an agent
type AgentConfig struct {
	AgentID          string                 `json:"agent_id,omitempty"`
	AgentType        string                 `json:"agent_type"`
	Name             string                 `json:"name"`
	Model            string                 `json:"model,omitempty"`
	Instruction      string                 `json:"instruction,omitempty"`
	Description      string                 `json:"description,omitempty"`
	UseSearch        bool                   `json:"use_search,omitempty"`
	UseCodeExecution bool                   `json:"use_code_execution,omitempty"`
	UseVertexSearch  bool                   `json:"use_vertex_search,omitempty"`
	VertexDatastoreID string                `json:"vertex_datastore_id,omitempty"`
	CustomTools      []Tool                 `json:"custom_tools,omitempty"`
	SubAgents        []string               `json:"sub_agents,omitempty"`
	MaxIterations    int                    `json:"max_iterations,omitempty"`
	ExtraParams      map[string]interface{} `json:"extra_params,omitempty"`
}

// Tool represents a tool configuration for an agent
type Tool struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Endpoint    string                 `json:"endpoint"`
	Parameters  map[string]interface{} `json:"parameters"`
}

// AgentBuilder manages the creation and execution of agents
type AgentBuilder struct {
	pythonService *PythonAgentService
	registry      *AgentRegistry
}

// NewAgentBuilder creates a new agent builder
func NewAgentBuilder(dbPath string, servicePort int) (*AgentBuilder, error) {
	// Create the agent registry
	registry, err := NewAgentRegistry(dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create agent registry: %v", err)
	}

	// Create the Python agent service
	pythonService, err := NewPythonAgentService(servicePort)
	if err != nil {
		return nil, fmt.Errorf("failed to create Python agent service: %v", err)
	}

	return &AgentBuilder{
		pythonService: pythonService,
		registry:      registry,
	}, nil
}

// Start starts the agent builder
func (b *AgentBuilder) Start() error {
	return b.pythonService.Start()
}

// Stop stops the agent builder
func (b *AgentBuilder) Stop() error {
	if err := b.pythonService.Stop(); err != nil {
		return err
	}
	return b.registry.Close()
}

// BuildAgent creates a new agent
func (b *AgentBuilder) BuildAgent(config AgentConfig) (string, error) {
	// Generate an agent ID if not provided
	if config.AgentID == "" {
		config.AgentID = uuid.New().String()
	}

	// Convert config to map for storage
	configMap := map[string]interface{}{
		"agent_id":            config.AgentID,
		"agent_type":          config.AgentType,
		"name":                config.Name,
		"model":               config.Model,
		"instruction":         config.Instruction,
		"description":         config.Description,
		"use_search":          config.UseSearch,
		"use_code_execution":  config.UseCodeExecution,
		"use_vertex_search":   config.UseVertexSearch,
		"vertex_datastore_id": config.VertexDatastoreID,
		"custom_tools":        config.CustomTools,
		"sub_agents":          config.SubAgents,
		"max_iterations":      config.MaxIterations,
	}

	// Add extra parameters if provided
	if config.ExtraParams != nil {
		for k, v := range config.ExtraParams {
			configMap[k] = v
		}
	}

	// Create the agent in the Python service
	agentID, err := b.pythonService.CreateAgent(configMap)
	if err != nil {
		return "", fmt.Errorf("failed to create agent: %v", err)
	}

	// Store the agent configuration in the registry
	if err := b.registry.RegisterAgent(agentID, configMap); err != nil {
		return "", fmt.Errorf("failed to register agent: %v", err)
	}

	return agentID, nil
}

// RunAgent runs an agent with the given input
func (b *AgentBuilder) RunAgent(agentID string, input string, sessionID string) (string, error) {
	// Check if the agent exists in the registry
	_, err := b.registry.GetAgent(agentID)
	if err != nil {
		return "", fmt.Errorf("agent not found: %v", err)
	}

	// Run the agent in the Python service
	return b.pythonService.RunAgent(agentID, input, sessionID)
}

// GetAgent retrieves an agent configuration
func (b *AgentBuilder) GetAgent(agentID string) (AgentConfig, error) {
	// Get the agent configuration from the registry
	configMap, err := b.registry.GetAgent(agentID)
	if err != nil {
		return AgentConfig{}, fmt.Errorf("failed to get agent: %v", err)
	}

	// Convert map to AgentConfig
	config := AgentConfig{
		AgentID:          configMap["agent_id"].(string),
		AgentType:        configMap["agent_type"].(string),
		Name:             configMap["name"].(string),
		Model:            configMap["model"].(string),
		Instruction:      configMap["instruction"].(string),
		Description:      configMap["description"].(string),
		UseSearch:        configMap["use_search"].(bool),
		UseCodeExecution: configMap["use_code_execution"].(bool),
		UseVertexSearch:  configMap["use_vertex_search"].(bool),
		VertexDatastoreID: configMap["vertex_datastore_id"].(string),
		MaxIterations:    int(configMap["max_iterations"].(float64)),
	}

	// Convert sub_agents
	if subAgents, ok := configMap["sub_agents"].([]interface{}); ok {
		config.SubAgents = make([]string, len(subAgents))
		for i, sa := range subAgents {
			config.SubAgents[i] = sa.(string)
		}
	}

	// Convert custom_tools
	if customTools, ok := configMap["custom_tools"].([]interface{}); ok {
		config.CustomTools = make([]Tool, len(customTools))
		for i, ct := range customTools {
			toolMap := ct.(map[string]interface{})
			config.CustomTools[i] = Tool{
				Name:        toolMap["name"].(string),
				Description: toolMap["description"].(string),
				Endpoint:    toolMap["endpoint"].(string),
				Parameters:  toolMap["parameters"].(map[string]interface{}),
			}
		}
	}

	return config, nil
}

// DeleteAgent deletes an agent
func (b *AgentBuilder) DeleteAgent(agentID string) error {
	return b.registry.DeleteAgent(agentID)
}

// ListAgents lists all agents
func (b *AgentBuilder) ListAgents() ([]string, error) {
	return b.registry.ListAgents()
}
```

### 4. API Handlers in Go

```go
// api_handlers.go
package api

import (
	"encoding/json"
	"net/http"
	
	"github.com/gorilla/mux"
	"your-project/agent"
)

// AgentAPI handles agent-related API requests
type AgentAPI struct {
	builder *agent.AgentBuilder
}

// NewAgentAPI creates a new agent API handler
func NewAgentAPI(builder *agent.AgentBuilder) *AgentAPI {
	return &AgentAPI{
		builder: builder,
	}
}

// RegisterRoutes registers the API routes
func (api *AgentAPI) RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/api/v1/agents", api.CreateAgentHandler).Methods("POST")
	r.HandleFunc("/api/v1/agents", api.ListAgentsHandler).Methods("GET")
	r.HandleFunc("/api/v1/agents/{id}", api.GetAgentHandler).Methods("GET")
	r.HandleFunc("/api/v1/agents/{id}", api.UpdateAgentHandler).Methods("PATCH")
	r.HandleFunc("/api/v1/agents/{id}", api.DeleteAgentHandler).Methods("DELETE")
	r.HandleFunc("/api/v1/agents/{id}/run", api.RunAgentHandler).Methods("POST")
}

// CreateAgentHandler handles agent creation requests
func (api *AgentAPI) CreateAgentHandler(w http.ResponseWriter, r *http.Request) {
	var config agent.AgentConfig
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	agentID, err := api.builder.BuildAgent(config)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":   "success",
		"agent_id": agentID,
	})
}

// ListAgentsHandler handles agent listing requests
func (api *AgentAPI) ListAgentsHandler(w http.ResponseWriter, r *http.Request) {
	agents, err := api.builder.ListAgents()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"agents": agents,
	})
}

// GetAgentHandler handles agent retrieval requests
func (api *AgentAPI) GetAgentHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	agentID := vars["id"]
	
	config, err := api.builder.GetAgent(agentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"agent":  config,
	})
}

// UpdateAgentHandler handles agent update requests
func (api *AgentAPI) UpdateAgentHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	agentID := vars["id"]
	
	// Get the current agent configuration
	currentConfig, err := api.builder.GetAgent(agentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Parse the update request
	var updateConfig agent.AgentConfig
	if err := json.NewDecoder(r.Body).Decode(&updateConfig); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	// Apply the updates
	if updateConfig.Name != "" {
		currentConfig.Name = updateConfig.Name
	}
	if updateConfig.Instruction != "" {
		currentConfig.Instruction = updateConfig.Instruction
	}
	if updateConfig.Description != "" {
		currentConfig.Description = updateConfig.Description
	}
	if updateConfig.Model != "" {
		currentConfig.Model = updateConfig.Model
	}
	
	// Delete the old agent
	if err := api.builder.DeleteAgent(agentID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Create a new agent with the updated configuration
	currentConfig.AgentID = agentID
	newAgentID, err := api.builder.BuildAgent(currentConfig)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":   "success",
		"agent_id": newAgentID,
	})
}

// DeleteAgentHandler handles agent deletion requests
func (api *AgentAPI) DeleteAgentHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	agentID := vars["id"]
	
	if err := api.builder.DeleteAgent(agentID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
	})
}

// RunAgentHandler handles agent execution requests
func (api *AgentAPI) RunAgentHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	agentID := vars["id"]
	
	var input struct {
		Input     string `json:"input"`
		SessionID string `json:"session_id"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	
	// Use a default session ID if not provided
	if input.SessionID == "" {
		input.SessionID = "default"
	}
	
	response, err := api.builder.RunAgent(agentID, input.Input, input.SessionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":   "success",
		"response": response,
	})
}
```

### 5. TypeScript Agent Manager

```typescript
// agent-manager.ts
export interface AgentConfig {
  agentId?: string;
  agentType: 'llm' | 'sequential' | 'parallel' | 'loop';
  name: string;
  model?: string;
  instruction?: string;
  description?: string;
  useSearch?: boolean;
  useCodeExecution?: boolean;
  useVertexSearch?: boolean;
  vertexDatastoreId?: string;
  customTools?: Tool[];
  subAgents?: string[];
  maxIterations?: number;
  extraParams?: Record<string, any>;
}

export interface Tool {
  name: string;
  description: string;
  endpoint: string;
  parameters: Record<string, any>;
}

export class AgentManager {
  private apiBaseUrl: string;
  
  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }
  
  async createAgent(config: AgentConfig): Promise<string> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    
    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error(`Failed to create agent: ${data.error}`);
    }
    
    return data.agentId;
  }
  
  async listAgents(): Promise<string[]> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/agents`);
    
    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error(`Failed to list agents: ${data.error}`);
    }
    
    return data.agents;
  }
  
  async getAgent(agentId: string): Promise<AgentConfig> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/agents/${agentId}`);
    
    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error(`Failed to get agent: ${data.error}`);
    }
    
    return data.agent;
  }
  
  async updateAgent(agentId: string, config: Partial<AgentConfig>): Promise<string> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/agents/${agentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    
    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error(`Failed to update agent: ${data.error}`);
    }
    
    return data.agentId;
  }
  
  async deleteAgent(agentId: string): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/agents/${agentId}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error(`Failed to delete agent: ${data.error}`);
    }
  }
  
  async runAgent(agentId: string, input: string, sessionId: string = 'default'): Promise<string> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/agents/${agentId}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input,
        sessionId,
      }),
    });
    
    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error(`Failed to run agent: ${data.error}`);
    }
    
    return data.response;
  }
}
```

**A2A Protocol API Endpoints Needed**:
- `GET /api/v1/agents/discover` (Need to create)
- `POST /api/v1/agents/message` (Need to create)
- `GET /api/v1/agents/tasks/{id}` (Need to create)
- `POST /api/v1/agents/capabilities` (Need to create)


### 6. Main Application Integration

```go
// main.go
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/gorilla/mux"
	"your-project/agent"
	"your-project/api"
)

func main() {
	// Parse command line flags
	dbPath := flag.String("db-path", "./data/agents.db", "Path to the agent database")
	apiPort := flag.Int("api-port", 8080, "Port for the API server")
	pythonPort := flag.Int("python-port", 5000, "Port for the Python agent service")
	flag.Parse()

	// Ensure Python is installed and required packages are available
	log.Println("Checking Python installation...")
	if err := agent.EnsurePythonInstalled(); err != nil {
		log.Fatalf("Python setup failed: %v", err)
	}
	log.Println("Python setup completed successfully")

	// Ensure the database directory exists
	dbDir := filepath.Dir(*dbPath)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		log.Fatalf("Failed to create database directory: %v", err)
	}

	// Create the agent builder
	builder, err := agent.NewAgentBuilder(*dbPath, *pythonPort)
	if err != nil {
		log.Fatalf("Failed to create agent builder: %v", err)
	}

	// Start the Python agent service
	if err := builder.Start(); err != nil {
		log.Fatalf("Failed to start Python agent service: %v", err)
	}
	defer builder.Stop()

	// Create the API handler
	agentAPI := api.NewAgentAPI(builder)

	// Create the router
	router := mux.NewRouter()
	agentAPI.RegisterRoutes(router)

	// Create the HTTP server
	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", *apiPort),
		Handler: router,
	}

	// Start the server in a goroutine
	go func() {
		log.Printf("Starting API server on port %d", *apiPort)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	// Shutdown the server
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server shutdown failed: %v", err)
	}
	log.Println("Server stopped")
}
```

## Addressing Technical Considerations with ADK Features

### 1. Error Handling and Monitoring

ADK provides several features to help with error handling and monitoring:

1. **Callbacks**: ADK's callback system can be used to monitor agent execution and handle errors.

```python
from google.adk.callbacks import Callback

class ErrorMonitoringCallback(Callback):
    def on_error(self, error, context):
        # Log the error
        print(f"Error: {error}")
        # You could also send the error to a monitoring service
        
    def on_agent_start(self, agent, context):
        # Log agent start
        print(f"Agent {agent.name} started")
        
    def on_agent_end(self, agent, context):
        # Log agent end
        print(f"Agent {agent.name} ended")
```

2. **Event Tracking**: ADK's event system provides detailed information about agent execution.

```python
# Track events during agent execution
async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=content):
    # Log event details
    print(f"Event ID: {event.id}, Author: {event.author}")
    
    # Check for errors
    if event.error:
        print(f"Error: {event.error}")
```

### 2. State Management

ADK's state management system can be used to maintain consistent state across different agents:

1. **Session State**: ADK provides a session state that can be used to store and retrieve data.

```python
# Store data in session state
context.state['key'] = value

# Retrieve data from session state
value = context.state.get('key')
```

2. **State Prefixes**: ADK supports different state prefixes for different scopes.

```python
# App-level state (shared across all users)
context.state['app:key'] = value

# User-level state (specific to the current user)
context.state['user:key'] = value

# Session-level state (specific to the current session)
context.state['key'] = value

# Temporary state (not persisted)
context.state['temp:key'] = value
```

### 3. Security

ADK provides several features to help with security:

1. **Input Validation**: ADK's tool system provides a way to validate inputs.

```python
from pydantic import BaseModel, Field

class SearchParams(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    max_results: int = Field(10, ge=1, le=100)

def search_tool(params: SearchParams) -> dict:
    # The input has been validated by Pydantic
    query = params.query
    max_results = params.max_results
    # ...
```

2. **Authentication**: ADK's authentication system can be used to secure API access.

```python
from google.adk.tools import ToolContext

def secure_tool(api_key: str, tool_context: ToolContext) -> dict:
    # Validate the API key
    if not is_valid_api_key(api_key):
        return {"status": "error", "message": "Invalid API key"}
    
    # Proceed with the tool execution
    # ...
```

### 4. Performance Optimization

ADK provides several features to help with performance optimization:

1. **Parallel Agent**: ADK's parallel agent can be used to execute tasks concurrently.

```python
from google.adk.agents import ParallelAgent, LlmAgent

# Create agents for parallel execution
agent1 = LlmAgent(name="Agent1", ...)
agent2 = LlmAgent(name="Agent2", ...)

# Create a parallel agent
parallel_agent = ParallelAgent(
    name="ParallelAgent",
    sub_agents=[agent1, agent2]
)
```

2. **Caching**: ADK's memory system can be used to cache results.

```python
from google.adk.memory import InMemoryMemoryService

# Create a memory service
memory_service = InMemoryMemoryService()

# Store a result in memory
memory_service.add_memory(user_id, "result", result)

# Retrieve a result from memory
result = memory_service.get_memory(user_id, "result")
```

## Single Binary Compilation

To compile everything into a single binary for Windows, Linux, and Mac, we'll use Go's cross-compilation capabilities and embed the Python code as a string in the Go binary.

### 1. Embedding Python Code

We've already embedded the Python code as a string constant in the `python_service.go` file. This allows us to extract and run the Python code at runtime without needing separate Python files.

### 2. Cross-Compilation

#### Makefile for Cross-Compilation

```makefile
# Makefile for cross-compiling the Agentic Engine

# Binary name
BINARY_NAME=agentic-engine

# Build directory
BUILD_DIR=bin

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get

# Platforms to build for
PLATFORMS=linux/amd64 windows/amd64 darwin/amd64 darwin/arm64

# Default target
all: clean build

# Clean build directory
clean:
	$(GOCLEAN)
	rm -rf $(BUILD_DIR)
	mkdir -p $(BUILD_DIR)

# Build for all platforms
build: $(PLATFORMS)

# Build for a specific platform
$(PLATFORMS):
	$(eval PLATFORM_SPLIT := $(subst /, ,$@))
	$(eval GOOS := $(word 1, $(PLATFORM_SPLIT)))
	$(eval GOARCH := $(word 2, $(PLATFORM_SPLIT)))
	$(eval EXTENSION := $(if $(filter windows,$(GOOS)),.exe,))
	@echo "Building for $(GOOS)/$(GOARCH)..."
	GOOS=$(GOOS) GOARCH=$(GOARCH) $(GOBUILD) -o $(BUILD_DIR)/$(BINARY_NAME)-$(GOOS)-$(GOARCH)$(EXTENSION) ./cmd/inference-engine
	@echo "Successfully built $(BUILD_DIR)/$(BINARY_NAME)-$(GOOS)-$(GOARCH)$(EXTENSION)"

# Run tests
test:
	$(GOTEST) -v ./...

# Install dependencies
deps:
	$(GOGET) -v ./...

.PHONY: all clean build test deps $(PLATFORMS)
```

#### Shell Script for Cross-Compilation

```bash
#!/bin/bash
# cross-compile.sh - Script for cross-compiling the Inference Engine

# Binary name
BINARY_NAME="agentic-engine"

# Build directory
BUILD_DIR="bin"

# Ensure build directory exists
mkdir -p $BUILD_DIR

# Clean previous builds
go clean
rm -rf $BUILD_DIR/*

# Platforms to build for
PLATFORMS=("linux/amd64" "windows/amd64" "darwin/amd64" "darwin/arm64")

# Build for each platform
for platform in "${PLATFORMS[@]}"; do
    # Split platform into OS and architecture
    IFS='/' read -r -a platform_split <<< "$platform"
    GOOS=${platform_split[0]}
    GOARCH=${platform_split[1]}
    
    # Set extension for Windows
    EXTENSION=""
    if [ "$GOOS" == "windows" ]; then
        EXTENSION=".exe"
    fi
    
    # Build output filename
    OUTPUT="$BUILD_DIR/$BINARY_NAME-$GOOS-$GOARCH$EXTENSION"
    
    echo "Building for $GOOS/$GOARCH..."
    
    # Build the binary
    GOOS=$GOOS GOARCH=$GOARCH go build -o $OUTPUT ./cmd/inference-engine
    
    # Check if build was successful
    if [ $? -eq 0 ]; then
        echo "Successfully built $OUTPUT"
    else
        echo "Error building for $GOOS/$GOARCH"
    fi
done

echo "Cross-compilation complete!"
```

### 3. Runtime Python Installation

Since we're embedding the Python code in the Go binary, we need to ensure that Python and the required packages are installed on the target system. We can add a function to check for Python and install the required packages if needed:

```go
// python_installer.go
package agent

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// EnsurePythonInstalled checks if Python is installed and installs the required packages
func EnsurePythonInstalled() error {
	// Determine the Python executable based on the OS
	pythonExe := "python"
	if runtime.GOOS == "windows" {
		pythonExe = "python.exe"
	}

	// Check if Python is installed
	pythonPath, err := exec.LookPath(pythonExe)
	if err != nil {
		return fmt.Errorf("Python not found: %v", err)
	}

	fmt.Printf("Found Python at: %s\n", pythonPath)

	// Create a temporary directory for the requirements file
	tempDir, err := os.MkdirTemp("", "python-requirements")
	if err != nil {
		return fmt.Errorf("failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Write the requirements file
	reqPath := filepath.Join(tempDir, "requirements.txt")
	if err := os.WriteFile(reqPath, []byte(pythonRequirements), 0644); err != nil {
		return fmt.Errorf("failed to write requirements file: %v", err)
	}

	// Install the required packages
	fmt.Println("Installing required Python packages...")
	cmd := exec.Command(pythonPath, "-m", "pip", "install", "-r", reqPath)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to install Python packages: %v", err)
	}

	fmt.Println("Python packages installed successfully")
	return nil
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (Weeks 1-2)

1. **Set up the Agent Registry**
   - Implement the `agent_registry.go` file using chromem-go
   - Create unit tests for the registry

2. **Implement the Python Agent Service**
   - Create the `python_service.go` file with the embedded Python code
   - Implement the Python installer
   - Test the service startup and communication

3. **Create the Agent Builder**
   - Implement the `agent_builder.go` file
   - Create unit tests for agent creation and execution

### Phase 2: API Layer (Weeks 3-4)

1. **Implement the API Handlers**
   - Create the `api_handlers.go` file
   - Implement all the required endpoints
   - Create integration tests for the API

2. **Create the Main Application**
   - Implement the `main.go` file
   - Add command-line flags for configuration
   - Test the application startup and shutdown

3. **Set up Cross-Compilation**
   - Create the `Makefile` and `cross-compile.sh` script
   - Test building for different platforms

### Phase 3: TypeScript Integration (Weeks 5-6)

1. **Implement the TypeScript Agent Manager**
   - Create the `agent-manager.ts` file
   - Implement all the required methods
   - Create unit tests for the manager

2. **Integrate with the Frontend**
   - Add the agent manager to the frontend
   - Create UI components for agent management
   - Test the integration

### Phase 4: Testing and Optimization (Weeks 7-8)

1. **Comprehensive Testing**
   - Create end-to-end tests for the entire system
   - Test with different agent types and configurations
   - Test cross-platform compatibility

2. **Performance Optimization**
   - Identify and address performance bottlenecks
   - Optimize database queries
   - Implement caching where appropriate

3. **Security Hardening**
   - Implement input validation
   - Add authentication and authorization
   - Conduct security testing

### Phase 5: Documentation and Deployment (Weeks 9-10)

1. **Create Documentation**
   - Write user documentation
   - Create API documentation
   - Document the architecture and design decisions

2. **Prepare for Deployment**
   - Create installation scripts
   - Set up CI/CD pipelines
   - Prepare release packages

3. **Final Testing and Release**
   - Conduct final testing
   - Address any remaining issues
   - Release the first version

## Conclusion

This implementation plan provides a comprehensive approach to integrating Google's Agent Development Kit (ADK) with our existing Inference Engine. By using chromem-go for agent storage and embedding the Python code in the Go binary, we can create a single executable that works across Windows, Linux, and Mac.

The integration leverages the strengths of each language:
- **Go**: Provides a robust API layer and handles agent creation
- **Python**: Handles the ADK integration and agent execution
- **TypeScript**: Offers a flexible frontend for agent management

The use of ADK's advanced features such as callbacks, state management, and parallel agents addresses the technical considerations we identified earlier, ensuring a robust and scalable solution.