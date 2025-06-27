-- Supabase schema for Next Agentify

-- Table for storing compilation requests
CREATE TABLE IF NOT EXISTS compilation_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    job_id TEXT,
    compilation_method TEXT DEFAULT 'local' CHECK (compilation_method IN ('local', 'github-actions')),
    download_url TEXT,
    error_message TEXT,
    logs TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table for storing agent configurations
CREATE TABLE IF NOT EXISTS agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    personality TEXT,
    instructions TEXT,
    features JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    build_target TEXT DEFAULT 'wasm' CHECK (build_target IN ('wasm', 'go')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing compiled plugins
CREATE TABLE IF NOT EXISTS compiled_plugins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_config_id UUID REFERENCES agent_configs(id) ON DELETE CASCADE,
    compilation_request_id UUID REFERENCES compilation_requests(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    download_url TEXT NOT NULL,
    file_size BIGINT,
    build_target TEXT NOT NULL,
    platform TEXT NOT NULL,
    compilation_method TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_compilation_requests_user_id ON compilation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_compilation_requests_status ON compilation_requests(status);
CREATE INDEX IF NOT EXISTS idx_compilation_requests_job_id ON compilation_requests(job_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_user_id ON agent_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_compiled_plugins_user_id ON compiled_plugins(user_id);
CREATE INDEX IF NOT EXISTS idx_compiled_plugins_expires_at ON compiled_plugins(expires_at);

-- Row Level Security (RLS) policies
ALTER TABLE compilation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compiled_plugins ENABLE ROW LEVEL SECURITY;

-- Policies for compilation_requests
CREATE POLICY "Users can view their own compilation requests" ON compilation_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own compilation requests" ON compilation_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own compilation requests" ON compilation_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for agent_configs
CREATE POLICY "Users can view their own agent configs" ON agent_configs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent configs" ON agent_configs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent configs" ON agent_configs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent configs" ON agent_configs
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for compiled_plugins
CREATE POLICY "Users can view their own compiled plugins" ON compiled_plugins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own compiled plugins" ON compiled_plugins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_compilation_requests_updated_at BEFORE UPDATE ON compilation_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_configs_updated_at BEFORE UPDATE ON agent_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired plugins
CREATE OR REPLACE FUNCTION cleanup_expired_plugins()
RETURNS void AS $$
BEGIN
    DELETE FROM compiled_plugins WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- You can set up a cron job to run this function periodically
-- SELECT cron.schedule('cleanup-expired-plugins', '0 2 * * *', 'SELECT cleanup_expired_plugins();');
