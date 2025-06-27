const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      }
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const filename = event.queryStringParameters?.file;
    
    if (!filename) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing file parameter' })
      };
    }

    // Security check - only allow downloading from temp directory with specific pattern
    if (!filename.match(/^agent_[a-zA-Z0-9-]+_[0-9.]+\.(wasm|so|dll|dylib)$/)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Invalid filename' })
      };
    }

    const filePath = path.join('/tmp', filename);
    
    if (!fs.existsSync(filePath)) {
      return {
        statusCode: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'File not found' })
      };
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileExtension = path.extname(filename);
    
    // Determine content type based on file extension
    let contentType = 'application/octet-stream';
    if (fileExtension === '.wasm') {
      contentType = 'application/wasm';
    } else if (fileExtension === '.so' || fileExtension === '.dll' || fileExtension === '.dylib') {
      contentType = 'application/x-sharedlib';
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Access-Control-Allow-Origin': '*'
      },
      body: fileBuffer.toString('base64'),
      isBase64Encoded: true
    };

  } catch (error) {
    console.error('Download error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Download failed',
        message: error.message
      })
    };
  }
};
