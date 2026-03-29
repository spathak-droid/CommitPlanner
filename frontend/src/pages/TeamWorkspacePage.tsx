import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { StatusBadge } from '../components/StatusBadge';
import { ChessBadge } from '../components/ChessBadge';
import * as api from '../services/api';

function getMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

const TeamWorkspacePage: React.FC = () => {
  const { teamPlans, loadingTeam, fetchTeamData, showToast } = useStore();
  const [weekStart, setWeekStart] = useState(getMonday());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Awaited<ReturnType<typeof api.fetchPlan>> | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    void fetchTeamData(weekStart);
  }, [weekStart, fetchTeamData]);

  useEffect(() => {
    if (teamPlans.length === 0) {
      setSelectedUserId(null);
      setSelectedPlan(null);
      return;
    }
    if (!selectedUserId || !teamPlans.some((plan) => plan.userId === selectedUserId)) {
      setSelectedUserId(teamPlans[0]?.userId ?? null);
    }
  }, [teamPlans, selectedUserId]);

  const selectedMember = useMemo(
    () => teamPlans.find((plan) => plan.userId === selectedUserId) ?? null,
    [teamPlans, selectedUserId]
  );

  useEffect(() => {
    const loadPlan = async () => {
      if (!selectedMember?.planId) {
        setSelectedPlan(null);
        return;
      }
      setLoadingPlan(true);
      try {
        setSelectedPlan(await api.fetchPlan(selectedMember.planId));
      } catch (e) {
        setSelectedPlan(null);
        showToast(e instanceof Error ? e.message : 'Failed to load team member plan', 'error');
      } finally {
        setLoadingPlan(false);
      }
    };

    void loadPlan();
  }, [selectedMember?.planId, showToast]);

  if (loadingTeam) {
    return <div className="flex items-center justify-center h-96 text-secondary">Loading team workspace...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-primary font-bold tracking-widest text-xs uppercase opacity-80">Manager Workspace</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-on-surface">Team</h1>
          <p className="max-w-2xl text-secondary text-base leading-7">
            Move from roll-up to person-by-person review. Pick a direct report to inspect the week, read manager status, and see exactly what they committed to.
          </p>
        </div>

        <input
          type="date"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
          className="px-4 py-3 bg-white border border-outline-variant/20 rounded-full font-semibold text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="rounded-[1.75rem] bg-surface-lowest p-5 shadow-[0px_20px_48px_rgba(27,27,30,0.05)] ring-1 ring-outline-variant/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary/70">Direct Reports</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-on-surface">{teamPlans.length} people</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {teamPlans.map((member) => {
              const active = member.userId === selectedUserId;
              const status = member.status ?? 'NO_PLAN';
              return (
                <button
                  key={`${member.userId}-${member.weekStartDate}`}
                  onClick={() => setSelectedUserId(member.userId)}
                  className={`w-full rounded-[1.25rem] p-4 text-left transition-all ${
                    active
                      ? 'bg-primary-container/35 ring-1 ring-primary/15 shadow-sm'
                      : 'bg-white ring-1 ring-outline-variant/10 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-on-surface">{member.fullName}</p>
                      <p className="mt-1 text-xs text-secondary">{member.userId}</p>
                    </div>
                    <div className="rounded-full bg-surface-container-low px-2 py-1 text-[11px] font-bold text-secondary">
                      {member.totalCommits} commits
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <StatusBadge status={status} />
                    <span className={`text-xs font-black ${
                      member.reviewStatus === 'APPROVED'
                        ? 'text-primary'
                        : member.reviewStatus === 'FLAGGED'
                          ? 'text-error'
                          : 'text-secondary'
                    }`}>
                      {member.reviewStatus ?? (member.hasPlan ? 'NOT REVIEWED' : 'NO PLAN')}
                    </span>
                  </div>
                </button>
              );
            })}

            {teamPlans.length === 0 && (
              <div className="rounded-[1.25rem] bg-white p-5 text-sm text-secondary ring-1 ring-outline-variant/10">
                No direct reports are assigned to this manager yet.
              </div>
            )}
          </div>
        </aside>

        <section className="rounded-[1.75rem] bg-surface-lowest p-6 shadow-[0px_20px_48px_rgba(27,27,30,0.05)] ring-1 ring-outline-variant/10">
          {!selectedMember ? (
            <div className="flex h-96 items-center justify-center text-secondary">Select a team member to inspect their work.</div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary/70">Selected Person</p>
                  <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-on-surface">{selectedMember.fullName}</h2>
                  <p className="mt-2 text-sm text-secondary">
                    {selectedMember.userId} · Week of {selectedMember.weekStartDate}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1rem] bg-white px-4 py-3 ring-1 ring-outline-variant/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary">Status</p>
                    <div className="mt-2"><StatusBadge status={selectedMember.status ?? 'NO_PLAN'} /></div>
                  </div>
                  <div className="rounded-[1rem] bg-white px-4 py-3 ring-1 ring-outline-variant/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary">Completion</p>
                    <p className="mt-2 text-2xl font-black text-on-surface">{Math.round(selectedMember.avgCompletionPct)}%</p>
                  </div>
                  <div className="rounded-[1rem] bg-white px-4 py-3 ring-1 ring-outline-variant/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary">Review</p>
                    <p className={`mt-2 text-sm font-black ${
                      selectedMember.reviewStatus === 'APPROVED'
                        ? 'text-primary'
                        : selectedMember.reviewStatus === 'FLAGGED'
                          ? 'text-error'
                          : 'text-secondary'
                    }`}>
                      {selectedMember.reviewStatus ?? 'PENDING'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedMember.reviewStatus === 'FLAGGED' && selectedPlan?.reviewFeedback && (
                <div className="rounded-[1.25rem] bg-error-container/35 p-5 ring-1 ring-error/10">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-error">Flagged For Discussion</p>
                  <p className="mt-2 text-sm leading-6 text-secondary">{selectedPlan.reviewFeedback}</p>
                </div>
              )}

              {!selectedMember.hasPlan ? (
                <div className="rounded-[1.25rem] bg-white p-6 text-sm text-secondary ring-1 ring-outline-variant/10">
                  This person has not created a weekly plan for the selected week.
                </div>
              ) : loadingPlan ? (
                <div className="flex h-72 items-center justify-center text-secondary">Loading plan details...</div>
              ) : selectedPlan ? (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    {[
                      { label: 'Commitments', value: selectedMember.totalCommits, tone: 'text-on-surface' },
                      { label: 'Planned Hours', value: `${selectedMember.totalPlannedHours}h`, tone: 'text-on-surface' },
                      { label: 'Actual Hours', value: `${selectedMember.totalActualHours}h`, tone: 'text-primary' },
                      { label: 'Must Do', value: selectedMember.mustDoCount, tone: 'text-error' },
                    ].map((card) => (
                      <div key={card.label} className="rounded-[1.25rem] bg-white p-5 ring-1 ring-outline-variant/10">
                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary">{card.label}</p>
                        <p className={`mt-3 text-3xl font-black ${card.tone}`}>{card.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary/70">Commitments</p>
                      <h3 className="mt-2 text-2xl font-black tracking-tight text-on-surface">Current Week Plan</h3>
                    </div>

                    {selectedPlan.commits.map((commit) => (
                      <div key={commit.id} className="rounded-[1.25rem] bg-white p-5 ring-1 ring-outline-variant/10 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-on-surface">{commit.title}</h4>
                              <ChessBadge priority={commit.chessPriority} />
                              {commit.carryForward && (
                                <span className="rounded-full bg-tertiary-container/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-on-tertiary-container">
                                  Carry Forward
                                </span>
                              )}
                            </div>
                            {commit.description && (
                              <p className="mt-2 text-sm leading-6 text-secondary">{commit.description}</p>
                            )}
                            <p className="mt-3 text-sm text-secondary">
                              <span className="font-semibold text-primary">{commit.rallyCryName}</span> → {commit.definingObjectiveName} → <span className="font-semibold text-on-surface">{commit.outcomeName}</span>
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-center shrink-0 min-w-[180px]">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary">Planned</p>
                              <p className="mt-1 text-lg font-black text-on-surface">{commit.plannedHours ?? '—'}h</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary">Actual</p>
                              <p className="mt-1 text-lg font-black text-on-surface">{commit.actualHours ?? '—'}h</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary">Done</p>
                              <p className="mt-1 text-lg font-black text-on-surface">{commit.completionPct ?? '—'}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-[1.25rem] bg-white p-6 text-sm text-secondary ring-1 ring-outline-variant/10">
                  Plan details are unavailable right now.
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TeamWorkspacePage;
