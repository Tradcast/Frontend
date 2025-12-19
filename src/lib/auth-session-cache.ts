// src/lib/auth-session-cache.ts
// Server-side auth session cache for optimized token verification
// This caches verified FIDs to avoid repeated JWT verification calls

import * as crypto from 'crypto';

interface CachedSession {
  fid: number;
  cachedAt: number;
  expiresAt: number;
}

// Session cache with token hash as key
const sessionCache = new Map<string, CachedSession>();

// Cache TTL: 5 minutes in milliseconds
const CACHE_TTL_MS = 5 * 60 * 1000;

// Cleanup interval: run every 2 minutes
const CLEANUP_INTERVAL_MS = 2 * 60 * 1000;

/**
 * Hash the token to use as cache key (don't store raw tokens)
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Get cached FID for a token if it exists and hasn't expired
 */
export function getCachedFid(token: string): number | null {
  const tokenHash = hashToken(token);
  const session = sessionCache.get(tokenHash);
  
  if (!session) {
    return null;
  }
  
  // Check if session has expired
  if (Date.now() > session.expiresAt) {
    sessionCache.delete(tokenHash);
    return null;
  }
  
  return session.fid;
}

/**
 * Cache a verified FID for a token
 */
export function cacheFid(token: string, fid: number): void {
  const tokenHash = hashToken(token);
  const now = Date.now();
  
  sessionCache.set(tokenHash, {
    fid,
    cachedAt: now,
    expiresAt: now + CACHE_TTL_MS,
  });
}

/**
 * Invalidate a cached session
 */
export function invalidateSession(token: string): void {
  const tokenHash = hashToken(token);
  sessionCache.delete(tokenHash);
}

/**
 * Clean up expired sessions (called periodically)
 */
function cleanupExpiredSessions(): void {
  const now = Date.now();
  
  for (const [tokenHash, session] of sessionCache.entries()) {
    if (now > session.expiresAt) {
      sessionCache.delete(tokenHash);
    }
  }
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): { size: number; oldestAge: number | null } {
  const now = Date.now();
  let oldestAge: number | null = null;
  
  for (const session of sessionCache.values()) {
    const age = now - session.cachedAt;
    if (oldestAge === null || age > oldestAge) {
      oldestAge = age;
    }
  }
  
  return {
    size: sessionCache.size,
    oldestAge: oldestAge ? Math.round(oldestAge / 1000) : null, // in seconds
  };
}

// Start cleanup interval (only in Node.js environment)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL_MS);
}

