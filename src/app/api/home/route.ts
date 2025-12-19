// src/app/api/home/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyQuickAuth } from '@/lib/quick-auth-utils';
import { env } from '@/lib/env';

export async function GET(req: NextRequest) {
  try {
    const fid = await verifyQuickAuth(req);

    const backendUrl = `${env.BACKEND_API_URL}/api/v1/user/home?fid=${fid}`;

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
    console.error('❌ API /home error:', e.message);
    return NextResponse.json({ message: e.message }, { status: 401 });
  }
}
