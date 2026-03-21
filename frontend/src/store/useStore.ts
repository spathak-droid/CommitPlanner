import { create } from 'zustand';
import type { AuthResponse, RcdoTree, WeeklyPlanResponse, TeamPlanSummary, RcdoAlignmentResponse, UserRole } from '../types';
import * as api from '../services/api';
import { ApiError } from '../services/api';

const SESSION_KEY = 'weekly-commit-session';

interface SessionState {
  userId: string;
  fullName: string;
  role: UserRole;
  token: string;
}

function readSession(): SessionState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    if (!parsed.userId || !parsed.role || !parsed.fullName || !parsed.token) return null;
    return { userId: parsed.userId, fullName: parsed.fullName, role: parsed.role, token: parsed.token };
  } catch {
    return null;
  }
}

function writeSession(session: SessionState | null) {
  if (typeof window === 'undefined') return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

const savedSession = readSession();
if (savedSession?.token) {
  api.setAuthToken(savedSession.token);
}

interface AppState {
  // User context
  userId: string;
  fullName: string;
  role: UserRole;
  token: string;
  isAuthenticated: boolean;
  login: (auth: AuthResponse) => void;
  logout: () => void;

  // RCDO tree
  rcdoTree: RcdoTree[];
  loadingRcdo: boolean;
  fetchRcdo: () => Promise<void>;

  // Current plan
  currentPlan: WeeklyPlanResponse | null;
  loadingPlan: boolean;
  planError: string | null;
  fetchCurrentPlan: () => Promise<void>;
  createCurrentWeekPlan: () => Promise<void>;
  setPlan: (plan: WeeklyPlanResponse) => void;
  commitmentsActionTick: number;
  triggerCommitmentsAction: () => void;

  // Manager
  teamPlans: TeamPlanSummary[];
  rcdoAlignment: RcdoAlignmentResponse[];
  loadingTeam: boolean;
  fetchTeamData: (weekStart: string) => Promise<void>;

  // Toast
  toast: { message: string; type: 'success' | 'error' } | null;
  showToast: (message: string, type: 'success' | 'error') => void;
  clearToast: () => void;
}

function getMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0]!;
}

export const useStore = create<AppState>((set, get) => ({
  userId: savedSession?.userId ?? '',
  fullName: savedSession?.fullName ?? '',
  role: savedSession?.role ?? 'IC',
  token: savedSession?.token ?? '',
  isAuthenticated: Boolean(savedSession),
  login: (auth) => {
    const session = { userId: auth.userId, fullName: auth.fullName, role: auth.role, token: auth.token };
    api.setAuthToken(auth.token);
    writeSession(session);
    set({ ...session, isAuthenticated: true });
  },
  logout: () => {
    api.setAuthToken('');
    writeSession(null);
    set({
      userId: '',
      fullName: '',
      role: 'IC',
      token: '',
      isAuthenticated: false,
      currentPlan: null,
      planError: null,
      teamPlans: [],
      rcdoAlignment: [],
    });
  },

  rcdoTree: [],
  loadingRcdo: false,
  fetchRcdo: async () => {
    set({ loadingRcdo: true });
    try {
      const tree = await api.fetchRcdoTree();
      set({ rcdoTree: tree, loadingRcdo: false });
    } catch {
      set({ loadingRcdo: false });
      get().showToast('Failed to load RCDO hierarchy', 'error');
    }
  },

  currentPlan: null,
  loadingPlan: false,
  planError: null,
  commitmentsActionTick: 0,
  fetchCurrentPlan: async () => {
    set({ loadingPlan: true, planError: null });
    try {
      const plan = await api.fetchCurrentPlan();
      set({ currentPlan: plan, loadingPlan: false });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        set({ currentPlan: null, loadingPlan: false, planError: 'No plan for this week yet' });
        return;
      }
      const message = e instanceof Error ? e.message : 'Failed to load weekly plan';
      set({ currentPlan: null, loadingPlan: false, planError: message });
      get().showToast(message, 'error');
    }
  },
  createCurrentWeekPlan: async () => {
    set({ loadingPlan: true });
    try {
      const plan = await api.createPlan(getMonday());
      set({ currentPlan: plan, loadingPlan: false, planError: null });
      get().showToast('Weekly plan created', 'success');
    } catch (e) {
      set({ loadingPlan: false });
      get().showToast(e instanceof Error ? e.message : 'Failed to create plan', 'error');
    }
  },
  setPlan: (plan) => set({ currentPlan: plan }),
  triggerCommitmentsAction: () => set((state) => ({ commitmentsActionTick: state.commitmentsActionTick + 1 })),

  teamPlans: [],
  rcdoAlignment: [],
  loadingTeam: false,
  fetchTeamData: async (weekStart) => {
    set({ loadingTeam: true });
    try {
      const [plans, alignment] = await Promise.all([
        api.fetchTeamPlans(weekStart),
        api.fetchRcdoAlignment(weekStart),
      ]);
      set({ teamPlans: plans, rcdoAlignment: alignment, loadingTeam: false });
    } catch {
      set({ loadingTeam: false });
      get().showToast('Failed to load team data', 'error');
    }
  },

  toast: null,
  showToast: (message, type) => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000);
  },
  clearToast: () => set({ toast: null }),
}));
