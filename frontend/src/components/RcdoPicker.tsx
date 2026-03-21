import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

interface Props {
  value: string;
  onChange: (outcomeId: string) => void;
}

export const RcdoPicker: React.FC<Props> = ({ value, onChange }) => {
  const { rcdoTree, fetchRcdo, loadingRcdo } = useStore();
  const [expandedRc, setExpandedRc] = useState<string | null>(null);
  const [expandedDo, setExpandedDo] = useState<string | null>(null);

  useEffect(() => {
    if (rcdoTree.length === 0) fetchRcdo();
  }, [rcdoTree.length, fetchRcdo]);

  if (loadingRcdo) return <div className="bg-surface-container-low rounded-[1rem] p-4 text-sm text-secondary animate-pulse">Loading...</div>;

  return (
    <div className="bg-surface-container-low rounded-[1rem] max-h-52 overflow-y-auto">
      {rcdoTree.map((rc) => (
        <div key={rc.id}>
          <button type="button" onClick={() => setExpandedRc(expandedRc === rc.id ? null : rc.id)}
            className="w-full text-left px-5 py-3 hover:bg-surface-container font-semibold text-sm flex justify-between items-center transition-colors">
            <span className="text-on-surface">{rc.name}</span>
            <span className="material-symbols-outlined text-sm text-secondary">{expandedRc === rc.id ? 'expand_less' : 'expand_more'}</span>
          </button>
          {expandedRc === rc.id && rc.definingObjectives.map((dobj) => (
            <div key={dobj.id}>
              <button type="button" onClick={() => setExpandedDo(expandedDo === dobj.id ? null : dobj.id)}
                className="w-full text-left pl-8 pr-5 py-2 hover:bg-surface-container text-sm flex justify-between items-center">
                <span className="text-secondary">{dobj.name}</span>
                <span className="material-symbols-outlined text-xs text-secondary">{expandedDo === dobj.id ? 'expand_less' : 'expand_more'}</span>
              </button>
              {expandedDo === dobj.id && dobj.outcomes.map((o) => (
                <button key={o.id} type="button" onClick={() => onChange(o.id)}
                  className={`w-full text-left pl-12 pr-5 py-2 text-sm transition-colors ${
                    value === o.id ? 'bg-primary-container text-on-primary-container font-semibold' : 'text-secondary hover:bg-surface-container'
                  }`}>
                  {o.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
