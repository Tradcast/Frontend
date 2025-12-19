// src/app/api/tradingarea/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyQuickAuth } from '@/lib/quick-auth-utils';
import WebSocket, { WebSocketServer } from 'ws';
import { encrypt } from '@/app/encryption';


export async function GET(req: NextRequest) {
  console.log('🔵 ===== API /api/game GET called =====');
  console.log('🔵 Request URL:', req.url);
  console.log('🔵 Request headers:', Object.fromEntries(req.headers.entries()));

  if (req.headers.get('upgrade') !== 'websocket') {
    console.error('❌ Not a websocket upgrade request');
    return NextResponse.json({ message: 'Expected websocket' }, { status: 400 });
  }

  // Setup WSS if not already set up
  // @ts-ignore
  const response = NextResponse.next();
  // @ts-ignore
  const server = response.socket?.server as any;

  if (server && !server.wss) {
    console.log('🔵 Setting up WebSocket server...');
    const wss = new WebSocketServer({ noServer: true }) as any;

    server.on('upgrade', async (request: any, socket: any, head: any) => {
      console.log('🔵 Upgrade request received');
      const url = new URL(request.url, `http://${request.headers.host}`);
      if (url.pathname !== '/api/game') {
        console.log('🔵 Not matching pathname, ignoring upgrade');
        return;
      }

      const headers = new Headers();
      for (const [key, value] of Object.entries(request.headers as Record<string, string | string[]>)) {
        if (Array.isArray(value)) {
          value.forEach(v => headers.append(key, v));
        } else if (typeof value === 'string') {
          headers.append(key, value);
        }
      }

      const nextReq = new NextRequest(url, { headers });

      try {
        console.log('🔵 Verifying QuickAuth for WS...');
        const fid = await verifyQuickAuth(nextReq);
        console.log('🔵 FID verified for WS:', fid);

        wss.handleUpgrade(request, socket, head, (ws: any) => {
          wss.emit('connection', ws, request, fid);
        });
      } catch (e: any) {
        console.error('❌ Auth error:', e.message);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
      }
    });

    wss.on('connection', (ws: any, req: any, fid: any) => {
      console.log('✅ WebSocket connection established, FID:', fid);

      const backendUrl = 'wss://api.simmerliq.com/ws'; //'ws://localhost:8031/ws';
      console.log('🔵 Connecting to backend WS:', backendUrl);
      const backendWS = new WebSocket(backendUrl);

      backendWS.on('open', () => {
        console.log('✅ Connected to Python WS');
      });

      backendWS.on('message', (data) => {
        console.log('🔵 Received from Python:', data.toString());
        ws.send(data);
      });

      backendWS.on('close', () => {
        console.log('🔵 Python WS closed, closing frontend WS');
        ws.close();
      });

      backendWS.on('error', (err) => {
        console.error('❌ Python WS error:', err);
        ws.close(1011, 'Backend error');
      });

      ws.on('message', (data: any) => {
        console.log('🔵 Received from frontend:', data.toString());
        if (backendWS.readyState === WebSocket.OPEN) {
          backendWS.send(data);
        }
      });

      ws.on('close', () => {
        console.log('🔵 Frontend WS closed');
        if (backendWS.readyState === WebSocket.OPEN) {
          console.log('🔵 Sending "stop" to Python and closing');
          backendWS.send('stop');
          backendWS.close();
        }
      });
    });

    server.wss = wss;
  }

  // Return 101 for upgrade
  return new Response(null, { status: 101 });
}

//
// import { keccak256, encodePacked } from 'viem'
//
// const SEED = '0x177b042b284dd9b830d4eb179695bcc14044fd1a';
// const hash = keccak256(encodePacked(
//   ['bytes32', 'uint256', 'uint256'],
//   [SEED, sessionId, amount]
// ));
// const sig = await walletClient.signMessage({
//   message: { raw: hash }
// });

