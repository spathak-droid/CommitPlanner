import React, { useEffect, useState } from 'react';
import { usePageTransition, useStaggerReveal } from '../hooks/useAnimations';
import * as api from '../services/api';
import type { CalendarEntry, PlanStatus } from '../types';

function weeksAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return d.toISOString().split('T')[0]!;
}

const STATUS_COLORS: Record<string, { dot: string; bg: string; label: string }> = {
  DRAFT: { dot: 'bg-blue-500', bg: 'bg-blue-50', label: 'Draft' },
  LOCKED: { dot: 'bg-yellow-500', bg: 'bg-yellow-50', label: 'Locked' },
  RECONCILING: { dot: 'bg-orange-500', bg: 'bg-orange-50', label: 'Reconciling' },
  RECONCILED: { dot: 'bg-primary', bg: 'bg-primary-container', label: 'Reconciled' },
  CARRY_FORWARD: { dot: 'bg-tertiary', bg: 'bg-tertiary-container', label: 'Carry Forward' },
  NONE: { dot: 'bg-gray-300', bg: 'bg-gray-50', label: 'No Plan' },
};

interface Props {
  onNavigateToPlan?: () => void;
}

const CalendarViewPage: React.FC<Props> = ({ onNavigateToPlan }) => {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const pageRef = usePageTransition([loading]);
  const listRef = useStaggerReveal([entries.length]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const from = weeksAgo(13);
    const to = new Date().toISOString().split('T')[0]!;
    api.fetchCalendar(from, to)
      .then((data) => { if (!cancelled) setEntries(data); })
      .catch(() => { if (!cancelled) setEntries([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Summary stats
  const weeksWithPlans = entries.filter((e) => e.planId !== null).length;
  const avgCompletion = entries.length > 0
    ? Math.round(entries.reduce((s, e) => s + e.avgCompletionPct, 0) / Math.max(entries.filter(e => e.planId).length, 1))
    : 0;

  // Streak: consecutive recent weeks with plans (from most recent)
  let streak = 0;
  const sorted = [...entries].sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));
  for (const e of sorted) {
    if (e.planId) streak++;
    else break;
  }

  const getStatusInfo = (status: PlanStatus | null) => {
    const key = status ?? 'NONE';
    return STATUS_COLORS[key] ?? { dot: 'bg-gray-300', bg: 'bg-gray-50', label: 'No Plan' };
  };

  const handleWeekClick = (entry: CalendarEntry) => {
    if (entry.planId && onNavigateToPlan) {
      onNavigateToPlan();
    }
  };

  return (
    <div ref={pageRef} className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-surface-lowest to-primary-container/20 p-8 shadow-[0px_18px_40px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="space-y-3">
          <p className="text-primary font-bold tracking-widest text-xs uppercase opacity-80">Planning History</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">90-Day Calendar</h1>
          <p className="text-secondary text-sm max-w-xl">
            View your weekly planning history over the last 13 weeks. Click a week to view its plan.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.5rem] bg-gradient-to-br from-primary-container/35 to-white p-5 shadow-[0px_14px_32px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">Weekly Streak</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-primary">{streak}</p>
          <p className="text-xs text-secondary mt-1">consecutive weeks</p>
        </div>
        <div className="rounded-[1.5rem] bg-gradient-to-br from-tertiary-container/35 to-white p-5 shadow-[0px_14px_32px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">Weeks With Plans</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-tertiary">{weeksWithPlans}<span className="text-base font-bold text-secondary ml-1">/ {entries.length}</span></p>
        </div>
        <div className="rounded-[1.5rem] bg-gradient-to-br from-surface-container-low to-white p-5 shadow-[0px_14px_32px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">Avg Completion</p>
          <p className="mt-3 text-4xl font-black tracking-tight text-on-surface">{avgCompletion}%</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-secondary">Loading calendar...</div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <span className="material-symbols-outlined text-5xl text-outline-variant">calendar_month</span>
          <p className="text-secondary font-medium">No calendar data available</p>
        </div>
      ) : (
        <div ref={listRef} className="space-y-2">
          {sorted.map((entry) => {
            const info = getStatusInfo(entry.status);
            const hasPlan = entry.planId !== null;
            return (
              <button
                key={entry.weekStartDate}
                onClick={() => handleWeekClick(entry)}
                disabled={!hasPlan}
                className={`w-full text-left rounded-[1rem] p-5 transition-all ring-1 ring-outline-variant/10 ${
                  hasPlan
                    ? 'bg-surface-lowest hover:bg-white hover:shadow-md cursor-pointer'
                    : 'bg-surface-container-low opacity-60 cursor-default'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Week date */}
                  <div className="w-28 shrink-0">
                    <p className="text-sm font-bold text-on-surface">{entry.weekStartDate}</p>
                    <p className="text-[10px] text-secondary uppercase tracking-widest">
                      {new Date(entry.weekStartDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${info.bg}`}>
                    <span className={`w-2 h-2 rounded-full ${info.dot}`} />
                    {info.label}
                  </span>

                  {/* Stats */}
                  <div className="flex-1 flex items-center justify-end gap-6 text-xs text-secondary">
                    {hasPlan && (
                      <>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">checklist</span>
                          {entry.commitCount} commits
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">percent</span>
                          {entry.avgCompletionPct}% done
                        </span>
                      </>
                    )}
                  </div>

                  {hasPlan && (
                    <span className="material-symbols-outlined text-lg text-secondary">chevron_right</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CalendarViewPage;
