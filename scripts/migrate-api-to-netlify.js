#!/usr/bin/env node

/**
 * Next.js API Routes to Netlify Functions Migration Script
 * Automatically converts all Next.js API routes to Netlify functions
 * Runs during build process to ensure serverless architecture consistency
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuration
const API_ROUTES_DIR = path.join(process.cwd(), 'src', 'app', 'api');
const LIB_DIR = path.join(process.cwd(), 'src', 'lib');
const NETLIFY_FUNCTIONS_DIR = path.join(process.cwd(), 'netlify', 'functions');
const NETLIFY_LIB_DIR = path.join(NETLIFY_FUNCTIONS_DIR, 'lib');
const GENERATED_PREFIX = 'api-';

// Library files that need to be migrated to Netlify functions
const LIBRARY_FILES_TO_MIGRATE = [
  'github-actions-compiler.ts'
];

// Ensure netlify functions directory exists
function ensureNetlifyFunctionsDir() {
  if (!fs.existsSync(NETLIFY_FUNCTIONS_DIR)) {
    fs.mkdirSync(NETLIFY_FUNCTIONS_DIR, { recursive: true });
    log(`📁 Created Netlify functions directory: ${NETLIFY_FUNCTIONS_DIR}`, 'green');
  }
}

// Ensure netlify functions lib directory exists
function ensureNetlifyLibDir() {
  if (!fs.existsSync(NETLIFY_LIB_DIR)) {
    fs.mkdirSync(NETLIFY_LIB_DIR, { recursive: true });
    log(`📁 Created Netlify functions lib directory: ${NETLIFY_LIB_DIR}`, 'green');
  }
}

// Convert TypeScript library file to JavaScript for Netlify
function convertLibraryFile(filename) {
  const sourceFile = path.join(LIB_DIR, filename);
  const targetFile = path.join(NETLIFY_LIB_DIR, filename.replace('.ts', '.js'));

  if (!fs.existsSync(sourceFile)) {
    log(`⚠️  Library file not found: ${sourceFile}`, 'yellow');
    return null;
  }

  log(`🔄 Converting library file: ${filename}`, 'cyan');

  let content = fs.readFileSync(sourceFile, 'utf8');

  // Convert TypeScript to JavaScript
  content = convertTypeScriptToJavaScript(content);

  return {
    filename: path.basename(targetFile),
    path: targetFile,
    content: content
  };
}

// Convert TypeScript syntax to JavaScript
function convertTypeScriptToJavaScript(content) {
  let converted = content;

  // Remove TypeScript imports and convert to CommonJS
  converted = converted.replace(/^import\s+.*?from\s+['"]([^'"]+)['"];?\s*$/gm, (match, modulePath) => {
    if (modulePath.startsWith('@octokit/')) {
      return `const { Octokit } = require('${modulePath}');`;
    }
    return ''; // Remove other imports that can't be converted
  });

  // Remove export statements and convert to module.exports
  converted = converted.replace(/^export\s+/gm, '');

  // Remove private/public/protected keywords
  converted = converted.replace(/\b(private|public|protected)\s+/g, '');

  // Remove TypeScript type annotations (more comprehensive but preserve switch case colons)
  converted = converted.replace(/:\s*Promise<[^>]+>/g, '');

  // Remove function return type annotations
  converted = converted.replace(/\)\s*:\s*[A-Za-z_$][A-Za-z0-9_$|<>\[\]\s]*\s*\{/g, ') {');

  // More careful type annotation removal that doesn't affect switch cases
  // Only remove type annotations that are followed by = or { or ) or ; or ,
  converted = converted.replace(/:\s*[A-Za-z_$][A-Za-z0-9_$]*(<[^>]*>)?(\[\])?(?=\s*[=,;)\{])/g, '');
  converted = converted.replace(/:\s*\{[^}]*\}(?=\s*[=,;)\{])/g, '');
  converted = converted.replace(/:\s*string\[\](?=\s*[=,;)\{])/g, '');
  converted = converted.replace(/:\s*(string|number|boolean|void|any)(?=\s*[=,;)\{])/g, '');

  // Remove complex type annotations like CompilationJob['status'] but not in switch cases
  converted = converted.replace(/let\s+\w+:\s*\w+\['[^']+'\]/g, (match) => {
    return match.replace(/:\s*\w+\['[^']+'\]/, '');
  });

  // Remove type assertions (as Type)
  converted = converted.replace(/\s+as\s+\w+/g, '');
  converted = converted.replace(/\s+as\s+[A-Za-z<>[\]]+/g, '');

  // Remove interface definitions
  converted = converted.replace(/^interface\s+\w+\s*\{[\s\S]*?\}/gm, '');

  // Remove type definitions
  converted = converted.replace(/^type\s+\w+\s*=[\s\S]*?;/gm, '');

  // Remove generic type parameters from function definitions
  converted = converted.replace(/async\s+(\w+)<[^>]*>/g, 'async $1');
  converted = converted.replace(/(\w+)<[^>]*>\s*\(/g, '$1(');

  // Fix switch case syntax if it got corrupted
  converted = converted.replace(/case\s+'([^']+)'\s*=\s*'([^']+)';/g, "case '$1':\n          status = '$2';");
  converted = converted.replace(/case\s+'([^']+)'\s*=\s*([^;]+);/g, "case '$1':\n          status = $2;");
  converted = converted.replace(/default\s*=\s*'([^']+)';/g, "default:\n          status = '$1';");

  // Fix object property assignment syntax
  converted = converted.replace(/const\s+(\w+)\s*=\s*\{/g, 'const $1 = {');

  // Fix shorthand property syntax (job_id should be job_id: jobId)
  converted = converted.replace(/job_id,/g, 'job_id: jobId,');

  // Replace deprecated substr with substring
  // substr(start, length) -> substring(start, start + length)
  converted = converted.replace(/\.substr\((\d+),\s*(\d+)\)/g, (match, start, length) => {
    const startNum = parseInt(start);
    const lengthNum = parseInt(length);
    return `.substring(${startNum}, ${startNum + lengthNum})`;
  });

  // Fix template literal corruption - sometimes ${} gets converted to {}
  // This is a post-processing fix for template literals
  converted = converted.replace(/`([^`]*)\{([^}]+)\}([^`]*)`/g, (_, before, content, after) => {
    // Only fix if it looks like it should be a template literal variable
    if (content.includes('jobId') || content.includes('error') || content.includes('response') ||
        content.includes('targetRun') || content.includes('runs.data') || content.includes('failedJob') ||
        content.includes('Date.now') || content.includes('Math.random') || content.includes('agentName') ||
        content.includes('artifact') || content.includes('run.') || content.includes('job.') ||
        content.includes('result.') || content.includes('status') || content.includes('pluginArtifact')) {
      return `\`${before}\${${content}}${after}\``;
    }
    return `\`${before}{${content}}${after}\``;
  });

  // Fix specific template literal patterns that got corrupted
  converted = converted.replace(/\$\$\{/g, '${'); // Fix double dollar signs
  converted = converted.replace(/\$\{([^}]+)\}\$/g, '${$1}'); // Fix trailing dollar signs
  converted = converted.replace(/console\.log\(`([^`]*) ID\$: \$\{([^}]+)\}`\)/g, 'console.log(`$1 ID: ${$2}`)');
  converted = converted.replace(/console\.log\(`([^`]*)\$: \$\{([^}]+)\}`\)/g, 'console.log(`$1: ${$2}`)');
  converted = converted.replace(/Error\(`([^`]*)\$: \$\{([^}]+)\}`\)/g, 'Error(`$1: ${$2}`)');
  converted = converted.replace(/`([^`]*) in step\$: \$\{([^}]+)\}`/g, '`$1 in step: ${$2}`');

  // Fix specific patterns found in the github-actions-compiler
  converted = converted.replace(/\$\{Math\.random\(\)\.toString\(36\)\.substring\(2, 2 \+ 9\)\}/g, '${Math.random().toString(36).substring(2, 9)}');
  converted = converted.replace(/`compile-\$\{Date\.now\(\)\}-\$\$\{Math\.random\(\)\.toString\(36\)\.substring\(2, 2 \+ 9\)\}`/g, '`compile-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`');
  converted = converted.replace(/`([^`]*)\$\{([^}]+)\}`/g, '`$1${$2}`'); // Remove extra $ before template literals

  // Remove empty lines that might have been created
  converted = converted.replace(/\n\s*\n\s*\n/g, '\n\n');

  // Final cleanup of template literal corruption
  converted = converted.replace(/\$\$\{/g, '${'); // Fix double dollar signs
  converted = converted.replace(/\}\$/g, '}'); // Remove trailing dollar signs
  converted = converted.replace(/ID\$:/g, 'ID:'); // Fix "ID$:" patterns
  converted = converted.replace(/job\$:/g, 'job:'); // Fix "job$:" patterns
  converted = converted.replace(/workflow\$:/g, 'workflow:'); // Fix "workflow$:" patterns
  converted = converted.replace(/failed\$:/g, 'failed:'); // Fix "failed$:" patterns
  converted = converted.replace(/artifact\$:/g, 'artifact:'); // Fix "artifact$:" patterns

  // Convert class exports to module.exports
  converted = converted.replace(/class\s+(\w+)/g, 'class $1');

  // Add module.exports at the end for the main class
  if (converted.includes('class GitHubActionsCompiler')) {
    converted += '\n\nmodule.exports = { GitHubActionsCompiler, createGitHubActionsCompiler };';
  }

  return converted;
}

// Get all API route files recursively
function getApiRoutes(dir, routes = []) {
  if (!fs.existsSync(dir)) {
    log(`⚠️  API routes directory not found: ${dir}`, 'yellow');
    return routes;
  }

  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      getApiRoutes(fullPath, routes);
    } else if (item === 'route.ts' || item === 'route.js') {
      // Found an API route file
      const relativePath = path.relative(API_ROUTES_DIR, fullPath);
      const routePath = path.dirname(relativePath);
      routes.push({
        filePath: fullPath,
        routePath: routePath === '.' ? '' : routePath,
        fileName: item
      });
    }
  }
  
  return routes;
}

// Convert Next.js route path to Netlify function name
function getNetlifyFunctionName(routePath) {
  if (!routePath) return `${GENERATED_PREFIX}index`;
  
  // Convert dynamic routes [param] to param
  const converted = routePath
    .replace(/\[([^\]]+)\]/g, '$1')  // [id] -> id
    .replace(/\//g, '-')             // / -> -
    .replace(/^-+|-+$/g, '')         // remove leading/trailing dashes
    .toLowerCase();
  
  return `${GENERATED_PREFIX}${converted}`;
}

// Check if route should be excluded from migration
function shouldExcludeRoute(routePath) {
  const excludedRoutes = [
    // Add routes to exclude here if needed
  ];

  return excludedRoutes.some(excluded => routePath.includes(excluded));
}

// Extract route content and convert to Netlify function
function convertRouteToNetlifyFunction(route) {
  // Skip excluded routes
  if (shouldExcludeRoute(route.routePath)) {
    log(`⚠️  Skipped route: ${route.routePath} (excluded from migration)`, 'yellow');
    return null;
  }

  const content = fs.readFileSync(route.filePath, 'utf8');

  // Extract imports and exports
  const imports = extractImports(content);
  const exports = extractExports(content);
  
  // Generate Netlify function
  const functionName = getNetlifyFunctionName(route.routePath);
  const netlifyFunction = generateNetlifyFunction(route, imports, exports, content);
  
  return {
    name: functionName,
    content: netlifyFunction,
    originalRoute: route.routePath || '/'
  };
}

// Extract import statements
function extractImports(content) {
  const importRegex = /^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm;
  const imports = content.match(importRegex) || [];

  // Convert ES6 imports to CommonJS requires
  return imports.map(imp => {
    // Skip Next.js specific imports that don't work in Netlify functions
    if (imp.includes('next/server') || imp.includes('NextResponse') || imp.includes('NextRequest')) {
      return '// NextResponse/NextRequest converted to native Netlify response format';
    }

    // Skip TypeScript type-only imports
    if (imp.includes('import type')) {
      return '// TypeScript type import - not needed in JavaScript';
    }

    // Handle different import patterns
    if (imp.includes('import {') && imp.includes('} from')) {
      // import { something } from 'module'
      const match = imp.match(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/);
      if (match) {
        const [, imports, module] = match;
        const convertedModule = convertModulePath(module);
        return `const { ${imports.trim()} } = require('${convertedModule}');`;
      }
    } else if (imp.includes('import ') && imp.includes(' from ')) {
      // import something from 'module'
      const match = imp.match(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/);
      if (match) {
        const [, name, module] = match;
        const convertedModule = convertModulePath(module);
        return `const ${name} = require('${convertedModule}');`;
      }
    }
    return `// ${imp} // TODO: Convert this import manually`;
  }).filter(imp => !imp.includes('TODO') && !imp.includes('TypeScript type import')); // Remove TODO and type imports
}

// Convert Next.js path aliases to relative paths for Netlify functions
function convertModulePath(modulePath) {
  // Special cases for modules that have Netlify-specific implementations
  if (modulePath === '@/lib/github-actions-compiler') {
    return './lib/github-actions-compiler.js';
  }
  if (modulePath === '@/lib/compiler/agent-compiler-interface') {
    return './lib/agent-compiler-interface.js';
  }
  if (modulePath === '@/lib/websocket-utils') {
    return './lib/websocket-utils.js';
  }

  // Convert @/lib/... to relative paths from netlify/functions/ to src/lib/
  if (modulePath.startsWith('@/lib/')) {
    const relativePath = '../../src/lib/' + modulePath.substring(6);
    // Add .js extension for TypeScript files that will be compiled
    return relativePath + '.js';
  }

  // Convert @/... to relative paths from netlify/functions/ to src/
  if (modulePath.startsWith('@/')) {
    const relativePath = '../../src/' + modulePath.substring(2);
    // Add .js extension for TypeScript files that will be compiled
    return relativePath + '.js';
  }

  // Keep other module paths as-is (npm packages, etc.)
  return modulePath;
}

// Extract export functions with improved parsing
function extractExports(content) {
  const exports = {};

  // More robust regex to match export functions - handle complex parameter signatures
  const functionRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS)\s*\(/g;
  let match;

  while ((match = functionRegex.exec(content)) !== null) {
    const method = match[1];
    const startIndex = match.index;

    // Find the complete function including parameters and body
    const functionInfo = extractCompleteFunction(content, startIndex);
    if (!functionInfo) continue;

    // Convert Next.js patterns to Netlify patterns
    const convertedFunction = convertNextJsToNetlify(method, functionInfo.body, functionInfo.params);
    exports[method] = convertedFunction;
  }

  return exports;
}

// Extract complete function including parameters and body
function extractCompleteFunction(content, startIndex) {
  // Find the opening parenthesis for parameters
  const openParenIndex = content.indexOf('(', startIndex);
  if (openParenIndex === -1) return null;

  // Find the matching closing parenthesis for parameters
  let parenCount = 0;
  let i = openParenIndex;
  let closingParenIndex = -1;

  while (i < content.length) {
    if (content[i] === '(') parenCount++;
    if (content[i] === ')') parenCount--;
    if (parenCount === 0) {
      closingParenIndex = i;
      break;
    }
    i++;
  }

  if (closingParenIndex === -1) return null;

  // Extract parameters
  const params = content.substring(openParenIndex + 1, closingParenIndex);

  // Find the opening brace for the function body
  const openBraceIndex = content.indexOf('{', closingParenIndex);
  if (openBraceIndex === -1) return null;

  // Find the matching closing brace for the function body
  let braceCount = 0;
  i = openBraceIndex;
  let closingBraceIndex = -1;

  while (i < content.length) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') braceCount--;
    if (braceCount === 0) {
      closingBraceIndex = i;
      break;
    }
    i++;
  }

  if (closingBraceIndex === -1) return null;

  // Extract the function body (content between braces)
  const body = content.substring(openBraceIndex + 1, closingBraceIndex);

  return {
    params: params.trim(),
    body: body.trim()
  };
}

// Convert Next.js function to Netlify function
function convertNextJsToNetlify(method, functionBody, params = '') {
  // Check if the function uses route parameters
  const usesParams = params.includes('params') || functionBody.includes('params.');

  // Clean up the function body and convert Next.js patterns
  let convertedBody = convertNextJsPatterns(functionBody);

  // Add parameter extraction if needed
  const paramExtraction = usesParams ? `
  // Extract route parameters from path
  const pathSegments = event.path.replace('/api/', '').split('/');
  const params = event.pathParameters || {};

  // For dynamic routes, extract parameters from path
  if (event.path.includes('/')) {
    // This will be handled by the main handler's extractParams function
  }` : '';

  return `async function ${method}(event, context) {
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
  ${paramExtraction}

  ${convertedBody}
}`;
}

// Convert Next.js specific patterns to Netlify equivalents
function convertNextJsPatterns(code) {
  let convertedCode = code;

  // Handle return NextResponse.json() patterns with better multi-line support
  convertedCode = convertedCode.replace(
    /return\s+NextResponse\.json\s*\(\s*(\{[\s\S]*?\})\s*(?:,\s*\{\s*status:\s*(\d+)\s*\})?\s*\)/g,
    (match, data, status) => {
      const statusCode = status || '200';
      // Keep the data object as-is, just remove the outer braces for JSON.stringify
      const cleanData = data.slice(1, -1).trim(); // Remove first { and last }
      return `return {
      statusCode: ${statusCode},
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({${cleanData}})
    }`;
    }
  );

  // Handle NextResponse.json() without return (shouldn't happen but just in case)
  convertedCode = convertedCode.replace(
    /NextResponse\.json\s*\(\s*(\{[\s\S]*?\})\s*(?:,\s*\{\s*status:\s*(\d+)\s*\})?\s*\)/g,
    (match, data, status) => {
      const statusCode = status || '200';
      // Keep the data object as-is, just remove the outer braces for JSON.stringify
      const cleanData = data.slice(1, -1).trim(); // Remove first { and last }
      return `return {
      statusCode: ${statusCode},
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({${cleanData}})
    }`;
    }
  );

  return convertedCode
    // TypeScript syntax removal - comprehensive patterns (but preserve object property values)
    .replace(/:\s*string(?=\s*[;=,)])/g, '') // String type annotations
    .replace(/:\s*number(?=\s*[;=,)])/g, '') // Number type annotations
    .replace(/:\s*boolean(?=\s*[;=,)])/g, '') // Boolean type annotations
    .replace(/:\s*any(?=\s*[;=,)])/g, '') // Any type annotations
    // More specific type annotation pattern that avoids object property values
    .replace(/\)\s*:\s*[a-zA-Z_$][a-zA-Z0-9_$<>[\]|&\s]*(?=\s*[{;])/g, ')') // Function return types
    .replace(/\w+\s*:\s*[a-zA-Z_$][a-zA-Z0-9_$<>[\]|&\s]*(?=\s*[;,)])/g, (match) => {
      // Only remove if it looks like a type annotation, not an object property
      if (match.includes('false') || match.includes('true') || match.includes('null') || /:\s*['"]/.test(match) || /:\s*\d/.test(match)) {
        return match; // Keep object property values
      }
      return match.replace(/:\s*[a-zA-Z_$][a-zA-Z0-9_$<>[\]|&\s]*/, ''); // Remove type annotation
    })
    .replace(/\s+as\s+[a-zA-Z_$][a-zA-Z0-9_$<>[\]|&'\s]*(?=\s*[;,)])/g, '') // Type assertions
    .replace(/\s+as\s+'[^']*'(?:\s*\|\s*'[^']*')*(?=\s*[;,)])/g, '') // String literal type assertions
    .replace(/interface\s+\w+\s*\{[^}]*\}/g, '') // Interface declarations
    .replace(/type\s+\w+\s*=\s*[^;]+;/g, '') // Type aliases
    // Request object methods
    .replace(/await\s+request\.json\(\)/g, 'requestBody')
    .replace(/request\.json\(\)/g, 'requestBody')
    .replace(/request\.url/g, '`https://${event.headers.host}${event.path}`')
    .replace(/request\.method/g, 'event.httpMethod')
    .replace(/request\.headers\.get\s*\(\s*['"]([^'"]+)['"]\s*\)/g, 'event.headers["$1"]')
    .replace(/request\.headers/g, 'event.headers')
    // URL and searchParams handling
    .replace(/new URL\(request\.url\)/g, 'new URL(`https://${event.headers.host}${event.path}`)')
    .replace(/url\.searchParams\.get\s*\(\s*['"]([^'"]+)['"]\s*\)/g, 'event.queryStringParameters?.$1')
    .replace(/url\.searchParams/g, 'new URLSearchParams(Object.entries(event.queryStringParameters || {}).map(([k,v]) => `${k}=${v}`).join("&"))')
    // Route parameters (dynamic routes)
    .replace(/params\.(\w+)/g, 'event.params?.$1')
    // Console.log statements (keep as-is)
    .replace(/console\.(log|error|warn|info)/g, 'console.$1')
    // Environment variables (keep as-is)
    .replace(/process\.env\./g, 'process.env.');
}

// Generate Netlify function content
function generateNetlifyFunction(route, imports, exports, originalContent) {
  const functionName = getNetlifyFunctionName(route.routePath);
  
  let netlifyFunction = `// Auto-generated Netlify function from Next.js API route
// Original route: /api/${route.routePath}
// Generated: ${new Date().toISOString()}

`;

  // Add imports (converted to CommonJS)
  if (imports.length > 0) {
    netlifyFunction += imports.join('\n') + '\n\n';
  }

  // Add CORS headers helper
  netlifyFunction += `// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
};

`;

  // Add route parameter extraction helper if needed
  if (route.routePath.includes('[') && route.routePath.includes(']')) {
    netlifyFunction += `// Extract route parameters
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

`;
  }

  // Add converted functions
  Object.entries(exports).forEach(([, functionBody]) => {
    netlifyFunction += `${functionBody}\n\n`;
  });

  // Add main handler
  netlifyFunction += `// Main Netlify function handler
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
    ${route.routePath.includes('[') ? `event.params = extractParams(event, '${route.routePath}');` : ''}
    
    // Route to appropriate handler
    switch (method) {
      ${Object.keys(exports).map(method => `
      case '${method}':
        if (typeof ${method} === 'function') {
          const result = await ${method}(event);
          return {
            ...result,
            headers: { ...corsHeaders, ...(result.headers || {}) }
          };
        }
        break;`).join('')}
      
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
${Object.keys(exports).map(method => `exports.${method.toLowerCase()} = ${method};`).join('\n')}
`;

  return netlifyFunction;
}

// Write Netlify function to file
function writeNetlifyFunction(func) {
  const filePath = path.join(NETLIFY_FUNCTIONS_DIR, `${func.name}.js`);

  // Check if this would overwrite a manually created function (non-API functions)
  if (fs.existsSync(filePath) && isManuallyCreatedFunction(`${func.name}.js`)) {
    log(`⚠️  Skipped: ${func.name}.js (manually created function preserved)`, 'yellow');
    return false;
  }

  // For API functions (api-* prefix), always overwrite to update them
  const isExistingApiFunction = fs.existsSync(filePath) && func.name.startsWith(GENERATED_PREFIX);

  fs.writeFileSync(filePath, func.content);

  if (isExistingApiFunction) {
    log(`🔄 Updated: ${func.name}.js (${func.originalRoute})`, 'cyan');
  } else {
    log(`✅ Created: ${func.name}.js (${func.originalRoute})`, 'green');
  }

  return true;
}



// Check if a function was manually created (not auto-generated from API routes)
function isManuallyCreatedFunction(filename) {
  const manuallyCreatedFunctions = [
    'auth.js',
    'compile-stream.js',
    'deploy-stream.js',
    'validate-api-keys.js',
    'validate-capabilities.js',
    'validate-identity.js',
    'validate-personality.js'
  ];

  return manuallyCreatedFunctions.includes(filename);
}

// Main migration function
async function migrateApiRoutes(options = {}) {
  const { testMode = false, testRoute = null } = options;

  log('🚀 Starting Next.js API Routes to Netlify Functions Migration', 'blue');
  if (testMode) {
    log('🧪 Running in TEST MODE - no files will be written', 'yellow');
  }
  log('================================================================', 'blue');
  
  try {
    // Ensure directories exist
    ensureNetlifyFunctionsDir();
    ensureNetlifyLibDir();

    // Note: We don't clean up functions here - we'll replace/create as needed

    // Migrate library files first
    log('📚 Migrating library files...', 'cyan');
    const libraryFiles = [];
    for (const filename of LIBRARY_FILES_TO_MIGRATE) {
      try {
        const libFile = convertLibraryFile(filename);
        if (libFile) {
          libraryFiles.push(libFile);

          if (testMode) {
            log(`🧪 Test conversion for library file ${filename}:`, 'cyan');
            log(`   Target: ${libFile.filename}`, 'cyan');
            log(`   Content preview (first 200 chars):`, 'cyan');
            log(`   ${libFile.content.substring(0, 200)}...`, 'cyan');
            log('', 'reset');
          } else {
            fs.writeFileSync(libFile.path, libFile.content, 'utf8');
            log(`✅ Migrated library file: ${libFile.filename}`, 'green');
          }
        }
      } catch (error) {
        log(`❌ Failed to migrate library file ${filename}: ${error.message}`, 'red');
      }
    }

    // Get all API routes
    let routes = getApiRoutes(API_ROUTES_DIR);

    // Filter to specific route if testing
    if (testRoute) {
      routes = routes.filter(route => route.routePath === testRoute);
      if (routes.length === 0) {
        log(`⚠️  Test route '${testRoute}' not found`, 'yellow');
        return;
      }
    }

    if (routes.length === 0) {
      log('⚠️  No API routes found to migrate', 'yellow');
      return;
    }

    log(`📊 Found ${routes.length} API route${routes.length > 1 ? 's' : ''} to migrate:`, 'cyan');
    routes.forEach(route => {
      log(`   • /api/${route.routePath || ''}`, 'cyan');
    });
    
    // Convert each route
    const functions = [];
    for (const route of routes) {
      try {
        const func = convertRouteToNetlifyFunction(route);

        // Skip if route was excluded
        if (func === null) {
          continue;
        }

        functions.push(func);

        if (testMode) {
          // In test mode, just show what would be generated
          log(`🧪 Test conversion for ${route.routePath}:`, 'cyan');
          log(`   Function name: ${func.name}.js`, 'cyan');
          log(`   Original route: /api/${func.originalRoute}`, 'cyan');
          log(`   Content preview (first 200 chars):`, 'cyan');
          log(`   ${func.content.substring(0, 200)}...`, 'cyan');
          log('', 'reset'); // Empty line for readability
        } else {
          writeNetlifyFunction(func);
        }
      } catch (error) {
        log(`❌ Failed to convert ${route.routePath}: ${error.message}`, 'red');
      }
    }
    
    // Summary
    log('\n📈 Migration Summary:', 'blue');
    log(`✅ Successfully migrated: ${functions.length}/${routes.length} routes`, 'green');
    log(`� Successfully migrated: ${libraryFiles.length}/${LIBRARY_FILES_TO_MIGRATE.length} library files`, 'green');
    log(`�📁 Generated functions in: ${NETLIFY_FUNCTIONS_DIR}`, 'cyan');
    log(`📁 Generated library files in: ${NETLIFY_LIB_DIR}`, 'cyan');

    if (functions.length > 0 || libraryFiles.length > 0) {
      log('\n🎉 Migration completed successfully!', 'green');
      log('Your Next.js API routes and library files are now available as Netlify functions.', 'green');
    }
    
    return true;
    
  } catch (error) {
    log(`💥 Migration failed: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    testMode: false,
    testRoute: null
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--test':
        options.testMode = true;
        break;
      case '--route':
        if (i + 1 < args.length) {
          options.testRoute = args[i + 1];
          i++; // Skip next argument
        }
        break;
      case '--help':
        console.log(`
Usage: node scripts/migrate-api-to-netlify.js [options]

Options:
  --test              Run in test mode (no files written)
  --route <path>      Test specific route (e.g., "health" for /api/health)
  --help              Show this help message

Examples:
  node scripts/migrate-api-to-netlify.js --test
  node scripts/migrate-api-to-netlify.js --test --route health
  node scripts/migrate-api-to-netlify.js
        `);
        process.exit(0);
    }
  }

  return options;
}

// Run if called directly
if (require.main === module) {
  const options = parseArgs();

  migrateApiRoutes(options)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`💥 Migration script crashed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { migrateApiRoutes };
