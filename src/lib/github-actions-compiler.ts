import { Octokit } from '@octokit/rest';
import type { AgentPluginConfig } from './compiler/agent-compiler-interface';

interface GitHubActionsCompilerOptions {
  githubToken: string;
  owner: string;
  repo: string;
  workflowId: string;
}

interface CompilationJob {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  downloadUrl?: string;
  logs?: string;
  error?: string;
}

export class GitHubActionsCompiler {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private workflowId: string;

  constructor(options: GitHubActionsCompilerOptions) {
    this.octokit = new Octokit({
      auth: options.githubToken,
    });
    this.owner = options.owner;
    this.repo = options.repo;
    this.workflowId = options.workflowId;
  }

  /**
   * Trigger a compilation workflow on GitHub Actions
   */
  async triggerCompilation(config: AgentPluginConfig): Promise<string> {
    try {
      // Create a unique job ID
      const jobId = `compile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Trigger the workflow
      const response = await this.octokit.actions.createWorkflowDispatch({
        owner: this.owner,
        repo: this.repo,
        workflow_id: this.workflowId,
        ref: 'main',
        inputs: {
          job_id: jobId,
          config: JSON.stringify(config),
          build_target: config.buildTarget || 'wasm',
          platform: process.env.GOOS || 'linux'
        }
      });

      if (response.status !== 204) {
        throw new Error(`Failed to trigger workflow: ${response.status}`);
      }

      return jobId;
    } catch (error) {
      throw new Error(`GitHub Actions compilation trigger failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check the status of a compilation job
   */
  async getCompilationStatus(jobId: string): Promise<CompilationJob> {
    try {
      // Get recent workflow runs
      const runs = await this.octokit.actions.listWorkflowRuns({
        owner: this.owner,
        repo: this.repo,
        workflow_id: this.workflowId,
        per_page: 50
      });

      // Find the run with our job ID
      const targetRun = runs.data.workflow_runs.find(run => 
        run.name?.includes(jobId) || run.head_commit?.message?.includes(jobId)
      );

      if (!targetRun) {
        return {
          id: jobId,
          status: 'pending',
          error: 'Workflow run not found'
        };
      }

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

      const result: CompilationJob = {
        id: jobId,
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

          const pluginArtifact = artifacts.data.artifacts.find(artifact => 
            artifact.name.includes('plugin') || artifact.name.includes(jobId)
          );

          if (pluginArtifact) {
            result.downloadUrl = pluginArtifact.archive_download_url;
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

          const failedJob = jobs.data.jobs.find(job => job.conclusion === 'failure');
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
export function createGitHubActionsCompiler(): GitHubActionsCompiler | null {
  const githubToken = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'guiperry';
  const repo = process.env.GITHUB_REPO || 'next-agentify';
  const workflowId = process.env.GITHUB_WORKFLOW_ID || 'compile-plugin.yml';

  if (!githubToken) {
    console.warn('GitHub token not configured, GitHub Actions compilation unavailable');
    return null;
  }

  return new GitHubActionsCompiler({
    githubToken,
    owner,
    repo,
    workflowId
  });
}
