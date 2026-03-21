import React from 'react';
import type { PlanStatus } from '../types';

const CFG: Record<PlanStatus | 'NO_PLAN', { bg: string; text: string; label: string }> = {
  DRAFT:         { bg: 'bg-surface-container',  text: 'text-on-secondary-container', label: 'DRAFT' },
  LOCKED:        { bg: 'bg-primary-fixed',      text: 'text-on-primary-fixed-variant', label: 'LOCKED' },
  RECONCILING:   { bg: 'bg-tertiary-fixed',     text: 'text-on-tertiary-container', label: 'RECONCILING' },
  RECONCILED:    { bg: 'bg-primary-container',  text: 'text-on-primary-container', label: 'RECONCILED' },
  CARRY_FORWARD: { bg: 'bg-error-container',    text: 'text-on-error-container', label: 'CARRY FWD' },
  NO_PLAN:       { bg: 'bg-error-container',    text: 'text-on-error-container', label: 'NO PLAN' },
};

export const StatusBadge: React.FC<{ status: PlanStatus | 'NO_PLAN' }> = ({ status }) => {
  const c = CFG[status];
  return (
    <span className={`px-3 py-1 ${c.bg} ${c.text} rounded-full text-xs font-black`}>
      {c.label}
    </span>
  );
};
