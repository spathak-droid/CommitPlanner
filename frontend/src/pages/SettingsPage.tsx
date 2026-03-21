import React, { useEffect, useMemo, useState } from 'react';
import * as api from '../services/api';
import { useStore } from '../store/useStore';
import type { AdminUserResponse, ManagerAssignmentResponse, UserRole } from '../types';

const SettingsPage: React.FC = () => {
  const { fullName, role, userId, showToast, logout } = useStore();
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [assignments, setAssignments] = useState<ManagerAssignmentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showAdvancedAdmin, setShowAdvancedAdmin] = useState(false);
  const [createForm, setCreateForm] = useState({
    userId: '',
    fullName: '',
    role: 'IC' as UserRole,
    password: 'ContributorPass123!',
  });

  const isManager = role === 'MANAGER';

  const loadAdminData = async () => {
    if (!isManager) return;
    setLoading(true);
    try {
      const [nextUsers, nextAssignments] = await Promise.all([
        api.fetchAdminUsers(),
        api.fetchManagerAssignments(),
      ]);
      setUsers(nextUsers);
      setAssignments(nextAssignments);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to load admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, [isManager]);

  const managers = useMemo(() => users.filter((candidate) => candidate.role === 'MANAGER' && candidate.active), [users]);
  const contributors = useMemo(() => users.filter((candidate) => candidate.role === 'IC'), [users]);

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      await api.createAdminUser(createForm);
      showToast('User created', 'success');
      setCreateForm({ userId: '', fullName: '', role: 'IC', password: 'ContributorPass123!' });
      await loadAdminData();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to create user', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleAssignment = async (managerId: string, memberId: string) => {
    const currentMembers = assignments.filter((assignment) => assignment.managerId === managerId).map((assignment) => assignment.memberId);
    const nextMembers = currentMembers.includes(memberId)
      ? currentMembers.filter((id) => id !== memberId)
      : [...currentMembers, memberId];

    try {
      await api.replaceManagerAssignments(managerId, nextMembers);
      showToast('Assignments updated', 'success');
      await loadAdminData();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to update assignments', 'error');
    }
  };

  const handleUpdateUser = async (candidate: AdminUserResponse, updates: Partial<AdminUserResponse>) => {
    try {
      await api.updateAdminUser(candidate.userId, {
        fullName: updates.fullName ?? candidate.fullName,
        role: updates.role ?? candidate.role,
        active: updates.active ?? candidate.active,
      });
      showToast('User updated', 'success');
      await loadAdminData();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to update user', 'error');
    }
  };

  const handleResetPassword = async (candidate: AdminUserResponse) => {
    const nextPassword = candidate.role === 'MANAGER' ? 'ManagerPass123!' : 'ContributorPass123!';
    try {
      await api.resetAdminPassword(candidate.userId, nextPassword);
      showToast(`Password reset to ${nextPassword}`, 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to reset password', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-primary font-bold tracking-widest text-xs uppercase opacity-80">Configuration</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-on-surface">Admin Setup</h1>
        <p className="text-secondary text-lg font-medium">Signed in as {fullName} · {role === 'MANAGER' ? 'Manager' : 'Contributor'}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="bg-surface-lowest rounded-[1.5rem] p-6 shadow-[0px_24px_48px_rgba(27,27,30,0.05)] ring-1 ring-outline-variant/10 space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">Account</p>
              <div className="mt-4 space-y-3 text-sm text-secondary">
                <div className="rounded-[1rem] bg-surface-container-low p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary">User ID</p>
                  <p className="mt-2 font-semibold text-on-surface">{userId}</p>
                </div>
                <div className="rounded-[1rem] bg-surface-container-low p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary">Role</p>
                  <p className="mt-2 font-semibold text-on-surface">{role}</p>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-6 py-3 bg-white border border-outline-variant/20 rounded-full font-semibold text-sm text-secondary hover:bg-surface-container-low transition-colors inline-flex items-center gap-2 w-fit"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Sign Out
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {isManager && (
            <div className="bg-surface-lowest rounded-[1.5rem] p-6 shadow-[0px_24px_48px_rgba(27,27,30,0.05)] ring-1 ring-outline-variant/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-secondary">Team Setup</p>
                  <p className="mt-2 text-sm text-secondary">Define who reports to whom. This is the main setup action managers should use here.</p>
                </div>
                {loading && <span className="text-xs font-semibold text-secondary">Loading…</span>}
              </div>

              <div className="mt-6 space-y-5">
                {managers.map((manager) => {
                  const reportIds = assignments.filter((assignment) => assignment.managerId === manager.userId).map((assignment) => assignment.memberId);
                  return (
                    <div key={manager.userId} className="rounded-[1.25rem] bg-surface-container-low p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-on-surface">{manager.fullName}</h3>
                          <p className="text-xs text-secondary">{manager.userId}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-secondary ring-1 ring-outline-variant/10">
                          {reportIds.length} assigned
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {contributors.map((member) => {
                          const assigned = reportIds.includes(member.userId);
                          return (
                            <button
                              key={member.userId}
                              onClick={() => void handleToggleAssignment(manager.userId, member.userId)}
                              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                                assigned
                                  ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                                  : 'bg-white text-secondary ring-1 ring-outline-variant/10'
                              }`}
                            >
                              {member.fullName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isManager && (
            <div className="bg-surface-lowest rounded-[1.5rem] p-6 shadow-[0px_24px_48px_rgba(27,27,30,0.05)] ring-1 ring-outline-variant/10">
              <button
                onClick={() => setShowAdvancedAdmin((current) => !current)}
                className="flex w-full items-center justify-between rounded-[1.25rem] bg-surface-container-low px-5 py-4 text-left ring-1 ring-outline-variant/10"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-secondary">Advanced Admin</p>
                  <p className="mt-2 text-sm text-secondary">User creation, role changes, deactivation, and password resets.</p>
                </div>
                <span className="material-symbols-outlined text-secondary">
                  {showAdvancedAdmin ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {showAdvancedAdmin && (
                <div className="mt-5 space-y-6">
                  <form onSubmit={handleCreateUser} className="rounded-[1.25rem] bg-surface-container-low p-5 space-y-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-secondary">Add User</p>
                      <p className="mt-2 text-sm text-secondary">Provision managers and contributors directly in this module.</p>
                    </div>
                    <input
                      value={createForm.userId}
                      onChange={(e) => setCreateForm((current) => ({ ...current, userId: e.target.value }))}
                      className="w-full bg-white rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="user-id"
                      required
                    />
                    <input
                      value={createForm.fullName}
                      onChange={(e) => setCreateForm((current) => ({ ...current, fullName: e.target.value }))}
                      className="w-full bg-white rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Full name"
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={createForm.role}
                        onChange={(e) => setCreateForm((current) => ({
                          ...current,
                          role: e.target.value as UserRole,
                          password: e.target.value === 'MANAGER' ? 'ManagerPass123!' : 'ContributorPass123!',
                        }))}
                        className="w-full bg-white rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="IC">Contributor</option>
                        <option value="MANAGER">Manager</option>
                      </select>
                      <input
                        value={createForm.password}
                        onChange={(e) => setCreateForm((current) => ({ ...current, password: e.target.value }))}
                        className="w-full bg-white rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Password"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-40 transition-all"
                    >
                      {creating ? 'Creating...' : 'Create User'}
                    </button>
                  </form>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-secondary">User Directory</p>
                    <div className="mt-5 space-y-3">
                      {users.map((candidate) => (
                        <div key={candidate.userId} className="rounded-[1.1rem] bg-surface-container-low p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-bold text-on-surface">{candidate.fullName}</p>
                            <p className="text-xs text-secondary">{candidate.userId} · {candidate.role}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => void handleUpdateUser(candidate, { role: candidate.role === 'MANAGER' ? 'IC' : 'MANAGER' })}
                              className="px-4 py-2 rounded-full bg-white text-xs font-bold text-secondary ring-1 ring-outline-variant/10"
                            >
                              Make {candidate.role === 'MANAGER' ? 'Contributor' : 'Manager'}
                            </button>
                            <button
                              onClick={() => void handleUpdateUser(candidate, { active: !candidate.active })}
                              className="px-4 py-2 rounded-full bg-white text-xs font-bold text-secondary ring-1 ring-outline-variant/10"
                            >
                              {candidate.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => void handleResetPassword(candidate)}
                              className="px-4 py-2 rounded-full bg-white text-xs font-bold text-secondary ring-1 ring-outline-variant/10"
                            >
                              Reset Password
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
