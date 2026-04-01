// src/app/api/game/end/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/quick-auth-utils';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';
import {encrypt, decrypt} from '@/app/encryption';
import { encodePacked, keccak256, parseEther } from 'viem';


const SEED = '0xe420469c478d66526e7e1c31e8d44a350b9661ec6a81506835442e1084d92bc8';

function getSigningWallet() {
  const pass = decrypt(process.env.ENCRYPTED_PASS || '', 'r7p4l9');
  const privateKey = decrypt(process.env.ENCRYPTED_PK || '', pass);
  if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error('Server signing key not configured');
  }
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: celo,
    transport: http(),
  });
  return { account, walletClient };
}

export async function POST(req: NextRequest) {
  try {
    // Verify auth - supports both Farcaster QuickAuth and MiniPay wallet auth
    const auth = await verifyAuth(req);
    console.log('🟢 Game end auth:', auth.type, auth.type === 'farcaster' ? `fid:${auth.fid}` : `wallet:${auth.wallet}`);

    const body = await req.json();
    const { sessionId, points, walletAddress } = body;
    
    if (!sessionId || points === undefined || !walletAddress) {
      return NextResponse.json(
        { error: 'sessionId, points, and walletAddress are required' },
        { status: 400 }
      );
    }

    const hash = keccak256(
      encodePacked(
        ['bytes32', 'uint256', 'uint256'],
        [SEED, BigInt(sessionId), parseEther(points.toString())]
      )
    );

    const { account, walletClient } = getSigningWallet();
    const signature = await walletClient.signMessage({
      account,
      message: { raw: hash },
    });

    return NextResponse.json({
      success: true,
      message: 'Game session ended successfully',
      sessionId,
      points,
      signature
    });

  } catch (e: any) {
    console.error('❌ API /game/end error:', e.message);
    return NextResponse.json(
      { error: e.message || 'Failed to end game session' },
      { status: e.message?.includes('Invalid token') ? 401 : 500 }
    );
  }
}

