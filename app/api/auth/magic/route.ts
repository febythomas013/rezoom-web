import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';

const EXPIRY_MS = 15 * 60 * 1000;

function verifyMagicToken(token: string): { userId: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split('.');
    if (parts.length !== 3) return null;
    const [userId, tsStr, sig] = parts;
    const ts = parseInt(tsStr, 10);
    if (isNaN(ts) || Date.now() - ts > EXPIRY_MS) return null;
    const payload = `${userId}.${tsStr}`;
    const expected = crypto
      .createHmac('sha256', process.env.JWT_SECRET!)
      .update(payload)
      .digest('hex');
    if (sig !== expected) return null;
    return { userId };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const result = verifyMagicToken(token);
  if (!result) return NextResponse.json({ error: 'Invalid or expired link. Send "login" to the bot to get a new one.' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: result.userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await createSession(user.id);
  return NextResponse.redirect(new URL('/dashboard', req.url));
}
