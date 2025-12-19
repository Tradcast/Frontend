// src/lib/quick-auth-utils.ts
import { createClient, Errors } from '@farcaster/quick-auth';
import { NextRequest } from 'next/server';
import { getCachedFid, cacheFid } from './auth-session-cache';

const client = createClient();

/**
 * Verify QuickAuth token with caching for performance optimization
 * First checks cache (5-min TTL), then falls back to full JWT verification
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
  const domain = req.headers.get('host') || process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000';
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
  const domain = req.headers.get('host') || process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost:3000';
  
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
