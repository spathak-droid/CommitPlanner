ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('NUDGE', 'REVIEW_APPROVED', 'REVIEW_FLAGGED', 'SYSTEM', 'PLAN_LOCKED', 'COMMENT'));
