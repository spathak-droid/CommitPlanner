import React from 'react';

const ProblemStatementPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="font-display text-4xl font-black tracking-tight text-on-surface">
          Why Replace 15-Five?
        </h1>
        <p className="text-secondary text-sm max-w-2xl mx-auto leading-relaxed">
          Individual weekly commitments have no structural link to organizational strategy.
          Managers can't see misalignment until it's too late.
        </p>
      </div>

      {/* Before / After */}
      <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-0 items-stretch">
        {/* BEFORE */}
        <div className="rounded-l-3xl border-2 border-error bg-error-container/10 p-6 space-y-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-error">Before — 15-Five</p>
            <h2 className="font-display text-xl font-black text-on-surface mt-1">Isolated Planning</h2>
          </div>

          {/* Org goals - disconnected */}
          <div className="relative rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/60 p-5 opacity-50">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-error mb-3">Organizational Goals</p>
            <div className="space-y-2">
              <p className="text-sm text-secondary pl-3 border-l-2 border-outline-variant">Rally Cry: Grow Enterprise ARR</p>
              <p className="text-sm text-secondary pl-3 border-l-2 border-outline-variant">Objective: Reduce onboarding time</p>
              <p className="text-sm text-secondary pl-3 border-l-2 border-outline-variant">Outcome: 50% faster first-value</p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-error/10 border border-error text-error text-[11px] font-black tracking-widest px-4 py-1.5 rounded -rotate-6">
                NOT CONNECTED
              </span>
            </div>
          </div>

          {/* Commits - no priority */}
          <div className="rounded-2xl bg-surface-container-low p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary mb-3">Weekly Commitments</p>
            <div className="space-y-2">
              {['Refactor auth module', 'Update API docs', 'Fix staging bugs', 'Team sync prep'].map((item) => (
                <div key={item} className="flex items-center gap-3 bg-surface rounded-xl px-4 py-3">
                  <span className="w-2 h-2 rounded-full bg-error flex-shrink-0" />
                  <span className="text-sm text-on-surface">{item}</span>
                  <span className="ml-auto text-[10px] text-secondary/60 whitespace-nowrap">no priority</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pain points */}
          <div className="space-y-2.5">
            {[
              'No link between work and strategy',
              'No prioritization framework',
              'No reconciliation — planned vs. actual invisible',
              'Managers see misalignment too late',
            ].map((pain) => (
              <div key={pain} className="flex items-start gap-2.5 text-sm text-[#d97706]">
                <span className="material-symbols-outlined text-base mt-0.5 flex-shrink-0">warning</span>
                {pain}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow divider */}
        <div className="hidden lg:flex items-center justify-center px-3">
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-primary">arrow_forward</span>
          </div>
        </div>
        <div className="lg:hidden flex justify-center py-3">
          <span className="material-symbols-outlined text-3xl text-primary">arrow_downward</span>
        </div>

        {/* AFTER */}
        <div className="rounded-r-3xl border-2 border-primary bg-primary-container/10 p-6 space-y-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">After — Weekly Commit System</p>
            <h2 className="font-display text-xl font-black text-on-surface mt-1">Strategy-Linked Planning</h2>
          </div>

          {/* RCDO tree */}
          <div className="rounded-2xl bg-surface-container-low p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary mb-3">RCDO Hierarchy</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#f78166]">
                <span className="material-symbols-outlined text-base">star</span>
                Rally Cry: Grow Enterprise ARR
              </div>
              <div className="flex items-center gap-2 text-sm text-tertiary pl-5">
                <span className="material-symbols-outlined text-base">play_arrow</span>
                Reduce onboarding time
              </div>
              <div className="flex items-center gap-2 text-sm text-primary pl-10">
                <span className="material-symbols-outlined text-xs">circle</span>
                50% faster first-value
              </div>
              <div className="flex items-center gap-2 text-sm text-tertiary pl-5">
                <span className="material-symbols-outlined text-base">play_arrow</span>
                Improve self-serve activation
              </div>
              <div className="flex items-center gap-2 text-sm text-primary pl-10">
                <span className="material-symbols-outlined text-xs">circle</span>
                30% trial-to-paid conversion
              </div>
            </div>
          </div>

          {/* Linked commits */}
          <div className="rounded-2xl bg-surface-container-low p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary mb-3">Linked Commitments</p>
            <div className="space-y-2">
              {[
                { title: 'Refactor auth module', chess: 'A', chessColor: 'bg-error/10 text-error border-error', outcome: 'faster first-value' },
                { title: 'Fix staging bugs', chess: 'A', chessColor: 'bg-error/10 text-error border-error', outcome: 'trial-to-paid' },
                { title: 'Update API docs', chess: 'B', chessColor: 'bg-tertiary/10 text-tertiary border-tertiary', outcome: 'faster first-value' },
                { title: 'Team sync prep', chess: 'C', chessColor: 'bg-primary/10 text-primary border-primary', outcome: 'trial-to-paid' },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3 bg-surface rounded-xl px-4 py-3">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${item.chessColor}`}>{item.chess}</span>
                  <span className="text-sm text-on-surface">{item.title}</span>
                  <span className="ml-auto flex items-center gap-1 text-[10px] text-primary whitespace-nowrap">
                    <span className="material-symbols-outlined text-xs">link</span>
                    {item.outcome}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2.5">
            {[
              'Every commit links to an organizational outcome',
              'Chess layer enforces A / B / C prioritization',
              'Reconciliation tracks planned vs. actual',
              'Managers see alignment gaps in real-time',
            ].map((benefit) => (
              <div key={benefit} className="flex items-start gap-2.5 text-sm text-primary">
                <span className="material-symbols-outlined text-base mt-0.5 flex-shrink-0">check_circle</span>
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lifecycle bar */}
      <div className="rounded-2xl bg-surface-container-low border border-outline-variant/20 p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary text-center mb-5">
          Enforced Weekly Lifecycle
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {[
            { label: 'DRAFT', color: 'bg-surface-container text-secondary border-outline-variant' },
            { label: 'LOCKED', color: 'bg-tertiary/10 text-tertiary border-tertiary/30' },
            { label: 'RECONCILING', color: 'bg-[#f78166]/10 text-[#f78166] border-[#f78166]/30' },
            { label: 'RECONCILED', color: 'bg-primary/10 text-primary border-primary/30' },
            { label: 'CARRY FORWARD', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
          ].map((step, i, arr) => (
            <React.Fragment key={step.label}>
              <span className={`px-5 py-2.5 rounded-xl text-xs font-bold border ${step.color}`}>
                {step.label}
              </span>
              {i < arr.length - 1 && (
                <span className="material-symbols-outlined text-outline-variant text-lg">arrow_forward</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* STAR Method Summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { letter: 'S', title: 'Situation', desc: '15-Five has no structural link between weekly work and organizational RCDO goals', color: 'text-error' },
          { letter: 'T', title: 'Task', desc: 'Build a micro-frontend that enforces strategy-linked weekly planning with full lifecycle', color: 'text-tertiary' },
          { letter: 'A', title: 'Action', desc: 'React + Spring Boot system with RCDO picker, chess prioritization, reconciliation, manager review', color: 'text-primary' },
          { letter: 'R', title: 'Result', desc: 'Real-time alignment visibility, AI-assisted planning, analytics tracking organizational health', color: 'text-blue-600' },
        ].map((item) => (
          <div key={item.letter} className="rounded-2xl bg-surface-container-low border border-outline-variant/15 p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-2xl font-black ${item.color}`}>{item.letter}</span>
              <span className="text-sm font-bold text-on-surface">{item.title}</span>
            </div>
            <p className="text-xs text-secondary leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProblemStatementPage;
