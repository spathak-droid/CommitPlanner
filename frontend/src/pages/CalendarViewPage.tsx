import React, { useEffect, useMemo, useState } from 'react';
import { usePageTransition } from '../hooks/useAnimations';
import * as api from '../services/api';
import type { CalendarEntry } from '../types';
import { useStore } from '../store/useStore';

function mondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function weeksAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return mondayOfWeek(d);
}

function getWeekDates(numWeeks: number): string[] {
  const weeks: string[] = [];
  for (let i = numWeeks - 1; i >= 0; i--) weeks.push(weeksAgo(i));
  return weeks;
}

function formatWeekLabel(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatWeekRange(dateStr: string): string {
  const start = new Date(dateStr + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const s = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const e = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${s} – ${e}`;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft', LOCKED: 'Locked', RECONCILING: 'Reconciling',
  RECONCILED: 'Reconciled', CARRY_FORWARD: 'Carry Forward',
};

const STATUS_STYLE: Record<string, { dot: string; bg: string; text: string }> = {
  DRAFT: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  LOCKED: { dot: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  RECONCILING: { dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
  RECONCILED: { dot: 'bg-primary', bg: 'bg-primary-container', text: 'text-on-primary-container' },
  CARRY_FORWARD: { dot: 'bg-tertiary', bg: 'bg-tertiary-container', text: 'text-on-tertiary-container' },
};

function completionColor(pct: number): string {
  if (pct >= 80) return 'bg-green-600';
  if (pct >= 50) return 'bg-yellow-500';
  if (pct > 0) return 'bg-red-400';
  return 'bg-surface-container';
}

function statusDotColor(status: string | null): string {
  if (status === 'RECONCILED') return 'bg-green-500';
  if (status === 'LOCKED') return 'bg-yellow-500';
  if (status === 'DRAFT') return 'bg-blue-400';
  if (status === 'RECONCILING') return 'bg-orange-400';
  return 'bg-tertiary';
}

interface Props {
  onNavigateToPlan?: () => void;
}

const NUM_WEEKS = 9;

const CalendarViewPage: React.FC<Props> = ({ onNavigateToPlan }) => {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const { role } = useStore();
  const isManager = role === 'MANAGER';

  const pageRef = usePageTransition([loading]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const from = weeksAgo(NUM_WEEKS - 1);
    const now = new Date();
    const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    api.fetchCalendar(from, to)
      .then((data) => { if (!cancelled) setEntries(data); })
      .catch(() => { if (!cancelled) setEntries([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const weekDates = useMemo(() => getWeekDates(NUM_WEEKS), []);

  // Manager: userId|weekDate -> entry
  const entryMap = useMemo(() => {
    const map = new Map<string, CalendarEntry>();
    for (const e of entries) {
      if (e.userId && e.weekStartDate) map.set(`${e.userId}|${e.weekStartDate}`, e);
    }
    return map;
  }, [entries]);

  const users = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of entries) {
      if (e.userId && e.userName && !seen.has(e.userId)) seen.set(e.userId, e.userName);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [entries]);

  // IC: weekDate -> entry
  const icWeekMap = useMemo(() => {
    const map = new Map<string, CalendarEntry>();
    for (const e of entries) map.set(e.weekStartDate, e);
    return map;
  }, [entries]);

  const handleCellClick = (entry: CalendarEntry | undefined) => {
    if (entry?.planId && onNavigateToPlan) onNavigateToPlan();
  };

  const totalPlans = entries.filter(e => e.planId).length;
  const avgCompletion = totalPlans > 0
    ? Math.round(entries.filter(e => e.planId).reduce((s, e) => s + e.avgCompletionPct, 0) / totalPlans)
    : 0;

  const icStreak = useMemo(() => {
    let streak = 0;
    for (let i = weekDates.length - 1; i >= 0; i--) {
      if (icWeekMap.get(weekDates[i]!)?.planId) streak++;
      else break;
    }
    return streak;
  }, [weekDates, icWeekMap]);

  // Current week for highlighting
  const currentWeek = mondayOfWeek(new Date());

  // Reversed for most-recent-first
  const weekDatesDesc = useMemo(() => [...weekDates].reverse(), [weekDates]);

  const Legend = () => (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 pt-4 border-t border-outline-variant/10">
      <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Completion</span>
      {[
        ['bg-surface-container-low/50', 'No plan'],
        ['bg-red-400', '<50%'],
        ['bg-yellow-500', '50-79%'],
        ['bg-green-600', '80%+'],
      ].map(([color, label]) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className={`w-3.5 h-3.5 rounded ${color}`} />
          <span className="text-[10px] text-secondary">{label}</span>
        </div>
      ))}
      <div className="ml-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Status</span>
        {[['bg-blue-400', 'Draft'], ['bg-yellow-500', 'Locked'], ['bg-orange-400', 'Reconciling'], ['bg-green-500', 'Reconciled']].map(([color, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-[10px] text-secondary">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div ref={pageRef} className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-surface-lowest to-primary-container/20 p-8 shadow-[0px_18px_40px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="space-y-3">
          <p className="text-primary font-bold tracking-widest text-xs uppercase opacity-80">Planning Activity</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">
            {isManager ? 'Team Calendar' : 'My Calendar'}
          </h1>
          <p className="text-secondary text-sm max-w-xl">
            {isManager
              ? 'Weekly planning activity across your team over the last 13 weeks.'
              : 'Your weekly planning timeline. Each row is one planning week.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-secondary">Loading...</div>
      ) : isManager ? (
        /* ====== MANAGER VIEW ====== */
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-primary-container/35 to-white p-5 shadow-[0px_14px_32px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">Team Members</p>
              <p className="mt-3 text-4xl font-black tracking-tight text-primary">{users.length}</p>
            </div>
            <div className="rounded-[1.5rem] bg-gradient-to-br from-tertiary-container/35 to-white p-5 shadow-[0px_14px_32px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">Plans Submitted</p>
              <p className="mt-3 text-4xl font-black tracking-tight text-tertiary">
                {totalPlans}<span className="text-base font-bold text-secondary ml-1">/ {users.length * NUM_WEEKS}</span>
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-gradient-to-br from-surface-container-low to-white p-5 shadow-[0px_14px_32px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">Avg Completion</p>
              <p className="mt-3 text-4xl font-black tracking-tight text-on-surface">{avgCompletion}%</p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-[0px_18px_40px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[11px] font-bold uppercase tracking-[0.12em] text-secondary pb-3 pr-4 min-w-[140px] sticky left-0 bg-white z-10">Contributor</th>
                  {weekDates.map((w) => (
                    <th key={w} className="text-center pb-3 px-0.5">
                      <div className="text-[10px] font-bold text-secondary uppercase tracking-wider">{formatWeekLabel(w)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="text-sm font-semibold text-on-surface pr-4 py-1.5 sticky left-0 bg-white z-10 truncate max-w-[160px]">{user.name}</td>
                    {weekDates.map((weekDate) => {
                      const entry = entryMap.get(`${user.id}|${weekDate}`);
                      const hasPlan = !!entry?.planId;
                      const cellKey = `${user.id}|${weekDate}`;
                      return (
                        <td key={weekDate} className="px-1 py-2" style={{ minWidth: 48, maxWidth: 64 }}>
                          <div className="relative">
                            <button
                              onClick={() => handleCellClick(entry)}
                              onMouseEnter={() => setHoveredCell(cellKey)}
                              onMouseLeave={() => setHoveredCell(null)}
                              disabled={!hasPlan}
                              className={`w-full aspect-square rounded-lg transition-all ${hasPlan ? `${completionColor(entry!.avgCompletionPct)} cursor-pointer hover:scale-110 hover:shadow-md` : 'bg-surface-container-low/50 cursor-default'}`}
                            >
                              {hasPlan && entry!.status && (
                                <span className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full ${statusDotColor(entry!.status)}`} />
                              )}
                            </button>
                            {hoveredCell === cellKey && hasPlan && (
                              <div className="absolute z-50 -translate-x-1/2 left-1/2 mt-2 px-3 py-2 bg-on-surface text-white text-xs rounded-xl shadow-xl pointer-events-none whitespace-nowrap">
                                <p className="font-bold">{user.name}</p>
                                <p>{formatWeekLabel(weekDate)} - {STATUS_LABEL[entry!.status ?? ''] ?? ''}</p>
                                <p>{entry!.commitCount} commits - {Math.round(entry!.avgCompletionPct)}% done</p>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <Legend />
          </div>
        </>
      ) : (
        /* ====== CONTRIBUTOR VIEW: week-by-week timeline ====== */
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-primary-container/35 to-white p-5 shadow-[0px_14px_32px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">Current Streak</p>
              <p className="mt-3 text-4xl font-black tracking-tight text-primary">{icStreak}</p>
              <p className="text-xs text-secondary mt-1">consecutive weeks</p>
            </div>
            <div className="rounded-[1.5rem] bg-gradient-to-br from-tertiary-container/35 to-white p-5 shadow-[0px_14px_32px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">Weeks Planned</p>
              <p className="mt-3 text-4xl font-black tracking-tight text-tertiary">
                {totalPlans}<span className="text-base font-bold text-secondary ml-1">/ {NUM_WEEKS}</span>
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-gradient-to-br from-surface-container-low to-white p-5 shadow-[0px_14px_32px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">Avg Completion</p>
              <p className="mt-3 text-4xl font-black tracking-tight text-on-surface">{avgCompletion}%</p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white shadow-[0px_18px_40px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10 overflow-hidden">
            {/* Timeline */}
            <div className="divide-y divide-outline-variant/10">
              {weekDatesDesc.map((weekDate) => {
                const entry = icWeekMap.get(weekDate);
                const hasPlan = !!entry?.planId;
                const isCurrent = weekDate === currentWeek;
                const status = entry?.status ?? null;
                const style = status ? STATUS_STYLE[status] : null;

                return (
                  <div
                    key={weekDate}
                    onClick={() => isCurrent && handleCellClick(entry)}
                    className={`w-full text-left px-6 py-5 transition-all flex items-center gap-5 ${
                      isCurrent && hasPlan ? 'hover:bg-surface-container-low/40 cursor-pointer' : 'cursor-default'
                    } ${isCurrent ? 'bg-primary-container/10' : ''}`}
                  >
                    {/* Timeline dot + line */}
                    <div className="flex flex-col items-center shrink-0 self-stretch">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${
                        hasPlan ? statusDotColor(status) : 'bg-outline-variant/30'
                      } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`} />
                      <div className="w-px flex-1 bg-outline-variant/20 mt-1" />
                    </div>

                    {/* Week info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className={`text-sm font-bold ${isCurrent ? 'text-primary' : 'text-on-surface'}`}>
                          {formatWeekRange(weekDate)}
                        </p>
                        {isCurrent && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary-container px-2 py-0.5 rounded-full">
                            This week
                          </span>
                        )}
                        {style && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${style.bg} ${style.text}`}>
                            {STATUS_LABEL[status!]}
                          </span>
                        )}
                      </div>

                      {hasPlan ? (
                        <div className="flex items-center gap-4 mt-2">
                          {/* Progress bar */}
                          <div className="flex-1 max-w-xs">
                            <div className="h-2 rounded-full bg-surface-container-low overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${completionColor(entry!.avgCompletionPct)}`}
                                style={{ width: `${Math.min(Math.round(entry!.avgCompletionPct), 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-bold text-on-surface tabular-nums w-10">
                            {Math.round(entry!.avgCompletionPct)}%
                          </span>
                          <span className="text-xs text-secondary flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">checklist</span>
                            {entry!.commitCount} {entry!.commitCount === 1 ? 'commit' : 'commits'}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-secondary/50 mt-1">No plan created</p>
                      )}
                    </div>

                    {isCurrent && hasPlan && (
                      <span className="material-symbols-outlined text-lg text-secondary shrink-0">chevron_right</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarViewPage;
