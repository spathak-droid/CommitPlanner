import React, { useState } from 'react';
import type { ChessPriority, CreateCommitRequest } from '../types';
import { RcdoPicker } from './RcdoPicker';

interface Props {
  onSubmit: (data: CreateCommitRequest) => Promise<void>;
  onCancel: () => void;
}

const priorities: { value: ChessPriority; label: string; active: string }[] = [
  { value: 'MUST_DO',    label: 'Must Do',    active: 'bg-error-container text-on-error-container' },
  { value: 'SHOULD_DO',  label: 'Should Do',  active: 'bg-tertiary-container text-on-tertiary-container' },
  { value: 'NICE_TO_DO', label: 'Nice to Do', active: 'bg-primary-container text-on-primary-container' },
];

export const CommitForm: React.FC<Props> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [chessPriority, setChessPriority] = useState<ChessPriority>('SHOULD_DO');
  const [outcomeId, setOutcomeId] = useState('');
  const [plannedHours, setPlannedHours] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !outcomeId) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), chessPriority, outcomeId, plannedHours: plannedHours ? parseFloat(plannedHours) : null });
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-lowest rounded-[1rem] p-8 shadow-[0px_24px_48px_rgba(27,27,30,0.04)] ring-1 ring-outline-variant/10 space-y-6">
      <h3 className="text-xl font-bold text-on-surface">New Commitment</h3>

      <div>
        <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-surface-container-low border-0 rounded-full px-5 py-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="What are you committing to?" required />
      </div>

      <div>
        <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-surface-container-low border-0 rounded-[1rem] px-5 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          rows={3} placeholder="Additional context..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Planned Hours</label>
          <input type="number" value={plannedHours} onChange={(e) => setPlannedHours(e.target.value)}
            className="w-full bg-surface-container-low border-0 rounded-full px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            min="0" step="0.5" placeholder="0" />
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Priority</label>
          <div className="flex gap-2">
            {priorities.map((p) => (
              <button key={p.value} type="button" onClick={() => setChessPriority(p.value)}
                className={`flex-1 py-3 rounded-full text-xs font-black transition-all ${
                  chessPriority === p.value ? p.active : 'bg-surface-container text-secondary'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Link to Outcome</label>
        <RcdoPicker value={outcomeId} onChange={setOutcomeId} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="px-6 py-3 bg-white border border-outline-variant/20 rounded-full font-semibold text-sm text-secondary hover:bg-surface-container-low transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={!title.trim() || !outcomeId || submitting}
          className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-40 transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">add</span>
          {submitting ? 'Adding...' : 'Add Commitment'}
        </button>
      </div>
    </form>
  );
};
