CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id VARCHAR(255) NOT NULL,
    sender_user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'NUDGE'
        CHECK (type IN ('NUDGE', 'REVIEW_APPROVED', 'REVIEW_FLAGGED', 'SYSTEM')),
    title VARCHAR(500) NOT NULL,
    message TEXT,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id, read, created_at DESC);
