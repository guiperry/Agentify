# Netlify Functions Guide for Agentify

This document provides an overview of the Netlify Functions used in the Agentify application and how they are structured.

## Function Naming Conventions

The Netlify Functions in this project follow two naming patterns:

1. **API Functions with `api-` prefix**:
   - Used for standard API endpoints
   - Example: `api-register-agent.js`, `api-compile.js`
   - Accessed via `/api/register-agent`, `/api/compile`

2. **Special Functions without `api-` prefix**:
   - Used for specific functionality like streaming, validation, etc.
   - Example: `stream.js`, `compile-stream.js`, `validate-identity.js`
   - Accessed via `/api/stream`, `/api/compile-stream`, `/api/validate-identity`

## Function Categories

### Authentication & User Management
- `api-register-agent.js` - Registers a new agent for a user
- `auth.js` - Handles authentication

### Compilation & Deployment
- `api-compile.js` - Initiates compilation
- `api-compile-status.js` - Checks compilation status
- `compile-stream.js` - Handles real-time updates during compilation
- `compile-wasm.js` - WebAssembly compilation
- `compile-github-actions.js` - GitHub Actions integration for compilation
- `api-deploy.js` - Handles deployment
- `deploy-stream.js` - Real-time updates during deployment

### Streaming & Real-time Updates
- `stream.js` - Server-Sent Events (SSE) endpoint
- `compile-stream.js` - Compilation updates
- `deploy-stream.js` - Deployment updates

### Validation
- `validate-identity.js` - Validates identity information
- `validate-capabilities.js` - Validates agent capabilities
- `validate-personality.js` - Validates agent personality
- `validate-api-keys.js` - Validates API keys

### Downloads
- `download-plugin.js` - Downloads compiled plugins
- `api-download-engine-platform.js` - Downloads engine for specific platform
- `api-download-plugin-filename.js` - Downloads plugin by filename
- `api-download-github-artifact-jobid.js` - Downloads GitHub artifacts

### Testing
- `api-test.js` - General API testing
- `api-agent-test.js` - Agent-specific testing

## URL Mapping

The `netlify.toml` file contains redirects that map frontend URLs to the appropriate Netlify Functions:

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

## Best Practices

1. **Consistent Naming**: 
   - Use `api-` prefix for standard REST API endpoints
   - Use descriptive names without prefix for special functionality

2. **URL Structure**:
   - Always access functions via `/api/` routes in frontend code
   - Never use `/.netlify/functions/` directly in frontend code

3. **Error Handling**:
   - Always return proper HTTP status codes
   - Include detailed error messages in JSON responses
   - Handle both JSON and non-JSON responses in frontend code

4. **Authentication**:
   - Secure endpoints with proper authentication checks
   - Use the Authorization header with Bearer token

## Troubleshooting

If functions are not accessible:

1. Check that the function file exists in `netlify/functions/`
2. Verify that the appropriate redirect is defined in `netlify.toml`
3. Make sure the URL in frontend code matches the redirect pattern
4. Check browser console and Netlify function logs for errors

## Local Development

When developing locally:

1. Use `netlify dev` to run both Next.js and Netlify Functions
2. Functions will be available at both `/api/` and `/.netlify/functions/` paths
3. Changes to function files are automatically reloaded