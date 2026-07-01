export async function sendOtp(phone: string, code: string) {
  const to = phone.replace(/\D/g, '');
  const phoneId = process.env.WHATSAPP_PHONE_ID!;
  const token = process.env.WHATSAPP_TOKEN!;

  const body = `Your ReZoom verification code: *${code}*\n\nValid for 10 minutes. Don't share this with anyone.`;

  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body, preview_url: false },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `Meta API error ${res.status}`);
  }

  return res.json();
}
