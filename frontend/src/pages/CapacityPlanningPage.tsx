import React, { useEffect, useState } from 'react';
import { usePageTransition, useStaggerReveal } from '../hooks/useAnimations';
import * as api from '../services/api';
import type { CapacityEntry } from '../types';

function getMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const CapacityPlanningPage: React.FC = () => {
  const [weekStart, setWeekStart] = useState(getMonday());
  const [entries, setEntries] = useState<CapacityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const pageRef = usePageTransition([loading]);
  const listRef = useStaggerReveal([entries.length]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.fetchCapacity(weekStart)
      .then((data) => { if (!cancelled) setEntries(data); })
      .catch(() => { if (!cancelled) setEntries([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [weekStart]);

  const overcommitted = entries.filter((e) => e.totalPlannedHours > e.capacityHours);

  const getBarColor = (planned: number, capacity: number) => {
    const ratio = planned / capacity;
    if (ratio > 1) return 'bg-error';
    if (ratio >= 0.8) return 'bg-[#d4a017]';
    return 'bg-primary';
  };

  const getBarBg = (planned: number, capacity: number) => {
    const ratio = planned / capacity;
    if (ratio > 1) return 'bg-error-container';
    if (ratio >= 0.8) return 'bg-[#fef3c7]';
    return 'bg-primary-container';
  };

  return (
    <div ref={pageRef} className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-surface-lowest to-tertiary-container/20 p-8 shadow-[0px_18px_40px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-tertiary/10 blur-3xl" />
        <div className="space-y-3">
          <p className="text-tertiary font-bold tracking-widest text-xs uppercase opacity-80">Manager Tools</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Capacity Planning</h1>
          <p className="text-secondary text-sm max-w-xl">
            See how each team member's planned hours compare to their capacity for the selected week.
          </p>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <label className="text-xs font-bold text-secondary uppercase tracking-widest">Week of</label>
          <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)}
            className="bg-white border border-outline-variant/20 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tertiary/30" />
        </div>
      </div>

      {/* Overcommitment alert */}
      {overcommitted.length > 0 && (
        <div className="rounded-[1.25rem] bg-error-container/40 ring-1 ring-error/20 p-5 flex items-start gap-3">
          <span className="material-symbols-outlined text-2xl text-error mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <div>
            <p className="font-black text-sm text-error">Overcommitment Detected</p>
            <p className="text-sm text-on-surface mt-1">
              {overcommitted.map((e) => e.fullName).join(', ')} {overcommitted.length === 1 ? 'has' : 'have'} planned hours exceeding capacity.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 text-secondary">Loading capacity data...</div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <span className="material-symbols-outlined text-5xl text-outline-variant">group_off</span>
          <p className="text-secondary font-medium">No capacity data for this week</p>
        </div>
      ) : (
        <div ref={listRef} className="space-y-4">
          {entries.map((entry) => {
            const pct = entry.capacityHours > 0
              ? Math.round((entry.totalPlannedHours / entry.capacityHours) * 100)
              : 0;
            const barWidth = Math.min(pct, 120);
            const mustDo = entry.priorityBreakdown['MUST_DO'] ?? 0;
            const shouldDo = entry.priorityBreakdown['SHOULD_DO'] ?? 0;
            const niceToDo = entry.priorityBreakdown['NICE_TO_DO'] ?? 0;

            return (
              <div key={entry.userId} className="bg-surface-lowest rounded-[1.25rem] p-6 shadow-[0px_10px_30px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-11 h-11 rounded-full bg-tertiary-container flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-on-tertiary-container">{entry.fullName.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-on-surface truncate">{entry.fullName}</p>
                    <p className="text-xs text-secondary">
                      {entry.totalPlannedHours}h planned / {entry.capacityHours}h capacity ({pct}%)
                    </p>
                  </div>
                  <span className={`text-2xl font-black ${pct > 100 ? 'text-error' : pct >= 80 ? 'text-[#d4a017]' : 'text-primary'}`}>
                    {pct}%
                  </span>
                </div>

                {/* Capacity bar */}
                <div className={`h-3 w-full rounded-full overflow-hidden ${getBarBg(entry.totalPlannedHours, entry.capacityHours)}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(entry.totalPlannedHours, entry.capacityHours)}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                {/* Priority breakdown */}
                <div className="flex gap-4 mt-3 text-xs text-secondary">
                  {mustDo > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-error inline-block" />
                      Must Do: {mustDo}h
                    </span>
                  )}
                  {shouldDo > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-tertiary inline-block" />
                      Should Do: {shouldDo}h
                    </span>
                  )}
                  {niceToDo > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary-container inline-block" />
                      Nice To Do: {niceToDo}h
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CapacityPlanningPage;
