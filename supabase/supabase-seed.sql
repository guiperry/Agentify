-- Agentify Database Seed Script for Testing (Simplified Version)
-- Execute this SQL in your Supabase SQL editor

-- Create user_agents table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  agent_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, agent_id)
);

-- Add RLS policies for security (will fail silently if already exist)
ALTER TABLE user_agents ENABLE ROW LEVEL SECURITY;

-- Create policies (these will error if they already exist, but the script will continue)
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can view their own agents" 
      ON user_agents FOR SELECT 
      USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  BEGIN
    CREATE POLICY "Users can insert their own agents" 
      ON user_agents FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  BEGIN
    CREATE POLICY "Users can update their own agents" 
      ON user_agents FOR UPDATE 
      USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  BEGIN
    CREATE POLICY "Users can delete their own agents" 
      ON user_agents FOR DELETE 
      USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END
$$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger (will fail silently if already exists)
DO $$
BEGIN
  BEGIN
    CREATE TRIGGER update_user_agents_updated_at 
        BEFORE UPDATE ON user_agents 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END
$$;

-- Create indexes (will fail silently if already exist)
DO $$
BEGIN
  BEGIN
    CREATE INDEX idx_user_agents_user_id ON user_agents(user_id);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  BEGIN
    CREATE INDEX idx_user_agents_agent_id ON user_agents(agent_id);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END
$$;

-- Create admin user if it doesn't exist
DO $$
DECLARE
    admin_uid UUID;
    admin_exists BOOLEAN;
BEGIN
    -- Check if admin user already exists
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'admin@example.com') INTO admin_exists;
    
    IF NOT admin_exists THEN
        -- Create admin user with email/password
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            uuid_generate_v4(),
            'authenticated',
            'authenticated',
            'admin@example.com',
            crypt('password123', gen_salt('bf')), -- Use a strong password in production!
            now(),
            now(),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Admin User"}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO admin_uid;
        
        -- Create a sample agent for the admin user
        INSERT INTO public.user_agents (
            user_id,
            agent_id,
            agent_name,
            agent_config
        )
        VALUES (
            admin_uid,
            'test-agent-' || substr(md5(random()::text), 1, 8),
            'Test Agent',
            '{
                "name": "Test Agent",
                "type": "custom",
                "personality": "helpful",
                "instructions": "You are a helpful AI assistant for testing purposes.",
                "features": {
                    "chat": true,
                    "automation": true,
                    "analytics": true,
                    "notifications": false
                },
                "agentFacts": {
                    "id": "test-agent-id",
                    "agent_name": "Test Agent",
                    "capabilities": {
                        "modalities": ["text", "structured_data"],
                        "skills": ["analysis", "synthesis", "research"]
                    },
                    "endpoints": {
                        "static": ["https://api.provider.com/v1/chat"],
                        "adaptive_resolver": {
                            "url": "https://resolver.provider.com/capabilities",
                            "policies": ["capability_negotiation", "load_balancing"]
                        }
                    },
                    "certification": {
                        "level": "verified",
                        "issuer": "NANDA",
                        "attestations": ["privacy_compliant", "security_audited"]
                    }
                },
                "settings": {
                    "creativity": 0.7,
                    "mcpServers": []
                }
            }'
        );
        
        RAISE NOTICE 'Admin user created with ID: %', admin_uid;
    ELSE
        RAISE NOTICE 'Admin user already exists';
    END IF;
END
$$;

-- Output success message
SELECT 'Database seeded successfully with admin user (admin@example.com) and test agent' as result;