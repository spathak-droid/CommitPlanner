-- RCDO Hierarchy
CREATE TABLE rally_cries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE defining_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rally_cry_id UUID NOT NULL REFERENCES rally_cries(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    defining_objective_id UUID NOT NULL REFERENCES defining_objectives(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    measurable_target VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Weekly Planning
CREATE TABLE weekly_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    week_start_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'LOCKED', 'RECONCILING', 'RECONCILED', 'CARRY_FORWARD')),
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, week_start_date)
);

CREATE TABLE weekly_commits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_plan_id UUID NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    chess_priority VARCHAR(10) NOT NULL DEFAULT 'SHOULD_DO'
        CHECK (chess_priority IN ('MUST_DO', 'SHOULD_DO', 'NICE_TO_DO')),
    outcome_id UUID NOT NULL REFERENCES outcomes(id),
    planned_hours NUMERIC(5,2),
    actual_hours NUMERIC(5,2),
    completion_pct INTEGER CHECK (completion_pct >= 0 AND completion_pct <= 100),
    reconciliation_notes TEXT,
    carry_forward BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Manager Reviews
CREATE TABLE manager_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_plan_id UUID NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
    reviewer_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'FLAGGED')),
    feedback TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_weekly_plans_user_week ON weekly_plans(user_id, week_start_date);
CREATE INDEX idx_weekly_commits_plan ON weekly_commits(weekly_plan_id);
CREATE INDEX idx_defining_objectives_rally_cry ON defining_objectives(rally_cry_id);
CREATE INDEX idx_outcomes_defining_objective ON outcomes(defining_objective_id);
CREATE INDEX idx_manager_reviews_plan ON manager_reviews(weekly_plan_id);
