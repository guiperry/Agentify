-- Initial schema for Next-Agentify
-- Creates tables for agent configurations, API keys, and compilation history
-- Implements Row Level Security (RLS) for user data isolation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agent configurations table
-- Stores user-specific agent identity, personality, and capabilities
CREATE TABLE agent_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  identity JSONB,
  personality JSONB,
  capabilities JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one config per user (can be relaxed later for multiple agents)
  UNIQUE(user_id)
);

-- Encrypted API keys table
-- Stores user's LLM provider API keys securely
CREATE TABLE user_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  encrypted_keys JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one API key set per user
  UNIQUE(user_id)
);

-- Compilation history table
-- Tracks agent compilation attempts and results
CREATE TABLE compilation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_config_id UUID REFERENCES agent_configs(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('running', 'completed', 'failed')) NOT NULL DEFAULT 'running',
  logs TEXT,
  download_url TEXT,
  error_message TEXT,
  compilation_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Deployment history table
-- Tracks agent deployment attempts and results
CREATE TABLE deployment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  compilation_id UUID REFERENCES compilation_history(id) ON DELETE CASCADE,
  deployment_url TEXT,
  status TEXT CHECK (status IN ('deploying', 'deployed', 'failed')) NOT NULL DEFAULT 'deploying',
  logs TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_agent_configs_user_id ON agent_configs(user_id);
CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX idx_compilation_history_user_id ON compilation_history(user_id);
CREATE INDEX idx_compilation_history_status ON compilation_history(status);
CREATE INDEX idx_deployment_history_user_id ON deployment_history(user_id);
CREATE INDEX idx_deployment_history_status ON deployment_history(status);

-- Enable Row Level Security (RLS)
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE compilation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_configs
CREATE POLICY "Users can only access their own agent configs" ON agent_configs
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_api_keys  
CREATE POLICY "Users can only access their own API keys" ON user_api_keys
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for compilation_history
CREATE POLICY "Users can only access their own compilation history" ON compilation_history
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for deployment_history
CREATE POLICY "Users can only access their own deployment history" ON deployment_history
  FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_agent_configs_updated_at BEFORE UPDATE ON agent_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_api_keys_updated_at BEFORE UPDATE ON user_api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
