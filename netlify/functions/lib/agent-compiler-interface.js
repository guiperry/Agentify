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
function createAgentCompilerService() {
  return new AgentCompilerService();
}

module.exports = {
  AgentCompilerService,
  createAgentCompilerService
};
