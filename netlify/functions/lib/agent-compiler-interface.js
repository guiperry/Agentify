/**
 * Simplified Agent Compiler Interface for Netlify Functions
 * This is a minimal implementation that always fails local compilation
 * and relies on GitHub Actions for actual compilation.
 */

class AgentCompilerService {
  constructor() {
    this.compilationLogs = ['Local compilation disabled in serverless environment'];
  }

  /**
   * Convert UI config to plugin config format
   */
  convertUIConfigToPluginConfig(uiConfig) {
    console.log('🔧 convertUIConfigToPluginConfig called with:', JSON.stringify(uiConfig, null, 2));

    if (!uiConfig || typeof uiConfig !== 'object') {
      throw new Error('Invalid UI config');
    }

    const agentName = uiConfig.name || 'agent-plugin';
    const agentPersonality = uiConfig.personality || 'helpful';
    const agentInstructions = uiConfig.instructions || 'You are a helpful AI assistant.';
    const agentFeatures = uiConfig.features || {};
    const agentSettings = uiConfig.settings || {};

    console.log('🔧 Extracted values:', { agentName, agentPersonality, agentInstructions });

    if (!agentName || !agentPersonality || !agentInstructions) {
      throw new Error('Missing required UI config fields');
    }

    // Generate a unique ID for the agent
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Create the agent_name in URN format that GitHub Actions expects
    const sanitizedName = agentName.toLowerCase().replace(/\s+/g, '-');
    const agent_name = `urn:agent:agentify:${sanitizedName}`;

    console.log('🔧 Generated agent_name:', agent_name);

    // Return the proper AgentPluginConfig format
    const pluginConfig = {
      agent_id: agentId,
      agent_name: agent_name,
      agentType: 'llm',
      description: agentInstructions,
      version: '1.0.0',
      facts_url: `https://agentify.example.com/agents/${agentId}`,
      ttl: 3600,
      signature: 'placeholder-signature',
      buildTarget: 'wasm', // Default to WASM for serverless
      tools: [],
      resources: [],
      prompts: [],
      pythonDependencies: [],
      useChromemGo: true,
      subAgentCapabilities: false,
      trustedExecutionEnvironment: {
        isolationLevel: 'process',
        resourceLimits: {
          memory: 512,
          cpu: 1,
          timeLimit: 60
        },
        networkAccess: true,
        fileSystemAccess: false
      }
    };

    console.log('🔧 Returning pluginConfig with agent_name:', pluginConfig.agent_name);
    return pluginConfig;
  }

  /**
   * Always fails in Netlify environment - forces GitHub Actions fallback
   */
  async compileAgent(config) {
    throw new Error('Local compilation not available in serverless environment. Using GitHub Actions fallback.');
  }

  /**
   * Returns compilation logs
   */
  getCompilationLogs() {
    return this.compilationLogs;
  }

  /**
   * Check toolchain - always returns false in serverless environment
   */
  async checkToolchain() {
    return {
      go: false,
      python: false,
      gcc: false
    };
  }
}

/**
 * Create a simplified compiler service for Netlify
 */
async function createAgentCompilerService() {
  return new AgentCompilerService();
}

module.exports = {
  AgentCompilerService,
  createAgentCompilerService
};
