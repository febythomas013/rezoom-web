import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
const FROM = process.env.TWILIO_WHATSAPP_NUMBER!;

export async function sendOtp(phone: string, code: string) {
  const to = `whatsapp:+${phone.replace(/\D/g, '')}`;
  return client.messages.create({
    from: FROM,
    to,
    body: `Your ReZoom verification code: *${code}*\n\nValid for 10 minutes. Don't share this with anyone.`,
  });
}
