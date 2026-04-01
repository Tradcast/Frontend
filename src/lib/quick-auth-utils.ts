// src/lib/quick-auth-utils.ts
import { createClient, Errors } from '@farcaster/quick-auth';
import { NextRequest } from 'next/server';
import { getCachedFid, cacheFid } from './auth-session-cache';

const client = createClient();

// Result type for flexible auth (Farcaster fid, MiniPay wallet, or Web wallet)
export interface AuthResult {
  type: 'farcaster' | 'minipay' | 'web';
  fid?: number;
  wallet?: string;
}

/**
 * Verify authentication - supports Farcaster QuickAuth, MiniPay, and Web wallet auth
 * Returns AuthResult with either fid (Farcaster) or wallet (MiniPay/Web)
 */
export async function verifyAuth(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');
  const { searchParams } = new URL(req.url);
  // Support both fid=0x... (wallet as fid) and legacy wallet=0x...
  const fidParam = searchParams.get('fid');
  const walletParam = searchParams.get('wallet');
  const wallet = (fidParam && /^0x[a-fA-F0-9]{40}$/.test(fidParam))
    ? fidParam
    : walletParam;
  const authType = searchParams.get('authType'); // 'web' for web browser auth

  // If no auth header but wallet/fid (wallet address) is provided, this is wallet-based auth (MiniPay or Web)
  if ((!authHeader || !authHeader.startsWith('Bearer ')) && wallet) {
    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      throw new Error('Invalid wallet address format');
    }

    // Check if this is web auth or MiniPay auth
    if (authType === 'web') {
      console.log('🌐 Web auth with fid (wallet):', wallet);
      return { type: 'web', wallet };
    }

    console.log('🟡 MiniPay auth with fid (wallet):', wallet);
    return { type: 'minipay', wallet };
  }
  
  // Farcaster QuickAuth flow
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing token');
  }
  
  const token = authHeader.split(' ')[1];
  
  // Fast path: check cache first
  const cachedFid = getCachedFid(token);
  if (cachedFid !== null) {
    return { type: 'farcaster', fid: cachedFid };
  }
  
  // Slow path: verify JWT and cache result
  const domain = req.headers.get('host') || process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:6021';
  try {
    const payload = await client.verifyJwt({ token, domain });
    const fid = payload.sub; // FID
    
    // Cache the verified FID
    cacheFid(token, fid);
    
    return { type: 'farcaster', fid };
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      throw new Error('Invalid token');
    }
    throw e;
  }
}

/**
 * Verify QuickAuth token with caching for performance optimization
 * First checks cache (5-min TTL), then falls back to full JWT verification
 * @deprecated Use verifyAuth instead for MiniPay support
 */
export async function verifyQuickAuth(req: NextRequest): Promise<number> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing token');
  }
  const token = authHeader.split(' ')[1];
  
  // Fast path: check cache first
  const cachedFid = getCachedFid(token);
  if (cachedFid !== null) {
    return cachedFid;
  }
  
  // Slow path: verify JWT and cache result
  const domain = req.headers.get('host') || process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:6021';
  try {
    const payload = await client.verifyJwt({ token, domain });
    const fid = payload.sub; // FID
    
    // Cache the verified FID
    cacheFid(token, fid);
    
    return fid;
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      throw new Error('Invalid token');
    }
    throw e;
  }
}

/**
 * Verify QuickAuth without caching (for sensitive operations)
 * Use this for critical operations where you want fresh verification
 */
export async function verifyQuickAuthNoCache(req: NextRequest): Promise<number> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing token');
  }
  const token = authHeader.split(' ')[1];
  const domain = req.headers.get('host') || process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:6021';
  
  try {
    const payload = await client.verifyJwt({ token, domain });
    return payload.sub; // FID
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      throw new Error('Invalid token');
    }
    throw e;
  }
}
