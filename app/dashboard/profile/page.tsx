'use client';

import { useState, useEffect } from 'react';

const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Every week' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Once a month' },
];

export default function ProfilePage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', location: '', linkedinUrl: '',
    jobTitle: '', company: '', interests: '',
    experienceLevel: 'experienced', checkinFrequency: 'weekly',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/user')
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          location: data.location ?? '',
          linkedinUrl: data.linkedinUrl ?? '',
          jobTitle: data.jobTitle && data.jobTitle !== 'hi' ? data.jobTitle : '',
          company: data.company ?? '',
          interests: data.interests ?? '',
          experienceLevel: data.experienceLevel ?? 'experienced',
          checkinFrequency: data.checkinFrequency ?? 'weekly',
        });
        setLoading(false);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>;

  const field = (label: string, key: keyof typeof form, placeholder = '', type = 'text') => (
    <div key={key}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-1">Profile</h1>
      <p className="text-gray-500 text-sm mb-8">This information appears on your generated resumes.</p>

      <form onSubmit={save} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {field('Full name', 'name', 'Feby Thomas')}
          {field('Current job title', 'jobTitle', 'Data Scientist')}
          {field('Company', 'company', 'APCFSS')}
          {field('Email', 'email', 'you@example.com', 'email')}
          {field('Phone', 'phone', '+91 98765 43210', 'tel')}
          {field('Location', 'location', 'Vijayawada, India')}
        </div>

        {field('LinkedIn URL', 'linkedinUrl', 'https://linkedin.com/in/yourname')}
        {field('Interests', 'interests', 'Financial Markets, Blogging')}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Experience level</label>
          <div className="flex gap-3">
            {(['fresher', 'experienced'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setForm((f) => ({ ...f, experienceLevel: level }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.experienceLevel === level
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp check-in frequency</label>
          <select
            value={form.checkinFrequency}
            onChange={(e) => setForm((f) => ({ ...f, checkinFrequency: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {FREQUENCY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
