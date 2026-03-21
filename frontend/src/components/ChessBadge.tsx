import React from 'react';
import type { ChessPriority } from '../types';

const STYLES: Record<ChessPriority, { bg: string; text: string; label: string }> = {
  MUST_DO:    { bg: 'bg-error-container',    text: 'text-on-error-container', label: 'A · Must Do' },
  SHOULD_DO:  { bg: 'bg-tertiary-container', text: 'text-on-tertiary-container', label: 'B · Should Do' },
  NICE_TO_DO: { bg: 'bg-primary-container',  text: 'text-on-primary-container', label: 'C · Nice to Do' },
};

export const ChessBadge: React.FC<{ priority: ChessPriority }> = ({ priority }) => {
  const s = STYLES[priority];
  return (
    <span className={`px-3 py-1 ${s.bg} ${s.text} rounded-full text-xs font-black`}>
      {s.label}
    </span>
  );
};
