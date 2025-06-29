# Next.js to Netlify Migration: Automated API Route Conversion

## Overview

This document explains how our custom migration script (`scripts/migrate-api-to-netlify.js`) automatically converts Next.js API routes to Netlify serverless functions. This script is a critical part of our deployment pipeline, ensuring that our Next.js application can seamlessly run on Netlify's serverless infrastructure.

## How the Migration Script Works

The migration script performs several key operations:

1. **Scanning API Routes**: The script recursively scans the `src/app/api` directory to identify all Next.js API route files (files named `route.ts` or `route.js`).

2. **Converting TypeScript to JavaScript**: Since Netlify Functions run on Node.js, the script converts TypeScript code to JavaScript, removing type annotations, interfaces, and other TypeScript-specific syntax.

3. **Transforming Next.js Patterns**: The script converts Next.js-specific patterns (like `NextResponse.json()`) to Netlify function equivalents (returning objects with `statusCode`, `headers`, and `body` properties).

4. **Handling Dynamic Routes**: For routes with dynamic parameters (e.g., `/api/users/[id]`), the script generates parameter extraction logic to maintain the same functionality.

5. **Converting Import Statements**: ES6 imports are converted to CommonJS `require()` statements, and path aliases (`@/lib/*`) are transformed to relative paths.

6. **Adding CORS Support**: The script automatically adds CORS headers to all responses, ensuring API accessibility from different origins.

7. **Migrating Library Files**: Essential library files are also converted and copied to the Netlify functions directory to maintain dependencies.

8. **Preserving Manual Functions**: The script is smart enough to avoid overwriting manually created Netlify functions, only updating those that were auto-generated from API routes.

## Code Transformation Examples

### Next.js API Route:
```typescript
// src/app/api/users/route.ts
import { NextResponse } from 'next/server';
import { getUserData } from '@/lib/user-service';

export async function GET(request: Request) {
  const users = await getUserData();
  return NextResponse.json({ users }, { status: 200 });
}
```

### Converted Netlify Function:
```javascript
// netlify/functions/api-users.js
const { getUserData } = require('../../src/lib/user-service.js');

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
};

async function GET(event, context) {
  const users = await getUserData();
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ users })
  };
}

// Main Netlify function handler
exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const method = event.httpMethod;
    
    // Route to appropriate handler
    switch (method) {
      case 'GET':
        if (typeof GET === 'function') {
          const result = await GET(event);
          return {
            ...result,
            headers: { ...corsHeaders, ...(result.headers || {}) }
          };
        }
        break;
      
      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
    
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Handler not found' })
    };
    
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Export individual handlers for testing
exports.get = GET;
```

## Why We Created This Script

As developers, we created this migration script for several compelling reasons:

1. **Framework Flexibility**: We wanted to leverage Next.js for development while deploying to Netlify's serverless infrastructure, getting the best of both worlds.

2. **Deployment Consistency**: The script ensures that our API routes work identically in both development and production environments, eliminating "works on my machine" issues.

3. **Automation Over Manual Work**: Converting API routes manually would be error-prone and time-consuming. Automation ensures consistency and saves significant development time.

4. **Seamless Deployment**: The script runs during the build process, making the migration transparent to developers who can continue writing standard Next.js code.

5. **Maintainability**: As our application grows, manually maintaining parallel implementations would become increasingly difficult. The script scales with our codebase.

## Benefits for All Projects

This migration approach offers several benefits that could be valuable for many projects:

1. **Framework Agnosticism**: Developers can use their preferred framework (Next.js) while deploying to any serverless platform that supports JavaScript functions.

2. **Reduced Vendor Lock-in**: By abstracting the deployment target, switching between hosting providers becomes easier, reducing dependency on any single platform.

3. **Simplified Development**: Developers can focus on writing clean Next.js code without worrying about the specifics of the deployment platform.

4. **Consistent Testing**: API routes can be tested in the Next.js environment during development and will behave the same way in production.

5. **Gradual Migration**: For projects transitioning between frameworks or platforms, this approach allows for incremental migration rather than a complete rewrite.

6. **CI/CD Integration**: The script can be integrated into CI/CD pipelines, ensuring that the conversion happens automatically with each deployment.

## Usage

The migration script can be run in different modes:

```bash
# Run the migration (production mode)
node scripts/migrate-api-to-netlify.js

# Test mode (no files written)
node scripts/migrate-api-to-netlify.js --test

# Test a specific route
node scripts/migrate-api-to-netlify.js --test --route users
```

## Conclusion

Our Next.js to Netlify migration script demonstrates how automation can bridge the gap between different frameworks and deployment platforms. By investing in this tooling, we've created a development workflow that combines the developer experience of Next.js with the deployment benefits of Netlify's serverless infrastructure.

This approach can be adapted for other frameworks and platforms, providing a blueprint for maintaining framework flexibility while targeting specific deployment environments.