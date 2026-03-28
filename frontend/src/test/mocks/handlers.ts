import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:8080/api';

export const mockRcdoTree = [
  {
    id: 'rc-1',
    name: 'Rally Cry 1',
    description: 'First rally cry',
    definingObjectives: [
      {
        id: 'do-1',
        name: 'Objective 1',
        description: 'First objective',
        outcomes: [
          { id: 'out-1', name: 'Outcome 1', description: 'First outcome', measurableTarget: '100%' },
          { id: 'out-2', name: 'Outcome 2', description: 'Second outcome', measurableTarget: '50 users' },
        ],
      },
    ],
  },
];

export const mockPlan = {
  id: 'plan-1',
  userId: 'ic1',
  weekStartDate: '2026-03-23',
  status: 'DRAFT',
  reviewStatus: null,
  reviewFeedback: null,
  version: 0,
  commits: [
    {
      id: 'commit-1',
      title: 'Build login page',
      description: 'Implement login UI',
      chessPriority: 'MUST_DO',
      outcomeId: 'out-1',
      outcomeName: 'Outcome 1',
      rallyCryName: 'Rally Cry 1',
      definingObjectiveName: 'Objective 1',
      plannedHours: 4,
      actualHours: null,
      completionPct: null,
      reconciliationNotes: null,
      carryForward: false,
      sortOrder: 0,
    },
  ],
  createdAt: '2026-03-23T10:00:00',
  updatedAt: '2026-03-23T10:00:00',
};

export const mockTeamPlans = [
  {
    planId: 'plan-1',
    userId: 'ic1',
    fullName: 'IC User 1',
    weekStartDate: '2026-03-23',
    status: 'LOCKED',
    hasPlan: true,
    totalCommits: 3,
    mustDoCount: 1,
    shouldDoCount: 1,
    niceToDoCount: 1,
    totalPlannedHours: 10,
    totalActualHours: 0,
    avgCompletionPct: 0,
    reviewStatus: null,
  },
];

export const mockAlignment = [
  {
    rallyCryId: 'rc-1',
    rallyCryName: 'Rally Cry 1',
    objectives: [
      {
        objectiveId: 'do-1',
        objectiveName: 'Objective 1',
        outcomes: [
          {
            outcomeId: 'out-1',
            outcomeName: 'Outcome 1',
            commitCount: 1,
            commits: [
              {
                commitId: 'commit-1',
                title: 'Build login page',
                userId: 'ic1',
                chessPriority: 'MUST_DO',
                completionPct: null,
              },
            ],
          },
        ],
      },
    ],
  },
];

export const handlers = [
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({
      userId: 'ic1',
      fullName: 'IC User 1',
      role: 'IC',
      token: 'mock-jwt-token',
      managedUserIds: [],
    })
  ),
  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json({
      userId: 'ic1',
      fullName: 'IC User 1',
      role: 'IC',
      token: 'mock-jwt-token',
      managedUserIds: [],
    })
  ),
  http.get(`${BASE}/rcdo/tree`, () => HttpResponse.json(mockRcdoTree)),
  http.get(`${BASE}/weekly-plans/current`, () => HttpResponse.json(mockPlan)),
  http.get(`${BASE}/weekly-plans/:id`, () => HttpResponse.json(mockPlan)),
  http.get(`${BASE}/weekly-plans`, () => HttpResponse.json([mockPlan])),
  http.post(`${BASE}/weekly-plans`, () => HttpResponse.json(mockPlan)),
  http.post(`${BASE}/weekly-plans/:planId/commits`, () => HttpResponse.json(mockPlan)),
  http.post(`${BASE}/weekly-plans/:planId/transition`, () =>
    HttpResponse.json({ ...mockPlan, status: 'LOCKED' })
  ),
  http.put(`${BASE}/commits/:id`, () => HttpResponse.json(mockPlan)),
  http.delete(`${BASE}/commits/:id`, () => new HttpResponse(null, { status: 204 })),
  http.put(`${BASE}/commits/:id/reconcile`, () => HttpResponse.json(mockPlan)),
  http.get(`${BASE}/manager/team-plans`, () => HttpResponse.json(mockTeamPlans)),
  http.get(`${BASE}/manager/rcdo-alignment`, () => HttpResponse.json(mockAlignment)),
  http.post(`${BASE}/manager/reviews`, () => HttpResponse.json({ id: 'review-1' })),
  http.get(`${BASE}/notifications`, () => HttpResponse.json([])),
  http.get(`${BASE}/notifications/unread-count`, () => HttpResponse.json({ count: 0 })),
  http.delete(`${BASE}/notifications/:id`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${BASE}/ai/status`, () => HttpResponse.json({ enabled: false, model: null })),
  http.post(`${BASE}/auth/logout`, () => new HttpResponse(null, { status: 200 })),
  // Comments
  http.get(`${BASE}/commits/:commitId/comments`, () => HttpResponse.json([])),
  http.post(`${BASE}/commits/:commitId/comments`, () =>
    HttpResponse.json({
      id: 'comment-1',
      commitId: 'commit-1',
      authorUserId: 'ic1',
      authorName: 'IC User 1',
      body: 'test',
      parentCommentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  ),
  http.delete(`${BASE}/comments/:id`, () => new HttpResponse(null, { status: 204 })),
];
