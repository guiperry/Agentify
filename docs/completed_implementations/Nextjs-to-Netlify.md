# Next.js API Routes to Netlify Functions Migration Script

Automatically converts Next.js API routes to Netlify serverless functions with full feature parity and production-ready output.

## 🚀 Features

### **Comprehensive Next.js Pattern Support**
- ✅ **NextResponse.json()** conversion with status codes
- ✅ **Request body parsing** (`await request.json()` → `requestBody`)
- ✅ **Dynamic route parameters** (`[id]`, `[filename]`, etc.)
- ✅ **Complex function signatures** with destructured parameters
- ✅ **TypeScript interfaces** and type annotations
- ✅ **Multiple HTTP methods** (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- ✅ **Environment variables** preservation
- ✅ **Template literals** with variable interpolation
- ✅ **Try-catch blocks** and error handling
- ✅ **Async/await patterns**

### **Production-Ready Output**
- ✅ **CORS headers** automatically included
- ✅ **Method routing** with proper HTTP method handling
- ✅ **Error handling** with standardized error responses
- ✅ **Parameter extraction** for dynamic routes
- ✅ **Individual function exports** for testing
- ✅ **Proper status codes** (200, 400, 500, etc.)

### **Smart Import/Export Management**
- ✅ **ES6 to CommonJS** conversion (`import` → `require`)
- ✅ **Next.js specific imports** filtered out
- ✅ **Custom module imports** preserved
- ✅ **Dependency resolution** maintained

### **Advanced Safeguards**
- ✅ **Manual function protection** - Won't overwrite existing Netlify functions
- ✅ **Syntax validation** - Checks generated functions before writing
- ✅ **Test mode support** - Preview conversions without writing files
- ✅ **Single route testing** - Test specific routes individually
- ✅ **Build integration** - Runs automatically during npm build

## 📦 Installation

The script is already included in your project at `scripts/migrate-api-to-netlify.js` and integrated into the build process.

## 🛠️ Usage

### **Automatic Migration (Build Process)**
```bash
npm run build
# Automatically runs migration as part of the build process
```

### **Manual Migration**
```bash
# Migrate all API routes
node scripts/migrate-api-to-netlify.js

# Test mode (no files written)
node scripts/migrate-api-to-netlify.js --test

# Migrate specific route
node scripts/migrate-api-to-netlify.js --route health
node scripts/migrate-api-to-netlify.js --route "deploy/[id]/rollback"

# Test specific route
node scripts/migrate-api-to-netlify.js --test --route compile
```

### **Available Commands**
```bash
# Run standalone migration
npm run migrate-api

# Help and options
node scripts/migrate-api-to-netlify.js --help
```

## 📁 File Structure

### **Input (Next.js API Routes)**
```
src/app/api/
├── health/route.ts
├── compile/route.ts
├── deploy/
│   ├── route.ts
│   └── [id]/rollback/route.ts
└── download/
    ├── engine/[platform]/route.ts
    └── plugin/[filename]/route.ts
```

### **Output (Netlify Functions)**
```
netlify/functions/
├── api-health.js
├── api-compile.js
├── api-deploy.js
├── api-deploy-id-rollback.js
├── api-download-engine-platform.js
└── api-download-plugin-filename.js
```

## 🔄 Conversion Examples

### **Simple Route Conversion**

**Input (`src/app/api/health/route.ts`):**
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Health check endpoint called');
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    deployment: 'netlify'
  });
}
```

**Output (`netlify/functions/api-health.js`):**
```javascript
// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
};

async function GET(event, context) {
  // Extract route parameters if this is a dynamic route
  if (event.pathParameters) {
    event.params = event.pathParameters;
  }

  // Parse request body if present
  let requestBody = {};
  if (event.body) {
    try {
      requestBody = JSON.parse(event.body);
    } catch (e) {
      requestBody = event.body;
    }
  }

  console.log('Health check endpoint called');
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      deployment: 'netlify'
    })
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

### **Dynamic Route with Parameters**

**Input (`src/app/api/deploy/[id]/rollback/route.ts`):**
```typescript
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const deploymentId = params.id;

    if (!deploymentId) {
      return NextResponse.json(
        { error: 'Deployment ID is required' },
        { status: 400 }
      );
    }

    console.log(`Starting rollback for deployment: ${deploymentId}`);

    return NextResponse.json({
      success: true,
      deploymentId,
      message: `Rollback initiated for deployment ${deploymentId}`,
      status: 'rollback_initiated'
    });

  } catch (error) {
    console.error('Rollback API error:', error);
    return NextResponse.json(
      { error: 'Failed to process rollback request' },
      { status: 500 }
    );
  }
}
```

**Output (`netlify/functions/api-deploy-id-rollback.js`):**
```javascript
// Extract route parameters
function extractParams(event, routePath) {
  const pathSegments = event.path.replace('/api/', '').split('/');
  const routeSegments = routePath.split('/');
  const params = {};
  
  routeSegments.forEach((segment, index) => {
    if (segment.startsWith('[') && segment.endsWith(']')) {
      const paramName = segment.slice(1, -1);
      params[paramName] = pathSegments[index];
    }
  });
  
  return params;
}

async function POST(event, context) {
  // Extract route parameters if this is a dynamic route
  if (event.pathParameters) {
    event.params = event.pathParameters;
  }

  // Parse request body if present
  let requestBody = {};
  if (event.body) {
    try {
      requestBody = JSON.parse(event.body);
    } catch (e) {
      requestBody = event.body;
    }
  }

  try {
    const deploymentId = event.params?.id;

    if (!deploymentId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({error: 'Deployment ID is required'})
      };
    }

    console.log(`Starting rollback for deployment: ${deploymentId}`);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        deploymentId,
        message: `Rollback initiated for deployment ${deploymentId}`,
        status: 'rollback_initiated'
      })
    };

  } catch (error) {
    console.error('Rollback API error:', error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({error: 'Failed to process rollback request'})
    };
  }
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
    
    // Add route parameters to event if dynamic route
    event.params = extractParams(event, 'deploy/[id]/rollback');
    
    // Route to appropriate handler
    switch (method) {
      case 'POST':
        if (typeof POST === 'function') {
          const result = await POST(event);
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
exports.post = POST;
```

## 🔧 Configuration

### **Protected Functions**
The script automatically preserves manually created Netlify functions:
- `auth.js` - Supabase authentication
- `compile-stream.js` - SSE compilation streaming
- `deploy-stream.js` - SSE deployment streaming
- `validate-*.js` - Form validation functions

### **Generated Function Naming**
- API routes are prefixed with `api-`
- Dynamic parameters are converted: `[id]` → `id`
- Nested paths use dashes: `/api/deploy/[id]/rollback` → `api-deploy-id-rollback.js`

### **Build Integration**
The script runs automatically during:
```bash
npm run build
# Executes: setup-build.js → test-imports.js → migrate-api-to-netlify.js → next build
```

## 🧪 Testing

### **Test Mode**
Preview conversions without writing files:
```bash
# Test all routes
node scripts/migrate-api-to-netlify.js --test

# Test specific route
node scripts/migrate-api-to-netlify.js --test --route health
```

### **Individual Function Testing**
Generated functions export individual handlers for testing:
```javascript
const { get, post } = require('./netlify/functions/api-health.js');

// Test the GET handler directly
const mockEvent = {
  httpMethod: 'GET',
  headers: {},
  body: null
};

const result = await get(mockEvent, {});
console.log(result);
```

## 🚨 Troubleshooting

### **Common Issues**

**1. Function Not Found**
```bash
⚠️  Test route 'my-route' not found
```
- Check the exact route path: `node scripts/migrate-api-to-netlify.js --test` to see all available routes
- Use the exact path shown in the list (e.g., `deploy/[id]/rollback`)

**2. Syntax Errors in Generated Functions**
```bash
❌ Invalid function generated for api-my-route.js - skipping
```
- The script validates generated functions before writing
- Check the original Next.js route for unsupported patterns
- Use test mode to preview the conversion

**3. Import Resolution Issues**
```javascript
// If you see this in generated functions:
const { myFunction } = require('@/lib/my-module');
```
- Ensure your module paths are correctly configured in your build process
- The script preserves import paths as-is

### **Supported Patterns**
✅ **Fully Supported:**
- `NextResponse.json()` with and without status codes
- `await request.json()` and request body parsing
- Dynamic route parameters `[id]`, `[filename]`, etc.
- Environment variables `process.env.*`
- Try-catch blocks and error handling
- Multiple HTTP methods per route
- TypeScript interfaces (stripped automatically)

⚠️ **Partially Supported:**
- Complex regex patterns in route matching
- Advanced TypeScript generics (converted to JavaScript)
- Custom middleware (needs manual conversion)

❌ **Not Supported:**
- Next.js specific APIs like `cookies()`, `headers()`
- Server-side rendering patterns
- Edge runtime specific features

## 📊 Migration Statistics

After running the migration, you'll see a summary:
```bash
📈 Migration Summary:
✅ Successfully migrated: 12/12 routes
📁 Generated functions in: /home/user/project/netlify/functions

🎉 Migration completed successfully!
Your Next.js API routes are now available as Netlify functions.
```

## 🔄 Continuous Integration

The script integrates seamlessly with your deployment pipeline:

1. **Development**: Use test mode to preview conversions
2. **Build**: Automatic migration during `npm run build`
3. **Deploy**: Netlify automatically deploys the generated functions
4. **Update**: Re-run migration when API routes change

## 📚 Advanced Usage

### **Custom Module Imports**
The script preserves your custom imports:
```javascript
// Original Next.js route
import { createAgentCompilerService } from '@/lib/compiler/agent-compiler-interface';

// Generated Netlify function
const { createAgentCompilerService } = require('@/lib/compiler/agent-compiler-interface');
```

### **Environment Variables**
Environment variables are preserved and work the same way:
```javascript
// Works in both Next.js and Netlify
process.env.NODE_ENV
process.env.GITHUB_TOKEN
```

### **Error Handling**
The script maintains your error handling patterns:
```javascript
// Original
try {
  // logic
} catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}

// Converted
try {
  // logic
} catch (error) {
  return {
    statusCode: 500,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ error: error.message })
  };
}
```

## 🎯 Best Practices

1. **Test Before Deploying**: Always use `--test` mode first
2. **Review Generated Functions**: Check the output for any manual adjustments needed
3. **Keep Imports Simple**: Use standard module imports for best compatibility
4. **Handle Parameters Safely**: Use optional chaining for route parameters (`event.params?.id`)
5. **Maintain Error Handling**: Ensure all error cases return proper HTTP status codes

## 🤝 Contributing

The migration script is part of your project's build tooling. To modify or extend:

1. Edit `scripts/migrate-api-to-netlify.js`
2. Test changes with `--test` mode
3. Verify with a few sample routes before full migration
4. Update this documentation for any new features

---

**🚀 Ready to migrate? Run `npm run migrate-api` to get started!**
