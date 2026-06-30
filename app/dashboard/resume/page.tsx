'use client';

import { useState } from 'react';

export default function ResumePage() {
  const [jd, setJd] = useState('');
  const [mode, setMode] = useState<'quick' | 'tailored'>('quick');
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPdfUrl(null);
    try {
      const res = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: mode === 'tailored' ? jd : undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Generation failed');
      }
      const blob = await res.blob();
      setPdfUrl(URL.createObjectURL(blob));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Resume builder</h1>
      <p className="text-sm text-gray-500 mb-8">
        Generate a resume from your logged experiences. Takes about 20 seconds.
      </p>

      <form onSubmit={generate} className="space-y-6">
        {/* Mode toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Resume type</label>
          <div className="flex gap-3">
            {([
              { key: 'quick', label: 'Quick', desc: 'Best general-purpose resume from all your experience' },
              { key: 'tailored', label: 'Tailored to a job', desc: 'Paste a job description for a targeted resume' },
            ] as const).map(({ key, label, desc }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`flex-1 p-4 rounded-xl border text-left transition-colors ${
                  mode === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className={`font-medium text-sm mb-1 ${mode === key ? 'text-blue-700' : 'text-gray-900'}`}>{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* JD textarea */}
        {mode === 'tailored' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job description</label>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={8}
              required={mode === 'tailored'}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || (mode === 'tailored' && !jd.trim())}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating — please wait...' : 'Generate resume'}
        </button>
      </form>

      {pdfUrl && (
        <div className="mt-8 bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Your resume is ready</h2>
            <a
              href={pdfUrl}
              download="resume.pdf"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Download PDF
            </a>
          </div>
          <iframe
            src={pdfUrl}
            className="w-full h-[600px] rounded-lg border border-gray-100"
            title="Resume preview"
          />
        </div>
      )}
    </div>
  );
}
