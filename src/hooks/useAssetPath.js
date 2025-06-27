'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to get asset paths that work in both development and production
 */
export function useAssetPath(assetPath) {
  const [resolvedPath, setResolvedPath] = useState('');

  useEffect(() => {
    // In Next.js, public assets are served from the root
    // Remove leading slash if present to avoid double slashes
    const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;
    setResolvedPath(`/${cleanPath}`);
  }, [assetPath]);

  return resolvedPath;
}

/**
 * Hook specifically for the app logo
 */
export function useAppLogo() {
  return useAssetPath('Agentify_logo_2.png');
}

/**
 * Hook for other common assets
 */
export function useAssets() {
  return {
    logo: useAssetPath('Agentify_logo_2.png'),
    favicon: useAssetPath('favicon.ico'),
    placeholder: useAssetPath('placeholder.svg')
  };
}
