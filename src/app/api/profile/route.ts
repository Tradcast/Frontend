// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyQuickAuth } from '@/lib/quick-auth-utils';
import { env } from '@/lib/env';

export async function GET(req: NextRequest) {
  try {
    const fid = await verifyQuickAuth(req);

    // Extract username and wallet from query parameters
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const wallet = searchParams.get('wallet');

    // Build backend URL with all parameters
    const params = new URLSearchParams({ fid: fid.toString() });
    if (username) params.append('username', username);
    if (wallet) params.append('wallet', wallet);

    const backendUrl = `${env.BACKEND_API_URL}/api/v1/user/profile?${params.toString()}`;

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
    console.error('❌ API /profile error:', e.message);
    return NextResponse.json({ message: e.message }, { status: 401 });
  }
}
