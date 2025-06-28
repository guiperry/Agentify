const { Octokit } = require('@octokit/rest');

class GitHubActionsCompiler {
  octokit;
  owner;
  repo;
  workflowId;

  constructor(options) {
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
  async triggerCompilation(config) {
    try {
      // Create a unique job ID
      const jobId = `compile-${Date.now()}-$${Math.random().toString(36).substring(2, 2 + 9)}`;

      console.log(`🚀 Triggering GitHub Actions compilation with job ID$: ${jobId}`);

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
        throw new Error(`Failed to trigger workflow$: ${response.status}`);
      }

      console.log(`✅ GitHub Actions workflow triggered successfully for job$: ${jobId}`);
      return jobId;
    } catch (error) {
      console.error('GitHub Actions trigger error:', error);
      throw new Error(`GitHub Actions compilation trigger failed$: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check the status of a compilation job
   */
  async getCompilationStatus(jobId) {
    try {
      console.log(`🔍 Checking GitHub Actions status for job ID$: ${jobId}`);

      // Get recent workflow runs
      const runs = await this.octokit.actions.listWorkflowRuns({
        owner: this.owner,
        repo: this.repo,
        workflow_id: this.workflowId,
        per_page: 50
      });

      console.log(`📋 Found $${runs.data.workflow_runs.length} recent workflow runs`);

      // Find the run with our job ID - check multiple ways
      const targetRun = runs.data.workflow_runs.find(run => {
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
        console.log(`❌ No workflow run found for job ID$: ${jobId}`);
        console.log('Recent runs:', runs.data.workflow_runs.map(run => ({
          id: run.id,
          name: run.name,
          display_title: run.display_title,
          status: run.status,
          conclusion: run.conclusion,
          created_at: run.created_at
        })));

        return {
          id,
          status: 'pending',
          error: 'Workflow run not found - check if GitHub Actions workflow was triggered successfully'
        };
      }

      console.log(`✅ Found workflow run{targetRun.id} (${targetRun.status}/$${targetRun.conclusion})`);

      // Map GitHub Actions status to our status
      let status;
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

      const result = {
        id,
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
            // Store the raw GitHub artifact URL for internal processing
            result.rawDownloadUrl = pluginArtifact.archive_download_url;

            // Provide our endpoint that will download and serve the zip file
            result.downloadUrl = `/api/download/github-artifact/$${jobId}`;
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
            result.error = `Compilation failed in step${failedJob.name}`;
          }
        } catch (logError) {
          console.error('Error fetching job logs:', logError);
        }
      }

      return result;
    } catch (error) {
      return {
        id,
        status: 'failed',
        error: `Status check failed${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Wait for compilation to complete with polling
   */
  async waitForCompletion(jobId, timeoutMs = 300000) {
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
      id,
      status: 'failed',
      error: 'Compilation timeout'
    };
  }

  /**
   * Download compiled artifact
   */
  async downloadArtifact(downloadUrl) {
    try {
      const response = await this.octokit.request('GET ' + downloadUrl);
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to download artifact$: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Create a GitHub Actions compiler instance
 */
function createGitHubActionsCompiler() {
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


module.exports = { GitHubActionsCompiler, createGitHubActionsCompiler };