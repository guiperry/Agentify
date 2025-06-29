# API Setup for Agentify

This document provides instructions for setting up the API endpoints for the Agentify application.

## API Endpoints

The application uses Netlify Functions for its API endpoints. These are configured in the `netlify.toml` file and are accessible via the following URL patterns:

### API Functions with `api-` prefix
- `/api/register-agent` → `/.netlify/functions/api-register-agent`
- `/api/agent-test` → `/.netlify/functions/api-agent-test`
- `/api/compile` → `/.netlify/functions/api-compile`
- `/api/deploy` → `/.netlify/functions/api-deploy`
- `/api/health` → `/.netlify/functions/api-health`

### Special Functions without `api-` prefix
- `/api/stream` → `/.netlify/functions/stream` (SSE endpoint)
- `/api/compile-stream` → `/.netlify/functions/compile-stream`
- `/api/deploy-stream` → `/.netlify/functions/deploy-stream`
- `/api/download-plugin` → `/.netlify/functions/download-plugin`
- `/api/validate-*` → `/.netlify/functions/validate-*`
- `/api/auth` → `/.netlify/functions/auth`

## Local Development

When running the application locally, make sure the Netlify Functions are properly set up:

1. Install the Netlify CLI:
   ```
   npm install -g netlify-cli
   ```

2. Start the development server with Netlify Functions:
   ```
   netlify dev
   ```

This will start both the Next.js application and the Netlify Functions, making them accessible via the `/api/*` routes.

## Troubleshooting

If you encounter 404 errors when accessing API endpoints:

1. Check that the `netlify.toml` file has the correct redirects for all function types:
   ```toml
   # For api- prefixed functions
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/api-:splat"
     status = 200
     force = false
   
   # For special functions
   [[redirects]]
     from = "/api/stream"
     to = "/.netlify/functions/stream"
     status = 200
   
   # Additional redirects for other non-prefixed functions
   ```

2. Make sure the functions directory is properly configured:
   ```toml
   [functions]
     directory = "netlify/functions"
   ```

3. Verify that the function files exist in the `netlify/functions` directory

4. Check the browser console for specific error messages

5. If using Netlify Dev, restart the server after making changes to the `netlify.toml` file

## API Authentication

Most API endpoints require authentication. Make sure:

1. The user is logged in
2. The Authorization header is properly set with the user's access token
3. The Supabase configuration is correct in the `.env` file