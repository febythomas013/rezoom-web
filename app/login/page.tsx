'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const [copied, setCopied] = useState(false);

  function copyWord() {
    navigator.clipboard.writeText('login').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex justify-center mb-8">
          <Logo />
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-6">
            Open WhatsApp, message ReZoom, and get a one-click dashboard link.
          </p>

          <ol className="space-y-4 mb-6">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">1</span>
              <div>
                <p className="text-sm text-gray-700 font-medium">Open your ReZoom chat on WhatsApp</p>
                <p className="text-xs text-gray-500 mt-0.5">The same chat you use for check-ins</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">2</span>
              <div>
                <p className="text-sm text-gray-700 font-medium">Send the word:</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg text-sm font-mono font-semibold">login</code>
                  <button
                    onClick={copyWord}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">3</span>
              <div>
                <p className="text-sm text-gray-700 font-medium">Tap the link ReZoom sends back</p>
                <p className="text-xs text-gray-500 mt-0.5">Valid for 15 minutes</p>
              </div>
            </li>
          </ol>

          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500">
              The link opens this dashboard automatically — no code to type.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
