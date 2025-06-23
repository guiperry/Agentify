import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat, readdir } from 'fs/promises';
import { join } from 'path';

// Platform-specific file mappings
const PLATFORM_FILES = {
  windows: {
    pattern: /^agentic-engine.*\.exe$/,
    contentType: 'application/x-msdownload',
    extension: '.exe'
  },
  mac: {
    pattern: /^agentic-engine.*\.(dmg|pkg)$/,
    contentType: 'application/x-apple-diskimage',
    extension: '.dmg'
  },
  linux: {
    pattern: /^agentic-engine.*\.(AppImage|tar\.gz|deb)$/,
    contentType: 'application/x-executable',
    extension: '.AppImage'
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const { platform } = params;
    
    // Validate platform
    if (!platform || !PLATFORM_FILES[platform as keyof typeof PLATFORM_FILES]) {
      return NextResponse.json(
        { error: 'Invalid platform. Supported platforms: windows, mac, linux' },
        { status: 400 }
      );
    }
    
    const platformConfig = PLATFORM_FILES[platform as keyof typeof PLATFORM_FILES];
    const releasesDir = join(process.cwd(), 'public', 'releases');
    
    try {
      // Find the latest release file for the platform
      const files = await readdir(releasesDir);
      const platformFiles = files.filter(file => platformConfig.pattern.test(file));
      
      if (platformFiles.length === 0) {
        return NextResponse.json(
          { error: `No Agentic Engine release found for ${platform}` },
          { status: 404 }
        );
      }
      
      // Sort by filename to get the latest version (assuming semantic versioning in filename)
      const latestFile = platformFiles.sort().reverse()[0];
      const filePath = join(releasesDir, latestFile);
      
      // Check if file exists and get stats
      const fileStats = await stat(filePath);
      
      if (!fileStats.isFile()) {
        return NextResponse.json(
          { error: 'Release file not found' },
          { status: 404 }
        );
      }
      
      // Read the file
      const fileBuffer = await readFile(filePath);
      
      // Create response with appropriate headers
      const response = new NextResponse(fileBuffer);
      response.headers.set('Content-Type', platformConfig.contentType);
      response.headers.set('Content-Disposition', `attachment; filename="${latestFile}"`);
      response.headers.set('Content-Length', fileStats.size.toString());
      response.headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      return response;
      
    } catch (fileError) {
      console.error('File access error:', fileError);
      return NextResponse.json(
        { error: `No Agentic Engine release available for ${platform}` },
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('Engine download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/download/engine - List available releases
export async function OPTIONS(request: NextRequest) {
  try {
    const releasesDir = join(process.cwd(), 'public', 'releases');
    
    try {
      const files = await readdir(releasesDir);
      const releases: Record<string, string[]> = {
        windows: [],
        mac: [],
        linux: []
      };
      
      // Categorize files by platform
      for (const [platform, config] of Object.entries(PLATFORM_FILES)) {
        releases[platform] = files.filter(file => config.pattern.test(file));
      }
      
      return NextResponse.json({
        available_releases: releases,
        total_files: files.length
      });
      
    } catch (dirError) {
      return NextResponse.json({
        available_releases: { windows: [], mac: [], linux: [] },
        total_files: 0,
        message: 'Releases directory not accessible'
      });
    }
    
  } catch (error) {
    console.error('Release listing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
