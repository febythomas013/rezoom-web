'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', label: '🇮🇳 +91' },
  { code: '+1',  country: 'US', label: '🇺🇸 +1'  },
  { code: '+44', country: 'GB', label: '🇬🇧 +44' },
  { code: '+61', country: 'AU', label: '🇦🇺 +61' },
  { code: '+65', country: 'SG', label: '🇸🇬 +65' },
  { code: '+60', country: 'MY', label: '🇲🇾 +60' },
  { code: '+971', country: 'AE', label: '🇦🇪 +971' },
  { code: '+49', country: 'DE', label: '🇩🇪 +49' },
  { code: '+33', country: 'FR', label: '🇫🇷 +33' },
];

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [localNumber, setLocalNumber] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fullPhone = `${countryCode}${localNumber.replace(/\D/g, '')}`;

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-8">
          <span className="text-2xl font-bold tracking-tight text-gray-900">ReZoom</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {step === 'phone' ? (
            <form onSubmit={requestOtp}>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Sign in</h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter your WhatsApp number — we&apos;ll send a code to verify it.
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp number
              </label>
              <div className="flex gap-2 mb-4">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-28 shrink-0"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={localNumber}
                  onChange={(e) => setLocalNumber(e.target.value)}
                  required
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <button
                type="submit"
                disabled={loading || localNumber.replace(/\D/g, '').length < 7}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending...' : 'Send code via WhatsApp'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp}>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Enter your code</h1>
              <p className="text-sm text-gray-500 mb-6">
                We sent a 6-digit code to your WhatsApp ({fullPhone}).
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-center tracking-widest text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mb-3"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Use a different number
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
