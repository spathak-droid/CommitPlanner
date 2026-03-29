import React from 'react';
import type { UserRole } from '../types';
import { NotificationBell } from './NotificationBell';
import logoFullPurple from '../../public/assets/logo-full.png';
import logoFullGreen from '../../public/assets/logo-green-full.png';

interface Props {
  fullName: string;
  role: UserRole;
}

export const TopNav: React.FC<Props> = ({ fullName, role }) => {
  const avatarClass = role === 'MANAGER'
    ? 'bg-primary-container border-primary-container text-on-primary-container'
    : 'bg-tertiary-container border-tertiary-container text-on-tertiary-container';

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 py-3 bg-surface">
      <div className="flex items-center gap-8">
        <img src={role === 'MANAGER' ? logoFullGreen : logoFullPurple} alt="Weekly Commit" className="h-8" />
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />

        <div className="hidden md:block text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary">{role === 'MANAGER' ? 'Manager' : 'Contributor'}</p>
          <p className="text-sm font-semibold text-on-surface">{fullName}</p>
        </div>

        <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center ${avatarClass}`}>
          <span className="text-sm font-bold">{fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</span>
        </div>

      </div>
    </header>
  );
};
