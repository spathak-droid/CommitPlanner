CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    feature VARCHAR(50) NOT NULL,
    accepted BOOLEAN,
    context_summary TEXT,
    response_summary TEXT,
    latency_ms INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX idx_ai_interactions_feature ON ai_interactions(feature);

ALTER TABLE weekly_commits
    ADD COLUMN ai_suggested_outcome BOOLEAN DEFAULT FALSE;
