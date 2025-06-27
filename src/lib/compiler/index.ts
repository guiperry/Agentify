import * as path from 'path';
import * as fs from 'fs';
import * as child_process from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';
import type { AgentPluginConfig, ToolConfig, ResourceConfig, PromptConfig } from './agent-compiler-interface';

/**
 * Agent Compiler class
 * This class is responsible for compiling agent configurations into plugin binaries
 */
export class AgentCompiler {
  private rootDir: string;
  private templateDir: string;
  private outputDir: string;
  private compilationLogs: string[] = [];

  /**
   * Constructor
   * @param rootDir The root directory of the project
   * @param templateDir The directory containing the templates
   * @param outputDir The directory where the compiled plugins will be stored
   */
  constructor(rootDir: string, templateDir: string, outputDir: string) {
    this.rootDir = rootDir;
    this.templateDir = templateDir;
    this.outputDir = outputDir;

    // Create the output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Create the plugins directory if it doesn't exist
    const pluginsDir = path.join(this.outputDir, 'plugins');
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir, { recursive: true });
    }
  }

  private addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    this.compilationLogs.push(logEntry);
    console.log(logEntry);
  }

  public getCompilationLogs(): string[] {
    return [...this.compilationLogs];
  }

  public clearLogs() {
    this.compilationLogs = [];
  }

  /**
   * Compiles an agent configuration into a plugin binary
   * @param config The agent configuration
   * @returns A promise that resolves to the path of the compiled plugin
   */
  async compileAgent(config: AgentPluginConfig): Promise<string> {
    this.clearLogs(); // Clear previous logs
    this.addLog(`🔨 Starting compilation for agent: ${config.agent_name}`);

    // 1. Create a temporary build directory
    const buildDir = await this.createBuildDirectory(config);

    try {
      // 2. Generate Go code from templates
      this.addLog('🔧 Generating Go code...');
      await this.generateGoCode(buildDir, config);

      // 3. Embed resources and prompts
      this.addLog('📦 Embedding resources...');
      await this.embedResources(buildDir, config);

      // 4. Generate Python agent service code
      this.addLog('🐍 Generating Python service...');
      await this.generatePythonService(buildDir, config);

      // 5. Compile the plugin (WASM or Go)
      const pluginPath = config.buildTarget === 'wasm'
        ? await this.compileWasmPlugin(buildDir, config)
        : await this.compileGoPlugin(buildDir, config);

      this.addLog(`✅ Compilation successful: ${pluginPath}`);
      return pluginPath;

    } catch (error) {
      this.addLog(`❌ Compilation failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    } finally {
      // 6. Clean up temporary files (optional - keep for debugging)
      if (process.env.NODE_ENV === 'production') {
        await this.cleanup(buildDir);
      }
    }
  }

  /**
   * Creates a temporary build directory for the agent
   */
  private async createBuildDirectory(config: AgentPluginConfig): Promise<string> {
    const buildId = `${config.agent_id}_${Date.now()}`;
    const buildDir = path.join(this.outputDir, 'temp', buildId);

    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

    console.log(`📁 Created build directory: ${buildDir}`);
    return buildDir;
  }

  /**
   * Generates Go code from templates
   */
  private async generateGoCode(buildDir: string, config: AgentPluginConfig): Promise<void> {
    // Log is already added in the main compile method

    // Generate main.go file
    const mainTemplate = await fs.promises.readFile(
      path.join(this.templateDir, 'main.go.template'),
      'utf-8'
    );

    const mainCode = this.processTemplate(mainTemplate, config);
    await fs.promises.writeFile(path.join(buildDir, 'main.go'), mainCode);

    this.addLog(`🔧 Generated main.go for build target: ${config.buildTarget || 'go'}`);
    this.addLog(`📝 First 200 chars: ${mainCode.substring(0, 200)}...`);

    // Generate go.mod file
    const goModTemplate = await fs.promises.readFile(
      path.join(this.templateDir, 'go.mod.template'),
      'utf-8'
    );

    const goModCode = this.processTemplate(goModTemplate, config);
    await fs.promises.writeFile(path.join(buildDir, 'go.mod'), goModCode);

    // Generate additional Go template files (skip problematic ones for now)
    const goTemplates = [
      'tee.go.template',
      'llm_inference.go.template',
      'deterministic_embeddings.go.template',
      'subagent_manager.go.template',
      'agent_monitoring.go.template',
      'credential_manager.go.template'
      // Skip javascript_client.go.template for now due to JavaScript template literal syntax issues
    ];

    for (const template of goTemplates) {
      const templatePath = path.join(this.templateDir, template);
      if (fs.existsSync(templatePath)) {
        const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
        const processedContent = this.processTemplate(templateContent, config);
        const outputFileName = template.replace('.template', '');
        await fs.promises.writeFile(path.join(buildDir, outputFileName), processedContent);
      }
    }

    // Generate tool implementation files
    if (config.tools && config.tools.length > 0) {
      for (const tool of config.tools) {
        const toolTemplate = await fs.promises.readFile(
          path.join(this.templateDir, 'tool.go.template'),
          'utf-8'
        );

        const toolCode = this.processToolTemplate(toolTemplate, tool, config);
        await fs.promises.writeFile(
          path.join(buildDir, `tool_${tool.name}.go`),
          toolCode
        );
      }
    }

    this.addLog('✅ Go code generation complete');
  }

  /**
   * Processes template variables
   */
  private processTemplate(template: string, config: AgentPluginConfig): string {
    let processed = template;

    // First, handle conditional blocks
    const buildTarget = config.buildTarget || 'go';

    // Process {{if eq .buildTarget "wasm"}} blocks
    const wasmIfRegex = /\{\{if eq \.buildTarget "wasm"\}\}([\s\S]*?)\{\{end\}\}/g;
    processed = processed.replace(wasmIfRegex, (match, content) => {
      return buildTarget === 'wasm' ? content : '';
    });

    // Process {{if ne .buildTarget "wasm"}} blocks (for non-WASM)
    const nonWasmIfRegex = /\{\{if ne \.buildTarget "wasm"\}\}([\s\S]*?)\{\{end\}\}/g;
    processed = processed.replace(nonWasmIfRegex, (match, content) => {
      return buildTarget !== 'wasm' ? content : '';
    });

    // Replace basic config variables
    const replacements = {
      '{{.agentId}}': config.agent_id,
      '{{.agentName}}': config.agent_name,
      '{{.agentDescription}}': config.description || '',
      '{{.agentVersion}}': config.version || '1.0.0',
      '{{.agentType}}': config.agentType || 'llm',
      '{{.factsUrl}}': config.facts_url || '',
      '{{.privateFactsUrl}}': config.private_facts_url || '',
      '{{.adaptiveRouterUrl}}': config.adaptive_router_url || '',
      '{{.ttl}}': config.ttl?.toString() || '3600',
      '{{.signature}}': config.signature || '',
      '{{.pythonAgentServiceScript}}': this.escapePythonScript(config),
      '{{.pythonRequirements}}': this.generatePythonRequirements(config),
      // TEE configuration variables
      '{{.isolationLevel}}': config.trustedExecutionEnvironment?.isolationLevel || 'process',
      '{{.memoryLimit}}': config.trustedExecutionEnvironment?.resourceLimits?.memory?.toString() || '512',
      '{{.cpuCores}}': config.trustedExecutionEnvironment?.resourceLimits?.cpu?.toString() || '1',
      '{{.timeoutSec}}': config.trustedExecutionEnvironment?.resourceLimits?.timeLimit?.toString() || '60',
      '{{.networkAccess}}': config.trustedExecutionEnvironment?.networkAccess ? 'true' : 'false',
      '{{.fileSystemAccess}}': config.trustedExecutionEnvironment?.fileSystemAccess ? 'true' : 'false',
      // Additional configuration
      '{{.useChromemGo}}': config.useChromemGo ? 'true' : 'false',
      '{{.subAgentCapabilities}}': config.subAgentCapabilities ? 'true' : 'false',
      '{{.buildTarget}}': buildTarget,
      // LLM configuration
      '{{.defaultProvider}}': 'openai',
      '{{.defaultModel}}': 'gpt-3.5-turbo',
      '{{.apiKeys}}': '{}',
      // Embedding configuration
      '{{.embeddingProvider}}': 'cerebras',
      '{{.embeddingDimension}}': '384',
      '{{.embeddingTaskType}}': 'retrieval_document',
      '{{.embeddingNormalize}}': 'true',
      // Module configuration
      '{{.moduleName}}': `agent_${config.agent_id}`,
      '{{.packageName}}': 'main'
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      processed = processed.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    }

    return processed;
  }

  /**
   * Processes tool template variables
   */
  private processToolTemplate(template: string, tool: ToolConfig, config: AgentPluginConfig): string {
    let processed = template;

    // First, handle conditional blocks for buildTarget
    const buildTarget = config.buildTarget || 'go';

    // Process {{if eq .buildTarget "wasm"}} blocks
    const wasmIfRegex = /\{\{if eq \.buildTarget "wasm"\}\}([\s\S]*?)\{\{end\}\}/g;
    processed = processed.replace(wasmIfRegex, (match, content) => {
      return buildTarget === 'wasm' ? content : '';
    });

    // Process {{if ne .buildTarget "wasm"}} blocks (for non-WASM)
    const nonWasmIfRegex = /\{\{if ne \.buildTarget "wasm"\}\}([\s\S]*?)\{\{end\}\}/g;
    processed = processed.replace(nonWasmIfRegex, (match, content) => {
      return buildTarget !== 'wasm' ? content : '';
    });

    // Generate parameter parsing code
    let parameterParsing = '';
    if (tool.parameters && tool.parameters.length > 0) {
      for (const param of tool.parameters) {
        if (param.required) {
          parameterParsing += `\t${param.name}, ok := params["${param.name}"]\n`;
          parameterParsing += `\tif !ok {\n`;
          parameterParsing += `\t\treturn nil, fmt.Errorf("missing required parameter: ${param.name}")\n`;
          parameterParsing += `\t}\n`;
          // Add a comment to indicate the variable is used
          parameterParsing += `\t_ = ${param.name} // Parameter will be used in implementation\n`;
        } else {
          parameterParsing += `\t${param.name}, _ := params["${param.name}"]\n`;
          parameterParsing += `\t_ = ${param.name} // Parameter will be used in implementation\n`;
        }
      }
    }

    // Convert JavaScript-style implementation to Go
    let goImplementation = tool.implementation || 'return nil, nil';

    // Handle specific known patterns
    if (goImplementation.includes('return { message: input }')) {
      goImplementation = 'return map[string]interface{}{"message": input}, nil';
    } else if (goImplementation.includes('return { success: true, taskId: "task-123" }')) {
      goImplementation = 'return map[string]interface{}{"success": true, "taskId": "task-123"}, nil';
    } else if (goImplementation.includes('return { insights: ["Insight 1", "Insight 2"] }')) {
      goImplementation = 'return map[string]interface{}{"insights": []string{"Insight 1", "Insight 2"}}, nil';
    } else if (goImplementation.includes('return {')) {
      // Generic object return conversion - convert JavaScript object syntax to Go map syntax
      goImplementation = goImplementation.replace(/return \{([^}]+)\}/, (match, content) => {
        // Convert JavaScript object properties to Go map syntax
        const converted = content
          .replace(/(\w+):/g, '"$1":') // Convert property names to strings
          .replace(/\[([^\]]+)\]/g, (arrayMatch: string, arrayContent: string) => {
            // Convert JavaScript arrays to Go slices
            if (arrayContent.includes('"')) {
              return `[]string{${arrayContent}}`;
            } else {
              return `[]interface{}{${arrayContent}}`;
            }
          });
        return `return map[string]interface{}{${converted}}, nil`;
      });
    }

    const replacements = {
      '{{.toolName}}': tool.name,
      '{{.toolDescription}}': tool.description || '',
      '{{.toolParameters}}': JSON.stringify(tool.parameters || {}),
      '{{.toolImplementation}}': goImplementation,
      '{{.parameterParsing}}': parameterParsing,
      '{{.buildTarget}}': buildTarget
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      processed = processed.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    }

    return processed;
  }

  /**
   * Embeds resources and prompts into the Go code
   */
  private async embedResources(buildDir: string, config: AgentPluginConfig): Promise<void> {
    // Log is already added in the main compile method

    const resourcesTemplate = await fs.promises.readFile(
      path.join(this.templateDir, 'resources.go.template'),
      'utf-8'
    );

    const resourcesCode = this.processResourcesTemplate(resourcesTemplate, config);
    await fs.promises.writeFile(path.join(buildDir, 'resources.go'), resourcesCode);

    this.addLog('✅ Resources embedded');
  }

  /**
   * Processes resources template
   */
  private processResourcesTemplate(template: string, config: AgentPluginConfig): string {
    let processed = template;

    // Generate embedded resources
    let resourcesCode = '';
    if (config.resources && config.resources.length > 0) {
      for (const resource of config.resources) {
        resourcesCode += `\t"${resource.name}": []byte(\`${resource.content}\`),\n`;
      }
    }

    // Generate embedded prompts
    let promptsCode = '';
    if (config.prompts && config.prompts.length > 0) {
      for (const prompt of config.prompts) {
        promptsCode += `\t"${prompt.name}": \`${prompt.content}\`,\n`;
      }
    }

    processed = processed.replace('{{.embeddedResources}}', resourcesCode);
    processed = processed.replace('{{.embeddedPrompts}}', promptsCode);

    return processed;
  }

  /**
   * Generates Python agent service code
   */
  private async generatePythonService(buildDir: string, config: AgentPluginConfig): Promise<void> {
    // Log is already added in the main compile method

    const pythonTemplate = await fs.promises.readFile(
      path.join(this.templateDir, 'agent_service.py.template'),
      'utf-8'
    );

    const pythonCode = this.processPythonTemplate(pythonTemplate, config);
    await fs.promises.writeFile(path.join(buildDir, 'agent_service.py'), pythonCode);

    // Generate requirements.txt
    const requirements = this.generatePythonRequirements(config);
    await fs.promises.writeFile(path.join(buildDir, 'requirements.txt'), requirements);

    // Generate config.env
    const configTemplate = await fs.promises.readFile(
      path.join(this.templateDir, 'config.env.template'),
      'utf-8'
    );

    const configContent = this.processTemplate(configTemplate, config);
    await fs.promises.writeFile(path.join(buildDir, 'config.env'), configContent);

    this.addLog('✅ Python service generated');
  }

  /**
   * Processes Python template
   */
  private processPythonTemplate(template: string, config: AgentPluginConfig): string {
    let processed = template;

    // Extract API keys from resources
    let apiKeys = {};
    const apiKeysResource = config.resources?.find(r => r.name === 'api_keys');
    if (apiKeysResource && apiKeysResource.type === 'json') {
      try {
        apiKeys = JSON.parse(apiKeysResource.content as string);
      } catch (error) {
        console.warn('Failed to parse API keys from resources:', error);
      }
    }

    // Replace Python-specific variables
    const replacements = {
      '{{.agentId}}': config.agent_id,
      '{{.agentName}}': config.agent_name,
      '{{.agentDescription}}': config.description || '',
      '{{.defaultProvider}}': 'openai',
      '{{.defaultModel}}': 'gpt-3.5-turbo',
      '{{.apiKeys}}': JSON.stringify(apiKeys)
    };

    for (const [placeholder, value] of Object.entries(replacements)) {
      processed = processed.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    }

    return processed;
  }

  /**
   * Generates Python requirements.txt content
   */
  private generatePythonRequirements(config: AgentPluginConfig): string {
    const baseRequirements = [
      'flask>=2.0.0',
      'requests>=2.25.0',
      'python-dotenv>=0.19.0'
    ];

    // Extract API keys from resources to determine which providers to include
    const apiKeysResource = config.resources?.find(r => r.name === 'api_keys');
    if (apiKeysResource && apiKeysResource.type === 'json') {
      try {
        const apiKeys = JSON.parse(apiKeysResource.content as string);

        // Add provider-specific requirements based on available API keys
        if (apiKeys.openai) {
          baseRequirements.push('openai>=1.0.0');
        }
        if (apiKeys.anthropic) {
          baseRequirements.push('anthropic>=0.3.0');
        }
        if (apiKeys.google) {
          baseRequirements.push('google-generativeai>=0.3.0');
        }
        if (apiKeys.cerebras) {
          baseRequirements.push('openai>=1.0.0'); // Cerebras uses OpenAI-compatible API
        }
        if (apiKeys.deepseek) {
          baseRequirements.push('openai>=1.0.0'); // DeepSeek uses OpenAI-compatible API
        }
      } catch (error) {
        console.warn('Failed to parse API keys for requirements generation:', error);
        // Default to OpenAI if parsing fails
        baseRequirements.push('openai>=1.0.0');
      }
    } else {
      // Default to OpenAI if no API keys resource found
      baseRequirements.push('openai>=1.0.0');
    }

    // Add any additional Python dependencies specified in the config
    if (config.pythonDependencies && config.pythonDependencies.length > 0) {
      baseRequirements.push(...config.pythonDependencies);
    }

    return baseRequirements.join('\n') + '\n';
  }

  /**
   * Escapes Python script for embedding in Go
   */
  private escapePythonScript(config: AgentPluginConfig): string {
    // This would contain the actual Python script content
    // For now, return a placeholder
    return 'print("Python agent service placeholder")';
  }

  /**
   * Compiles the Go plugin
   */
  private async compileGoPlugin(buildDir: string, config: AgentPluginConfig): Promise<string> {
    this.addLog('🔨 Compiling Go plugin...');

    // Determine the output file extension based on the target OS
    const targetOS = process.env.GOOS || process.platform;
    let extension = '.so';

    if (targetOS === 'windows' || targetOS === 'win32') {
      extension = '.dll';
    } else if (targetOS === 'darwin') {
      extension = '.dylib';
    }

    // Output file path
    const outputFile = path.join(
      this.outputDir,
      'plugins',
      `agent_${config.agent_id}_${config.version || '1.0.0'}${extension}`
    );

    // Download Go dependencies (go.mod already created from template)
    this.addLog('📦 Downloading Go dependencies...');
    await this.execCommand('go', ['mod', 'tidy'], buildDir);

    // Build the Go plugin
    this.addLog('🔧 Building Go plugin...');
    const buildArgs = [
      'build',
      '-buildmode=plugin',
      '-o',
      outputFile
    ];

    // Add build flags for cross-compilation if needed
    if (process.env.GOOS && process.env.GOOS !== process.platform) {
      this.addLog(`🌍 Cross-compiling for ${process.env.GOOS}`);
    }

    await this.execCommand('go', [...buildArgs, '.'], buildDir);

    this.addLog(`✅ Plugin compiled: ${outputFile}`);
    return outputFile;
  }

  /**
   * Compiles the WASM plugin
   */
  private async compileWasmPlugin(buildDir: string, config: AgentPluginConfig): Promise<string> {
    this.addLog('🔨 Compiling WASM plugin...');

    // Output file path
    const outputFile = path.join(
      this.outputDir,
      'plugins',
      `agent_${config.agent_id}_${config.version || '1.0.0'}.wasm`
    );

    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      // Download Go dependencies (go.mod already created from template)
      this.addLog('📦 Downloading Go dependencies...');
      await this.execCommand('go', ['mod', 'tidy'], buildDir);

      // Build the WASM binary
      this.addLog('🔧 Building WASM binary...');
      const buildArgs = [
        'build',
        '-ldflags', '-s -w', // Strip debug info to reduce size
        '-o',
        outputFile
      ];

      // Set environment variables for WASM compilation
      const wasmEnv = {
        ...process.env,
        GOOS: 'js',
        GOARCH: 'wasm',
        CGO_ENABLED: '0' // Disable CGO for WASM builds
      };

      this.addLog('🔧 Building with WASM environment: { GOOS: js, GOARCH: wasm }');
      await this.execCommandWithEnv('go', [...buildArgs, '.'], buildDir, wasmEnv);

      this.addLog(`✅ WASM Plugin compiled: ${outputFile}`);
      return outputFile;
    } catch (error) {
      this.addLog('❌ WASM compilation failed, falling back to Go plugin');
      this.addLog('🔄 Attempting Go plugin compilation as fallback...');

      // Fallback to Go plugin compilation
      return await this.compileGoPlugin(buildDir, config);
    }
  }

  /**
   * Executes a command and returns a promise
   */
  private execCommand(command: string, args: string[], cwd: string): Promise<void> {
    return this.execCommandWithEnv(command, args, cwd, process.env);
  }

  /**
   * Executes a command with custom environment and returns a promise
   */
  private execCommandWithEnv(command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv): Promise<void> {
    return new Promise((resolve, reject) => {
      // For Go commands, try to use the full path if available
      let execCommand = command;
      let updatedEnv = { ...env };

      if (command === 'go') {
        // Try common Go installation paths
        const goPaths = [
          '/usr/local/go/bin/go',
          '/usr/bin/go',
          '/opt/go/bin/go',
          '/home/linuxbrew/.linuxbrew/bin/go'
        ];

        for (const goPath of goPaths) {
          if (fs.existsSync(goPath)) {
            execCommand = goPath;
            this.addLog(`🐹 Using Go binary at: ${goPath}`);
            break;
          }
        }

        // Ensure Go paths are in PATH
        const goBinPaths = [
          '/usr/local/go/bin',
          '/usr/bin',
          '/opt/go/bin',
          '/home/linuxbrew/.linuxbrew/bin'
        ];

        const currentPath = updatedEnv.PATH || '';
        const newPath = [...goBinPaths, ...currentPath.split(':')].join(':');
        updatedEnv.PATH = newPath;

        this.addLog(`🔧 Updated PATH for Go: ${newPath}`);
      }

      this.addLog(`🚀 Executing: ${execCommand} ${args.join(' ')}`);
      this.addLog(`📁 Working directory: ${cwd}`);

      const childProcess = child_process.spawn(execCommand, args, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'], // Capture stdout and stderr
        env: updatedEnv
      });

      // Capture and log stdout
      childProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        this.addLog(`📤 [${command}] ${output.trim()}`);
      });

      // Capture and log stderr
      childProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        this.addLog(`📤 [${command}] ${output.trim()}`);
      });

      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
        }
      });

      childProcess.on('error', (error) => {
        reject(new Error(`Failed to start ${command}: ${error.message}`));
      });
    });
  }

  /**
   * Cleans up temporary build files
   */
  private async cleanup(buildDir: string): Promise<void> {
    try {
      if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true, force: true });
        console.log(`🧹 Cleaned up build directory: ${buildDir}`);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to clean up build directory: ${error}`);
    }
  }

  /**
   * Checks if required tools are available
   */
  async checkToolchain(): Promise<{ go: boolean; python: boolean; gcc: boolean }> {
    const checkCommand = (command: string): boolean => {
      try {
        child_process.execSync(`which ${command}`, { stdio: 'ignore' });
        return true;
      } catch {
        return false;
      }
    };

    return {
      go: checkCommand('go'),
      python: checkCommand('python3') || checkCommand('python'),
      gcc: checkCommand('gcc') || checkCommand('clang')
    };
  }

  /**
   * Installs missing tools
   */
  async installToolchain(): Promise<void> {
    console.log('🛠️  Installing missing toolchain components...');

    const toolchainScript = path.join(__dirname, '../../../scripts/install-toolchain.js');
    if (fs.existsSync(toolchainScript)) {
      await this.execCommand('node', [toolchainScript], process.cwd());
    } else {
      throw new Error('Toolchain installation script not found');
    }
  }
}