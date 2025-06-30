# Agentify: AI Agent Development Platform

## Project Overview

Agentify is a comprehensive platform for building, configuring, and deploying AI agents with enhanced developer experience. It provides a user-friendly interface for creating custom AI agents that can be integrated with various applications and services.

**Project URL**: https://ai-agentify.vercel.app/

## Key Features

- **Visual Agent Configuration**: Intuitive UI for configuring AI agent personality, capabilities, and behavior
- **Agent Compilation**: Full-featured compilation service for agent configurations
- **Multi-Platform Support**: Build agents for Windows, macOS, and Linux
- **LLM Integration**: Connect to various LLM providers including Google Gemini, OpenAI, and more
- **Tool Configuration**: Define custom tools for your agents with rich parameter types
- **Secure Credential Management**: Encrypted API key storage with Supabase
- **Real-time Updates**: Server-Sent Events (SSE) for compilation and deployment progress
- **Multi-Language Subagents**: Create and manage subagents in different programming languages
- **Testing and Debugging**: Comprehensive tools for testing and debugging agents
- **User Authentication**: Supabase authentication with Google OAuth support

## Technical Architecture

Agentify uses a modern full-stack architecture:

### 1. Frontend Application

- **Framework**: Next.js 14+ with TypeScript
- **UI Components**: shadcn-ui (Radix UI + Tailwind CSS)
- **State Management**: React Context API and React Query
- **Routing**: Next.js App Router
- **Authentication**: Supabase Auth with JWT
- **Real-time Updates**: Server-Sent Events (SSE)

The frontend provides a step-by-step workflow for:
- User authentication and profile management
- Connecting to applications
- Configuring agent personality and capabilities
- Deploying agents to target platforms
- Monitoring agent performance

### 2. Backend Services

- **Hosting**: Vercel (full Next.js application)
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Compilation Service**: Integrated Go-based compilation system
- **Real-time Updates**: Server-Sent Events (SSE)
- **GitHub Actions**: Fallback compilation service when needed

The backend provides:
- API endpoints for validating and compiling agent configurations
- Long-running compilation processes with real-time status updates
- Plugin binary generation with full system access
- Secure API key management with encryption
- User data persistence with row-level security

## Agent Compilation Process

The agent compilation process runs on the Vercel-hosted Next.js application, allowing for:
- Access to system resources (file system, process execution)
- Dependency management (Go, Python, GCC/Clang)
- Cross-platform compilation
- Secure credential handling

The compiler generates:
- Go code for the agent core
- Python service for agent logic
- Configuration files for agent settings
- Shared libraries (.so, .dll, .dylib) for platform-specific deployment

## Getting Started

### Prerequisites

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- For real compiler functionality:
  - Go 1.18+
  - Python 3.6+
  - GCC/Clang (for C shared library compilation)

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm i

# Step 4: Configure environment variables (see Configuration section below)
cp .env.example .env
# Edit .env with your API keys

# Step 5: Start the development environment (frontend + backend)
npm run dev
```

### Configuration

#### Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

```bash
# Gemini API Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key-here
NEXT_PUBLIC_GEMINI_MODEL_NAME=gemini-1.5-flash

# Server Configuration
PORT=3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# GitHub Actions Configuration (Optional)
GITHUB_TOKEN=your-github-token
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-repository-name
GITHUB_WORKFLOW_ID=compile-plugin.yml

# Google OAuth Configuration (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com

# Security
API_KEY_ENCRYPTION_KEY=your-32-character-encryption-key
```

#### Google OAuth Setup (Optional)

To enable Google login functionality:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google Identity Services
4. Go to "Credentials" and create OAuth 2.0 credentials (Web application)
5. Add your domain to authorized origins:
   - For development: `http://localhost:3000`
   - For production: your deployed domain
6. Copy the Client ID and add it to your `.env` file as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

If Google OAuth is not configured, the login modal will show a disabled Google login button with a message indicating that Google OAuth is not configured.

### Development Modes

#### Mock Compiler Mode (Default)

For frontend development without real compilation:

```bash
# Run the Next.js development server with mock compiler
npm run dev
```

#### Real Compiler Mode

For full functionality with actual plugin compilation:

```bash
# Install required toolchain (Go, Python, build tools)
npm run install-toolchain

# Build the TypeScript compiler service
npm run build:compiler

# Run the Next.js server with the real compiler
npm run dev:real

# Test the compilation pipeline
npm run test-compilation

# Test GitHub Actions compilation
npm run test-github-actions

# Build for production
npm run build

# Start the production server
npm run start
```

See [COMPILATION_GUIDE.md](docs/COMPILATION_GUIDE.md) for detailed compilation documentation.

### Accessing the Application

- **Development**: http://localhost:3000
- **Production**: https://ai-agentify.vercel.app/
- **API Endpoints**: /api/*
- **Compiled Plugins**: /api/output/plugins/

## Project Structure

```
agentify/
├── app/                  # Next.js App Router
│   ├── api/              # API Routes
│   ├── (routes)/         # Application routes
│   └── layout.tsx        # Root layout
├── components/           # React components
├── contexts/             # React context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── services/             # API services
├── utils/                # Utility functions
├── server/               # Backend server code
│   ├── services/         # Backend services
│   └── build-compiler.js # Compiler build script
├── inference/            # Inference engine code
├── docs/                 # Documentation
├── examples/             # Example configurations
├── public/               # Static assets
└── next.config.js        # Next.js configuration
```

## Advanced Features

### Model Context Protocol (MCP) Servers

Agentify supports connecting agents to MCP servers for enhanced capabilities:
- File system access
- Database connections
- API integrations
- Custom tool implementations

### Agent Deployment Options

Agents can be deployed in various ways:
- As standalone applications
- As plugins for existing applications
- As API services
- As embedded components with a blockchain

### Subagent Management

Agents can create and manage subagents with:
- Different programming languages (Python, JavaScript)
- Specialized capabilities
- Resource limitations
- Independent model providers

## Contributing

Contributions are welcome! See the [developer guide](./docs/developer-guide.md) for more information on how to contribute to the project.

## Deployment

This project is deployed on Vercel as a full Next.js application. You can deploy your own instance by:

1. Fork the repository
2. Connect it to your Vercel account
3. Configure the required environment variables

### Custom Domain

To connect a custom domain to your Vercel deployment:
1. Navigate to your project in the Vercel dashboard
2. Go to Settings > Domains
3. Add your custom domain and follow the verification steps

## License

This project is licensed under the terms specified in the project repository.

## Additional Resources

- [Server Documentation](./server/README.md)
- [Developer Guide](./docs/developer-guide.md)
- [Change Log](./CHANGES.md)
- [Example Configurations](./examples/)
