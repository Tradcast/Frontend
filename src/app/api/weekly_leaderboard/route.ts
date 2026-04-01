// src/app/api/weekly_leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/quick-auth-utils';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:5009';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);

    // Build backend URL with appropriate auth parameter
    const params = new URLSearchParams();
    const fidValue = auth.type === 'farcaster' && auth.fid != null
      ? auth.fid.toString()
      : (auth.type === 'minipay' || auth.type === 'web') ? auth.wallet : undefined;
    if (fidValue) params.append('fid', fidValue);

    const backendUrl = `${BACKEND_URL}/api/v1/user/leaderboard/weekly?${params.toString()}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend error:', errorText);
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('❌ API /weekly_leaderboard error:', e.message);
    return NextResponse.json({ message: e.message }, { status: 401 });
  }
}

