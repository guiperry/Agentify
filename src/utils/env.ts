// Environment variable utility that works in both browser and test environments

export const getEnvVar = (key: string): string | undefined => {
  // In Next.js environment
  if (typeof window !== 'undefined') {
    // Client-side: use NEXT_PUBLIC_ prefixed variables
    return process.env[key];
  }
  
  // Server-side: use regular process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  
  return undefined;
};

export const GOOGLE_CLIENT_ID = getEnvVar('NEXT_PUBLIC_GOOGLE_CLIENT_ID');
