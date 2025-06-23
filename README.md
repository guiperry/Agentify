# Agentify: AI Agent Development Platform

## Project Overview

Agentify is a comprehensive platform for building, configuring, and deploying AI agents with enhanced developer experience. It provides a user-friendly interface for creating custom AI agents that can be integrated with various applications and services.

**Project URL**: https://agentify-nextjs.netlify.app/

## Key Features

- **Visual Agent Configuration**: Intuitive UI for configuring AI agent personality, capabilities, and behavior
- **Agent Compilation**: Backend service that compiles agent configurations into deployable plugins
- **Multi-Platform Support**: Build agents for Windows, macOS, and Linux
- **LLM Integration**: Connect to various LLM providers including OpenAI, Google, Cerebras, and more
- **Tool Configuration**: Define custom tools for your agents with rich parameter types
- **Credential Management**: Secure handling of API keys and other sensitive information
- **Terminal UI**: Interactive terminal interface for agent interaction
- **Multi-Language Subagents**: Create and manage subagents in different programming languages
- **Testing and Debugging**: Comprehensive tools for testing and debugging agents

## Technical Architecture

Agentify consists of two main components:

### 1. Frontend Application

- **Framework**: Next.js with TypeScript
- **UI Components**: shadcn-ui (Radix UI + Tailwind CSS)
- **State Management**: React Context API
- **Routing**: Next.js App Router
- **API Integration**: Next.js API Routes and React Query

The frontend provides a step-by-step workflow for:
- Connecting to applications
- Configuring agent personality and capabilities
- Deploying agents to target platforms
- Monitoring agent performance

### 2. Backend Server

- **Framework**: Express.js
- **Language**: Node.js with TypeScript
- **Compiler Service**: Go-based compilation system
- **Database**: SQLite for persistence

The backend server provides:
- API endpoints for compiling agent configurations
- Real-time compilation status updates
- Plugin binary generation
- Dependency management for compilation

## Agent Compilation Process

The agent compilation process has been moved from client-side to a backend server, allowing for:
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

# Google OAuth Configuration (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
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

# Run just the backend with mock compiler
npm run server
# or with auto-restart
npm run server:dev
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

# Build for production
npm run build

# Start the production server
npm run start
```

See [COMPILATION_GUIDE.md](docs/COMPILATION_GUIDE.md) for detailed compilation documentation.

### Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3000/api
- **Compiled Plugins**: http://localhost:3000/api/output/plugins/

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
- As embedded components

### Subagent Management

Agents can create and manage subagents with:
- Different programming languages (Python, JavaScript)
- Specialized capabilities
- Resource limitations
- Independent model providers

## Contributing

Contributions are welcome! See the [developer guide](./docs/developer-guide.md) for more information on how to contribute to the project.

## Deployment

You can deploy this project through [Lovable](https://lovable.dev/projects/861858ee-b997-4235-b6c8-e39849fa6c69) by clicking on Share -> Publish.

### Custom Domain

To connect a custom domain to your deployed project:
1. Navigate to Project > Settings > Domains
2. Click Connect Domain
3. Follow the instructions in the [custom domain setup guide](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## License

This project is licensed under the terms specified in the project repository.

## Additional Resources

- [Server Documentation](./server/README.md)
- [Developer Guide](./docs/developer-guide.md)
- [Change Log](./CHANGES.md)
- [Example Configurations](./examples/)
