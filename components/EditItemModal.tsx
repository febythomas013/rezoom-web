'use client';

import { useState } from 'react';

const MONTHS = [
  { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' }, { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' }, { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' }, { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' },
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 60 }, (_, i) => String(CURRENT_YEAR - i));

function parsePeriod(period: unknown) {
  const str = typeof period === 'string' ? period : '';
  if (!str) return { startMonth: '', startYear: '', endMonth: '', endYear: '', present: false };
  const parts = str.split('–').map((s) => s.trim());
  const parseOne = (s?: string) => {
    const m = s?.match(/^(\d{4})-(\d{2})$/);
    return m ? { year: m[1], month: m[2] } : { year: '', month: '' };
  };
  const start = parseOne(parts[0]);
  const present = parts[1]?.toLowerCase() === 'present';
  const end = present ? { year: '', month: '' } : parseOne(parts[1]);
  return { startMonth: start.month, startYear: start.year, endMonth: end.month, endYear: end.year, present };
}

function buildPeriod(startMonth: string, startYear: string, endMonth: string, endYear: string, present: boolean) {
  const start = startYear && startMonth ? `${startYear}-${startMonth}` : '';
  const end = present ? 'Present' : endYear && endMonth ? `${endYear}-${endMonth}` : '';
  if (!start && !end) return null;
  return [start, end].filter(Boolean).join(' – ');
}

// bullettext: stored as a plain String in DB, edited as one bullet per line
function descriptionToBullets(description: unknown): string {
  const str = typeof description === 'string' ? description : '';
  if (!str) return '';
  // Already contains newlines → use as-is
  if (str.includes('\n')) return str;
  // Single paragraph: split on ". " boundaries for initial editing convenience
  return str.split(/\.\s+(?=[A-Z])/).map((s) => s.replace(/\.$/, '').trim()).filter(Boolean).join('\n');
}

export type FieldType = 'text' | 'textarea' | 'bullettext' | 'taglist' | 'bulletlist' | 'daterange';
export interface FieldConfig { key: string; label: string; type: FieldType; }

export default function EditItemModal({
  title, fields, item, onClose, onSave, isNew,
}: {
  title: string;
  fields: FieldConfig[];
  item: Record<string, unknown>;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  isNew?: boolean;
}) {
  const buildInitial = () => {
    const initial: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.type === 'taglist') initial[f.key] = ((item[f.key] as string[]) || []).join(', ');
      else if (f.type === 'bulletlist') initial[f.key] = ((item[f.key] as string[]) || []).join('\n');
      else if (f.type === 'bullettext') initial[f.key] = descriptionToBullets(item[f.key]);
      else if (f.type === 'daterange') Object.assign(initial, parsePeriod(item[f.key]));
      else initial[f.key] = item[f.key] ?? '';
    }
    return initial;
  };

  const [form, setForm] = useState<Record<string, unknown>>(buildInitial);
  const [saving, setSaving] = useState(false);

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const data: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.type === 'taglist') {
        data[f.key] = String(form[f.key] || '').split(',').map((s) => s.trim()).filter(Boolean);
      } else if (f.type === 'bulletlist') {
        data[f.key] = String(form[f.key] || '').split('\n').map((s) => s.trim()).filter(Boolean);
      } else if (f.type === 'bullettext') {
        // Store as newline-separated string for Claude to read as structured input
        data[f.key] = String(form[f.key] || '').trim() || null;
      } else if (f.type === 'daterange') {
        data[f.key] = buildPeriod(
          String(form.startMonth || ''), String(form.startYear || ''),
          String(form.endMonth || ''), String(form.endYear || ''), Boolean(form.present)
        );
      } else {
        const v = String(form[f.key] ?? '').trim();
        data[f.key] = v || null;
      }
    }
    await onSave(data);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          {isNew ? `Add ${title}` : `Edit ${title}`}
        </h2>

        <div className="space-y-4">
          {fields.map((f) => {
            if (f.type === 'daterange') {
              return (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <div className="flex items-center flex-wrap gap-2">
                    <select value={String(form.startMonth || '')} onChange={(e) => set('startMonth', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Month</option>
                      {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select value={String(form.startYear || '')} onChange={(e) => set('startYear', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Year</option>
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <span className="text-gray-400 text-sm">to</span>
                    {form.present ? (
                      <span className="text-sm text-gray-500 px-1">Present</span>
                    ) : (
                      <>
                        <select value={String(form.endMonth || '')} onChange={(e) => set('endMonth', e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Month</option>
                          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <select value={String(form.endYear || '')} onChange={(e) => set('endYear', e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="">Year</option>
                          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </>
                    )}
                  </div>
                  <label className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <input type="checkbox" checked={Boolean(form.present)} onChange={(e) => set('present', e.target.checked)} />
                    Currently here / ongoing
                  </label>
                </div>
              );
            }

            if (f.type === 'bullettext') {
              return (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {f.label}
                    <span className="text-gray-400 font-normal"> — one achievement per line</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={String(form[f.key] ?? '')}
                      onChange={(e) => set(f.key, e.target.value)}
                      rows={5}
                      placeholder="Led the team to deliver X result&#10;Reduced processing time from 2 days to 1 hour&#10;Managed a cross-functional team of 7 members"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 pl-5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {/* Bullet guides — shown when textarea has content */}
                    {String(form[f.key] || '').split('\n').length > 0 && (
                      <div className="absolute left-1.5 top-2 pointer-events-none select-none text-gray-400 text-sm leading-[1.6rem]">
                        {String(form[f.key] || '').split('\n').map((_, i) => (
                          <div key={i}>•</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Press Enter to add a new bullet point</p>
                </div>
              );
            }

            if (f.type === 'textarea' || f.type === 'taglist' || f.type === 'bulletlist') {
              return (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {f.label}
                    {f.type === 'taglist' && <span className="text-gray-400 font-normal"> (comma-separated)</span>}
                    {f.type === 'bulletlist' && <span className="text-gray-400 font-normal"> (one per line)</span>}
                  </label>
                  <textarea
                    value={String(form[f.key] ?? '')}
                    onChange={(e) => set(f.key, e.target.value)}
                    rows={f.type === 'textarea' ? 4 : 3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              );
            }

            return (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  type="text"
                  value={String(form[f.key] ?? '')}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? 'Saving...' : isNew ? 'Add' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
