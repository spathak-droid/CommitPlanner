import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ReferenceLine,
} from 'recharts';
import { usePageTransition } from '../hooks/useAnimations';
import * as api from '../services/api';
import type { VelocityPoint, CompletionPoint, HoursAccuracyPoint, CarryForwardPoint, CoverageTrendPoint } from '../types';

function weeksAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n * 7);
  return d.toISOString().split('T')[0]!;
}

const COLORS = { primary: '#4d6700', tertiary: '#5c47cd', error: '#ba1a1a' };

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

  const chartCard = (title: string, children: React.ReactNode) => (
    <div className="bg-surface-lowest rounded-[1.5rem] p-6 shadow-[0px_14px_32px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
      <h3 className="text-sm font-black uppercase tracking-[0.16em] text-secondary mb-4">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  );

  return (
    <div ref={pageRef} className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-surface-lowest to-primary-container/20 p-8 shadow-[0px_18px_40px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="space-y-3">
          <p className="text-primary font-bold tracking-widest text-xs uppercase opacity-80">Manager Analytics</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Team Analytics</h1>
          <p className="text-secondary text-sm max-w-xl">
            Track velocity, completion trends, hours accuracy, carry-forward rate, and RCDO coverage across your team.
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
        <div className="flex items-center justify-center h-64 text-secondary">Loading analytics...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* 1. Team Velocity */}
          {chartCard('Team Velocity', (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={velocity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c4c9b2" />
                <XAxis dataKey="weekStart" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="completedCount" stroke={COLORS.primary} strokeWidth={2} name="Completed" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="totalCount" stroke={COLORS.tertiary} strokeWidth={2} strokeDasharray="5 5" name="Total" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ))}

          {/* 2. Completion Trend */}
          {chartCard('Completion Trend', (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={completion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c4c9b2" />
                <XAxis dataKey="weekStart" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="avgCompletionPct" stroke={COLORS.tertiary} strokeWidth={2} name="Avg Completion %" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ))}

          {/* 3. Hours Accuracy */}
          {chartCard('Hours Accuracy (Planned vs Actual)', (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#c4c9b2" />
                <XAxis dataKey="plannedHours" name="Planned" tick={{ fontSize: 10 }} />
                <YAxis dataKey="actualHours" name="Actual" tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 40, y: 40 }]} stroke={COLORS.primary} strokeDasharray="5 5" />
                <Scatter data={hours} fill={COLORS.tertiary} />
              </ScatterChart>
            </ResponsiveContainer>
          ))}

          {/* 4. Carry-Forward Rate */}
          {chartCard('Carry-Forward Rate', (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={carryForward}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c4c9b2" />
                <XAxis dataKey="weekStart" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="carryForwardPct" stroke={COLORS.error} strokeWidth={2} name="Carry-Forward %" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ))}

          {/* 5. RCDO Coverage */}
          {chartCard('RCDO Coverage', (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={coverage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#c4c9b2" />
                <XAxis dataKey="weekStart" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="alignmentRatePct" stroke={COLORS.primary} strokeWidth={2} name="RCDO Coverage %" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
