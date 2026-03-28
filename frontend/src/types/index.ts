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
  carriedFromWeek: string | null;
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

// AI Types
export interface OutcomeMatchResult {
  outcomeId: string;
  outcomeName: string;
  rallyCryName: string;
  definingObjectiveName: string;
  confidence: number;
  rationale: string;
}

export interface HoursEstimate {
  estimatedHours: number;
  lowRange: number;
  highRange: number;
  rationale: string;
}

export interface CommitSuggestionResponse {
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedPriority: string;
  suggestedOutcomeId: string;
  outcomeName: string;
  estimatedHours: number;
  rationale: string;
}

export interface ReconciliationAssist {
  suggestedCompletionPct: number;
  suggestedNotes: string;
  suggestCarryForward: boolean;
  rationale: string;
}

export interface ReviewInsight {
  patterns: string[];
  riskSignals: string[];
  suggestedFeedback: string;
  overallAssessment: string;
}

export interface AlignmentSuggestion {
  outcomeId: string;
  outcomeName: string;
  rallyCryName: string;
  reason: string;
  priority: number;
}

export interface WeeklyDigest {
  executiveSummary: string;
  highlights: string[];
  concerns: string[];
  suggestedTalkingPoints: string[];
}

export interface AiStatus {
  enabled: boolean;
  model: string | null;
}

// Analytics types
export interface VelocityPoint { weekStart: string; completedCount: number; totalCount: number; }
export interface CompletionPoint { weekStart: string; avgCompletionPct: number; }
export interface HoursAccuracyPoint { commitId: string; title: string; plannedHours: number; actualHours: number; }
export interface CarryForwardPoint { weekStart: string; carryForwardPct: number; }
export interface CoverageTrendPoint { weekStart: string; alignmentRatePct: number; }
export interface CapacityEntry { userId: string; fullName: string; totalPlannedHours: number; capacityHours: number; priorityBreakdown: Record<string, number>; }
export interface CalendarEntry { planId: string | null; weekStartDate: string; status: PlanStatus | null; commitCount: number; avgCompletionPct: number; }
