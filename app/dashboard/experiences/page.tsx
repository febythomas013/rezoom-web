'use client';

import { useState, useEffect, useCallback } from 'react';

type Item = { id: string; [key: string]: unknown };
type DataStore = {
  experiences: Item[];
  education: Item[];
  certifications: Item[];
  projects: Item[];
  skills: Item[];
  leadership: Item[];
  languages: Item[];
};

const TABS = [
  { key: 'experiences', label: 'Experiences' },
  { key: 'education', label: 'Education' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'projects', label: 'Projects' },
  { key: 'skills', label: 'Skills' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'languages', label: 'Languages' },
] as const;

type TabKey = typeof TABS[number]['key'];

function formatValue(v: unknown): string {
  if (Array.isArray(v)) return v.join(', ');
  if (v instanceof Date) return v.toLocaleDateString();
  return String(v ?? '');
}

const DISPLAY_FIELDS: Record<TabKey, string[]> = {
  experiences: ['title', 'company', 'location', 'period'],
  education: ['degree', 'institution', 'year', 'cgpa'],
  certifications: ['name', 'issuer', 'issuedYear'],
  projects: ['title', 'description'],
  skills: ['name'],
  leadership: ['title', 'organization', 'period'],
  languages: ['language', 'proficiency'],
};

export default function ExperiencesPage() {
  const [data, setData] = useState<DataStore | null>(null);
  const [tab, setTab] = useState<TabKey>('experiences');
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/experiences');
    setData(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function remove(table: string, id: string) {
    setDeleting(id);
    await fetch('/api/experiences', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id }),
    });
    await load();
    setDeleting(null);
  }

  if (!data) return <div className="text-gray-400 text-sm">Loading...</div>;

  const items = data[tab] ?? [];
  const fields = DISPLAY_FIELDS[tab];
  const tableMap: Record<TabKey, string> = {
    experiences: 'experience', education: 'education', certifications: 'certification',
    projects: 'project', skills: 'skill', leadership: 'leadership', languages: 'language',
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">My data</h1>
      <p className="text-sm text-gray-500 mb-6">
        Everything imported from your resume and captured via WhatsApp voice updates.
        Import more by sending your resume PDF in WhatsApp.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs text-gray-400">({data[key]?.length ?? 0})</span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-gray-400 text-sm py-12 text-center bg-white rounded-xl border border-gray-100">
          No {tab} yet. Send your resume PDF on WhatsApp to import.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {fields.map((f) => {
                  const val = item[f];
                  if (!val && val !== 0) return null;
                  const formatted = formatValue(val);
                  if (!formatted) return null;
                  return (
                    <span key={f} className={f === fields[0] ? 'block font-medium text-gray-900 text-sm' : 'block text-xs text-gray-500 mt-0.5'}>
                      {formatted}
                    </span>
                  );
                })}
              </div>
              <button
                onClick={() => remove(tableMap[tab], item.id as string)}
                disabled={deleting === item.id}
                className="text-gray-300 hover:text-red-400 text-lg shrink-0 transition-colors disabled:opacity-30"
                title="Delete"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
