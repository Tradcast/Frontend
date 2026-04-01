// src/lib/auth-fetch.ts
// Centralized authenticated fetch utility for all environments
// Supports: Farcaster (QuickAuth), MiniPay (wallet), and Web (wallet)

export type AuthEnvironment = 'farcaster' | 'minipay' | 'web';

interface AuthFetchOptions extends RequestInit {
  // Optional: explicitly specify auth type (useful for overrides)
  authType?: AuthEnvironment;
}

/**
 * Detect the current environment
 */
export function detectEnvironment(): AuthEnvironment {
  if (typeof window === 'undefined') return 'web';
  
  // Check for MiniPay
  if ((window as any).ethereum?.isMiniPay === true) {
    return 'minipay';
  }
  
  // Check for Farcaster Frame context
  const isFarcasterFrame = (
    window.location !== window.parent.location || // In an iframe
    (window as any).farcaster || // Farcaster SDK present
    window.location.href.includes('warpcast.com') ||
    document.referrer.includes('warpcast.com') ||
    document.referrer.includes('farcaster')
  );
  
  if (isFarcasterFrame) {
    return 'farcaster';
  }
  
  return 'web';
}

/**
 * Check if we should use wallet-based auth (MiniPay or Web)
 */
export function useWalletAuth(environment?: AuthEnvironment): boolean {
  const env = environment || detectEnvironment();
  return env === 'minipay' || env === 'web';
}

/**
 * Create an authenticated fetch function for the given environment
 * 
 * @param walletAddress - The connected wallet address (required for MiniPay/Web)
 * @param environment - Optional environment override
 * @returns A fetch function that adds appropriate authentication
 */
export function createAuthFetch(
  walletAddress: string | undefined,
  environment?: AuthEnvironment
) {
  const env = environment || detectEnvironment();
  
  return async function authFetch(
    url: string,
    options: AuthFetchOptions = {}
  ): Promise<Response> {
    const { authType, ...fetchOptions } = options;
    const effectiveEnv = authType || env;
    
    // For MiniPay and Web, use regular fetch with wallet address
    if (effectiveEnv === 'minipay' || effectiveEnv === 'web') {
      if (!walletAddress) {
        throw new Error('Wallet address required for authentication');
      }
      
      const separator = url.includes('?') ? '&' : '?';
      const authParam = effectiveEnv === 'web'
        ? `fid=${encodeURIComponent(walletAddress)}&authType=web`
        : `fid=${encodeURIComponent(walletAddress)}`;
      const authUrl = `${url}${separator}${authParam}`;
      
      console.log(`🔵 ${effectiveEnv.toUpperCase()}: Fetching ${url}`);
      return fetch(authUrl, fetchOptions);
    }
    
    // For Farcaster, use SDK quickAuth
    console.log('🟣 FARCASTER: Fetching with QuickAuth', url);
    const { sdk } = await import("@farcaster/frame-sdk");
    return sdk.quickAuth.fetch(url, fetchOptions);
  };
}

/**
 * React hook-friendly version - use this in components
 * Returns the authFetch function based on environment and wallet
 */
export function getAuthFetch(
  walletAddress: string | undefined,
  isMiniPay: boolean,
  isWeb: boolean
) {
  return async function authFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    // For MiniPay and Web, use regular fetch with wallet address
    if (isMiniPay || isWeb) {
      if (!walletAddress) {
        throw new Error('Wallet address required for authentication');
      }
      
      const separator = url.includes('?') ? '&' : '?';
      const authType = isWeb ? 'web' : 'minipay';
      const authParam = isWeb
        ? `fid=${encodeURIComponent(walletAddress)}&authType=web`
        : `fid=${encodeURIComponent(walletAddress)}`;
      const authUrl = `${url}${separator}${authParam}`;
      
      console.log(`🔵 ${authType.toUpperCase()}: Fetching ${url}`);
      return fetch(authUrl, options);
    }
    
    // For Farcaster, use SDK quickAuth
    console.log('🟣 FARCASTER: Fetching with QuickAuth', url);
    const { sdk } = await import("@farcaster/frame-sdk");
    return sdk.quickAuth.fetch(url, options);
  };
}
