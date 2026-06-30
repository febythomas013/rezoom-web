'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg('');
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/import-resume', { method: 'POST', body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Import failed');
      setUploadMsg(
        `Imported ${result.counts.experiences} experience(s), ${result.counts.education} education, ${result.counts.skills} skills, ${result.counts.projects} projects, ${result.counts.certifications} certifications, ${result.counts.leadership} leadership roles.`
      );
      await load();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
      <h1 className="text-2xl font-bold text-gray-900 mb-1">My data</h1>
      <p className="text-sm text-gray-500 mb-6">
        Everything imported from your resume and captured via WhatsApp voice updates.
      </p>

      {/* Upload card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-medium text-gray-900 text-sm">Import from resume PDF</div>
            <div className="text-gray-500 text-xs mt-0.5">
              Upload a PDF and we&apos;ll extract experience, education, skills, and more
            </div>
          </div>
          <label className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer shrink-0">
            {uploading ? 'Importing...' : 'Upload PDF'}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
        {uploadMsg && <p className="text-green-600 text-xs mt-3">{uploadMsg}</p>}
        {uploadError && <p className="text-red-500 text-xs mt-3">{uploadError}</p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs text-gray-400">({data[key]?.length ?? 0})</span>
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-gray-500 text-sm py-12 text-center bg-white rounded-xl border border-gray-200">
          No {tab} yet. Upload your resume PDF above to import.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-start justify-between gap-4 shadow-sm">
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
                className="text-gray-400 hover:text-red-500 text-lg shrink-0 transition-colors disabled:opacity-30"
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
