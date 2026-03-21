export type PlanStatus = 'DRAFT' | 'LOCKED' | 'RECONCILING' | 'RECONCILED' | 'CARRY_FORWARD';
export type ChessPriority = 'MUST_DO' | 'SHOULD_DO' | 'NICE_TO_DO';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'FLAGGED';
export type UserRole = 'IC' | 'MANAGER';

export interface AuthResponse {
  userId: string;
  fullName: string;
  role: UserRole;
  token: string;
  managedUserIds: string[];
}

export interface AdminUserResponse {
  userId: string;
  fullName: string;
  role: UserRole;
  active: boolean;
}

export interface ManagerAssignmentResponse {
  managerId: string;
  memberId: string;
}

export interface RcdoTree {
  id: string;
  name: string;
  description: string;
  definingObjectives: DefiningObjectiveNode[];
}

export interface DefiningObjectiveNode {
  id: string;
  name: string;
  description: string;
  outcomes: OutcomeNode[];
}

export interface OutcomeNode {
  id: string;
  name: string;
  description: string;
  measurableTarget: string;
}

export interface WeeklyPlanResponse {
  id: string;
  userId: string;
  weekStartDate: string;
  status: PlanStatus;
  reviewStatus: ReviewStatus | null;
  reviewFeedback: string | null;
  version: number;
  commits: CommitResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CommitResponse {
  id: string;
  title: string;
  description: string;
  chessPriority: ChessPriority;
  outcomeId: string;
  outcomeName: string;
  rallyCryName: string;
  definingObjectiveName: string;
  plannedHours: number | null;
  actualHours: number | null;
  completionPct: number | null;
  reconciliationNotes: string | null;
  carryForward: boolean;
  sortOrder: number;
}

export interface CreateCommitRequest {
  title: string;
  description: string;
  chessPriority: ChessPriority;
  outcomeId: string;
  plannedHours: number | null;
}

export interface ReconcileCommitRequest {
  actualHours: number;
  completionPct: number;
  reconciliationNotes: string;
  carryForward: boolean;
}

export interface TeamPlanSummary {
  planId: string | null;
  userId: string;
  fullName: string;
  weekStartDate: string;
  status: PlanStatus | null;
  hasPlan: boolean;
  totalCommits: number;
  mustDoCount: number;
  shouldDoCount: number;
  niceToDoCount: number;
  totalPlannedHours: number;
  totalActualHours: number;
  avgCompletionPct: number;
  reviewStatus: ReviewStatus | null;
}

export interface RcdoAlignmentResponse {
  rallyCryId: string;
  rallyCryName: string;
  objectives: ObjectiveAlignment[];
}

export interface ObjectiveAlignment {
  objectiveId: string;
  objectiveName: string;
  outcomes: OutcomeAlignment[];
}

export interface OutcomeAlignment {
  outcomeId: string;
  outcomeName: string;
  commitCount: number;
  commits: CommitSummary[];
}

export interface CommitSummary {
  commitId: string;
  title: string;
  userId: string;
  chessPriority: string;
  completionPct: number | null;
}

export interface AppProps {
  userId?: string;
  role?: UserRole;
  apiBaseUrl?: string;
  authToken?: string;
}
