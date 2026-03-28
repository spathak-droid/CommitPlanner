import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { StatusBadge } from '../components/StatusBadge';
import { FilterBar } from '../components/FilterBar';
import { usePageTransition, useStaggerReveal, useMagneticButton } from '../hooks/useAnimations';
import * as api from '../services/api';
import type { ChessPriority, PlanStatus, ReviewInsight, WeeklyDigest } from '../types';

function getMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0]!;
}

const ManagerDashboardPage: React.FC = () => {
  const { teamPlans, loadingTeam, fetchTeamData, showToast } = useStore();
  const [weekStart, setWeekStart] = useState(getMonday());
  const [selectedPlan, setSelectedPlan] = useState<Awaited<ReturnType<typeof api.fetchPlan>> | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewInsight, setReviewInsight] = useState<ReviewInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState<WeeklyDigest | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);

  // Filter state — initialised from URL params
  const [filterPriorities, setFilterPriorities] = useState<ChessPriority[]>(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('priorities');
    if (!raw) return [];
    return raw.split(',').filter(Boolean) as ChessPriority[];
  });
  const [filterStatuses, setFilterStatuses] = useState<PlanStatus[]>(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('statuses');
    if (!raw) return [];
    return raw.split(',').filter(Boolean) as PlanStatus[];
  });
  const [completionBelow, setCompletionBelow] = useState<number | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('completionBelow');
    return raw ? Number(raw) : null;
  });

  // Sync filter state to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (filterPriorities.length > 0) {
      params.set('priorities', filterPriorities.join(','));
    } else {
      params.delete('priorities');
    }
    if (filterStatuses.length > 0) {
      params.set('statuses', filterStatuses.join(','));
    } else {
      params.delete('statuses');
    }
    if (completionBelow != null) {
      params.set('completionBelow', String(completionBelow));
    } else {
      params.delete('completionBelow');
    }
    window.history.replaceState({}, '', params.toString() ? `?${params.toString()}` : window.location.pathname);
  }, [filterPriorities, filterStatuses, completionBelow]);

  useEffect(() => { fetchTeamData(weekStart); }, [weekStart, fetchTeamData]);

  const handleDrillDown = async (planId: string) => {
    try { setSelectedPlan(await api.fetchPlan(planId)); setSelectedPlanId(planId); }
    catch (e) { showToast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };

  const handleReview = async (status: 'APPROVED' | 'FLAGGED') => {
    if (!selectedPlanId) return;
    setSubmittingReview(true);
    try {
      await api.submitReview(selectedPlanId, status, feedback);
      showToast(`Plan ${status.toLowerCase()}`, 'success');
      setFeedback(''); fetchTeamData(weekStart);
    } catch (e) { showToast(e instanceof Error ? e.message : 'Failed', 'error'); }
    finally { setSubmittingReview(false); }
  };

  const handleLoadInsight = async (planId: string) => {
    setInsightLoading(true);
    try {
      const insight = await api.getReviewInsight(planId);
      setReviewInsight(insight);
    } catch { setReviewInsight(null); }
    finally { setInsightLoading(false); }
  };

  const handleLoadDigest = async () => {
    setDigestLoading(true);
    try {
      const digest = await api.getWeeklyDigest(weekStart);
      setWeeklyDigest(digest);
    } catch { setWeeklyDigest(null); }
    finally { setDigestLoading(false); }
  };

  const totalCommits = teamPlans.reduce((s, p) => s + p.totalCommits, 0);
  const lockedCount = teamPlans.filter(p => p.status === 'LOCKED' || p.status === 'RECONCILED').length;
  const riskCount = teamPlans.filter(p => p.avgCompletionPct > 0 && p.avgCompletionPct < 50).length;
  const missingPlans = teamPlans.filter((plan) => !plan.hasPlan).length;
  const awaitingReview = teamPlans.filter((plan) => plan.hasPlan && plan.status === 'RECONCILED' && plan.reviewStatus !== 'APPROVED').length;
  const avgAlignment = teamPlans.length > 0
    ? Math.round(teamPlans.reduce((s, p) => s + (p.avgCompletionPct || 0), 0) / teamPlans.length)
    : 0;
  const mustDoTotal = teamPlans.reduce((sum, plan) => sum + plan.mustDoCount, 0);
  const shouldDoTotal = teamPlans.reduce((sum, plan) => sum + plan.shouldDoCount, 0);
  const niceToDoTotal = teamPlans.reduce((sum, plan) => sum + plan.niceToDoCount, 0);
  const totalPrioritized = mustDoTotal + shouldDoTotal + niceToDoTotal;
  const priorityDistribution = [
    {
      label: 'Must Do',
      pct: totalPrioritized > 0 ? Math.round((mustDoTotal / totalPrioritized) * 100) : 0,
      raw: mustDoTotal,
      color: 'bg-primary',
    },
    {
      label: 'Should Do',
      pct: totalPrioritized > 0 ? Math.round((shouldDoTotal / totalPrioritized) * 100) : 0,
      raw: shouldDoTotal,
      color: 'bg-tertiary',
    },
    {
      label: 'Nice To Do',
      pct: totalPrioritized > 0 ? Math.round((niceToDoTotal / totalPrioritized) * 100) : 0,
      raw: niceToDoTotal,
      color: 'bg-primary-container',
    },
  ];

  // Client-side filtered team plans
  const filteredPlans = teamPlans.filter((tp) => {
    if (filterPriorities.length > 0) {
      const hasPriority = filterPriorities.some((p) => {
        if (p === 'MUST_DO') return tp.mustDoCount > 0;
        if (p === 'SHOULD_DO') return tp.shouldDoCount > 0;
        if (p === 'NICE_TO_DO') return tp.niceToDoCount > 0;
        return false;
      });
      if (!hasPriority) return false;
    }
    if (filterStatuses.length > 0 && tp.status && !filterStatuses.includes(tp.status)) return false;
    if (completionBelow != null && tp.avgCompletionPct >= completionBelow) return false;
    return true;
  });

  // GSAP hooks — must be called before any conditional returns
  const pageRef = usePageTransition([selectedPlan, loadingTeam]);
  const teamListRef = useStaggerReveal([teamPlans.length, selectedPlan]);
  const syncBtnRef = useMagneticButton();

  if (loadingTeam) {
    return <div className="flex items-center justify-center h-96 text-secondary">Loading...</div>;
  }

  // Drill-down view
  const selectedUserName = teamPlans.find(tp => tp.userId === selectedPlan?.userId)?.fullName ?? selectedPlan?.userId ?? '';

  if (selectedPlan) {
    return (
      <div ref={pageRef} className="space-y-8">
        <button onClick={() => setSelectedPlan(null)}
          className="flex items-center gap-1 text-sm font-semibold text-primary hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Team
        </button>

        <div className="bg-surface-lowest rounded-[1rem] p-8 shadow-[0px_24px_48px_rgba(27,27,30,0.04)] ring-1 ring-outline-variant/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center border-2 border-primary-container">
              <span className="text-lg font-bold text-on-primary-container">{selectedUserName.slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-on-surface">{selectedUserName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={selectedPlan.status} />
                <span className="text-xs text-secondary">Week of {selectedPlan.weekStartDate}</span>
              </div>
            </div>
            {selectedPlan.status !== 'DRAFT' && (
              <button
                onClick={async () => {
                  try {
                    await api.transitionPlan(selectedPlan.id, 'UNLOCK');
                    // Re-fetch to get clean state with review cleared
                    const refreshed = await api.fetchPlan(selectedPlan.id);
                    setSelectedPlan(refreshed);
                    fetchTeamData(weekStart);
                    showToast('Plan unlocked — team member can now edit and re-submit', 'success');
                  } catch (e) { showToast(e instanceof Error ? e.message : 'Failed to unlock', 'error'); }
                }}
                className="px-5 py-2.5 bg-white border border-outline-variant/20 rounded-full font-bold text-sm text-secondary hover:bg-surface-container-low transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">lock_open</span>
                Unlock Plan
              </button>
            )}
          </div>

          <div className="space-y-3">
            {selectedPlan.commits.map((c) => {
              const pct = c.completionPct ?? 0;
              const tone = pct >= 80 ? { bg: 'bg-primary', text: 'text-primary' }
                : pct >= 50 ? { bg: 'bg-tertiary', text: 'text-tertiary' }
                : { bg: 'bg-error', text: 'text-error' };

              return (
                <div key={c.id} className="bg-surface-container-low rounded-[1rem] p-5 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-on-surface">{c.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          c.chessPriority === 'MUST_DO' ? 'bg-error-container text-on-error-container' :
                          c.chessPriority === 'SHOULD_DO' ? 'bg-tertiary-container text-on-tertiary-container' :
                          'bg-primary-container text-on-primary-container'
                        }`}>{c.chessPriority.replace('_', ' ')}</span>
                        {c.carryForward && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-secondary-container text-on-secondary-container">CF</span>
                        )}
                      </div>
                      <p className="text-xs text-secondary">
                        <span className="text-primary font-medium">{c.rallyCryName}</span> → {c.definingObjectiveName} → {c.outcomeName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {c.plannedHours != null && (
                        <p className="text-xs text-secondary">{c.plannedHours}h planned</p>
                      )}
                      {c.actualHours != null && (
                        <p className="text-xs text-on-surface font-semibold">{c.actualHours}h actual</p>
                      )}
                      {c.completionPct !== null && (
                        <p className={`text-lg font-black ${tone.text}`}>{c.completionPct}%</p>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {c.completionPct !== null && (
                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full ${tone.bg} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  )}

                  {/* IC's reconciliation notes */}
                  {c.reconciliationNotes && (
                    <div className="flex items-start gap-2 bg-white rounded-[0.75rem] px-4 py-3">
                      <span className="material-symbols-outlined text-sm text-secondary mt-0.5">sticky_note_2</span>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-0.5">Contributor Notes</p>
                        <p className="text-sm text-on-surface leading-relaxed">{c.reconciliationNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Description if present */}
                  {c.description && !c.reconciliationNotes && (
                    <p className="text-sm text-secondary">{c.description}</p>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* AI Review Insight */}
        <div className="rounded-[1.25rem] bg-gradient-to-br from-tertiary-container/20 via-white to-primary-container/10 p-6 ring-1 ring-tertiary/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-tertiary">auto_awesome</span>
              <h3 className="font-black text-on-surface">AI Review Insights</h3>
            </div>
            {!reviewInsight && !insightLoading && (
              <button onClick={() => handleLoadInsight(selectedPlan.id)}
                className="px-4 py-2 rounded-full bg-tertiary-container text-on-tertiary-container text-xs font-bold hover:bg-tertiary hover:text-on-tertiary transition-all">
                Generate Insights
              </button>
            )}
          </div>

          {insightLoading && (
            <div className="flex items-center gap-2 text-sm text-secondary">
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              Analyzing plan...
            </div>
          )}

          {reviewInsight && (
            <div className="space-y-4">
              <div className="rounded-[0.75rem] bg-white/80 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">Overall</p>
                <p className="text-sm text-on-surface">{reviewInsight.overallAssessment}</p>
              </div>

              {reviewInsight.patterns.length > 0 && (
                <div className="rounded-[0.75rem] bg-white/80 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-2">Patterns</p>
                  <ul className="space-y-1">
                    {reviewInsight.patterns.map((p, i) => (
                      <li key={i} className="text-sm text-on-surface flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm text-primary mt-0.5">insights</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {reviewInsight.riskSignals.length > 0 && (
                <div className="rounded-[0.75rem] bg-error-container/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-error mb-2">Risk Signals</p>
                  <ul className="space-y-1">
                    {reviewInsight.riskSignals.map((r, i) => (
                      <li key={i} className="text-sm text-on-surface flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm text-error mt-0.5">warning</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {reviewInsight.suggestedFeedback && selectedPlan.status === 'RECONCILED' && !selectedPlan.reviewStatus && (
                <button onClick={() => setFeedback(reviewInsight.suggestedFeedback)}
                  className="text-left w-full rounded-[0.75rem] bg-primary-container/30 p-4 hover:bg-primary-container/50 transition-colors">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Suggested Feedback (click to use)</p>
                  <p className="text-sm text-on-surface">{reviewInsight.suggestedFeedback}</p>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Review Section — always visible with appropriate content per status */}
        <div className="rounded-[1.25rem] bg-surface-lowest p-6 shadow-[0px_24px_48px_rgba(27,27,30,0.04)] ring-1 ring-outline-variant/10">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-lg text-secondary">rate_review</span>
            <h3 className="font-black text-on-surface">Manager Review</h3>
          </div>

          {/* Already reviewed — show result */}
          {selectedPlan.reviewStatus ? (
            <div className={`rounded-[1rem] p-5 flex items-start gap-4 ${
              selectedPlan.reviewStatus === 'APPROVED'
                ? 'bg-primary-container/40 ring-1 ring-primary/20'
                : 'bg-error-container/40 ring-1 ring-error/20'
            }`}>
              <span className={`material-symbols-outlined text-3xl mt-0.5 ${
                selectedPlan.reviewStatus === 'APPROVED' ? 'text-primary' : 'text-error'
              }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {selectedPlan.reviewStatus === 'APPROVED' ? 'verified' : 'flag'}
              </span>
              <div>
                <p className={`font-black text-sm ${
                  selectedPlan.reviewStatus === 'APPROVED' ? 'text-primary' : 'text-error'
                }`}>
                  {selectedPlan.reviewStatus === 'APPROVED' ? 'Approved' : 'Flagged for Discussion'}
                </p>
                {selectedPlan.reviewFeedback && (
                  <p className="text-sm text-on-surface mt-1 leading-relaxed">{selectedPlan.reviewFeedback}</p>
                )}
                <p className="text-xs text-secondary mt-2">To change this review, unlock the plan and have the contributor re-reconcile.</p>
              </div>
            </div>

          /* RECONCILED and not yet reviewed — show form */
          ) : selectedPlan.status === 'RECONCILED' ? (
            <div className="space-y-4">
              <p className="text-sm text-secondary">This plan is ready for your review. Share feedback and approve or flag for discussion.</p>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Share feedback for this team member..."
                className="w-full bg-surface-container-low border-0 rounded-[1rem] px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={3} />
              <div className="flex gap-3">
                <button onClick={() => handleReview('APPROVED')} disabled={submittingReview}
                  className="px-8 py-4 bg-primary text-on-primary rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-40 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Approve
                </button>
                <button onClick={() => handleReview('FLAGGED')} disabled={submittingReview}
                  className="px-8 py-4 bg-error-container text-on-error-container rounded-full font-bold text-sm shadow-sm hover:-translate-y-0.5 disabled:opacity-40 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
                  Flag for Discussion
                </button>
              </div>
            </div>

          /* Not yet RECONCILED — show waiting message */
          ) : (
            <div className="flex items-center gap-3 text-secondary">
              <span className="material-symbols-outlined text-xl">hourglass_top</span>
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  {selectedPlan.status === 'DRAFT' && 'Waiting for contributor to lock their plan'}
                  {selectedPlan.status === 'LOCKED' && 'Plan is locked — waiting for reconciliation to begin'}
                  {selectedPlan.status === 'RECONCILING' && 'Contributor is reconciling — review will be available once complete'}
                  {selectedPlan.status === 'CARRY_FORWARD' && 'This plan has been carried forward'}
                </p>
                <p className="text-xs text-secondary mt-1">
                  The review form appears once the contributor completes reconciliation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div ref={pageRef} className="space-y-10">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-primary font-bold tracking-widest text-xs uppercase opacity-80">Operational Excellence</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Team Alignment Dashboard</h1>
          <p className="text-secondary text-lg font-medium">Week of {weekStart}</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)}
              className="px-4 py-3 bg-white border border-outline-variant/20 rounded-full font-semibold text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <a href={api.getTeamExportUrl(weekStart, 'csv')} target="_blank" rel="noopener noreferrer"
            className="px-6 py-3 bg-primary-container text-on-primary-container rounded-full font-bold text-sm flex items-center gap-2 shadow-sm hover:opacity-90 transition-all">
            <span className="material-symbols-outlined text-lg">download</span>
            Export Team CSV
          </a>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-surface-lowest rounded-[1.5rem] p-8 shadow-[0px_24px_48px_rgba(27,27,30,0.04)] ring-1 ring-outline-variant/10">
          <p className="text-primary/60 font-bold text-xs tracking-widest uppercase">Manager Snapshot</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-on-surface">Weekly execution signals</h3>
          <p className="mt-3 text-sm leading-6 text-secondary">
            This panel summarizes current team execution for the selected week. It is operational, not a strategic alignment score.
          </p>

          <div className="mt-6 grid gap-4">
            <div className="rounded-[1.25rem] bg-white p-5 shadow-sm ring-1 ring-outline-variant/10">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary">Average completion</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <p className="text-5xl font-black tracking-tight text-on-surface">{avgAlignment}%</p>
                <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold text-secondary">
                  team average
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[1.1rem] bg-error-container/30 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary">Missing Plans</p>
                <p className="mt-2 text-3xl font-black text-error">{missingPlans}</p>
              </div>
              <div className="rounded-[1.1rem] bg-tertiary-container/35 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary">Awaiting Review</p>
                <p className="mt-2 text-3xl font-black text-tertiary">{awaitingReview}</p>
              </div>
            </div>

            <div className="rounded-[1.25rem] bg-surface-container-low p-5">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary">Current read</p>
              <ul className="mt-3 space-y-3 text-sm text-secondary">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-primary mt-0.5">task_alt</span>
                  <span>{totalCommits} linked commitments are currently in play across the assigned team.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-primary mt-0.5">lock</span>
                  <span>{lockedCount} plans are locked or already reconciled.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-error mt-0.5">warning</span>
                  <span>{riskCount} team members are currently below 50% average completion.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Focus Distribution */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="bg-surface-lowest rounded-[1rem] p-8 shadow-[0px_24px_48px_rgba(27,27,30,0.04)] ring-1 ring-outline-variant/10">
            <h3 className="text-xl font-bold mb-8">Focus Distribution</h3>
            <div className="space-y-6">
              {priorityDistribution.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-on-surface">{item.label}</span>
                    <span className="text-primary">{item.pct}% · {item.raw}</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

              <div className="mt-10 grid grid-cols-3 gap-4">
                <div className="p-4 bg-surface-container-low rounded-[0.75rem] text-center">
                  <p className="text-secondary text-xs font-bold uppercase mb-1">Total Goals</p>
                  <p className="text-2xl font-black text-on-surface">{totalCommits}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-[0.75rem] text-center">
                  <p className="text-secondary text-xs font-bold uppercase mb-1">Locked</p>
                  <p className="text-2xl font-black text-primary">{lockedCount}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-[0.75rem] text-center">
                  <p className="text-secondary text-xs font-bold uppercase mb-1">Risk</p>
                  <p className="text-2xl font-black text-error">{riskCount}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-4 bg-error-container/30 rounded-[0.75rem] text-center">
                  <p className="text-secondary text-xs font-bold uppercase mb-1">No Plan</p>
                  <p className="text-2xl font-black text-error">{missingPlans}</p>
                </div>
                <div className="p-4 bg-tertiary-container/35 rounded-[0.75rem] text-center">
                  <p className="text-secondary text-xs font-bold uppercase mb-1">Awaiting Review</p>
                  <p className="text-2xl font-black text-tertiary">{awaitingReview}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Team Status */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Team Status & Alignment</h2>
          <span className="text-sm font-semibold text-secondary">
            {filteredPlans.length !== teamPlans.length
              ? `${filteredPlans.length} of ${teamPlans.length} Members`
              : `${teamPlans.length} Team Members`}
          </span>
        </div>

        <FilterBar
          priorities={filterPriorities}
          onPrioritiesChange={setFilterPriorities}
          statuses={filterStatuses}
          onStatusesChange={setFilterStatuses}
          completionBelow={completionBelow}
          onCompletionBelowChange={setCompletionBelow}
          onClear={() => { setFilterPriorities([]); setFilterStatuses([]); setCompletionBelow(null); }}
        />

        <div ref={teamListRef} className="space-y-3">
          {filteredPlans.map((tp) => {
            const health = tp.avgCompletionPct >= 80 ? { icon: 'check_circle', label: 'Excellent', color: 'text-primary', fill: true }
              : tp.avgCompletionPct >= 50 ? { icon: 'radio_button_checked', label: 'Stable', color: 'text-secondary', fill: false }
              : tp.avgCompletionPct > 0 ? { icon: 'error', label: 'Misaligned', color: 'text-error', fill: true }
              : { icon: 'change_circle', label: 'Evolving', color: 'text-tertiary', fill: true };
            const status = tp.status ?? 'NO_PLAN';

            return (
              <div key={`${tp.userId}-${tp.weekStartDate}`} onClick={() => tp.planId && handleDrillDown(tp.planId)}
                className="bg-surface-lowest hover:bg-white transition-all cursor-pointer group rounded-full p-3 flex items-center justify-between shadow-sm ring-1 ring-outline-variant/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center border-2 border-primary-container flex-shrink-0">
                    <span className="text-sm font-bold text-on-primary-container">{tp.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface">{tp.fullName}</h4>
                    <p className="text-xs text-secondary font-medium">{tp.userId} · {tp.hasPlan ? `${tp.totalCommits} commitments · ${tp.totalPlannedHours}h planned` : 'No plan submitted yet'}</p>
                  </div>
                </div>

                <div className="hidden md:flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase text-secondary tracking-widest mb-1">Status</span>
                  <StatusBadge status={status} />
                </div>

                <div className="hidden md:flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase text-secondary tracking-widest mb-1">Health</span>
                  <div className={`flex items-center gap-1 ${health.color}`}>
                    <span className="material-symbols-outlined text-base"
                      style={health.fill ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                      {health.icon}
                    </span>
                    <span className="text-xs font-bold">{health.label}</span>
                  </div>
                </div>

                <div className="hidden md:flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase text-secondary tracking-widest mb-1">Review</span>
                  <span className={`text-xs font-black ${
                    tp.reviewStatus === 'APPROVED' ? 'text-primary' : tp.reviewStatus === 'FLAGGED' ? 'text-error' : 'text-secondary'
                  }`}>
                    {tp.reviewStatus ?? (tp.status === 'RECONCILED' ? 'PENDING' : '—')}
                  </span>
                </div>

                <button className="p-3 rounded-full hover:bg-surface-container transition-colors mr-2">
                  <span className="material-symbols-outlined">{tp.planId ? 'chevron_right' : 'priority_high'}</span>
                </button>
              </div>
            );
          })}

          {filteredPlans.length === 0 && (
            <div className="text-center py-16 text-secondary">
              {teamPlans.length === 0
                ? 'No team plans found for this week'
                : 'No team members match the current filters'}
            </div>
          )}
        </div>
      </div>

      {/* Sync Prep — data-driven insights */}
      {(() => {
        const insights: { icon: string; text: string; severity: 'error' | 'warn' | 'info' }[] = [];
        const noPlans = teamPlans.filter(p => !p.hasPlan);
        const belowFifty = teamPlans.filter(p => p.hasPlan && p.avgCompletionPct > 0 && p.avgCompletionPct < 50);
        const needsReview = teamPlans.filter(p => p.hasPlan && p.status === 'RECONCILED' && p.reviewStatus !== 'APPROVED');
        const stillDraft = teamPlans.filter(p => p.hasPlan && p.status === 'DRAFT');

        if (noPlans.length > 0) insights.push({ icon: 'priority_high', text: `${noPlans.map(p => p.fullName).join(', ')} ${noPlans.length === 1 ? 'has' : 'have'} not submitted a plan this week.`, severity: 'error' });
        if (belowFifty.length > 0) insights.push({ icon: 'trending_down', text: `${belowFifty.map(p => p.fullName).join(', ')} ${belowFifty.length === 1 ? 'is' : 'are'} below 50% completion — discuss blockers.`, severity: 'error' });
        if (needsReview.length > 0) insights.push({ icon: 'rate_review', text: `${needsReview.length} reconciled ${needsReview.length === 1 ? 'plan awaits' : 'plans await'} your review.`, severity: 'warn' });
        if (stillDraft.length > 0) insights.push({ icon: 'edit_note', text: `${stillDraft.map(p => p.fullName).join(', ')} still in draft — nudge to lock before end of week.`, severity: 'warn' });
        if (insights.length === 0) insights.push({ icon: 'check_circle', text: 'All team members are on track. No friction points detected.', severity: 'info' });

        const reviewablePlan = needsReview[0] ?? belowFifty[0] ?? teamPlans.find(p => p.planId);
        const severityColor = { error: 'text-error', warn: 'text-tertiary', info: 'text-primary' };
        const severityBg = { error: 'bg-error-container/20', warn: 'bg-tertiary-container/20', info: 'bg-primary-container/20' };

        return (
          <div className="relative overflow-hidden bg-gradient-to-br from-tertiary-container/40 to-primary-container/20 rounded-[1.5rem] p-8 border border-white/40">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-tertiary/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-2xl text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                <h2 className="text-2xl font-black tracking-tight text-on-surface">Sync Prep</h2>
                <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-[10px] font-black tracking-widest">
                  {insights.length} {insights.length === 1 ? 'INSIGHT' : 'INSIGHTS'}
                </span>
              </div>
              <p className="text-sm text-secondary mb-6">Auto-generated talking points based on this week's data.</p>

              <div className="space-y-3 mb-6">
                {insights.map((insight, i) => (
                  <div key={i} className={`flex items-start gap-3 ${severityBg[insight.severity]} rounded-[1rem] p-4`}>
                    <span className={`material-symbols-outlined text-lg mt-0.5 ${severityColor[insight.severity]}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {insight.icon}
                    </span>
                    <p className="text-sm font-medium text-on-surface leading-relaxed">{insight.text}</p>
                  </div>
                ))}
              </div>

              {/* AI Weekly Digest */}
              <div className="mb-6">
                {!weeklyDigest && !digestLoading && (
                  <button onClick={handleLoadDigest}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tertiary-container/40 text-on-tertiary-container text-xs font-bold hover:bg-tertiary-container transition-colors">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    Generate AI Digest
                  </button>
                )}

                {digestLoading && (
                  <div className="flex items-center gap-2 text-sm text-secondary">
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    Generating digest...
                  </div>
                )}

                {weeklyDigest && (
                  <div className="rounded-[1rem] bg-white/60 p-5 ring-1 ring-tertiary/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-tertiary">auto_awesome</span>
                        <span className="text-xs font-black uppercase tracking-widest text-tertiary">AI Digest</span>
                      </div>
                      <button onClick={() => setWeeklyDigest(null)}
                        className="p-1 rounded-full hover:bg-surface-container text-secondary">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>

                    <p className="text-sm text-on-surface leading-relaxed">{weeklyDigest.executiveSummary}</p>

                    {weeklyDigest.highlights.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Highlights</p>
                        {weeklyDigest.highlights.map((h, i) => (
                          <p key={i} className="text-sm text-on-surface flex items-start gap-2">
                            <span className="material-symbols-outlined text-sm text-primary mt-0.5">thumb_up</span>
                            {h}
                          </p>
                        ))}
                      </div>
                    )}

                    {weeklyDigest.concerns.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-error mb-1">Concerns</p>
                        {weeklyDigest.concerns.map((c, i) => (
                          <p key={i} className="text-sm text-on-surface flex items-start gap-2">
                            <span className="material-symbols-outlined text-sm text-error mt-0.5">warning</span>
                            {c}
                          </p>
                        ))}
                      </div>
                    )}

                    {weeklyDigest.suggestedTalkingPoints.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-tertiary mb-1">Talking Points</p>
                        {weeklyDigest.suggestedTalkingPoints.map((tp, i) => (
                          <p key={i} className="text-sm text-on-surface flex items-start gap-2">
                            <span className="material-symbols-outlined text-sm text-tertiary mt-0.5">chat</span>
                            {tp}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {reviewablePlan?.planId && (
                  <button
                    ref={syncBtnRef}
                    onClick={() => handleDrillDown(reviewablePlan.planId!)}
                    className="px-6 py-3.5 bg-primary text-on-primary rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">play_arrow</span>
                    Start Review — {reviewablePlan.fullName}
                  </button>
                )}
                {noPlans.length > 0 && (
                  <button
                    onClick={async () => {
                      try {
                        await api.sendNudge(noPlans.map(p => p.userId), `week of ${weekStart}`);
                        showToast(`Reminder sent to ${noPlans.length} team member${noPlans.length === 1 ? '' : 's'}`, 'success');
                      } catch (e) {
                        showToast(e instanceof Error ? e.message : 'Failed to send nudge', 'error');
                      }
                    }}
                    className="px-6 py-3.5 bg-white text-on-surface rounded-full font-bold text-sm shadow-sm hover:-translate-y-0.5 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">notification_important</span>
                    Nudge {noPlans.length} Missing {noPlans.length === 1 ? 'Plan' : 'Plans'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ManagerDashboardPage;
