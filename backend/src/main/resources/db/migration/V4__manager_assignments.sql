CREATE TABLE manager_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_id VARCHAR(255) NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
    member_id VARCHAR(255) NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
    UNIQUE (manager_id, member_id)
);

CREATE INDEX idx_manager_assignments_manager ON manager_assignments(manager_id);
CREATE INDEX idx_manager_assignments_member ON manager_assignments(member_id);

INSERT INTO manager_assignments (manager_id, member_id) VALUES
    ('manager-1', 'user-1'),
    ('director-ops', 'ic-design'),
    ('lead-product', 'ic-product');
