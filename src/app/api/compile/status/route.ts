import { NextResponse } from 'next/server';
import { createGitHubActionsCompiler } from '@/lib/github-actions-compiler';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    console.log(`🔍 Status check requested for job ID: ${jobId}`);

    if (!jobId) {
      console.log('❌ Missing jobId parameter');
      return NextResponse.json({
        success: false,
        message: 'Missing jobId parameter'
      }, { status: 400 });
    }

    // Check environment variables
    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER || 'guiperry';
    const githubRepo = process.env.GITHUB_REPO || 'next-agentify';

    console.log(`🔧 GitHub config: owner=${githubOwner}, repo=${githubRepo}, token=${githubToken ? 'configured' : 'missing'}`);

    const githubCompiler = createGitHubActionsCompiler();
    if (!githubCompiler) {
      console.log('❌ GitHub Actions compiler not available - missing token');
      return NextResponse.json({
        success: false,
        message: 'GitHub Actions compiler not available - GitHub token not configured'
      }, { status: 503 });
    }

    console.log(`📡 Checking compilation status for job: ${jobId}`);
    const status = await githubCompiler.getCompilationStatus(jobId);

    console.log(`📊 Status result:`, status);

    return NextResponse.json({
      success: true,
      status: status.status,
      downloadUrl: status.downloadUrl,
      error: status.error,
      logs: status.logs
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({
      success: false,
      message: `Status check failed: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json({
        success: false,
        message: 'Missing jobId'
      }, { status: 400 });
    }

    const githubCompiler = createGitHubActionsCompiler();
    if (!githubCompiler) {
      return NextResponse.json({
        success: false,
        message: 'GitHub Actions compiler not available'
      }, { status: 503 });
    }

    // Wait for completion with a reasonable timeout
    const result = await githubCompiler.waitForCompletion(jobId, 300000); // 5 minutes

    return NextResponse.json({
      success: result.status === 'completed',
      status: result.status,
      downloadUrl: result.downloadUrl,
      error: result.error,
      logs: result.logs,
      message: result.status === 'completed' ? 'Compilation completed successfully' : 'Compilation failed or timed out'
    });
  } catch (error) {
    console.error('Compilation wait error:', error);
    return NextResponse.json({
      success: false,
      message: `Compilation wait failed: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
}
