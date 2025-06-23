import { AppConfig } from '@/contexts/OnboardingContext';

// AppData now extends AppConfig to ensure compatibility
export type AppData = AppConfig;

export interface AppConnectionResult {
  success: boolean;
  appData?: AppData;
  error?: string;
  warning?: string;
}

function handleGitHubUrl(url: string, parsedUrl: URL): AppConnectionResult {
  // Extract repository information from GitHub URL
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

  if (pathParts.length >= 2) {
    const owner = pathParts[0];
    const repo = pathParts[1];
    const repoName = `${owner}/${repo}`;

    // Return GitHub repository information without trying to fetch API specs
    return {
      success: true,
      appData: {
        url,
        name: repo,
        type: 'Development',
        apiSpec: {
          info: {
            title: repo,
            description: `GitHub repository: ${repoName}`,
            version: '1.0.0'
          }
        },
        endpoints: {},
        authMethods: []
      },
      warning: 'GitHub repositories do not expose API specifications. Basic repository information extracted.'
    };
  }

  return {
    success: false,
    error: 'Invalid GitHub URL format. Expected format: https://github.com/owner/repository'
  };
}

export async function analyzeApplication(url: string): Promise<AppConnectionResult> {
  try {
    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);

      // Additional URL validation
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return {
          success: false,
          error: 'Invalid URL protocol. Please use http:// or https://'
        };
      }
    } catch (e) {
      return {
        success: false,
        error: 'Invalid URL format. Please provide a complete URL (e.g., https://example.com)'
      };
    }

    // Check if this is a GitHub repository or documentation URL
    if (parsedUrl.hostname === 'github.com') {
      return handleGitHubUrl(url, parsedUrl);
    }

    // Normalize the URL to ensure consistent behavior
    const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;

    // Attempt to discover API documentation
    const apiEndpoints = [
      `${normalizedUrl}/swagger.json`,
      `${normalizedUrl}/openapi.json`,
      `${normalizedUrl}/api-docs`,
      `${normalizedUrl}/.well-known/ai-plugin.json`
    ];
    
    let endpointsTried = 0;
    let corsErrors = 0;
    
    // Try each potential API documentation endpoint
    for (const endpoint of apiEndpoints) {
      try {
        endpointsTried++;
        console.log(`Attempting to fetch API spec from ${endpoint}`);
        
        // Use a try-catch for each fetch to handle CORS and other errors
        const response = await fetch(endpoint, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          mode: 'cors'
        });
        
        if (response.ok) {
          // Check content type to avoid parsing non-JSON responses
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.warn(`Endpoint ${endpoint} returned non-JSON content: ${contentType}`);
            continue;
          }
          
          try {
            const apiSpec = await response.json();
            
            // Validate that we got a valid object
            if (!apiSpec || typeof apiSpec !== 'object') {
              console.warn(`Endpoint ${endpoint} returned invalid JSON data`);
              continue;
            }
            
            // Extract app name and type from the API spec
            const appName = apiSpec.info?.title || parsedUrl.hostname;
            const appType = detectAppType(url, apiSpec);
            
            return {
              success: true,
              appData: {
                url,
                name: appName,
                type: appType,
                apiSpec,
                endpoints: extractEndpoints(apiSpec),
                authMethods: extractAuthMethods(apiSpec)
              }
            };
          } catch (jsonError) {
            console.error(`Failed to parse JSON from ${endpoint}:`, jsonError);
            continue;
          }
        } else {
          console.warn(`Endpoint ${endpoint} returned status ${response.status}: ${response.statusText}`);
        }
      } catch (e) {
        // Check if it's likely a CORS error
        const errorMessage = e instanceof Error ? e.message : String(e);
        if (errorMessage.includes('NetworkError') || errorMessage.includes('CORS')) {
          corsErrors++;
        }
        
        // Log but continue to next endpoint if this one fails
        console.warn(`Failed to fetch API spec from ${endpoint}: ${errorMessage}`);
      }
    }
    
    // If no API spec was found, provide more detailed feedback
    if (corsErrors > 0) {
      console.warn(`Encountered ${corsErrors} CORS errors out of ${endpointsTried} endpoints tried`);
      if (corsErrors === endpointsTried) {
        // Instead of failing, continue with basic information
        console.info(`Continuing with basic information for ${url} due to CORS restrictions`);
        
        // We'll still return success but with a warning message in the appData
        const appName = parsedUrl.hostname;
        const appType = detectAppType(url);
        
        return {
          success: true,
          appData: {
            url,
            name: appName,
            type: appType,
            apiSpec: { 
              info: { 
                title: appName,
                description: "Limited information available due to CORS restrictions. The application's API documentation cannot be accessed directly from your browser.",
                version: "unknown",
                corsRestricted: true
              } 
            },
            endpoints: {},
            authMethods: [],
            corsRestricted: true
          },
          warning: `CORS policy prevented access to API documentation. The server at ${url} does not allow cross-origin requests from this application. Continuing with limited information.`
        };
      }
    }
    
    // Return basic information if we couldn't find API docs but didn't encounter fatal errors
    const appName = parsedUrl.hostname;
    const appType = detectAppType(url);
    
    return {
      success: true,
      appData: {
        url,
        name: appName,
        type: appType,
        // Add a message about missing API documentation
        apiSpec: { info: { description: "No API documentation found. Basic information only." } },
        endpoints: {},
        authMethods: []
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Application analysis failed:', error);
    return {
      success: false,
      error: `Failed to analyze application: ${errorMessage}`
    };
  }
}

interface ApiSpecInfo {
  title?: string;
  [key: string]: unknown;
}

interface ApiSpec {
  info?: ApiSpecInfo;
  paths?: Record<string, Record<string, ApiEndpoint>>;
  components?: {
    securitySchemes?: Record<string, SecurityScheme>;
    [key: string]: unknown;
  };
  securityDefinitions?: Record<string, SecurityScheme>;
  [key: string]: unknown;
}

interface ApiEndpoint {
  operationId?: string;
  [key: string]: unknown;
}

interface SecurityScheme {
  type: string;
  [key: string]: unknown;
}

function detectAppType(url: string, apiSpec?: ApiSpec): string {
  // Enhanced app type detection logic
  if (apiSpec?.info?.title?.toLowerCase().includes('e-commerce')) return 'E-commerce';
  if (apiSpec?.info?.title?.toLowerCase().includes('cms')) return 'CMS';

  // URL-based detection (fallback)
  if (url.includes('shopify')) return 'E-commerce';
  if (url.includes('wordpress')) return 'CMS';
  if (url.includes('github')) return 'Development';
  if (url.includes('slack')) return 'Communication';

  return 'Web Application';
}

function extractEndpoints(apiSpec: ApiSpec): Record<string, string> {
  const endpoints: Record<string, string> = {};

  // Extract endpoints from OpenAPI/Swagger spec
  if (apiSpec.paths) {
    for (const [path, methods] of Object.entries(apiSpec.paths)) {
      for (const [method, details] of Object.entries(methods)) {
        const operationId = details.operationId || `${method}${path.replace(/\//g, '_')}`;
        endpoints[operationId] = `${method.toUpperCase()} ${path}`;
      }
    }
  }

  return endpoints;
}

function extractAuthMethods(apiSpec: ApiSpec): string[] {
  const authMethods: string[] = [];

  // Extract authentication methods from OpenAPI/Swagger spec
  if (apiSpec.components?.securitySchemes) {
    for (const [name, scheme] of Object.entries(apiSpec.components.securitySchemes)) {
      authMethods.push(`${scheme.type} (${name})`);
    }
  } else if (apiSpec.securityDefinitions) {
    // Swagger 2.0
    for (const [name, scheme] of Object.entries(apiSpec.securityDefinitions)) {
      authMethods.push(`${scheme.type} (${name})`);
    }
  }

  return authMethods;
}
