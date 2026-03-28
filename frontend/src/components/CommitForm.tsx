import React, { useState, useEffect, useRef } from 'react';
import type { ChessPriority, CreateCommitRequest, OutcomeMatchResult, HoursEstimate } from '../types';
import { RcdoPicker } from './RcdoPicker';
import * as api from '../services/api';

interface Props {
  onSubmit: (data: CreateCommitRequest) => Promise<void>;
  onCancel: () => void;
  initialValues?: {
    title: string;
    description: string;
    chessPriority: ChessPriority;
    outcomeId: string;
    plannedHours: number | null;
  };
}

const priorities: { value: ChessPriority; label: string; active: string }[] = [
  { value: 'MUST_DO',    label: 'Must Do',    active: 'bg-error-container text-on-error-container' },
  { value: 'SHOULD_DO',  label: 'Should Do',  active: 'bg-tertiary-container text-on-tertiary-container' },
  { value: 'NICE_TO_DO', label: 'Nice to Do', active: 'bg-primary-container text-on-primary-container' },
];

export const CommitForm: React.FC<Props> = ({ onSubmit, onCancel, initialValues }) => {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [chessPriority, setChessPriority] = useState<ChessPriority>(initialValues?.chessPriority ?? 'SHOULD_DO');
  const [outcomeId, setOutcomeId] = useState(initialValues?.outcomeId ?? '');
  const [plannedHours, setPlannedHours] = useState(initialValues?.plannedHours?.toString() ?? '');
  const [submitting, setSubmitting] = useState(false);

  // AI state
  const [aiMatches, setAiMatches] = useState<OutcomeMatchResult[]>([]);
  const [aiHours, setAiHours] = useState<HoursEstimate | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDismissed, setAiDismissed] = useState(false);
  const [suggestedOutcomeId, setSuggestedOutcomeId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced AI matching on title change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (title.trim().length < 5 || aiDismissed) {
      setAiMatches([]);
      setAiHours(null);
      setAiError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setAiLoading(true);
      setAiError(null);
      try {
        const [matches, hours] = await Promise.all([
          api.matchOutcomes(title, description),
          api.estimateHours(title, description, chessPriority),
        ]);
        setAiMatches(matches);
        setAiHours(hours);
        if (matches.length > 0 && matches[0]) {
          setSuggestedOutcomeId(matches[0].outcomeId);
        }
      } catch (e) {
        if (e instanceof api.ApiError && e.status === 503) {
          setAiError('AI unavailable');
        } else {
          setAiError('AI suggestion failed');
        }
      } finally {
        setAiLoading(false);
      }
    }, 500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [title, description, chessPriority, aiDismissed]);

  const handleAcceptOutcome = (match: OutcomeMatchResult) => {
    setOutcomeId(match.outcomeId);
    setSuggestedOutcomeId(match.outcomeId);
  };

  const handleAcceptHours = () => {
    if (aiHours) setPlannedHours(aiHours.estimatedHours.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !outcomeId) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), chessPriority, outcomeId, plannedHours: plannedHours ? parseFloat(plannedHours) : null });
    } finally { setSubmitting(false); }
  };

  const showAiPanel = !aiDismissed && (aiLoading || aiMatches.length > 0 || aiHours || aiError);

  return (
    <form onSubmit={handleSubmit} className="bg-surface-lowest rounded-[1rem] p-8 shadow-[0px_24px_48px_rgba(27,27,30,0.04)] ring-1 ring-outline-variant/10 space-y-6">
      <h3 className="text-xl font-bold text-on-surface">New Commitment</h3>

      <div>
        <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-surface-container-low border-0 rounded-full px-5 py-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="What are you committing to?" required />
      </div>

      {/* AI Suggestion Panel */}
      {showAiPanel && (
        <div className="rounded-[1rem] bg-gradient-to-br from-tertiary-container/20 via-white to-primary-container/10 p-5 ring-1 ring-tertiary/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-tertiary">auto_awesome</span>
              <span className="text-xs font-black uppercase tracking-widest text-tertiary">AI Suggestions</span>
            </div>
            <button type="button" onClick={() => setAiDismissed(true)}
              className="p-1 rounded-full hover:bg-surface-container text-secondary transition-colors">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {aiLoading && (
            <div className="flex items-center gap-2 text-sm text-secondary">
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              Analyzing your commitment...
            </div>
          )}

          {aiError && (
            <p className="text-sm text-secondary">{aiError}</p>
          )}

          {/* Outcome Matches */}
          {aiMatches.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-secondary uppercase tracking-widest">Matched Outcomes</p>
              {aiMatches.map((match) => (
                <div key={match.outcomeId} className="flex items-start justify-between gap-3 rounded-[0.75rem] bg-white/80 p-3 ring-1 ring-outline-variant/10">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface">{match.outcomeName}</p>
                    <p className="text-xs text-secondary">
                      {match.rallyCryName} → {match.definingObjectiveName}
                    </p>
                    <p className="text-xs text-secondary/70 mt-1">{match.rationale}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-tertiary">{Math.round(match.confidence * 100)}%</span>
                    <button type="button" onClick={() => handleAcceptOutcome(match)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        outcomeId === match.outcomeId
                          ? 'bg-primary text-on-primary'
                          : 'bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary'
                      }`}>
                      {outcomeId === match.outcomeId ? 'Linked' : 'Accept'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hours Estimate */}
          {aiHours && (
            <div className="flex items-center justify-between rounded-[0.75rem] bg-white/80 p-3 ring-1 ring-outline-variant/10">
              <div>
                <p className="text-xs font-bold text-secondary uppercase tracking-widest">Estimated Hours</p>
                <p className="text-lg font-black text-on-surface mt-1">
                  {aiHours.estimatedHours}h
                  <span className="text-xs font-medium text-secondary ml-2">({aiHours.lowRange}–{aiHours.highRange}h range)</span>
                </p>
                <p className="text-xs text-secondary/70 mt-1">{aiHours.rationale}</p>
              </div>
              <button type="button" onClick={handleAcceptHours}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  plannedHours === aiHours.estimatedHours.toString()
                    ? 'bg-primary text-on-primary'
                    : 'bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary'
                }`}>
                {plannedHours === aiHours.estimatedHours.toString() ? 'Applied' : 'Accept'}
              </button>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-surface-container-low border-0 rounded-[1rem] px-5 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          rows={3} placeholder="Additional context..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Planned Hours</label>
          <input type="number" value={plannedHours} onChange={(e) => setPlannedHours(e.target.value)}
            className="w-full bg-surface-container-low border-0 rounded-full px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            min="0" step="0.5" placeholder="0" />
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Priority</label>
          <div className="flex gap-2">
            {priorities.map((p) => (
              <button key={p.value} type="button" onClick={() => setChessPriority(p.value)}
                className={`flex-1 py-3 rounded-full text-xs font-black transition-all ${
                  chessPriority === p.value ? p.active : 'bg-surface-container text-secondary'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Link to Outcome</label>
        <RcdoPicker value={outcomeId} onChange={setOutcomeId} suggestedOutcomeId={suggestedOutcomeId} />
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="px-6 py-3 bg-white border border-outline-variant/20 rounded-full font-semibold text-sm text-secondary hover:bg-surface-container-low transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={!title.trim() || !outcomeId || submitting}
          className="px-8 py-3 bg-primary text-on-primary rounded-full font-bold text-sm shadow-lg shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-40 transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">add</span>
          {submitting ? 'Adding...' : 'Add Commitment'}
        </button>
      </div>
    </form>
  );
};
