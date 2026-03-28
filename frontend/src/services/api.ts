import type {
  AdminUserResponse,
  AuthResponse,
  ManagerAssignmentResponse,
  RcdoTree,
  WeeklyPlanResponse,
  CreateCommitRequest,
  ReconcileCommitRequest,
  TeamPlanSummary,
  RcdoAlignmentResponse,
  UserRole,
  OutcomeMatchResult,
  HoursEstimate,
  CommitSuggestionResponse,
  ReconciliationAssist,
  ReviewInsight,
  AlignmentSuggestion,
  WeeklyDigest,
  AiStatus,
  VelocityPoint,
  CompletionPoint,
  HoursAccuracyPoint,
  CarryForwardPoint,
  CoverageTrendPoint,
  CapacityEntry,
  CalendarEntry,
  CommentResponse,
  TemplateResponse,
} from '../types';

export type { TemplateResponse };

const rawApiUrl = (window as any).__API_URL__;
let BASE_URL = rawApiUrl && !rawApiUrl.includes('%%') ? rawApiUrl : 'http://localhost:8080/api';
let AUTH_TOKEN = '';

export class ApiError extends Error {
  status?: number;
  code?: 'NETWORK';

  constructor(message: string, options?: { status?: number; code?: 'NETWORK' }) {
    super(message);
    this.name = 'ApiError';
    this.status = options?.status;
    this.code = options?.code;
  }
}

export function setBaseUrl(url: string): void {
  BASE_URL = url;
}

export function setAuthToken(token: string): void {
  AUTH_TOKEN = token;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');
  if (AUTH_TOKEN) headers.set('Authorization', `Bearer ${AUTH_TOKEN}`);
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      credentials: 'include',
      headers,
      ...options,
    });
  } catch {
    throw new ApiError('Backend unavailable. Start the API and try again.', { code: 'NETWORK' });
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError((body as { error?: string }).error ?? `HTTP ${res.status}`, { status: res.status });
  }
  if (res.status === 204 || res.status === 201) {
    const contentLength = res.headers.get('content-length');
    if (contentLength === '0' || !contentLength) {
      const text = await res.text();
      if (!text) return undefined as T;
      return JSON.parse(text) as T;
    }
  }
  return res.json() as Promise<T>;
}

// RCDO
export const fetchRcdoTree = (): Promise<RcdoTree[]> => request('/rcdo/tree');

// Auth
export const login = (userId: string, password: string): Promise<AuthResponse> =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ userId, password }),
  });

export const fetchCurrentUser = (): Promise<AuthResponse> => request('/auth/me');

export async function logout(): Promise<void> {
  await request('/auth/logout', { method: 'POST' });
}

// Weekly Plans
export const createPlan = (weekStartDate: string): Promise<WeeklyPlanResponse> =>
  request('/weekly-plans', {
    method: 'POST',
    body: JSON.stringify({ weekStartDate }),
  });

export const fetchPlan = (planId: string): Promise<WeeklyPlanResponse> =>
  request(`/weekly-plans/${planId}`);

export const fetchCurrentPlan = (): Promise<WeeklyPlanResponse> =>
  request('/weekly-plans/current');

export const fetchUserPlans = (): Promise<WeeklyPlanResponse[]> =>
  request('/weekly-plans');

// Commits
export const addCommit = (planId: string, data: CreateCommitRequest): Promise<WeeklyPlanResponse> =>
  request(`/weekly-plans/${planId}/commits`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateCommit = (commitId: string, data: Partial<CreateCommitRequest>): Promise<WeeklyPlanResponse> =>
  request(`/commits/${commitId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteCommit = (commitId: string): Promise<void> =>
  request(`/commits/${commitId}`, { method: 'DELETE' });

export const reconcileCommit = (commitId: string, data: ReconcileCommitRequest): Promise<WeeklyPlanResponse> =>
  request(`/commits/${commitId}/reconcile`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// State Machine
export const transitionPlan = (planId: string, action: string): Promise<WeeklyPlanResponse> =>
  request(`/weekly-plans/${planId}/transition?action=${action}`, { method: 'POST' });

// Manager
export const fetchTeamPlans = (weekStart: string): Promise<TeamPlanSummary[]> =>
  request(`/manager/team-plans?weekStart=${weekStart}`);

export const fetchRcdoAlignment = (weekStart: string): Promise<RcdoAlignmentResponse[]> =>
  request(`/manager/rcdo-alignment?weekStart=${weekStart}`);

export const submitReview = (
  weeklyPlanId: string,
  status: 'APPROVED' | 'FLAGGED',
  feedback: string
): Promise<unknown> =>
  request('/manager/reviews', {
    method: 'POST',
    body: JSON.stringify({ weeklyPlanId, status, feedback }),
  });

// Admin
export const fetchAdminUsers = (): Promise<AdminUserResponse[]> => request('/admin/users');

export const fetchManagerAssignments = (): Promise<ManagerAssignmentResponse[]> => request('/admin/assignments');

export const createAdminUser = (data: { userId: string; fullName: string; role: UserRole; password: string }): Promise<AdminUserResponse> =>
  request('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateAdminUser = (userId: string, data: { fullName: string; role: UserRole; active: boolean }): Promise<AdminUserResponse> =>
  request(`/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const resetAdminPassword = (userId: string, password: string): Promise<void> =>
  request(`/admin/users/${encodeURIComponent(userId)}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  });

export const replaceManagerAssignments = (managerId: string, memberIds: string[]): Promise<void> =>
  request(`/admin/managers/${encodeURIComponent(managerId)}/assignments`, {
    method: 'PUT',
    body: JSON.stringify({ memberIds }),
  });

// RCDO admin
export const createRallyCry = (data: { name: string; description: string }): Promise<{ id: string }> =>
  request('/rally-cries', { method: 'POST', body: JSON.stringify(data) });

export const updateRallyCry = (id: string, data: { name: string; description: string }): Promise<{ id: string }> =>
  request(`/rally-cries/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteRallyCry = (id: string): Promise<void> =>
  request(`/rally-cries/${id}`, { method: 'DELETE' });

export const createDefiningObjective = (rallyCryId: string, data: { name: string; description: string }): Promise<{ id: string }> =>
  request(`/rally-cries/${rallyCryId}/defining-objectives`, { method: 'POST', body: JSON.stringify(data) });

export const updateDefiningObjective = (id: string, data: { name: string; description: string }): Promise<{ id: string }> =>
  request(`/defining-objectives/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteDefiningObjective = (id: string): Promise<void> =>
  request(`/defining-objectives/${id}`, { method: 'DELETE' });

export const createOutcome = (objectiveId: string, data: { name: string; description: string; measurableTarget: string }): Promise<{ id: string }> =>
  request(`/defining-objectives/${objectiveId}/outcomes`, { method: 'POST', body: JSON.stringify(data) });

export const updateOutcome = (id: string, data: { name: string; description: string; measurableTarget: string }): Promise<{ id: string }> =>
  request(`/outcomes/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteOutcome = (id: string): Promise<void> =>
  request(`/outcomes/${id}`, { method: 'DELETE' });

// Notifications
export interface NotificationItem {
  id: string;
  recipientUserId: string;
  senderUserId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const fetchNotifications = (): Promise<NotificationItem[]> => request('/notifications');

export const fetchUnreadCount = (): Promise<{ count: number }> => request('/notifications/unread-count');

export const markAllNotificationsRead = (): Promise<void> => request('/notifications/mark-all-read', { method: 'POST' });

export const markNotificationRead = (id: string): Promise<void> => request(`/notifications/${id}/mark-read`, { method: 'POST' });

export const sendNudge = (userIds: string[], weekLabel: string): Promise<{ message: string }> =>
  request('/notifications/nudge', { method: 'POST', body: JSON.stringify({ userIds, weekLabel }) });

export async function deleteNotification(id: string): Promise<void> {
  await request(`/notifications/${id}`, { method: 'DELETE' });
}

// AI
export const getAiStatus = (): Promise<AiStatus> => request('/ai/status');

export const matchOutcomes = (title: string, description?: string): Promise<OutcomeMatchResult[]> =>
  request('/ai/match-outcomes', {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  });

export const estimateHours = (title: string, description?: string, chessPriority?: string): Promise<HoursEstimate> =>
  request('/ai/estimate-hours', {
    method: 'POST',
    body: JSON.stringify({ title, description, chessPriority }),
  });

export const suggestCommit = (userInput: string): Promise<CommitSuggestionResponse> =>
  request('/ai/suggest-commit', {
    method: 'POST',
    body: JSON.stringify({ userInput }),
  });

export const getReconciliationAssist = (commitId: string): Promise<ReconciliationAssist> =>
  request(`/ai/reconciliation-assist/${commitId}`);

export const getReviewInsight = (planId: string): Promise<ReviewInsight> =>
  request(`/ai/review-insight/${planId}`);

export const getAlignmentSuggestions = (weekStart?: string): Promise<AlignmentSuggestion[]> =>
  request(`/ai/alignment-suggestions${weekStart ? `?weekStart=${weekStart}` : ''}`);

export const getWeeklyDigest = (weekStart: string): Promise<WeeklyDigest> =>
  request(`/ai/weekly-digest?weekStart=${weekStart}`);

// Analytics
export async function fetchVelocity(from: string, to: string): Promise<VelocityPoint[]> {
  return request(`/analytics/velocity?from=${from}&to=${to}`);
}
export async function fetchCompletion(from: string, to: string): Promise<CompletionPoint[]> {
  return request(`/analytics/completion?from=${from}&to=${to}`);
}
export async function fetchHoursAccuracy(from: string, to: string): Promise<HoursAccuracyPoint[]> {
  return request(`/analytics/hours-accuracy?from=${from}&to=${to}`);
}
export async function fetchCarryForwardRate(from: string, to: string): Promise<CarryForwardPoint[]> {
  return request(`/analytics/carry-forward-rate?from=${from}&to=${to}`);
}
export async function fetchRcdoCoverage(from: string, to: string): Promise<CoverageTrendPoint[]> {
  return request(`/analytics/rcdo-coverage?from=${from}&to=${to}`);
}
export async function fetchCapacity(weekStart: string): Promise<CapacityEntry[]> {
  return request(`/analytics/capacity?weekStart=${weekStart}`);
}
export async function fetchCalendar(from: string, to: string): Promise<CalendarEntry[]> {
  return request(`/weekly-plans/calendar?from=${from}&to=${to}`);
}
// Comments
export const fetchComments = (commitId: string): Promise<CommentResponse[]> =>
  request(`/commits/${commitId}/comments`);

export const addComment = (commitId: string, body: string, parentCommentId?: string): Promise<CommentResponse> =>
  request(`/commits/${commitId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body, parentCommentId: parentCommentId ?? null }),
  });

export const updateComment = (commentId: string, body: string): Promise<CommentResponse> =>
  request(`/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify({ body }),
  });

export const deleteCommentById = (commentId: string): Promise<void> =>
  request(`/comments/${commentId}`, { method: 'DELETE' });

// Templates
export const fetchTemplates = (): Promise<TemplateResponse[]> => request('/templates');

export const saveAsTemplate = (planId: string, name: string): Promise<TemplateResponse> =>
  request('/templates', {
    method: 'POST',
    body: JSON.stringify({ planId, name }),
  });

export const applyTemplate = (templateId: string, planId: string): Promise<unknown> =>
  request(`/templates/${templateId}/apply?planId=${planId}`, { method: 'POST' });

export const deleteTemplate = async (templateId: string): Promise<void> => {
  await request(`/templates/${templateId}`, { method: 'DELETE' });
};

// Export
export async function downloadExport(planId: string, format: 'csv' | 'pdf'): Promise<void> {
  const headers: Record<string, string> = {};
  if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  const res = await fetch(`${BASE_URL}/export/plan/${planId}?format=${format}`, {
    credentials: 'include',
    headers,
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plan.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
export async function downloadTeamExport(weekStart: string, format: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  const res = await fetch(`${BASE_URL}/export/team?weekStart=${weekStart}&format=${format}`, {
    credentials: 'include',
    headers,
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `team-${weekStart}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
