import { NextRequest, NextResponse } from 'next/server';

interface AgentConfiguration {
  name: string;
  type: string;
  personality: string;
  instructions: string;
  features: string[];
  agentFacts: any;
  settings: {
    creativity: number;
    mcpServers: any[];
  };
}

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

interface TestResponse {
  success: boolean;
  testResults: {
    passed: number;
    failed: number;
    total: number;
    coverage: number;
    details: TestResult[];
  };
  logs: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config, repoUrl } = body;

    if (!config) {
      return NextResponse.json({
        success: false,
        testResults: {
          passed: 0,
          failed: 1,
          total: 1,
          coverage: 0,
          details: [{
            name: 'Configuration Test',
            status: 'failed',
            duration: 0,
            error: 'Missing agent configuration'
          }]
        },
        logs: ['Error: Missing agent configuration']
      }, { status: 400 });
    }

    // Simulate testing the agent configuration
    const testResults = await runAgentTests(config, repoUrl);

    return NextResponse.json(testResults);
  } catch (error) {
    console.error('Agent testing error:', error);
    return NextResponse.json({
      success: false,
      testResults: {
        passed: 0,
        failed: 1,
        total: 1,
        coverage: 0,
        details: [{
          name: 'System Test',
          status: 'failed',
          duration: 0,
          error: error instanceof Error ? error.message : 'Testing failed'
        }]
      },
      logs: [`Error: ${error instanceof Error ? error.message : 'Testing failed'}`]
    }, { status: 500 });
  }
}

async function runAgentTests(config: AgentConfiguration, repoUrl?: string): Promise<TestResponse> {
  const logs: string[] = [];
  const testDetails: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  logs.push(`Starting agent tests for: ${config.name}`);
  logs.push(`Agent type: ${config.type}`);
  logs.push(`Features: ${config.features.join(', ')}`);

  // Test 1: Configuration Validation
  const configTest = await testConfiguration(config);
  testDetails.push(configTest);
  if (configTest.status === 'passed') {
    passed++;
    logs.push('✓ Configuration validation passed');
  } else {
    failed++;
    logs.push(`✗ Configuration validation failed: ${configTest.error}`);
  }

  // Test 2: Agent Facts Validation
  const factsTest = await testAgentFacts(config.agentFacts);
  testDetails.push(factsTest);
  if (factsTest.status === 'passed') {
    passed++;
    logs.push('✓ Agent facts validation passed');
  } else {
    failed++;
    logs.push(`✗ Agent facts validation failed: ${factsTest.error}`);
  }

  // Test 3: Feature Compatibility
  const featuresTest = await testFeatureCompatibility(config.features);
  testDetails.push(featuresTest);
  if (featuresTest.status === 'passed') {
    passed++;
    logs.push('✓ Feature compatibility check passed');
  } else {
    failed++;
    logs.push(`✗ Feature compatibility check failed: ${featuresTest.error}`);
  }

  // Test 4: Repository Connection (if provided)
  if (repoUrl) {
    const repoTest = await testRepositoryConnection(repoUrl);
    testDetails.push(repoTest);
    if (repoTest.status === 'passed') {
      passed++;
      logs.push('✓ Repository connection test passed');
    } else {
      failed++;
      logs.push(`✗ Repository connection test failed: ${repoTest.error}`);
    }
  }

  const total = testDetails.length;
  const coverage = total > 0 ? Math.round((passed / total) * 100) : 0;

  logs.push(`\nTest Summary: ${passed}/${total} tests passed (${coverage}% coverage)`);

  return {
    success: failed === 0,
    testResults: {
      passed,
      failed,
      total,
      coverage,
      details: testDetails
    },
    logs
  };
}

async function testConfiguration(config: AgentConfiguration): Promise<TestResult> {
  const start = Date.now();
  
  try {
    // Validate required fields
    if (!config.name || config.name.trim().length < 3) {
      throw new Error('Agent name must be at least 3 characters long');
    }

    if (!config.type) {
      throw new Error('Agent type is required');
    }

    if (!config.instructions || config.instructions.trim().length < 10) {
      throw new Error('Instructions must be at least 10 characters long');
    }

    if (!config.features || config.features.length === 0) {
      throw new Error('At least one feature must be selected');
    }

    return {
      name: 'Configuration Validation',
      status: 'passed',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'Configuration Validation',
      status: 'failed',
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Configuration validation failed'
    };
  }
}

async function testAgentFacts(agentFacts: any): Promise<TestResult> {
  const start = Date.now();
  
  try {
    if (!agentFacts) {
      throw new Error('Agent facts are required');
    }

    if (!agentFacts.id) {
      throw new Error('Agent ID is required');
    }

    if (!agentFacts.agent_name) {
      throw new Error('Agent name in facts is required');
    }

    return {
      name: 'Agent Facts Validation',
      status: 'passed',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'Agent Facts Validation',
      status: 'failed',
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Agent facts validation failed'
    };
  }
}

async function testFeatureCompatibility(features: string[]): Promise<TestResult> {
  const start = Date.now();
  
  try {
    const supportedFeatures = [
      'chat', 'search', 'analytics', 'automation', 'integration',
      'memory', 'learning', 'scheduling', 'notifications', 'api'
    ];

    const unsupportedFeatures = features.filter(feature => 
      !supportedFeatures.includes(feature.toLowerCase())
    );

    if (unsupportedFeatures.length > 0) {
      throw new Error(`Unsupported features: ${unsupportedFeatures.join(', ')}`);
    }

    return {
      name: 'Feature Compatibility',
      status: 'passed',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'Feature Compatibility',
      status: 'failed',
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Feature compatibility check failed'
    };
  }
}

async function testRepositoryConnection(repoUrl: string): Promise<TestResult> {
  const start = Date.now();
  
  try {
    // Validate URL format
    new URL(repoUrl);

    // For now, just validate the URL format
    // In a real implementation, you might try to connect to the repository
    if (!repoUrl.includes('github.com') && !repoUrl.includes('gitlab.com') && !repoUrl.includes('bitbucket.org')) {
      throw new Error('Repository must be from a supported platform (GitHub, GitLab, or Bitbucket)');
    }

    return {
      name: 'Repository Connection',
      status: 'passed',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'Repository Connection',
      status: 'failed',
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : 'Repository connection failed'
    };
  }
}
