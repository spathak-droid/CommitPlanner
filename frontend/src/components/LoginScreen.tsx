import React, { useMemo, useState } from 'react';
import type { UserRole } from '../types';
import faviconGreen from '../../public/assets/favicon-green.png';

interface Props {
  onLogin: (userId: string, password: string) => Promise<void>;
}

const roleContent: Record<UserRole, {
  label: string;
  title: string;
  accent: string;
  glow: string;
  panel: string;
  icon: string;
  password: string;
  presets: string[];
  metrics: { label: string; value: string }[];
}> = {
  MANAGER: {
    label: 'Manager',
    title: 'Lead the week',
    accent: 'from-primary to-[#7f9e22]',
    glow: 'bg-primary/20',
    panel: 'from-primary-container/35 via-white to-surface-lowest',
    icon: 'insights',
    password: 'password123',
    presets: ['manager-1', 'director-ops', 'lead-product'],
    metrics: [
      { label: 'Views', value: 'Dashboard' },
      { label: 'Action', value: 'Review' },
      { label: 'Scope', value: 'Team' },
    ],
  },
  IC: {
    label: 'Contributor',
    title: 'Own the week',
    accent: 'from-tertiary to-[#8570e6]',
    glow: 'bg-tertiary/20',
    panel: 'from-tertiary-container/35 via-white to-surface-lowest',
    icon: 'event_available',
    password: 'password123',
    presets: ['user-1', 'ic-product', 'ic-design'],
    metrics: [
      { label: 'Views', value: 'Commitments' },
      { label: 'Action', value: 'Reconcile' },
      { label: 'Scope', value: 'Personal' },
    ],
  },
};

export const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('MANAGER');
  const [userId, setUserId] = useState('manager-1');
  const [password, setPassword] = useState(roleContent.MANAGER.password);
  const [submitting, setSubmitting] = useState(false);

  const current = roleContent[role];
  const presets = useMemo(() => current.presets, [current.presets]);

  const handleRoleChange = (nextRole: UserRole) => {
    const next = roleContent[nextRole];
    setRole(nextRole);
    setUserId(next.presets[0] ?? '');
    setPassword(next.password);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId.trim() || !password) return;
    setSubmitting(true);
    try {
      await onLogin(userId.trim(), password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="font-body min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(121,151,32,0.16),_transparent_30%),radial-gradient(circle_at_85%_15%,_rgba(137,119,232,0.16),_transparent_24%),linear-gradient(180deg,_#fcfbfd_0%,_#f3eef6_100%)] px-6 py-8 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-stretch gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="relative overflow-hidden rounded-[2.5rem] bg-[#181c13] p-8 shadow-[0px_30px_80px_rgba(27,27,30,0.24)] lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(121,151,32,0.18),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(137,119,232,0.15),_transparent_24%)]" />
          <div className="absolute -left-16 top-24 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-10 right-8 h-52 w-52 rounded-full bg-tertiary/10 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between">
            <div className="space-y-6">
              <img src={faviconGreen} alt="Weekly Commit" className="h-12 rounded-xl" />

              <div className="space-y-4">
                <h1 className="font-display max-w-xl text-5xl font-black tracking-[-0.04em] text-white leading-[0.98] lg:text-6xl">
                  Weekly planning with a sharper front door.
                </h1>
                <p className="max-w-lg text-sm leading-7 text-white/68 lg:text-base">
                  Sign in as a manager or contributor. Same product language, cleaner entry, role-aware actions.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: 'Plan', value: 'Commitments linked to outcomes' },
                  { label: 'Review', value: 'Actuals, notes, carry-forward' },
                  { label: 'Align', value: 'Manager visibility across the week' },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5 shadow-[inset_0px_1px_0px_rgba(255,255,255,0.08)]">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">{item.label}</p>
                    <p className="mt-3 text-sm font-semibold leading-6 text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[inset_0px_1px_0px_rgba(255,255,255,0.08)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">Selected Role</p>
                    <h2 className="font-display mt-2 text-2xl font-black tracking-[-0.03em] text-white">{current.label}</h2>
                  </div>
                  <div className={`flex h-14 w-14 items-center justify-center rounded-[1.3rem] bg-gradient-to-br ${current.accent} shadow-[0px_18px_34px_rgba(27,27,30,0.24)]`}>
                    <span className="material-symbols-outlined text-2xl text-white">{current.icon}</span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {current.metrics.map((metric) => (
                    <div key={metric.label} className="rounded-[1.2rem] bg-black/12 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">{metric.label}</p>
                      <p className="mt-2 text-sm font-bold text-white">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-[inset_0px_1px_0px_rgba(255,255,255,0.08)]">
                <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${current.glow} blur-2xl`} />
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">Access Split</p>
                <div className="mt-4 space-y-3">
                  {(['MANAGER', 'IC'] as UserRole[]).map((option) => {
                    const item = roleContent[option];
                    const active = option === role;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleRoleChange(option)}
                        className={`flex w-full items-center justify-between rounded-[1.2rem] px-4 py-3 text-left transition-all ${
                          active
                            ? 'bg-white text-on-surface shadow-[0px_12px_26px_rgba(27,27,30,0.16)]'
                            : 'bg-white/8 text-white/80 hover:bg-white/12'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em]">{item.label}</p>
                          <p className={`mt-1 text-sm ${active ? 'text-secondary' : 'text-white/56'}`}>{item.title}</p>
                        </div>
                        <span className="material-symbols-outlined">{active ? 'radio_button_checked' : 'radio_button_unchecked'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${current.panel} p-8 shadow-[0px_30px_70px_rgba(27,27,30,0.10)] ring-1 ring-outline-variant/10 lg:p-10`}>
          <div className={`absolute right-0 top-0 h-48 w-48 rounded-full ${current.glow} blur-3xl`} />
          <div className="relative flex h-full flex-col">
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/75">Sign In</p>
              <h2 className="font-display text-4xl font-black tracking-[-0.04em] text-on-surface">{current.title}</h2>
              <p className="text-sm leading-6 text-secondary">Use a seeded account below to enter the workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-1 flex-col">
              <div className="space-y-5 rounded-[2rem] bg-white/80 p-6 shadow-[0px_18px_40px_rgba(27,27,30,0.08)] ring-1 ring-outline-variant/10">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-secondary">User ID</span>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full rounded-[1rem] border border-outline-variant/15 bg-white px-4 py-3 text-sm font-medium text-on-surface shadow-[0px_8px_18px_rgba(27,27,30,0.05)] outline-none transition-all focus:ring-2 focus:ring-primary/30"
                    placeholder="Enter your user ID"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-secondary">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-[1rem] border border-outline-variant/15 bg-white px-4 py-3 text-sm font-medium text-on-surface shadow-[0px_8px_18px_rgba(27,27,30,0.05)] outline-none transition-all focus:ring-2 focus:ring-primary/30"
                    placeholder="Enter your password"
                    required
                  />
                </label>
              </div>

              <div className="mt-5 rounded-[1.75rem] bg-white/70 p-5 ring-1 ring-outline-variant/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary">Quick Access</p>
                    <p className="mt-1 text-xs text-secondary">Password: {current.password}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${current.accent} text-white shadow-[0px_14px_26px_rgba(27,27,30,0.16)]`}>
                    <span className="material-symbols-outlined text-lg">key</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setUserId(preset);
                        setPassword(current.password);
                      }}
                      className="rounded-full bg-surface-container-low px-4 py-2 text-xs font-bold text-secondary transition-all hover:bg-surface-container hover:text-on-surface"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {(['MANAGER', 'IC'] as UserRole[]).map((option) => {
                  const item = roleContent[option];
                  const active = option === role;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleRoleChange(option)}
                      className={`rounded-[1.4rem] border px-5 py-4 text-left transition-all ${
                        active
                          ? 'border-transparent bg-white shadow-[0px_16px_28px_rgba(27,27,30,0.10)] ring-2 ring-primary/15'
                          : 'border-outline-variant/20 bg-white/45 hover:bg-white/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-secondary">{item.label}</p>
                          <p className="font-display mt-1 text-lg font-black tracking-[-0.03em] text-on-surface">{item.title}</p>
                        </div>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${active ? `bg-gradient-to-br ${item.accent} text-white` : 'bg-surface-container text-secondary'}`}>
                          <span className="material-symbols-outlined text-lg">{item.icon}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-auto flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r ${current.accent} px-8 py-4 text-sm font-black text-white shadow-[0px_20px_38px_rgba(27,27,30,0.18)] transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50`}
                >
                  <span className="material-symbols-outlined text-lg">{submitting ? 'hourglass_top' : 'login'}</span>
                  {submitting ? 'Signing In...' : `Enter as ${current.label}`}
                </button>
                <a
                  href={`${((window as any).__API_URL__ || 'http://localhost:8080/api').replace(/\/api\/?$/, '')}/swagger-ui/index.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-outline-variant/20 bg-white/70 px-6 py-3 text-xs font-bold text-secondary transition-all hover:bg-white hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-base">api</span>
                  API Docs (Swagger)
                </a>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};
