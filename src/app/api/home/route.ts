// src/app/api/home/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/quick-auth-utils';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:5009';
const NOTIFICATION_URL = 'http://localhost:6009';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);

    const params = new URLSearchParams();
    const fidValue = auth.type === 'farcaster' && auth.fid != null
      ? auth.fid.toString()
      : (auth.type === 'minipay' || auth.type === 'web') ? auth.wallet : undefined;
    if (fidValue) params.append('fid', fidValue);

    const backendUrl = `${BACKEND_URL}/api/v1/user/home?${params.toString()}`;
    console.log('🟢 Calling backend:', backendUrl);

    const [homeResponse, notifResponse] = await Promise.all([
      fetch(backendUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }),
      fetch(`${NOTIFICATION_URL}/notification?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }).catch((err) => {
        console.warn('⚠️ Notification fetch failed:', err.message);
        return null;
      }),
    ]);

    if (!homeResponse.ok) {
      const errorText = await homeResponse.text();
      console.error('❌ Backend error:', errorText);
      throw new Error(`Backend error: ${homeResponse.status}`);
    }

    const data = await homeResponse.json();

    if (notifResponse && notifResponse.ok) {
      const notifData = await notifResponse.json();
      data.notification = notifData.notification ?? [];
      data.notifications_read = notifData.notifications_read ?? true;
    }

    return NextResponse.json(data);
  } catch (e: any) {
    console.error('❌ API /home error:', e.message);
    return NextResponse.json({ message: e.message }, { status: 401 });
  }
}

