import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import * as api from '../services/api';

function getMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

const TeamAlignmentPage: React.FC = () => {
  const { rcdoAlignment, loadingTeam, fetchTeamData } = useStore();
  const [weekStart, setWeekStart] = useState(getMonday());
  const [aiSuggestions, setAiSuggestions] = useState<import('../types').AlignmentSuggestion[] | null>(null);
  const [aiSuggestionsLoading, setAiSuggestionsLoading] = useState(false);

  const loadAiSuggestions = async () => {
    setAiSuggestionsLoading(true);
    try {
      const suggestions = await api.getAlignmentSuggestions(weekStart);
      setAiSuggestions(suggestions);
    } catch { setAiSuggestions([]); }
    finally { setAiSuggestionsLoading(false); }
  };

  useEffect(() => { fetchTeamData(weekStart); }, [weekStart, fetchTeamData]);

  const summary = useMemo(() => {
    let totalOutcomes = 0;
    let alignedOutcomes = 0;
    let zeroCoverage = 0;
    let atRiskOutcomes = 0;
    let totalCommits = 0;

    for (const rallyCry of rcdoAlignment) {
      for (const objective of rallyCry.objectives) {
        for (const outcome of objective.outcomes) {
          totalOutcomes += 1;
          totalCommits += outcome.commitCount;
          if (outcome.commitCount > 0) alignedOutcomes += 1;
          if (outcome.commitCount === 0) zeroCoverage += 1;

          const avgCompletion = outcome.commits.length > 0
            ? outcome.commits
              .map((commit) => commit.completionPct)
              .filter((pct): pct is number => pct !== null)
              .reduce((sum, pct, _, arr) => sum + pct / arr.length, 0)
            : 0;

          if (outcome.commitCount > 0 && avgCompletion > 0 && avgCompletion < 50) {
            atRiskOutcomes += 1;
          }
        }
      }
    }

    return {
      totalOutcomes,
      alignedOutcomes,
      zeroCoverage,
      atRiskOutcomes,
      totalCommits,
      alignmentRate: totalOutcomes > 0 ? Math.round((alignedOutcomes / totalOutcomes) * 100) : 0,
    };
  }, [rcdoAlignment]);

  const rallyCryCards = useMemo(() => (
    rcdoAlignment.map((rallyCry) => {
      const allOutcomes = rallyCry.objectives.flatMap((objective) => objective.outcomes);
      const covered = allOutcomes.filter((outcome) => outcome.commitCount > 0).length;
      const uncovered = allOutcomes.length - covered;
      const commits = allOutcomes.reduce((sum, outcome) => sum + outcome.commitCount, 0);
      const hotSpots = allOutcomes.filter((outcome) => {
        if (outcome.commitCount === 0) return false;
        const scored = outcome.commits
          .map((commit) => commit.completionPct)
          .filter((pct): pct is number => pct !== null);
        if (scored.length === 0) return false;
        return scored.reduce((sum, pct) => sum + pct, 0) / scored.length < 50;
      }).length;

      return {
        ...rallyCry,
        covered,
        uncovered,
        commits,
        hotSpots,
        health: allOutcomes.length > 0 ? Math.round((covered / allOutcomes.length) * 100) : 0,
      };
    })
  ), [rcdoAlignment]);

  if (loadingTeam) {
    return <div className="flex items-center justify-center h-96 text-secondary">Loading...</div>;
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-primary font-bold tracking-widest text-xs uppercase opacity-80">Strategic Signals</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-on-surface">Team Alignment</h1>
          <p className="max-w-2xl text-secondary text-base leading-7">
            See which Rally Cries, Defining Objectives, and Outcomes have linked weekly support for the selected week, where support is missing, and where completion data suggests execution risk.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="px-4 py-3 bg-white border border-outline-variant/20 rounded-full font-semibold text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Weekly Support Rate', value: `${summary.alignmentRate}%`, tone: 'text-primary', accent: 'from-primary-container/35 to-white' },
          { label: 'Supported Outcomes', value: `${summary.alignedOutcomes}`, tone: 'text-on-surface', accent: 'from-surface-container-low to-white' },
          { label: 'Unsupported Outcomes', value: `${summary.zeroCoverage}`, tone: summary.zeroCoverage > 0 ? 'text-error' : 'text-primary', accent: 'from-error-container/30 to-white' },
          { label: 'Low Completion Signals', value: `${summary.atRiskOutcomes}`, tone: summary.atRiskOutcomes > 0 ? 'text-tertiary' : 'text-primary', accent: 'from-tertiary-container/35 to-white' },
          { label: 'Linked Commits', value: `${summary.totalCommits}`, tone: 'text-on-surface', accent: 'from-secondary-container/35 to-white' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-[1.5rem] bg-gradient-to-br ${stat.accent} p-5 shadow-[0px_14px_32px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10`}>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary">{stat.label}</p>
            <p className={`mt-3 text-4xl font-black tracking-tight ${stat.tone}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[1.5rem] bg-surface-lowest p-5 shadow-sm ring-1 ring-outline-variant/10">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary">How To Read This</p>
        <p className="mt-2 text-sm leading-6 text-secondary">
          These are week-level support signals for the selected manager team, not a long-term strategy score. An outcome is counted as <span className="font-bold text-on-surface">supported</span> when it has at least one linked weekly commitment. A <span className="font-bold text-on-surface">low completion signal</span> appears when linked commits have completion data averaging below 50%.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] bg-surface-lowest p-6 shadow-[0px_20px_48px_rgba(27,27,30,0.05)] ring-1 ring-outline-variant/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary/70">Coverage Map</p>
                <h2 className="font-display mt-2 text-2xl font-black tracking-tight text-on-surface">Weekly Coverage Signals</h2>
              </div>
              <span className="rounded-full bg-primary-container px-4 py-2 text-xs font-black text-on-primary-container">
                {rallyCryCards.length} rally cries
            </span>
          </div>

          <div className="mt-6 space-y-5">
            {rallyCryCards.map((rallyCry) => (
              <div key={rallyCry.rallyCryId} className="rounded-[1.5rem] bg-gradient-to-br from-white to-surface-container-low p-5 ring-1 ring-outline-variant/10 shadow-[0px_12px_28px_rgba(27,27,30,0.05)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-primary-fixed px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-on-primary-fixed-variant">
                        Rally Cry
                      </span>
                      {rallyCry.uncovered > 0 ? (
                        <span className="rounded-full bg-error-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-on-error-container">
                          {rallyCry.uncovered} gap{rallyCry.uncovered > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="rounded-full bg-primary-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-on-primary-container">
                          Fully covered
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-2xl font-black tracking-tight text-on-surface">{rallyCry.rallyCryName}</h3>
                      <p className="mt-2 text-sm text-secondary">{rallyCry.objectives.length} objectives · {rallyCry.commits} linked weekly commits</p>
                    </div>
                  </div>

                  <div className="min-w-[180px] rounded-[1.25rem] bg-surface-container-low p-4">
                    <div className="flex items-center justify-between text-sm font-semibold text-secondary">
                      <span>Support</span>
                      <span className="text-primary">{rallyCry.health}%</span>
                    </div>
                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${rallyCry.health}%` }} />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Covered</p>
                        <p className="mt-1 text-lg font-black text-on-surface">{rallyCry.covered}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Gaps</p>
                        <p className="mt-1 text-lg font-black text-error">{rallyCry.uncovered}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Risk</p>
                        <p className="mt-1 text-lg font-black text-tertiary">{rallyCry.hotSpots}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {rallyCry.objectives.map((objective) => (
                    <div key={objective.objectiveId} className="rounded-[1.25rem] bg-white/70 p-4 ring-1 ring-outline-variant/10">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-tertiary">Defining Objective</span>
                        <span className="h-px flex-1 bg-outline-variant/20" />
                      </div>
                      <h4 className="mt-2 font-bold text-on-surface">{objective.objectiveName}</h4>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {objective.outcomes.map((outcome) => {
                          const scores = outcome.commits
                            .map((commit) => commit.completionPct)
                            .filter((pct): pct is number => pct !== null);
                          const avg = scores.length > 0
                            ? Math.round(scores.reduce((sum, pct) => sum + pct, 0) / scores.length)
                            : null;
                          const tone = outcome.commitCount === 0
                            ? 'bg-error-container/40 text-on-error-container'
                            : avg !== null && avg < 50
                              ? 'bg-tertiary-container/45 text-on-tertiary-container'
                              : 'bg-primary-container/45 text-on-primary-container';

                          return (
                            <div key={outcome.outcomeId} className="rounded-[1rem] bg-surface-lowest p-4 shadow-[0px_8px_20px_rgba(27,27,30,0.04)] ring-1 ring-outline-variant/10">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Outcome</p>
                                  <h5 className="mt-1 font-bold text-on-surface">{outcome.outcomeName}</h5>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${tone}`}>
                                  {outcome.commitCount === 0 ? 'No coverage' : avg !== null && avg < 50 ? 'At risk' : 'Active'}
                                </span>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-secondary">
                                  {outcome.commitCount} commit{outcome.commitCount === 1 ? '' : 's'}
                                </span>
                                {avg !== null && (
                                  <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold text-secondary">
                                    {avg}% avg done
                                  </span>
                                )}
                              </div>

                              {outcome.commits.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {outcome.commits.slice(0, 4).map((commit) => (
                                    <span key={commit.commitId} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-on-surface ring-1 ring-outline-variant/10">
                                      {commit.userId}: {commit.title}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {rallyCryCards.length === 0 && (
              <div className="rounded-[1.5rem] bg-surface-container-low p-10 text-center text-secondary">
                No alignment data found for this week.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] bg-surface-lowest p-6 shadow-[0px_20px_48px_rgba(27,27,30,0.05)] ring-1 ring-outline-variant/10">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary/70">Manager Lens</p>
            <h2 className="font-display mt-2 text-2xl font-black tracking-tight text-on-surface">What needs attention</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.25rem] bg-error-container/35 p-4">
                <p className="text-sm font-bold text-on-surface">Unsupported outcomes</p>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  {summary.zeroCoverage > 0
                    ? `${summary.zeroCoverage} outcomes currently have no linked weekly commitments for the selected week.`
                    : 'Every active outcome has at least one linked weekly commitment this week.'}
                </p>
              </div>
              <div className="rounded-[1.25rem] bg-tertiary-container/35 p-4">
                <p className="text-sm font-bold text-on-surface">Low completion signals</p>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  {summary.atRiskOutcomes > 0
                    ? `${summary.atRiskOutcomes} outcomes have linked commits averaging below 50% completion where completion data exists.`
                    : 'No outcomes with scored commits are currently showing low-completion signals.'}
                </p>
              </div>
              <div className="rounded-[1.25rem] bg-primary-container/30 p-4">
                <p className="text-sm font-bold text-on-surface">Support spread</p>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  {summary.alignmentRate >= 75
                    ? 'Weekly support is broad across the strategy map. Focus on the few weak spots rather than blank areas.'
                    : 'Weekly support is uneven. Push the team to link more weekly work directly to the under-supported outcomes.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-tertiary-container/35 via-white to-primary-container/20 p-6 shadow-[0px_20px_48px_rgba(27,27,30,0.05)] ring-1 ring-outline-variant/10">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary/70">How this differs</p>
            <h2 className="font-display mt-2 text-2xl font-black tracking-tight text-on-surface">Dashboard vs Alignment</h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-secondary">
              <p><span className="font-bold text-on-surface">Dashboard:</span> operational roll-up, weekly plan health, drill-down reviews, and sync readiness.</p>
              <p><span className="font-bold text-on-surface">Team Alignment:</span> week-specific support signals, outcome gaps, and completion-based risk indicators across Rally Cries and objectives.</p>
            </div>
          </div>

          {/* AI Alignment Suggestions */}
          <div className="rounded-[2rem] bg-gradient-to-br from-tertiary-container/25 via-white to-primary-container/15 p-6 shadow-[0px_20px_48px_rgba(27,27,30,0.05)] ring-1 ring-tertiary/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-tertiary">AI Suggestions</p>
                <h2 className="font-display mt-2 text-2xl font-black tracking-tight text-on-surface">Focus Areas</h2>
              </div>
              {!aiSuggestions && !aiSuggestionsLoading && (
                <button onClick={loadAiSuggestions}
                  className="px-4 py-2 rounded-full bg-tertiary-container text-on-tertiary-container text-xs font-bold hover:bg-tertiary hover:text-on-tertiary transition-all">
                  <span className="material-symbols-outlined text-sm mr-1 align-middle">auto_awesome</span>
                  Generate
                </button>
              )}
            </div>

            {aiSuggestionsLoading && (
              <div className="flex items-center gap-2 text-sm text-secondary">
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                Analyzing alignment...
              </div>
            )}

            {aiSuggestions && aiSuggestions.length > 0 && (
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, i) => (
                  <div key={suggestion.outcomeId} className="rounded-[1.25rem] bg-white/70 p-4 ring-1 ring-outline-variant/10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-tertiary text-on-tertiary text-xs font-black flex items-center justify-center">{i + 1}</span>
                      <span className="text-xs font-bold text-tertiary">{suggestion.rallyCryName}</span>
                    </div>
                    <p className="font-bold text-on-surface text-sm">{suggestion.outcomeName}</p>
                    <p className="text-xs text-secondary mt-1">{suggestion.reason}</p>
                  </div>
                ))}
              </div>
            )}

            {aiSuggestions && aiSuggestions.length === 0 && (
              <p className="text-sm text-secondary">All outcomes appear well-covered this week.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamAlignmentPage;
