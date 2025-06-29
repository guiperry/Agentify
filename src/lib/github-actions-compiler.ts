import type { AgentPluginConfig } from './compiler/agent-compiler-interface';

interface GitHubActionsCompilerOptions {
  githubToken: string;
  owner: string;
  repo: string;
  workflowId: string;
}

interface CompilationJob {
  id: string;
  agentName?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  downloadUrl?: string;
  rawDownloadUrl?: string;
  logs?: string;
  error?: string;
}

export class GitHubActionsCompiler {
  private octokit: any;
  private owner: string;
  private repo: string;
  private workflowId: string;

  constructor(options: GitHubActionsCompilerOptions) {
    this.owner = options.owner;
    this.repo = options.repo;
    this.workflowId = options.workflowId;
    // Don't initialize octokit in constructor - do it async
  }

  async initializeOctokit(githubToken: string) {
    try {
      // Use dynamic import for ES Module
      const OctokitModule = await import('@octokit/rest');
      const Octokit = OctokitModule.Octokit;
      
      if (!Octokit) {
        throw new Error('Failed to import Octokit from @octokit/rest');
      }
      
      this.octokit = new Octokit({
        auth: githubToken,
      });
    } catch (error) {
      console.error('Failed to initialize Octokit:', error);
      throw new Error(`GitHub API client initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Trigger a compilation workflow on GitHub Actions
   */
  async triggerCompilation(config: AgentPluginConfig): Promise<string> {
    try {
      // Ensure octokit is initialized
      if (!this.octokit) {
        throw new Error('GitHub API client not initialized');
      }

      // Create a unique job ID
      const jobId = `compile-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      // Get a sanitized agent name for use in workflow names
      // Extract just the agent name from URN format if present (e.g., "urn:agent:agentify:seal-assist" -> "seal-assist")
      // First check if agent_name exists, if not try to use name property instead
      let agentName: string;
      
      // Log the incoming config for debugging
      console.log('GitHub Actions compiler received config:', {
        hasAgentName: !!config.agent_name,
        hasName: !!(config as any).name,
        agentName: config.agent_name || (config as any).name || 'undefined'
      });
      
      // If agent_name is missing but name exists, use that instead
      if (!config.agent_name && (config as any).name) {
        console.log(`Setting agent_name from name property: ${(config as any).name}`);
        config.agent_name = (config as any).name;
      }
      
      // Now use agent_name with fallback
      agentName = config.agent_name || 'unnamed-agent';
      
      // Extract just the agent name from URN format if present
      if (agentName.startsWith('urn:agent:')) {
        const parts = agentName.split(':');
        agentName = parts[parts.length - 1]; // Get the last part after the last colon
      }
      
      agentName = agentName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);

      console.log(`🚀 Triggering GitHub Actions compilation for "${agentName}" with job ID: ${jobId}`);

      // Trigger the workflow
      const response = await this.octokit.actions.createWorkflowDispatch({
        owner: this.owner,
        repo: this.repo,
        workflow_id: this.workflowId,
        ref: 'main',
        inputs: {
          job_id: jobId,
          agent_name: agentName,
          config: JSON.stringify(config),
          build_target: config.buildTarget || 'wasm',
          platform: process.env.GOOS || 'linux'
        }
      });

      if (response.status !== 204) {
        throw new Error(`Failed to trigger workflow: ${response.status}`);
      }

      console.log(`✅ GitHub Actions workflow triggered successfully for job: ${jobId}`);
      return jobId;
    } catch (error) {
      console.error('GitHub Actions trigger error:', error);
      throw new Error(`GitHub Actions compilation trigger failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check the status of a compilation job
   */
  async getCompilationStatus(jobId: string): Promise<CompilationJob> {
    try {
      // Ensure octokit is initialized
      if (!this.octokit) {
        throw new Error('GitHub API client not initialized');
      }

      console.log(`🔍 Checking GitHub Actions status for job ID: ${jobId}`);

      // Get recent workflow runs
      const runs = await this.octokit.actions.listWorkflowRuns({
        owner: this.owner,
        repo: this.repo,
        workflow_id: this.workflowId,
        per_page: 50
      });

      console.log(`📋 Found ${runs.data.workflow_runs.length} recent workflow runs`);

      // Find the run with our job ID - check multiple ways
      const targetRun = runs.data.workflow_runs.find((run: any) => {
        // Check if job ID is in the run name (this should work with our run-name setting)
        if (run.name?.includes(jobId)) {
          console.log(`🎯 Found run by name: ${run.name}`);
          return true;
        }

        // Check if job ID is in the display title
        if (run.display_title?.includes(jobId)) {
          console.log(`🎯 Found run by display title: ${run.display_title}`);
          return true;
        }

        // Check if job ID is in the head commit message
        if (run.head_commit?.message?.includes(jobId)) {
          console.log(`🎯 Found run by commit message: ${run.head_commit.message}`);
          return true;
        }

        return false;
      });

      if (!targetRun) {
        console.log(`❌ No workflow run found for job ID: ${jobId}`);
        console.log('Recent runs:', runs.data.workflow_runs.map((run: any) => ({
          id: run.id,
          name: run.name,
          display_title: run.display_title,
          status: run.status,
          conclusion: run.conclusion,
          created_at: run.created_at
        })));

        return {
          id: jobId,
          status: 'pending',
          error: 'Workflow run not found - check if GitHub Actions workflow was triggered successfully'
        };
      }

      console.log(`✅ Found workflow run: ${targetRun.id} (${targetRun.status}/${targetRun.conclusion})`);


      // Map GitHub Actions status to our status
      let status: CompilationJob['status'];
      switch (targetRun.status) {
        case 'queued':
        case 'in_progress':
          status = 'in_progress';
          break;
        case 'completed':
          status = targetRun.conclusion === 'success' ? 'completed' : 'failed';
          break;
        default:
          status = 'pending';
      }

      // Extract agent name from run name if possible
      let agentName = 'agent';
      if (targetRun.name) {
        // Try to extract agent name from "Compile {agent_name} - Job {job_id}"
        const nameMatch = targetRun.name.match(/^Compile\s+([^-]+)\s+-\s+Job/);
        if (nameMatch && nameMatch[1]) {
          agentName = nameMatch[1].trim();
        }
      }
      
      // If the agent name is "Agent Plugin", it's the default name from the workflow
      // In this case, try to extract the agent name from the config
      if (agentName === 'Agent Plugin') {
        try {
          // Try to parse the config from the workflow inputs
          const runJobs = await this.octokit.actions.listJobsForWorkflowRun({
            owner: this.owner,
            repo: this.repo,
            run_id: targetRun.id
          });
          
          // Check if we have any jobs with steps that have inputs
          for (const job of runJobs.data.jobs) {
            if (job.steps) {
              for (const step of job.steps) {
                if (step.name === 'Parse configuration' && step.conclusion === 'success') {
                  // We found the configuration parsing step, try to extract the agent name from the config
                  console.log(`🔍 Found configuration parsing step in job ${job.name}`);
                  agentName = `agent-${jobId.split('-')[1]}`;
                  break;
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching job details:', error);
        }
      }
      
      const result: CompilationJob = {
        id: jobId,
        agentName,
        status
      };

      // If completed successfully, get the artifact download URL
      if (status === 'completed') {
        try {
          const artifacts = await this.octokit.actions.listWorkflowRunArtifacts({
            owner: this.owner,
            repo: this.repo,
            run_id: targetRun.id
          });

          console.log(`📦 Found ${artifacts.data.artifacts.length} artifacts for run ${targetRun.id}`);
          
          // Log all artifacts for debugging
          artifacts.data.artifacts.forEach((artifact: any) => {
            console.log(`  - Artifact: ${artifact.name} (${artifact.id}), size: ${artifact.size_in_bytes} bytes`);
          });

          // Try to find the artifact with multiple strategies
          let pluginArtifact = artifacts.data.artifacts.find((artifact: any) => 
            // First try: includes jobId (most specific)
            artifact.name.includes(jobId)
          );
          
          // If not found, try more generic matching
          if (!pluginArtifact) {
            pluginArtifact = artifacts.data.artifacts.find((artifact: any) =>
              // Second try: includes 'plugin'
              artifact.name.includes('plugin') ||
              // Third try: includes 'agent'
              artifact.name.includes('agent')
            );
          }
          
          // If still not found and there's only one artifact, use that
          if (!pluginArtifact && artifacts.data.artifacts.length === 1) {
            pluginArtifact = artifacts.data.artifacts[0];
            console.log(`🔍 Using the only available artifact: ${pluginArtifact.name}`);
          }

          if (pluginArtifact) {
            console.log(`✅ Found matching artifact: ${pluginArtifact.name} (${pluginArtifact.id})`);
            
            // Store the raw GitHub artifact URL for internal processing
            result.rawDownloadUrl = pluginArtifact.archive_download_url;

            // Create direct GitHub download URL (works in browser without auth)
            const directDownloadUrl = `https://github.com/${this.owner}/${this.repo}/actions/runs/${targetRun.id}/artifacts/${pluginArtifact.id}`;
            result.downloadUrl = directDownloadUrl;

            console.log(`📥 Set download URLs:
              - rawDownloadUrl: ${result.rawDownloadUrl}
              - downloadUrl: ${result.downloadUrl} (direct GitHub link)`);
          } else {
            console.warn(`⚠️ No matching artifact found for job ID: ${jobId}`);
          }
        } catch (artifactError) {
          console.error('Error fetching artifacts:', artifactError);
        }
      }

      // If failed, get the logs
      if (status === 'failed') {
        try {
          const jobs = await this.octokit.actions.listJobsForWorkflowRun({
            owner: this.owner,
            repo: this.repo,
            run_id: targetRun.id
          });

          const failedJob = jobs.data.jobs.find((job: any) => job.conclusion === 'failure');
          if (failedJob) {
            result.error = `Compilation failed in step: ${failedJob.name}`;
          }
        } catch (logError) {
          console.error('Error fetching job logs:', logError);
        }
      }

      return result;
    } catch (error) {
      return {
        id: jobId,
        status: 'failed',
        error: `Status check failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Wait for compilation to complete with polling
   */
  async waitForCompletion(jobId: string, timeoutMs: number = 300000): Promise<CompilationJob> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getCompilationStatus(jobId);
      
      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return {
      id: jobId,
      status: 'failed',
      error: 'Compilation timeout'
    };
  }

  /**
   * Download compiled artifact
   */
  async downloadArtifact(downloadUrl: string): Promise<Buffer> {
    try {
      const response = await this.octokit.request('GET ' + downloadUrl);
      return Buffer.from(response.data as ArrayBuffer);
    } catch (error) {
      throw new Error(`Failed to download artifact: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Create a GitHub Actions compiler instance
 */
export async function createGitHubActionsCompiler(): Promise<GitHubActionsCompiler | null> {
  const githubToken = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'guiperry';
  const repo = process.env.GITHUB_REPO || 'next-agentify';
  const workflowId = process.env.GITHUB_WORKFLOW_ID || 'compile-plugin.yml';

  if (!githubToken) {
    console.warn('GitHub token not configured, GitHub Actions compilation unavailable');
    return null;
  }

  const compiler = new GitHubActionsCompiler({
    githubToken,
    owner,
    repo,
    workflowId
  });

  // Initialize the octokit client
  await compiler.initializeOctokit(githubToken);

  return compiler;
}
