import { NextRequest, NextResponse } from 'next/server';
import { createGitHubActionsCompiler } from '@/lib/github-actions-compiler';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    console.log(`📦 Downloading GitHub Actions artifact for job: ${jobId}`);

    // Validate jobId
    if (!jobId || jobId.includes('..') || jobId.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    // Get GitHub Actions compiler
    const githubCompiler = createGitHubActionsCompiler();
    if (!githubCompiler) {
      return NextResponse.json(
        { error: 'GitHub Actions compiler not available' },
        { status: 503 }
      );
    }

    // Get compilation status to get download URL
    const status = await githubCompiler.getCompilationStatus(jobId);
    
    console.log(`📊 Compilation status for job ${jobId}:`, {
      status: status.status,
      hasDownloadUrl: !!status.downloadUrl,
      hasRawDownloadUrl: !!status.rawDownloadUrl
    });

    if (status.status !== 'completed' || !status.rawDownloadUrl) {
      console.error(`❌ Cannot download artifact: status=${status.status}, rawDownloadUrl=${status.rawDownloadUrl ? 'present' : 'missing'}`);
      return NextResponse.json(
        { error: 'Compilation not completed or download URL not available' },
        { status: 404 }
      );
    }

    console.log(`📥 Downloading artifact from: ${status.rawDownloadUrl}`);

    // Download the artifact zip file directly from GitHub
    console.log(`🔑 Using GitHub token: ${process.env.GITHUB_TOKEN ? 'present (length: ' + process.env.GITHUB_TOKEN.length + ')' : 'missing'}`);
    
    let response;
    try {
      response = await fetch(status.rawDownloadUrl, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'next-agentify'
        }
      });

      console.log(`📡 GitHub API response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download artifact: ${response.status} ${response.statusText}`);
      }
      
      // Check if we have the expected content type
      const contentType = response.headers.get('content-type');
      console.log(`📦 Response content type: ${contentType}`);
      
      if (!contentType || (!contentType.includes('application/zip') && !contentType.includes('application/octet-stream'))) {
        console.warn(`⚠️ Unexpected content type: ${contentType}`);
      }
    } catch (fetchError) {
      console.error('🔥 Fetch error:', fetchError);
      throw new Error(`Failed to download artifact: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }

    // Get the zip file as a buffer
    const zipBuffer = Buffer.from(await response.arrayBuffer());

    console.log(`📦 Serving zip file (${zipBuffer.length} bytes) for job: ${jobId}`);

    // Return the entire zip file for download
    const downloadResponse = new NextResponse(zipBuffer);
    downloadResponse.headers.set('Content-Type', 'application/zip');
    
    // Get the agent name from the status if available
    const agentName = status.agentName || 'agent';
    const sanitizedAgentName = agentName !== 'agent' ? 
      agentName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() : 
      `agent-${jobId.split('-')[1]}`;
    
    // Set the filename to include the agent name and jobId
    downloadResponse.headers.set('Content-Disposition', `attachment; filename="${sanitizedAgentName}-plugin-${jobId}.zip"`);
    
    downloadResponse.headers.set('Content-Length', zipBuffer.length.toString());
    downloadResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return downloadResponse;

  } catch (error) {
    console.error('GitHub artifact download error:', error);
    return NextResponse.json(
      { error: `Failed to download artifact: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
