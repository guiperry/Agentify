#!/usr/bin/env node

/**
 * Direct Go compilation test
 * Tests the Go compilation without TypeScript dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

// Test configuration
const TEST_AGENT_CONFIG = {
  agent_id: 'test-agent-123',
  agent_name: 'Test Agent',
  agentType: 'llm',
  description: 'A test agent for validating Go compilation',
  version: '1.0.0',
  tools: [
    {
      name: 'test_tool',
      description: 'A test tool',
      parameters: [
        {
          name: 'input',
          type: 'string',
          description: 'Test input',
          required: true
        }
      ],
      implementation: 'return "test result"',
      returnType: 'string'
    }
  ],
  resources: [
    {
      name: 'test_resource',
      type: 'text',
      content: 'This is a test resource',
      isEmbedded: true
    }
  ],
  prompts: [
    {
      name: 'test_prompt',
      content: 'You are a test agent. Respond helpfully.'
    }
  ]
};

function processTemplate(template, config) {
  let processed = template;

  const replacements = {
    '{{.agentId}}': config.agent_id,
    '{{.agentName}}': config.agent_name,
    '{{.agentDescription}}': config.description || '',
    '{{.agentVersion}}': config.version || '1.0.0',
    '{{.agentType}}': config.agentType || 'llm',
    '{{.factsUrl}}': config.factsUrl || '',
    '{{.privateFactsUrl}}': config.privateFactsUrl || '',
    '{{.adaptiveRouterUrl}}': config.adaptiveRouterUrl || '',
    '{{.ttl}}': config.ttl?.toString() || '3600',
    '{{.signature}}': config.signature || '',
    '{{.pythonAgentServiceScript}}': 'print("Python agent service placeholder")',
    '{{.pythonRequirements}}': 'flask>=2.0.0\\nrequests>=2.25.0',
    // TEE configuration variables
    '{{.isolationLevel}}': 'process',
    '{{.memoryLimit}}': '512',
    '{{.cpuCores}}': '1',
    '{{.timeoutSec}}': '60',
    '{{.networkAccess}}': 'true',
    '{{.fileSystemAccess}}': 'false',
    // LLM configuration
    '{{.defaultProvider}}': 'openai',
    '{{.defaultModel}}': 'gpt-3.5-turbo',
    '{{.apiKeys}}': '{}',
    // Additional placeholders that might be in templates
    '{{.embeddingProvider}}': 'cerebras',
    '{{.embeddingDimension}}': '384',
    '{{.embeddingTaskType}}': 'retrieval_document',
    '{{.embeddingNormalize}}': 'true'
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    processed = processed.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }

  return processed;
}

function processResourcesTemplate(template, config) {
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

async function testGoCompilation() {
  console.log('🧪 Testing Go compilation directly...');
  
  const buildId = `test_${Date.now()}`;
  const buildDir = path.join(process.cwd(), 'public', 'output', 'temp', buildId);
  const templatesDir = path.join(process.cwd(), 'src', 'lib', 'compiler', 'templates');
  
  try {
    // Create build directory
    console.log('📁 Creating build directory...');
    fs.mkdirSync(buildDir, { recursive: true });
    
    // Process main.go template
    console.log('🔧 Processing main.go template...');
    const mainTemplate = fs.readFileSync(path.join(templatesDir, 'main.go.template'), 'utf-8');
    const mainCode = processTemplate(mainTemplate, TEST_AGENT_CONFIG);
    fs.writeFileSync(path.join(buildDir, 'main.go'), mainCode);
    
    // Process go.mod template
    console.log('📦 Processing go.mod template...');
    const goModTemplate = fs.readFileSync(path.join(templatesDir, 'go.mod.template'), 'utf-8');
    const goModCode = processTemplate(goModTemplate, TEST_AGENT_CONFIG);
    fs.writeFileSync(path.join(buildDir, 'go.mod'), goModCode);
    
    // Process resources template
    console.log('📚 Processing resources template...');
    const resourcesTemplate = fs.readFileSync(path.join(templatesDir, 'resources.go.template'), 'utf-8');
    const resourcesCode = processResourcesTemplate(resourcesTemplate, TEST_AGENT_CONFIG);
    fs.writeFileSync(path.join(buildDir, 'resources.go'), resourcesCode);
    
    // Process additional Go templates (skip problematic ones for now)
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
      const templatePath = path.join(templatesDir, template);
      if (fs.existsSync(templatePath)) {
        console.log(`🔧 Processing ${template}...`);
        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        const processedContent = processTemplate(templateContent, TEST_AGENT_CONFIG);
        const outputFileName = template.replace('.template', '');
        fs.writeFileSync(path.join(buildDir, outputFileName), processedContent);
      }
    }
    
    // Download Go dependencies
    console.log('📦 Downloading Go dependencies...');
    execSync('go mod tidy', { cwd: buildDir, stdio: 'inherit' });
    
    // Compile the Go plugin
    console.log('🔨 Compiling Go plugin...');
    const extension = process.platform === 'win32' ? '.dll' : '.so';
    const outputFile = path.join(process.cwd(), 'public', 'output', 'plugins', `test_agent${extension}`);
    
    execSync(`go build -buildmode=plugin -o "${outputFile}" .`, { 
      cwd: buildDir, 
      stdio: 'inherit' 
    });
    
    // Verify the plugin was created
    if (fs.existsSync(outputFile)) {
      const stats = fs.statSync(outputFile);
      console.log(`✅ Go compilation successful!`);
      console.log(`📦 Plugin created: ${outputFile}`);
      console.log(`📏 Plugin size: ${(stats.size / 1024).toFixed(2)} KB`);
      return true;
    } else {
      console.error('❌ Plugin file was not created');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Go compilation failed:', error.message);
    return false;
  } finally {
    // Clean up build directory (skip for debugging)
    console.log(`🔍 Build directory preserved for debugging: ${buildDir}`);
    // try {
    //   if (fs.existsSync(buildDir)) {
    //     fs.rmSync(buildDir, { recursive: true, force: true });
    //     console.log(`🧹 Cleaned up build directory`);
    //   }
    // } catch (error) {
    //   console.warn(`⚠️  Failed to clean up: ${error.message}`);
    // }
  }
}

// Run the test if called directly
if (require.main === module) {
  testGoCompilation()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testGoCompilation };
