# Agent Compilation Guide

This guide explains how to use the full Go compilation support in Agentify.

## Overview

The Agentify compiler generates:
- **Go code** for the agent core with multi-agent orchestration
- **Python service** for agent logic and LLM interactions
- **Configuration files** for agent settings and API keys
- **Shared libraries** (.so, .dll, .dylib) for platform-specific deployment

## Prerequisites

### Required Tools

1. **Go 1.21+** - For compiling agent plugins
2. **Python 3.8+** - For agent service scripts
3. **GCC/Clang** - For C shared library compilation
4. **Node.js 18+** - For the build system

### Automatic Installation

The system can automatically install missing tools:

```bash
# Install all required tools
npm run install-toolchain

# Check what tools are available
npm run check-toolchain
```

### Manual Installation

#### Go Installation
```bash
# Linux/macOS
curl -L https://golang.org/dl/go1.21.5.linux-amd64.tar.gz | sudo tar -C /usr/local -xzf -
export PATH=$PATH:/usr/local/go/bin

# Windows
# Download from https://golang.org/dl/go1.21.5.windows-amd64.msi
```

#### Python Installation
```bash
# Ubuntu/Debian
sudo apt-get install python3 python3-pip python3-venv

# macOS
brew install python3

# Windows
# Download from https://python.org
```

## Build Scripts

### Setup Build Environment
```bash
npm run setup
```
Creates necessary directories and placeholder files.

### Full Build with Toolchain
```bash
npm run build
```
Installs toolchain (if needed) and builds the application.

### Development Mode
```bash
# Mock compilation (no toolchain required)
npm run dev

# Real compilation mode
npm run dev:real
```

## Compilation Process

### 1. Template Processing

The compiler processes Go templates with agent configuration:

- `main.go.template` → Core agent functionality
- `go.mod.template` → Go module dependencies
- `agent_service.py.template` → Python service
- `resources.go.template` → Embedded resources
- `tool.go.template` → Tool implementations

### 2. Code Generation

Generated files include:
- `main.go` - Agent plugin entry point
- `go.mod` - Go module configuration
- `agent_service.py` - Python service
- `requirements.txt` - Python dependencies
- `config.env` - Environment configuration
- `tool_*.go` - Individual tool implementations

### 3. Compilation

The Go compiler builds a plugin binary:
```bash
go build -buildmode=plugin -o agent_plugin.so .
```

### 4. Output

Compiled plugins are stored in `public/output/plugins/`:
- Linux: `agent_[id]_[version].so`
- macOS: `agent_[id]_[version].dylib`
- Windows: `agent_[id]_[version].dll`

## Testing Compilation

### Test the Full Pipeline
```bash
npm run test-compilation
```

This creates a test agent and verifies the entire compilation process.

### Manual Testing

```javascript
const { createAgentCompilerService } = require('./src/lib/compiler/agent-compiler-interface');

async function testCompile() {
  const compiler = await createAgentCompilerService();
  
  const config = {
    name: 'Test Agent',
    personality: 'helpful',
    instructions: 'You are a test agent.',
    features: { chat: true },
    settings: { creativity: 0.7 }
  };
  
  const pluginConfig = compiler.convertUIConfigToPluginConfig(config);
  const pluginPath = await compiler.compileAgent(pluginConfig);
  
  console.log('Plugin created:', pluginPath);
}
```

## Deployment

### Netlify Configuration

The `netlify.toml` file automatically:
1. Installs the toolchain
2. Sets up build environment
3. Compiles the application

### Environment Variables

Set these in your deployment environment:
- `NODE_ENV=production`
- `GO_VERSION=1.21`
- `PYTHON_VERSION=3.11`

### Cross-Platform Compilation

Set environment variables for target platform:
```bash
# For Windows
export GOOS=windows
export GOARCH=amd64

# For macOS
export GOOS=darwin
export GOARCH=amd64

# For Linux ARM64
export GOOS=linux
export GOARCH=arm64
```

## Troubleshooting

### Common Issues

1. **Go not found**
   ```bash
   npm run install-toolchain
   # or manually install Go and add to PATH
   ```

2. **Python dependencies fail**
   ```bash
   pip3 install flask requests
   ```

3. **Build tools missing**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install build-essential
   
   # macOS
   xcode-select --install
   ```

4. **Permission errors**
   ```bash
   # Make scripts executable
   chmod +x scripts/*.js
   ```

### Debug Mode

Keep build artifacts for debugging:
```bash
export NODE_ENV=development
npm run test-compilation
```

Build files will be preserved in `public/output/temp/`.

### Logs

Check compilation logs:
- Build output in terminal
- Go compilation errors
- Python service startup logs

## Advanced Configuration

### Custom Templates

Add custom templates to `src/lib/compiler/templates/`:
- Follow the `.template` naming convention
- Use `{{.variableName}}` for substitutions
- Test with `npm run test-compilation`

### Tool Development

Create custom tools by:
1. Adding tool configuration to agent config
2. Implementing tool logic in `tool.go.template`
3. Testing with the compilation pipeline

### Resource Embedding

Embed files and data:
```javascript
const config = {
  resources: [
    {
      name: 'config_file',
      type: 'json',
      content: JSON.stringify(data),
      isEmbedded: true
    }
  ]
};
```

## Performance

### Build Times
- Initial toolchain install: 2-5 minutes
- Go compilation: 10-30 seconds
- Template processing: 1-2 seconds

### Optimization
- Use build caching in CI/CD
- Pre-install toolchain in Docker images
- Enable Go module caching

## Support

For issues with compilation:
1. Check the troubleshooting section
2. Run `npm run check-toolchain`
3. Test with `npm run test-compilation`
4. Check build logs for specific errors
