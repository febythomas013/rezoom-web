import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <span className="text-xl font-bold tracking-tight">ReZoom</span>
        <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          Sign in →
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-8 pt-24 pb-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
          Track your wins.<br />Generate tailored resumes.
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto">
          Log work updates via WhatsApp voice notes. Generate a tailored resume for any job in 20 seconds.
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors"
        >
          Get started free
        </Link>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-8 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'Set up your profile',
              desc: 'Upload your resume. We import your experience, education, skills, and certifications automatically.',
            },
            {
              step: '2',
              title: 'Log wins via voice',
              desc: 'Send a WhatsApp voice note after a big project or achievement. We transcribe, extract, and save it.',
            },
            {
              step: '3',
              title: 'Generate your resume',
              desc: 'Paste a job description. Get a tailored resume PDF — delivered to WhatsApp or downloaded here.',
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mx-auto mb-4 text-lg">
                {step}
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 text-center py-8 text-sm text-gray-400">
        © 2025 ReZoom · rezoom.in
      </footer>
    </main>
  );
}
