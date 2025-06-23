import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    
    // Validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }
    
    // Ensure the file has a valid plugin extension
    const validExtensions = ['.so', '.dll', '.dylib'];
    const hasValidExtension = validExtensions.some(ext => filename.endsWith(ext));
    
    if (!hasValidExtension) {
      return NextResponse.json(
        { error: 'Invalid file type. Only plugin files (.so, .dll, .dylib) are allowed.' },
        { status: 400 }
      );
    }
    
    // Construct the file path
    const pluginsDir = join(process.cwd(), 'public', 'output', 'plugins');
    const filePath = join(pluginsDir, filename);
    
    try {
      // Check if file exists and get stats
      const fileStats = await stat(filePath);
      
      if (!fileStats.isFile()) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
      
      // Read the file
      const fileBuffer = await readFile(filePath);
      
      // Determine content type based on extension
      let contentType = 'application/octet-stream';
      if (filename.endsWith('.so')) {
        contentType = 'application/x-sharedlib';
      } else if (filename.endsWith('.dll')) {
        contentType = 'application/x-msdownload';
      } else if (filename.endsWith('.dylib')) {
        contentType = 'application/x-mach-binary';
      }
      
      // Create response with appropriate headers
      const response = new NextResponse(fileBuffer);
      response.headers.set('Content-Type', contentType);
      response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
      response.headers.set('Content-Length', fileStats.size.toString());
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      
      return response;
      
    } catch (fileError) {
      console.error('File access error:', fileError);
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('Plugin download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
