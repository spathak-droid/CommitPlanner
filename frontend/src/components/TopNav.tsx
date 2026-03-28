import React from 'react';
import type { View } from './Sidebar';
import type { UserRole } from '../types';
import { NotificationBell } from './NotificationBell';
import logoFullPurple from '../../public/assets/logo-full.png';
import logoFullGreen from '../../public/assets/logo-green-full.png';

interface Props {
  activeView: View;
  onViewChange: (view: View) => void;
  userId: string;
  fullName: string;
  role: UserRole;
}

const tabsByRole: Record<UserRole, { id: View; label: string }[]> = {
  MANAGER: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'team', label: 'Team' },
    { id: 'alignment', label: 'Team Alignment' },
    { id: 'rcdo', label: 'RCDO Hierarchy' },
  ],
  IC: [
    { id: 'commitments', label: 'Commitments' },
    { id: 'rcdo', label: 'RCDO Hierarchy' },
  ],
};

export const TopNav: React.FC<Props> = ({ activeView, onViewChange, userId, fullName, role }) => {
  const tabs = tabsByRole[role];
  const accentText = role === 'MANAGER' ? 'text-primary' : 'text-tertiary';
  const accentHover = role === 'MANAGER' ? 'hover:text-primary' : 'hover:text-tertiary';
  const avatarClass = role === 'MANAGER'
    ? 'bg-primary-container border-primary-container text-on-primary-container'
    : 'bg-tertiary-container border-tertiary-container text-on-tertiary-container';

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 bg-surface">
      <div className="flex items-center gap-8">
        <img src={role === 'MANAGER' ? logoFullGreen : logoFullPurple} alt="Weekly Commit" className="h-8" />
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex gap-6 text-sm font-semibold">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id)}
                className={`transition-colors ${
                  activeView === tab.id
                    ? `${accentText} font-bold`
                    : `text-secondary ${accentHover}`
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />

        <div className="hidden md:block text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary">{role === 'MANAGER' ? 'Manager' : 'Contributor'}</p>
          <p className="text-sm font-semibold text-on-surface">{fullName}</p>
          <p className="text-[11px] text-secondary">{userId}</p>
        </div>

        <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center ${avatarClass}`}>
          <span className="text-sm font-bold">{userId.slice(0, 2).toUpperCase()}</span>
        </div>

      </div>
    </header>
  );
};
