// src/app/api/game/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyQuickAuth } from '@/lib/quick-auth-utils';
import * as crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // Verify QuickAuth to ensure the request is from authenticated Farcaster user
    const fid = await verifyQuickAuth(req);

    // Get wallet address from request body (frontend will send it)
    const body = await req.json();
    const walletAddress = body.walletAddress;
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Generate a random 256-bit session ID (64 hex characters = 32 bytes = 256 bits)
    const sessionIdBytes = crypto.randomBytes(32);
    const sessionIdHex = `0x${sessionIdBytes.toString('hex')}`;
    
    // Convert hex to BigInt for contract (uint256)
    const sessionIdBigInt = BigInt(sessionIdHex);

    // Return session ID to frontend
    return NextResponse.json({
      sessionId: sessionIdBigInt.toString(),
      sessionIdHex: sessionIdHex,
      fid: fid.toString()
    });

  } catch (e: any) {
    console.error('❌ API /game/start error:', e.message);
    return NextResponse.json(
      { error: e.message || 'Failed to create game session' },
      { status: e.message?.includes('Invalid token') ? 401 : 500 }
    );
  }
}

