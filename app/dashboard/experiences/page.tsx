'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import EditItemModal, { FieldConfig } from '@/components/EditItemModal';

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
  experiences:   ['title', 'company', 'location', 'period'],
  education:     ['degree', 'institution', 'year', 'cgpa'],
  certifications:['name', 'issuer', 'issuedYear'],
  projects:      ['title', 'description'],
  skills:        ['name'],
  leadership:    ['title', 'organization', 'period'],
  languages:     ['language', 'proficiency'],
};

const TABLE_MAP: Record<TabKey, string> = {
  experiences: 'experience', education: 'education', certifications: 'certification',
  projects: 'project', skills: 'skill', leadership: 'leadership', languages: 'language',
};

const TAB_SINGULAR: Record<TabKey, string> = {
  experiences: 'experience', education: 'education entry', certifications: 'certification',
  projects: 'project', skills: 'skill', leadership: 'leadership role', languages: 'language',
};

const EDIT_FIELDS: Record<TabKey, FieldConfig[]> = {
  experiences: [
    { key: 'title',       label: 'Job title',   type: 'text' },
    { key: 'company',     label: 'Company',     type: 'text' },
    { key: 'location',    label: 'Location',    type: 'text' },
    { key: 'period',      label: 'Dates',       type: 'daterange' },
    { key: 'description', label: 'Achievements', type: 'bullettext' },
    { key: 'skills',      label: 'Skills',      type: 'taglist' },
  ],
  education: [
    { key: 'degree',      label: 'Degree',      type: 'text' },
    { key: 'institution', label: 'Institution', type: 'text' },
    { key: 'year',        label: 'Year',        type: 'text' },
    { key: 'cgpa',        label: 'CGPA',        type: 'text' },
  ],
  certifications: [
    { key: 'name',       label: 'Certification name', type: 'text' },
    { key: 'issuer',     label: 'Issuer',             type: 'text' },
    { key: 'issuedYear', label: 'Year issued',        type: 'text' },
  ],
  projects: [
    { key: 'title',       label: 'Project title',  type: 'text' },
    { key: 'description', label: 'Description',    type: 'bullettext' },
    { key: 'skills',      label: 'Technologies',   type: 'taglist' },
    { key: 'link',        label: 'Link',           type: 'text' },
  ],
  skills: [
    { key: 'name', label: 'Skill', type: 'text' },
  ],
  leadership: [
    { key: 'title',        label: 'Role',         type: 'text' },
    { key: 'organization', label: 'Organization', type: 'text' },
    { key: 'location',     label: 'Location',     type: 'text' },
    { key: 'period',       label: 'Dates',        type: 'daterange' },
    { key: 'bullets',      label: 'Details',      type: 'bulletlist' },
  ],
  languages: [
    { key: 'language',    label: 'Language',    type: 'text' },
    { key: 'proficiency', label: 'Proficiency', type: 'text' },
  ],
};

const EMPTY_ITEM: Record<TabKey, Item> = {
  experiences:   { id: '', title: '', company: '', location: '', period: '', description: '', skills: [] },
  education:     { id: '', degree: '', institution: '', year: '', cgpa: '' },
  certifications:{ id: '', name: '', issuer: '', issuedYear: '' },
  projects:      { id: '', title: '', description: '', skills: [], link: '' },
  skills:        { id: '', name: '' },
  leadership:    { id: '', title: '', organization: '', location: '', period: '', bullets: [] },
  languages:     { id: '', language: '', proficiency: '' },
};

export default function ExperiencesPage() {
  const [data, setData] = useState<DataStore | null>(null);
  const [tab, setTab] = useState<TabKey>('experiences');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isNew, setIsNew] = useState(false);
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

  async function saveEdit(itemId: string, updatedData: Record<string, unknown>) {
    await fetch('/api/experiences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: TABLE_MAP[tab], id: itemId, data: updatedData }),
    });
    await load();
    setEditingItem(null);
  }

  async function saveNew(newData: Record<string, unknown>) {
    await fetch('/api/experiences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: TABLE_MAP[tab], data: newData }),
    });
    await load();
    setEditingItem(null);
    setIsNew(false);
  }

  function openNew() {
    setIsNew(true);
    setEditingItem(EMPTY_ITEM[tab]);
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
            <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>
        </div>
        {uploadMsg && <p className="text-green-600 text-xs mt-3">{uploadMsg}</p>}
        {uploadError && <p className="text-red-500 text-xs mt-3">{uploadError}</p>}
      </div>

      {/* Tabs + Add button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
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
        <button
          onClick={openNew}
          className="ml-3 flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add {TAB_SINGULAR[tab]}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-gray-500 text-sm py-12 text-center bg-white rounded-xl border border-gray-200">
          No {tab} yet.{' '}
          <button onClick={openNew} className="text-blue-600 hover:underline">Add one manually</button>
          {' '}or upload your resume PDF above.
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
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => { setIsNew(false); setEditingItem(item); }} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button onClick={() => remove(TABLE_MAP[tab], item.id)} disabled={deleting === item.id}
                  className="text-gray-400 hover:text-red-500 text-lg transition-colors disabled:opacity-30" title="Delete">
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingItem && (
        <EditItemModal
          title={TAB_SINGULAR[tab]}
          fields={EDIT_FIELDS[tab]}
          item={editingItem}
          isNew={isNew}
          onClose={() => { setEditingItem(null); setIsNew(false); }}
          onSave={isNew ? saveNew : (data) => saveEdit(editingItem.id, data)}
        />
      )}
    </div>
  );
}
