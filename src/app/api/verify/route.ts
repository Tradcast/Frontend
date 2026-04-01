// src/app/api/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/quick-auth-utils';
import * as crypto from 'crypto';

// CRITICAL: Move this to environment variable in production!
const SECRET_KEY = process.env.WS_SECRET || 'ws_secret';
const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:5009';

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
    const auth = await verifyAuth(req);

    // Generate random token
    const token = crypto.randomBytes(32).toString('hex');

    // Create session end time (e.g., 6 minutes from now)
    const sessionEnd = new Date(Date.now() + 6 * 60 * 1000).toISOString();

    // Create payload: always send fid (numeric for Farcaster, wallet address for MiniPay/Web) for backend
    const payload: any = {
      token,
      session_end: sessionEnd,
    };
    const fidValue = auth.type === 'farcaster' && auth.fid != null
      ? auth.fid
      : (auth.type === 'minipay' || auth.type === 'web') ? auth.wallet : undefined;
    if (fidValue !== undefined) payload.fid = fidValue;

    // Encrypt the payload
    const encryptedToken = encrypt(JSON.stringify(payload), SECRET_KEY);

    // Send to WebSocket server
    const wsUrl = `${BACKEND_URL}/api/v1/session/start_session`;

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
