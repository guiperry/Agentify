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

    if (status.status !== 'completed' || !status.rawDownloadUrl) {
      return NextResponse.json(
        { error: 'Compilation not completed or download URL not available' },
        { status: 404 }
      );
    }

    console.log(`📥 Downloading artifact from: ${status.rawDownloadUrl}`);

    // Download the artifact zip file directly from GitHub
    const response = await fetch(status.rawDownloadUrl, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'next-agentify'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download artifact: ${response.statusText}`);
    }

    // Get the zip file as a buffer
    const zipBuffer = Buffer.from(await response.arrayBuffer());

    console.log(`📦 Serving zip file (${zipBuffer.length} bytes) for job: ${jobId}`);

    // Return the entire zip file for download
    const downloadResponse = new NextResponse(zipBuffer);
    downloadResponse.headers.set('Content-Type', 'application/zip');
    downloadResponse.headers.set('Content-Disposition', `attachment; filename="agent-plugin-${jobId}.zip"`);
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
