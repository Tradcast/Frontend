// src/app/api/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyQuickAuth } from '@/lib/quick-auth-utils';
import { env } from '@/lib/env';
import * as crypto from 'crypto';

// CRITICAL: Move this to environment variable in production!
const SECRET_KEY = process.env.WS_SECRET || 'ws_secret';

function encrypt(text: string, secret: string): string {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(secret, 'salt', 32);
  const iv = crypto.randomBytes(16); // 32 yap
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Return iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export async function POST(req: NextRequest) {
  try {
    const fid = await verifyQuickAuth(req);

    // Generate random token
    const token = crypto.randomBytes(32).toString('hex');

    // Create session end time (e.g., 6 minutes from now)
    const sessionEnd = new Date(Date.now() + 6 * 60 * 1000).toISOString();

    // Create payload
    const payload = {
      token,
      session_end: sessionEnd,
      fid
    };

    // Encrypt the payload
    const encryptedToken = encrypt(JSON.stringify(payload), SECRET_KEY);

    // Send to WebSocket server
    const wsUrl = `${env.WS_SESSION_URL}/start_session`;

    const wsResponse = await fetch(wsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encrypted_token: encryptedToken }),
    });

    if (!wsResponse.ok) {
      const errorText = await wsResponse.text();
      console.error('❌ WebSocket server error:', errorText);
      throw new Error(`WebSocket server error: ${wsResponse.status}`);
    }

    // Return encrypted token to user
    return NextResponse.json({
      encrypted_token: encryptedToken,
      expires_at: sessionEnd
    });

  } catch (e: any) {
    console.error('❌ API /verify error:', e.message);
    return NextResponse.json(
      { message: e.message || 'Verification failed' },
      { status: 401 }
    );
  }
}
