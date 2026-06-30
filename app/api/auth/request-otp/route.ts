import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOtp, formatWhatsAppId } from '@/lib/auth';
import { sendOtp } from '@/lib/twilio';

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 });

  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Invalidate any existing OTPs for this phone
  await prisma.otpCode.updateMany({ where: { phone: digits, used: false }, data: { used: true } });

  await prisma.otpCode.create({ data: { phone: digits, code, expiresAt } });

  // Check if user exists — if not, we'll create them on verify
  const whatsappId = formatWhatsAppId(digits);
  const user = await prisma.user.findUnique({ where: { whatsappId } });

  await sendOtp(digits, code);

  return NextResponse.json({ ok: true, isNewUser: !user });
}
