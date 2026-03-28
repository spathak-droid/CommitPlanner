import React, { useEffect, useState } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ReferenceLine, Legend, Area, AreaChart,
} from 'recharts';
import { usePageTransition } from '../hooks/useAnimations';
import * as api from '../services/api';
import type { VelocityPoint, CompletionPoint, HoursAccuracyPoint, CarryForwardPoint, CoverageTrendPoint } from '../types';

function weeksAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return d.toISOString().split('T')[0]!;
}

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const COLORS = {
  primary: '#4d6700',
  primaryLight: '#c7f264',
  tertiary: '#5c47cd',
  tertiaryLight: '#e5deff',
  error: '#ba1a1a',
  errorLight: '#ffdad6',
  surface: '#efedf1',
};

const AnalyticsPage: React.FC = () => {
  const [from, setFrom] = useState(weeksAgo(12));
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]!);
  const [velocity, setVelocity] = useState<VelocityPoint[]>([]);
  const [completion, setCompletion] = useState<CompletionPoint[]>([]);
  const [hours, setHours] = useState<HoursAccuracyPoint[]>([]);
  const [carryForward, setCarryForward] = useState<CarryForwardPoint[]>([]);
  const [coverage, setCoverage] = useState<CoverageTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const pageRef = usePageTransition([loading]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.fetchVelocity(from, to).catch(() => []),
      api.fetchCompletion(from, to).catch(() => []),
      api.fetchHoursAccuracy(from, to).catch(() => []),
      api.fetchCarryForwardRate(from, to).catch(() => []),
      api.fetchRcdoCoverage(from, to).catch(() => []),
    ]).then(([v, c, h, cf, cov]) => {
      if (cancelled) return;
      setVelocity(v);
      setCompletion(c);
      setHours(h);
      setCarryForward(cf);
      setCoverage(cov);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [from, to]);

  // Summary stats
  const totalCompleted = velocity.reduce((s, v) => s + v.completedCount, 0);
  const totalCommits = velocity.reduce((s, v) => s + v.totalCount, 0);
  const avgCompletion = completion.length > 0
    ? Math.round(completion.reduce((s, c) => s + c.avgCompletionPct, 0) / completion.length)
    : 0;
  const avgCfRate = carryForward.length > 0
    ? Math.round(carryForward.reduce((s, c) => s + c.carryForwardPct, 0) / carryForward.length)
    : 0;
  const avgCoverage = coverage.length > 0
    ? Math.round(coverage.reduce((s, c) => s + c.alignmentRatePct, 0) / coverage.length)
    : 0;

  const emptyState = (message: string) => (
    <div className="h-full flex flex-col items-center justify-center text-secondary/60">
      <span className="material-symbols-outlined text-4xl mb-2">show_chart</span>
      <p className="text-sm">{message}</p>
      <p className="text-xs mt-1">Need at least 2 weeks of data</p>
    </div>
  );

  const chartCard = (title: string, subtitle: string, children: React.ReactNode) => (
    <div className="bg-surface-lowest rounded-[1.5rem] p-6 shadow-[0px_14px_32px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
      <div className="mb-4">
        <h3 className="text-sm font-black uppercase tracking-[0.16em] text-secondary">{title}</h3>
        <p className="text-xs text-secondary/60 mt-1">{subtitle}</p>
      </div>
      <div className="h-64">{children}</div>
    </div>
  );

  const statCard = (label: string, value: string | number, sub: string, color: string) => (
    <div className="bg-surface-lowest rounded-[1.25rem] p-5 shadow-sm ring-1 ring-outline-variant/10">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary/60">{label}</p>
      <p className={`text-3xl font-black tracking-tight mt-2 ${color}`}>{value}</p>
      <p className="text-xs text-secondary mt-1">{sub}</p>
    </div>
  );

  const customTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white rounded-xl px-4 py-3 shadow-lg ring-1 ring-outline-variant/10 text-xs">
        <p className="font-bold text-on-surface mb-1">{formatWeek(label)}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="font-medium">
            {entry.name}: {typeof entry.value === 'number' ? Math.round(entry.value) : entry.value}{entry.name.includes('%') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div ref={pageRef} className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-surface-lowest to-primary-container/20 p-8 shadow-[0px_18px_40px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="space-y-3">
          <p className="text-primary font-bold tracking-widest text-xs uppercase opacity-80">Manager Analytics</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Team Analytics</h1>
          <p className="text-secondary text-sm max-w-xl">
            Track how your team plans, executes, and aligns to organizational goals over time.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-4 items-center">
          <label className="text-xs font-bold text-secondary uppercase tracking-widest">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="bg-white border border-outline-variant/20 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <label className="text-xs font-bold text-secondary uppercase tracking-widest">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="bg-white border border-outline-variant/20 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-secondary">
          <span className="material-symbols-outlined text-2xl animate-spin mr-3">progress_activity</span>
          Loading analytics...
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            {statCard('Completed', totalCompleted, `of ${totalCommits} total commits`, 'text-primary')}
            {statCard('Avg Completion', `${avgCompletion}%`, 'across all weeks', avgCompletion >= 80 ? 'text-primary' : avgCompletion >= 50 ? 'text-tertiary' : 'text-error')}
            {statCard('Carry-Forward', `${avgCfRate}%`, 'avg items carried', avgCfRate <= 15 ? 'text-primary' : avgCfRate <= 30 ? 'text-tertiary' : 'text-error')}
            {statCard('RCDO Coverage', `${avgCoverage}%`, 'outcomes with commits', avgCoverage >= 70 ? 'text-primary' : avgCoverage >= 40 ? 'text-tertiary' : 'text-error')}
            {statCard('Weeks Tracked', velocity.length, `${from} to ${to}`, 'text-on-surface')}
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* 1. Team Velocity */}
            {chartCard('Team Velocity', 'Commits completed vs total per week', velocity.length < 2 ? emptyState('Not enough velocity data') : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocity}>
                  <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.tertiary} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={COLORS.tertiary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e6ea" />
                  <XAxis dataKey="weekStart" tickFormatter={formatWeek} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={customTooltip} />
                  <Legend />
                  <Area type="monotone" dataKey="totalCount" stroke={COLORS.tertiary} strokeWidth={2} fill="url(#gradTotal)" name="Total Commits" dot={{ r: 4, fill: COLORS.tertiary }} />
                  <Area type="monotone" dataKey="completedCount" stroke={COLORS.primary} strokeWidth={2} fill="url(#gradCompleted)" name="Completed (≥80%)" dot={{ r: 4, fill: COLORS.primary }} />
                </AreaChart>
              </ResponsiveContainer>
            ))}

            {/* 2. Completion Trend */}
            {chartCard('Completion Trend', 'Average completion % per week', completion.length < 2 ? emptyState('Not enough completion data') : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={completion}>
                  <defs>
                    <linearGradient id="gradCompletion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.tertiary} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={COLORS.tertiary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e6ea" />
                  <XAxis dataKey="weekStart" tickFormatter={formatWeek} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={customTooltip} />
                  <Area type="monotone" dataKey="avgCompletionPct" stroke={COLORS.tertiary} strokeWidth={2} fill="url(#gradCompletion)" name="Avg Completion %" dot={{ r: 4, fill: COLORS.tertiary }} />
                  <ReferenceLine y={80} stroke={COLORS.primary} strokeDasharray="5 5" label={{ value: '80% target', position: 'right', fill: COLORS.primary, fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            ))}

            {/* 3. Hours Accuracy */}
            {chartCard('Hours Accuracy', 'Each dot is a commit — dots near the diagonal line = good estimates', hours.length === 0 ? emptyState('No reconciled commits with hours data') : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e6ea" />
                  <XAxis dataKey="plannedHours" name="Planned Hours" tick={{ fontSize: 11 }} label={{ value: 'Planned Hours', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#5f5e5e' }} />
                  <YAxis dataKey="actualHours" name="Actual Hours" tick={{ fontSize: 11 }} label={{ value: 'Actual Hours', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#5f5e5e' }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 40, y: 40 }]} stroke={COLORS.primary} strokeDasharray="5 5" strokeWidth={1.5} />
                  <Scatter data={hours} fill={COLORS.tertiary} fillOpacity={0.7} r={6} name="Commits" />
                </ScatterChart>
              </ResponsiveContainer>
            ))}

            {/* 4. Carry-Forward Rate */}
            {chartCard('Carry-Forward Rate', 'Percentage of commits carried to next week — lower is better', carryForward.length < 2 ? emptyState('Not enough carry-forward data') : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={carryForward}>
                  <defs>
                    <linearGradient id="gradCF" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.error} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={COLORS.error} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e6ea" />
                  <XAxis dataKey="weekStart" tickFormatter={formatWeek} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={customTooltip} />
                  <Area type="monotone" dataKey="carryForwardPct" stroke={COLORS.error} strokeWidth={2} fill="url(#gradCF)" name="Carry-Forward %" dot={{ r: 4, fill: COLORS.error }} />
                  <ReferenceLine y={20} stroke={COLORS.primary} strokeDasharray="5 5" label={{ value: '20% healthy', position: 'right', fill: COLORS.primary, fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            ))}

            {/* 5. RCDO Coverage */}
            {chartCard('RCDO Coverage', 'Percentage of organizational outcomes with at least one team commit', coverage.length < 2 ? emptyState('Not enough coverage data') : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={coverage}>
                  <defs>
                    <linearGradient id="gradCov" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e6ea" />
                  <XAxis dataKey="weekStart" tickFormatter={formatWeek} tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={customTooltip} />
                  <Area type="monotone" dataKey="alignmentRatePct" stroke={COLORS.primary} strokeWidth={2} fill="url(#gradCov)" name="RCDO Coverage %" dot={{ r: 4, fill: COLORS.primary }} />
                  <ReferenceLine y={70} stroke={COLORS.tertiary} strokeDasharray="5 5" label={{ value: '70% target', position: 'right', fill: COLORS.tertiary, fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
