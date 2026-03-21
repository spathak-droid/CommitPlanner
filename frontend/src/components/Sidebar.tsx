import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { UserRole } from '../types';

type View = 'dashboard' | 'team' | 'commitments' | 'alignment' | 'rcdo' | 'settings';

interface Props {
  activeView: View;
  onViewChange: (view: View) => void;
  role: UserRole;
  onLogout: () => void;
  onPrimaryAction?: () => void;
}

const navItemsByRole: Record<UserRole, { id: View; label: string; icon: string }[]> = {
  MANAGER: [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'team', label: 'Team', icon: 'groups' },
    { id: 'alignment', label: 'Team Alignment', icon: 'group' },
    { id: 'rcdo', label: 'RCDO Hierarchy', icon: 'account_tree' },
  ],
  IC: [
    { id: 'commitments', label: 'Weekly Commitments', icon: 'event_available' },
    { id: 'rcdo', label: 'RCDO Hierarchy', icon: 'account_tree' },
  ],
};

export const Sidebar: React.FC<Props> = ({ activeView, onViewChange, role, onLogout, onPrimaryAction }) => {
  const sidebarRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const navItems = navItemsByRole[role];
  const ctaView = role === 'MANAGER' ? 'alignment' : 'commitments';
  const ctaLabel = role === 'MANAGER' ? 'Review Team Alignment' : 'Open Weekly Commitments';
  const ctaIcon = role === 'MANAGER' ? 'insights' : 'add';
  const activeClass = role === 'MANAGER' ? 'bg-white text-primary' : 'bg-white text-tertiary';
  const hoverClass = role === 'MANAGER' ? 'hover:text-primary' : 'hover:text-tertiary';
  const ctaClass = role === 'MANAGER'
    ? 'bg-primary-container text-on-primary-container'
    : 'bg-tertiary-container text-on-tertiary-container';

  useEffect(() => {
    if (!sidebarRef.current) return;
    gsap.fromTo(sidebarRef.current,
      { x: -280, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  useEffect(() => {
    if (!btnRef.current) return;
    gsap.fromTo(btnRef.current,
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)', delay: 0.5 }
    );
  }, []);

  return (
    <aside ref={sidebarRef} className="fixed left-0 top-0 h-screen w-72 flex-col p-6 z-40 bg-surface-container-low rounded-r-lg shadow-[0px_24px_48px_rgba(27,27,30,0.06)] hidden md:flex pt-24">
      <div className="flex flex-col gap-2 flex-grow">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-3 px-4 py-3 text-left transition-all ${
                isActive
                  ? `${activeClass} rounded-full shadow-sm`
                  : `text-secondary ${hoverClass} hover:translate-x-1`
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => onViewChange('settings')}
          className={`mt-auto flex items-center gap-3 px-4 py-3 text-left transition-all ${
            activeView === 'settings'
              ? `${activeClass} rounded-full shadow-sm`
              : `text-secondary ${hoverClass} hover:translate-x-1`
          }`}
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-medium text-sm">Settings</span>
        </button>

        <button
          onClick={onLogout}
          className={`flex items-center gap-3 px-4 py-3 text-left text-secondary transition-all ${hoverClass} hover:translate-x-1`}
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-medium text-sm">Sign Out</span>
        </button>
      </div>

      <button
        ref={btnRef}
        onClick={() => {
          if (role === 'IC' && onPrimaryAction) {
            onPrimaryAction();
            return;
          }
          onViewChange(ctaView);
        }}
        className={`mt-6 w-full py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all hover:shadow-md ${ctaClass}`}
      >
        <span className="material-symbols-outlined text-lg">{ctaIcon}</span>
        {ctaLabel}
      </button>
    </aside>
  );
};

export type { View };
