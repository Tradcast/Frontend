// src/lib/quick-auth-utils.ts
import { createClient, Errors } from '@farcaster/quick-auth';
import { NextRequest } from 'next/server';

const client = createClient();

export async function verifyQuickAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing token');
  }
  const token = authHeader.split(' ')[1];
  const domain = req.headers.get('host') || 'localhost:3000'; // Adjust for production
  try {
    const payload = await client.verifyJwt({ token, domain });
    return payload.sub; // FID
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      throw new Error('Invalid token');
    }
    throw e;
  }
}