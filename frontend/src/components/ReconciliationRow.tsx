import React, { useState } from 'react';
import type { CommitResponse, ReconcileCommitRequest } from '../types';
import { ChessBadge } from './ChessBadge';

interface Props {
  commit: CommitResponse;
  onReconcile: (commitId: string, data: ReconcileCommitRequest) => Promise<void>;
  disabled: boolean;
}

export const ReconciliationRow: React.FC<Props> = ({ commit, onReconcile, disabled }) => {
  const [actualHours, setActualHours] = useState(commit.actualHours?.toString() ?? '');
  const [completionPct, setCompletionPct] = useState(commit.completionPct?.toString() ?? '');
  const [notes, setNotes] = useState(commit.reconciliationNotes ?? '');
  const [carryForward, setCarryForward] = useState(commit.carryForward);
  const [saving, setSaving] = useState(false);

  const pct = commit.completionPct ?? 0;
  const currentPct = completionPct ? parseInt(completionPct, 10) : pct;
  const displayPct = Number.isFinite(currentPct) ? Math.max(0, Math.min(100, currentPct)) : pct;
  const tone = displayPct >= 80
    ? { bg: 'bg-primary', text: 'text-primary', chip: 'bg-primary-container/60 text-on-primary-container', label: 'On track' }
    : displayPct >= 50
      ? { bg: 'bg-tertiary', text: 'text-tertiary', chip: 'bg-tertiary-container/70 text-on-tertiary-container', label: 'Partial' }
      : { bg: 'bg-error', text: 'text-error', chip: 'bg-error-container/70 text-on-error-container', label: 'Needs follow-through' };
  const hasSavedValues = commit.actualHours !== null || commit.completionPct !== null || Boolean(commit.reconciliationNotes);

  const handleSave = async () => {
    if (!actualHours || !completionPct) return;
    setSaving(true);
    try { await onReconcile(commit.id, { actualHours: parseFloat(actualHours), completionPct: parseInt(completionPct, 10), reconciliationNotes: notes, carryForward }); }
    finally { setSaving(false); }
  };

  return (
    <div className="overflow-hidden rounded-[1.5rem] bg-surface-lowest shadow-[0px_18px_36px_rgba(27,27,30,0.06),0px_36px_70px_rgba(27,27,30,0.04)] ring-1 ring-outline-variant/10">
      <div className="border-b border-outline-variant/10 bg-gradient-to-r from-white to-surface-container-low/50 px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-surface-container" />
              <div className={`absolute inset-[6px] rounded-full ${tone.bg} opacity-15`} />
              <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full ${tone.bg} text-sm font-black text-white shadow-sm`}>
                {displayPct}%
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-xl font-black tracking-tight text-on-surface">{commit.title}</h4>
                <ChessBadge priority={commit.chessPriority} />
                <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${tone.chip}`}>
                  {tone.label}
                </span>
                {carryForward && (
                  <span className="rounded-full bg-secondary-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-on-secondary-container">
                    Carry Forward
                  </span>
                )}
              </div>

              {commit.description && (
                <p className="max-w-3xl text-sm leading-6 text-secondary">{commit.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-secondary">
                <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1.5">
                  <span className="material-symbols-outlined text-base text-tertiary">account_tree</span>
                  <span className="font-semibold text-tertiary">{commit.rallyCryName}</span>
                  <span>→</span>
                  <span>{commit.definingObjectiveName}</span>
                  <span>→</span>
                  <span className="font-semibold text-on-surface">{commit.outcomeName}</span>
                </span>
                {hasSavedValues && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
                    <span className="material-symbols-outlined text-sm">history</span>
                    Updated for this review
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-[1rem] bg-white/80 px-4 py-3 shadow-[0px_10px_24px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Planned</p>
              <p className="text-3xl font-black text-on-surface">{commit.plannedHours ?? '—'}<span className="text-lg font-bold text-secondary">h</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6 lg:grid-cols-[minmax(220px,260px)_1fr]">
        <div className="rounded-[1.25rem] bg-surface-container-low p-5 shadow-[inset_0px_1px_0px_rgba(255,255,255,0.45),0px_10px_24px_rgba(27,27,30,0.05)] ring-1 ring-white/50">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-secondary">Plan Snapshot</p>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-secondary">Planned Hours</p>
              <p className="mt-1 text-4xl font-black tracking-tight text-on-surface">{commit.plannedHours ?? '—'}<span className="text-lg font-bold text-secondary">h</span></p>
            </div>
            <div className="h-px bg-outline-variant/20" />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary">Current completion</span>
                <span className={`font-black ${tone.text}`}>{displayPct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface">
                <div className={`h-full rounded-full ${tone.bg}`} style={{ width: `${displayPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.25rem] bg-gradient-to-br from-tertiary-container/30 via-white to-surface-container-low p-5 shadow-[0px_14px_30px_rgba(137,119,232,0.12),0px_28px_60px_rgba(27,27,30,0.04)] ring-1 ring-outline-variant/10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-tertiary">Actuals & Notes</p>
              <p className="mt-1 text-sm text-secondary">Capture what happened this week and what should continue.</p>
            </div>
            {disabled && (
              <span className="rounded-full bg-surface-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-secondary">
                Read only
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-secondary">Actual Hours</span>
              <input
                type="number"
                value={actualHours}
                onChange={(e) => setActualHours(e.target.value)}
                className="w-full rounded-[1rem] border border-outline-variant/15 bg-white px-4 py-3 text-sm font-medium text-on-surface shadow-[0px_8px_18px_rgba(27,27,30,0.05)] outline-none transition-all focus:ring-2 focus:ring-tertiary/30"
                min="0"
                step="0.5"
                disabled={disabled}
                placeholder="0.0"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-secondary">Completion</span>
              <input
                type="number"
                value={completionPct}
                onChange={(e) => setCompletionPct(e.target.value)}
                className="w-full rounded-[1rem] border border-outline-variant/15 bg-white px-4 py-3 text-sm font-medium text-on-surface shadow-[0px_8px_18px_rgba(27,27,30,0.05)] outline-none transition-all focus:ring-2 focus:ring-tertiary/30"
                min="0"
                max="100"
                disabled={disabled}
                placeholder="0 - 100"
              />
            </label>
          </div>

          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-secondary">Reconciliation Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[116px] w-full resize-none rounded-[1rem] border border-outline-variant/15 bg-white px-4 py-3 text-sm leading-6 text-on-surface shadow-[0px_8px_18px_rgba(27,27,30,0.05)] outline-none transition-all focus:ring-2 focus:ring-tertiary/30"
              placeholder="What changed, what shipped, and what needs another week?"
              disabled={disabled}
            />
          </label>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <label className="inline-flex items-center gap-3 text-sm font-medium text-on-surface">
              <input
                type="checkbox"
                checked={carryForward}
                onChange={(e) => setCarryForward(e.target.checked)}
                disabled={disabled}
                className="h-4 w-4 rounded border-outline-variant text-tertiary focus:ring-tertiary"
              />
              Carry this commitment into the next cycle
            </label>

            {!disabled && (
              <button
                onClick={handleSave}
                disabled={!actualHours || !completionPct || saving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-tertiary px-6 py-3 text-sm font-bold text-on-tertiary shadow-[0px_16px_30px_rgba(137,119,232,0.24)] transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-lg">{saving ? 'progress_activity' : 'save'}</span>
                {saving ? 'Saving...' : 'Save Review'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
