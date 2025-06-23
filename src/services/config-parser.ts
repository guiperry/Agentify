import { AppConfig } from '@/contexts/OnboardingContext';

export interface Schema {
  name: string;
  schema: Record<string, unknown>;
}

export interface Resource {
  id: string;
  type: string;
  [key: string]: unknown;
}

// Extend AppConfig to ensure compatibility
export interface ParsedConfig extends AppConfig {
  // Additional properties specific to ParsedConfig
  resources?: Resource[];
  schemas?: Schema[];
}

export async function parseConfigFile(file: File): Promise<ParsedConfig> {
  const fileContent = await readFileAsText(file);
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  let parsedData: Record<string, unknown>;
  
  // Parse based on file type
  if (fileExtension === 'json') {
    parsedData = JSON.parse(fileContent) as Record<string, unknown>;
  } else if (fileExtension && ['yaml', 'yml'].includes(fileExtension)) {
    parsedData = parseYaml(fileContent);
  } else {
    // Attempt to detect format from content
    try {
      parsedData = JSON.parse(fileContent) as Record<string, unknown>;
    } catch (e) {
      try {
        parsedData = parseYaml(fileContent);
      } catch (e2) {
        throw new Error('Unsupported file format. Please upload JSON or YAML files.');
      }
    }
  }
  
  // Detect the type of configuration file
  if (isOpenApiSpec(parsedData)) {
    return parseOpenApiSpec(parsedData, file.name);
  } else if (isAgentifyConfig(parsedData)) {
    return parseAgentifyConfig(parsedData, file.name);
  } else {
    // Generic configuration
    return {
      url: file.name, // Use filename as URL for uploaded configs
      name: (parsedData.name as string) || (parsedData.title as string) || 'Unnamed App',
      type: 'Custom Application',
      rawConfig: parsedData
    };
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function parseYaml(content: string): Record<string, unknown> {
  // In a real implementation, we would use a library like js-yaml
  // For this implementation, we'll throw an error to indicate that YAML parsing is not implemented
  throw new Error('YAML parsing not implemented. Please use JSON format.');
}

function isOpenApiSpec(data: Record<string, unknown>): boolean {
  return Boolean(
    (data.swagger && typeof data.swagger === 'string' && ['2.0', '3.0'].includes(data.swagger)) ||
    (data.openapi && typeof data.openapi === 'string' && data.openapi.startsWith('3.'))
  );
}

function isAgentifyConfig(data: Record<string, unknown>): boolean {
  return data.agentify !== undefined;
}

function parseOpenApiSpec(spec: Record<string, unknown>, fileName: string): ParsedConfig {
  const info = spec.info as Record<string, unknown> | undefined;
  
  return {
    url: fileName, // Use filename as URL for uploaded configs
    name: info?.title as string || 'API Application',
    type: 'API',
    endpoints: extractEndpointsFromSpec(spec),
    authMethods: extractAuthMethodsFromSpec(spec),
    schemas: extractSchemasFromSpec(spec),
    rawConfig: spec
  };
}

function parseAgentifyConfig(config: Record<string, unknown>, fileName: string): ParsedConfig {
  return {
    url: fileName, // Use filename as URL for uploaded configs
    name: config.name as string || 'Agentify Application',
    type: config.type as string || 'Custom Agent',
    endpoints: config.endpoints as Record<string, string> | undefined,
    resources: config.resources as Resource[] | undefined,
    rawConfig: config
  };
}

// Helper functions for extracting data from OpenAPI specs
function extractEndpointsFromSpec(spec: Record<string, unknown>): Record<string, string> {
  // Implementation similar to the one in app-connector.ts
  const endpoints: Record<string, string> = {};
  
  if (spec.paths) {
    const paths = spec.paths as Record<string, Record<string, { operationId?: string }>>;
    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, details] of Object.entries(methods)) {
        const operationId = details.operationId || `${method}${path.replace(/\//g, '_')}`;
        endpoints[operationId] = `${method.toUpperCase()} ${path}`;
      }
    }
  }
  
  return endpoints;
}

function extractAuthMethodsFromSpec(spec: Record<string, unknown>): string[] {
  // Implementation similar to the one in app-connector.ts
  const authMethods: string[] = [];
  
  const components = spec.components as { securitySchemes?: Record<string, { type: string }> } | undefined;
  if (components?.securitySchemes) {
    for (const [name, scheme] of Object.entries(components.securitySchemes)) {
      authMethods.push(`${scheme.type} (${name})`);
    }
  } else if (spec.securityDefinitions) {
    const securityDefinitions = spec.securityDefinitions as Record<string, { type: string }>;
    for (const [name, scheme] of Object.entries(securityDefinitions)) {
      authMethods.push(`${scheme.type} (${name})`);
    }
  }
  
  return authMethods;
}

function extractSchemasFromSpec(spec: Record<string, unknown>): Schema[] {
  const schemas: Schema[] = [];
  
  const components = spec.components as { schemas?: Record<string, Record<string, unknown>> } | undefined;
  if (components?.schemas) {
    for (const [name, schema] of Object.entries(components.schemas)) {
      schemas.push({
        name,
        schema
      });
    }
  } else if (spec.definitions) {
    const definitions = spec.definitions as Record<string, Record<string, unknown>>;
    for (const [name, schema] of Object.entries(definitions)) {
      schemas.push({
        name,
        schema
      });
    }
  }
  
  return schemas;
}
