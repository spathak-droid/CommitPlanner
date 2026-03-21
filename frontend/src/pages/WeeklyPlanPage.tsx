import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { CommitForm } from '../components/CommitForm';
import { ReconciliationRow } from '../components/ReconciliationRow';
import { StatusBadge } from '../components/StatusBadge';
import { ChessBadge } from '../components/ChessBadge';
import { usePageTransition, useStaggerReveal } from '../hooks/useAnimations';
import * as api from '../services/api';
import type { ChessPriority, CreateCommitRequest, ReconcileCommitRequest } from '../types';

const PRIORITY_ORDER: ChessPriority[] = ['MUST_DO', 'SHOULD_DO', 'NICE_TO_DO'];

const WeeklyPlanPage: React.FC = () => {
  const {
    currentPlan,
    loadingPlan,
    planError,
    fetchCurrentPlan,
    createCurrentWeekPlan,
    setPlan,
    showToast,
    commitmentsActionTick,
  } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const pageRef = usePageTransition([currentPlan, loadingPlan]);
  const commitsRef = useStaggerReveal([currentPlan?.commits.length]);

  useEffect(() => { fetchCurrentPlan(); }, [fetchCurrentPlan]);

  useEffect(() => {
    const runPrimaryAction = async () => {
      if (loadingPlan) return;
      if (!currentPlan) {
        await createCurrentWeekPlan();
        return;
      }
      if (currentPlan.status === 'DRAFT') {
        setShowForm(true);
        showToast('Add this week’s commitment below.', 'success');
        return;
      }
      if (currentPlan.status === 'LOCKED') {
        setTransitioning(true);
        try {
          setPlan(await api.transitionPlan(currentPlan.id, 'START_RECONCILIATION'));
          showToast('Reconciliation started. Capture actuals and notes below.', 'success');
        } catch (e) {
          showToast(e instanceof Error ? e.message : 'Failed to start reconciliation', 'error');
        } finally {
          setTransitioning(false);
        }
        return;
      }
      if (currentPlan.status === 'RECONCILING') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('Continue reconciliation below.', 'success');
        return;
      }
      if (currentPlan.status === 'RECONCILED') {
        showToast('This week is complete. Use Carry Forward to seed next week from incomplete items.', 'success');
        return;
      }
      showToast('Carry forward already ran for this week.', 'success');
    };

    if (commitmentsActionTick > 0) {
      void runPrimaryAction();
    }
  }, [commitmentsActionTick, currentPlan, loadingPlan, createCurrentWeekPlan, showToast, setPlan]);

  const handleAddCommit = async (data: CreateCommitRequest) => {
    if (!currentPlan) return;
    try { setPlan(await api.addCommit(currentPlan.id, data)); setShowForm(false); showToast('Commitment added', 'success'); }
    catch (e) { showToast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };

  const handleDeleteCommit = async (commitId: string) => {
    try { await api.deleteCommit(commitId); if (currentPlan) setPlan(await api.fetchPlan(currentPlan.id)); showToast('Removed', 'success'); }
    catch (e) { showToast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };

  const handleTransition = async (action: string) => {
    if (!currentPlan) return;
    setTransitioning(true);
    try { setPlan(await api.transitionPlan(currentPlan.id, action)); showToast('Plan updated', 'success'); }
    catch (e) { showToast(e instanceof Error ? e.message : 'Failed', 'error'); }
    finally { setTransitioning(false); }
  };

  const handleReconcile = async (commitId: string, data: ReconcileCommitRequest) => {
    try { setPlan(await api.reconcileCommit(commitId, data)); showToast('Saved', 'success'); }
    catch (e) { showToast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };

  if (loadingPlan) {
    return <div className="flex items-center justify-center h-96 text-secondary">Loading...</div>;
  }

  if (planError || !currentPlan) {
    const hasNoPlan = planError === 'No plan for this week yet';
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${hasNoPlan ? 'bg-tertiary-container' : 'bg-error-container'}`}>
          <span className={`material-symbols-outlined text-4xl ${hasNoPlan ? 'text-on-tertiary-container' : 'text-on-error-container'}`}>
            {hasNoPlan ? 'event_available' : 'cloud_off'}
          </span>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-on-surface mb-1">
            {hasNoPlan ? 'No plan for this week' : 'Weekly planning is unavailable'}
          </h3>
          <p className="text-sm text-secondary">
            {hasNoPlan
              ? 'Contributors create their own weekly plan and add commitments here.'
              : planError}
          </p>
        </div>
        {hasNoPlan ? (
          <button onClick={createCurrentWeekPlan}
            className="px-8 py-4 bg-tertiary text-on-tertiary rounded-full font-bold text-sm shadow-lg shadow-tertiary/20 hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">add</span>
            Create This Week's Plan
          </button>
        ) : (
          <button onClick={fetchCurrentPlan}
            className="px-8 py-4 bg-white border border-outline-variant/20 text-on-surface rounded-full font-bold text-sm shadow-sm hover:bg-surface-container-low transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">refresh</span>
            Retry Loading
          </button>
        )}
      </div>
    );
  }

  const isDraft = currentPlan.status === 'DRAFT';
  const isReconciling = currentPlan.status === 'RECONCILING';
  const totalPlanned = currentPlan.commits.reduce((s, c) => s + (c.plannedHours ?? 0), 0);
  const totalActual = currentPlan.commits.reduce((s, c) => s + (c.actualHours ?? 0), 0);
  const nextAction = isDraft
    ? currentPlan.commits.length === 0
      ? 'Create your first commitment for this week.'
      : 'Add more commitments or lock the plan when prioritization is complete.'
    : 'Planning is locked. You can no longer add commitments for this week.';

  // Reconciliation
  if (isReconciling || currentPlan.status === 'RECONCILED' || currentPlan.status === 'CARRY_FORWARD') {
    const allDone = currentPlan.commits.every((c) => c.actualHours !== null && c.completionPct !== null);
    const avgPct = currentPlan.commits.length > 0
      ? Math.round(currentPlan.commits.filter((c) => c.completionPct !== null).reduce((s, c) => s + (c.completionPct ?? 0), 0) / Math.max(currentPlan.commits.filter((c) => c.completionPct !== null).length, 1))
      : 0;
    const completionTone = avgPct >= 80 ? 'text-primary' : avgPct >= 50 ? 'text-tertiary' : 'text-error';
    const carryForwardCount = currentPlan.commits.filter((c) => c.carryForward).length;
    const reconciledCount = currentPlan.commits.filter((c) => c.actualHours !== null && c.completionPct !== null).length;

    return (
      <div ref={pageRef} className="space-y-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-surface-lowest to-tertiary-container/20 p-8 shadow-[0px_18px_40px_rgba(27,27,30,0.06),0px_40px_90px_rgba(137,119,232,0.08)] ring-1 ring-outline-variant/10">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-tertiary/10 blur-3xl" />
          <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-tertiary/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-tertiary font-bold tracking-widest text-xs uppercase opacity-80">Weekly Review</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Reconciliation</h1>
                <StatusBadge status={currentPlan.status} />
              </div>
              <p className="text-secondary text-lg font-medium">Week of {currentPlan.weekStartDate}</p>
              <p className="max-w-2xl text-sm leading-6 text-secondary">
                Review each commitment against the original plan, capture actual effort, and decide what should continue into next week.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
              <div className="rounded-[1.25rem] bg-white/85 p-4 shadow-[0px_10px_30px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">Items reviewed</p>
                <p className="mt-2 text-3xl font-black text-on-surface">{reconciledCount}<span className="ml-1 text-base font-bold text-secondary">/ {currentPlan.commits.length}</span></p>
              </div>
              <div className="rounded-[1.25rem] bg-white/85 p-4 shadow-[0px_10px_30px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">Carry forward</p>
                <p className="mt-2 text-3xl font-black text-on-surface">{carryForwardCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Manager review feedback — visible to the contributor */}
        {currentPlan.reviewStatus && (
          <div className={`rounded-[1.25rem] p-5 flex items-start gap-4 ${
            currentPlan.reviewStatus === 'APPROVED'
              ? 'bg-primary-container/40 ring-1 ring-primary/20'
              : 'bg-error-container/40 ring-1 ring-error/20'
          }`}>
            <span className={`material-symbols-outlined text-2xl mt-0.5 ${
              currentPlan.reviewStatus === 'APPROVED' ? 'text-primary' : 'text-error'
            }`} style={{ fontVariationSettings: "'FILL' 1" }}>
              {currentPlan.reviewStatus === 'APPROVED' ? 'verified' : 'flag'}
            </span>
            <div>
              <p className={`font-black text-sm ${
                currentPlan.reviewStatus === 'APPROVED' ? 'text-primary' : 'text-error'
              }`}>
                {currentPlan.reviewStatus === 'APPROVED' ? 'Your manager approved this plan' : 'Your manager flagged this plan for discussion'}
              </p>
              {currentPlan.reviewFeedback && (
                <p className="text-sm text-on-surface mt-1 leading-relaxed">{currentPlan.reviewFeedback}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Planned Hours', value: `${totalPlanned}h`, color: 'text-on-surface', accent: 'from-surface-container-low to-white' },
            { label: 'Actual Hours', value: `${totalActual}h`, color: 'text-tertiary', accent: 'from-tertiary-container/35 to-white' },
            { label: 'Average Done', value: `${avgPct}%`, color: completionTone, accent: 'from-tertiary-container/35 to-white' },
            { label: 'Open Items', value: `${Math.max(currentPlan.commits.length - reconciledCount, 0)}`, color: 'text-on-surface', accent: 'from-secondary-container/45 to-white' },
          ].map((s) => (
            <div key={s.label} className={`rounded-[1.5rem] bg-gradient-to-br ${s.accent} p-5 shadow-[0px_14px_32px_rgba(27,27,30,0.06),0px_28px_60px_rgba(27,27,30,0.04)] ring-1 ring-outline-variant/10`}>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">{s.label}</p>
              <p className={`mt-3 text-4xl font-black tracking-tight ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">Commitment Reviews</h2>
            <p className="text-sm text-secondary">Each item keeps its original planning context so the review stays aligned with the rest of the workflow.</p>
          </div>
          <div className="flex gap-3">
            {isReconciling && allDone && (
              <button onClick={() => handleTransition('RECONCILE')} disabled={transitioning}
                className="px-6 py-3 bg-tertiary text-on-tertiary rounded-full font-bold shadow-lg shadow-tertiary/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Complete Reconciliation
              </button>
            )}
            {currentPlan.status === 'RECONCILED' && (
              <button onClick={() => handleTransition('CARRY_FORWARD')} disabled={transitioning}
                className="px-6 py-3 bg-tertiary text-on-tertiary rounded-full font-bold shadow-lg disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">forward</span>
                Carry Forward Incomplete Items
              </button>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {currentPlan.commits.map((c) => <ReconciliationRow key={c.id} commit={c} onReconcile={handleReconcile} disabled={!isReconciling} />)}
        </div>
      </div>
    );
  }

  // DRAFT / LOCKED
  return (
    <div className="space-y-8">
      {currentPlan.reviewStatus && (
        <div className={`rounded-[1.25rem] p-5 shadow-sm ring-1 flex items-start gap-3 ${
          currentPlan.reviewStatus === 'APPROVED'
            ? 'bg-primary-container/35 ring-primary/10'
            : 'bg-error-container/35 ring-error/10'
        }`}>
          <span className={`material-symbols-outlined text-2xl mt-0.5 ${
            currentPlan.reviewStatus === 'APPROVED' ? 'text-primary' : 'text-error'
          }`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {currentPlan.reviewStatus === 'APPROVED' ? 'verified' : 'flag'}
          </span>
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.16em] ${
              currentPlan.reviewStatus === 'APPROVED' ? 'text-primary' : 'text-error'
            }`}>
              {currentPlan.reviewStatus === 'APPROVED' ? 'Manager Approved' : 'Flagged For Discussion'}
            </p>
            <p className="mt-2 text-sm font-semibold text-on-surface">
              {currentPlan.reviewStatus === 'APPROVED'
                ? 'Your manager approved your weekly plan.'
                : 'Your manager flagged this weekly plan for follow-up.'}
            </p>
            {currentPlan.reviewFeedback && (
              <p className="mt-2 text-sm leading-6 text-secondary">{currentPlan.reviewFeedback}</p>
            )}
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-surface-lowest to-tertiary-container/20 p-8 shadow-[0px_18px_40px_rgba(27,27,30,0.06),0px_40px_90px_rgba(137,119,232,0.08)] ring-1 ring-outline-variant/10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-tertiary/10 blur-3xl" />
        <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-tertiary/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <p className="text-tertiary font-bold tracking-widest text-xs uppercase opacity-80">Weekly Planning</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">My Commitments</h1>
              <StatusBadge status={currentPlan.status} />
            </div>
            <p className="text-secondary text-lg font-medium">
              Week of {currentPlan.weekStartDate} · {totalPlanned}h planned · {currentPlan.commits.length} items
            </p>
            <p className="max-w-2xl text-sm leading-6 text-secondary">
              Contributors build their own weekly plan here, link each item to an Outcome, then lock the plan before reconciliation.
            </p>
          </div>

          <div className="grid gap-3 sm:min-w-[360px]">
            <div className="rounded-[1.25rem] bg-white/90 p-5 shadow-[0px_10px_30px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">Next Action</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-on-surface">{nextAction}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {isDraft && (
                  <button onClick={() => setShowForm(!showForm)}
                    className="px-5 py-3 bg-tertiary text-on-tertiary rounded-full font-bold text-sm flex items-center gap-2 shadow-lg shadow-tertiary/20 hover:-translate-y-0.5 transition-all">
                    <span className="material-symbols-outlined text-lg">add</span>
                    {showForm ? 'Hide Form' : 'Add Commitment'}
                  </button>
                )}
                {isDraft && currentPlan.commits.length > 0 && (
                  <button onClick={() => handleTransition('LOCK')} disabled={transitioning}
                    className="px-5 py-3 bg-white border border-outline-variant/20 rounded-full font-semibold text-sm text-secondary hover:bg-surface-container-low disabled:opacity-40 transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">lock</span>
                    Lock Plan
                  </button>
                )}
                {currentPlan.status === 'LOCKED' && (
                  <button onClick={() => handleTransition('START_RECONCILIATION')} disabled={transitioning}
                    className="px-5 py-3 bg-tertiary text-on-tertiary rounded-full font-bold text-sm shadow-lg shadow-tertiary/20 hover:-translate-y-0.5 disabled:opacity-40 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">rate_review</span>
                    Start Reconciliation
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForm && <CommitForm onSubmit={handleAddCommit} onCancel={() => setShowForm(false)} />}

      {!isDraft && (
        <div className="rounded-[1.25rem] bg-surface-lowest p-5 shadow-sm ring-1 ring-outline-variant/10">
          <p className="text-xs font-bold uppercase tracking-widest text-secondary">Planning Locked</p>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Commitments can only be added or removed while the weekly plan is in <span className="font-bold text-on-surface">DRAFT</span>. Once locked, the workflow moves to review and reconciliation.
          </p>
        </div>
      )}

      <div ref={commitsRef} className="space-y-3">
        {PRIORITY_ORDER.map((priority) => {
          const commits = currentPlan.commits.filter((c) => c.chessPriority === priority);
          if (commits.length === 0) return null;
          return (
            <div key={priority} className="space-y-2">
              {commits.map((commit) => (
                <div key={commit.id}
                  className="bg-surface-lowest hover:bg-white transition-all group rounded-[1rem] p-5 shadow-sm ring-1 ring-outline-variant/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-on-surface">{commit.title}</h4>
                        <ChessBadge priority={commit.chessPriority} />
                      </div>
                      {commit.description && <p className="text-sm text-secondary mb-2">{commit.description}</p>}
                      <div className="flex items-center gap-2 text-xs text-secondary">
                        <span className="material-symbols-outlined text-sm text-tertiary">account_tree</span>
                        <span className="text-tertiary font-medium">{commit.rallyCryName}</span>
                        <span>→</span>
                        <span>{commit.definingObjectiveName}</span>
                        <span>→</span>
                        <span className="font-medium text-on-surface">{commit.outcomeName}</span>
                        {commit.plannedHours && (
                          <span className="ml-auto px-3 py-1 bg-surface-container-low rounded-full font-semibold">{commit.plannedHours}h</span>
                        )}
                      </div>
                    </div>
                    {isDraft && (
                      <button onClick={() => handleDeleteCommit(commit.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-error-container text-secondary hover:text-error transition-all ml-3">
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {currentPlan.commits.length === 0 && !showForm && (
        <div className="bg-surface-lowest rounded-[1rem] p-16 text-center shadow-sm ring-1 ring-outline-variant/10">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">playlist_add</span>
          <p className="text-secondary font-medium">No commitments yet</p>
          <p className="text-sm text-secondary/70 mt-1">Click "Add Commitment" to get started</p>
        </div>
      )}
    </div>
  );
};

export default WeeklyPlanPage;
