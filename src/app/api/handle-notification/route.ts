import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/quick-auth-utils';

const BACKEND_URL = 'http://localhost:6009';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);

    const fidValue = auth.type === 'farcaster' && auth.fid != null
      ? auth.fid.toString()
      : (auth.type === 'minipay' || auth.type === 'web') ? auth.wallet : undefined;

    if (!fidValue) {
      return NextResponse.json({ error: 'Missing fid' }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/notifications/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notification_clicked: 'True',
        fid: fidValue,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Notification backend error:', errorText);
      return NextResponse.json({ error: 'Backend error' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('❌ /api/handle-notification error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
