# Authentication Implementation Plan for Agentify

## Overview

This document outlines the implementation plan for adding authentication to the Agentify application. The authentication system will:

1. Keep the site open for demo purposes
2. Require registration when the user first clicks the "Register Agent" button in the AgentConfig component
3. Utilize the existing Supabase implementation for authentication

## Current State Analysis

The application already has a robust Supabase authentication infrastructure in place:

- **Supabase Auth Service**: A singleton service that handles authentication operations
- **Auth Context**: React context for managing auth state throughout the application
- **Login Modal**: UI component for sign-in/sign-up
- **Netlify Auth Function**: Serverless function for handling auth operations

However, these components are not currently connected to the "Register Agent" flow in the application.

## Implementation Plan

### 1. Update the Header Sign-In Button

The application already has a sign-in button in the header (in the `Index.tsx` component) that opens the login modal. We need to ensure this button works properly with our authentication flow:

```typescript
// In src/components/Index.tsx
// The component already has:
const [loginModalOpen, setLoginModalOpen] = useState(false);
const { isAuthenticated, user, logout } = useAuth();

// And the button in the header:
{isAuthenticated && user ? (
  <div className="flex items-center space-x-2">
    <div className="flex items-center space-x-2 text-white/70">
      {user.picture && (
        <img
          src={user.picture}
          alt={user.name}
          className="w-6 h-6 rounded-full"
        />
      )}
      <span className="text-sm">Hello, {user.name}</span>
    </div>
    <Button
      variant="ghost"
      onClick={logout}
      className="text-white/70 hover:text-white hover:bg-white/10 text-sm"
    >
      Logout
    </Button>
  </div>
) : (
  <Button
    variant="outline"
    onClick={() => setLoginModalOpen(true)}
    className="border-purple-400/50 text-purple-400 hover:bg-purple-400/10 hover:text-purple-300"
  >
    Sign In
  </Button>
)}

// Add the LoginModal component to the JSX:
<LoginModal 
  open={loginModalOpen} 
  onOpenChange={setLoginModalOpen} 
  onLoginSuccess={() => {
    // Handle any post-login actions if needed
    toast({
      title: "Login Successful",
      description: "Welcome back to Agentify!",
    });
  }}
/>
```

### 2. Modify the AgentConfig Component

Update the `handleRegisterAgent` function in `src/components/AgentConfig.tsx` to check authentication status before registering an agent:

```typescript
const handleRegisterAgent = () => {
  // Check if user is authenticated
  if (!auth.isAuthenticated) {
    // Open login modal
    setLoginModalOpen(true);
    
    // Store the intent to register agent after login
    localStorage.setItem('auth-intent', 'register-agent');
    
    return;
  }
  
  // Existing registration logic
  setAgentRegistered(true);
  
  toast({
    title: "Agent Registered!",
    description: `${agentName} has been registered successfully. You can now access all tabs and process the configuration.`,
  });
  
  // Switch to API Keys tab after registration
  setActiveTab('api-keys');
};
```

### 2. Add Login Modal State to AgentConfig

Add state for controlling the login modal:

```typescript
// Add to existing state declarations
const [loginModalOpen, setLoginModalOpen] = useState(false);
```

And add the LoginModal component to the JSX:

```tsx
{/* Add this near the end of the component */}
<LoginModal 
  open={loginModalOpen} 
  onOpenChange={setLoginModalOpen} 
  onLoginSuccess={handleLoginSuccess}
/>
```

### 3. Update LoginModal Component

Modify the `LoginModal.tsx` component to properly handle authentication and redirect back to agent registration. This component will be used by both the header sign-in button and the agent registration flow:

```typescript
// Update the LoginModal props interface to include onLoginSuccess
interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess?: () => void;
}

// Add to LoginModal.tsx
const { signInWithEmail, signUpWithEmail, isAuthenticated } = useAuth();

// Update handleLogin function
const handleLogin = async () => {
  try {
    await signInWithEmail(email, password);
    onOpenChange(false);
    
    // Check if there was an intent to register agent
    const authIntent = localStorage.getItem('auth-intent');
    if (authIntent === 'register-agent') {
      localStorage.removeItem('auth-intent');
      // Trigger any callback provided by parent component
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }
  } catch (error) {
    console.error('Login failed:', error);
    toast({
      title: "Login Failed",
      description: error instanceof Error ? error.message : "Please check your credentials and try again",
      variant: "destructive"
    });
  }
};

// Update handleSignUp function
const handleSignUp = async () => {
  try {
    await signUpWithEmail(email, password);
    onOpenChange(false);
    
    // Check if there was an intent to register agent
    const authIntent = localStorage.getItem('auth-intent');
    if (authIntent === 'register-agent') {
      localStorage.removeItem('auth-intent');
      // Trigger any callback provided by parent component
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }
  } catch (error) {
    console.error('Sign up failed:', error);
    toast({
      title: "Sign Up Failed",
      description: error instanceof Error ? error.message : "Please check your information and try again",
      variant: "destructive"
    });
  }
};
```

### 4. Add Login Success Handler to AgentConfig

Add a handler for when login is successful:

```typescript
const handleLoginSuccess = () => {
  // Automatically trigger agent registration after successful login
  setAgentRegistered(true);
  
  toast({
    title: "Agent Registered!",
    description: `${agentName} has been registered successfully. You can now access all tabs and process the configuration.`,
  });
  
  // Switch to API Keys tab after registration
  setActiveTab('api-keys');
};
```

### 5. Update Auth Context Usage

Ensure the auth context is properly imported and used in the AgentConfig component:

```typescript
// Add to imports
import { useAuth } from '@/contexts/AuthContext';

// Inside component
const auth = useAuth();
```

### 6. Add Protected API Routes

Update the Netlify functions to check authentication for sensitive operations:

```javascript
// Example for a protected API route
const { getUser } = require('./auth');

exports.handler = async (event, context) => {
  // Verify authentication
  const { user, error } = await getUser(event);
  
  if (error || !user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Authentication required' })
    };
  }
  
  // Continue with protected operation
  // ...
};
```

### 7. Update Supabase Schema

Create a table to store user-agent relationships. Execute this SQL in your Supabase SQL editor:

```sql
-- Create user_agents table
CREATE TABLE user_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  agent_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, agent_id)
);

-- Add RLS policies
ALTER TABLE user_agents ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own agents
CREATE POLICY "Users can view their own agents"
  ON user_agents FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own agents
CREATE POLICY "Users can insert their own agents"
  ON user_agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own agents
CREATE POLICY "Users can update their own agents"
  ON user_agents FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to delete their own agents
CREATE POLICY "Users can delete their own agents"
  ON user_agents FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_agents_updated_at
    BEFORE UPDATE ON user_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 8. Add Agent Registration API

First, create a Next.js API route that will be automatically migrated to a Netlify function by the migration script:

```typescript
// src/app/api/register-agent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get the session token from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse request body
    const { agentId, agentName } = await request.json();

    // Insert agent record
    const { data, error: insertError } = await supabase
      .from('user_agents')
      .insert([
        { 
          user_id: user.id,
          agent_id: agentId,
          agent_name: agentName
        }
      ]);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Agent registration error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// This will be automatically migrated to:
// netlify/functions/api-register-agent.js
// by the migration script during build
```

### 9. Update AgentConfig to Use the Registration API

Modify the `handleRegisterAgent` function to call the registration API:

```typescript
const handleRegisterAgent = async () => {
  // Check if user is authenticated
  if (!auth.isAuthenticated) {
    // Open login modal
    setLoginModalOpen(true);
    
    // Store the intent to register agent after login
    localStorage.setItem('auth-intent', 'register-agent');
    
    return;
  }
  
  try {
    // Call the registration API
    const response = await fetch('/.netlify/functions/api-register-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.user?.accessToken}`
      },
      body: JSON.stringify({
        agentId: agentFacts.id,
        agentName: agentName
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to register agent');
    }
    
    // Update UI state
    setAgentRegistered(true);
    
    toast({
      title: "Agent Registered!",
      description: `${agentName} has been registered successfully. You can now access all tabs and process the configuration.`,
    });
    
    // Switch to API Keys tab after registration
    setActiveTab('api-keys');
  } catch (error) {
    console.error('Agent registration failed:', error);
    toast({
      title: "Registration Failed",
      description: error instanceof Error ? error.message : "Failed to register agent",
      variant: "destructive"
    });
  }
};
```

## Demo Mode Considerations

To keep the site open for demo purposes while still requiring authentication for agent registration:

1. **Public Access**: All pages and components remain publicly accessible
2. **Gated Functionality**: Only the "Register Agent" button triggers the authentication flow
3. **Demo Indicators**: Add visual indicators for demo vs. authenticated mode
4. **Header Sign-In**: The sign-in button in the header allows users to authenticate at any time, but it's not required for browsing
5. **Consistent State**: Ensure authentication state is consistent between the header and the agent registration flow

```tsx
// Example of demo mode indicator in AgentConfig
{!auth.isAuthenticated && (
  <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4 rounded">
    <p className="font-medium">Demo Mode</p>
    <p>You're currently in demo mode. Click "Register Agent" to create an account and save your work.</p>
  </div>
)}
```

## Implementation Steps

1. Update the Supabase schema to add the user_agents table
2. Create the Next.js API route for agent registration (will be migrated to Netlify function)
3. Ensure the header sign-in button works with the LoginModal component
4. Modify the AgentConfig component to check authentication
5. Update the LoginModal component to handle post-login redirection
6. Add demo mode indicators throughout the application
7. Implement consistent auth state management between header and agent registration
8. Run the migration script to convert the API route to a Netlify function
9. Test the authentication flow end-to-end

## Security Considerations

1. **Token Storage**: Ensure tokens are securely stored in browser storage
2. **API Protection**: All sensitive API endpoints should verify authentication
3. **CORS Settings**: Configure proper CORS settings for API endpoints
4. **Rate Limiting**: Implement rate limiting for authentication endpoints
5. **Error Messages**: Use generic error messages that don't reveal system details

## API Migration Considerations

The application uses a migration script (`scripts/migrate-api-to-netlify.js`) that automatically converts Next.js API routes to Netlify functions during the build process. This ensures:

1. **Development Consistency**: Developers can work with familiar Next.js API routes
2. **Production Readiness**: API routes are automatically converted to Netlify functions
3. **Path Consistency**: Client-side code can use the same API paths (`/.netlify/functions/api-*`)

When implementing new API routes for authentication:

1. Create the route in `src/app/api/[route-name]/route.ts` using Next.js App Router format
2. The migration script will automatically convert it to `netlify/functions/api-[route-name].js`
3. Client-side code should reference the path as `/.netlify/functions/api-[route-name]`

For example, our agent registration API:
- Development: `src/app/api/register-agent/route.ts`
- Production: `netlify/functions/api-register-agent.js`
- Client reference: `/.netlify/functions/api-register-agent`

## Future Enhancements

1. **User Dashboard**: Add a dashboard for users to view and manage their registered agents
2. **Team Collaboration**: Allow sharing agents with team members
3. **OAuth Providers**: Add more OAuth providers (GitHub, Microsoft, etc.)
4. **MFA Support**: Implement multi-factor authentication for enhanced security
5. **Session Management**: Add the ability to view and manage active sessions
6. **User Profile**: Add a user profile page where users can update their information
7. **Persistent Login State**: Improve the persistence of login state across browser sessions
8. **Header Enhancements**: Add a dropdown menu to the header with user-specific actions