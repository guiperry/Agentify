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
 * Hook specifically for the app logo with preloading
 */
export function useAppLogo() {
  const [isLoaded, setIsLoaded] = useState(false);
  const logoPath = useAssetPath('Agentify_logo_2.png');
  
  useEffect(() => {
    if (logoPath) {
      // Preload the image
      const img = new Image();
      img.src = logoPath;
      img.onload = () => {
        setIsLoaded(true);
      };
      img.onerror = () => {
        // Even if there's an error, we set loaded to true to show fallback
        setIsLoaded(true);
      };
    }
  }, [logoPath]);

  return { logoPath, isLoaded };
}

/**
 * Hook for other common assets
 */
export function useAssets() {
  const { logoPath } = useAppLogo();
  
  return {
    logo: logoPath,
    favicon: useAssetPath('favicon.ico'),
    placeholder: useAssetPath('placeholder.svg')
  };
}
