import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, formatWhatsAppId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { phone, code } = await req.json();
  if (!phone || !code) return NextResponse.json({ error: 'Phone and code required' }, { status: 400 });

  const digits = phone.replace(/\D/g, '');

  const otp = await prisma.otpCode.findFirst({
    where: { phone: digits, code, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });

  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

  const whatsappId = formatWhatsAppId(digits);
  let user = await prisma.user.findUnique({ where: { whatsappId } });

  if (!user) {
    user = await prisma.user.create({
      data: { whatsappId, currentState: 'checkin_idle' },
    });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
