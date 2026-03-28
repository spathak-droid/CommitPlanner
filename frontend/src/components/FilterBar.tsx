import React, { useState } from 'react';
import type { ChessPriority, PlanStatus } from '../types';

export interface FilterBarProps {
  priorities: ChessPriority[];
  onPrioritiesChange: (p: ChessPriority[]) => void;
  statuses: PlanStatus[];
  onStatusesChange: (s: PlanStatus[]) => void;
  completionBelow: number | null;
  onCompletionBelowChange: (n: number | null) => void;
  onClear: () => void;
}

const ALL_PRIORITIES: ChessPriority[] = ['MUST_DO', 'SHOULD_DO', 'NICE_TO_DO'];
const ALL_STATUSES: PlanStatus[] = ['DRAFT', 'LOCKED', 'RECONCILING', 'RECONCILED', 'CARRY_FORWARD'];

const PRIORITY_LABELS: Record<ChessPriority, string> = {
  MUST_DO: 'A · Must Do',
  SHOULD_DO: 'B · Should Do',
  NICE_TO_DO: 'C · Nice to Do',
};

const STATUS_LABELS: Record<PlanStatus, string> = {
  DRAFT: 'Draft',
  LOCKED: 'Locked',
  RECONCILING: 'Reconciling',
  RECONCILED: 'Reconciled',
  CARRY_FORWARD: 'Carry Forward',
};

const PRIORITY_STYLES: Record<ChessPriority, string> = {
  MUST_DO: 'bg-error-container text-on-error-container',
  SHOULD_DO: 'bg-tertiary-container text-on-tertiary-container',
  NICE_TO_DO: 'bg-primary-container text-on-primary-container',
};

export const FilterBar: React.FC<FilterBarProps> = ({
  priorities,
  onPrioritiesChange,
  statuses,
  onStatusesChange,
  completionBelow,
  onCompletionBelowChange,
  onClear,
}) => {
  const [open, setOpen] = useState(false);

  const activeCount = priorities.length + statuses.length + (completionBelow != null ? 1 : 0);

  const togglePriority = (p: ChessPriority) => {
    if (priorities.includes(p)) {
      onPrioritiesChange(priorities.filter((x) => x !== p));
    } else {
      onPrioritiesChange([...priorities, p]);
    }
  };

  const toggleStatus = (s: PlanStatus) => {
    if (statuses.includes(s)) {
      onStatusesChange(statuses.filter((x) => x !== s));
    } else {
      onStatusesChange([...statuses, s]);
    }
  };

  return (
    <div className="rounded-[1.25rem] bg-surface-lowest ring-1 ring-outline-variant/10 shadow-sm overflow-hidden">
      {/* Toggle bar */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-container-low transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-lg text-secondary">filter_list</span>
          <span className="font-bold text-sm text-on-surface">Filters</span>
          {activeCount > 0 && (
            <span className="px-2.5 py-0.5 bg-primary text-on-primary rounded-full text-xs font-black">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="px-3 py-1.5 text-xs font-bold text-secondary hover:text-on-surface hover:bg-surface-container rounded-full transition-colors"
            >
              Clear All
            </button>
          )}
          <span className="material-symbols-outlined text-lg text-secondary transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        </div>
      </button>

      {/* Expandable panel */}
      {open && (
        <div className="px-6 pb-6 border-t border-outline-variant/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
            {/* Chess Priority */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-secondary mb-3">
                Chess Priority
              </p>
              <div className="space-y-2">
                {ALL_PRIORITIES.map((p) => (
                  <label key={p} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={priorities.includes(p)}
                      onChange={() => togglePriority(p)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${PRIORITY_STYLES[p]}`}>
                      {PRIORITY_LABELS[p]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Plan Status */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-secondary mb-3">
                Plan Status
              </p>
              <div className="space-y-2">
                {ALL_STATUSES.map((s) => (
                  <label key={s} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={statuses.includes(s)}
                      onChange={() => toggleStatus(s)}
                      className="w-4 h-4 rounded accent-primary cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                      {STATUS_LABELS[s]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Completion Threshold */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-secondary mb-3">
                Completion Threshold
              </p>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Show plans below:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={completionBelow ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      onCompletionBelowChange(val === '' ? null : Number(val));
                    }}
                    placeholder="e.g. 50"
                    className="w-24 px-3 py-2 bg-surface-container-low border-0 rounded-[0.75rem] text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-sm font-semibold text-secondary">%</span>
                </div>
                {completionBelow != null && (
                  <p className="text-xs text-secondary">
                    Showing plans with avg completion below {completionBelow}%
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
